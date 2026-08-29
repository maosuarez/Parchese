import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

// Puerta A — entrada de WhatsApp vía Kapso.
// Spec: openspec/changes/canal-whatsapp-ingesta/specs/whatsapp-ingest/spec.md
//
// URL a registrar en Kapso (WhatsApp → el número → Edit → webhook):
//   https://<deployment>.convex.site/webhook/whatsapp
// Ojo: .convex.site, NO .convex.cloud (ese es para queries y mutations).
//
// Kapso NO es el formato crudo de Meta. Diferencias que importan:
//   · firma en X-Webhook-Signature, hex puro, sin prefijo "sha256="
//   · no hay verificación por hub.challenge (eso es de Meta directo)
//   · el payload es plano: message.from, message.text.body
//   · hay que responder 200 en menos de 10 segundos
//   · trae X-Idempotency-Key para deduplicar reintentos

const http = httpRouter();

// Suscripción de webhook de Meta (WhatsApp Cloud API directo). Meta hace un
// GET con hub.mode=subscribe y un hub.verify_token; hay que devolver el
// hub.challenge en texto plano si el token coincide. Kapso no usa este
// handshake, pero el canal directo de Meta sí, y la spec lo exige.
http.route({
  path: "/webhook/whatsapp",
  method: "GET",
  handler: httpAction(async (_ctx, request) => {
    const url = new URL(request.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    const esperado = process.env.META_VERIFY_TOKEN;

    if (
      mode === "subscribe" &&
      esperado &&
      token === esperado &&
      challenge !== null
    ) {
      return new Response(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }
    return new Response("Forbidden", { status: 403 });
  }),
});

http.route({
  path: "/webhook/whatsapp",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // El cuerpo CRUDO, antes de parsear. Re-serializar el JSON cambia
    // espacios y orden de claves, y la firma deja de coincidir.
    const raw = await request.text();

    if (!(await firmaValida(raw, request.headers.get("x-webhook-signature")))) {
      return new Response("Firma inválida", { status: 401 });
    }

    let payload: unknown;
    try {
      payload = JSON.parse(raw);
    } catch {
      // Payload ilegible: 200 igual, para que Kapso no reintente en bucle
      // algo que nunca va a funcionar.
      return new Response(null, { status: 200 });
    }

    const idempotencyKey = request.headers.get("x-idempotency-key") ?? undefined;

    // La regla que no se rompe: aquí NO se llama al LLM. Se valida, se
    // guarda, se agenda y se responde. Kapso corta a los 10 segundos.
    for (const mensaje of extraerMensajes(payload)) {
      await ctx.runMutation(internal.bot.recibirMensaje, {
        ...mensaje,
        idempotencyKey,
      });
    }

    return new Response(null, { status: 200 });
  }),
});

// Puerta B — ingesta del índice de la ciudad vía Webhook de Apify.
// Spec: openspec/changes/ingesta-apify-eventos/specs/apify-ingest/spec.md
//
// URL a registrar en el Actor/Tarea de Apify (Webhooks → Add webhook):
//   https://<deployment>.convex.site/webhook/apify?token=<APIFY_WEBHOOK_SECRET>
// El secreto también se acepta como header Authorization: Bearer <secreto>.
//
// La regla del canal crítico: aquí NO se llama al LLM ni se descarga el
// dataset. Se valida el secreto, se agenda y se responde 200 de inmediato —
// Apify corta el webhook a los pocos segundos y reintenta si no.
http.route({
  path: "/webhook/apify",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!secretoApifyValido(request)) {
      return new Response("No autorizado", { status: 401 });
    }

    const raw = await request.text();
    let payload: unknown;
    try {
      payload = JSON.parse(raw);
    } catch {
      // Ilegible: 200 para que Apify no reintente en bucle algo inservible.
      return new Response(null, { status: 200 });
    }

    const lote = interpretarPayloadApify(payload);
    if (lote.kind === "items") {
      await ctx.scheduler.runAfter(0, internal.sources.apify.ingestarLoteApify, {
        platform: lote.platform,
        canal: lote.canal,
        items: lote.items,
      });
    } else if (lote.kind === "dataset") {
      await ctx.scheduler.runAfter(0, internal.sources.apify.descargarDataset, {
        platform: lote.platform,
        canal: lote.canal,
        datasetId: lote.datasetId,
      });
    }
    // Si no hay nada accionable igual devolvemos 200: el webhook llegó bien,
    // simplemente no traía items ni dataset.

    return new Response(null, { status: 200 });
  }),
});

/**
 * El secreto se acepta por query (`?token=`) o por header
 * (`Authorization: Bearer …`). Sin `APIFY_WEBHOOK_SECRET` en el entorno no se
 * acepta nada: fallar cerrado, igual que el webhook de WhatsApp.
 */
