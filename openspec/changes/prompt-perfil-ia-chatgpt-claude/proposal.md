## Why

Muchos usuarios quieren explorar planes afines o definir sus gustos (ej. tecnología, gastronomía, juegos, cowork) usando asistentes conversacionales como ChatGPT o Claude. Siguiendo el patrón de deep-linking de herramientas como Supabase, Parchese puede generar enlaces directos y prompts contextuales que carguen el perfil de preferencias del usuario sin fricción, permitiéndole recibir mejores recomendaciones e interactuar desde WhatsApp o la web.

## What Changes

- **Generador de Deep Links para ChatGPT y Claude**: Creación de URLs preparadas (`https://chatgpt.com/?q=...` y `https://claude.ai/new?q=...`) con prompts estructurados que contienen los intereses, zonas preferidas y franjas habituales del usuario.
- **Endpoint / Exportador de Contexto Seguro de Usuario**: Generación de un resumen legible (Markdown/JSON seguro) con etiquetas de gustos (tech, comida, café, etc.), nivel de confianza y zonas, sin exponer datos privados.
- **Integración en WhatsApp y Web**:
  - Comando o enlace enviado por el bot de WhatsApp para abrir la sesión en ChatGPT/Claude con un toque.
  - Botón de acción en la app web ("Abrir en ChatGPT" / "Abrir en Claude") para explorar planes o refinar gustos.
- **Sintetizador de Retorno de Gustos**: Instrucción clara en el prompt para que el asistente de IA entregue al usuario un resumen formateado de etiquetas de gustos que el usuario puede guardar en Parchese.

## Capabilities

### New Capabilities
- `ai-profile-links`: Generación de enlaces profundos (deep links), prompts contextuales y exportación de perfil de gustos para asistentes de IA (ChatGPT y Claude) desde WhatsApp y Web.

### Modified Capabilities
*(Ninguna)*

## No-gos

- **No exponer intenciones `open`**: Ninguna intención abierta o no emparejada se incluye en el prompt o contexto exportado.
- **No diagnósticos de salud o ánimo**: Prohibido evaluar sociabilidad, sedentarismo o energía social.
- **No coordenadas exactas**: Solo se comparten zonas o ciudades aproximadas.
- **No onboarding obligatorio**: El uso de ChatGPT/Claude es optativo; el usuario no está obligado a usar IA para usar Parchese.

## Impact

- **Backend (Convex)**: Query/acción para componer el payload de contexto seguro del usuario y firmar/generar URLs de deep-link.
- **Canal WhatsApp**: Nuevo comando/disparador conversacional para enviar el enlace al usuario.
- **Web (`web/`)**: Componente de exportación / botón de deep-link en la vista de perfil o explorador de planes.
