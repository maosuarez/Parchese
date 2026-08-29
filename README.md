# PulseUp

**El repositorio de los planes de la ciudad, con dos puertas de entrada.**

Un bot de WhatsApp para quien ya sabe qué quiere hacer. Una app web con parrilla y mapa para quien quiere inspirarse. Ambas escriben lo mismo: una intención. Cuando dos intenciones compatibles coinciden — misma actividad, misma zona, horarios que se solapan — nace un plan y se avisa a las dos personas.

Tu intención es invisible hasta que alguien más dice lo mismo. Si nadie coincide, nunca supiste que te rechazaron.

---

## 👉 Si vas a trabajar en esto: [`docs/00-EMPIEZA-AQUI.md`](docs/00-EMPIEZA-AQUI.md)

---

## Arranque rápido

```bash
cd web
bun install
npx convex dev    # interactivo: login y deployment
```

## Stack

- **Backend:** Convex — regla dura del proyecto
- **Frontend:** TanStack Start + React + Vite + Tailwind v4 + shadcn/Radix
- **Canal conversacional:** WhatsApp
- **LLM:** Claude, para extraer la intención del mensaje libre

## Estructura

```
docs/            la definición del producto — fuente de verdad
  frentes/       un documento por dev
openspec/        specs con OpenSpec (CLI: @fission-ai/openspec)
web/
  convex/        backend: schema, match, crons
  src/           la app
CLAUDE.md        contexto para agentes de código
```

## Documentación

Si algo en el código contradice `docs/`, el código está mal.

| Documento | Qué responde |
|---|---|
| [`docs/00-EMPIEZA-AQUI.md`](docs/00-EMPIEZA-AQUI.md) | Cómo arrancar, en 5 minutos |
| [`docs/01-definicion-producto.md`](docs/01-definicion-producto.md) | Qué, para quién, el modelo, los no-gos |
| [`docs/02-confianza-y-progresion.md`](docs/02-confianza-y-progresion.md) | Escalera de confianza, QR, puntaje |
| [`docs/03-modelo-de-datos.md`](docs/03-modelo-de-datos.md) | El esquema de Convex |
| [`docs/04-validacion.md`](docs/04-validacion.md) | Qué probar antes de construir |
