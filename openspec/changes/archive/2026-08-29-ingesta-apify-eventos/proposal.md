## Why

El catálogo de planes de Parchese necesita nutrirse continuamente de eventos reales en Bogotá (Luma, Eventbrite, Google Places, Instagram) sin saturar el backend transaccional de Convex con la complejidad, memoria y fragilidad de navegadores headless (*Playwright/Puppeteer*) o proxies residenciales. Integrar Apify mediante webhooks y acciones asíncronas de normalización permite una ingesta continua, desacoplada y escalable que alimenta las tablas `sources`, `demandSignals` y `plans` de forma limpia.

## What Changes

- **Endpoint de Webhook de Apify (`/webhook/apify`)**: Nueva ruta en `convex/http.ts` protegida por secreto/token (`APIFY_WEBHOOK_SECRET`) que recibe payloads de finalización de Actores de Apify de forma segura y no bloqueante.
- **Ingesta en tablas base (`sources` y `demandSignals`)**: Registro transaccional del contenido crudo (`rawPayload`) asociando la plataforma de origen (`luma`, `eventbrite`, `instagram`, `maps`), garantizando idempotencia frente a reintentos.
- **Módulo de Normalización Asíncrona (`convex/sources/normalize.ts`)**: Acción de Convex que procesa elementos en estado `pending`, estructurando mediante LLM (MiniMax) la actividad (`activity`), zona de Bogotá (`zone`), fecha/hora (`startsAt`), aforo y vinculación a `venues` públicos.
- **Creación automática de Planes y Venues**: Generación de filas en `plans` con `origin: "seeded"`, estado `pending` o `active`, y generación de `qrToken` para habilitar el check-in físico posterior.

## Capabilities

### New Capabilities
- `apify-ingest`: Recepción de lotes vía Webhook de Apify, persistencia cruda en `sources`/`demandSignals` y pipeline asíncrono de normalización hacia `plans` y `venues`.

### Modified Capabilities
*(Ninguna)*

## No-gos

- **No correr scrapers ni navegadores headless dentro de Convex**: Todo el raspado y evasión antibot se ejecuta exclusivamente en la infraestructura de Apify.
- **No invocar scraping en el camino síncrono del usuario**: La ingesta es 100% asíncrona / batch y nunca bloquea las interacciones de WhatsApp ni la navegación web.
- **No mezclar oferta con demanda**: Comentarios y menciones van estrictamente a `demandSignals`; eventos estructurados van a `sources`.
- **No incluir ubicaciones privadas**: Todos los planes y venues resultantes deben ser en espacios públicos verificables con zona aproximada.

## Impact

- **Backend (`web/convex/`)**:
  - Actualización de `http.ts` con la ruta `/webhook/apify`.
  - Creación de `convex/sources/apify.ts` (ingesta transaccional) y `convex/sources/normalize.ts` (acción LLM y normalización).
  - Variables de entorno en Convex: `APIFY_WEBHOOK_SECRET` y opcionalmente `APIFY_API_KEY`.
