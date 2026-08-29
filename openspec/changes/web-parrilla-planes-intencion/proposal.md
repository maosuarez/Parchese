# Propuesta — Parrilla de Planes y Puerta Web de Intenciones

## Why

La puerta visual (Puerta B) está pensada para personas que quieren salir pero no saben qué quieren y necesitan inspirarse viendo planes reales. La web actual usa datos falsos (`mock/data.ts`) y tipos obsoletos. Este cambio conecta la app web a Convex, muestra la parrilla de planes cercanos organizados por hora con señal previa de compromiso ("X van, dura Y min") y permite declarar la intención tocando "Yo voy".

## What Changes

- **Integración Convex en TanStack Start (`web/src/lib/convex.ts`)**: Reemplazo de `web/src/mock/data.ts` por `useQuery` reactivo de Convex para consumir la tabla `plans`.
- **Parrilla de planes por hora**: Visualización de planes ordenados cronológicamente, mostrando actividad, zona aproximada, duración y contador de asistentes confirmados para mitigar el *liking gap*.
- **Acción "Yo voy"**: Al interactuar con un plan o actividad, se inserta una intención en `intents` con `source: "web"`, unificándose con el motor de matching.
- **Corrección de `SocialBattery`**: Ajuste del tipo en `web/src/types/index.ts` para que mida estrictamente la **intensidad del plan** (ej. tranquilo, moderado, intenso) y nunca la energía o ánimo de la persona.
- **Limpieza de rutas huérfanas**: Ocultar del menú de navegación las rutas `rewards` y `business` que no tienen datos reales o contradicen los principios del producto (regla del demo: nada roto en pantalla).

## Capabilities

### New Capabilities
- `web-plans-feed`: Parrilla reactiva de planes con contador de asistentes, creación de intención "Yo voy" vía Convex y filtrado por zona aproximada.

### Modified Capabilities
*(Ninguna)*

## No-gos

- **Ningún copy sobre salud, sedentarismo o culpa.**
- **`SocialBattery` nunca debe evaluar el estado psicológico o físico del usuario.** Solo describe qué tan movida es la actividad.
- **No mostrar rutas o botones que no funcionen en el demo** (`rewards` queda fuera).
- **Nunca mostrar ubicación exacta en tiempo real.** Solo zonas públicas y aproximadas.
- **No mostrar intenciones individuales en estado `open`.** Solo planes ya generados o agregados de asistencia en planes concretos.

## Impact

- Modificación de componentes en `web/src/routes/*` y `web/src/features/*`.
- Corrección de interfaces en `web/src/types/index.ts`.
- Consumo de `api.plans.listUpcoming` y `api.intents.createWebIntent`.
