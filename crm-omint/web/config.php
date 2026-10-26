<?php
// ===================== CONFIGURACIÓN DEL CRM =====================
// Usuario para ingresar al CRM.
define('CRM_USER', 'CAMBIAR-USUARIO');

// Contraseña cifrada (bcrypt). NO pongas la contraseña en texto plano acá.
// Para generar el valor: php -r "echo password_hash('TU-CONTRASEÑA', PASSWORD_DEFAULT);"
define('CRM_PASSWORD_HASH', '');

// Días que dura la sesión en cada dispositivo antes de volver a pedir login.
define('CRM_SESSION_DAYS', 30);

// Carpeta donde se guardan los datos. Por defecto queda junto a este archivo,
// protegida con .htaccess. Para más seguridad, ponela fuera de public_html:
// define('CRM_DATA_DIR', dirname(__DIR__) . '/crm-data');
define('CRM_DATA_DIR', __DIR__ . '/crm-data');

// Cuántos días de copias de seguridad automáticas se conservan.
define('CRM_BACKUP_DAYS', 14);
