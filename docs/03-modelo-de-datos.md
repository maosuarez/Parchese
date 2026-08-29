# Modelo de datos — Convex

> Convex es la única regla de backend del proyecto.
> Este documento define el esquema y por qué cada decisión está donde está.

---

## Por qué Convex encaja aquí

No es una preferencia de stack: el producto es **reactivo por naturaleza**.

- **Live queries** — cuando entra una intención compatible, el match se dispara solo. Sin polling, sin cron de matching, sin websockets a mano.
- **Scheduled functions** — cubren las tres cosas que el producto necesita en el tiempo: el empujón de las 7pm, el vencimiento de intenciones a las 2–4 horas, y el recordatorio antes del plan.
- **Actions** — donde vive todo lo que sale del sistema: la llamada a WhatsApp, el modelo que interpreta el mensaje libre, y los scrapers del índice.

---

## Esquema

### `users`
Deliberadamente mínimo. **No hay onboarding pesado.**

| Campo | Tipo | Nota |
|---|---|---|
| `phone` | string | Verificado. Es la identidad base |
| `name` | string | |
| `city` / `zone` | string | Zona aproximada, no coordenada exacta |
| `trustLevel` | 0 \| 1 \| 2 | Ver `02-confianza-y-progresion.md` |
| `score` | number | Cumplimiento, no sociabilidad |
| `extendedProfile` | opcional | Redes y contacto. **Solo se revela por opt-in tras un match** |

### `intents`
El corazón del sistema. **Ambas puertas escriben aquí.**

| Campo | Tipo | Nota |
|---|---|---|
| `userId` | id | |
| `activity` | enum | Caminar, café, cowork, juego, cancha… |
| `windowStart` / `windowEnd` | number | La ventana de 2–4 horas |
| `zone` | string | |
| `status` | `open` \| `matched` \| `expired` | |
| `source` | `whatsapp` \| `web` | Solo para métricas |

**Regla crítica:** mientras una intención esté `open`, **no se revela a ningún otro usuario**. Esa es la invisibilidad del rechazo, y es una decisión de producto, no técnica.

### `plans`
El plan concreto, ya sea sembrado o generado por match.

| Campo | Tipo | Nota |
|---|---|---|
| `title`, `activity` | | |
| `venueId` | id | Siempre lugar público |
| `startsAt`, `duration` | number | |
| `capacity`, `minPeople` | number | `minPeople: 3` en nivel 1 |
| `requiredTrustLevel` | 0 \| 1 \| 2 | Filtra quién lo ve |
| `origin` | `seeded` \| `organizer` \| `matched` | |
| `sourceUrl` | opcional | Si vino del índice, de dónde |

### `attendance`
Lo que alimenta la escalera de confianza.

| Campo | Tipo | Nota |
|---|---|---|
| `userId`, `planId` | id | |
| `status` | `going` \| `confirmed` \| `showed` \| `noShow` | |
| `checkedInAt` | opcional | Sello del QR. **`showed` solo se marca por escaneo**, nunca autoreportado |

### `matches`
Producto del escaneo en el plan.

| Campo | Tipo | Nota |
|---|---|---|
| `planId`, `userA`, `userB` | id | |
| `revealedByA` / `revealedByB` | boolean | Opt-in independiente por cada lado |

El perfil extendido de A solo es visible para B si `revealedByA` es verdadero. Por persona, por match, después del encuentro.

### `organizers` · `venues`
El lado que paga.

- `organizers` — dueños de comunidad. Publican planes.
- `venues` — negocios. Lo importante: la **atribución de llegadas verificadas por QR**, que es lo que hace posible cobrar por resultado y no por aparecer.

### `sources`
El índice. Lo que se scrapea y de dónde.

| Campo | Nota |
|---|---|
| `platform` | luma, eventbrite, instagram, tiktok, maps… |
| `rawPayload` | Lo crudo, antes de normalizar |
| `status` | pendiente / normalizado / descartado |

### `demandSignals`
Los comentarios de «¿alguien va?». **Tabla aparte a propósito.**

Son señal de **demanda**, no de oferta. Dicen qué buscar antes de que alguien lo pida. Mezclarlos con `sources` pierde esa información.

---

## Índices necesarios

Para que el match sea barato:

```
intents      by ["status", "activity", "zone"]
plans        by ["startsAt", "zone", "requiredTrustLevel"]
attendance   by ["userId", "status"]     // calcular score
```

---

## Los tres scheduled functions

1. **El empujón de las 7pm** — mensaje saliente en la ventana de 7–9pm.
2. **Vencimiento de intenciones** — al cumplirse `windowEnd`, marcar `expired`. **No enviar ningún mensaje.** Avisar que nadie coincidió rompe la invisibilidad del rechazo.
3. **Recordatorio de plan** — antes de la hora, a quien confirmó.

---

## Lo que NO va en el esquema

- Compatibilidad de personalidad o afinidad calculada.
- Cualquier campo que mida energía, ánimo o sociabilidad de la persona.
- Ubicación exacta en tiempo real. **Zona aproximada, siempre.**
- Ranking global.
