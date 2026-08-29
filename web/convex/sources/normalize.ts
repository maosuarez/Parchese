"use node";

import Anthropic from "@anthropic-ai/sdk";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

// Normalización asíncrona del índice: convierte una fuente cruda de Apify en
// un plan sembrado de Parchese.
// Spec: openspec/changes/ingesta-apify-eventos/specs/apify-ingest/spec.md
//
// Igual que botActions.ts, este archivo lleva "use node" por el SDK de Anthropic,
// así que solo puede exportar acciones. Las escrituras a la base viven en
// sources/apify.ts (runtime por defecto): guardarPlanNormalizado y
// descartarFuente.
//
// Modelo: MiniMax por su endpoint compatible con Anthropic — mismo SDK que el
// bot, solo cambia la URL base.

const MODELO = process.env.MINIMAX_MODEL ?? "MiniMax-M2.5";
const LOTE = 10; // fuentes por corrida

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

const ZONAS = [
  "chapinero",
  "usaquen",
  "suba",
  "teusaquillo",
  "centro",
  "chico",
  "cedritos",
  "kennedy",
  "engativa",
  "fontibon",
  "candelaria",
  "norte",
  "sur",
  "occidente",
] as const;

const SYSTEM = `Eres el normalizador del índice de planes de Parchese en Bogotá.

Recibes el contenido crudo de un evento raspado de la web (Luma, Eventbrite, Google Places, una página cualquiera). Tu trabajo es llamar a la herramienta estructurar_plan con lo que se pueda extraer.

Actividades posibles (elige una):
- caminar: caminatas, recorridos a pie, avistamiento, trote suave
- cafe: catas, charlas en café, tertulias, brunch, gastronomía
- cowork: trabajar o estudiar acompañado, sesiones de coworking
- juego: juegos de mesa, cartas, ajedrez, trivias, videojuegos presenciales
- cancha: fútbol, básquet, tenis, pádel, running en grupo, deporte de cancha
- otro: cultura, música, mercados, talleres, cualquier plan que no encaje arriba

Zonas de Bogotá: chapinero, usaquen, suba, teusaquillo, centro, chico, cedritos, kennedy, engativa, fontibon, candelaria, norte, sur, occidente. Normaliza sin tildes y en minúscula. "La 93" o "zona T" es chico. Si el evento no es en Bogotá, pon esBogota en false.

Reglas:
- Si el contenido no describe un evento real con lugar y fecha, pon valido en false.
- startsAtISO: fecha y hora de inicio en formato ISO 8601 con zona horaria de Bogotá (-05:00). Si no hay hora, usa las 18:00. Si no hay fecha, pon valido en false.
- esPublico: true solo si el lugar es un espacio público verificable (parque, café, biblioteca, centro cultural, cancha, plaza). Si es una dirección residencial o un lugar privado, pon esPublico en false.
- minPeople: aforo mínimo razonable para que el plan tenga sentido; si no sabes, 3.
- Nunca menciones salud, sedentarismo ni que alguien deba moverse o salir más.`;

type Estructurada = {
  valido: boolean;
  esBogota: boolean;
  esPublico: boolean;
  title: string;
  activity: (typeof ACTIVIDADES)[number];
  zone: string;
  startsAtISO: string;
  durationMinutes: number;
  minPeople: number;
  venueName: string;
  address: string;
};

/**
 * Procesa un lote de fuentes en `status: "pending"`: filtra en seco lo que
 * claramente no sirve, pide al modelo la estructura del resto y aplica
 * validación determinista antes de crear el plan.
 */
export const normalizarFuentesPendientes = internalAction({
  args: {},
  handler: async (
    ctx,
  ): Promise<{ procesados: number; creados: number; descartados: number }> => {
    // Tipos explícitos: sources/apify.ts y este archivo se referencian en
    // ciclo (uno agenda al otro), y sin anotación tsc infiere `any`.
    const pendientes: Array<{
      _id: Id<"sources">;
      platform: string;
      rawPayload: string;
    }> = await ctx.runQuery(internal.sources.apify.listarFuentesPendientes, {
      limite: LOTE,
    });

    let creados = 0;
    let descartados = 0;

    for (const fuente of pendientes) {
      const item = parsearPayload(fuente.rawPayload);

      // Filtro determinista previo: sin nada parecido a título o fecha, ni
      // gastamos tokens.
      if (!item || (!tieneTexto(item) && !tieneFecha(item))) {
        await ctx.runMutation(internal.sources.apify.descartarFuente, {
          sourceId: fuente._id,
          motivo: "payload sin título ni fecha",
        });
        descartados++;
        continue;
      }

      let e: Estructurada | null = null;
      try {
        e = await estructurar(fuente.rawPayload);
      } catch (error) {
        console.error("[normalize] falló la extracción:", error);
        // No se descarta: queda pending para el próximo intento.
        continue;
      }

      if (!e || !e.valido || !e.esBogota || !e.esPublico) {
        await ctx.runMutation(internal.sources.apify.descartarFuente, {
          sourceId: fuente._id,
          motivo: "el modelo no lo reconoció como plan público en Bogotá",
        });
        descartados++;
        continue;
      }

      const startsAt = fechaFutura(e.startsAtISO);
      const zone = normalizarZona(e.zone);

      const planId: Id<"plans"> | null = await ctx.runMutation(
        internal.sources.apify.guardarPlanNormalizado,
        {
          sourceId: fuente._id,
          title: e.title.trim().slice(0, 120) || "Plan en Bogotá",
          activity: ACTIVIDADES.includes(e.activity) ? e.activity : "otro",
          zone,
          startsAt,
          durationMinutes: e.durationMinutes,
          minPeople: e.minPeople,
          venueName: e.venueName,
          address: e.address,
          sourceUrl: urlDe(item),
        },
      );

      if (planId) creados++;
      else descartados++;
    }

    return { procesados: pendientes.length, creados, descartados };
  },
});

