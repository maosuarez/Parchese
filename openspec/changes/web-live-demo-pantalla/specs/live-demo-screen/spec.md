## Purpose

Provee una pantalla de alta visibilidad para proyectores que muestra en tiempo real y con animaciones los planes generados por match y las métricas en vivo.

## ADDED Requirements

### Requirement: Vista reactiva en vivo para proyección

UBICUO — La vista de demostración debe suscribirse reactivamente a los planes recientes y métricas globales de Convex sin requerir recarga manual del navegador.

POR ESTADO — Mientras la pantalla esté activa, debe presentar los contadores globales ("Total matches", "Planes activos") y el listado de los últimos planes concretados en un layout ajustado al viewport (100vh).

#### Scenario: Visualización inicial en proyector
- **WHEN** se carga la ruta de demo en un proyector
- **THEN** la pantalla muestra los contadores destacados y los últimos planes sin generar scrollbars

---

### Requirement: Animación y destaque de nuevos planes

POR EVENTO — Cuando se inserta un nuevo plan en Convex con `origin: "matched"`, la pantalla debe renderizar la nueva tarjeta en la parte superior con una animación de entrada visible.

#### Scenario: Entrada de match en vivo
- **WHEN** dos usuarios coinciden por WhatsApp y el núcleo crea un plan
- **THEN** la pantalla del proyector muestra el nuevo plan con animación de entrada inmediata (menos de 1 segundo)
- **AND** el contador de matches se incrementa automáticamente

---

### Requirement: Privacidad y formato de alto contraste

UBICUO — Todas las tarjetas de plan en la vista de demo deben anonimizar identidades (mostrando solo nombres de pila o avatares genéricos y zona aproximada).

UBICUO — La tipografía de títulos y métricas debe utilizar un tamaño mínimo visible a 5 metros de distancia (al menos 24px para texto base, 48px+ para métricas).

#### Scenario: Presentación pública ante jurado
- **WHEN** un plan aparece en la pantalla
- **THEN** se muestra únicamente la actividad, la zona general y la cantidad de asistentes
- **AND** ningún teléfono ni intención abierta no emparejada se expone
