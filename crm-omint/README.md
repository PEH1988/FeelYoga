# CRM Omint v2: herramienta comercial para medicina prepaga

Rediseño del CRM “Pipeline PyME Omint” que se usa como artifact de Claude (React).

## Qué hay de nuevo

- **Mi día**: plan diario con objetivos de actividad (llamadas, WhatsApp, reuniones y propuestas), reuniones de hoy, acciones vencidas, oportunidades que se enfrían, seguimientos de WhatsApp, prospectos calientes sin contactar y pacientes B2C con seguimiento.
- **Indicadores**: cápitas del mes con proyección, forecast ponderado por etapa, tasa de cierre, ticket promedio, ciclo de venta, cartera ganada en $/mes, cápitas por mes contra la meta, embudo de conversión acumulado, motivos de pérdida, actividad semanal, escalera de comisión y premios trimestrales. Se exporta a Excel.
- **Pipeline kanban** con arrastrar y soltar, cápitas ponderadas por columna, días sin actividad y próxima acción en cada tarjeta.
- **Cartera** con orden por columnas, filtros de foco (acción vencida, sin próxima acción, frías +14 d, cotizadas) y exportación a Excel o .vcf.
- **Cotizador PYME**: compara 4500/6500/8500 por franja etaria, aplica descuento e IVA, genera el texto de la propuesta y la guarda en la ficha (cápitas, plan y $/mes).
- **Registrar actividad** en dos clics, con próxima acción y cambio de etapa sugerido. Al pasar una oportunidad a “Perdido” se pide el motivo.
- **Búsqueda global y acciones** con Ctrl/⌘ K, **modo oscuro** y **Ajustes** (nombre, meta, descuento, objetivos diarios).
- **Producto y objeciones**: ficha de planes, preguntas de calificación y respuestas a objeciones frecuentes.
- Se mantienen la campaña de WhatsApp con protección anti-bloqueo, B2C, Google Calendar, el planificador de contenido y el backup/restauración.

## Compatibilidad de datos

Usa las mismas claves de `window.storage` que la versión anterior (`companies_*`, `personas_*`, `meetings`, `deletedEventIds`, `contenido`, `waLog`) y agrega `settings`. Si se actualiza el mismo artifact, los datos se conservan. Para pasar a un artifact nuevo, usá **Backup** en la versión vieja y **Restaurar** en la nueva.

## Build

La base inicial de empresas (`SEED`) tiene datos de contacto reales y **no se versiona** en este repo, que es público. Para generar el archivo completo:

```bash
node build.mjs ruta/al/CRM_anterior.jsx dist/CRM_Omint_v2.jsx
```

Sin argumentos, `node build.mjs` genera `dist/CRM_Omint_v2.jsx` con la base vacía.

## Versión web (Hostinger u otro hosting con PHP)

```bash
cd crm-omint && npm install && node build-web.mjs
```

Genera `web-dist/` con `index.html` (la app completa en un solo archivo), `api.php`, `config.php` y `.htaccess`:

- **Guardado en el servidor:** cada cambio se guarda solo en `crm-data/`, con una copia de seguridad diaria. Se ve igual desde cualquier dispositivo.
- **Ingreso:** pide usuario y contraseña. La contraseña se guarda cifrada (bcrypt) en `config.php` y cada dispositivo recibe una sesión de 30 días.
- **Conflictos:** si otro dispositivo guardó cambios, la app avisa en vez de pisarlos.
- **Antes de subir:** completá `CRM_USER` y `CRM_PASSWORD_HASH` en `config.php`. Las credenciales nunca se versionan.

## Cotizador Omint (multiusuario, por provincia)

Aplicación aparte, pensada para toda la empresa. Se instala en `/cotizador`, al lado del CRM, en el mismo dominio.

```bash
node build-cotizador.mjs --lista "Lista de precios Empresas.xls" [--usuarios usuarios.json] cotizador-dist
```

- **Provincias:** los precios salen de la lista EMPRESAS de Omint. La hoja "Provincias" define a qué zona de precios corresponde cada provincia.
- **Lectura de la lista:** `cotizador/src/lista.js` interpreta el Excel. Cada mes, un administrador lo sube desde Administración, sin recompilar.
- **Motor de cálculo:** `cotizador/src/motor.js` cotiza particulares (condición fiscal, aportes, IVA, campaña) y empresas (nómina, tramos, Plan B ≤ 25, PYME desde 11).
- **PDF:** `cotizador/src/pdf.js` arma el PDF con jsPDF y genera el QR de WhatsApp de cada ejecutivo.
- **Servidor:** `cotizador/api.php` maneja usuarios (bcrypt, migra los APR1 de `.htpasswd`), listas de precios con historial, reglas comerciales, descripciones de planes, historial de cotizaciones y auditoría.
- **Integración con el CRM:** el CRM web lo abre en un iframe (`?embed=crm`). Cada PDF generado avisa al CRM por `postMessage` y la cotización se guarda en la ficha.

Ni la lista de precios ni los usuarios se versionan: se pasan al compilar. El CRM también recibe la lista con `--lista` (en `build.mjs` y `build-web.mjs`) para su cálculo rápido y la ficha de producto.
