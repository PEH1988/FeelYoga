<?php
// API del Cotizador Omint (multiusuario).
// Todas las acciones son POST con JSON. Salvo "login" y "setup", requieren el
// token de sesión en el encabezado X-Cot-Token.
//
// Datos en COT_DATA_DIR (cada archivo .php empieza con un encabezado que corta la
// ejecución, así nunca se pueden descargar desde la web aunque falle .htaccess).

require __DIR__ . '/config.php';
date_default_timezone_set(defined('COT_TZ') ? COT_TZ : 'America/Argentina/Buenos_Aires');

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

const GUARD = "<?php http_response_code(404); exit; ?>\n";

function out($code, $data) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
function fail($code, $msg) { out($code, ['ok' => false, 'error' => $msg]); }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail(405, 'method');

$DIR = COT_DATA_DIR;
foreach ([$DIR, "$DIR/listas", "$DIR/cotizaciones"] as $d) {
    if (!is_dir($d) && !@mkdir($d, 0700, true)) fail(500, 'No se pudo crear la carpeta de datos del cotizador.');
}
if (!is_file("$DIR/.htaccess")) file_put_contents("$DIR/.htaccess", "Require all denied\nDeny from all\n");

// ------------------------------------------------------------- Archivos ---
function leer($nombre, $default) {
    global $DIR;
    $f = "$DIR/$nombre.php";
    if (!is_file($f)) return $default;
    $d = json_decode(substr(file_get_contents($f), strlen(GUARD)), true);
    return $d === null ? $default : $d;
}
function escribir($nombre, $data) {
    global $DIR;
    $tmp = "$DIR/$nombre.tmp";
    if (file_put_contents($tmp, GUARD . json_encode($data, JSON_UNESCAPED_UNICODE)) === false || !rename($tmp, "$DIR/$nombre.php")) {
        fail(500, 'No se pudo guardar en el servidor.');
    }
}

$lock = fopen("$DIR/.lock", 'c');
flock($lock, LOCK_EX);

$action = isset($_GET['action']) ? $_GET['action'] : '';
$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body)) $body = [];
$now = time();

// ------------------------------------------------------------- Usuarios ---
function normUser($u) { return strtolower(trim((string) $u)); }

// Primera instalación: importa los usuarios iniciales del paquete (si los hay).
function usuarios() {
    global $DIR;
    $u = leer('usuarios', null);
    if ($u === null) {
        $seed = __DIR__ . '/instalacion/usuarios-iniciales.php';
        $u = [];
        if (is_file($seed)) {
            $data = json_decode(substr(file_get_contents($seed), strlen(GUARD)), true);
            if (is_array($data)) foreach ($data as $x) if (!empty($x['usuario'])) $u[normUser($x['usuario'])] = ['usuario' => normUser($x['usuario'])] + $x + ['activo' => true, 'rol' => 'ejecutivo'];
        }
        if ($u) {
            escribir('usuarios', $u);
            @unlink($seed); // ya no hace falta y tiene hashes de contraseñas
        }
    }
    return $u;
}
function publico($u) {
    unset($u['hash']);
    return $u;
}

