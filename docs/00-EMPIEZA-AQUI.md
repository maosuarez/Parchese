# Empieza aquí

> Si es tu primer día en este repo, lee esto y nada más. Toma 5 minutos.

---

## Qué estamos construyendo

**PulseUp es el repositorio de los planes de la ciudad, con dos puertas de entrada.**

- **WhatsApp** — para quien ya sabe qué quiere. Le escribe al bot y este le devuelve un plan.
- **Web** — para quien quiere inspirarse o crear. Parrilla y mapa de planes reales.

Ambas puertas escriben lo mismo: **una intención**. Cuando dos intenciones compatibles coinciden, nace un plan y se avisa a las dos personas.

**Lo que hace el producto distinto:** tu intención es invisible hasta que alguien más dice lo mismo. Si nadie coincide, nunca supiste que "te rechazaron". Eso es lo que hace que la gente se atreva a decir que quiere salir.

---

## Los 4 pasos para arrancar

### 1. Clona e instala

```bash
git clone https://github.com/maosuarez/connect-out-loud.git
cd connect-out-loud/web
bun install
```

### 2. Conecta Convex

```bash
npx convex dev
```

Es interactivo: pide login y crea el deployment. **Déjalo corriendo** — genera `convex/_generated`, y sin eso nada compila.

### 3. Prueba que el match funciona

En el dashboard de Convex, corre `matching:sembrarIntencion` dos veces:

```json
{ "phone": "573001111111", "activity": "caminar", "zone": "chapinero", "enHoras": 2, "duraHoras": 3 }
{ "phone": "573002222222", "activity": "caminar", "zone": "chapinero", "enHoras": 3, "duraHoras": 2 }
```

Si aparece una fila en `plans`, el núcleo funciona. Ese es el corazón del producto.

### 4. Lee tu frente

| Eres | Lee |
|---|---|
| **Dev A** | [`docs/frentes/dev-a-canal-whatsapp.md`](frentes/dev-a-canal-whatsapp.md) — el bot |
| **Dev B** | [`docs/frentes/dev-b-nucleo.md`](frentes/dev-b-nucleo.md) — el match y la confianza |
| **Dev C** | [`docs/frentes/dev-c-cara-visible.md`](frentes/dev-c-cara-visible.md) — la web y el índice |

Cada documento dice: qué archivos son tuyos, qué entregas, qué **no** puedes tocar, y cómo avanzar sin esperar a nadie.

---

## Las 5 reglas del día

1. **El schema se revisa entre los tres en la primera hora y después se congela.** Si necesitas cambiarlo, dilo en voz alta. Un cambio silencioso a media tarde es lo que rompe el día.

2. **Nadie toca archivos de otro frente.** Si necesitas algo de otro, lo pides. No lo escribes tú.

3. **Rama por persona. Merge a `main` cada 2 horas**, no continuo — interrumpe a media tarea.

4. **No esperes a nadie.** Cada frente tiene una forma de avanzar solo, con datos sembrados a mano. Está explicada en tu documento.

5. **Todo lo que no esté terminado, fuera de la pantalla.** El criterio que más pesa en la rúbrica es "demostración cerrada sin caminos incompletos" y vale 30%. Un botón que no hace nada cuesta más de lo que suma.

---

## Prohibido (esto no es opinión, sale de investigación)

- **Ningún texto sobre salud, sedentarismo o que la persona debería moverse.** Ninguno, en ningún lado. Tiene evidencia experimental de backfire: produce más evitación, no menos.
- **Una intención abierta no se revela a nadie.** Ni por query, ni por el bot, ni por un contador agregado.
- **Si una intención vence sin match, no se manda ningún mensaje.** No es un olvido: avisar que nadie coincidió destruye el mecanismo central.
- **`SocialBattery` mide intensidad del plan, nunca el estado de la persona.**
- **Lugar público siempre.** Nunca casa de nadie.
- **Al usuario final no se le cobra. Sin ranking global.**

El porqué de cada una está en [`docs/01-definicion-producto.md`](01-definicion-producto.md).

---

## Si te sobra tiempo, lee esto

| Documento | Qué responde |
|---|---|
| [`01-definicion-producto.md`](01-definicion-producto.md) | Qué construimos, para quién, el modelo de negocio |
| [`02-confianza-y-progresion.md`](02-confianza-y-progresion.md) | La escalera de confianza, el QR, el puntaje |
| [`03-modelo-de-datos.md`](03-modelo-de-datos.md) | El esquema de Convex explicado |
| [`04-validacion.md`](04-validacion.md) | Qué hay que probar antes de construir |
| `openspec/changes/match-de-intenciones/` | La spec del núcleo, con sus tareas |

---

## Lo que se corta si aprieta el tiempo

En este orden: **scraping automático** → sponsors → puntaje → mapa bonito.

**El match no se corta nunca.**
