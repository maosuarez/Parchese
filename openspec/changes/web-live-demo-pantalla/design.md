## Context

Ver `proposal.md` y `docs/frentes/dev-c-cara-visible.md`. Este cambio implementa la pantalla del pitch en la web app (`web/src/routes/demo.tsx`), diseñada específicamente para proyectar ante evaluadores mientras se demuestra el bot en vivo.

## Goals / Non-Goals

**Goals:**
- Pantalla a pantalla completa (`h-screen overflow-hidden`), tipografía grande, alto contraste.
- Live query `useQuery(api.plans.recentMatches)` que devuelve los últimos N planes creados por match.
- Animación de entrada fluida (CSS transitions o Framer Motion) cuando aparece un nuevo elemento.
- Contador superior con números gigantes de planes creados.

**Non-Goals:**
- No incluye formularios de edición ni controles interactivos de usuario final; es una vista puramente de exhibición.

## Decisions

### 1. Viewport Fixed sin scroll
- **Decisión:** Diseñar la vista en un grid de 100vh donde caben los 4–5 planes más recientes y los contadores en la parte superior.
- **Razón:** En una proyección a 5 metros, el scroll manual distrae y rompe la narrativa del presentador.

### 2. Live Queries nativas de Convex
- **Decisión:** Aprovechar la reactividad WebSocket nativa de Convex sin implementar sockets propios ni polling con `setInterval`.
- **Razón:** Cero latencia percibida entre el mensaje de WhatsApp y la aparición del plan en pantalla.

## Risks / Trade-offs

- **[Riesgo: Demasiados planes saturan la vista]** → Se limita la consulta a los 5 planes más recientes (`.take(5)`), descartando visualmente los más antiguos de forma suave.
