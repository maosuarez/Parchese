import { v } from "convex/values";
import { internalAction } from "./_generated/server";

// Canal de salida hacia WhatsApp, vía Kapso.
//
// Kapso expone un proxy con la forma de la Cloud API de Meta, así que los
// payloads son los mismos que documenta Meta; solo cambian la URL base y
// la autenticación (X-API-Key en vez de Bearer de Meta).
//
// Va en action porque necesita red. Las actions NO reintentan solas y tienen
// 10 minutos de timeout: los errores se manejan aquí.

const API = "https://api.kapso.ai/meta/whatsapp/v24.0";

function config() {
  const apiKey = process.env.KAPSO_API_KEY;
  const phoneNumberId = process.env.KAPSO_PHONE_NUMBER_ID;
  if (!apiKey || !phoneNumberId) {
    throw new Error(
      "Faltan KAPSO_API_KEY o KAPSO_PHONE_NUMBER_ID en el entorno de Convex.",
    );
  }
  return { apiKey, phoneNumberId };
}

async function enviar(body: Record<string, unknown>): Promise<void> {
  const { apiKey, phoneNumberId } = config();

  const res = await fetch(`${API}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messaging_product: "whatsapp", ...body }),
  });

  if (!res.ok) {
    // No relanzamos: un fallo de envío no debe tumbar el flujo entero.
    console.error(`[whatsapp] ${res.status}: ${await res.text()}`);
  }
}

export const enviarTexto = internalAction({
  args: { phone: v.string(), texto: v.string() },
  handler: async (_ctx, { phone, texto }) => {
    await enviar({
      recipient_type: "individual",
      to: phone,
      type: "text",
      text: { body: texto },
    });
  },
});

/**
 * Botones de respuesta rápida.
 *
 * Límites de Meta: máximo 3 botones, título ≤20 caracteres, id ≤256,
 * cuerpo ≤1024. Pasarse de ahí es un 400, no un aviso.
 *
 * Cada botón es un campo que el modelo no tiene que adivinar: la respuesta
 * llega con un id determinista, sin volver a interpretar texto libre.
 */
export const enviarBotones = internalAction({
  args: {
    phone: v.string(),
    texto: v.string(),
    botones: v.array(v.object({ id: v.string(), titulo: v.string() })),
  },
  handler: async (_ctx, { phone, texto, botones }) => {
    if (botones.length === 0 || botones.length > 3) {
      throw new Error("WhatsApp acepta entre 1 y 3 botones.");
    }
    for (const b of botones) {
      if (b.titulo.length > 20) {
        throw new Error(`Título muy largo (máx. 20): "${b.titulo}"`);
      }
    }

    await enviar({
      to: phone,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: texto.slice(0, 1024) },
        action: {
          buttons: botones.map((b) => ({
            type: "reply",
            reply: { id: b.id, title: b.titulo },
          })),
        },
      },
    });
  },
});
