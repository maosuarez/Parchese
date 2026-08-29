# Match de intenciones

## Qué

Cuando dos personas declaran querer hacer lo mismo, cerca, en franjas de tiempo que se solapan, el sistema crea un plan y avisa a ambas. Mientras eso no ocurre, ninguna de las dos declaraciones es visible para nadie.

## Por qué

Es el núcleo del producto y el único componente que no se corta. Todo lo demás — la parrilla, el índice, el puntaje — existe para alimentarlo o mostrarlo.

Ataca la barrera real que documentamos: no es que la gente no encuentre planes, es que **el costo social de exponerse la frena**. La persona que dice "quiero salir" y no recibe respuesta queda peor que antes de preguntar. Por eso la declaración es invisible hasta que hay reciprocidad — el mismo mecanismo del doble opt-in que hizo funcionar a Tinder donde otros fallaron.

## Cómo entra una intención

Por dos puertas que escriben lo mismo:
- **WhatsApp** — el usuario escribe en lenguaje natural y el sistema extrae la intención.
- **Web** — el usuario toca "yo voy" en un plan de la parrilla.

El match no distingue el origen.

## Alcance

- Emparejar intenciones abiertas por actividad, zona y solapamiento de ventana.
- Crear el plan resultante y notificar a ambas partes.
- Vencer intenciones que cumplen su ventana sin emparejarse.

## No-gos

- **Compatibilidad de personalidad o afinidad calculada.** Coincidir en actividad, zona y franja basta. El emparejamiento por afinidad está descartado por evidencia en `docs/01-definicion-producto.md`.
- **Notificar el vencimiento.** Avisar que nadie coincidió destruye la invisibilidad del rechazo, que es el punto entero de la funcionalidad.
- **Exponer intenciones abiertas** por cualquier vía: query pública, respuesta del bot, o pantalla de la web.
- **Ubicación exacta.** Solo zona aproximada.
- Grupos de más de dos personas en esta iteración. El plan mínimo de tres personas del nivel 1 de confianza llega después.
