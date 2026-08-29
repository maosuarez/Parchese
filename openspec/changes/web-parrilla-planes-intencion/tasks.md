## 1. Conexión de Convex y Tipos de Datos

- [ ] 1.1 Configurar el `ConvexProvider` en el root layout de `web/` (`web/src/routes/__root.tsx`) y verificar conexión exitosa con el backend local.
- [ ] 1.2 Actualizar `web/src/types/index.ts` corrigiendo `SocialBattery` hacia `PlanIntensity` (intensidad del plan) y verificar que los tipos compilan sin errores.
- [ ] 1.3 Ocultar rutas no funcionales (`/rewards`, `/business`) del menú de navegación y barra lateral.

## 2. Parrilla de Planes Reactiva

- [ ] 2.1 Conectar la ruta principal (`web/src/routes/index.tsx`) a la query `useQuery(api.plans.listUpcoming)` y verificar renderizado con datos de Convex.
- [ ] 2.2 Actualizar los componentes de tarjeta de plan para mostrar la señal previa ("X personas ya van · dura Y min") y la zona aproximada.
- [ ] 2.3 Implementar filtros rápidos por zona (Chapinero, Usaquén, Teusaquillo, etc.) y verificar el filtrado en cliente.

## 3. Puerta de Intención ("Yo voy")

- [ ] 3.1 Implementar botón "Yo voy" en las tarjetas de plan conectado a la mutación de creación de intención (`source: "web"`).
- [ ] 3.2 Verificar que al pulsar "Yo voy" se crea la intención en Convex y se muestra feedback visual sin recargar la página.
