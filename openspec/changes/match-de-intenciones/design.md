# Diseño — Match de intenciones

## Dónde vive

```
convex/schema.ts      tablas intents y plans
convex/matching.ts    el match, el vencimiento
convex/crons.ts       el disparo periódico del vencimiento
```

Dueño: **Dev B**. Ver `docs/frentes/dev-b-nucleo.md`.

## Decisión central: el match es una mutation, no una action

En Convex las mutations son transaccionales y reintentan solas; las actions no, y además pueden hacer red. El match no necesita red: es lectura y escritura de la base.

Ponerlo en mutation da atomicidad gratis — dos intenciones no pueden emparejarse dos veces por una carrera. Y lo vuelve trivial de probar, porque no depende del LLM ni de WhatsApp.

La notificación sí necesita red, así que se agenda: `ctx.scheduler.runAfter(0, ...)` hacia una action. Agendar desde una mutation es atómico — si la transacción falla, la notificación no se dispara.

## Índice

```ts
intents: defineTable({ ... })
  .index("by_open", ["status", "activity", "zone"])
```

El match consulta por `status: "open"` + actividad + zona, y filtra el solapamiento de ventana en memoria. El volumen por combinación es bajo; no hace falta más.

## El solapamiento

```ts
const solapan = (a, b) => a.windowStart < b.windowEnd && b.windowStart < a.windowEnd;
```

Es el punto donde más fácil se mete un bug. No es "empiezan a la misma hora".

## Invisibilidad — cómo se garantiza

No hay ninguna query pública que lea `intents` con `status: "open"` de otra persona. La consulta del match vive dentro de la mutation y su resultado nunca sale hacia el cliente.

Toda query que exponga intenciones debe filtrar por autor. **Esta es la regla que más fácil se rompe sin darse cuenta**, por ejemplo agregando un contador de "cuánta gente quiere caminar hoy" — que también la viola.

## Vencimiento

Cron cada 5 minutos que marca `expired` las intenciones abiertas cuya ventana ya pasó. No manda nada.

Un cron es suficiente: un retraso de hasta cinco minutos en marcar el vencimiento no tiene efecto observable, porque el vencimiento no notifica.

## Alternativas descartadas

- **Match en action con búsqueda vectorial.** Innecesario: el emparejamiento es por igualdad exacta de actividad y zona, no por similitud semántica. La interpretación del lenguaje natural ocurre antes, al extraer la intención (Dev A).
- **Emparejar en el cron en vez de al insertar.** Añadiría hasta cinco minutos de latencia al momento que es el wow moment del demo.
- **Marcar el vencimiento con `scheduler.runAt` por intención.** Funciona, pero llena el scheduler y complica la cancelación cuando la intención se empareja antes.

## Cómo se prueba sin el resto del sistema

Un `internalMutation` que inserta intenciones a mano permite probar el match desde el dashboard de Convex sin WhatsApp, sin LLM y sin frontend. Esa misma función es el plan B del demo si la red falla en vivo.
