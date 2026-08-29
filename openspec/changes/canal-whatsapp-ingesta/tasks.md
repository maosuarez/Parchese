## 1. Webhook HTTP y Validación en Convex

- [ ] 1.1 Implementar ruta GET de suscripción Meta en `convex/http.ts` y verificar que responde `hub.challenge` ante el token correcto.
- [ ] 1.2 Implementar validación de firma HMAC-SHA256 sobre el buffer crudo del request POST y verificar rechazo con HTTP 401 ante firmas inválidas.
- [ ] 1.3 Implementar guardado inicial del payload crudo y encolamiento asíncrono con `ctx.scheduler.runAfter(0, internal.bot.procesarMensaje, { ... })` retornando HTTP 200 de inmediato.

## 2. Extracción Estructurada con LLM

- [ ] 2.1 Configurar el SDK de Anthropic y definir el schema Zod de intención (`activity`, `zone`, `hoursFromNow`, `durationHours`, `confident`) en `convex/bot.ts`.
- [ ] 2.2 Diseñar el system prompt estático con reglas de dominio (zonas de Bogotá, actividades soportadas, no-gos de salud) y verificar la extracción de intenciones con casos de prueba conocidos.
- [ ] 2.3 Conectar la salida del parser con una mutación interna que registre la intención en la tabla `intents` con `source: "whatsapp"` y estado `open` cuando `confident === true`.

## 3. Desambiguación Interactiva y Notificaciones

- [ ] 3.1 Implementar módulo `convex/whatsapp.ts` para envío de mensajes de texto y mensajes interactivos de botones (máximo 3) vía WhatsApp API / Twilio.
- [ ] 3.2 Implementar flujo de respuesta interactiva cuando `confident === false` (preguntar franja o actividad faltante con botones) y verificar la recepción del clic del usuario.
- [ ] 3.3 Implementar action `internal.whatsapp.notificarPlan` que envía mensaje de WhatsApp con los datos del plan (actividad, zona, hora, cantidad de asistentes) cuando Dev B concreta un match.
