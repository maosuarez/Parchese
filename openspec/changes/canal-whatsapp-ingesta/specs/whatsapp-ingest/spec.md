## Purpose

Permite recibir mensajes por WhatsApp, extraer intenciones estructuradas mediante un LLM, desambiguar con botones interactivos y registrar intenciones en el núcleo.

## ADDED Requirements

### Requirement: Verificación y recepción segura de Webhook

UBICUO — El sistema debe responder inmediatamente a las solicitudes GET de suscripción de Meta retornando el `hub.challenge` en texto plano si el token coincide.

POR EVENTO — Cuando llega un mensaje POST al webhook, el sistema debe validar la firma HMAC-SHA256 usando el cuerpo crudo y el secreto configurado antes de procesar cualquier carga.

POR EVENTO — Cuando el webhook recibe un mensaje válido, el sistema debe responder HTTP 200 inmediatamente y agendar de forma asíncrona la acción de procesamiento.

#### Scenario: Verificación exitosa de suscripción
- **WHEN** Meta envía un GET con `hub.mode=subscribe` y el `hub.verify_token` correcto
- **THEN** el sistema retorna HTTP 200 con el valor de `hub.challenge` como cuerpo

#### Scenario: Mensaje entrante con firma válida
- **WHEN** Meta envía un POST con payload de mensaje y header `X-Hub-Signature-256` coincidente
- **THEN** el sistema responde con HTTP 200 de inmediato
- **AND** agenda la extracción de intención de forma asíncrona

#### Scenario: Mensaje entrante con firma inválida
- **WHEN** Meta envía un POST con firma HMAC incorrecta o ausente
- **THEN** el sistema rechaza la petición con HTTP 401 o 403 y no procesa el contenido

---

### Requirement: Extracción estructurada de intenciones con LLM

POR EVENTO — Cuando se procesa un mensaje de texto libre del usuario, el sistema debe ejecutar una extracción con LLM retornando actividad normalizada, zona, desplazamiento temporal en horas, duración y un flag de confianza (`confident`).

#### Scenario: Mensaje claro y completo
- **WHEN** el usuario escribe "Quiero salir a caminar por Chapinero en 2 horas"
- **THEN** el modelo retorna `activity: "caminar"`, `zone: "chapinero"`, `hoursFromNow: 2`, `durationHours: 2` (o valor por defecto) y `confident: true`
- **AND** el sistema inserta una intención en estado `open` con `source: "whatsapp"`

#### Scenario: Mensaje ambiguo o incompleto
- **WHEN** el usuario escribe un mensaje ambiguo o sin detalles como "hola, qué hay para hacer"
- **THEN** el modelo retorna `confident: false`
- **AND** el sistema no crea ninguna intención en estado `open`
- **AND** envía una respuesta con botones interactivos para clarificar

---

### Requirement: Desambiguación interactiva con botones

POR ESTADO — Mientras una solicitud carezca de actividad, franja o zona precisa, el sistema debe responder con un mensaje interactivo de WhatsApp que contenga máximo tres botones de opción rápida.

#### Scenario: Selección de franja horaria por botón
- **WHEN** el usuario pulsa un botón interactivo como "Esta tarde" o "En 1 hora"
- **THEN** el sistema recibe el identificador del botón, completa los parámetros faltantes y registra la intención

---

### Requirement: Notificación de plan concretado

POR EVENTO — Cuando el motor de matching crea un plan originado o asociado al usuario de WhatsApp, el sistema debe enviar un mensaje de texto a su número telefónico con los detalles del plan (actividad, zona aproximada, hora de inicio y cantidad de confirmados).

NO DESEADO — Si una intención vence sin match, el sistema no debe enviar ningún mensaje por WhatsApp al usuario.

#### Scenario: Notificación de match exitoso
- **WHEN** el núcleo genera un plan emparejando la intención del usuario
- **THEN** el sistema envía un mensaje por WhatsApp al usuario con los datos públicos del plan en menos de 30 segundos

#### Scenario: Silencio al vencer intención
- **WHEN** la intención del usuario pasa a estado `expired` sin emparejarse
- **THEN** el sistema no envía ningún mensaje a través de WhatsApp
