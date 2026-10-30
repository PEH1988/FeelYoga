# Seguimiento de propuestas B2B — Dynamics 365 + Power Automate + Teams + Copilot Studio

Proyecto para un rol de **Account Executive B2B** (venta de planes de salud corporativos) que ataca un problema
concreto: **propuestas enviadas a empresas que se quedan sin seguimiento a tiempo**.

> Material **genérico**: no contiene datos, procesos, precios ni nombres internos de ninguna empresa.
> La adaptación a tu organización se hace dentro de tu tenant, no en este repositorio.

## Qué hace

1. **Recordatorio diario en Teams (Power Automate).** Cada mañana revisa *tus* oportunidades abiertas en
   Dynamics 365, calcula cuántos días pasaron desde el último contacto registrado y te manda por Teams una tarjeta
   con las que superan el umbral (por defecto 5 días), con enlace directo a cada una.
2. **Agente "Copiloto de seguimiento" en Teams (Copilot Studio).** Le preguntás "¿qué propuestas tengo frías?" o
   "redactame un follow-up para la empresa X" y responde con datos de Dynamics. **Redacta, no envía:** el mail lo
   revisás y lo mandás vos desde Outlook.
3. **Medición antes/después** para tener resultados reales que contar.
4. **(Fase 2, sólo con autorización)** registrar el seguimiento como actividad en Dynamics desde el agente.

## Arquitectura

```
                    ┌──────────────────────── Dynamics 365 (Dataverse) ───────────────────────┐
                    │  Oportunidades (ownerid = vos, abiertas)   Actividades (regarding = opp) │
                    └──────────────▲───────────────────────────────────────▲──────────────────┘
                                   │ sólo lectura (fase 1)                  │
 Programado 8:00 L-V ──► Flujo 1: Recordatorio diario ──► Tarjeta adaptativa en tu chat de Teams
                                   │
 Vos en Teams ──► Agente Copilot Studio ──► Herramienta: Flujo 2 "Propuestas sin seguimiento"
                         │                ──► Herramienta: Flujo 3 "Detalle de oportunidad"
                         │                ──► (Fase 2) Flujo 4 "Registrar seguimiento"  ── escribe actividad
                         └─(conocimiento opcional)─► SharePoint: documentos comerciales del equipo
```

## Archivos

| Archivo | Para qué |
|---|---|
| `0-antes-de-empezar.md` | Permisos, licencias, conversación con IT/CRM y línea de base. **Leelo primero.** |
| `flujos/flujo-1-recordatorio-diario.md` | Paso a paso, FetchXML y expresiones |
| `flujos/consulta-oportunidades.fetchxml` | Consulta de oportunidades abiertas propias |
| `flujos/tarjeta-recordatorio.json` | Plantilla de la tarjeta adaptativa |
| `flujos/flujo-2-3-herramientas-agente.md` | Flujos que usa el agente |
| `flujos/flujo-4-registrar-seguimiento.md` | Fase 2 (escritura en Dynamics) |
| `agente/configuracion-agente.md` | Instrucciones, herramientas, autenticación y publicación |
| `medicion/medicion-y-pruebas.md` | Métricas antes/después y casos de prueba |
| `portfolio/como-contarlo.md` | Cómo contarlo en CV/LinkedIn/entrevista sin exponer datos internos |

## Orden de construcción

| Semana | Qué |
|---|---|
| 0 | Hablar con IT/CRM (`0-antes-de-empezar.md`) y empezar a medir la línea de base |
| 1 | Flujo 1. Usarlo todos los días y ajustar el umbral y los filtros |
| 2 | Agente con flujos 2 y 3. Probar con los casos de `medicion/` |
| 3–4 | Seguir midiendo. Si te autorizan, fase 2. Compartir con 1–2 colegas si sirve |

## Limitaciones conocidas

- "Último contacto" = última actividad **completada** vinculada a la oportunidad. Si el equipo no registra
  llamadas o mails en Dynamics, el recordatorio va a marcar como frías propuestas que no lo están. Eso en sí es un
  hallazgo útil (y una buena historia: el sistema mejoró la disciplina de registro).
- Los nombres de campos (etapa, valor estimado) pueden estar personalizados en tu organización. Verificalos con
  el administrador o en la configuración de la tabla Oportunidad.
- Nombres de acciones y menús de Power Automate/Copilot Studio cambian entre versiones; seguí la lógica.
