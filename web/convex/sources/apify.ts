import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  internalQuery,
  type MutationCtx,
} from "../_generated/server";
import { internal } from "../_generated/api";
import { activity } from "../schema";
import type { Id } from "../_generated/dataModel";

// Ingesta del índice de la ciudad desde Apify — la parte transaccional.
// Spec: openspec/changes/ingesta-apify-eventos/specs/apify-ingest/spec.md
//
// Este archivo NO lleva "use node": la llamada al LLM vive en
// sources/normalize.ts (que sí lo lleva, por el SDK de Anthropic). Aquí solo
// van la mutación de ingesta, la acción de descarga (fetch basta, sin node) y
// las mutaciones/consultas que el normalizador usa para escribir en la base.

const CANAL = v.union(v.literal("oferta"), v.literal("demanda"));

/**
 * Persiste un lote de items crudos de Apify.
 *
 * - Oferta (Luma, Eventbrite, Maps, páginas web) → tabla `sources` en
 *   `status: "pending"`, deduplicado por `externalId` con el índice
 *   `by_external`. Un evento repetido en corridas consecutivas del Actor no
 *   se re-inserta.
 * - Demanda (comentarios y menciones de redes) → tabla `demandSignals`, sin
 *   mezclar jamás con `sources`.
 *
 * Al terminar, si entró oferta nueva, agenda la normalización.
 */
export const ingestarLoteApify = internalMutation({
  args: {
    platform: v.string(),
    canal: CANAL,
    items: v.array(v.any()),
  },
  handler: async (ctx, { platform, canal, items }) => {
    let insertadas = 0;
    let duplicadas = 0;
    let demanda = 0;

    for (const item of items) {
      if (typeof item !== "object" || item === null) continue;
      const registro = item as Record<string, unknown>;

      if (canal === "demanda") {
        const text = textoDe(registro);
        if (!text) continue;
        if (await demandSignalRepetido(ctx, platform, text)) {
          duplicadas++;
          continue;
        }
        await ctx.db.insert("demandSignals", {
          platform,
          text,
          capturedAt: Date.now(),
        });
        demanda++;
        continue;
      }

      const externalId = externalIdDe(platform, registro);
      if (externalId) {
        const previo = await ctx.db
          .query("sources")
          .withIndex("by_external", (q) => q.eq("externalId", externalId))
          .first();
        if (previo) {
          duplicadas++;
          continue;
        }
      }
      await ctx.db.insert("sources", {
        platform,
        externalId,
        rawPayload: JSON.stringify(item),
        status: "pending",
      });
      insertadas++;
    }

    if (insertadas > 0) {
      await ctx.scheduler.runAfter(
        0,
        internal.sources.normalize.normalizarFuentesPendientes,
        {},
      );
    }

    return { insertadas, duplicadas, demanda };
  },
});

/** Identificador estable del item, con la plataforma de prefijo. */
function externalIdDe(
  platform: string,
  item: Record<string, unknown>,
): string | undefined {
  const claves = ["id", "uid", "eventId", "url", "link", "eventUrl", "permalink"];
  for (const clave of claves) {
    const valor = item[clave];
    if (typeof valor === "string" && valor.trim()) {
      return `${platform}:${valor.trim()}`;
    }
    if (typeof valor === "number") {
      return `${platform}:${valor}`;
    }
  }
  return undefined;
}

/** Texto de una señal de demanda social. */
function textoDe(item: Record<string, unknown>): string {
  const claves = ["text", "caption", "comment", "message", "body", "title"];
  for (const clave of claves) {
    const valor = item[clave];
    if (typeof valor === "string" && valor.trim()) return valor.trim();
  }
  return "";
}

/**
 * Dedup best-effort de demanda: `demandSignals` no tiene índice por texto, así
 * que se revisa una ventana acotada de los más recientes. Suficiente para
 * evitar que un reintento del webhook duplique el mismo comentario.
 */
async function demandSignalRepetido(
  ctx: MutationCtx,
  platform: string,
  text: string,
): Promise<boolean> {
  const recientes = await ctx.db.query("demandSignals").order("desc").take(200);
  return recientes.some((d) => d.platform === platform && d.text === text);
}

/**
 * Descarga los items de un dataset de Apify y los ingesta por lotes.
 *
 * Se usa cuando el webhook trae `resource.defaultDatasetId` en vez del lote
 * directo (design.md, decisión 2), para no chocar con el tope de 20MB de la
 * httpAction ni con los límites de argumentos de una función agendada.
 */
export const descargarDataset = internalAction({
  args: {
    platform: v.string(),
    canal: CANAL,
    datasetId: v.string(),
  },
  handler: async (ctx, { platform, canal, datasetId }) => {
    const url = `https://api.apify.com/v2/datasets/${datasetId}/items?format=json&clean=true`;
    const headers: Record<string, string> = {};
    const token = process.env.APIFY_API_TOKEN;
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.error(
        `[apify] dataset ${datasetId}: ${res.status} ${await res.text()}`,
      );
      return { descargados: 0 };
    }

    const cuerpo: unknown = await res.json();
    const items = Array.isArray(cuerpo) ? cuerpo : [];

    // Lotes de 100 para quedar bajo el límite de bytes de argumentos de una
    // mutación agendada.
    const TAM = 100;
    for (let i = 0; i < items.length; i += TAM) {
      const _r: { insertadas: number; duplicadas: number; demanda: number } =
        await ctx.runMutation(internal.sources.apify.ingestarLoteApify, {
          platform,
          canal,
          items: items.slice(i, i + TAM),
        });
      void _r;
    }

    return { descargados: items.length };
  },
});

