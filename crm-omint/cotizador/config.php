<?php
// ================== CONFIGURACIÓN DEL COTIZADOR OMINT ==================
// Carpeta donde se guardan usuarios, listas de precios y cotizaciones.
// Por defecto queda junto a este archivo y protegida. Para más seguridad,
// podés moverla fuera de public_html: dirname(__DIR__) . '/cotizador-data'
define('COT_DATA_DIR', __DIR__ . '/datos');

// Días que dura la sesión en cada dispositivo.
define('COT_SESSION_DAYS', 30);

// Nombre que aparece en el sistema.
define('COT_EMPRESA', 'Omint');
