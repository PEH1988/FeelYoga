<?php
// Sirve el Cotizador Omint integrado, solo con una sesión válida del CRM
// (cookie crm_sesion, que api.php crea al ingresar).
require __DIR__ . '/config.php';

header('Cache-Control: no-store');
header('X-Frame-Options: SAMEORIGIN');

$token = isset($_COOKIE['crm_sesion']) ? $_COOKIE['crm_sesion'] : '';
$tokensFile = CRM_DATA_DIR . '/_tokens.json';
$tokens = is_file($tokensFile) ? json_decode(file_get_contents($tokensFile), true) : [];
$th = hash('sha256', $token);
if ($token === '' || !is_array($tokens) || !isset($tokens[$th]) || $tokens[$th] < time()) {
    http_response_code(401);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><meta charset="utf-8"><body style="font-family:system-ui;padding:24px">'
       . 'Tu sesión venció. <a href="./" target="_top">Ingresá de nuevo al CRM</a>.</body>';
    exit;
}

$app = __DIR__ . '/cotizador-app.html';
if (!is_file($app)) {
    http_response_code(404);
    echo 'Falta cotizador-app.html';
    exit;
}

header('Content-Type: text/html; charset=utf-8');
$ejecutivo = defined('CRM_EJECUTIVO') ? CRM_EJECUTIVO : '';
$html = file_get_contents($app);
$inject = '<script>window.__COTIZADOR_USER__ = ' . json_encode($ejecutivo) . ';</script>';
$pos = stripos($html, '<body>');
echo $pos === false ? $inject . $html : substr($html, 0, $pos + 6) . $inject . substr($html, $pos + 6);
