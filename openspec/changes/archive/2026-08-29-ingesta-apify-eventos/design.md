## Context

Ver `proposal.md`, `specs/apify-ingest/spec.md`, `docs/01-definicion-producto.md` y `docs/03-modelo-de-datos.md`.

El backend de Parchese corre en Convex y cuenta con las tablas `sources` (oferta externa cruda), `demandSignals` (señales sociales de demanda) y `plans` (planes de la ciudad). Apify ejecuta actores en la nube para extraer información de Luma, Eventbrite, Google Places e Instagram, entregando los resultados vía Webhook a Convex.

## Goals / Non-Goals

**Goals:**
- Implementar la ruta HTTP `/webhook/apify` en `web/convex/http.ts` con validación de secreto (`APIFY_WEBHOOK_SECRET`).
- Implementar la mutación interna `ingestarLoteApify` para persistir elementos en `sources` o `demandSignals` deduplicando por `externalId`.
- Implementar la acción interna de normalización `normalizarFuentesPendientes` que estructurará los eventos usando el LLM (MiniMax) y creará los registros en `plans` y `venues`.
- Garantizar que todo plan generado tenga `origin: "seeded"`, horario futuro, `qrToken` criptográfico y espacio público verificado.

**Non-Goals:**
- Ejecutar navegadores o scripts de crawling dentro de Convex (100% delegado a Apify).
- Polling constante de datasets si el webhook push está activo.
- Extracción de perfiles o mensajes privados.

## Decisions

### 1. Webhook Push desacoplado de la Normalización
- **Decisión:** El endpoint HTTP `/webhook/apify` valida la firma/token, guarda el payload crudo en `sources` (`status: "pending"`) o `demandSignals` mediante una mutación interna, responde `HTTP 200` de inmediato y agenda la normalización con `ctx.scheduler.runAfter(0, ...)`.
- **Razón:** Apify exige confirmación rápida del webhook (<10s). Procesar el LLM en línea bloquearía la respuesta y causaría reintentos innecesarios.
- **Alternativas consideradas:** Polling por cron en Convex (descartado por consumo redundante de llamadas a la API de Apify).

### 2. Formato de Ingesta (Payload directo vs Dataset ID)
- **Decisión:** Soportar dos modos de payload en el webhook:
  1. *Lote directo:* `{ items: [...] }` para ejecuciones ligeras (< 50 items).
  2. *Dataset Reference:* `{ eventType: "ACTOR.RUN.SUCCEEDED", resource: { defaultDatasetId: "..." } }` donde la acción descarga los items desde la API de Apify si el lote es grande.
- **Razón:** Protege el límite de tamaño de la `httpAction` de Convex (máximo 20MB) mientras mantiene simplicidad para ejecuciones pequeñas.

### 3. Normalización con LLM (MiniMax) y Validación Determinista
- **Decisión:** La acción `normalizarFuentesPendientes` invoca a MiniMax para extraer `{ activity, zone, startsAt, durationMinutes, venueName, address, minPeople }` y aplica validación determinista:
  - `startsAt` debe ser futuro (si viene sin hora o en el pasado, se ajusta a un horario próximo válido).
  - `zone` se normaliza a las zonas oficiales de Bogotá.
  - Se vincula o crea un registro en `venues` con `isPublic: true`.
- **Razón:** Los eventos web tienen formatos libres y caóticos; el LLM los mapea al enum cerrado de Parchese con alta fidelidad.

### 4. Idempotencia y Deduplicación
- **Decisión:** Usar `externalId` (combinación de plataforma + id externo o url de origen) indexado en `sources` para evitar re-insertar el mismo evento en ejecuciones consecutivas del Actor.

## Risks / Trade-offs

- **[Riesgo: Consumo excesivo de tokens LLM al normalizar eventos irrelevantes]** → *Mitigación:* Filtro determinista previo (descartar eventos sin fecha o fuera de Bogotá antes de llamar al modelo).
- **[Riesgo: Actor de Apify genera eventos con fechas en el pasado]** → *Mitigación:* El normalizador descarta o ajusta dinámicamente eventos según la política del catálogo.
- **[Riesgo: Caída de créditos en Apify]** → *Mitigación:* La mutación local de siembra `seedBogotaPlans` permanece como respaldo autónomo para desarrollo y demos.

## Migration Plan

1. Definir variable de entorno `APIFY_WEBHOOK_SECRET` y opcionalmente `APIFY_API_TOKEN` en el deployment de Convex.
2. Configurar la URL `https://<deployment>.convex.site/webhook/apify` en la configuración de webhooks del Actor o Tarea de Apify.
