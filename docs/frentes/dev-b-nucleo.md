# Dev B — El núcleo

> Tu entrega: **que dos intenciones compatibles produzcan un plan.**
> Esto es el wow moment del pitch. Es lo único que no se corta nunca.

---

## Archivos tuyos

```
convex/schema.ts      el contrato compartido — lo defines tú
convex/matching.ts    el match
convex/crons.ts       vencimiento y el empujón de las 7pm
convex/trust.ts       puntaje y niveles
```

**No toques:** `convex/http.ts`, `convex/bot.ts`, `web/`.

---

## Primera hora: el schema, con los tres presentes

El schema es el contrato del que dependen A y C. **Se define entre los tres en la primera hora y después se congela.**

Si necesitas cambiarlo más tarde, **dilo en voz alta**. Un cambio silencioso de schema a las 4pm es lo que rompe el día.

Base en `docs/03-modelo-de-datos.md`. Los índices que vas a necesitar:

```ts
intents:    .index("by_open", ["status", "activity", "zone"])
plans:      .index("by_time", ["startsAt", "zone"])
attendance: .index("by_user", ["userId", "status"])
```

---

## El match

Es una **mutation**, no una action. No hace red, es pura, y por eso es fácil de probar.

Cuando entra una intención nueva:

```
1. buscar intenciones con status "open"
   + misma activity
   + misma zone
   + ventanas que se solapen
2. si hay match → crear plan, marcar ambas "matched"
3. si no → dejarla "open" y no hacer nada más
```

**Solapamiento de ventanas:** dos ventanas se solapan si `aStart < bEnd && bStart < aEnd`. Cuidado con confundirlo con "empiezan a la misma hora" — no es lo mismo, y es el bug clásico aquí.

### La regla que no se puede inferir del código

**Una intención en `open` no se revela a NADIE.** No hay query pública que la exponga. Si escribes un `list` de intenciones abiertas y el cliente lo puede llamar, rompiste el producto — no es un detalle de privacidad, es el mecanismo central: *la invisibilidad del rechazo*.

Si nadie coincide, la persona nunca supo que "la rechazaron". Eso es lo que hace que se atreva a decir que quiere salir.

---

## Los crons

`convex/crons.ts`:

```ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();
crons.interval("vencerIntenciones", { minutes: 5 }, internal.matching.expire, {});
export default crons;
```

Tres trabajos:

1. **Vencer intenciones** — al pasar `windowEnd`, marcar `expired`.
   **Y no mandar ningún mensaje.** Misma razón que arriba.
2. **El empujón de las 7pm** — para después del demo. Necesita plantilla aprobada por Meta (ver el doc de Dev A).
3. **Recordatorio antes del plan** — a quien confirmó.

Para el día del hackathon, con el 1 basta.

---

## Puntaje y niveles

De `docs/02-confianza-y-progresion.md`:

| Evento | Efecto |
|---|---|
| Apareció (escaneó QR) | Sube |
| Confirmó y no apareció | Baja |
| Reporte de otra persona | Baja fuerte, puede revocar nivel 2 |

Niveles:
- **0** — eventos masivos, cualquiera
- **1** — lugar público, **mínimo 3 personas**, actividad concreta. Con teléfono verificado
- **2** — planes pequeños. Requiere historial

**`showed` solo se marca por escaneo de QR.** Nunca autoreportado — si no, el puntaje no vale nada.

**Nunca ranking global.** Comparación contra pares cercanos, si acaso.

Si el tiempo aprieta, esto se corta antes que el match. Pero deja los campos en el schema desde el principio para no migrar después.

---

## Cómo trabajar sin esperar a nadie

No esperes a que A tenga el bot listo. **Escribe un `internalMutation` de prueba** que inserte intenciones a mano:

```ts
export const seedIntent = internalMutation({ ... })
```

Con eso pruebas el match desde el dashboard de Convex en el minuto 20, sin WhatsApp, sin LLM, sin frontend. Y esa misma función es tu **plan B del demo** si el GPS o la red fallan en vivo.

---

## Gotchas

- **Mutations no pueden hacer `fetch`.** Si necesitas red, va en una action.
- **Las mutations sí son transaccionales y reintentan solas.** Las actions no. Por eso el match va en mutation.
- Agendar desde una mutation es atómico (todo o nada); desde una action, no.
- Una función puede agendar hasta 1000 funciones. No agendes en loop sin tope.

---

## Prohibido

- Compatibilidad de personalidad o afinidad calculada. **Coincidir en actividad, zona y franja ya basta.**
- Cualquier campo que mida energía, ánimo o sociabilidad de la persona.
- Ubicación exacta en tiempo real. **Zona aproximada, siempre.**
- Ranking global.

Contexto completo en `docs/01-definicion-producto.md`.
