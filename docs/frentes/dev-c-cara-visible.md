# Dev C — La cara visible

> Tu entrega: **que un plan creado en Convex aparezca solo en pantalla, sin recargar.**
> Eso es lo que el jurado va a ver. Sin esto no hay demo.

---

## Archivos tuyos

```
web/src/routes/*      las pantallas
web/src/features/*    la lógica de UI
convex/sources/       la siembra del índice
```

**No toques:** `convex/schema.ts`, `convex/matching.ts`, `convex/http.ts`, `convex/bot.ts`.

---

## Lo que ya existe

El prototipo tiene rutas hechas: `index`, `map`, `missions`, `rewards`, `profile`, `business`, `landing`. Los datos salen de `web/src/mock/data.ts`.

**Tu primer trabajo es cambiar la fuente, no las pantallas.** De `mock/data.ts` a `useQuery` de Convex.

---

## Lo más importante que vas a hacer: la pantalla del demo

El wow moment del pitch es **ver los matches formándose en vivo** mientras el público le escribe al bot.

Y aquí tienes una ventaja enorme: **las live queries de Convex hacen esto casi gratis.** Un `useQuery` se re-renderiza solo cuando cambia la base de datos. No necesitas websockets, ni polling, ni refrescar.

```tsx
const planes = useQuery(api.plans.recent);
// cuando el match crea un plan, esto se actualiza solo
```

Diséñala pensando en **un proyector, a 5 metros de distancia**:
- Texto grande
- Los planes nuevos entran con animación — el movimiento es lo que el jurado nota
- Un contador visible: cuántas intenciones, cuántos matches
- Sin scroll: lo que importa cabe en pantalla

Esta pantalla vale más que el mapa bonito. Si tienes que elegir, haz esta.

---

## La parrilla y el mapa

Es la **puerta B** del producto: para quien no sabe qué quiere y necesita inspirarse.

- Parrilla de planes cercanos, ordenados por hora
- **Mostrar cuántos van** — no "hay un evento", sino "3 personas ya van, dura 45 min". Esto no es decoración: es el mecanismo que ataca el *liking gap*, la barrera real del producto
- Tocar "yo voy" crea una intención — **la misma tabla que escribe el bot de WhatsApp**

Para el mapa: **usa un mapa base sin personalizar.** Está en la lista de rabbit holes; el estilo propio no suma puntos y come horas.

---

## La siembra del índice

Sin planes, la parrilla está vacía y el demo se ve muerto. Y esto tiene un valor estratégico: **la parrilla funciona aunque no haya un solo usuario más** — es lo que resuelve el arranque en frío.

**Orden de esfuerzo:**

1. **A mano primero.** 15 o 20 planes reales de Bogotá metidos a mano. Media hora, cero riesgo, y desbloquea todo lo demás.
2. **Después, UNA fuente automática.** Luma o Eventbrite, que tienen estructura predecible. No intentes Instagram ni TikTok hoy.

El scraping automático es lo primero que se corta si aprieta el tiempo. **La siembra manual no se corta**, porque sin ella no hay pantalla que mostrar.

Va en un cron o en un `internalAction` manual — pide ayuda a Dev B para engancharlo si no has tocado Convex.

---

## Cómo trabajar sin esperar a nadie

No esperes a que exista el match. **Mete planes a mano en el dashboard de Convex** y construye la UI contra esos datos reales desde el minuto 20.

Cuando el match de Dev B empiece a crear planes, tu pantalla ya va a estar lista para mostrarlos — sin cambiar una línea.

---

## Prohibido (viene de evidencia, no de gusto)

- **`SocialBattery` hoy mide el estado de la persona** (`web/src/types/index.ts`). Si lo conservas, tiene que medir **intensidad del plan** — qué tan movido es. Nunca el nivel de energía del usuario: tiene evidencia experimental de backfire.
- **Ningún texto sobre salud, sedentarismo o que la persona debería salir más.** Ninguno.
- **Rewards y ranking global**: fuera de este ciclo. La ruta `rewards` existe — déjala escondida, no la muestres en el demo.
- **Nunca mostrar ubicación exacta de una persona.** Zona aproximada.

---

## Regla del demo

**Todo lo que no esté terminado, fuera de la pantalla.**

El criterio que más pesa en la rúbrica es "demostración cerrada sin caminos incompletos" — vale 30%. Una ruta que muestra datos falsos o un botón que no hace nada cuesta más puntos de lo que suma tenerla.

Si `rewards` o `business` no están conectadas a datos reales, **quítalas del menú antes del pitch.**

---

Contexto completo en `docs/01-definicion-producto.md`.
