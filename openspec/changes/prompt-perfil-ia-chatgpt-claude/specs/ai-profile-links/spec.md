## Purpose

Permite a los usuarios generar deep-links y prompts contextuales para ChatGPT y Claude que integran su perfil de gustos (tech, gastronomía, juegos, etc.) y zonas preferidas, facilitando la ideación de planes y la actualización de preferencias sin comprometer la privacidad ni revelar intenciones abiertas.

## ADDED Requirements

### Requirement: Generación de deep links contextuales para ChatGPT y Claude
El sistema DEBE generar URLs válidas para ChatGPT (`https://chatgpt.com/?q=...`) y Claude (`https://claude.ai/new?q=...`) que incluyan en el parámetro de consulta un prompt preconfigurado con el perfil de gustos del usuario, su zona aproximada y las instrucciones para el asistente.

#### Scenario: Usuario solicita enlace de exploración con IA desde la web
- **WHEN** el usuario hace clic en "Explorar con ChatGPT" o "Explorar con Claude" en la interfaz web
- **THEN** el sistema abre una nueva pestaña con la URL correspondiente conteniendo el prompt pre-llenado con sus gustos actuales y zona

#### Scenario: Usuario solicita enlace de perfil IA desde WhatsApp
- **WHEN** el usuario envía un comando o solicita explorar gustos con IA en WhatsApp
- **THEN** el sistema responde con los enlaces directos a ChatGPT y Claude conteniendo su contexto de preferencias

### Requirement: Filtrado de privacidad y exclusión de intenciones abiertas
El sistema DEBE construir el contexto del prompt utilizando únicamente etiquetas de gustos explícitas, planes asistidos pasados (categorías agregadas) y zona aproximada, y NO DEBE incluir bajo ninguna circunstancia intenciones en estado `open`, ubicaciones GPS exactas o datos de contacto privados.

#### Scenario: Generación de prompt para usuario con intención abierta activa
- **WHEN** un usuario que tiene una intención en estado `open` genera un enlace o prompt para ChatGPT/Claude
- **THEN** el prompt generado omite completamente cualquier mención o dato de dicha intención activa

### Requirement: Instrucción de retorno de preferencias estructuradas
El prompt generado DEBE incluir una instrucción al asistente de IA para que, al concluir la conversación de exploración con el usuario, proporcione un resumen estructurado de etiquetas de gustos sugeridas (formato texto simple o lista de tags) que el usuario pueda copiar o reenviar a Parchese para actualizar su perfil.

#### Scenario: Usuario explora nuevos temas con el asistente
- **WHEN** el asistente de IA conversa con el usuario sobre sus gustos en la ciudad
- **THEN** el asistente presenta al final las etiquetas identificadas (ej. `[tech, cowork, cafes-especialidad]`) listas para ser guardadas en Parchese
