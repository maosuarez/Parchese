// Chatea con el bot sin desplegar nada.
//
//   MINIMAX_API_KEY=tu_key node scripts/chat.mjs
//
// Simula el flujo completo: extrae la intención, la guarda en memoria y
// hace match contra las intenciones que ya escribiste. Sirve para sentir
// el producto y para afinar el system prompt sin tocar Convex ni WhatsApp.

import Anthropic from "@anthropic-ai/sdk";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

const client = new Anthropic({
  apiKey: process.env.MINIMAX_API_KEY,
  baseURL: "https://api.minimax.io/anthropic",
});

const MODELO = process.env.MINIMAX_MODEL ?? "MiniMax-M2.5";
const ACTIVIDADES = ["caminar", "correr", "bici", "cafe", "cowork", "juego", "cancha", "otro"];

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
- caminar: caminata, salir a andar, sacar el perro, tomar aire
- correr: trotar, running, salir a correr, entrenar para una carrera
- bici: montar bicicleta, ciclovía, rodada, salir en cicla
- cafe: tomar café, desayunar, almorzar, charlar en un café
- cowork: trabajar acompañado, estudiar junto a alguien, cowork en silencio
- juego: juegos de mesa, cartas, ajedrez, videojuegos presenciales
- cancha: fútbol, básquet, tenis, pádel, cualquier deporte de cancha
- otro: cualquier plan que no encaje arriba

Zonas de Bogotá: chapinero, usaquen, suba, teusaquillo, centro, chico, cedritos, kennedy, engativa, fontibon, candelaria, chapinero_alto, salitre, modelia, galerias, norte, sur, occidente.
Normaliza sin tildes y en minúscula. Referencias comunes:
- "la 93", "zona T", "zona rosa", "parque de la 93" → chico
- "corferias", "gran estacion", "salitre", "el campin", "simon bolivar" → salitre
- "la candelaria", "centro historico" → candelaria
- "el norte" → norte · "el sur" → sur · "usaquen", "la 116" → usaquen
- "galerias", "la 53" → galerias

Reglas de extracción — LEE ESTO CON CUIDADO:
- Rescata SIEMPRE lo que sí entendiste. Nunca descartes todo por un dato faltante.
- En "missing" pon SOLO lo que la persona no dijo ni se puede inferir: "activity", "zone" o "time".
- Si dice algo genérico como "algo activo", "deportivo", "quemar energía" → activity es cancha.
  "Algo tranquilo", "relajado", "charlar" → cafe. "Salir a andar", "tomar aire" → caminar.
- ZONA: si la persona NO nombró ningún lugar, barrio, punto de referencia ni
  dirección, pon "zone" en missing y deja zone en "". NUNCA elijas una zona
  por tu cuenta ni pongas una "por defecto". Un plan en la zona equivocada es
  peor que no tener plan.
  Si nombra un lugar, dedúcelo. "Ciclovía" sola NO es una zona: la ciclovía
  cruza toda la ciudad.
- Si dice "hoy" sin hora, eso NO alcanza: pon "time" en missing.
- Si no dice duración, asume 2 horas. Eso nunca va en missing.
- hoursFromNow son horas desde AHORA, y puede pasar de 24 para días futuros.
  "ahora"/"ya" → 0 · "más tarde"/"esta tarde" → 3 · "en la noche" → 5
  "mañana en la mañana" → las horas que falten hasta mañana 9am
  "el domingo a las 10am" → las horas que falten hasta ese domingo 10am
  Si nombra un día de la semana, calcula cuántas horas faltan. No lo pongas
  en missing solo porque es lejano.
