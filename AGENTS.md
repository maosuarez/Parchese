# AGENTS.md — PulseUp

El contexto operativo completo vive en **[`CLAUDE.md`](./CLAUDE.md)**. Léelo primero.

## Resumen mínimo

**PulseUp es el repositorio de los planes de la ciudad, con dos puertas de entrada:** un bot de WhatsApp para quien ya sabe qué quiere, y una app web para quien quiere inspirarse o crear.

- **Fuente de verdad:** `docs/`. Si el código la contradice, el código está mal.
- **Backend:** Convex. Regla dura.
- **Método:** spec-driven con OpenSpec, nivel *spec-anchored*. Specs cortas, criterios en EARS.

## Las tres reglas que más se rompen

1. Una intención `open` **no se revela a nadie** hasta que hay match.
2. Si una intención vence sin match, **no se envía ningún mensaje**.
3. **Ningún copy sobre salud o sedentarismo.** Tiene evidencia de backfire.

La lista completa de reglas y no-gos está en `CLAUDE.md` y `docs/01-definicion-producto.md`.
