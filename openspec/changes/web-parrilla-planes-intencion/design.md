## Context

Ver `proposal.md` y `docs/frentes/dev-c-cara-visible.md`. Este cambio actualiza la aplicación web en `web/` para conectarse a Convex y servir como la Puerta B (visual/inspiración).

## Goals / Non-Goals

**Goals:**
- Configurar el cliente React de Convex (`ConvexProvider`) en `web/src/`.
- Reemplazar las importaciones de `web/src/mock/data.ts` por hooks `useQuery(api.plans.listUpcoming)`.
- Diseñar tarjetas de planes enfatizando señales previas al compromiso ("X personas van · dura Y min").
- Botón "Yo voy" que invoca mutación `createIntent` o `joinPlan`.
- Limpiar el tipo `SocialBattery` renombrándolo o redefiniéndolo como `planIntensity: "chill" | "moderate" | "high"`.
- Ocultar rutas no funcionales del layout de navegación.

**Non-Goals:**
- No incluye la pantalla especializada para proyector/pitch (cubierta en `web-live-demo-pantalla`).
- No incluye mapas con estilos hiper-personalizados que consuman tiempo de desarrollo.

## Decisions

### 1. Reemplazo directo de mock data por hooks reactivos
- **Decisión:** En lugar de reescribir toda la UI, conservar los componentes de shadcn/Radix y TanStack Router conectando sus props a la salida de `useQuery`.
- **Razón:** Acelera el desarrollo en menos de 2 horas manteniendo la estética ya construida.

### 2. Formato del texto de convocatoria
- **Decisión:** Renderizar explícitamente `"${asistentes} personas ya van · ${duracionMin} min"` en el encabezado de la tarjeta.
- **Razón:** La evidencia de producto demuestra que este formato disminuye la fricción del *liking gap*.

### 3. Redefinición de tipos en `web/src/types/index.ts`
- **Decisión:** Reemplazar el enum `SocialBattery` asociado al perfil por `PlanIntensity` asociado al `Plan`.
- **Razón:** Cumple con la regla estricta de no patologizar ni medir la energía del usuario.

## Risks / Trade-offs

- **[Riesgo: App sin planes iniciales]** → Dev C puede insertar planes de prueba manualmente en el dashboard de Convex o depender del cambio `siembra-indice-planes`.
- **[Riesgo: Autenticación pesada frena al usuario]** → Para el demo web, el usuario solo ingresa su teléfono/nombre para crear la intención sin login OAuth complejo.
