import { v } from "convex/values";
import { internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

// Notificación de un match.
//
// Va en action porque necesita red (WhatsApp). Ojo: las actions NO reintentan
// solas y tienen 10 minutos de timeout — si el envío falla, se maneja aquí.
//
// Dev A: reemplaza el console.log por el envío real cuando el canal esté listo.

export const datosDelPlan = internalQuery({
  args: { planId: v.id("plans") },
  handler: async (ctx, { planId }) => {
    const plan = await ctx.db.get(planId);
    if (!plan) return null;

    const asistencias = await ctx.db
      .query("attendance")
      .withIndex("by_plan", (q) => q.eq("planId", planId))
      .collect();

    const telefonos: string[] = [];
    for (const a of asistencias) {
      const user = await ctx.db.get(a.userId);
      if (user) telefonos.push(user.phone);
    }

    return { plan, telefonos, cuantosVan: asistencias.length };
  },
});

export const avisarMatch = internalAction({
  args: { planId: v.id("plans") },
  handler: async (ctx, { planId }) => {
    const datos = await ctx.runQuery(internal.notify.datosDelPlan, { planId });
    if (!datos) return;

    const { plan, telefonos, cuantosVan } = datos;
    const hora = new Date(plan.startsAt).toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Mostrar cuántos van no es adorno: es lo que ataca el liking gap, la
    // barrera real del producto. Ver docs/01-definicion-producto.md.
    const texto =
      `Hay plan: ${plan.title} en ${plan.zone}, a las ${hora}. ` +
      `Van ${cuantosVan} personas y dura ${plan.durationMinutes} minutos.`;

    for (const telefono of telefonos) {
      // TODO(Dev A): enviar por WhatsApp — ver docs/frentes/dev-a-canal-whatsapp.md
      console.log(`[avisarMatch] → ${telefono}: ${texto}`);
    }
  },
});
