# Proceso y gobernanza: antes de construir

El proyecto trabaja con el CRM de la empresa y con datos de clientes. Antes de construir, validé estos puntos.

## 1. Consulta con IT / administración de Dynamics

- [ ] Permiso para crear flujos de Power Automate que **lean** oportunidades y actividades de Dynamics con mi usuario.
- [ ] **Entorno** de Power Platform donde desarrollarlo (y si existe uno de desarrollo o sandbox).
- [ ] **Políticas DLP**: que permitan usar Dataverse y Teams/Office 365 en el mismo flujo.
- [ ] **Licencias**: cobertura del conector de Dataverse (premium) en Power Automate y uso de Copilot Studio.
- [ ] **Política interna de IA** para que un agente procese datos del CRM.
- [ ] Campos que usa la organización para etapa, monto y fecha estimada de cierre (incluidos campos personalizados).
- [ ] (Fase 2) Permiso para crear actividades en Dynamics desde un flujo.

## 2. Reglas que respeta el diseño

- **Sólo mis oportunidades**: las consultas filtran por el usuario de la conexión.
- **Primera fase sólo lectura**: no modifica Dynamics.
- **No envía nada a clientes**: el agente redacta borradores; el envío es manual.
- **Sin datos de salud** de personas: sólo datos comerciales de la oportunidad.
- **Nada sale del tenant**: ni exportaciones, ni capturas con datos reales, ni la solución en repositorios públicos.

## 3. Línea de base

Antes de usar el sistema, medí durante [N] semanas:

| Semana | Oportunidades abiertas | Más de 5 días sin contacto registrado | Minutos por semana revisando el pipeline | Propuestas que se enfriaron sin follow-up |
|---|---|---|---|---|
| | | | | |
