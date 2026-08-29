# Propuesta — Canal de WhatsApp e Ingesta de Intenciones

## Why

La puerta de entrada conversacional (Puerta A) permite a los usuarios declarar lo que quieren hacer directamente por WhatsApp en segundos, sin fricción de registro, instalación ni onboarding previo. Este canal es clave para capturar la demanda espontánea en la ventana de 7–9pm y transformarla en intenciones estructuradas para el motor de match.

## What Changes

- **Webhook HTTP en Convex (`convex/http.ts`)**: Endpoint para recibir eventos de Meta/WhatsApp, validación de `hub.challenge` y verificación de firma HMAC-SHA256 con payload crudo. Desacoplamiento de procesamiento con respuesta HTTP 200 inmediata.
- **Extracción estructurada con LLM (`convex/bot.ts`)**: `internalAction` que transforma mensajes en lenguaje natural a intenciones tipadas usando schema Zod (`activity`, `zone`, `hoursFromNow`, `durationHours`, `confident`).
- **Manejo de ambigüedad interactivo**: Si `confident === false`, responde con opciones/botones interactivos (máx. 3 botones) para aclarar antes de registrar.
- **Inserción en `intents`**: Cuando los datos están completos, inserta una fila en `intents` con `source: "whatsapp"`, activando el match de Dev B.
- **Canal de salida (`convex/whatsapp.ts`)**: Envío de mensajes de texto y botones vía WhatsApp Cloud API / Twilio Sandbox, incluyendo la notificación cuando se concreta un plan.

## Capabilities

### New Capabilities
- `whatsapp-ingest`: Recepción y validación de webhooks, extracción de intenciones vía LLM estructurado, desambiguación con botones y envío de notificaciones salientes.

### Modified Capabilities
*(Ninguna)*

## No-gos

- **Ningún copy sobre salud, sedentarismo o culpa de quedarse en casa.**
- **No notificar cuando una intención vence sin match.** Si vence, silencio total.
- **No llamar al LLM dentro del handler síncrono del webhook.** Debe responder 200 de inmediato y agendar con `scheduler.runAfter(0, ...)`.
- **No inventar intenciones si el LLM no tiene confianza.** Preguntar con botones interactivos.

## Impact

- Nuevos archivos en Convex: `convex/http.ts`, `convex/bot.ts`, `convex/whatsapp.ts`.
- Dependencias: `@anthropic-ai/sdk`, `zod`.
- Interacción con tabla `intents` y scheduler de Convex.
