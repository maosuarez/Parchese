# PulseUp — Definición de producto

> Documento fuente. Si algo en el código contradice esto, el código está mal.
> Última revisión: 2026-08-29

---

## El problema

Quien quiere salir hoy no tiene puerta de entrada.

- **Meetup** le exige saber su nicho, pertenecer a un grupo y esperar a que publique.
- **Google Maps** le muestra lugares, pero no le dice si habrá alguien allí.
- **Instagram y TikTok** tienen el flyer de la rodada y el comentario de «¿alguien va?», pero nunca se encuentran entre sí.

Y aunque encuentre el plan, queda la parte difícil: **el costo social de ir solo**, y que el otro no aparezca.

### Lo que dice la evidencia

| Hallazgo | Fuente |
|---|---|
| La barrera no es la habilidad social, es la **predicción errónea**. La gente subestima sistemáticamente cuánto le agradó al otro, y el sesgo no se corrige con el tiempo | Boothby, Cooney, Sandstrom & Clark (2018), *liking gap* |
| Quienes conversaron con un desconocido tuvieron la mejor experiencia; el silencio, la peor. Todos habían predicho lo contrario | Epley & Schroeder (2014) |
| Los planes espontáneos que sí ocurren se arman **2–4 horas antes**, en grupos de 2–4 personas | Datos de comportamiento de producto |
| Pedir confirmación con días de anticipación **aumenta** la cancelación | 60% de adultos cancela planes al menos 1 vez al mes |
| El mensaje de salud con culpa o vergüenza produce **backfire**: más evitación y más estrés fisiológico | Self-Determination Theory, literatura de *fear appeals* |
| Eventos gratis: 40–50% de no-show. Si cuestan algo: 70–85% de asistencia | Datos agregados de organizadores |

---

## El trabajo del usuario (JTBD)

> Cuando termino el día y siento que no hablé con nadie, quiero encontrar algo concreto que hacer cerca en las próximas horas, para no dejar pasar otro día encerrado sin que me cueste exponerme.

---

## Para quién

**Segmento primario — personas en transición de vida.** Recién llegados a la ciudad, cambio de trabajo, ruptura, graduación. Es el disparador con evidencia más fuerte: la red social y la disponibilidad colapsan al mismo tiempo.

**No es el segmento:** «trabajador remoto». Eso es un dato demográfico, no un dolor. La validación con usuarios reales lo descartó: quien está cómodo en casa ya resuelve lo social en Discord y rechaza cualquier mensaje sobre su sedentarismo.

**Lo que sí es cierto del que se queda en casa:** el 71% siente que se está perdiendo experiencias y el 51% reporta soledad de fin de semana. El freno declarado es económico, no ideológico. La mayoría quiere salir y no le sale la cuenta.

---

## La propuesta

**PulseUp es el repositorio de los planes de la ciudad, con dos puertas de entrada.**

No son dos canales por indecisión: son **dos estados mentales distintos**.

### Puerta A — conversacional (WhatsApp)
Para quien **ya sabe qué quiere**. Un mensaje a las 7pm pregunta qué le provoca hoy. La respuesta toma diez segundos, sin instalar nada ni crear perfil.

Por qué WhatsApp:
- Elimina instalación, perfil y onboarding — la fricción exacta que mató a la categoría (Highlight, Color, Sonar).
- Permite **empujar** en la ventana de 7–9pm, que es cuando la gente decide.
- Alcanza al segmento de soledad crónica, que nunca abriría una app por iniciativa propia.

### Puerta B — visual (web app)
Para quien **quiere inspirarse** o **crear**. Parrilla y mapa de planes reales. Un bot que pregunta «¿qué quieres hacer?» a alguien que no sabe es fricción pura; aquí el ojo hace el trabajo que la pregunta no puede.

**Ambas puertas escriben lo mismo: una intención.** De ahí en adelante el sistema es idéntico.

---

## El índice de planes (y por qué es el foso)

La parrilla se alimenta de lo que **ya existe y está disperso**: Luma, Eventbrite, páginas de conciertos y venta de boletas, Maps, TripAdvisor, y el flyer de Instagram o TikTok de la rodada, el toque pequeño, el DJ de esta noche.

