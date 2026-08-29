# CLAUDE.md — PulseUp

> Contexto que se carga en cada sesión. Léelo antes de tocar código.

## Qué es esto

**PulseUp es el repositorio de los planes de la ciudad, con dos puertas de entrada.**

La definición completa vive en `docs/`. **Es la fuente de verdad** — si el código contradice `docs/`, el código está mal.

| Documento | Qué responde |
|---|---|
| `docs/01-definicion-producto.md` | Qué construimos, para quién, y por qué. Los no-gos |
| `docs/02-confianza-y-progresion.md` | La escalera de confianza, el QR, el puntaje |
| `docs/03-modelo-de-datos.md` | Esquema de Convex |
| `docs/04-validacion.md` | Qué hay que probar antes de construir |

**Antes de proponer una feature, lee `01` y `02`.** La mitad de las ideas razonables están en la lista de no-gos por una razón basada en evidencia.

---

## Stack

- **Frontend:** TanStack Start + React + Vite, Tailwind v4, shadcn/Radix. Bun como gestor.
- **Backend:** **Convex. Es la única regla dura del proyecto.**
- **Canal conversacional:** WhatsApp.
- La app web vive en `web/`.

```bash
cd web
bun install
bun dev
```

---

## Reglas de producto que son también reglas de código

Estas no se negocian en un PR. Salen de evidencia, no de gusto.

1. **Una intención `open` no se revela a nadie.** Es la invisibilidad del rechazo. Si un endpoint o una query la expone, es un bug de producto.
2. **Cuando una intención vence sin match, no se envía ningún mensaje.** Avisar que nadie coincidió rompe lo anterior.
3. **Nunca copy sobre salud, sedentarismo o que la persona debería moverse.** Tiene evidencia experimental de backfire.
4. **`SocialBattery` mide intensidad del plan, jamás el estado de la persona.** El tipo existe hoy en `web/src/types/index.ts` con la semántica vieja — corregir al tocarlo.
5. **Lugar público siempre.** Nunca casa de nadie, en ningún nivel de confianza.
6. **Mínimo 3 personas** en planes de nivel 1. El plan no se activa con dos.
7. **`showed` solo se marca por escaneo de QR.** Nunca autoreportado.
8. **Zona aproximada, nunca ubicación exacta en tiempo real.**
9. **Al usuario final no se le cobra.** Nunca.
10. **Ranking global, no.** Comparación contra pares cercanos, si acaso.

---

## Método de trabajo: OpenSpec

El repo usa **spec-driven development** con OpenSpec. Los comandos están en `.claude/commands/opsx/`:

| Comando | Para qué |
|---|---|
| `/opsx:propose` | Proponer un cambio nuevo |
| `/opsx:apply` | Implementarlo |
| `/opsx:sync` | Sincronizar specs |
| `/opsx:archive` | Cerrar un cambio terminado |

### Calibración — importante

Usamos el nivel **spec-anchored**, no *spec-as-source* (taxonomía de Martin Fowler).

**Una spec corta por funcionalidad, con criterios de aceptación verificables. Nada de constituciones de mil líneas.** Hay casos documentados de 8 archivos y 1.300 líneas de spec para una feature simple — ese es el fracaso que estamos evitando.

La crítica que aplica directamente a este proyecto: *la spec asume que ya entiendes el dominio antes de codificar, cuando muchas veces es el código el que te enseña el dominio*. En un producto que todavía está averiguando si la gente responde un mensaje a las 7pm, eso pesa.

**No especifiques lo exploratorio. Especifica lo que ya sabes que va.**

### Formato de criterios de aceptación: EARS

```
UBICUO      El sistema debe mantener toda intención en estado
            open, matched o expired.

POR EVENTO  Cuando se registra una intención nueva, el sistema debe
            buscar intenciones open con la misma actividad, zona
            y solapamiento de franja.

POR ESTADO  Mientras una intención esté open, el sistema no debe
            revelar su existencia a ningún otro usuario.

NO DESEADO  Si una intención cumple su ventana sin emparejarse, el
            sistema debe marcarla expired y no debe enviar ningún
            mensaje al usuario.
```

Patrones: `UBICUO` · `POR EVENTO` · `POR ESTADO` · `OPCIONAL` · `NO DESEADO` · `COMPLEJO`.

---

## Estado actual

- `web/` tiene un prototipo de la versión anterior (rutas: index, map, missions, rewards, profile, business, landing) con datos en `web/src/mock/data.ts`.
- **Convex no está integrado todavía.**
- El README del repo describe la definición **vieja** (trabajadores remotos, energía social). Está superado por `docs/01`.
- `openspec/config.yaml` está configurado con el contexto del proyecto.

## Deuda conocida

- [ ] Integrar Convex y migrar de `mock/data.ts`
- [ ] Corregir la semántica de `SocialBattery`
- [ ] Actualizar el README a la definición nueva
- [ ] Definir umbrales de la escalera de confianza (pendientes en `docs/02`)
