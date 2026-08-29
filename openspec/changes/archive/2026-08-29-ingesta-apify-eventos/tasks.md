## 1. Configuración y Endpoint HTTP Webhook

- [x] 1.1 Agregar la ruta `/webhook/apify` en `web/convex/http.ts` con verificación de secreto `APIFY_WEBHOOK_SECRET` y agendamiento asíncrono. Verificar con `curl` respondiendo 401 si no hay secreto y 200 con autenticación válida.
- [x] 1.2 Configurar variables de entorno y documentación de despliegue (`APIFY_WEBHOOK_SECRET`).

## 2. Ingesta Transaccional e Idempotencia

- [x] 2.1 Crear `web/convex/sources/apify.ts` con la mutación interna `ingestarLoteApify` para guardar en `sources` (`status: "pending"`) o `demandSignals`, deduplicando por `externalId`. Verificar que llamadas duplicadas no creen registros repetidos.
- [x] 2.2 Implementar soporte en `internalAction` para descargar items desde la API de Apify cuando el payload incluya referencia a `defaultDatasetId`.

## 3. Pipeline de Normalización Asíncrona (LLM + Convex)

- [x] 3.1 Crear `web/convex/sources/normalize.ts` con la acción interna `normalizarFuentesPendientes` que invoca al LLM (MiniMax) para clasificar actividad, zona de Bogotá y horario. Verificar que la extracción mapee al enum de actividades de Parchese.
- [x] 3.2 Implementar la mutación interna `guardarPlanNormalizado` para crear o asociar el registro en `venues` (`isPublic: true`), crear el registro en `plans` con `origin: "seeded"` y `qrToken` generado, y marcar la fuente como `normalized`.
- [x] 3.3 Manejar descarte de fuentes inválidas o fuera de Bogotá actualizando su estado a `discarded` sin insertar planes vacíos.

## 4. Pruebas y Verificación End-to-End

- [x] 4.1 Crear script de prueba `web/scripts/probar-apify-webhook.mjs` que envíe un payload simulado de Apify y verificar en Convex que los planes se creen correctamente con fechas futuras y lugares públicos.
- [x] 4.2 Ejecutar chequeo de tipos TypeScript (`tsc --noEmit`) en `web/` para confirmar consistencia en todo el backend de Convex.
