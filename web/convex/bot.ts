import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { activity } from "./schema";

/** Guarda el mensaje entrante y agenda el trabajo pesado. Llamado por el webhook. */
export const recibirMensaje = internalMutation({
  args: {
    phone: v.string(),
    body: v.string(),
    waMessageId: v.string(),
    buttonId: v.optional(v.string()),
    idempotencyKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Kapso reintenta si no respondemos a tiempo. Sin esto, un reintento
    // crea la intención dos veces.
    const yaVisto = await ctx.db
      .query("messages")
      .withIndex("by_wa_id", (q) => q.eq("waMessageId", args.waMessageId))
      .first();
    if (yaVisto) return;

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

    await ctx.db.insert("messages", {
      userId,
      phone: args.phone,
      direction: "in",
      body: args.body,
      waMessageId: args.waMessageId,
    });

    await ctx.scheduler.runAfter(0, internal.botActions.procesarMensaje, {
      userId,
      phone: args.phone,
      texto: args.body,
      buttonId: args.buttonId,
    });
  },
});

/**
 * Los últimos mensajes de la conversación, para dar contexto al modelo.
 *
 * Sin esto el bot pregunta en bucle: la persona dice "algo deportivo",
 * responde "esta tarde", y el modelo no relaciona las dos frases.
 *
 * Solo la última hora: una conversación de ayer no es contexto útil, es ruido.
 */
export const mensajesRecientes = internalQuery({
  args: { phone: v.string() },
  handler: async (ctx, { phone }) => {
    const corte = Date.now() - 3_600_000;
    const mensajes = await ctx.db
      .query("messages")
      .withIndex("by_phone", (q) => q.eq("phone", phone))
      .order("desc")
      .take(10);

    return mensajes
      .filter((m) => m._creationTime > corte)
      .reverse()
      .slice(0, -1) // el último es el que se está procesando ahora
      .map((m) => ({ direction: m.direction, body: m.body }));
  },
});

export { activity };