/** Fuentes en `status: "pending"` que el normalizador debe procesar. */
export const listarFuentesPendientes = internalQuery({
  args: { limite: v.number() },
  handler: async (ctx, { limite }) => {
    const filas = await ctx.db
      .query("sources")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .take(limite);
    return filas.map((f) => ({
      _id: f._id,
      platform: f.platform,
      rawPayload: f.rawPayload,
    }));
  },
});

/**
 * Crea el plan sembrado a partir de una fuente ya interpretada por el LLM.
 *
 * Última compuerta de las reglas de producto:
 *  - `startsAt` debe ser futuro; si no, la fuente se descarta sin crear plan.
 *  - El venue se crea o vincula SIEMPRE con `isPublic: true` — nunca casa de
 *    nadie, en ningún nivel.
 *  - El plan nace con `origin: "seeded"`, `requiredTrustLevel: 0` (evento
 *    masivo de ciudad) y un `qrToken` criptográfico para el check-in físico.
 */
export const guardarPlanNormalizado = internalMutation({
  args: {
    sourceId: v.id("sources"),
    title: v.string(),
    activity: activity,
    zone: v.string(),
    startsAt: v.number(),
    durationMinutes: v.number(),
    minPeople: v.number(),
    venueName: v.string(),
    address: v.string(),
    sourceUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.sourceId);
    if (!source || source.status !== "pending") return null;

    if (!Number.isFinite(args.startsAt) || args.startsAt <= Date.now()) {
      await ctx.db.patch(args.sourceId, { status: "discarded" });
      return null;
    }

    const venueId = await vincularOCrearVenue(
      ctx,
      args.venueName,
      args.address,
      args.zone,
    );

    const planId = await ctx.db.insert("plans", {
      title: args.title,
      activity: args.activity,
      zone: args.zone,
      venueId,
      startsAt: args.startsAt,
      durationMinutes: Math.max(15, Math.round(args.durationMinutes) || 120),
      minPeople: Math.max(3, Math.round(args.minPeople) || 3),
      requiredTrustLevel: 0,
      origin: "seeded",
      sourceUrl: args.sourceUrl,
      qrToken: crypto.randomUUID(),
      status: "active",
      activatedAt: Date.now(),
    });

    await ctx.db.patch(args.sourceId, { status: "normalized", planId });
    return planId;
  },
});

/** Vincula a un venue existente de la misma zona y nombre, o crea uno público. */
async function vincularOCrearVenue(
  ctx: MutationCtx,
  name: string,
  address: string,
  zone: string,
): Promise<Id<"venues">> {
  const nombre = name.trim() || "Lugar por confirmar";
  const enZona = await ctx.db
    .query("venues")
    .withIndex("by_zone", (q) => q.eq("zone", zone))
    .take(100);
  const existente = enZona.find(
    (v_) => v_.name.toLowerCase() === nombre.toLowerCase(),
  );
  if (existente) return existente._id;
  return ctx.db.insert("venues", {
    name: nombre,
    address: address.trim() || "Bogotá",
    zone,
    isPublic: true,
  });
}

/** Marca una fuente como descartada sin crear ningún plan. */
export const descartarFuente = internalMutation({
  args: { sourceId: v.id("sources"), motivo: v.optional(v.string()) },
  handler: async (ctx, { sourceId, motivo }) => {
    const source = await ctx.db.get(sourceId);
    if (!source || source.status !== "pending") return;
    if (motivo) console.log(`[apify] fuente descartada: ${motivo}`);
    await ctx.db.patch(sourceId, { status: "discarded" });
  },
});

/**
 * Vuelca el estado de la siembra por Apify: conteo por estado de `sources` y
 * los últimos planes sembrados con su venue. Solo para verificación manual y
 * el script de prueba end-to-end.
 */
export const inspeccionarSiembraApify = internalQuery({
  args: {},
  handler: async (ctx) => {
    const estados = ["pending", "normalized", "discarded"] as const;
    const conteo: Record<string, number> = {};
    for (const estado of estados) {
      const filas = await ctx.db
        .query("sources")
        .withIndex("by_status", (q) => q.eq("status", estado))
        .take(500);
      conteo[estado] = filas.length;
    }

    const planes = await ctx.db
      .query("plans")
      .withIndex("by_time")
      .order("desc")
      .take(50);
    const sembrados = [];
    for (const plan of planes) {
      if (plan.origin !== "seeded") continue;
      const venue = plan.venueId ? await ctx.db.get(plan.venueId) : null;
      sembrados.push({
        title: plan.title,
        activity: plan.activity,
        zone: plan.zone,
        startsAt: plan.startsAt,
        futuro: plan.startsAt > Date.now(),
        status: plan.status,
        venue: venue ? { name: venue.name, isPublic: venue.isPublic } : null,
      });
    }

    return { sources: conteo, planesSembrados: sembrados.slice(0, 20) };
  },
});
