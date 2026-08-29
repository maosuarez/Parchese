# Validación — qué probar antes de construir

> Ordenado por riesgo: lo que hundiría el proyecto si resulta falso va arriba.
> Casi todo se prueba **sin escribir código**.

---

## El principio

Airbnb tocó puertas. Stripe le instalaba el producto al cliente ahí mismo («Collison installation»). La primera versión de PulseUp debería **operarse a mano**.

**El bot se programa cuando ya se sepa qué preguntar — y eso solo se aprende preguntando.**

---

## Los cinco tests

### 01 · ¿La gente responde el mensaje de las 7pm?
**Costo: un día.** Operarlo a mano en un grupo de WhatsApp durante una semana. Sin bot, sin código: una persona escribiendo.

*Qué medir:* tasa de respuesta, cuánto tarda, qué responden cuando no saben qué quieren.

### 02 · ¿Aparecen de verdad?
**Costo: una semana.** El supuesto más caro del proyecto. Armar tres planes reales a mano y contar cuántos de los que dijeron que sí llegaron.

*Referencia:* eventos gratis tienen 40–50% de no-show. Si el resultado está en ese rango, el mecanismo de costo (la escalera de confianza) es obligatorio, no opcional.

### 03 · ¿Vuelven una segunda vez?
**Costo: dos semanas.** Sin esto no hay producto, solo un evento.

*Hipótesis a probar:* que el valor está en la constancia — el mensaje de las 7pm se vuelve hábito, no búsqueda.

### 04 · ¿Hay organizadores dispuestos?
**Costo: dos días.** Hablar con cinco personas que ya arman planes en Bogotá. Es el lado escaso y el que paga.

### 05 · ¿Un local paga por gente que llega?
**Costo: dos días.** Conversación directa con tres negocios. Cobro por resultado verificable, nunca por aparecer.

---

## La red atómica

El patrón está probado: Uber por barrio, Tinder por fiesta de fraternidad, Facebook por campus, DoorDash por suburbio. **Saturar un perímetro cerrado antes de abrir.**

Para Bogotá hay un matiz que cambia la táctica: por cómo funciona la movilidad de la ciudad, **la densidad social pesa tanto como la geográfica**.

No sirve «gente en Chapinero». Sirve **un grupo ya semi-conectado**: una universidad, un coworking, una comunidad que ya existe.

---

## Métricas que importan

**Sí:**
- Planes concretados (no publicados).
- Tasa de aparición: `showed / confirmed`.
- Tiempo desde la intención hasta el match.
- Retorno a segundo plan.

**No — métricas de vanidad:**
- Descargas, registros, usuarios totales.
- Eventos en el índice (es insumo, no resultado).

**El North Star se define después del primer ciclo con datos reales.** Definirlo en el vacío produce exactamente las métricas de la segunda lista.

---

## Huecos de evidencia

Sin fuente primaria confirmada. **No decidir sobre estos números sin verificar:**

- Benchmarks de liquidez y match rate de marketplaces (a16z, Lenny Rachitsky).
- Hierarchy of Engagement de Sarah Tavel.
- Cifras de momento de activación (Facebook 7 amigos en 10 días, Slack 2000 mensajes) — lore muy repetido, sin fuente primaria localizada.
- Retención D1/D7/D30 en apps sociales.
- CAC en consumer social.
