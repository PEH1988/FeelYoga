# Antes de empezar

Estás trabajando con el CRM de tu empleador y con datos de clientes. Hacerlo bien desde el principio es parte
de la experiencia que vas a poder contar.

## 1. Conversación con IT / administración de Dynamics (15 minutos)

Llevá esta lista y anotá las respuestas:

- [ ] ¿Puedo crear flujos de Power Automate que **lean** oportunidades y actividades de Dynamics con mi usuario?
- [ ] ¿En qué **entorno** de Power Platform conviene crearlo? (¿Hay uno de desarrollo/sandbox con copia de datos?)
- [ ] ¿Hay **políticas DLP** que impidan combinar Dataverse con Teams/Office 365 en un mismo flujo?
- [ ] ¿Mi licencia de Dynamics 365 / Copilot Studio cubre el conector de Dataverse en Power Automate?
      (Dataverse es un conector premium; las licencias de Dynamics y de Copilot Studio suelen incluir derechos
      de uso en su contexto, pero lo confirma IT.)
- [ ] ¿Hay una **política interna de uso de IA** que deba seguir para que un agente procese datos del CRM?
- [ ] ¿Qué campos usamos para etapa de venta, monto y "propuesta enviada"? ¿Hay campos personalizados?
- [ ] (Fase 2) ¿Puedo crear actividades (tareas/llamadas) en Dynamics desde un flujo?

Si la respuesta a la lectura o a DLP es "no", no lo hagas por fuera: proponelo como proyecto con IT. Esa propuesta
también es experiencia valiosa.

## 2. Reglas que este diseño respeta

- **Sólo tus oportunidades** (`ownerid = usuario de la conexión`). Nada de cartera ajena.
- **Fase 1 sólo lectura.** No modifica Dynamics.
- **No envía nada a clientes.** El agente redacta; vos revisás y enviás.
- **No toca datos de salud** de afiliados: trabaja con datos comerciales de la oportunidad (empresa, etapa, fechas).
- **Nada sale del tenant:** no subas exportaciones, capturas con datos reales ni la solución con conexiones a GitHub.

## 3. Línea de base (empezá hoy, antes de construir)

Durante 1–2 semanas anotá, una vez por semana:

| Fecha | Oportunidades abiertas | Con más de 5 días sin contacto registrado | Tiempo que dedicaste a revisar el pipeline (min/semana) | Propuestas que se "enfriaron" sin follow-up |
|---|---|---|---|---|
| | | | | |

Podés sacar los dos primeros números de una vista de Dynamics. Sin línea de base no hay "antes/después" honesto.
