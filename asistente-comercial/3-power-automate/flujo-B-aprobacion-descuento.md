# Flujo B — "Aprobación de descuento"

**Tipo:** flujo automatizado en la nube (se dispara solo).
**Por qué separado del Flujo A:** una aprobación puede tardar días y el agente no puede esperar.
El Flujo A registra; este flujo detecta los pendientes, pide la aprobación y avisa el resultado.

## Pasos

### 1. Disparador: SharePoint — Cuando se crea un elemento
- Sitio: `ComercialFeelYoga` · Lista: `ConsultasComerciales`
- **Configuración → Condiciones de desencadenador** (así no se ejecuta en cada consulta informativa):
```
@equals(triggerOutputs()?['body/Estado/Value'], 'Pendiente de aprobación')
```

### 2. Aprobaciones — Iniciar y esperar una aprobación
- Tipo: **Aprobar/Rechazar - Primero en responder**
- Título: `Descuento de @{triggerOutputs()?['body/DescuentoSolicitado']} % para @{triggerOutputs()?['body/Cliente']}`
- Asignado a: email de Coordinación Comercial (mejor como **variable de entorno** de la solución, no fijo)
- Detalles (admite Markdown):
```
**Vendedor:** @{triggerOutputs()?['body/VendedorEmail']}
**Precio de lista:** ARS @{triggerOutputs()?['body/MontoBase']}
**Descuento pedido:** @{triggerOutputs()?['body/DescuentoSolicitado']} %
**Justificación:** @{triggerOutputs()?['body/Justificacion']}

Política: más de 10 % y hasta 25 % requiere aprobación. No acumulable con pago anticipado.
```
- Vínculo del elemento: `@{triggerOutputs()?['body/{Link}']}` · Descripción del vínculo: `Ver registro`
- **Configuración → Tiempo de espera:** `P3D` (3 días). Equivale al objetivo de 2 días hábiles con margen.

La aprobación llega en la app **Aprobaciones** de Teams y por email.

### 3. Condición: `outputs('Iniciar_y_esperar_una_aprobación')?['body/outcome']` es igual a `Approve`

**Sí →** SharePoint — Actualizar elemento:
- Id: `triggerOutputs()?['body/ID']`
- Estado: `Aprobada`
- Aprobador: `first(outputs('Iniciar_y_esperar_una_aprobación')?['body/responses'])?['responder/email']`
- ComentarioAprobador: `first(outputs('Iniciar_y_esperar_una_aprobación')?['body/responses'])?['comments']`
- FechaResolucion: `utcNow()`

**No →** igual, con Estado `Rechazada`.

> El nombre interno de la acción depende del nombre visible y del idioma en que la creaste
> (`Start_and_wait_for_an_approval` en inglés). Copiá el nombre real desde "Contenido dinámico".

### 4. Microsoft Teams — Publicar mensaje en un chat o canal
- Publicar como: **Flow bot** · Publicar en: **Chat con Flow bot**
- Destinatario: `triggerOutputs()?['body/VendedorEmail']`
- Mensaje:
```
Tu solicitud #@{triggerOutputs()?['body/ID']} (@{triggerOutputs()?['body/Cliente']}, @{triggerOutputs()?['body/DescuentoSolicitado']} %) fue @{toLower(<Estado final>)}.
Comentario: @{<ComentarioAprobador>}
El descuento aprobado vale 30 días.
```
(Ponelo dentro de cada rama, o guardá el estado en una variable y publicá una sola vez después de la condición.)

### 5. Rama de vencimiento
Agregá una acción en paralelo a la condición, con **Configurar ejecución después de → ha agotado el tiempo**
sobre la aprobación: Actualizar elemento con Estado `Vencida` y avisar al vendedor que debe pedirla de nuevo.

## Mejora opcional
En lugar del chat con Flow bot, publicar una **tarjeta adaptativa** en el canal "Aprobaciones" del equipo para
que todo el equipo comercial vea el historial. Es buena práctica para mostrar en la demo, pero no es necesaria.
