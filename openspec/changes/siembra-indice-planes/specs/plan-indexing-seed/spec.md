## Purpose

Permite sembrar planes reales de Bogotá en la base de datos para resolver el arranque en frío y estructurar la ingesta de fuentes y señales de demanda.

## ADDED Requirements

### Requirement: Siembra inicial de planes de Bogotá

UBICUO — El sistema debe proveer una mutación ejecutable de siembra que inserte al menos 15 planes reales de la ciudad en lugares públicos con `origin: "seeded"`.

POR EVENTO — Cuando se ejecuta la siembra, el sistema debe registrar planes distribuidos en las zonas principales (Chapinero, Teusaquillo/Parkway, Usaquén, Parque Virrey, Centro) cubriendo actividades cotidianas (caminar, cowork, café, juegos, rodadas).

#### Scenario: Ejecución de siembra en ambiente limpio
- **WHEN** se invoca la mutación de siembra inicial
- **THEN** la tabla `plans` contiene al menos 15 registros con fechas y horas válidas para el día actual y siguiente
- **AND** cada plan tiene zona aproximada y lugar público asignado

---

### Requirement: Separación estricta de fuentes y señales de demanda

UBICUO — El sistema debe almacenar las publicaciones y eventos externos en la tabla `sources`, y los comentarios o solicitudes de compañía ("¿alguien va?") en la tabla `demandSignals`.

NO DESEADO — El sistema no debe procesar ni normalizar registros de `demandSignals` directamente como planes en la tabla `plans`.

#### Scenario: Registro de evento externo
- **WHEN** se ingresa una publicación de Luma o Eventbrite
- **THEN** se registra en `sources` con su plataforma, payload crudo y estado de normalización

#### Scenario: Registro de comentario de demanda
- **WHEN** se detecta una señal de "¿alguien va a este evento?"
- **THEN** se guarda en `demandSignals` para orientar futuras búsquedas sin crear un plan prematuro
