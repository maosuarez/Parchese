import { v } from "convex/values";
import { internalQuery, query } from "./_generated/server";
import { activity } from "./schema";
import type { Doc } from "./_generated/dataModel";

// Consulta de planes — la puerta B, y lo que el bot responde cuando alguien
// pregunta "¿qué hay por hacer?".
//
// Esto es lo que nos separa de ChatGPT: no recomendamos lugares de un
// conocimiento general, devolvemos planes reales que existen en la ciudad,
// con cuánta gente va. La señal social sale de aquí, no de las intenciones.

/** Un plan con lo que hace falta para decidir si vale la pena ir. */
export type PlanVisible = {
  title: string;
  activity: Doc<"plans">["activity"];
  zone: string;
  startsAt: number;
  durationMinutes: number;
  cuantosVan: number;
  cupo: number | null;
  venue: string | null;
};

async function conAsistencia(
  ctx: { db: any },
  planes: Doc<"plans">[],
): Promise<PlanVisible[]> {
  const salida: PlanVisible[] = [];

  for (const p of planes) {
    const asistencias = await ctx.db
      .query("attendance")
      .withIndex("by_plan", (q: any) => q.eq("planId", p._id))
      .collect();

    const venue = p.venueId ? await ctx.db.get(p.venueId) : null;

    salida.push({
      title: p.title,
      activity: p.activity,
      zone: p.zone,
      startsAt: p.startsAt,
      durationMinutes: p.durationMinutes,
      cuantosVan: asistencias.filter(
        (a: Doc<"attendance">) => a.status !== "noShow",
      ).length,
      cupo: p.capacity ?? null,
      venue: venue?.name ?? null,
    });
  }
  return salida;
}

/**
 * Planes próximos, opcionalmente filtrados por zona y actividad.
 *
 * Solo devuelve planes que ya empezaron a existir para el usuario: activos y
 * con hora futura. Un plan de ayer en la parrilla es peor que una parrilla
 * vacía — se ve abandonada.
 */
export const proximos = query({
  args: {
    zone: v.optional(v.string()),
    activity: v.optional(activity),
    limite: v.optional(v.number()),
  },
  handler: async (ctx, { zone, activity: act, limite }) => {
    const ahora = Date.now();

    let planes = await ctx.db
      .query("plans")
      .withIndex("by_time", (q) => q.gt("startsAt", ahora))
      .order("asc")
      .take(60);

    planes = planes.filter((p) => p.status === "active" || p.status === "pending");
    if (zone) planes = planes.filter((p) => p.zone === zone);
    if (act) planes = planes.filter((p) => p.activity === act);

    return conAsistencia(ctx, planes.slice(0, limite ?? 10));
  },
});

/** La versión que consulta el bot. Misma lógica, callable desde una action. */
export const buscarParaBot = internalQuery({
  args: {
    zone: v.optional(v.string()),
    activity: v.optional(activity),
  },
  handler: async (ctx, { zone, activity: act }) => {
    const ahora = Date.now();

    let planes = await ctx.db
      .query("plans")
      .withIndex("by_time", (q) => q.gt("startsAt", ahora))
      .order("asc")
      .take(60);

    planes = planes.filter((p) => p.status === "active" || p.status === "pending");

    // Si la zona pedida no tiene nada, no devolvemos vacío de una: mejor
    // mostrar lo de la ciudad que dejar a la persona sin nada que hacer.
    const enZona = zone ? planes.filter((p) => p.zone === zone) : planes;
    const base = enZona.length > 0 ? enZona : planes;

    const filtrados = act ? base.filter((p) => p.activity === act) : base;
    const finales = filtrados.length > 0 ? filtrados : base;

    return {
      enLaZonaPedida: zone ? enZona.length > 0 : true,
      planes: await conAsistencia(ctx, finales.slice(0, 5)),
    };
  },
});
