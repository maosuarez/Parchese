## Purpose

Permite la ingesta asíncrona de eventos y señales de demanda desde la infraestructura de Apify hacia Convex mediante webhooks seguros, normalizando los datos crudos hacia las tablas de fuentes, planes y lugares públicos sin comprometer el rendimiento del backend transaccional.

## ADDED Requirements

### Requirement: Recepción segura de webhooks de Apify

POR EVENTO — Cuando un Actor de Apify finaliza una ejecución y envía una notificación HTTP POST a la ruta de webhook, el sistema debe autenticar la petición mediante el token o secreto configurado (`APIFY_WEBHOOK_SECRET`) y responder con código HTTP 200 en menos de cinco segundos tras agendar el procesamiento en segundo plano.

NO DESEADO — Si la petición no incluye el token válido o la firma no coincide, el sistema debe rechazar la solicitud inmediatamente con código HTTP 401 sin procesar ningún dato.

#### Scenario: Notificación válida de Apify
- **WHEN** Apify envía un payload con el encabezado de autenticación correcto
- **THEN** el sistema valida la autenticidad
- **AND** responde HTTP 200 en menos de cinco segundos
- **AND** agenda la persistencia y normalización del lote

#### Scenario: Notificación no autorizada
- **WHEN** se recibe una petición en la ruta del webhook sin token válido o con secreto incorrecto
- **THEN** el sistema responde HTTP 401
- **AND** no inserta ningún registro en la base de datos

---

### Requirement: Persistencia desacoplada e idempotente en sources y demandSignals

POR EVENTO — Al procesar los datos recibidos de Apify, el sistema debe clasificar el payload según el tipo de actor y registrarlo de forma idempotente. Los eventos de plataformas de oferta (Luma, Eventbrite, Google Places, páginas web) deben registrarse en la tabla `sources` con estado `pending`. Los comentarios y menciones de redes sociales (Instagram, TikTok, X) deben guardarse en la tabla `demandSignals`.

UBICUO — Si un elemento crudo ya fue registrado previamente (mismo `externalId` o identificador de plataforma), el sistema no debe duplicar el registro en la base de datos.

#### Scenario: Ingesta de eventos de oferta
- **WHEN** el webhook recibe datos de un scraper de eventos estructurados
- **THEN** el sistema inserta cada evento en la tabla `sources` con `status: "pending"` y su `rawPayload` intacto
- **AND** si el `externalId` ya existe, actualiza o ignora sin duplicar

#### Scenario: Ingesta de señales de demanda social
- **WHEN** el webhook recibe comentarios de redes sociales sobre planes en la ciudad
- **THEN** el sistema inserta las menciones en la tabla `demandSignals` con texto, plataforma y fecha de captura
- **AND** no las mezcla con la tabla `sources`

---

### Requirement: Normalización asíncrona hacia planes y venues públicos

POR EVENTO — Cuando existen registros en estado `pending` en la tabla `sources`, el sistema debe ejecutar una acción asíncrona de normalización que interprete el título, descripción, horario y ubicación del evento, asignando una actividad cerrada (`caminar`, `cafe`, `cowork`, `juego`, `cancha`, `otro`) y una zona aproximada de Bogotá.

UBICUO — Todo plan generado a partir de una fuente normalizada debe crearse con `origin: "seeded"`, fecha `startsAt` futura válida, aforo mínimo, estado `active` o `pending`, un `qrToken` único generado criptográficamente para check-in, y vinculación a un lugar público (`venues`).

NO DESEADO — El proceso de normalización no debe crear planes en residencias o lugares privados, ni publicar eventos con fechas en el pasado o ubicaciones no públicas.

#### Scenario: Normalización exitosa de evento
- **WHEN** una fuente en `sources` con estado `pending` es procesada por el normalizador
- **THEN** el sistema extrae la actividad, zona de Bogotá y horario futuro
- **AND** crea o vincula el registro en `venues` con `isPublic: true`
- **AND** crea el registro en `plans` con `origin: "seeded"` y `qrToken` generado
- **AND** actualiza la fuente en `sources` a `status: "normalized"` con el `planId` asociado

#### Scenario: Evento inválido o no estructurable
- **WHEN** el contenido de una fuente no corresponde a un plan válido en Bogotá o es ilegible
- **THEN** el sistema marca la fuente en `sources` como `status: "discarded"`
- **AND** no crea ningún registro en `plans`

---

### Requirement: No interferencia con el camino crítico

POR ESTADO — La recepción, almacenamiento y normalización de datos de Apify debe ejecutarse íntegramente en segundo plano mediante `internalAction` y `internalMutation`, sin bloquear las consultas de WhatsApp ni de la interfaz web.

#### Scenario: Ingesta simultánea durante uso activo
- **WHEN** se ejecuta un lote de normalización de Apify mientras usuarios envían mensajes o consultan la parrilla
- **THEN** la latencia de respuesta a los usuarios no se ve afectada
