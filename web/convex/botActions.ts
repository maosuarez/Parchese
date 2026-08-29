"use node";

import Anthropic from "@anthropic-ai/sdk";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

// El cerebro del canal: convierte "uy me provoca caminar por el norte esta
// tarde" en { activity, zone, windowStart, windowEnd }.
//
// Modelo: MiniMax por su endpoint compatible con Anthropic. Mismo SDK, solo
// cambia la URL base. Si mañana hay que cambiar de proveedor, se toca solo
// `cliente()` y el nombre del modelo.
//
// Vive en su propio archivo con "use node" porque el SDK de Anthropic usa
// APIs de Node (fs/path) que no corren en el runtime por defecto de Convex,
// y ese runtime exige que un archivo "use node" solo tenga actions.

const MODELO = process.env.MINIMAX_MODEL ?? "MiniMax-M2.5";

function cliente() {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) throw new Error("Falta MINIMAX_API_KEY en el entorno de Convex.");
  return new Anthropic({ apiKey, baseURL: "https://api.minimax.io/anthropic" });
}

const ACTIVIDADES = [
  "caminar",
  "cafe",
  "cowork",
  "juego",
  "cancha",
  "otro",
] as const;

/**
 * Instrucciones fijas. Nada variable aquí — ni la hora, ni el teléfono, ni
 * el nombre. Si se cuela algo que cambia entre llamadas, se invalida el
 * caché de prompt en cada mensaje y se paga todo completo cada vez.
 */
const SYSTEM = `Eres el asistente de PulseUp, que ayuda a la gente en Bogotá a encontrar CON QUIÉN hacer un plan hoy.

## Qué te hace distinto (esto define cómo respondes)

Cualquier chatbot puede listar bares y parques de Bogotá. Tú no haces eso.
Tú sabes algo que ningún otro asistente sabe: QUIÉN MÁS quiere hacer lo mismo,
cerca, en este momento. Esa es la única razón por la que alguien te escribe.

Reglas que salen de ahí, y no se rompen:
- NUNCA recomiendes lugares, bares, restaurantes ni eventos de tu conocimiento
  general. No eres un buscador. Si no está en la base de datos, no existe.
- Responde con GENTE, no con sitios. "Hay 3 personas que quieren lo mismo por
  Chapinero entre 7 y 9" vale más que cualquier lista de lugares.
- Si no hay nadie todavía, dilo derecho y ofrece avisar. Eso es una promesa
  cumplible, no un fracaso. Nunca rellenes con recomendaciones genéricas para
  parecer útil.
- No inventes cuánta gente hay. Ese número lo pone el sistema, no tú.

## Tu trabajo

Lee lo que la persona escribe y llama a la herramienta registrar_intencion con
lo que entendiste.

Actividades posibles:
- caminar: caminata, salir a andar, trote suave, sacar el perro
- cafe: tomar café, desayunar, almorzar, charlar en un café
- cowork: trabajar acompañado, estudiar junto a alguien, cowork en silencio
- juego: juegos de mesa, cartas, ajedrez, videojuegos presenciales
- cancha: fútbol, básquet, tenis, pádel, cualquier deporte de cancha
- otro: cualquier plan que no encaje arriba

Zonas de Bogotá: chapinero, usaquen, suba, teusaquillo, centro, chico, cedritos, kennedy, engativa, fontibon, candelaria, chapinero_alto, salitre, modelia, galerias, norte, sur, occidente.
Normaliza sin tildes y en minúscula. Referencias comunes:
- "la 93", "zona T", "zona rosa", "parque de la 93" → chico
- "corferias", "salitre", "el campin", "simon bolivar" → salitre
- "la candelaria", "centro historico" → candelaria
- "el norte" → norte · "el sur" → sur · "usaquen", "la 116" → usaquen
- "galerias", "la 53" → galerias

Reglas de extracción — LEE ESTO CON CUIDADO:
- Rescata SIEMPRE lo que sí entendiste. Nunca descartes todo por un dato faltante.
- En "missing" pon SOLO lo que la persona no dijo ni se puede inferir: "activity", "zone" o "time".
- Si dice algo genérico como "algo activo", "deportivo", "quemar energía" → activity es cancha.
  "Algo tranquilo", "relajado", "charlar" → cafe. "Salir a andar", "tomar aire" → caminar.
- Si nombra un lugar o barrio, deduce la zona. Solo pon "zone" en missing si no dijo NADA de ubicación.
- Si dice "hoy" sin hora, eso NO alcanza: pon "time" en missing.
- Si no dice duración, asume 2 horas. Eso nunca va en missing.
- Si dice "ahora" o "ya", hoursFromNow es 0. "Más tarde" o "esta tarde" es 3. "En la noche" es 5.
- Nunca menciones salud, sedentarismo, ejercicio como obligación, ni sugieras que la persona debería moverse o salir más. Ni una palabra sobre eso.
- Escribe en español de Colombia, cercano y breve. Sin emojis en exceso.`;

