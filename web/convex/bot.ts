import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Puerta A — recepción del mensaje entrante de WhatsApp.
//
// Aquí solo va la mutation transaccional: deduplica, resuelve el usuario,
// guarda el mensaje y agenda el trabajo pesado. La llamada al modelo vive
// en botLlm.ts (archivo con "use node" por el SDK de Anthropic), que Convex
// no deja mezclar con mutations en el mismo archivo.

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

    await ctx.scheduler.runAfter(0, internal.botLlm.procesarMensaje, {
      userId,
      phone: args.phone,
      texto: args.body,
      buttonId: args.buttonId,
    });
  },
});
