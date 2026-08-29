## Context

Parchese utiliza Convex como backend central y TanStack Start en `web/`, además de un bot de WhatsApp para ingesta rápida de intenciones. Los usuarios poseen intereses y preferencias que enriquecen las recomendaciones. Para ofrecer una experiencia de ideación conversacional avanzada sin construir una interfaz LLM pesada dentro de la app, se utiliza el patrón de deep-linking externo (similar a Supabase) que abre ChatGPT o Claude con un prompt pre-cargado y contextualizado con el perfil del usuario.

## Goals / Non-Goals

**Goals:**
- Producir URLs universales de deep-linking para ChatGPT (`https://chatgpt.com/?q=...`) y Claude (`https://claude.ai/new?q=...`) con prompts formateados.
- Exponer un generador y sanitizador de contexto de usuario en Convex que consolide gustos (tech, comida, cowork, etc.), zona aproximada y franjas horarias.
- Permitir invocación desde la interfaz web (botón de exportación/consulta) y desde WhatsApp (enlace enviado al usuario).
- Diseñar la plantilla de prompt para que el asistente de IA retorne etiquetas estructuradas fáciles de guardar en Parchese.

**Non-Goals:**
- No alojar ni pagar por inferencia de modelos LLM propietarios en el backend para esta funcionalidad; se delega en las sesiones existentes de los usuarios en ChatGPT/Claude.
- No guardar transcripciones de chat completas de ChatGPT/Claude en la base de datos de Parchese.

## Decisions

### 1. Construcción del Prompt y Codificación en URL
- **Decisión:** Para prompts estándar (< 1500 caracteres), codificar el prompt directamente en el query parameter `q` usando `encodeURIComponent`.
- **Alternativa considerada:** Usar siempre un enlace web intermedio. Se descartó como método único porque abrir directamente ChatGPT o Claude con el texto precargado tiene menor fricción y funciona de inmediato en móviles y navegadores de escritorio.
- **Soporte de lectura externa (patrón Supabase):** Opcionalmente, para catálogos o perfiles más amplios, soportar el prefijo `Read from https://parchese.app/api/profile-export/:token` para que ChatGPT en modo búsqueda web pueda leer el contexto.

### 2. Estructura de la Plantilla del Prompt
El prompt generado contendrá:
1. **Rol:** Asistente de exploración y recomendación de planes urbanos para Parchese.
2. **Contexto del Usuario:** Nombre, zona aproximada (ej. Chapinero, Poblado) y lista de intereses actuales (ej. `[tecnología, cafés de especialidad, juegos de mesa]`).
3. **Instrucciones:** Ayudar al usuario a formular planes atractivos en lugares públicos y sugerir nuevas categorías afines.
4. **Formato de Cierre:** Solicitar al asistente que al final liste las etiquetas de gustos consensuadas en formato `[tags: ...]`.

### 3. Sanitización Estricta de Privacidad en Convex
- **Decisión:** La función generadora `getAiProfileContext` solo lee campos de `users` (etiquetas de gustos, zona aproximada, trustLevel) y categorías agregadas de planes pasados completados (`attendance.showed`).
- **Garantía:** Prohibición explícita de incluir registros de `intents` en estado `open` o datos de geolocalización precisa.

## Risks / Trade-offs

- **[Riesgo] Cambios en los parámetros de query de ChatGPT / Claude** → *Mitigación:* Centralizar los constructores de enlaces en un módulo helper reutilizable (`convex/aiLinks.ts` y `web/src/lib/aiLinks.ts`) con pruebas unitarias.
- **[Riesgo] Límites de longitud de URL en navegadores o WhatsApp** → *Mitigación:* Diseñar un prompt conciso y compacto (< 600 caracteres) y proveer versión reducida de fallback.
- **[Riesgo] Intentos de generar planes en lugares privados** → *Mitigación:* El prompt base incluye la directriz explícita de sugerir siempre lugares y espacios públicos.
