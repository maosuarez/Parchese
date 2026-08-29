# Match de intenciones

## ADDED Requirements

### Requirement: Estados de una intención

UBICUO — El sistema debe mantener toda intención en exactamente uno de estos estados: `open`, `matched` o `expired`. Toda intención debe tener autor, actividad, zona, inicio de ventana y fin de ventana, con el fin posterior al inicio.

#### Scenario: Intención recién creada
- **WHEN** se registra una intención nueva
- **THEN** queda en estado `open`
- **AND** tiene autor, actividad, zona, inicio y fin de ventana

#### Scenario: Ventana inválida
- **WHEN** se intenta registrar una intención cuyo fin de ventana no es posterior a su inicio
- **THEN** el sistema la rechaza

---

### Requirement: Emparejamiento por actividad, zona y ventana

POR EVENTO — Cuando se registra una intención nueva, el sistema debe buscar intenciones en estado `open`, de otra persona, con la misma actividad, la misma zona, y cuya ventana se solape. Dos ventanas se solapan cuando `inicioA < finB` y `inicioB < finA`.

COMPLEJO — Si existe más de una intención compatible, el sistema debe emparejar con la más antigua.

#### Scenario: Dos intenciones compatibles
- **WHEN** existe una intención `open` de otra persona con la misma actividad y zona, y ventana solapada
- **THEN** el sistema crea un plan
- **AND** marca ambas intenciones como `matched`

#### Scenario: Ventanas adyacentes no se solapan
- **WHEN** una ventana termina exactamente cuando la otra empieza
- **THEN** el sistema no las empareja

#### Scenario: Varias candidatas
- **WHEN** hay más de una intención compatible
- **THEN** el sistema empareja con la más antigua

#### Scenario: Misma persona
- **WHEN** la única intención compatible pertenece al mismo autor que la intención nueva
- **THEN** el sistema no las empareja

#### Scenario: Sin coincidencia
- **WHEN** no existe ninguna intención compatible
- **THEN** la intención permanece en estado `open`
- **AND** no se envía ningún mensaje

---

### Requirement: Notificación del plan

POR EVENTO — Cuando se crea un plan por emparejamiento, el sistema debe notificar a ambas personas en menos de treinta segundos.

#### Scenario: Plan creado
- **WHEN** el sistema crea un plan por emparejamiento
- **THEN** ambas personas reciben aviso en menos de treinta segundos
- **AND** el aviso incluye actividad, zona, momento de inicio y cuántas personas van

---

### Requirement: Invisibilidad de las intenciones abiertas

POR ESTADO — Mientras una intención esté en estado `open`, el sistema no debe revelar su existencia, su contenido ni su autor a ningún otro usuario, por ninguna vía: queries del cliente, respuestas del bot, contadores agregados o interfaz web.

Es el mecanismo central del producto — la invisibilidad del rechazo. Una consulta que permita inferir que alguien declaró una intención abierta viola este requisito aunque no exponga el registro completo.

#### Scenario: Otro usuario consulta
- **WHEN** un usuario distinto del autor consulta el sistema por cualquier vía
- **THEN** no obtiene la intención `open`, ni su contenido, ni su autor, ni un agregado que permita inferirla

#### Scenario: El autor consulta lo suyo
- **WHEN** el autor consulta sus propias intenciones
- **THEN** ve las suyas en estado `open`
- **AND** puede cancelarlas

---

### Requirement: Vencimiento silencioso

POR EVENTO — Cuando una intención en estado `open` supera su fin de ventana, el sistema debe marcarla como `expired`.

NO DESEADO — Si una intención vence sin haberse emparejado, el sistema no debe enviar ningún mensaje a su autor. Es una decisión de producto, no una omisión: avisar que nadie coincidió convierte la ausencia de match en un rechazo visible.

#### Scenario: Ventana cumplida sin match
- **WHEN** una intención `open` supera su fin de ventana
- **THEN** pasa a estado `expired`
- **AND** no se envía ningún mensaje a su autor

#### Scenario: Historial propio
- **WHEN** el autor consulta su historial
- **THEN** puede ver sus intenciones vencidas

---

### Requirement: Datos del plan resultante

UBICUO — Todo plan creado por emparejamiento debe registrar la actividad, la zona, el momento de inicio y las personas participantes, y debe ocurrir en un lugar público.

NO DESEADO — El sistema no debe registrar ni exponer la ubicación exacta en tiempo real de ninguna persona.

#### Scenario: Plan creado por match
- **WHEN** el sistema crea un plan
- **THEN** el plan registra actividad, zona, momento de inicio y participantes
- **AND** el lugar es público

#### Scenario: Ubicación de las personas
- **WHEN** cualquier usuario consulta un plan
- **THEN** no obtiene la ubicación exacta en tiempo real de ningún participante
- **AND** solo ve zona aproximada
