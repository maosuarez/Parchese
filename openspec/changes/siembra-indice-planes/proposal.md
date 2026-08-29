# Propuesta — Siembra del Índice de Planes de Bogotá

## Why

Una parrilla vacía inutiliza la Puerta B e impide validar el interés del usuario (problema de arranque en frío). El índice de planes existentes en la ciudad permite que el producto tenga valor inmediato en "modo de un solo jugador". Este cambio proporciona la siembra estructurada de planes reales en Bogotá y el esquema para alimentar el índice continuo.

## What Changes

- **Tablas `sources` y `demandSignals` en Convex**: Definición de esquemas para ingesta externa y preservación separada de señales de demanda ("¿alguien va?").
- **Mutación de siembra manual (`convex/sources/seedBogota.ts`)**: Script/mutación que inserta 15 a 20 planes reales y variados de Bogotá (café, caminata, cowork, juegos, rodadas en zonas como Chapinero, Usaquén, Parque Virrey, Parkway) con `origin: "seeded"`.
- **Estructura para adaptadores de ingesta (`convex/sources/`):** Base normalizadora para recibir eventos desde fuentes externas (Luma, Eventbrite, etc.) transformándolos en registros de `plans`.

## Capabilities

### New Capabilities
- `plan-indexing-seed`: Siembra de planes iniciales reales de Bogotá y estructura de ingesta para fuentes y señales de demanda.

### Modified Capabilities
*(Ninguna)*

## No-gos

- **No mezclar señales de demanda con fuentes de oferta.** Los comentarios de "¿alguien va?" son señales de demanda y van estrictamente en `demandSignals`.
- **No depender de scrapers automáticos complejos para el funcionamiento base.** La siembra manual garantiza la disponibilidad inmediata.
- **Todos los planes sembrados deben ser en lugares públicos y con zonas aproximadas.**

## Impact

- Tablas `sources` y `demandSignals` en `convex/schema.ts`.
- Módulo `convex/sources/seedBogota.ts` ejecutable desde CLI o dashboard.
- Alimenta la parrilla de planes de la web app inmediatamente.
