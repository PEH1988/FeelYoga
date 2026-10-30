# Cómo contar este proyecto con honestidad

Lo que hace honesta esta experiencia es que **la construcción en Microsoft 365 la hagas vos**: crear el sitio,
el agente, los flujos, probar, romper y arreglar. Este repositorio es el diseño y el material de partida.

## Qué podés decir (si lo hiciste)

- "Diseñé y construí una **demo** de un asistente comercial en Teams con Copilot Studio, usando documentos de
  SharePoint como base de conocimiento, en un **tenant de prueba**."
- "Implementé dos flujos de Power Automate: uno que registra consultas en una lista de SharePoint y otro,
  asíncrono, que gestiona aprobaciones de descuentos con la app Aprobaciones y notifica por Teams."
- "Separé registro y aprobación porque el agente no puede esperar días a que alguien apruebe."
- "Definí casos de prueba, incluyendo los que el agente no debe responder, y medí X de Y respuestas correctas."
- "Usé IA como ayuda para preparar los documentos de ejemplo y el diseño inicial; la configuración, la integración
  y las pruebas las hice yo." (Decirlo suma: es como se trabaja hoy.)

## Qué NO decir

- Que fue para un cliente o una empresa real, o que está "en producción".
- Métricas de negocio inventadas ("redujo 40 % el tiempo de respuesta"). Sólo las que midas en tus pruebas.
- Que FeelYoga usa esto: FeelYoga es la marca de un proyecto web de tu portfolio y aquí los datos son ficticios.
- Que dominás algo que no tocaste (por ejemplo ALM con pipelines, si no exportaste ni importaste la solución).

## Preguntas de entrevista que te pueden hacer (y conviene poder responder)

1. **¿Por qué la aprobación no ocurre dentro del flujo que llama el agente?** Por el límite de tiempo de respuesta
   de los flujos de agente y porque una aprobación es humana y puede tardar días.
2. **¿Qué pasa si alguien sin permisos le pregunta al agente?** Con autenticación de Microsoft y SharePoint como
   conocimiento, el agente sólo usa contenido que ese usuario puede leer.
3. **¿Cómo evitás que invente precios?** Instrucciones restrictivas, desactivar conocimiento general, citar
   fuente y casos de prueba negativos (bloque B).
4. **¿El registro de consultas es confiable?** En el tema de descuentos sí (llamada determinística). En consultas
   informativas depende del orquestador; para producción usaría el registro de conversaciones / analítica
   de Copilot Studio o un tema que fuerce la llamada.
5. **¿Cómo lo pasarías a producción?** Solución con variables de entorno (aprobador, URL del sitio), entornos
   dev/test/prod, referencias de conexión con cuentas de servicio, revisión de licencias y DLP.
6. **¿Qué licencias hacen falta?** Copilot Studio (prueba o licencia), Microsoft 365 con SharePoint y Teams;
   SharePoint, Aprobaciones y Teams son conectores estándar de Power Automate.

## Evidencia para el portfolio

- Video corto (2–3 min): pregunta → respuesta con cita → pedido de descuento → aprobación en Teams → lista actualizada.
- Capturas: agente en Teams, lista con estados, historial de ejecución de los flujos, aprobación.
- La solución exportada (`.zip`) en `6-export-solucion/` y la tabla de pruebas completada.
- Una sección "Qué aprendí / qué cambiaría" con problemas reales que encontraste.
