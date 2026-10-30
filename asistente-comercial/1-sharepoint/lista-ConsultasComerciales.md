# Lista de SharePoint: `ConsultasComerciales`

Registro de cada consulta que pasa por el agente y de cada solicitud de descuento con su aprobación.
El script `crear-lista-y-subir-documentos.ps1` la crea con estas columnas. También la podés crear a mano.

| Nombre visible | Nombre interno | Tipo | Notas |
|---|---|---|---|
| Título | `Title` | Una línea de texto | Resumen corto (lo arma el flujo) |
| Pregunta | `Pregunta` | Varias líneas de texto | Lo que preguntó la persona vendedora |
| Tipo de consulta | `TipoConsulta` | Elección | `Informativa`, `Descuento`, `Sin respuesta en documentos` |
| Cliente | `Cliente` | Una línea de texto | Persona o empresa |
| Precio de lista (ARS) | `MontoBase` | Número | Sólo para descuentos |
| Descuento solicitado (%) | `DescuentoSolicitado` | Número | Sólo para descuentos |
| Justificación | `Justificacion` | Varias líneas de texto | Obligatoria en descuentos |
| Email vendedor | `VendedorEmail` | Una línea de texto | Viene del usuario autenticado en Teams |
| Estado | `Estado` | Elección | `Registrada`, `Aprobada automáticamente`, `Pendiente de aprobación`, `Aprobada`, `Rechazada`, `Vencida` |
| Aprobador | `Aprobador` | Una línea de texto | Email de quien respondió la aprobación |
| Comentario del aprobador | `ComentarioAprobador` | Varias líneas de texto | |
| Fecha de resolución | `FechaResolucion` | Fecha y hora | |

Se usan columnas de texto para los emails (y no de tipo Persona) a propósito: simplifica el flujo y evita
problemas de "claims" en la demo. En un proyecto real conviene una columna Persona para filtrar y para permisos.
