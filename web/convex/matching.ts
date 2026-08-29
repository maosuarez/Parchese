import { v } from "convex/values";
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { activity } from "./schema";
import type { Doc, Id } from "./_generated/dataModel";

// Match de intenciones — el núcleo.
// Spec: openspec/changes/match-de-intenciones/specs/matching/spec.md

/**
 * Dos ventanas se solapan si una empieza antes de que la otra termine, en
 * ambos sentidos. Adyacentes (una termina justo cuando la otra empieza) NO
 * se solapan — es el bug clásico de esta función.
 */
export function solapan(
  a: { windowStart: number; windowEnd: number },
  b: { windowStart: number; windowEnd: number },
): boolean {
  return a.windowStart < b.windowEnd && b.windowStart < a.windowEnd;
}

/**
 * Registra una intención y trata de emparejarla de inmediato.
 *
 * Va en mutation, no en action: es transaccional y reintenta sola, así que
 * dos intenciones no pueden emparejarse dos veces por una carrera. No hace
 * red — la notificación se agenda hacia una action.
 */
async function registrarYEmparejar(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    activity: Doc<"intents">["activity"];
    zone: string;
    windowStart: number;
    windowEnd: number;
    source: "whatsapp" | "web";
  },
): Promise<{ intentId: Id<"intents">; planId: Id<"plans"> | null }> {
  if (args.windowEnd <= args.windowStart) {
    throw new Error("El fin de la ventana debe ser posterior al inicio.");
  }

  const intentId = await ctx.db.insert("intents", {
    ...args,
    status: "open",
  });

  // Candidatas: abiertas, misma actividad, misma zona. El solapamiento se
  // filtra en memoria — el volumen por combinación es bajo.
  const candidatas = await ctx.db
    .query("intents")
    .withIndex("by_open", (q) =>
      q.eq("status", "open").eq("activity", args.activity).eq("zone", args.zone),
    )
    .collect();

  const compatibles = candidatas
    .filter((c) => c._id !== intentId)
    .filter((c) => c.userId !== args.userId) // nunca consigo mismo
    .filter((c) => solapan(c, args))
    .sort((a, b) => a._creationTime - b._creationTime); // gana la más antigua

  const otra = compatibles[0];
  if (!otra) {
    // Sin coincidencia: queda open y NO se manda nada.
    return { intentId, planId: null };
  }

  // El plan arranca cuando ambas ventanas ya están abiertas.
  const startsAt = Math.max(args.windowStart, otra.windowStart);

  const planId = await ctx.db.insert("plans", {
    title: tituloDe(args.activity),
    activity: args.activity,
    zone: args.zone,
    startsAt,
    durationMinutes: 60,
    minPeople: 2,
    requiredTrustLevel: 1,
    origin: "matched",
  });

  await ctx.db.patch(intentId, { status: "matched", planId });
  await ctx.db.patch(otra._id, { status: "matched", planId });

  for (const userId of [args.userId, otra.userId]) {
    await ctx.db.insert("attendance", { userId, planId, status: "going" });
  }

  // Agendar desde una mutation es atómico: si la transacción falla, esto no
  // se dispara. La notificación necesita red, así que va en una action.
  await ctx.scheduler.runAfter(0, internal.notify.avisarMatch, { planId });

  return { intentId, planId };
}

function tituloDe(a: Doc<"intents">["activity"]): string {
  const titulos: Record<string, string> = {
    caminar: "Caminata",
    cafe: "Café",
    cowork: "Cowork en silencio",
    juego: "Juego de mesa",
    cancha: "Cancha",
    otro: "Plan",
  };
  return titulos[a] ?? "Plan";
}

/** Entrada desde la web ("yo voy" / declarar intención). */
export const declararIntencion = mutation({
  args: {
    userId: v.id("users"),
    activity: activity,
    zone: v.string(),
    windowStart: v.number(),
    windowEnd: v.number(),
  },
  handler: async (ctx, args) =>
    registrarYEmparejar(ctx, { ...args, source: "web" }),
});

/** Entrada desde el bot. La llama Dev A después de extraer la intención. */
export const registrarIntencionDeWhatsapp = internalMutation({
  args: {
    userId: v.id("users"),
    activity: activity,
    zone: v.string(),
    windowStart: v.number(),
    windowEnd: v.number(),
  },
  handler: async (ctx, args) =>
    registrarYEmparejar(ctx, { ...args, source: "whatsapp" }),
});

/**
 * Siembra manual — para probar el match sin WhatsApp, sin LLM y sin frontend.
 * Es además el plan B del demo si la red falla en vivo.
 */
export const sembrarIntencion = internalMutation({
  args: {
    phone: v.string(),
    activity: activity,
    zone: v.string(),
    enHoras: v.number(),
    duraHoras: v.number(),
  },
  handler: async (ctx, args) => {
    let user = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .unique();

    const userId =
      user?._id ??
      (await ctx.db.insert("users", {
        phone: args.phone,
        trustLevel: 1,
        score: 0,
      }));

    const windowStart = Date.now() + args.enHoras * 3_600_000;
    return registrarYEmparejar(ctx, {
      userId,
      activity: args.activity,
      zone: args.zone,
      windowStart,
      windowEnd: windowStart + args.duraHoras * 3_600_000,
      source: "web",
    });
  },
});

/**
 * Vence las intenciones cuya ventana ya pasó.
 *
 * NO manda ningún mensaje. Es decisión de producto, no un olvido: avisar que
 * nadie coincidió convierte la ausencia de match en un rechazo visible, que
 * es justo lo que esta funcionalidad existe para evitar.
 */
export const vencerIntenciones = internalMutation({
  args: {},
  handler: async (ctx) => {
    const ahora = Date.now();
    const abiertas = await ctx.db
      .query("intents")
      .filter((q) => q.eq(q.field("status"), "open"))
      .collect();

    let vencidas = 0;
    for (const intent of abiertas) {
      if (intent.windowEnd <= ahora) {
        await ctx.db.patch(intent._id, { status: "expired" });
        vencidas++;
      }
    }
    return { vencidas };
  },
});

/**
 * Las intenciones propias del usuario.
 *
 * Es la ÚNICA query que puede leer intenciones, y siempre filtrada por autor.
 * No agregues aquí (ni en ningún lado) un contador de "cuánta gente quiere
 * caminar hoy": un agregado también permite inferir que alguien declaró algo,
 * y eso viola la invisibilidad igual que exponer la fila entera.
 */
export const misIntenciones = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) =>
    ctx.db
      .query("intents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20),
});

export const cancelarIntencion = mutation({
  args: { userId: v.id("users"), intentId: v.id("intents") },
  handler: async (ctx, { userId, intentId }) => {
    const intent = await ctx.db.get(intentId);
    if (!intent || intent.userId !== userId) {
      throw new Error("No existe esa intención.");
    }
    if (intent.status !== "open") {
      throw new Error("Solo se puede cancelar una intención abierta.");
    }
    await ctx.db.patch(intentId, { status: "expired" });
  },
});
