## 1. Utilidades y Generador de Prompts

- [ ] 1.1 Implementar módulo utilitario de generación de prompts y deep-links para ChatGPT y Claude con codificación segura de URLs y verificar mediante pruebas unitarias.
- [ ] 1.2 Implementar query/helper en Convex (`aiProfile.ts`) que extraiga intereses agregados, zona y confianza sin incluir intenciones `open` y verificar con test en backend.

## 2. Integración en la App Web

- [ ] 2.1 Crear componente UI (`AiExplorerButtons.tsx`) con botones de acción para abrir ChatGPT y Claude con el prompt contextualizado y verificar su renderizado interactivo.
- [ ] 2.2 Integrar el componente en la página de perfil y en el explorador de planes en `web/` y verificar que abre las pestañas externas con la query correcta.

## 3. Integración en Canal WhatsApp y Validación de Flujo

- [ ] 3.1 Añadir manejo conversacional en el bot de WhatsApp para generar y responder con enlaces de ChatGPT y Claude ante solicitudes de exploración de gustos y verificar con pruebas de mensajes.
- [ ] 3.2 Validar de extremo a extremo el formato del prompt asegurando que el asistente genera recomendaciones de lugares públicos y retorna etiquetas `[tags: ...]` para guardar en Parchese.
