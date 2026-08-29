# Propuesta — Escalera de Confianza, Check-in QR y Revelación Progresiva

## Why

El mayor valor de conectar personas ocurre en planes pequeños (2–4 personas), pero también es donde mayor es el riesgo percibido y real de seguridad y no-show. Para permitir planes íntimos sin comprometer la seguridad, el acceso debe ganarse mediante historial verificable y no asumirse al registrarse.

## What Changes

- **Tablas `attendance` y `matches` en Convex**: Estructura de datos para registrar confirmación, escaneo de QR presencial y opt-in mutuo de revelación.
- **Validación de asistencia presencial por QR (`convex/trust.ts`)**: Endpoint seguro para marcar estado `showed` exclusivamente mediante escaneo del código QR del plan o anfitrión.
- **Escalera de confianza (Niveles 0, 1, 2)**:
  - Nivel 0: Eventos masivos públicos.
  - Nivel 1: Planes en lugar público con **mínimo 3 personas** y actividad concreta.
  - Nivel 2: Planes íntimos (2–3 personas), desbloqueado por historial comprobado.
- **Revelación progresiva de identidad**: El perfil extendido (redes sociales/contacto) solo es accesible para la contraparte si existe consentimiento explícito e independiente post-encuentro (`revealedByA`, `revealedByB`).
- **Ajuste de puntaje por cumplimiento**: Aumento de score al asistir (`showed`), penalización por `noShow` o reporte, recalculando el nivel de confianza sin generar ranking global.

## Capabilities

### New Capabilities
- `trust-and-progression`: Gestión de niveles de confianza (0/1/2), check-in de asistencia por QR, reglas de aforo mínimo (regla de 3), cálculo de score de cumplimiento y revelación progresiva post-match.

### Modified Capabilities
*(Ninguna)*

## No-gos

- **`showed` nunca se autoreporta.** Solo se valida mediante lectura de QR.
- **Planes en lugares privados están prohibidos en todos los niveles.** Siempre lugar público.
- **Planes de nivel 1 nunca se activan con solo dos personas.** Mínimo tres.
- **Sin ranking global ni gamificación tipo XP.** El puntaje es una llave de acceso, no un juicio de valor social ni competencia.
- **No revelar perfiles extendidos por defecto.** Requiere opt-in bilateral e independiente tras el encuentro.

## Impact

- Nuevas tablas e índices en `convex/schema.ts`: `attendance`, `matches`, `users.trustLevel`, `users.score`.
- Lógica en `convex/trust.ts` invocada tras escaneo de QR y mutaciones de confirmación de planes.
