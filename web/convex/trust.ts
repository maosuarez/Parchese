import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { trustLevel } from "./schema";
import type { Doc, Id } from "./_generated/dataModel";

// Confianza, check-in por QR y progresión — el diferenciador del producto.
// Spec: openspec/changes/confianza-qr-y-progresion/specs/trust-and-progression/spec.md
// Fuente de verdad: docs/02-confianza-y-progresion.md

// --- Umbrales -----------------------------------------------------------------
// PROVISIONALES. docs/02 los marca como pendientes de decidir con datos, no a
// ojo. Están aquí como constantes para que cambiarlos sea una línea, no una
// cacería por el archivo.

/** Asistencias verificadas por QR para desbloquear nivel 2. */
const ASISTENCIAS_PARA_NIVEL_2 = 3;

/** Aparecer a un plan al que confirmaste: sube. */
const SCORE_SHOWED = 1;
/** Confirmar y no aparecer: baja. */
const SCORE_NO_SHOW = -2;
/** Un reporte de otra persona: baja fuerte y puede revocar el nivel 2. */
const SCORE_REPORTE = -5;

/** Si el score cae por debajo de esto, se revoca el nivel 2. */
const UMBRAL_REVOCA_NIVEL_2 = 0;

// --- Helpers internos -------------------------------------------------------

/** Ordena un par de usuarios de forma estable por `_id` (userA < userB). */
function ordenarPar(
  a: Id<"users">,
  b: Id<"users">,
): [Id<"users">, Id<"users">] {
  return a < b ? [a, b] : [b, a];
}

/** Cuenta asistencias del plan en estado `going` o `confirmed`. */
async function contarConfirmados(
  ctx: QueryCtx | MutationCtx,
  planId: Id<"plans">,
): Promise<number> {
  const asistencias = await ctx.db
    .query("attendance")
    .withIndex("by_plan", (q) => q.eq("planId", planId))
    .collect();
  return asistencias.filter(
    (a) => a.status === "going" || a.status === "confirmed",
  ).length;
}

/**
 * Recalcula el nivel de confianza de un usuario a partir de su historial.
 *
 * Promociona a nivel 2 con historial saludable; degrada a nivel 1 si el score
 * cae por debajo del umbral. No mide sociabilidad ni energía: solo cumplimiento.
 * Devuelve el nivel resultante.
 */
