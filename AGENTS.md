# AGENTS.md — Parchese

El contexto operativo completo vive en **[`CLAUDE.md`](./CLAUDE.md)**. Léelo primero.

## Resumen mínimo

**Parchese es el repositorio de los planes de la ciudad, con dos puertas de entrada:** un bot de WhatsApp para quien ya sabe qué quiere, y una app web para quien quiere inspirarse o crear.

- **Fuente de verdad:** `docs/`. Si el código la contradice, el código está mal.
- **Backend:** Convex. Regla dura.
- **Método:** spec-driven con OpenSpec, nivel *spec-anchored*. Specs cortas, criterios en EARS.

## Las tres reglas que más se rompen

1. Una intención `open` **no se revela a nadie** hasta que hay match.
2. Si una intención vence sin match, **no se envía ningún mensaje**.
3. **Ningún copy sobre salud o sedentarismo.** Tiene evidencia de backfire.

La lista completa de reglas y no-gos está en `CLAUDE.md` y `docs/01-definicion-producto.md`.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
