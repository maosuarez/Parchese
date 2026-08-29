## 1. Extensiones de Esquema en Convex

- [ ] 1.1 Declarar tablas `attendance`, `matches` y campos de confianza (`trustLevel`, `score`, `extendedProfile`) en `convex/schema.ts` y verificar que el deployment actualiza los esquemas.
- [ ] 1.2 Crear el índice `by_user` en `attendance` sobre `["userId", "status"]` y verificar la compilación de índices.

## 2. Check-in por QR y Reglas de Nivel

- [ ] 2.1 Implementar mutación `checkInWithQR` en `convex/trust.ts` que valida el token del plan, marca `showed` y registra timestamp `checkedInAt`.
- [ ] 2.2 Implementar validación en la mutación de unirse a un plan para exigir `trustLevel >= requiredTrustLevel` y verificar rechazo cuando el usuario no cumple el nivel.
- [ ] 2.3 Implementar regla de aforo mínimo de 3 personas para planes de nivel 1 antes de activarse y verificar que no se active con 2 o menos.

## 3. Progresión y Revelación Progresiva

- [ ] 3.1 Implementar cálculo de score y ascenso a nivel 2 tras 3 asistencias efectivas (`showed`) y verificar el cambio de nivel en el usuario.
- [ ] 3.2 Implementar mutación `revealContact` que actualiza `revealedByA` o `revealedByB` y verificar que la query de perfil extendido solo expone los datos si la bandera correspondiente está activa.