/** Llama al modelo con tool calling — igual patrón que el bot. */
async function estructurar(rawPayload: string): Promise<Estructurada | null> {
  const response = await cliente().messages.create({
    model: MODELO,
    max_tokens: 1024,
    system: SYSTEM,
    tools: [
      {
        name: "estructurar_plan",
        description:
          "Estructura un evento crudo en un plan de Parchese. Llama siempre a esta herramienta, incluso si el evento no es válido (con valido en false).",
        input_schema: {
          type: "object",
          properties: {
            valido: { type: "boolean" },
            esBogota: { type: "boolean" },
            esPublico: { type: "boolean" },
            title: { type: "string" },
            activity: { type: "string", enum: [...ACTIVIDADES] },
            zone: { type: "string" },
            startsAtISO: { type: "string" },
            durationMinutes: { type: "number" },
            minPeople: { type: "number" },
            venueName: { type: "string" },
            address: { type: "string" },
          },
          required: [
            "valido",
            "esBogota",
            "esPublico",
            "title",
            "activity",
            "zone",
            "startsAtISO",
            "durationMinutes",
            "minPeople",
            "venueName",
            "address",
          ],
        },
      },
    ],
    tool_choice: { type: "tool", name: "estructurar_plan" },
    messages: [
      {
        role: "user",
        content: `Contenido crudo del evento:\n\n${rawPayload.slice(0, 6000)}`,
      },
    ],
  });

  const bloque = response.content.find((b) => b.type === "tool_use");
  if (!bloque || bloque.type !== "tool_use") return null;

  const raw = bloque.input as Record<string, unknown>;
  const act = String(raw.activity ?? "otro");

  return {
    valido: raw.valido === true,
    esBogota: raw.esBogota === true,
    esPublico: raw.esPublico === true,
    title: String(raw.title ?? ""),
    activity: ACTIVIDADES.includes(act as (typeof ACTIVIDADES)[number])
      ? (act as (typeof ACTIVIDADES)[number])
      : "otro",
    zone: String(raw.zone ?? ""),
    startsAtISO: String(raw.startsAtISO ?? ""),
    durationMinutes: Number(raw.durationMinutes),
    minPeople: Number(raw.minPeople),
    venueName: String(raw.venueName ?? ""),
    address: String(raw.address ?? ""),
  };
}

function parsearPayload(raw: string): Record<string, unknown> | null {
  try {
    const p = JSON.parse(raw);
    return typeof p === "object" && p !== null
      ? (p as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function tieneTexto(item: Record<string, unknown>): boolean {
  for (const clave of ["title", "name", "text", "description", "summary"]) {
    const valor = item[clave];
    if (typeof valor === "string" && valor.trim().length > 3) return true;
  }
  return false;
}

function tieneFecha(item: Record<string, unknown>): boolean {
  for (const clave of [
    "startDate",
    "startsAt",
    "start",
    "date",
    "datetime",
    "startAt",
    "when",
  ]) {
    if (typeof item[clave] === "string" && (item[clave] as string).trim()) {
      return true;
    }
  }
  return false;
}

function urlDe(item: Record<string, unknown>): string | undefined {
  for (const clave of ["url", "link", "eventUrl", "permalink"]) {
    const valor = item[clave];
    if (typeof valor === "string" && valor.trim()) return valor.trim();
  }
  return undefined;
}

/** Parsea la fecha del modelo; si es inválida o pasada, la próxima jornada. */
function fechaFutura(iso: string): number {
  const t = Date.parse(iso);
  const ahora = Date.now();
  if (Number.isFinite(t) && t > ahora) return t;
  return ahora + 24 * 3_600_000;
}

/** Lleva la zona a las oficiales de Bogotá; si no encaja, centro. */
function normalizarZona(zona: string): string {
  const limpia = zona
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  if (ZONAS.includes(limpia as (typeof ZONAS)[number])) return limpia;
  if (limpia.includes("93") || limpia.includes("zona t")) return "chico";
  return "centro";
}
