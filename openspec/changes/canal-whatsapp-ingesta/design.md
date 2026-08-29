## Context

Ver `proposal.md` y `docs/frentes/dev-a-canal-whatsapp.md`. Este cambio implementa la Puerta A en Convex (`http.ts`, `bot.ts`, `whatsapp.ts`) para recibir mensajes de WhatsApp, extraer la intención del usuario y escribir en la tabla `intents`.

## Goals / Non-Goals

**Goals:**
- Implementar el endpoint HTTP de webhook en Convex con verificación de firma y suscripción Meta.
- Procesar mensajes de lenguaje natural de forma asíncrona mediante un LLM con esquema Zod estricto.
- Implementar fallback a botones interactivos de WhatsApp cuando falten parámetros (`confident: false`).
- Enviar notificaciones de match exitoso vía WhatsApp API / Twilio Sandbox.
- Cumplir el contrato de datos esperado por Dev B: `{ userId, activity, windowStart, windowEnd, zone, status: "open", source: "whatsapp" }`.

**Non-Goals:**
- Modificar `convex/schema.ts` o la lógica de matching en `convex/matching.ts`.
- Procesar audios o archivos multimedia pesados (límite httpAction 20MB).
- Automatizar campañas salientes periódicas de las 7pm (requieren plantillas aprobadas por Meta para producción).

## Decisions

### 1. Desacoplamiento total del Webhook y el LLM
- **Decisión:** El handler HTTP en `convex/http.ts` valida la firma, guarda el mensaje crudo, agenda el procesamiento con `ctx.scheduler.runAfter(0, ...)` y responde HTTP 200 inmediatamente (< 500ms).
- **Alternativa descartada:** Invocar al LLM directamente dentro del handler HTTP. Se descartó porque WhatsApp reintenta webhooks si no recibe 200 en pocos segundos, duplicando respuestas y costos de inferencia.

### 2. Validación de firma HMAC sobre cuerpo crudo
- **Decisión:** Extraer el buffer crudo de la solicitud antes de cualquier parseo JSON para computar el HMAC-SHA256 con el App Secret de Meta.
- **Razón:** La re-serialización de JSON altera espacios y orden de claves, invalidando la firma.

### 3. Extracción de intención estructurada con Zod en `internalAction`
- **Decisión:** Usar el helper `zodOutputFormat` del SDK de Anthropic (`claude-3-5-haiku` / `claude-3-7-sonnet`) para garantizar salida tipada:
  ```ts
  const Intencion = z.object({
    activity: z.enum(["caminar", "cafe", "cowork", "juego", "cancha", "otro"]),
    zone: z.string(),
    hoursFromNow: z.number(),
    durationHours: z.number(),
    confident: z.boolean(),
  });
  ```
- **Razón:** Elimina parsing frágil de expresiones regulares y permite detectar ambigüedades con el flag `confident`.

### 4. System prompt estático para maximizar caché de prompts
- **Decisión:** Mantener las instrucciones del bot y ejemplos fijos en el system prompt. Los datos variables (hora del mensaje, teléfono) se pasan en el contenido del mensaje de usuario.
- **Razón:** Reduce la latencia a la mitad y reduce drásticamente el costo de tokens.

### 5. Botones interactivos como fallback de ambigüedad
- **Decisión:** Cuando `confident === false`, enviar mensaje interactivo con máx. 3 botones (ej. "¿Cuándo? En 1h | Esta tarde | Noche").
- **Razón:** Los botones devuelven un ID determinista, eliminando la necesidad de re-interpretar texto libre.

## Risks / Trade-offs

- **[Riesgo: Timeout del LLM o falla de red externa]** → Se mitiga ejecutando en una `internalAction` con manejo explícito de errores y logging sin bloquear el webhook.
- **[Riesgo: Ventana de 24 horas de WhatsApp cerrada]** → Para el demo, el usuario siempre inicia la conversación (escaneando QR del cartel), lo que abre la ventana de 24h libre de plantillas.
- **[Riesgo: Twilio Sandbox requiere código `join`]** → Se documenta claramente en el material del demo para que los evaluadores envíen el comando previo al escaneo.