/** Llama al modelo y decide: registrar la intención o preguntar con botones. */
export const procesarMensaje = internalAction({
  args: {
    userId: v.id("users"),
    phone: v.string(),
    texto: v.string(),
    buttonId: v.optional(v.string()),
  },
  handler: async (ctx, { userId, phone, texto, buttonId }) => {
    let extraida: Extraida | null = null;

    // El historial reciente es lo que evita el bucle: si la persona ya dijo
    // "algo deportivo" y ahora responde "esta tarde", el modelo ve las dos
    // cosas y arma la intención completa.
    const historial = await ctx.runQuery(internal.bot.mensajesRecientes, {
      phone,
    });

    try {
      extraida = await extraerIntencion(historial, texto, buttonId);
    } catch (error) {
      console.error("[bot] falló la extracción:", error);
      await ctx.runAction(internal.whatsapp.enviarTexto, {
        phone,
        texto: "Se me enredó algo por acá. ¿Me lo escribes otra vez?",
      });
      return;
    }

    // Si el modelo no devolvió nada utilizable, arrancamos por la actividad.
    if (!extraida) {
      await ctx.runAction(internal.whatsapp.enviarBotones, PREGUNTA_ACTIVIDAD(phone));
      return;
    }

    // Preguntar SOLO lo que falta. Volver a preguntar algo que la persona ya
    // dijo es la forma más rápida de que abandone la conversación.
    if (extraida.missing.includes("activity")) {
      await ctx.runAction(internal.whatsapp.enviarBotones, PREGUNTA_ACTIVIDAD(phone));
      return;
    }

    if (extraida.missing.includes("time")) {
      await ctx.runAction(internal.whatsapp.enviarBotones, {
        phone,
        texto: `Listo, ${frase(extraida.activity)}. ¿Para cuándo?`,
        botones: [
          { id: "hora:0", titulo: "Ahora" },
          { id: "hora:3", titulo: "Esta tarde" },
          { id: "hora:5", titulo: "En la noche" },
        ],
      });
      return;
    }

    if (extraida.missing.includes("zone")) {
      await ctx.runAction(internal.whatsapp.enviarTexto, {
        phone,
        texto: `¿Por qué zona te queda bien? (barrio o punto de referencia)`,
      });
      return;
    }

    const windowStart = Date.now() + extraida.hoursFromNow * 3_600_000;
    const windowEnd = windowStart + extraida.durationHours * 3_600_000;

    const { planId } = await ctx.runMutation(
      internal.matching.registrarIntencionDeWhatsapp,
      {
        userId,
        activity: extraida.activity,
        zone: extraida.zone,
        windowStart,
        windowEnd,
      },
    );

    // Si hubo match, el núcleo ya agendó el aviso — no duplicar aquí.
    if (planId) return;

    // Sin match todavía. La respuesta tiene que sonar a promesa cumplible,
    // no a fracaso: es lo que sostiene que la persona vuelva a escribir.
    //
    // OJO: aquí NO se puede decir cuánta gente más quiere lo mismo. Un
    // contador de intenciones abiertas revela que alguien declaró algo, y
    // eso viola la invisibilidad igual que exponer la fila entera. La señal
    // social sale de los PLANES (que son públicos), nunca de las intenciones.
    await ctx.runAction(internal.whatsapp.enviarTexto, {
      phone,
      texto:
        `Anoté que quieres ${frase(extraida.activity)} por ${extraida.zone}. ` +
        `Apenas alguien coincida con tu horario, te escribo.`,
    });
  },
});