function secretoApifyValido(request: Request): boolean {
  const secret = process.env.APIFY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook] falta APIFY_WEBHOOK_SECRET");
    return false;
  }
  const url = new URL(request.url);
  const enQuery = url.searchParams.get("token");
  const header = request.headers.get("authorization") ?? "";
  const enHeader = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : header.trim();
  const recibido = enQuery ?? enHeader;
  if (!recibido) return false;
  return comparacionSegura(recibido, secret);
}

type LoteApify =
  | { kind: "items"; platform: string; canal: CanalApify; items: unknown[] }
  | { kind: "dataset"; platform: string; canal: CanalApify; datasetId: string }
  | { kind: "vacio" };

type CanalApify = "oferta" | "demanda";

/**
 * Dos formas de payload (design.md, decisión 2):
 *   1. Lote directo: `{ items: [...] }` para corridas ligeras.
 *   2. Referencia a dataset: `{ resource: { defaultDatasetId } }` — la acción
 *      lo descarga desde la API de Apify si el lote es grande.
 *
 * `platform` (luma/eventbrite/maps/instagram…) y `canal` (oferta vs demanda)
 * se leen del nivel superior del payload; se rellenan con la plantilla de
 * payload del webhook en Apify. Por defecto: plataforma desconocida, oferta.
 */
function interpretarPayloadApify(payload: unknown): LoteApify {
  if (typeof payload !== "object" || payload === null) return { kind: "vacio" };
  const p = payload as Record<string, unknown>;

  const platform =
    typeof p.platform === "string" && p.platform.trim()
      ? p.platform.trim().toLowerCase()
      : "desconocido";
  const canal: CanalApify = p.canal === "demanda" ? "demanda" : "oferta";

  if (Array.isArray(p.items)) {
    return { kind: "items", platform, canal, items: p.items };
  }

  const resource = p.resource;
  if (typeof resource === "object" && resource !== null) {
    const datasetId = (resource as Record<string, unknown>).defaultDatasetId;
    if (typeof datasetId === "string" && datasetId) {
      return { kind: "dataset", platform, canal, datasetId };
    }
  }

  return { kind: "vacio" };
}

/** HMAC-SHA256 hex del cuerpo crudo, comparado en tiempo constante. */
async function firmaValida(
  raw: string,
  signature: string | null,
): Promise<boolean> {
  const secret = process.env.KAPSO_WEBHOOK_SECRET;
  if (!secret) {
    // Sin secreto no se acepta nada: fallar cerrado, no abierto.
    console.error("[webhook] falta KAPSO_WEBHOOK_SECRET");
    return false;
  }
  if (!signature) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(raw),
  );
  const esperada = [...new Uint8Array(mac)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return comparacionSegura(esperada, signature.trim().toLowerCase());
}

/** Sin cortocircuito: no filtra información por el tiempo que tarda. */
function comparacionSegura(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export type MensajeEntrante = {
  phone: string;
  body: string;
  waMessageId: string;
  buttonId?: string;
};

/**
 * Saca los mensajes útiles del payload de Kapso.
 *
 * Acepta las dos formas: el evento suelto y el lote (`batch: true` con
 * `data: [...]`), porque un webhook con buffering activado manda el lote.
 *
 * Solo texto y respuestas de botón. Audio, imágenes y documentos se ignoran:
 * el httpAction tiene tope de 20MB y no vamos a procesarlos en línea.
 */
function extraerMensajes(payload: unknown): MensajeEntrante[] {
  const eventos = esLote(payload) ? payload.data : [payload];
  const salida: MensajeEntrante[] = [];

  for (const evento of eventos) {
    const m = (evento as KapsoEvent)?.message;
    if (!m?.from || !m?.id) continue;

    const reply = m.interactive?.button_reply;
    if (reply) {
      salida.push({
        phone: m.from,
        body: reply.title,
        waMessageId: m.id,
        buttonId: reply.id,
      });
    } else if (m.type === "text" && m.text?.body) {
      salida.push({ phone: m.from, body: m.text.body, waMessageId: m.id });
    }
  }
  return salida;
}

function esLote(p: unknown): p is { batch: true; data: unknown[] } {
  return (
    typeof p === "object" &&
    p !== null &&
    (p as { batch?: unknown }).batch === true &&
    Array.isArray((p as { data?: unknown }).data)
  );
}

type KapsoEvent = {
  message?: {
    id?: string;
    from?: string;
    type?: string;
    text?: { body?: string };
    interactive?: { button_reply?: { id: string; title: string } };
  };
};

export default http;
