## Purpose

Gestiona la escalera de confianza (niveles 0, 1 y 2), la verificación de asistencia mediante código QR, la regla de mínimo 3 personas en nivel 1 y la revelación progresiva de perfiles.

## ADDED Requirements

### Requirement: Niveles de acceso y restricción de aforo

UBICUO — El sistema debe asignar a cada usuario verificado un `trustLevel` inicial de 1 tras verificar su teléfono, o 0 si no cuenta con teléfono verificado.

UBICUO — Todo plan de nivel 1 debe requerir un mínimo de tres participantes confirmados para activarse y debe realizarse en un lugar público.

POR EVENTO — Cuando un usuario intenta unirse a un plan de nivel 2, el sistema debe verificar que su `trustLevel` sea igual a 2.

#### Scenario: Activación de plan nivel 1
- **WHEN** un plan de nivel 1 alcanza tres participantes confirmados en un lugar público
- **THEN** el sistema lo marca como activo y listo para la asistencia

#### Scenario: Intento de plan nivel 1 con solo 2 personas
- **WHEN** un plan de nivel 1 tiene menos de tres personas al llegar la hora
- **THEN** el sistema no lo activa como encuentro válido

#### Scenario: Acceso restringido a nivel 2
- **WHEN** un usuario con `trustLevel: 1` intenta unirse a un plan de nivel 2
- **THEN** el sistema rechaza la solicitud indicando que requiere desbloquear nivel con asistencias previas

---

### Requirement: Registro de asistencia exclusivo por QR

POR EVENTO — Cuando un participante escanea el código QR válido del plan o del anfitrión durante el evento, el sistema debe registrar el timestamp `checkedInAt` y cambiar el estado de `attendance` a `showed`.

NO DESEADO — El sistema no debe permitir que ningún usuario marque su propia asistencia como `showed` mediante autoreporte o sin escaneo de QR.

#### Scenario: Escaneo de QR exitoso
- **WHEN** un participante confirmado escanea el QR del plan en el lugar y hora estipulados
- **THEN** su registro en `attendance` pasa a `showed`
- **AND** su `score` de cumplimiento se incrementa

#### Scenario: Intento de autoreporte sin QR
- **WHEN** un usuario intenta enviar una mutación de check-in sin token de QR válido
- **THEN** el sistema rechaza la mutación

---

### Requirement: Revelación progresiva de identidad post-encuentro

POR ESTADO — Tras completarse la asistencia verificada (`showed`) entre dos participantes en un mismo plan, el sistema debe permitir que cada participante otorgue consentimiento independiente para compartir su perfil extendido.

POR EVENTO — Cuando el usuario A activa `revealedByA: true`, el sistema debe hacer visible su `extendedProfile` exclusivamente al usuario B con quien coincidió.

NO DESEADO — El sistema no debe exponer el perfil extendido (redes sociales o teléfono) a la contraparte si el autor no ha otorgado el opt-in explícito (`revealedBy`).

#### Scenario: Revelación unidireccional
- **WHEN** el usuario A activa la revelación para el usuario B tras el evento
- **THEN** el usuario B puede ver el perfil extendido de A
- **AND** el usuario A no ve el perfil extendido de B hasta que B también lo autorice

---

### Requirement: Actualización de puntaje y penalización por no-show

POR EVENTO — Cuando un plan concluye y un usuario en estado `confirmed` no registró escaneo de QR (`showed`), el sistema debe marcar su asistencia como `noShow` y reducir su `score` de cumplimiento.

COMPLEJO — Si el `score` de un usuario cae por debajo del umbral mínimo de confianza o si recibe un reporte de conducta, el sistema debe degradar su nivel de acceso revocando el nivel 2.

#### Scenario: Penalización por inasistencia
- **WHEN** finaliza el plan y el usuario no realizó check-in QR
- **THEN** su estado pasa a `noShow`
- **AND** su puntaje se reduce proporcionalmente
