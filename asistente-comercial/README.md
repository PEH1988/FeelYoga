# Asistente Comercial FeelYoga — Copilot Studio + SharePoint + Power Automate

Demo de portfolio: un agente en **Microsoft Teams** que responde dudas comerciales con documentos de **SharePoint**,
registra las consultas en una lista y gestiona **aprobaciones de descuentos** con **Power Automate**.

> FeelYoga es la marca de un proyecto web de este repositorio. Todos los precios, políticas y datos comerciales
> de esta carpeta son **ficticios**.

## Qué hay acá y qué tenés que hacer vos

Este repositorio tiene el diseño, los documentos de ejemplo, el script de SharePoint, las instrucciones del agente,
el tema, los flujos paso a paso y los casos de prueba. **La construcción en Microsoft 365 la hacés vos en tu tenant**:
eso es lo que convierte esto en experiencia real que podés contar (ver `5-portfolio/como-contarlo-con-honestidad.md`).

## Arquitectura

```
 Vendedor en Teams
        │
        ▼
 Agente Copilot Studio ──(conocimiento)──► SharePoint: /Shared Documents/Comercial/*.docx
        │
        ├─ consulta informativa ──► Flujo A: Registrar consulta ──► Lista ConsultasComerciales
        │                                         ▲
        └─ tema "Solicitar descuento"             │ (Estado = Pendiente de aprobación)
             ├─ >25 %: bloquea                    │
             └─ ≤25 %: llama al Flujo A ──────────┘
                                                  │ dispara
                                                  ▼
                                   Flujo B: Aprobación de descuento
                                     ├─ Aprobaciones (Teams/email) a Coordinación Comercial
                                     ├─ actualiza Estado / Aprobador / Comentario / Fecha
                                     ├─ vence a los 3 días → Estado "Vencida"
                                     └─ avisa al vendedor por chat de Teams
```

**Decisión clave:** el agente espera la respuesta de un flujo sólo un tiempo corto, y una aprobación puede tardar
días. Por eso el Flujo A sólo registra y responde al instante, y el Flujo B (disparado por la lista) gestiona la
aprobación de forma asíncrona.

## Estructura

| Carpeta | Contenido |
|---|---|
| `1-sharepoint/documentos/` | 4 documentos comerciales (Markdown + `.docx` en `docx/`) |
| `1-sharepoint/crear-lista-y-subir-documentos.ps1` | PnP PowerShell: sube documentos y crea la lista |
| `1-sharepoint/lista-ConsultasComerciales.md` | Esquema de la lista |
| `2-copilot-studio/` | Instrucciones del agente y tema "Solicitar descuento" (YAML) |
| `3-power-automate/` | Flujo A (registro) y Flujo B (aprobación), paso a paso con expresiones |
| `4-pruebas/casos-de-prueba.md` | 19 casos: respuestas, límites y flujos |
| `5-portfolio/` | Guía de honestidad, preguntas de entrevista y plantilla de caso de estudio |
| `6-export-solucion/` | Dónde guardar la solución exportada al terminar |
| `build-docs.sh` | Regenera los `.docx` desde Markdown (requiere pandoc) |

## Requisitos

- Un tenant de Microsoft 365 con Teams y SharePoint donde puedas crear equipos (cuenta laboral o educativa;
  Copilot Studio no acepta cuentas personales @outlook/@gmail). Opciones: prueba de Microsoft 365 Business,
  o el Programa para desarrolladores de Microsoft 365 si calificás.
- Copilot Studio: prueba gratuita o licencia. Power Automate: SharePoint, Aprobaciones y Teams son conectores estándar.
- Revisá en la documentación vigente de Microsoft las condiciones de prueba y los límites de SharePoint como
  conocimiento (tamaño de archivos, licencias): cambian seguido.

## Orden de construcción (≈ 1 día)

1. **Teams/SharePoint:** creá el equipo "Comercial FeelYoga" con un canal "Aprobaciones". Corré `./build-docs.sh`
   y el script `.ps1` (o subí los `.docx` a `Documentos/Comercial` y creá la lista a mano).
2. **Solución:** en Copilot Studio creá una solución "AsistenteComercial" y trabajá todo dentro de ella.
   Agregá una variable de entorno con el email del aprobador.
3. **Agente:** crealo con `2-copilot-studio/instrucciones-agente.md`, agregá SharePoint como conocimiento y
   probá los casos A y B antes de seguir.
4. **Flujo A:** crealo desde el agente (`3-power-automate/flujo-A-registrar-consulta.md`) y agregalo como herramienta.
5. **Tema "Solicitar descuento":** `2-copilot-studio/tema-solicitar-descuento.yaml`.
6. **Flujo B:** `3-power-automate/flujo-B-aprobacion-descuento.md`.
7. **Publicar** en el canal Teams y Microsoft 365 Copilot y correr todos los casos de `4-pruebas/`.
8. **Exportar** la solución, grabar el video y completar `5-portfolio/caso-de-estudio-plantilla.md`.

## Limitaciones conocidas (conviene mencionarlas)

- El registro de consultas informativas depende de que el orquestador decida llamar a la herramienta; no es 100 %
  determinístico. El de descuentos sí lo es (lo llama el tema).
- Si el agente llama al flujo sin pasar el email, `VendedorEmail` queda vacío en consultas informativas.
- El YAML del tema y algunos nombres de acciones/disparadores varían entre versiones de Copilot Studio y
  Power Automate; si algo no coincide, seguí la lógica descrita y usá los nombres que muestre tu versión.