export async function revisarProgresion(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<Doc<"users">["trustLevel"]> {
  const user = await ctx.db.get(userId);
  if (!user) throw new Error("No existe ese usuario.");

  const showed = await ctx.db
    .query("attendance")
    .withIndex("by_user", (q) => q.eq("userId", userId).eq("status", "showed"))
    .collect();

  let nivel = user.trustLevel;

  if (
    showed.length >= ASISTENCIAS_PARA_NIVEL_2 &&
    user.trustLevel < 2 &&
    user.score >= UMBRAL_REVOCA_NIVEL_2
  ) {
    nivel = 2;
  }
  if (user.trustLevel === 2 && user.score < UMBRAL_REVOCA_NIVEL_2) {
    nivel = 1;
  }

  if (nivel !== user.trustLevel) {
    await ctx.db.patch(userId, { trustLevel: nivel });
  }
  return nivel;
}

/**
 * Lanza si el usuario no tiene el nivel de confianza que el plan exige.
 *
 * NO es una Convex function: la llama la mutación de "unirse a un plan", que
 * vive en otro frente. Aquí solo está la regla.
 */
export async function assertPuedeUnirse(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  plan: Doc<"plans">,
): Promise<void> {
  const user = await ctx.db.get(userId);
  if (!user) throw new Error("No existe ese usuario.");
  if (user.trustLevel < plan.requiredTrustLevel) {
    throw new Error(
      `Este plan es de nivel ${plan.requiredTrustLevel}. ` +
        `Desbloquéalo acumulando asistencias verificadas por QR.`,
    );
  }
}

/**
 * Activa el plan si cumple el aforo mínimo. Idempotente.
 *
 * Nivel 1 exige mínimo 3 confirmados en lugar público: es lo que elimina el
 * escenario de "quedé solo con un desconocido". Si no llega a 3, el plan se
 * queda pending y no se activa como encuentro válido.
 */
export async function activarPlanSiCumpleAforo(
  ctx: MutationCtx,
  planId: Id<"plans">,
): Promise<{ activado: boolean; confirmados: number }> {
  const plan = await ctx.db.get(planId);
  if (!plan) throw new Error("No existe ese plan.");

  const confirmados = await contarConfirmados(ctx, planId);

  // Idempotente: un plan que ya salió de pending no se vuelve a tocar.
  if (plan.status !== "pending") {
    return { activado: plan.status === "active", confirmados };
  }

  if (plan.requiredTrustLevel === 1 && confirmados < 3) {
    return { activado: false, confirmados };
  }

  await ctx.db.patch(planId, { status: "active", activatedAt: Date.now() });
  return { activado: true, confirmados };
}

// --- Convex functions -----------------------------------------------------

/** Wrapper llamable de `activarPlanSiCumpleAforo`. */
export const activarPlanSiCumpleAforoMut = internalMutation({
  args: { planId: v.id("plans") },
  handler: async (ctx, args) => activarPlanSiCumpleAforo(ctx, args.planId),
});

/**
 * Check-in por escaneo de QR. Es la ÚNICA forma de llegar a `showed`.
 *
 * Sin el token del plan no hay check-in: eso es lo que impide el autoreporte.
 * Al registrarse, se crean los matches con quienes ya escanearon.
 */
export const checkInWithQR = mutation({
  args: {
    userId: v.id("users"),
    planId: v.id("plans"),
    qrToken: v.string(),
  },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) throw new Error("No existe ese plan.");
    if (plan.qrToken !== args.qrToken) {
      throw new Error("Token de QR inválido.");
    }

    const asistencias = await ctx.db
      .query("attendance")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();

    const propia = asistencias.find((a) => a.userId === args.userId);
    if (!propia) {
      throw new Error("No estás inscrito en este plan.");
    }
    if (propia.status === "showed") {
      throw new Error("Ya registraste tu asistencia en este plan.");
    }
    if (propia.status === "noShow") {
      throw new Error("Este plan ya cerró y quedaste como inasistencia.");
    }

    // Atómico: marca la asistencia y suma el punto de cumplimiento.
    await ctx.db.patch(propia._id, {
      status: "showed",
      checkedInAt: Date.now(),
    });

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("No existe ese usuario.");
    const nuevoScore = user.score + SCORE_SHOWED;
    await ctx.db.patch(args.userId, { score: nuevoScore });

    const nivel = await revisarProgresion(ctx, args.userId);

    // Match con cada asistente que YA está showed. Par ordenado por _id, sin
    // duplicar uno existente.
    const existentes = await ctx.db
      .query("matches")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();

    let matchesCreados = 0;
    for (const otra of asistencias) {
      if (otra.userId === args.userId || otra.status !== "showed") continue;
      const [userA, userB] = ordenarPar(args.userId, otra.userId);
      const duplicado = existentes.some(
        (m) => m.userA === userA && m.userB === userB,
      );
      if (duplicado) continue;
      await ctx.db.insert("matches", {
        planId: args.planId,
        userA,
        userB,
        revealedByA: false,
        revealedByB: false,
      });
      matchesCreados++;
    }

    return {
      status: "showed" as const,
      score: nuevoScore,
      trustLevel: nivel,
      matchesCreados,
    };
  },
});

/** Chequeo sin lanzar de si un usuario puede unirse a un plan. */
export const puedeUnirse = query({
  args: { userId: v.id("users"), planId: v.id("plans") },
  handler: async (
    ctx,
    args,
  ): Promise<{ ok: boolean; motivo?: string }> => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) return { ok: false, motivo: "No existe ese plan." };
    try {
      await assertPuedeUnirse(ctx, args.userId, plan);
      return { ok: true };
    } catch (e) {
      return {
        ok: false,
        motivo: e instanceof Error ? e.message : "No puedes unirte.",
      };
    }
  },
});

/**
 * Opt-in de revelación de perfil. Independiente por cada lado. Idempotente.
 *
 * Activar la bandera propia hace visible tu perfil extendido SOLO a la otra
 * parte de ese match, y solo tras el encuentro.
 */
