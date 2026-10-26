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
