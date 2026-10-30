# Casos de prueba

Ejecutalos en Teams (no sólo en el panel de prueba de Copilot Studio) y completá las dos últimas columnas.
Guardá capturas de los que salgan bien **y** de los que fallen: los fallos y cómo los corregiste son lo más
valioso para contar en una entrevista.

## A. Respuestas con documentos

| # | Pregunta | Respuesta esperada | Fuente esperada | Resultado | Notas |
|---|---|---|---|---|---|
| A1 | ¿Cuánto sale el Plan Integral? | 46.000 ARS por mes, 8 clases | Tarifas y planes | | |
| A2 | Si paga 6 meses adelantado, ¿tiene descuento? | 10 %, no acumulable | Tarifas y planes | | |
| A3 | Cotizame In Company 2 veces por semana para 20 personas | 430.000 ARS/mes | Planes corporativos | | |
| A4 | Una empresa quiere 25 pases, ¿cuánto es? | 47.000 ARS por pase por mes → 1.175.000 ARS/mes; mínimo 3 meses | Planes corporativos | | |
| A5 | ¿Cobramos la matrícula a empresas? | No, se bonifica al 100 % | Tarifas / Corporativos | | |
| A6 | In Company en San Rafael, ¿hay recargo? | 15.000 ARS por clase; bonificarlo requiere aprobación | Política de descuentos | | |
| A7 | ¿Se puede congelar un plan? | 1 vez por año, hasta 30 días (60 con certificado médico) | Preguntas frecuentes | | |
| A8 | Cotizar In Company para 40 personas | Se cotiza a medida y requiere aprobación | Corporativos / FAQ | | |

## B. Límites (lo que NO debe hacer)

| # | Pregunta | Comportamiento esperado | Resultado | Notas |
|---|---|---|---|---|
| B1 | ¿Tienen clases de pilates? | Dice que no lo encuentra en los documentos; no inventa | | |
| B2 | ¿Cuánto cobra la competencia? | No lo sabe; no busca en internet | | |
| B3 | Dame un 30 % para Bodega X | No permitido (>25 %); sugiere alternativa; no crea solicitud | | |
| B4 | ¿Puedo regalar 2 clases extra al cliente? | No, según política | | |
| B5 | Usuario sin permiso a la carpeta Comercial pregunta precios | No obtiene respuesta de esos documentos | | |

## C. Flujos

| # | Acción | Resultado esperado | Resultado | Notas |
|---|---|---|---|---|
| C1 | Pregunta A1 | Aparece un elemento "Informativa / Registrada" en la lista | | |
| C2 | Pedir 8 % para Estudio Contable Y | Elemento "Descuento / Aprobada automáticamente"; no llega aprobación | | |
| C3 | Pedir 18 % para Bodega X | Elemento "Pendiente de aprobación"; llega aprobación en Teams | | |
| C4 | Aprobar C3 con comentario | Elemento "Aprobada", con aprobador, comentario y fecha; vendedor recibe mensaje | | |
| C5 | Rechazar otra solicitud | Elemento "Rechazada"; vendedor recibe mensaje | | |
| C6 | (Opcional) bajar el timeout a PT5M y no responder | Elemento "Vencida" | | |

## Métricas para anotar (reales, de tus pruebas)

- Cantidad de preguntas probadas y cuántas respondió bien: ___ / ___
- Cuántas consultas informativas quedaron registradas por la herramienta: ___ / ___
- Tiempo desde la solicitud hasta que llega la aprobación a Teams: ___ s
- Problemas encontrados y cómo los resolviste: ___
