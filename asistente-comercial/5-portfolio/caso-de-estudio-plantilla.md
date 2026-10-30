# Asistente Comercial en Teams con Copilot Studio y Power Automate

*Demo de portfolio en tenant de prueba · Datos ficticios · [mes/año]*

## Problema (escenario simulado)
Un equipo comercial pierde tiempo buscando precios y condiciones en documentos dispersos, y las aprobaciones
de descuentos se piden por chat sin registro.

## Solución
- Agente en **Teams** hecho con **Copilot Studio** que responde con documentos de **SharePoint** y cita la fuente.
- **Power Automate:** registro de consultas en una lista de SharePoint y aprobación de descuentos con la app
  **Aprobaciones**, con aviso por Teams y manejo de vencimientos.
- Reglas de negocio: ≤10 % automático, 10–25 % con aprobación, >25 % bloqueado por el agente.

[Diagrama: Teams → Agente → (Conocimiento SharePoint) / (Flujo A → Lista) → Flujo B → Aprobaciones → Teams]

## Mi rol
Diseño, construcción y pruebas de punta a punta. [Detallá qué hiciste vos.]

## Resultados de las pruebas (reales)
- [X] de [Y] preguntas respondidas correctamente con la fuente adecuada.
- [X] de [Y] preguntas fuera de alcance rechazadas sin inventar.
- Aprobación disponible en Teams en ~[N] segundos tras la solicitud.

## Qué aprendí
- [Problema real 1 y cómo lo resolviste]
- [Problema real 2]

## Qué haría para producción
Variables de entorno, entornos separados, cuentas de servicio, analítica de conversaciones, políticas DLP.

## Herramientas
Microsoft Copilot Studio · Power Automate · SharePoint Online · Microsoft Teams · PnP PowerShell
