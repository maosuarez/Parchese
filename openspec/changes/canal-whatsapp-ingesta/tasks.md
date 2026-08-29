## 1. Webhook HTTP y Validación en Convex

- [x] 1.1 Implementar ruta GET de suscripción Meta en `convex/http.ts` y verificar que responde `hub.challenge` ante el token correcto.
      Ruta `GET /webhook/whatsapp`: valida `hub.mode=subscribe` + `hub.verify_token === META_VERIFY_TOKEN` y devuelve `hub.challenge` en texto plano (200); si no coincide, 403.
- [x] 1.2 Implementar validación de firma HMAC-SHA256 sobre el buffer crudo del request POST y verificar rechazo con HTTP 401 ante firmas inválidas.
      `firmaValida()` toma `await request.text()` antes de parsear, calcula HMAC-SHA256 hex contra `KAPSO_WEBHOOK_SECRET`, compara en tiempo constante y responde 401 si falta o no coincide. Nota: el header es el de Kapso (`x-webhook-signature`, hex sin prefijo `sha256=`), no `X-Hub-Signature-256`, porque la integración va por el proxy de Kapso.
- [x] 1.3 Implementar guardado inicial del payload crudo y encolamiento asíncrono con `ctx.scheduler.runAfter(0, internal.bot.procesarMensaje, { ... })` retornando HTTP 200 de inmediato.
      El handler valida, parsea, persiste el mensaje entrante en `messages` vía `internal.bot.recibirMensaje` y agenda `internal.botLlm.procesarMensaje` con `runAfter(0, ...)`; responde 200 sin llamar al LLM. (La acción se referencia como `internal.botLlm.procesarMensaje` tras separar `bot.ts` — ver nota de arquitectura abajo.)

## 2. Extracción Estructurada con LLM

- [x] 2.1 Configurar el SDK de Anthropic y definir el schema Zod de intención (`activity`, `zone`, `hoursFromNow`, `durationHours`, `confident`) en `convex/bot.ts`.
      Implementado en `convex/botLlm.ts` (archivo con `"use node";`, separado de `bot.ts` por regla de Convex). SDK de Anthropic apuntando al endpoint compatible de MiniMax. Los 5 campos se declaran como `input_schema` de una tool + validación manual, no con el helper `zodOutputFormat` que menciona la decisión 3 del design (MiniMax no lo soporta con seguridad). `zod` queda como dependencia sin uso en este flujo.
- [x] 2.2 Diseñar el system prompt estático con reglas de dominio (zonas de Bogotá, actividades soportadas, no-gos de salud) y verificar la extracción de intenciones con casos de prueba conocidos.
      `SYSTEM` es estático (sin datos variables), enumera actividades y zonas de Bogotá e incluye la regla explícita de no mencionar salud/sedentarismo/ejercicio como obligación. La verificación con casos reales requiere un deployment vivo (fuera de alcance en esta sesión; no hay suite de tests en el repo).
- [x] 2.3 Conectar la salida del parser con una mutación interna que registre la intención en la tabla `intents` con `source: "whatsapp"` y estado `open` cuando `confident === true`.
      `procesarMensaje` llama a `internal.matching.registrarIntencionDeWhatsapp`, que inserta en `intents` con `status: "open"` y `source: "whatsapp"`.

## 3. Desambiguación Interactiva y Notificaciones

- [x] 3.1 Implementar módulo `convex/whatsapp.ts` para envío de mensajes de texto y mensajes interactivos de botones (máximo 3) vía WhatsApp API / Twilio.
      `enviarTexto` y `enviarBotones` (internalAction) vía Kapso (forma de la Cloud API de Meta). `enviarBotones` valida 1–3 botones y título ≤20 caracteres.
- [ ] 3.2 Implementar flujo de respuesta interactiva cuando `confident === false` (preguntar franja o actividad faltante con botones) y verificar la recepción del clic del usuario.
      PARCIAL. La rama `!confident` siempre manda los mismos 3 botones de actividad ("Caminar / Un café / Trabajar cerca"); nunca pregunta por la franja horaria ni la zona faltante. La recepción del clic sí funciona (`extraerMensajes` en `http.ts` extrae `buttonId` de `interactive.button_reply` y lo pasa como pista al LLM), pero un usuario al que solo le falta la franja recibe botones de actividad y puede entrar en bucle. Completar esto exige rediseñar la salida de extracción (confianza por campo o un campo `missing`) y ramificar los sets de botones — toca las decisiones 3 y 5 del design. Pendiente de decisión.
- [ ] 3.3 Implementar action `internal.whatsapp.notificarPlan` que envía mensaje de WhatsApp con los datos del plan (actividad, zona, hora, cantidad de asistentes) cuando Dev B concreta un match.
      El comportamiento del requisito "Notificación de plan concretado" YA está cubierto por `internal.notify.avisarMatch` (en `convex/notify.ts`, agendado desde `convex/matching.ts`), que envía por `internal.whatsapp.enviarTexto` un texto con actividad (título), zona, hora y cuántos van; el vencimiento sin match permanece en silencio. No existe una función con el nombre `internal.whatsapp.notificarPlan`. Crearla duplicaría `notify.avisarMatch` y no quedaría cableada sin tocar `matching.ts` (fuera de alcance: `matching.ts`/`notify.ts` son del change `match-de-intenciones`, ya cerrado). Pendiente de decisión sobre nombre/ubicación.

---

## Nota de arquitectura — separación de `bot.ts`

`bot.ts` importaba `@anthropic-ai/sdk` (usa `node:fs`/`node:path`) sin la directiva `"use node";` y a la vez exportaba una `internalMutation` (`recibirMensaje`) y una `internalAction`. Convex prohíbe que un archivo con `"use node";` exporte queries/mutations, y `npx convex codegen` fallaba al no poder resolver `node:fs`.

Resolución (cambio mínimo):
- `convex/bot.ts` — runtime por defecto. Solo `recibirMensaje` (internalMutation). Agenda `internal.botLlm.procesarMensaje`.
- `convex/botLlm.ts` — `"use node";` en la primera línea. `procesarMensaje` (internalAction) + el SDK de Anthropic y los helpers de extracción.
- `convex/http.ts` sigue llamando a `internal.bot.recibirMensaje` (sin cambio).
- Se eliminó `import { activity } from "./schema";` y el `export { activity };` del final de `bot.ts` (no aportaban).

Verificación: `npx convex codegen` y `npx tsc --noEmit -p convex/tsconfig.json` pasan limpios.
