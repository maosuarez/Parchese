# Propuesta — Pantalla de Proyección para Demo en Vivo

## Why

El momento culminante ("wow moment") del pitch y la demostración es que el público le escriba al bot de WhatsApp y vea aparecer los planes formándose en vivo en el proyector sin necesidad de recargar la página. Esta vista especializada maximiza el impacto visual del pitch ante los jueces.

## What Changes

- **Ruta dedicada para proyector (`web/src/routes/demo.tsx` o `/live`)**: Pantalla diseñada específicamente para ser proyectada y leída a 5 metros de distancia.
- **Suscripción reactiva en tiempo real**: Uso de live queries de Convex (`useQuery(api.plans.recentMatches)`) para actualizar automáticamente el feed sin refrescar.
- **Animaciones de entrada de planes**: Efectos visuales de transición cuando nace un nuevo plan producto de un match de WhatsApp.
- **Contadores de métricas en vivo**: Indicadores en pantalla grande con total de intenciones procesadas y total de planes/matches concretados.
- **Diseño sin scroll (viewport fixed)**: Todo el contenido crítico organizado para caber exactamente en la pantalla proyectada (1080p).

## Capabilities

### New Capabilities
- `live-demo-screen`: Vista interactiva reactiva en tiempo real para proyectores con contadores y animaciones de planes creados por match.

### Modified Capabilities
*(Ninguna)*

## No-gos

- **No exponer datos personales ni números de teléfono completos en el proyector.**
- **No exponer intenciones individuales en estado `open`.** Solo mostrar planes creados tras el match exitoso.
- **No incluir barras de scroll vertical ni elementos pequeños ilegibles a distancia.**

## Impact

- Nueva ruta en `web/src/routes/demo.tsx`.
- Endpoint de consulta en Convex: `api.plans.recent` / `api.stats.liveMetrics`.
- Animaciones con Tailwind CSS / Framer Motion.
