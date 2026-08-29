## 1. Query Reactiva en Convex

- [ ] 1.1 Implementar query `recentMatches` en Convex que retorna los últimos 5 planes con `origin: "matched"` ordenados por creación.
- [ ] 1.2 Implementar query `liveMetrics` en Convex que devuelve el contador total de planes y usuarios activos.

## 2. Vista de Proyector y Estilos

- [ ] 2.1 Crear la ruta `web/src/routes/demo.tsx` con layout fixed (sin scroll), fondo de alto contraste y tipografía escalada para 5 metros de distancia.
- [ ] 2.2 Integrar los contadores numéricos gigantes en el encabezado vinculados a `liveMetrics`.
- [ ] 2.3 Implementar lista reactiva de planes recientes vinculada a `recentMatches`.

## 3. Animaciones y Validación en Vivo

- [ ] 3.1 Añadir transiciones animadas de entrada para tarjetas nuevas que ingresen por WebSocket.
- [ ] 3.2 Verificar en navegador que al disparar `matching:sembrarIntencion` desde Convex, la tarjeta del plan entra sola a la pantalla con animación en menos de 1 segundo.
