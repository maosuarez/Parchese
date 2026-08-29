<div align="center">

# Parchese

**El repositorio de los planes de tu ciudad.**
Dices qué quieres hacer hoy. Si alguien más dijo lo mismo, ya tienen plan.

[![Backend](https://img.shields.io/badge/backend-Convex-EE342F)](https://convex.dev)
[![Frontend](https://img.shields.io/badge/frontend-TanStack%20Start-blue)](https://tanstack.com/start)
[![Canal](https://img.shields.io/badge/canal-WhatsApp-25D366)](https://developers.facebook.com/docs/whatsapp)
[![IA](https://img.shields.io/badge/IA-Claude-D97757)](https://claude.ai)
[![Estado](https://img.shields.io/badge/estado-en%20construcci%C3%B3n-yellow)](docs/04-validacion.md)

[Cómo funciona](#cómo-funciona) · [Confianza](#la-escalera-de-confianza) · [Negocio](#modelo-de-negocio) · [Roadmap](#en-construcción) · [Desarrollo](#para-el-equipo) · [Docs](#documentación)

</div>

---

## El problema

Salir hoy no tiene puerta de entrada.

- **Meetup** te pide un nicho, un grupo y esperar a que alguien publique.
- **Google Maps** te muestra lugares, pero no si habrá alguien allí.
- **Instagram y TikTok** tienen el flyer de la rodada y el comentario de «¿alguien va?» — pero nunca se encuentran entre sí.

Y aunque encuentres el plan, queda lo difícil: **el costo social de ir solo, y que el otro no aparezca.**

Parchese lo resuelve con una sola idea:

> **Tu intención es invisible hasta que alguien más dice lo mismo.**
> **Si nadie coincide, nunca supiste que te rechazaron.**

---

## Características

| | |
|---|---|
| 🟢 **Entrada por WhatsApp** | Un mensaje a las 7pm: «¿qué te provoca hoy?». Respondes en diez segundos. Sin instalar nada, sin perfil, sin onboarding. |
| 🔵 **Parrilla web** | Mapa y grilla de planes reales que ya están pasando. No dice «hay un evento» — dice «3 personas ya van, dura 45 min». |
| 🔒 **Intención invisible** | Nadie sabe que preguntaste hasta que hay match. El rechazo nunca se ve. |
| 🤝 **Escalera de confianza** | El acceso a los planes íntimos se gana con historial verificable, no se asume al registrarse. |
| 📇 **Índice de la ciudad** | Un catálogo vivo que junta lo que hoy está disperso en Luma, Eventbrite, Maps e Instagram. |
| ⏱️ **Ventana corta** | Planes de 2–4 horas. La intención vence sola. Nada de confirmar con días de anticipación. |
| 🧠 **Lectura con IA** | El mensaje libre se convierte en intención estructurada — actividad, zona, franja — sin formularios. |
| 🏙️ **Siempre lugar público** | Zona aproximada, nunca ubicación exacta. Nunca la casa de nadie, en ningún nivel. |

---

## Cómo funciona

**Dos puertas de entrada. No por indecisión — son dos estados mentales distintos.**

```
  WhatsApp  ──┐                          ┌──▶  Te avisa a ti
              ├──▶  intención  ──▶ match ─┤
  Web  ───────┘   (actividad · zona ·     └──▶  Te avisa al otro
                    franja horaria)
```

1. **Declaras una intención.** Por WhatsApp si ya sabes qué quieres; por la web si quieres inspirarte viendo lo que hay.
2. **El motor busca coincidencias.** Misma actividad, misma zona, horarios que se solapan.
3. **Nace un plan.** Se avisa a las dos personas. Si nadie coincide antes de que venza: silencio total.

Las dos puertas escriben exactamente lo mismo. De ahí en adelante el sistema es idéntico.

---

## La escalera de confianza

El riesgo escala al revés del tamaño del plan — y ahí está justo el valor que nadie más da. Por eso el acceso **se gana**, no se asume.

| Nivel | Qué desbloquea | Cómo se gana |
|:---:|---|---|
| **0** | Eventos masivos: conciertos, carreras, rodadas, mercados | Teléfono verificado |
| **1** | Lugar público, mínimo 3 personas: café en grupo, cowork, caminata, cancha | Teléfono verificado |
| **2** | Planes pequeños: juego de mesa, sacar el perro, grupos de 2–3 | Asistencias cumplidas, sin reportes |

Cada asistencia se verifica **por escaneo de QR en el lugar** — nunca autoreportada. Un reporte de otra persona baja fuerte y puede revocar el nivel 2.

Tinder conecta desconocidos y no se entera de qué pasó después. Aquí queda rastro, y ese historial es el activo que ninguna app nueva puede copiar.

---

## Modelo de negocio

| Lado | Rol | Cómo se monetiza |
|---|---|---|
| **Usuario** | Demanda | **Nunca se le cobra.** Nunca. |
| **Organizador** | Oferta escasa — se construye para él primero | Suscripción o comisión |
| **Negocio / venue** | Quien paga | **Solo por resultado verificable.** Nunca por aparecer |

La lección de Groupon: vender exposición sin filtrar intención no funciona. OpenTable y Resy sí, porque cobran por reserva cumplida. Y a diferencia de Tinder, el usuario que resuelve su problema aquí **no se va — trae**: crea más planes y suma más gente.

---

## En construcción

| Frente | Qué entrega |
|---|---|
| **Canal de WhatsApp** | El bot recibe el mensaje libre, extrae la intención con IA, desambigua con botones y notifica cuando hay plan. |
| **Índice de Bogotá** | Siembra de 15–20 planes reales (Chapinero, Usaquén, Virrey, Parkway) + ingesta continua desde Luma, Eventbrite, Maps e Instagram. |
| **Parrilla web** | Planes por hora con el contador «X van, dura Y», botón «Yo voy» conectado al motor de match, y `SocialBattery` corregido a intensidad del plan. |
| **Pantalla en vivo** | Vista de proyector: el público le escribe al bot y ve los planes formándose en tiempo real, sin recargar. |
| **Perfil con IA** | Enlaces directos a ChatGPT y Claude para explorar planes afines y definir gustos desde WhatsApp o la web. |

---

## Principios que no se negocian

Salen de evidencia, no de gusto.

- Una intención abierta **no se revela a nadie**.
- Cuando una intención vence sin match, **no se envía ningún mensaje**.
- **Nunca** copy sobre salud, sedentarismo o que deberías moverte — tiene backfire comprobado.
- Comparación contra pares cercanos, **nunca ranking global**.
- `showed` solo se marca por escaneo de QR. Nunca autoreportado.
- Zona aproximada, **nunca ubicación exacta en tiempo real**.

---

## Para el equipo

**Si es tu primer día, lee [`docs/00-EMPIEZA-AQUI.md`](docs/00-EMPIEZA-AQUI.md) y nada más. Toma 5 minutos.**

```bash
cd web
bun install
npx convex dev   # interactivo: login y deployment. Déjalo corriendo.
```

**Stack:** Convex (la única regla dura) · TanStack Start + React + Vite + Tailwind v4 · WhatsApp · Claude para leer la intención del mensaje libre.

**Método:** spec-driven con OpenSpec (`.claude/commands/opsx/`). Una spec corta por funcionalidad, con criterios verificables en formato EARS.

---

## Documentación

`docs/` es la fuente de verdad. Si el código la contradice, el código está mal.

| Documento | Qué responde |
|---|---|
| [`docs/00-EMPIEZA-AQUI.md`](docs/00-EMPIEZA-AQUI.md) | Cómo arrancar, en 5 minutos |
| [`docs/01-definicion-producto.md`](docs/01-definicion-producto.md) | Qué, para quién, el modelo, los no-gos |
| [`docs/02-confianza-y-progresion.md`](docs/02-confianza-y-progresion.md) | Escalera de confianza, QR, puntaje |
| [`docs/03-modelo-de-datos.md`](docs/03-modelo-de-datos.md) | El esquema de Convex |
| [`docs/04-validacion.md`](docs/04-validacion.md) | Qué probar antes de construir |
