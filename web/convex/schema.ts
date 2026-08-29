import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// PulseUp — el contrato compartido entre los tres frentes.
//
// Este archivo se define entre los tres en la primera hora y después se
// congela. Si necesitas cambiarlo, dilo en voz alta: un cambio silencioso
// a media tarde es lo que rompe el día.
//
// Fuente de verdad: docs/03-modelo-de-datos.md

/** Lo que la gente quiere hacer. Cerrado a propósito: el LLM elige de esta lista. */
export const activity = v.union(
  v.literal("caminar"),
  v.literal("cafe"),
  v.literal("cowork"),
  v.literal("juego"),
  v.literal("cancha"),
  v.literal("otro"),
);

/**
 * Qué tan movido es el plan — NO el estado de la persona.
 * Medir la energía del usuario tiene evidencia experimental de backfire.
 * Ver los no-gos en docs/01-definicion-producto.md.
 */
export const intensity = v.union(
  v.literal("tranquilo"),
  v.literal("medio"),
  v.literal("movido"),
);

/** 0: eventos masivos · 1: público con mínimo 3 · 2: planes pequeños, requiere historial */
export const trustLevel = v.union(v.literal(0), v.literal(1), v.literal(2));

export default defineSchema({
  users: defineTable({
    phone: v.string(), // verificado — es la identidad base
    name: v.optional(v.string()),
    zone: v.optional(v.string()), // zona aproximada, nunca coordenada exacta
    trustLevel: trustLevel,
    score: v.number(), // cumplimiento, no sociabilidad
    // Redes y contacto. Solo se revela por opt-in, por match, después del encuentro.
    extendedProfile: v.optional(
      v.object({
        instagram: v.optional(v.string()),
        note: v.optional(v.string()),
      }),
    ),
    // Gustos declarados. Ordenan qué planes se muestran; NUNCA con quién se empareja.
    tastes: v.optional(v.array(v.string())),
  })
    .index("by_phone", ["phone"]),

  /**
   * El corazón del sistema. Las dos puertas (WhatsApp y web) escriben aquí.
   *
   * REGLA QUE NO SE ROMPE: mientras status sea "open", esta fila no se revela
   * a nadie más que su autor — ni por query, ni por el bot, ni por un contador
   * agregado. Es la invisibilidad del rechazo, y es el mecanismo central del
   * producto, no un detalle de privacidad.
   */
  intents: defineTable({
    userId: v.id("users"),
    activity: activity,
    zone: v.string(),
    windowStart: v.number(), // ms
    windowEnd: v.number(), // ms — la ventana de 2 a 4 horas
    status: v.union(
      v.literal("open"),
      v.literal("matched"),
      v.literal("expired"),
    ),
    source: v.union(v.literal("whatsapp"), v.literal("web")),
    planId: v.optional(v.id("plans")),
  })
    // El match consulta por aquí y filtra el solapamiento en memoria.
    .index("by_open", ["status", "activity", "zone"])
    .index("by_user", ["userId", "status"]),

  /** Un plan concreto: sembrado del índice, publicado por un organizador, o nacido de un match. */
  plans: defineTable({
    title: v.string(),
    activity: activity,
    intensity: v.optional(intensity),
    zone: v.string(),
    venueId: v.optional(v.id("venues")),
    startsAt: v.number(),
    durationMinutes: v.number(),
    capacity: v.optional(v.number()),
    minPeople: v.number(), // 3 en planes de nivel 1
    requiredTrustLevel: trustLevel,
    origin: v.union(
      v.literal("seeded"),
      v.literal("organizer"),
      v.literal("matched"),
    ),
    organizerId: v.optional(v.id("organizers")),
    sourceUrl: v.optional(v.string()), // si vino del índice, de dónde
  })
    .index("by_time", ["startsAt", "zone"])
    .index("by_visible", ["requiredTrustLevel", "startsAt"]),

  /** Lo que alimenta la escalera de confianza. */
  attendance: defineTable({
    userId: v.id("users"),
    planId: v.id("plans"),
    status: v.union(
      v.literal("going"),
      v.literal("confirmed"),
      v.literal("showed"), // SOLO por escaneo de QR, nunca autoreportado
      v.literal("noShow"),
    ),
    checkedInAt: v.optional(v.number()),
  })
    .index("by_user", ["userId", "status"])
    .index("by_plan", ["planId"]),

  /** Producto del escaneo en el plan. El opt-in es independiente por cada lado. */
  matches: defineTable({
    planId: v.id("plans"),
    userA: v.id("users"),
    userB: v.id("users"),
    revealedByA: v.boolean(),
    revealedByB: v.boolean(),
  })
    .index("by_plan", ["planId"])
    .index("by_user_a", ["userA"])
    .index("by_user_b", ["userB"]),

  organizers: defineTable({
    name: v.string(),
    phone: v.optional(v.string()),
    community: v.optional(v.string()),
  }),

  /** Negocios. Lo importante es la atribución de llegadas verificadas por QR. */
  venues: defineTable({
    name: v.string(),
    address: v.string(),
    zone: v.string(),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    isPublic: v.boolean(), // siempre true — nunca casa de nadie
    sponsored: v.optional(v.boolean()),
  })
    .index("by_zone", ["zone"]),

  /** El índice: lo que se scrapea, antes y después de normalizar. */
  sources: defineTable({
    platform: v.string(), // luma, eventbrite, instagram, maps…
    externalId: v.optional(v.string()),
    rawPayload: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("normalized"),
      v.literal("discarded"),
    ),
    planId: v.optional(v.id("plans")),
  })
    .index("by_status", ["status"]),

  /**
   * Los "¿alguien va?" de redes. Tabla aparte a propósito: son señal de
   * DEMANDA, no de oferta. Dicen qué buscar antes de que alguien lo pida.
   */
  demandSignals: defineTable({
    platform: v.string(),
    text: v.string(),
    activity: v.optional(activity),
    zone: v.optional(v.string()),
    capturedAt: v.number(),
  })
    .index("by_activity", ["activity"]),

  /** Mensajes de WhatsApp. Dueño: Dev A. */
  messages: defineTable({
    userId: v.optional(v.id("users")),
    phone: v.string(),
    direction: v.union(v.literal("in"), v.literal("out")),
    body: v.string(),
    waMessageId: v.optional(v.string()), // para deduplicar reintentos del webhook
    intentId: v.optional(v.id("intents")),
  })
    .index("by_phone", ["phone"])
    .index("by_wa_id", ["waMessageId"]),
});
