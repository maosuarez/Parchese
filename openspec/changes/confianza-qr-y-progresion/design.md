## Context

Ver `proposal.md`, `docs/02-confianza-y-progresion.md` y `docs/03-modelo-de-datos.md`. Este cambio implementa el backend de confianza en Convex (`schema.ts` y `trust.ts`) liderado por Dev B.

## Goals / Non-Goals

**Goals:**
- Extender el schema con las tablas `attendance`, `matches` y campos `trustLevel`, `score`, `extendedProfile` en `users`.
- Implementar mutación transaccional de check-in por QR con verificación criptográfica simple o token de un solo uso asociado al plan.
- Implementar cálculo de puntaje y promoción a Nivel 2 (ej. 3 asistencias cumplidas sin reportes).
- Implementar endpoints para opt-in de revelación progresiva (`revealContact`).

**Non-Goals:**
- UI de escaneo en cámara del frontend (eso lo consume Dev C).
- Implementar rankings globales o tablas de líderes.

## Decisions

### 1. Check-in mediante mutation pura en `convex/trust.ts`
- **Decisión:** La mutación `checkInWithQR` recibe `{ planId, qrToken }`. Valida que el plan esté en curso, que el usuario esté en `attendance` y actualiza atómicamente a `showed`.
- **Razón:** Las mutaciones de Convex son atómicas, evitando dobles check-ins o condiciones de carrera.

### 2. Tabla `matches` con flags bilaterales
- **Decisión:** Al terminar el plan, se crean registros en `matches` para cada par de asistentes confirmados con `revealedByA: false` y `revealedByB: false`.
- **Razón:** Mantiene el desacoplamiento: cada persona decide si comparte sus redes después de conocer al otro en persona.

### 3. Índice para cálculo eficiente de score
- **Decisión:** Índice en `attendance` por `["userId", "status"]`.
- **Razón:** Permite sumar rápidamente cuántos `showed` y cuántos `noShow` tiene un usuario para actualizar su puntaje sin recorrer toda la base de datos.

## Risks / Trade-offs

- **[Riesgo: Compartir foto del QR remotamente]** → Para mitigar en el futuro se pueden usar tokens temporales rotativos (TOTP), pero para el alcance actual del demo un token por plan es suficiente.
- **[Riesgo: Plan de nivel 1 con 2 personas que se presentan]** → El sistema marca el plan como no activado con antelación si no se llega a 3 confirmados, evitando que la gente quede en parejas desconocidas en nivel 1.