- Nunca menciones salud, sedentarismo, ejercicio como obligación, ni sugieras que la persona debería moverse o salir más. Ni una palabra sobre eso.
- Escribe en español de Colombia, cercano y breve. Sin emojis en exceso.`;

const TOOL = {
  name: "registrar_intencion",
  description:
    "Registra lo que la persona quiere hacer. Llama SIEMPRE a esta herramienta, aunque falten datos: rescata lo que entendiste y lista lo que falta en missing.",
  input_schema: {
    type: "object",
    properties: {
      activity: { type: "string", enum: ACTIVIDADES },
      zone: { type: "string" },
      hoursFromNow: { type: "number" },
      durationHours: { type: "number" },
      missing: {
        type: "array",
        items: { type: "string", enum: ["activity", "zone", "time"] },
        description: "Solo los datos que la persona NO dijo y no se pueden inferir.",
      },
    },
    required: ["activity", "zone", "hoursFromNow", "durationHours", "missing"],
  },
};

/** Intenciones abiertas, en memoria. Hace las veces de la tabla `intents`. */
const abiertas = [];
let quienSoy = "tu";

const solapan = (a, b) =>
  a.windowStart < b.windowEnd && b.windowStart < a.windowEnd;

const historial = [];

async function extraer(texto) {
  const res = await client.messages.create({
    model: MODELO,
    max_tokens: 1024,
    system: SYSTEM,
    tools: [TOOL],
    tool_choice: { type: "tool", name: "registrar_intencion" },
    messages: [...historial, { role: "user", content: texto }],
  });
  const b = res.content.find((x) => x.type === "tool_use");
  return b ? b.input : null; // MiniMax a veces ignora tool_choice — ver docs
}

const guion = process.argv.slice(2);
const rl = guion.length
  ? null
  : readline.createInterface({ input: stdin, output: stdout });
let paso = 0;

async function preguntar(prompt) {
  if (!rl) {
    if (paso >= guion.length) return "/salir";
    const linea = guion[paso++];
    console.log(`${prompt}${linea}`);
    return linea;
  }
  return rl.question(prompt);
}

console.log(`
  PulseUp · chat local          modelo: ${MODELO}

  Escribe como si le hablaras al bot por WhatsApp.
  Comandos:  /yo <nombre>   cambiar de persona (para probar el match)
             /abiertas      ver las intenciones sin emparejar
             /salir
`);

while (true) {
  const texto = (await preguntar(`${quienSoy} › `)).trim();
  if (!texto) continue;

  if (texto === "/salir") break;
  if (texto.startsWith("/yo ")) {
    quienSoy = texto.slice(4).trim() || "tu";
    console.log(`   ahora eres ${quienSoy}\n`);
    continue;
  }
  if (texto === "/abiertas") {
    if (abiertas.length === 0) console.log("   (ninguna)\n");
    for (const i of abiertas) {
      console.log(`   ${i.autor}: ${i.activity} · ${i.zone}`);
    }
    console.log();
    continue;
  }

  let i;
  try {
    i = await extraer(texto);
  } catch (e) {
    console.log(`   💥 ${e.message}\n`);
    continue;
  }

  historial.push({ role: "user", content: texto });

  const falta = i?.missing ?? ["activity"];

  if (!i || falta.includes("activity")) {
    const r = "¿Qué te provoca hacer hoy?";
    console.log(`   bot › ${r}`);
    console.log(`         [ Algo deportivo ]  [ Un café ]  [ Caminar ]\n`);
    historial.push({ role: "assistant", content: r });
    continue;
  }

  if (falta.includes("time")) {
    const r = `Listo, ${i.activity}. ¿Para cuándo?`;
    console.log(`   bot › ${r}`);
    console.log(`         [ Ahora ]  [ Esta tarde ]  [ En la noche ]\n`);
    historial.push({ role: "assistant", content: r });
    continue;
  }

  if (falta.includes("zone")) {
    const r = "¿Por qué zona te queda bien?";
    console.log(`   bot › ${r}\n`);
    historial.push({ role: "assistant", content: r });
    continue;
  }

  const windowStart = Date.now() + i.hoursFromNow * 3_600_000;
  const nueva = {
    autor: quienSoy,
    activity: i.activity,
    zone: i.zone,
    windowStart,
    windowEnd: windowStart + i.durationHours * 3_600_000,
  };

  const otra = abiertas.find(
    (c) =>
      c.autor !== nueva.autor &&
      c.activity === nueva.activity &&
      c.zone === nueva.zone &&
      solapan(c, nueva),
  );

  if (otra) {
    abiertas.splice(abiertas.indexOf(otra), 1);
    const hora = new Date(
      Math.max(nueva.windowStart, otra.windowStart),
    ).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
    console.log(`   ✨ MATCH con ${otra.autor}`);
    console.log(
      `   bot › Hay plan: ${i.activity} en ${i.zone}, a las ${hora}. Van 2 personas.\n`,
    );
  } else {
    abiertas.push(nueva);
    console.log(
      `   bot › Listo, anoté ${i.activity} por ${i.zone}. Si alguien más se apunta, te aviso.`,
    );
    console.log(`         (${abiertas.length} intención(es) abierta(s))\n`);
  }
}

rl?.close();
