# Seguimiento de propuestas B2B con Power Automate, Dynamics 365, Teams y Copilot Studio

**Caso de estudio · Account Executive B2B · Planes de salud corporativos**

> **Estado:** en construcción. Las secciones de resultados se completan con datos medidos, no con estimaciones.
> Este repositorio describe el problema, el diseño y el proceso. No contiene datos de clientes, procesos internos,
> precios ni capturas del entorno de la empresa.

---

## 1. Contexto

Trabajo como Account Executive B2B vendiendo planes de salud a empresas. Un ciclo de venta típico incluye
relevamiento, cotización, envío de propuesta, negociación y cierre, y puede durar semanas. Las oportunidades
se registran en **Dynamics 365**, y el trabajo diario pasa por **Outlook y Teams**.

## 2. Punto de dolor

**Las propuestas enviadas se enfrían por falta de seguimiento a tiempo.**

- Después de enviar una propuesta, el siguiente paso depende de acordarse de volver a contactar.
- Con decenas de oportunidades abiertas en distintas etapas, revisar el pipeline a mano para detectar cuáles
  llevan días sin contacto es lento y fácil de postergar.
- Dynamics tiene la información (oportunidades y actividades), pero no me avisa en el lugar donde trabajo
  todo el día (Teams).
- Redactar cada follow-up desde cero suma tiempo a una tarea que ya se posterga.

**Costo del problema:** una propuesta sin follow-up en la ventana correcta pierde impulso frente a la competencia
o queda olvidada del lado del cliente.

## 3. Cómo llegué a la solución

1. **Identifiqué el dolor en mi propio trabajo:** el seguimiento era la tarea que más se me escapaba. <!-- Contalo con tus palabras: un caso concreto (sin nombres) en que una propuesta se enfrió. -->
2. **Medí antes de construir:** registré durante [N] semanas cuántas oportunidades tenía abiertas, cuántas llevaban
   más de 5 días sin contacto registrado y cuánto tiempo dedicaba a revisar el pipeline. ([Completar])
3. **Revisé qué herramientas ya tenía:** Dynamics 365, Power Automate, Teams, SharePoint y Copilot Studio vienen
   con mi cuenta de la empresa. La idea fue construir sobre eso, sin herramientas nuevas ni costos extra.
4. **Validé permisos antes de tocar el CRM:** consulté con IT/administración de Dynamics sobre lectura de datos,
   entorno, políticas de prevención de pérdida de datos (DLP), licencias y uso de IA
   (ver [`proceso-gobernanza.md`](proceso-gobernanza.md)).
5. **Empecé por lo mínimo útil:** un recordatorio diario de sólo lectura. Recién con eso funcionando agregué el agente.

## 4. Solución

```
Dynamics 365 ── oportunidades propias abiertas + última actividad completada
     │
     ├──► Power Automate (L a V, 8:00) ──► tarjeta en Teams: "propuestas para hacer follow-up hoy"
     │                                     ordenadas por días sin contacto, con enlace a cada una
     │
     └──► Copilot Studio (agente en Teams)
             · "¿Qué propuestas tengo frías?"
             · "Redactame un follow-up para la empresa X" → borrador; yo reviso y envío desde Outlook
```

| Componente | Qué hace |
|---|---|
| **Recordatorio diario** (Power Automate) | Lee mis oportunidades abiertas, calcula los días desde el último contacto registrado y me envía una tarjeta en Teams con las que superan un umbral configurable |
| **Copiloto de seguimiento** (Copilot Studio) | Agente en Teams con dos herramientas (flujos): lista de propuestas frías y detalle de una oportunidad. Redacta borradores de follow-up con un próximo paso concreto |
| **Medición** | Comparación antes/después con las mismas métricas |

## 5. Decisiones de diseño

| Decisión | Por qué |
|---|---|
| Sólo **lectura** del CRM en la primera fase | Menor riesgo, aprobación más simple, y suficiente para resolver el dolor principal |
| Filtrar por **"usuario actual"** (`eq-userid`) en las consultas | Cada persona ve sólo su cartera; ningún dato de otros vendedores |
| "Último contacto" = última **actividad completada** vinculada a la oportunidad | Es el dato que ya existe en Dynamics; no requiere campos nuevos |
| El agente **redacta, no envía** | La comunicación con clientes queda bajo control humano |
| El agente no afirma **precios ni coberturas** | Evita información incorrecta; deja marcadores para completar |
| Umbral de días como **variable de entorno** en una **solución** | Se ajusta sin editar el flujo, y la solución se puede exportar y mover entre entornos |
| El aviso llega a **Teams** y no por mail | Es donde paso el día; un mail más se pierde |

## 6. Seguridad y gobernanza

- Desarrollado con permiso de IT, dentro del entorno de Power Platform indicado y respetando las políticas DLP.
- Sin datos de salud de personas: sólo datos comerciales de la oportunidad (empresa, etapa, fechas).
- El agente no se comparte hasta definir que cada persona use sus propias credenciales.
- Nada de la implementación real (solución exportada, capturas, datos) se publica en este repositorio.

## 7. Resultados

> Completar sólo con valores medidos.

| Métrica | Antes | Después ([N] semanas) |
|---|---|---|
| Oportunidades abiertas con más de 5 días sin contacto registrado | | |
| Tiempo semanal revisando el pipeline (min) | | |
| Propuestas que se enfriaron sin follow-up | | |
| Tiempo para redactar un follow-up (min) | | |

**Hallazgos cualitativos:** [Completar. Por ejemplo, si el sistema mostró contactos que no estaban registrados
en el CRM y eso cambió el hábito de registro.]

## 8. Aprendizajes y próximos pasos

- [Completar con problemas reales que aparecieron y cómo los resolviste.]
- Próximo paso posible: registrar el seguimiento como actividad en Dynamics desde el agente (requiere autorización de escritura).
- Próximo paso posible: compartirlo con el equipo, con credenciales por usuario y validación de IT.

## Stack

Microsoft Dynamics 365 (Dataverse) · Power Automate (flujos programados y flujos de agente, FetchXML, expresiones) ·
Microsoft Teams (tarjetas adaptativas) · Copilot Studio (orquestación generativa, herramientas)
