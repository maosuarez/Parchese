# Índice de Bogotá — ingesta por Apify

> Spec: `openspec/changes/ingesta-apify-eventos/`.
> El scraping vive en Apify. Convex solo recibe el webhook, persiste crudo y
> normaliza a `plans` de forma asíncrona. **Nada de navegadores headless en Convex.**

---

## Archivos

```
convex/http.ts                 ruta POST /webhook/apify (verificación + agendado)
convex/sources/apify.ts        ingesta transaccional, descarga de dataset, mutaciones de siembra
convex/sources/normalize.ts    acción con LLM (MiniMax) que estructura y crea el plan
convex/schema.ts               índice sources.by_external para la idempotencia
scripts/probar-apify-webhook.mjs  prueba end-to-end sin depender de Apify
```

---

## Variables de entorno (Convex)

```bash
cd web
npx convex env set APIFY_WEBHOOK_SECRET <secreto-largo-aleatorio>   # obligatorio
npx convex env set APIFY_API_TOKEN      <token-de-apify>            # opcional: solo si el webhook manda defaultDatasetId
# MINIMAX_API_KEY / MINIMAX_MODEL ya están (los usa el bot); la normalización los reutiliza.
```

Sin `APIFY_WEBHOOK_SECRET` el webhook **falla cerrado**: responde 401 a todo.

---

## Configurar el webhook en Apify

En el Actor o la Tarea → **Integrations → Webhooks → Add webhook**:

- **URL:** `https://<deployment>.convex.site/webhook/apify?token=<APIFY_WEBHOOK_SECRET>`
  (`.convex.site`, no `.convex.cloud`). El secreto también se acepta como
  header `Authorization: Bearer <secreto>`.
- **Event types:** `ACTOR.RUN.SUCCEEDED`.
- **Payload template:** añade al nivel superior:
  ```json
  {
    "platform": "luma",
    "canal": "oferta",
    "resource": {{resource}}
  }
  ```
  - `platform`: `luma` · `eventbrite` · `maps` · `instagram` · … (de dónde salió).
  - `canal`: `oferta` (eventos estructurados → `sources`) o `demanda`
    (comentarios y menciones → `demandSignals`). Por defecto `oferta`.
  - Para corridas chicas puedes mandar `{ "items": [...] }` en vez de `resource`.

---

## Flujo

1. `POST /webhook/apify` valida el secreto, agenda y responde 200 (< 5 s).
2. `ingestarLoteApify` guarda cada item en `sources` (`status: "pending"`,
   deduplicado por `externalId`) o en `demandSignals`. Si entró oferta nueva,
   agenda la normalización.
3. `normalizarFuentesPendientes` filtra en seco lo que no tiene título ni
   fecha, pide a MiniMax `{ activity, zone, startsAtISO, … }`, valida
   (fecha futura, zona de Bogotá, lugar público) y llama a
   `guardarPlanNormalizado`.
4. `guardarPlanNormalizado` vincula o crea el `venue` (`isPublic: true`), crea
   el `plan` (`origin: "seeded"`, `requiredTrustLevel: 0`, `qrToken`) y marca la
   fuente `normalized`. Lo inválido o fuera de Bogotá queda `discarded` sin
   crear plan.

---

## Probar sin Apify

```bash
cd web
APIFY_WEBHOOK_SECRET=<el-mismo-de-convex> node scripts/probar-apify-webhook.mjs
```

Manda un lote simulado, comprueba 401 con token malo, 200 e idempotencia con
token bueno, y consulta Convex para verificar que los planes quedaron con fecha
futura y lugar público.

---

## Prohibido (viene de evidencia, no de gusto)

- Correr scrapers o navegadores headless dentro de Convex.
- Invocar scraping en el camino síncrono del usuario (WhatsApp o web).
- Mezclar oferta y demanda en la misma tabla.
- Planes en residencias o lugares privados, o con fecha en el pasado.
