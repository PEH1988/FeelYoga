# Flujo A — "Registrar consulta comercial"

**Tipo:** flujo de agente, llamado por Copilot Studio (instantáneo, debe responder rápido).
**Dónde crearlo:** desde Copilot Studio (tema → Agregar herramienta → Nuevo flujo de agente), así queda
dentro de la misma solución y el agente lo reconoce. Copilot Studio espera la respuesta del flujo un tiempo
limitado (del orden de 100 segundos; verificalo en la documentación vigente). Por eso este flujo **no espera
la aprobación**: sólo registra y devuelve un ID. La aprobación la hace el Flujo B, en forma asíncrona.

## Pasos

### 1. Disparador: llamada desde el agente
Entradas (todas tipo texto salvo indicación):

| Entrada | Tipo | Obligatoria |
|---|---|---|
| Pregunta | Texto | Sí |
| TipoConsulta | Texto | Sí |
| Cliente | Texto | No |
| MontoBase | Número | No |
| DescuentoSolicitado | Número | No |
| Justificacion | Texto | No |
| VendedorEmail | Texto | No |

> Cuando lo usa el orquestador como herramienta (consultas informativas), el email no siempre viene;
> en ese caso queda vacío. Ver "Limitaciones" en el README.

### 2. Redactar (Compose) — `EstadoInicial`
Expresión:
```
if(
  equals(triggerBody()?['TipoConsulta'], 'Descuento'),
  if(greater(float(coalesce(triggerBody()?['DescuentoSolicitado'], 0)), 10),
     'Pendiente de aprobación',
     'Aprobada automáticamente'),
  'Registrada'
)
```
> Power Automate a veces nombra internamente las entradas `text`, `text_1`, `number`… Si la expresión
> devuelve nulos, armala eligiendo las entradas desde "Contenido dinámico" en lugar de escribir los nombres.

### 3. SharePoint — Crear elemento
- Sitio: `ComercialFeelYoga` · Lista: `ConsultasComerciales`
- Título: `concat(triggerBody()?['TipoConsulta'], ' · ', coalesce(triggerBody()?['Cliente'], 'sin cliente'))`
- Pregunta, Cliente, MontoBase, DescuentoSolicitado, Justificacion, VendedorEmail: desde las entradas
- Tipo de consulta (Value): `TipoConsulta`
- Estado (Value): salida de `EstadoInicial`

### 4. Responder al agente
| Salida | Valor |
|---|---|
| IdConsulta | `ID` del elemento creado |
| Estado | salida de `EstadoInicial` |

### 5. Manejo de errores (recomendado)
Agregá un **Ámbito** (Scope) alrededor de los pasos 2–3, y otro "Responder al agente" configurado con
"Configurar ejecución después de → ha fallado", que devuelva `IdConsulta = 0` y `Estado = Error`.
Así el agente no se queda colgado si SharePoint falla, y en el tema podés mostrar un mensaje de error.