function PREGUNTA_ACTIVIDAD(phone: string) {
  return {
    phone,
    texto: "¿Qué te provoca hacer hoy?",
    botones: [
      { id: "act:cancha", titulo: "Algo deportivo" },
      { id: "act:cafe", titulo: "Un café" },
      { id: "act:caminar", titulo: "Caminar" },
    ],
  };
}

type Extraida = {
  activity: (typeof ACTIVIDADES)[number];
  zone: string;
  hoursFromNow: number;
  durationHours: number;
  missing: Array<"activity" | "zone" | "time">;
};

/**
 * Usa tool calling en vez de salida estructurada nativa: es lo que el
 * endpoint compatible de MiniMax soporta con seguridad, y funciona igual
 * en cualquier proveedor si toca cambiar.
 */
async function extraerIntencion(
  historial: Array<{ direction: "in" | "out"; body: string }>,
  texto: string,
  buttonId?: string,
): Promise<Extraida | null> {
  const pista = buttonId ? `\n\n(La persona pulsó el botón: ${buttonId})` : "";

  const mensajes = [
    ...historial.map((m) => ({
      role: (m.direction === "in" ? "user" : "assistant") as "user" | "assistant",
      content: m.body,
    })),
    { role: "user" as const, content: texto + pista },
  ];

  const response = await cliente().messages.create({
    model: MODELO,
    max_tokens: 1024,
    system: SYSTEM,
    tools: [
      {
        name: "registrar_intencion",
        description:
          "Registra lo que la persona quiere hacer. Llama SIEMPRE a esta herramienta, aunque falten datos: rescata lo que entendiste y lista lo que falta en missing.",
        input_schema: {
          type: "object",
          properties: {
            activity: { type: "string", enum: [...ACTIVIDADES] },
            zone: { type: "string" },
            hoursFromNow: { type: "number" },
            durationHours: { type: "number" },
            missing: {
              type: "array",
              items: { type: "string", enum: ["activity", "zone", "time"] },
              description:
                "Solo los datos que la persona NO dijo y no se pueden inferir.",
            },
          },
          required: [
            "activity",
            "zone",
            "hoursFromNow",
            "durationHours",
            "missing",
          ],
        },
      },
    ],
    tool_choice: { type: "tool", name: "registrar_intencion" },
    messages: mensajes,
  });

  const bloque = response.content.find((b) => b.type === "tool_use");
  if (!bloque || bloque.type !== "tool_use") return null;

  // El input viene como objeto ya parseado; validamos a mano porque un
  // modelo puede devolver algo fuera del enum aunque el schema lo prohíba.
  const raw = bloque.input as Record<string, unknown>;
  const act = String(raw.activity ?? "");
  if (!ACTIVIDADES.includes(act as (typeof ACTIVIDADES)[number])) return null;

  const horas = Number(raw.hoursFromNow);
  const duracion = Number(raw.durationHours);

  return {
    activity: act as (typeof ACTIVIDADES)[number],
    zone: String(raw.zone ?? "").toLowerCase().trim() || "centro",
    hoursFromNow: Number.isFinite(horas) ? Math.max(0, Math.min(horas, 12)) : 0,
    durationHours: Number.isFinite(duracion)
      ? Math.max(1, Math.min(duracion, 6))
      : 2,
    missing: Array.isArray(raw.missing)
      ? (raw.missing.filter((m: unknown) =>
          ["activity", "zone", "time"].includes(String(m)),
        ) as Array<"activity" | "zone" | "time">)
      : [],
  };
}

function frase(a: (typeof ACTIVIDADES)[number]): string {
  const frases: Record<string, string> = {
    caminar: "caminar",
    cafe: "tomarte un café",
    cowork: "trabajar acompañado",
    juego: "jugar algo",
    cancha: "jugar en cancha",
    otro: "hacer un plan",
  };
  return frases[a] ?? "hacer un plan";
}
