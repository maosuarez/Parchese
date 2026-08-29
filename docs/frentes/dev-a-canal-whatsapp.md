# Dev A — El canal de WhatsApp

> Tu entrega: **que escribirle al bot cree una fila en `intents`.**
> Si eso funciona, cumpliste. Todo lo demás es mejora.

---

## Archivos tuyos

```
convex/http.ts        webhook entrante (verificación + firma)
convex/bot.ts         la action que llama al LLM
convex/whatsapp.ts    enviar mensajes (texto y botones)
```

**No toques:** `convex/schema.ts`, `convex/matching.ts`, `web/`.

---

## El contrato que tienes que cumplir

Lo único que Dev B espera de ti es una fila en `intents` con esta forma:

```ts
{
  userId,                  // del teléfono que escribió
  activity,                // "caminar" | "cafe" | "cowork" | "juego" | "cancha" | "otro"
  windowStart, windowEnd,  // timestamps ms — la ventana de 2 a 4 horas
  zone,                    // string, zona aproximada
  status: "open",
  source: "whatsapp",
}
```

Cómo llegues ahí es tu problema. Que llegue bien es el contrato.

---

## Orden de trabajo

### 1. Que el webhook conteste (primero esto, sin LLM)

Meta manda un GET de verificación:
```
GET /webhook?hub.mode=subscribe&hub.verify_token=<TU_TOKEN>&hub.challenge=123456
```
Respondes el `hub.challenge` en texto plano si el token coincide.

En Convex va en `convex/http.ts`:
```ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();
http.route({
  path: "/webhook/whatsapp",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // 1. verificar firma
    // 2. guardar mensaje (ctx.runMutation)
    // 3. agendar el trabajo pesado
    // 4. responder 200 YA
    return new Response(null, { status: 200 });
  }),
});
export default http;
```

**La regla que no se rompe: el webhook NUNCA llama al LLM directamente.** Guarda, agenda con `ctx.scheduler.runAfter(0, ...)` y devuelve 200. Si te demoras, WhatsApp reintenta el webhook mientras el modelo sigue pensando y terminas respondiendo dos veces.

La URL del webhook es `https://<deployment>.convex.site/webhook/whatsapp` — ojo: **`.convex.site`**, no `.convex.cloud`.

### 2. Firma del webhook

Header `X-Hub-Signature-256: sha256=<firma>` = HMAC-SHA256 del **body crudo** con el App Secret.

**No viene incluida en Convex — la escribes tú.** Y tiene que ser sobre el body crudo, no sobre el JSON re-serializado, o nunca va a coincidir.

### 3. Extraer la intención con el LLM

Aquí es donde el mensaje libre se vuelve datos. Usa **salida estructurada**, no parseo de texto:

```ts
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

const Intencion = z.object({
  activity: z.enum(["caminar", "cafe", "cowork", "juego", "cancha", "otro"]),
  zone: z.string(),
  hoursFromNow: z.number(),   // en cuántas horas quiere
  durationHours: z.number(),
  confident: z.boolean(),     // false si el mensaje es ambiguo
});

const response = await client.messages.parse({
  model: "claude-opus-5",
  max_tokens: 16000,
  system: SYSTEM_PROMPT,       // estable, para que el caché sirva
  messages: [{ role: "user", content: textoDelUsuario }],
  output_config: { format: zodOutputFormat(Intencion) },
});

response.parsed_output   // puede ser null — siempre verificar
```

Esto va en un `internalAction` — **las mutations y queries no pueden hacer `fetch`**, solo las actions.

**Cuidado con el caché:** el system prompt se repite en cada mensaje de cada usuario. Si le metes la hora actual o el nombre del usuario adentro, invalidas el caché en cada llamada y pagas todo completo. Lo estable arriba, lo variable en el mensaje.

**Si `confident` es falso**, no inventes la intención: pregunta. Ahí es donde sirven los botones.

### 4. Responder

Texto:
```json
POST https://graph.facebook.com/v23.0/{PHONE_NUMBER_ID}/messages
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "<NUMERO>",
  "type": "text",
  "text": { "body": "..." }
}
```

Botones (**máx. 3**, título ≤20 caracteres, body ≤1024):
```json
{
  "messaging_product": "whatsapp",
  "to": "<NUMERO>",
  "type": "interactive",
  "interactive": {
    "type": "button",
    "body": { "text": "¿Para cuándo?" },
    "action": {
      "buttons": [
        { "type": "reply", "reply": { "id": "ahora", "title": "En 1 hora" } },
        { "type": "reply", "reply": { "id": "tarde", "title": "Esta tarde" } },
        { "type": "reply", "reply": { "id": "noche", "title": "En la noche" } }
      ]
    }
  }
}
```

Los botones son tu mejor amigo: **cada botón es un campo que el LLM no tiene que adivinar.**

---

## La regla de las 24 horas — léela antes de diseñar nada

Cuando el usuario te escribe, se abre una ventana de **24 horas** donde puedes mandarle lo que quieras. Cerrada esa ventana, **solo plantillas aprobadas por Meta**, y aprobar una tarda **hasta 24 horas**.

**Para el demo esto no es problema**, porque el flujo arranca con el público escribiéndole al bot (el QR). Eso abre la ventana y todo lo demás es libre.

**Para producción sí importa:** el mensaje de las 7pm necesita plantilla aprobada con días de anticipación. No se improvisa.

---

## Proveedor

| Opción | Setup | Nota |
|---|---|---|
| **Twilio Sandbox** | Minutos, gratis | Número compartido. **Solo responde a quien mandó `join <código>`** |
| **Kapso** | ~2 min | Precio no publicado. Hugo tiene cuenta de 30X — verificar |

Si van con Twilio: **el cartel del QR tiene que decir que hay que mandar el `join` primero.** Quien escriba sin hacerlo recibe un error silencioso y el momento se cae en vivo.

---

## Gotchas

- Las **actions tienen 10 min de timeout y no reintentan solas.** Si el LLM se cuelga, lo manejas tú.
- **httpAction tope 20MB.** Si alguien manda un audio o una foto, no lo proceses en línea.
- Evita varios `ctx.runQuery`/`runMutation` sueltos dentro de una misma action — corren en transacciones separadas.
- `response.parsed_output` **puede ser null**. Siempre verificar antes de usar.

---

## Prohibido (viene de evidencia, no de gusto)

- **Ningún copy sobre salud, sedentarismo o que la persona debería moverse.** Ninguno.
- **Si una intención vence sin match, no mandes nada.** Avisar que nadie coincidió rompe la invisibilidad del rechazo, que es el mecanismo central del producto.

Contexto completo en `docs/01-definicion-producto.md`.