// Verifica contraseñas bcrypt (nuevas) y APR1-MD5 (las del .htpasswd del
// cotizador anterior, para que cada ejecutivo siga entrando con su clave).
function apr1($pass, $salt) {
    $len = strlen($pass);
    $text = $pass . '$apr1$' . $salt;
    $bin = pack('H32', md5($pass . $salt . $pass));
    for ($i = $len; $i > 0; $i -= 16) $text .= substr($bin, 0, min(16, $i));
    for ($i = $len; $i > 0; $i >>= 1) $text .= ($i & 1) ? chr(0) : $pass[0];
    $bin = pack('H32', md5($text));
    for ($i = 0; $i < 1000; $i++) {
        $new = ($i & 1) ? $pass : $bin;
        if ($i % 3) $new .= $salt;
        if ($i % 7) $new .= $pass;
        $new .= ($i & 1) ? $bin : $pass;
        $bin = pack('H32', md5($new));
    }
    $tmp = '';
    for ($i = 0; $i < 5; $i++) {
        $k = $i + 6;
        $j = $i + 12;
        if ($j == 16) $j = 5;
        $tmp = $bin[$i] . $bin[$k] . $bin[$j] . $tmp;
    }
    $tmp = chr(0) . chr(0) . $bin[11] . $tmp;
    $tmp = strtr(strrev(substr(base64_encode($tmp), 2)), 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/', './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz');
    return '$apr1$' . $salt . '$' . $tmp;
}
function verificar($pass, $hash) {
    if (strpos($hash, '$apr1$') === 0) {
        $partes = explode('$', $hash);
        return isset($partes[2]) && hash_equals($hash, apr1($pass, $partes[2]));
    }
    return password_verify($pass, $hash);
}

// --------------------------------------------------------------- Sesión ---
function sesion() {
    global $now;
    $token = isset($_SERVER['HTTP_X_COT_TOKEN']) ? $_SERVER['HTTP_X_COT_TOKEN'] : '';
    if ($token === '') return null;
    $tokens = leer('tokens', []);
    $h = hash('sha256', $token);
    if (!isset($tokens[$h]) || $tokens[$h]['exp'] < $now) return null;
    $us = usuarios();
    $u = isset($us[$tokens[$h]['usuario']]) ? $us[$tokens[$h]['usuario']] : null;
    if (!$u || empty($u['activo'])) return null;
    return ['token' => $h, 'usuario' => $u];
}

function registrarAuditoria($quien, $que) {
    global $now;
    $log = leer('auditoria', []);
    array_unshift($log, ['fecha' => date('c', $now), 'usuario' => $quien, 'accion' => $que]);
    escribir('auditoria', array_slice($log, 0, 500));
}

function listaActiva() {
    global $DIR;
    $meta = leer('lista-activa', null);
    if ($meta && is_file("$DIR/listas/{$meta['id']}.php")) {
        $lista = json_decode(substr(file_get_contents("$DIR/listas/{$meta['id']}.php"), strlen(GUARD)), true);
        return [$meta, $lista];
    }
    // Sin lista publicada todavía: usamos la que viene con el paquete.
    $ini = __DIR__ . '/instalacion/lista-inicial.php';
    if (is_file($ini)) {
        $lista = json_decode(substr(file_get_contents($ini), strlen(GUARD)), true);
        return [['id' => 'inicial', 'vigencia' => $lista['vigencia'], 'subidaPor' => 'Paquete de instalación', 'fecha' => null], $lista];
    }
    return [null, null];
}

// ------------------------------------------------------------- Acciones ---
if ($action === 'estado') {
    out(200, ['ok' => true, 'instalado' => count(usuarios()) > 0]);
}

if ($action === 'setup') {
    // Solo si todavía no hay ningún usuario: crea el primer administrador.
    if (count(usuarios()) > 0) fail(403, 'El cotizador ya tiene usuarios.');
    $usuario = normUser(isset($body['usuario']) ? $body['usuario'] : '');
    $clave = isset($body['clave']) ? (string) $body['clave'] : '';
    if (!preg_match('/^[a-z0-9._-]{3,30}$/', $usuario) || strlen($clave) < 8) fail(400, 'Usuario de 3 a 30 caracteres y contraseña de al menos 8.');
    $u = [$usuario => ['usuario' => $usuario, 'nombre' => trim((string) ($body['nombre'] ?? $usuario)), 'rol' => 'admin', 'activo' => true, 'hash' => password_hash($clave, PASSWORD_DEFAULT), 'cargo' => '', 'tel' => '', 'mail' => '', 'wa' => '', 'provincia' => 'Mendoza']];
    escribir('usuarios', $u);
    out(200, ['ok' => true]);
}

if ($action === 'login') {
    $ipKey = hash('sha256', isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'x');
    $fails = leer('fails', []);
    foreach ($fails as $k => $f) if ($f['until'] < $now && $f['last'] < $now - 900) unset($fails[$k]);
    if (isset($fails[$ipKey]) && $fails[$ipKey]['until'] > $now) fail(429, 'Demasiados intentos fallidos. Probá de nuevo en unos minutos.');
    $usuario = normUser(isset($body['usuario']) ? $body['usuario'] : '');
    $clave = isset($body['clave']) ? (string) $body['clave'] : '';
    $us = usuarios();
    $u = isset($us[$usuario]) ? $us[$usuario] : null;
    if (!$u || empty($u['activo']) || !verificar($clave, $u['hash'])) {
        $f = isset($fails[$ipKey]) ? $fails[$ipKey] : ['n' => 0, 'until' => 0, 'last' => 0];
        $f['n']++;
        $f['last'] = $now;
        if ($f['n'] >= 5) { $f['until'] = $now + 900; $f['n'] = 0; }
        $fails[$ipKey] = $f;
        escribir('fails', $fails);
        usleep(700000);
        fail(401, 'Usuario o contraseña incorrectos.');
    }
    unset($fails[$ipKey]);
    escribir('fails', $fails);
    // Migración silenciosa de APR1 (htpasswd) a bcrypt.
    if (strpos($u['hash'], '$apr1$') === 0 || password_needs_rehash($u['hash'], PASSWORD_DEFAULT)) {
        $us[$usuario]['hash'] = password_hash($clave, PASSWORD_DEFAULT);
    }
    $us[$usuario]['ultimoIngreso'] = date('c', $now);
    escribir('usuarios', $us);
    $token = bin2hex(random_bytes(32));
    $tokens = leer('tokens', []);
    foreach ($tokens as $h => $t) if ($t['exp'] < $now) unset($tokens[$h]);
    $tokens[hash('sha256', $token)] = ['usuario' => $usuario, 'exp' => $now + COT_SESSION_DAYS * 86400];
    escribir('tokens', $tokens);
    out(200, ['ok' => true, 'token' => $token]);
}

$s = sesion();
if (!$s) fail(401, 'auth');
$yo = $s['usuario'];
$esAdmin = $yo['rol'] === 'admin';
function soloAdmin() {
    global $esAdmin;
    if (!$esAdmin) fail(403, 'Solo un administrador puede hacer esto.');
}

switch ($action) {
    case 'logout':
        $tokens = leer('tokens', []);
        unset($tokens[$s['token']]);
        escribir('tokens', $tokens);
        out(200, ['ok' => true]);

    case 'init':
        list($meta, $lista) = listaActiva();
        out(200, [
            'ok' => true,
            'yo' => publico($yo),
            'lista' => $lista,
            'listaMeta' => $meta,
            'reglas' => leer('reglas', null),
            'planesInfo' => leer('planes-info', null),
            'empresa' => ['nombre' => COT_EMPRESA],
        ]);

    case 'perfil':
        $us = usuarios();
        foreach (['nombre', 'cargo', 'tel', 'mail', 'wa', 'provincia'] as $k) {
            if (isset($body[$k])) $us[$yo['usuario']][$k] = mb_substr(trim((string) $body[$k]), 0, 120);
        }
        escribir('usuarios', $us);
        out(200, ['ok' => true, 'yo' => publico($us[$yo['usuario']])]);

    case 'clave':
        $us = usuarios();
        if (!verificar((string) ($body['actual'] ?? ''), $us[$yo['usuario']]['hash'])) fail(400, 'La contraseña actual no es correcta.');
        $nueva = (string) ($body['nueva'] ?? '');
        if (strlen($nueva) < 8) fail(400, 'La contraseña nueva tiene que tener al menos 8 caracteres.');
        $us[$yo['usuario']]['hash'] = password_hash($nueva, PASSWORD_DEFAULT);
        escribir('usuarios', $us);
        out(200, ['ok' => true]);

    // ------------------------------------------------------ Cotizaciones
    case 'guardarCotizacion':
        $c = isset($body['cotizacion']) && is_array($body['cotizacion']) ? $body['cotizacion'] : null;
        if (!$c) fail(400, 'cotizacion');
        $json = json_encode($c, JSON_UNESCAPED_UNICODE);
        if (strlen($json) > 400000) fail(400, 'La cotización es demasiado grande.');
        $c['id'] = bin2hex(random_bytes(8));
        $c['fecha'] = date('c', $now);
        $c['usuario'] = $yo['usuario'];
        $c['ejecutivo'] = $yo['nombre'];
        $mes = date('Y-m', $now);
        $arch = leer("cotizaciones/$mes", []);
        $arch[] = $c;
        escribir("cotizaciones/$mes", $arch);
        out(200, ['ok' => true, 'id' => $c['id'], 'fecha' => $c['fecha']]);

    case 'cotizaciones':
        // Últimos N meses; el ejecutivo ve las suyas, el administrador ve todas.
        $meses = max(1, min(24, (int) ($body['meses'] ?? 3)));
        $todas = $esAdmin && !empty($body['todas']);
        $res = [];
        for ($i = 0; $i < $meses; $i++) {
            $m = date('Y-m', strtotime("first day of -$i month", $now));
            foreach (leer("cotizaciones/$m", []) as $c) {
                if ($todas || $c['usuario'] === $yo['usuario']) $res[] = $c;
            }
        }
        usort($res, function ($a, $b) { return strcmp($b['fecha'], $a['fecha']); });
        out(200, ['ok' => true, 'cotizaciones' => array_slice($res, 0, 1000)]);

    // -------------------------------------------------- Administración
    case 'usuarios':
        soloAdmin();
        out(200, ['ok' => true, 'usuarios' => array_values(array_map('publico', usuarios()))]);

    case 'guardarUsuario':
        soloAdmin();
        $us = usuarios();
        $usuario = normUser($body['usuario'] ?? '');
        if (!preg_match('/^[a-z0-9._-]{3,30}$/', $usuario)) fail(400, 'El usuario debe tener de 3 a 30 letras, números, punto o guion.');
        $nuevo = !isset($us[$usuario]);
        $u = $nuevo ? ['usuario' => $usuario, 'creado' => date('c', $now)] : $us[$usuario];
        foreach (['nombre', 'cargo', 'tel', 'mail', 'wa', 'provincia'] as $k) if (isset($body[$k])) $u[$k] = mb_substr(trim((string) $body[$k]), 0, 120);
        $u['rol'] = ($body['rol'] ?? 'ejecutivo') === 'admin' ? 'admin' : 'ejecutivo';
        $u['activo'] = !empty($body['activo']);
        if ($usuario === $yo['usuario'] && ($u['rol'] !== 'admin' || !$u['activo'])) fail(400, 'No podés quitarte el rol de administrador ni desactivarte a vos mismo.');
        $clave = (string) ($body['clave'] ?? '');
        if ($clave !== '') {
            if (strlen($clave) < 8) fail(400, 'La contraseña tiene que tener al menos 8 caracteres.');
            $u['hash'] = password_hash($clave, PASSWORD_DEFAULT);
        } elseif ($nuevo) fail(400, 'Definí una contraseña para el usuario nuevo.');
        $us[$usuario] = $u;
        escribir('usuarios', $us);
        if (!$u['activo']) {
            // Cierra sus sesiones abiertas.
            $tokens = leer('tokens', []);
            foreach ($tokens as $h => $t) if ($t['usuario'] === $usuario) unset($tokens[$h]);
            escribir('tokens', $tokens);
        }
        registrarAuditoria($yo['usuario'], ($nuevo ? 'Creó' : 'Editó') . " el usuario $usuario");
        out(200, ['ok' => true]);

    case 'publicarLista':
        soloAdmin();
        $lista = isset($body['lista']) && is_array($body['lista']) ? $body['lista'] : null;
        if (!$lista || empty($lista['zonas']) || empty($lista['provincias'])) fail(400, 'La lista no tiene el formato esperado.');
        $id = 'lista-' . date('Ymd-His', $now);
        global $DIR;
        $tmp = "$DIR/listas/$id.tmp";
        file_put_contents($tmp, GUARD . json_encode($lista, JSON_UNESCAPED_UNICODE));
        rename($tmp, "$DIR/listas/$id.php");
        $meta = ['id' => $id, 'vigencia' => (string) ($lista['vigencia'] ?? ''), 'archivo' => mb_substr((string) ($body['archivo'] ?? ''), 0, 160), 'subidaPor' => $yo['nombre'], 'fecha' => date('c', $now)];
        escribir('lista-activa', $meta);
        $hist = leer('listas-historial', []);
        array_unshift($hist, $meta);
        escribir('listas-historial', array_slice($hist, 0, 60));
        registrarAuditoria($yo['usuario'], "Publicó la lista {$meta['vigencia']}");
        out(200, ['ok' => true, 'meta' => $meta]);

    case 'listas':
        soloAdmin();
        out(200, ['ok' => true, 'historial' => leer('listas-historial', []), 'activa' => leer('lista-activa', null)]);

    case 'activarLista':
        soloAdmin();
        global $DIR;
        $id = (string) ($body['id'] ?? '');
        if (!preg_match('/^lista-[0-9-]+$/', $id) || !is_file("$DIR/listas/$id.php")) fail(404, 'No encontré esa lista.');
        $hist = leer('listas-historial', []);
        $meta = null;
        foreach ($hist as $h) if ($h['id'] === $id) $meta = $h;
        escribir('lista-activa', $meta);
        registrarAuditoria($yo['usuario'], "Volvió a activar la lista {$meta['vigencia']}");
        out(200, ['ok' => true]);

    case 'guardarReglas':
        soloAdmin();
        if (!isset($body['reglas']) || !is_array($body['reglas'])) fail(400, 'reglas');
        escribir('reglas', $body['reglas']);
        registrarAuditoria($yo['usuario'], 'Modificó las reglas comerciales');
        out(200, ['ok' => true]);

    case 'guardarPlanesInfo':
        soloAdmin();
        if (!isset($body['planesInfo']) || !is_array($body['planesInfo'])) fail(400, 'planesInfo');
        escribir('planes-info', $body['planesInfo']);
        registrarAuditoria($yo['usuario'], 'Modificó las descripciones de planes');
        out(200, ['ok' => true]);

    case 'auditoria':
        soloAdmin();
        out(200, ['ok' => true, 'auditoria' => leer('auditoria', [])]);

    default:
        fail(400, 'action');
}
