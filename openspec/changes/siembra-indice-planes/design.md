## Context

Ver `proposal.md`, `docs/01-definicion-producto.md` y `docs/03-modelo-de-datos.md`. Este cambio implementa la base de datos de oferta existente e ingesta en `convex/sources/`.

## Goals / Non-Goals

**Goals:**
- Implementar `internalMutation` `seedBogotaPlans` que crea 15–20 planes con horarios relativos a la hora actual para pruebas en vivo.
- Declarar tablas `sources` y `demandSignals` en `convex/schema.ts`.
- Dejar la interfaz normalizadora lista para agregar scrapers o webhooks de fuentes externas.

**Non-Goals:**
- Scrapers complejos de Instagram o TikTok que requieran evadir bloqueos de API en esta fase.

## Decisions

### 1. Horarios calculados dinámicamente en la siembra
- **Decisión:** Los planes sembrados calculan sus `startsAt` sumando desplazamientos (ej. `now + 1h`, `now + 2h`, `now + 4h`) en vez de timestamps fijos en el pasado.
- **Razón:** Garantiza que la parrilla siempre muestre planes próximos y válidos sin importar el día u hora en que se ejecute la demostración.

### 2. Tablas desacopladas para oferta y demanda
- **Decisión:** `sources` maneja la oferta estructurada; `demandSignals` maneja expresiones de interés dispersas.
- **Razón:** Preserva el valor estratégico de saber qué busca la gente sin contaminar la lista de planes confirmados.

## Risks / Trade-offs

- **[Riesgo: Planes sembrados repetidos]** → La mutación de siembra puede limpiar planes previos con `origin: "seeded"` o verificar duplicados antes de insertar.
