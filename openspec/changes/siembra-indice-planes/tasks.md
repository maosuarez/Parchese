## 1. Esquema de Ingesta en Convex

- [ ] 1.1 Declarar tablas `sources` y `demandSignals` en `convex/schema.ts` según `docs/03-modelo-de-datos.md` y verificar que el schema compile.

## 2. Siembra Inicial de Planes de Bogotá

- [ ] 2.1 Crear archivo `convex/sources/seedBogota.ts` con catálogo de 15 a 20 planes representativos en zonas clave (Chapinero, Usaquén, Parkway, Virrey).
- [ ] 2.2 Implementar mutación `seedBogotaPlans` que calcule timestamps relativos a `Date.now()` e inserte los planes en la tabla `plans`.
- [ ] 2.3 Ejecutar la mutación desde Convex y verificar en el dashboard que los planes aparecen con todos sus campos obligatorios (`activity`, `venueId`/lugar público, `startsAt`, `duration`, `requiredTrustLevel`).