export const revealContact = mutation({
  args: { userId: v.id("users"), matchId: v.id("matches") },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("No existe ese match.");
    if (match.userA !== args.userId && match.userB !== args.userId) {
      throw new Error("No eres parte de ese match.");
    }
    if (match.userA === args.userId) {
      if (!match.revealedByA) {
        await ctx.db.patch(args.matchId, { revealedByA: true });
      }
    } else {
      if (!match.revealedByB) {
        await ctx.db.patch(args.matchId, { revealedByB: true });
      }
    }
  },
});

/**
 * Perfil extendido de la contraparte, SOLO si esa contraparte dio su opt-in.
 *
 * Nunca devuelve `phone` ni ningún otro campo de `users` fuera de
 * `extendedProfile`. Si no hay opt-in del objetivo, devuelve null.
 */
export const perfilExtendidoDe = query({
  args: {
    solicitanteId: v.id("users"),
    objetivoId: v.id("users"),
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("No existe ese match.");

    const partes: Id<"users">[] = [match.userA, match.userB];
    if (
      args.solicitanteId === args.objetivoId ||
      !partes.includes(args.solicitanteId) ||
      !partes.includes(args.objetivoId)
    ) {
      throw new Error(
        "Solicitante y objetivo deben ser las dos partes del match.",
      );
    }

    const optInDelObjetivo =
      args.objetivoId === match.userA
        ? match.revealedByA
        : match.revealedByB;
    if (!optInDelObjetivo) return null;

    const objetivo = await ctx.db.get(args.objetivoId);
    if (!objetivo) return null;
    return objetivo.extendedProfile ?? null;
  },
});

/**
 * Reporte de conducta contra otro asistente del mismo plan.
 *
 * Baja fuerte el score del reportado y recalcula su nivel — puede revocarle el
 * nivel 2.
 */
export const reportar = mutation({
  args: {
    reporterId: v.id("users"),
    reportedId: v.id("users"),
    planId: v.id("plans"),
  },
  handler: async (ctx, args) => {
    if (args.reporterId === args.reportedId) {
      throw new Error("No puedes reportarte a ti mismo.");
    }

    const asistencias = await ctx.db
      .query("attendance")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();
    const reporterVa = asistencias.some((a) => a.userId === args.reporterId);
    const reportedVa = asistencias.some((a) => a.userId === args.reportedId);
    if (!reporterVa || !reportedVa) {
      throw new Error("Ambas personas deben tener asistencia en ese plan.");
    }

    const reported = await ctx.db.get(args.reportedId);
    if (!reported) throw new Error("No existe ese usuario.");

    // TODO: falta persistir el reporte en una tabla propia para revisión
    // manual (qué pasa tras un reporte sigue pendiente en docs/02). Fuera de
    // alcance de este cambio.
    const nuevoScore = reported.score - Math.abs(SCORE_REPORTE);
    await ctx.db.patch(args.reportedId, { score: nuevoScore });
    const nivel = await revisarProgresion(ctx, args.reportedId);

    return { score: nuevoScore, trustLevel: nivel };
  },
});

/**
 * Cierra los planes cuya ventana ya terminó.
 *
 * Patrón calcado de `vencerIntenciones`: quien confirmó y no escaneó el QR
 * queda como `noShow` y pierde score. Cinco minutos de retraso no importan.
 */
export const cerrarPlanesVencidos = internalMutation({
  args: {},
  handler: async (ctx) => {
    const ahora = Date.now();
    const activos = await ctx.db
      .query("plans")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    let cerrados = 0;
    let noShows = 0;
    for (const plan of activos) {
      if (plan.startsAt + plan.durationMinutes * 60_000 > ahora) continue;

      const asistencias = await ctx.db
        .query("attendance")
        .withIndex("by_plan", (q) => q.eq("planId", plan._id))
        .collect();

      for (const a of asistencias) {
        if (a.status !== "confirmed" && a.status !== "going") continue;
        await ctx.db.patch(a._id, { status: "noShow" });
        const user = await ctx.db.get(a.userId);
        if (user) {
          await ctx.db.patch(a.userId, { score: user.score + SCORE_NO_SHOW });
          await revisarProgresion(ctx, a.userId);
        }
        noShows++;
      }

      await ctx.db.patch(plan._id, { status: "completed" });
      cerrados++;
    }
    return { cerrados, noShows };
  },
});