Nadie junta eso hoy. El índice:
- Resuelve el arranque en frío: **la parrilla sirve aunque no haya un solo usuario más**. En el análisis de 100 marketplaces reales, el 34% arrancó así (modo de un solo jugador: OpenTable, Amazon).
- Mejora solo con el tiempo y es difícil de replicar. **Es el activo, no la infraestructura del demo.**

**Distinción operativa:** los comentarios de «¿alguien va?» son señal de **demanda**, no de oferta. Se guardan aparte — dicen qué buscar antes de que alguien lo pida.

**Riesgo conocido:** los términos de servicio de Instagram y TikTok. Para el prototipo es irrelevante; si esto escala, esa parte necesita otra estrategia.

---

## Mecanismos de diseño (y de dónde salen)

| Mecanismo | Qué hace | Origen |
|---|---|---|
| **Intención invisible** | Nadie sabe que preguntaste hasta que hay match. Si nadie coincide, nunca supiste que te «rechazaron» | Doble opt-in de Tinder |
| **Señal antes del compromiso** | No se muestra «hay un evento», se muestra «3 personas ya van, dura 45 min» | Pie: el tiempo en app pasó de 2 a 10 min con este cambio |
| **Arreglar la predicción** | Cuántos van, quién anfitriona, cómo salió la vez pasada | Ataca directamente el *liking gap* |
| **Actividad, no «socializar»** | Caminar, cowork silencioso, juego de mesa. Hay una razón para estar ahí | Tener un rol concreto baja la barrera |
| **Ventana corta** | 2–4 horas. La intención vence sola | Anticipación larga = más cancelación |
| **Comparación con pares** | Nunca ranking global | Strava. Foursquare perdió su alma cuando el *mayorship* se volvió inalcanzable |

---

## Modelo de negocio

| Lado | Rol | Cómo se monetiza |
|---|---|---|
| **Usuario** | Demanda | **Nunca se le cobra.** Meetup intentó cobrar $2 por RSVP en 2019 y tuvo reacción en contra |
| **Organizador** | Oferta escasa — se construye para él primero | Suscripción o comisión. Referencia: Luma $59/mes o 5%; Eventbrite 3,7% + $1,79 |
| **Negocio / venue** | Quien paga | **Solo por resultado verificable.** Nunca por aparecer |

**La lección de Groupon:** fracasó por vender exposición sin filtrar intención — solo ~20% de compradores repetía a precio completo. OpenTable (vendida en $2.600M) y Resy funcionan porque cobran por reserva cumplida.

**La pregunta que Tinder no responde:** qué pasa el día que el usuario resuelve su problema. Tinder pierde pagadores 7 trimestres seguidos mientras sube el ingreso subiéndole el precio a quien queda. Aquí el usuario que hace amigos **no se va, trae**: crea más planes y suma más gente. El incentivo del negocio y el del usuario apuntan al mismo lado.

---

## No-gos

Cosas que **no** se construyen, y por qué.

- **Batería como estado del usuario.** El tipo `SocialBattery` existe hoy en `web/src/types/index.ts`. Si se conserva, debe medir **intensidad del plan**, nunca el nivel de energía de la persona. Tiene evidencia experimental de backfire.
- **Cualquier mención a su salud, sedentarismo o de que debería moverse.** Ninguna, en ningún copy.
- **Ranking global y rewards.** Comparación solo contra pares cercanos.
- **Matching por compatibilidad de personalidad.** Coincidir en actividad, franja y zona ya basta.
- **Cobrarle al usuario final.**
- **Encuentros de a dos en lugares privados.** Ver `02-confianza-y-progresion.md`.

---

## Cómo nos diferenciamos

**Luma es una herramienta para que un organizador gestione la audiencia que ya tiene. PulseUp es descubrimiento para quien no tiene ninguna.** Son categorías distintas aunque ambos muestren eventos.

**Meetup** captura membresía. PulseUp captura **intención**: dices qué quieres hacer hoy y eso basta.

**Tinder y Bumble** conectan desconocidos directamente y no se enteran de qué pasó después. Nosotros dejamos rastro — ver el documento de confianza.

---

## Lo que todavía no está validado

1. **¿La gente aparece?** El supuesto más caro del proyecto.
2. **¿Vuelve una segunda vez?** Sin esto no hay producto, solo un evento.
3. Los benchmarks de liquidez, retención y momentos de activación quedaron sin fuente primaria confirmada. No decidir sobre ellos sin verificar.

Ver `04-validacion.md`.
