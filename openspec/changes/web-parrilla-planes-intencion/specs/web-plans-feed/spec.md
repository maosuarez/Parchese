## Purpose

Presenta la parrilla visual de planes reales ordenados por hora con señal previa de compromiso y permite declarar intenciones directamente desde la web.

## ADDED Requirements

### Requirement: Parrilla reactiva de planes por hora

UBICUO — La interfaz web debe mostrar la lista de planes futuros ordenados ascendentemente por `startsAt`, filtrables por zona aproximada.

POR ESTADO — Para cada plan presentado, la interfaz debe mostrar la actividad, la zona pública, la hora de inicio, la duración estimada y la cantidad de personas confirmadas.

#### Scenario: Visualización de plan en parrilla
- **WHEN** un usuario navega por la parrilla principal
- **THEN** ve planes activos con formato de señal previa (ej. "3 personas ya van · dura 45 min")
- **AND** solo visualiza zonas aproximadas, nunca coordenadas exactas en vivo de personas

---

### Requirement: Declaración de intención desde la web ("Yo voy")

POR EVENTO — Cuando un usuario autenticado o identificado por teléfono pulsa "Yo voy" en un plan o actividad, el sistema debe registrar una intención en Convex con `source: "web"` y estado `open`.

#### Scenario: Creación de intención vía web
- **WHEN** el usuario pulsa "Yo voy" en una actividad o plan
- **THEN** se crea una intención asociada en la base de datos de Convex
- **AND** la interfaz confirma la intención sin exponer la lista de intenciones abiertas de otros usuarios

---

### Requirement: Semántica de intensidad de actividad (`PlanIntensity`)

UBICUO — Toda propiedad visual referente al nivel de intensidad o energía requerida debe referirse exclusivamente a la naturaleza del plan y nunca al estado emocional o físico del usuario.

#### Scenario: Indicador de intensidad en tarjeta de plan
- **WHEN** se renderiza la tarjeta de un plan con nivel de intensidad
- **THEN** la etiqueta indica la intensidad de la actividad (ej. "Tranquilo", "Moderado", "Intenso") sin juicios sobre el estado del usuario

---

### Requirement: Interfaz libre de rutas incompletas

UBICUO — La navegación principal de la app web debe contener únicamente accesos a funcionalidades completamente conectadas a datos de backend, excluyendo `rewards` o rankings.

#### Scenario: Menú de navegación en el demo
- **WHEN** el usuario accede al menú de la aplicación
- **THEN** no encuentra enlaces a pantallas desconectadas como recompensas globales o rankings
