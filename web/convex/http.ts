import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

// Puerta A — entrada de WhatsApp.
// Spec: openspec/changes/canal-whatsapp-ingesta/specs/whatsapp-ingest/spec.md
//
// URL del webhook: https://<deployment>.convex.site/webhook/whatsapp
// Ojo: .convex.site, NO .convex.cloud (ese es para queries y mutations).

const http = httpRouter();

/**
 * Verificación de suscripción de Meta.
 * Responde el hub.challenge en texto plano si el token coincide.
 */
http.route({
  path: "/webhook/whatsapp",
  method: "GET",
  handler: httpAction(async (_ctx, request) => {
    const url = new URL(request.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return new Response(challenge ?? "", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }
    return new Response("Forbidden", { status: 403 });
  }),
});

/**
 * Mensajes entrantes.
 *
 * La regla que no se rompe: NUNCA llamar al LLM aquí. Se valida, se guarda,
 * se agenda y se responde 200. Si nos demoramos, WhatsApp reintenta el
 * webhook mientras el modelo todavía piensa, y terminamos respondiendo dos
 * veces y pagando doble inferencia.
 */
http.route({
  path: "/webhook/whatsapp",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // El cuerpo CRUDO, antes de cualquier parseo. Re-serializar el JSON
    // cambia espacios y orden de claves, y la firma deja de coincidir.
    const raw = await request.text();
    const signature = request.headers.get("x-hub-signature-256");

    if (!(await firmaValida(raw, signature))) {
      return new Response("Firma inválida", { status: 401 });
    }

    let payload: WhatsAppPayload;
    try {
      payload = JSON.parse(raw);
    } catch {
      // Payload ilegible: 200 igual, para que Meta no reintente en bucle.
      return new Response(null, { status: 200 });
    }

    for (const mensaje of extraerMensajes(payload)) {
      await ctx.runMutation(internal.bot.recibirMensaje, mensaje);
    }

    return new Response(null, { status: 200 });
  }),
});

/** HMAC-SHA256 del cuerpo crudo con el App Secret, en tiempo constante. */
async function firmaValida(
  raw: string,
  signature: string | null,
): Promise<boolean> {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) {
    // Sin secreto configurado no se acepta nada: fallar cerrado, no abierto.
    console.error("[webhook] falta WHATSAPP_APP_SECRET");
    return false;
  }
  if (!signature?.startsWith("sha256=")) return false;

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

  return comparacionSegura(esperada, signature.slice("sha256=".length));
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
 * Saca los mensajes útiles del payload de Meta, que viene muy anidado.
 *
 * Solo texto y respuestas de botón. Audio, imágenes y documentos se ignoran:
 * httpAction tiene tope de 20MB y no vamos a procesarlos en línea.
 */
function extraerMensajes(payload: WhatsAppPayload): MensajeEntrante[] {
  const salida: MensajeEntrante[] = [];

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const m of change.value?.messages ?? []) {
        if (m.type === "text" && m.text?.body) {
          salida.push({ phone: m.from, body: m.text.body, waMessageId: m.id });
        } else if (m.type === "interactive") {
          const reply = m.interactive?.button_reply;
          if (reply) {
            salida.push({
              phone: m.from,
              body: reply.title,
              waMessageId: m.id,
              buttonId: reply.id,
            });
          }
        }
      }
    }
  }
  return salida;
}

type WhatsAppPayload = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{
          id: string;
          from: string;
          type: string;
          text?: { body: string };
          interactive?: { button_reply?: { id: string; title: string } };
        }>;
      };
    }>;
  }>;
};

export default http;