// --- Siembra e inspección -------------------------------------------------
// Para verificar sin frontend, al estilo de `sembrarIntencion` de matching.ts.

/**
 * Arma un escenario de confianza completo: N usuarios, un plan pending con
 * todos confirmados, y opcionalmente un historial de asistencias previas para
 * el primer usuario (para probar la promoción a nivel 2).
 */
export const sembrarEscenarioConfianza = internalMutation({
  args: {
    prefijo: v.string(),
    asistentes: v.number(),
    requiredTrustLevel: trustLevel,
    enHoras: v.number(),
    duraMinutos: v.number(),
    showedPreviosPrimerUsuario: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userIds: Id<"users">[] = [];
    for (let i = 0; i < args.asistentes; i++) {
      userIds.push(
        await ctx.db.insert("users", {
          phone: `${args.prefijo}-${i}`,
          name: `${args.prefijo} ${i}`,
          trustLevel: 1,
          score: 0,
          extendedProfile: { instagram: `@${args.prefijo}_${i}` },
        }),
      );
    }

    const startsAt = Date.now() + args.enHoras * 3_600_000;
    const qrToken = crypto.randomUUID();
    const planId = await ctx.db.insert("plans", {
      title: `Escenario ${args.prefijo}`,
      activity: "cafe",
      zone: "centro",
      startsAt,
      durationMinutes: args.duraMinutos,
      minPeople: 3,
      requiredTrustLevel: args.requiredTrustLevel,
      origin: "seeded",
      status: "pending",
      qrToken,
    });

    for (const userId of userIds) {
      await ctx.db.insert("attendance", {
        userId,
        planId,
        status: "confirmed",
      });
    }

    // Historial previo del primer usuario: planes ya cerrados con showed.
    const previos = args.showedPreviosPrimerUsuario ?? 0;
    const primero = userIds[0];
    if (previos > 0 && primero) {
      for (let i = 0; i < previos; i++) {
        const previoId = await ctx.db.insert("plans", {
          title: `Previo ${args.prefijo} ${i}`,
          activity: "cafe",
          zone: "centro",
          startsAt: Date.now() - (i + 1) * 86_400_000,
          durationMinutes: 60,
          minPeople: 3,
          requiredTrustLevel: 1,
          origin: "seeded",
          status: "completed",
          qrToken: crypto.randomUUID(),
        });
        await ctx.db.insert("attendance", {
          userId: primero,
          planId: previoId,
          status: "showed",
        });
      }
    }

    return { planId, qrToken, userIds };
  },
});

/** Vuelca el estado de un plan: asistencias, matches y usuarios. */
export const inspeccionarPlan = internalQuery({
  args: { planId: v.id("plans") },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) return null;

    const asistencias = await ctx.db
      .query("attendance")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();
    const matches = await ctx.db
      .query("matches")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();

    const usuarios: Array<{
      _id: Id<"users">;
      trustLevel: number;
      score: number;
    }> = [];
    for (const a of asistencias) {
      const u = await ctx.db.get(a.userId);
      if (u) {
        usuarios.push({ _id: u._id, trustLevel: u.trustLevel, score: u.score });
      }
    }

    return {
      plan: {
        status: plan.status,
        qrToken: plan.qrToken,
        activatedAt: plan.activatedAt ?? null,
        requiredTrustLevel: plan.requiredTrustLevel,
      },
      asistencias: asistencias.map((a) => ({
        userId: a.userId,
        status: a.status,
        checkedInAt: a.checkedInAt ?? null,
      })),
      matches,
      usuarios,
    };
  },
});

/** Estado de un usuario, para verificar progresión. */
export const inspeccionarUsuario = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    const showed = await ctx.db
      .query("attendance")
      .withIndex("by_user", (q) =>
        q.eq("userId", args.userId).eq("status", "showed"),
      )
      .collect();
    return {
      trustLevel: user.trustLevel,
      score: user.score,
      showedCount: showed.length,
      extendedProfile: user.extendedProfile ?? null,
    };
  },
});
