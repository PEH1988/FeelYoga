<?php
// API de guardado del CRM Omint (versión web).
// Guarda cada clave del CRM como un archivo en CRM_DATA_DIR.
// Acciones: login (usuario + contraseña -> token de sesión), logout, all (leer
// todo), rev (versión actual), set, delete. Salvo login, todas requieren el
// token en el encabezado X-CRM-Token.

require __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function out($code, $data) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

if (!defined('CRM_USER') || !defined('CRM_PASSWORD_HASH') || CRM_PASSWORD_HASH === '' || CRM_USER === '') {
    out(500, ['ok' => false, 'error' => 'Falta configurar usuario y contraseña en config.php']);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    out(405, ['ok' => false, 'error' => 'method']);
}

$dir = CRM_DATA_DIR;
if (!is_dir($dir)) {
    if (!@mkdir($dir, 0700, true)) out(500, ['ok' => false, 'error' => 'No se pudo crear la carpeta de datos']);
}
// La carpeta de datos nunca debe poder descargarse desde la web.
if (!is_file("$dir/.htaccess")) {
    file_put_contents("$dir/.htaccess", "Require all denied\nDeny from all\n");
}

// Cookie de sesión para las páginas que no pueden mandar el token por
// encabezado (el cotizador integrado, que se abre en un iframe).
function set_session_cookie($token, $expires) {
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443);
    $path = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/') . '/';
    setcookie('crm_sesion', $token, ['expires' => $expires, 'path' => $path, 'secure' => $https, 'httponly' => true, 'samesite' => 'Strict']);
}

function read_json($file, $default) {
    if (!is_file($file)) return $default;
    $d = json_decode(file_get_contents($file), true);
    return is_array($d) ? $d : $default;
}

$action = isset($_GET['action']) ? $_GET['action'] : '';
$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body)) $body = [];
$tokensFile = "$dir/_tokens.json";
$ttl = (defined('CRM_SESSION_DAYS') ? CRM_SESSION_DAYS : 30) * 86400;

// ---------------------------------------------------------------- Login ---
if ($action === 'login') {
    $ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'x';
    $failsFile = "$dir/_fails.json";
    $fails = read_json($failsFile, []);
    $now = time();
    foreach ($fails as $k => $f) if ($f['until'] < $now && $f['last'] < $now - 900) unset($fails[$k]);
    $ipKey = hash('sha256', $ip);
    if (isset($fails[$ipKey]) && $fails[$ipKey]['until'] > $now) {
        out(429, ['ok' => false, 'error' => 'Demasiados intentos. Probá de nuevo en unos minutos.']);
    }
    $user = isset($body['user']) ? (string) $body['user'] : '';
    $pass = isset($body['pass']) ? (string) $body['pass'] : '';
    $okUser = hash_equals(strtolower(CRM_USER), strtolower(trim($user)));
    $okPass = password_verify($pass, CRM_PASSWORD_HASH);
    if (!$okUser || !$okPass) {
        $f = isset($fails[$ipKey]) ? $fails[$ipKey] : ['n' => 0, 'until' => 0, 'last' => 0];
        $f['n']++;
        $f['last'] = $now;
        if ($f['n'] >= 5) { $f['until'] = $now + 900; $f['n'] = 0; }
        $fails[$ipKey] = $f;
        file_put_contents($failsFile, json_encode($fails));
        usleep(800000);
        out(401, ['ok' => false, 'error' => 'Usuario o contraseña incorrectos.']);
    }
    unset($fails[$ipKey]);
    file_put_contents($failsFile, json_encode($fails));
    $token = bin2hex(random_bytes(32));
    $tokens = read_json($tokensFile, []);
    foreach ($tokens as $h => $exp) if ($exp < $now) unset($tokens[$h]);
    $tokens[hash('sha256', $token)] = $now + $ttl;
    file_put_contents($tokensFile, json_encode($tokens));
    set_session_cookie($token, $now + $ttl);
    out(200, ['ok' => true, 'token' => $token]);
}

// Todas las demás acciones requieren una sesión válida.
$token = isset($_SERVER['HTTP_X_CRM_TOKEN']) ? $_SERVER['HTTP_X_CRM_TOKEN'] : '';
$tokens = read_json($tokensFile, []);
$th = hash('sha256', $token);
if ($token === '' || !isset($tokens[$th]) || $tokens[$th] < time()) {
    out(401, ['ok' => false, 'error' => 'auth']);
}
if ($action === 'logout') {
    unset($tokens[$th]);
    file_put_contents($tokensFile, json_encode($tokens));
    set_session_cookie('', 1);
    out(200, ['ok' => true]);
}

$lock = fopen("$dir/.lock", 'c');
flock($lock, in_array($action, ['all', 'rev'], true) ? LOCK_SH : LOCK_EX);

$metaFile = "$dir/_meta.json";
$meta = is_file($metaFile) ? json_decode(file_get_contents($metaFile), true) : null;
if (!is_array($meta)) $meta = ['rev' => 0, 'session' => ''];

// Cada valor se guarda como "<clave>.val.php" con un encabezado que corta la
// ejecución: aunque el servidor ignorara el .htaccess, descargarlo no muestra nada.
const GUARD = "<?php http_response_code(404); exit; ?>\n";
function val_path($dir, $k) { return "$dir/$k.val.php"; }
function val_read($f) { return substr(file_get_contents($f), strlen(GUARD)); }

function valid_key($k) {
    return is_string($k) && preg_match('/^[A-Za-z0-9_]{1,64}$/', $k);
}

// Copia de seguridad diaria: la primera escritura de cada día guarda una copia
// de todos los datos en backups/AAAA-MM-DD. Se conservan las últimas CRM_BACKUP_DAYS.
function daily_backup($dir) {
    $today = date('Y-m-d');
    $bdir = "$dir/backups/$today";
    if (is_dir($bdir)) return;
    $files = glob("$dir/*.val.php");
    if (!$files) return;
    @mkdir($bdir, 0700, true);
    foreach ($files as $f) @copy($f, "$bdir/" . basename($f));
    $all = glob("$dir/backups/*", GLOB_ONLYDIR);
    sort($all);
    $keep = defined('CRM_BACKUP_DAYS') ? CRM_BACKUP_DAYS : 14;
    while (count($all) > $keep) {
        $old = array_shift($all);
        foreach (glob("$old/*") as $f) @unlink($f);
        @rmdir($old);
    }
}

switch ($action) {
    case 'all':
        set_session_cookie($token, $tokens[$th]); // renueva la cookie del cotizador
        $data = [];
        foreach (glob("$dir/*.val.php") as $f) $data[basename($f, '.val.php')] = val_read($f);
        out(200, ['ok' => true, 'data' => (object) $data, 'rev' => $meta['rev']]);

    case 'rev':
        out(200, ['ok' => true, 'rev' => $meta['rev'], 'at' => isset($meta['at']) ? $meta['at'] : null]);

    case 'set':
    case 'delete':
        $k = isset($body['key']) ? $body['key'] : '';
        if (!valid_key($k)) out(400, ['ok' => false, 'error' => 'key']);
        $session = isset($body['session']) ? (string) $body['session'] : '';
        $base = isset($body['baseRev']) ? (int) $body['baseRev'] : -1;
        // Si otro dispositivo guardó después de que esta pestaña cargó los datos,
        // rechazamos la escritura para no pisar sus cambios.
        if ((int) $meta['rev'] !== $base && $meta['session'] !== $session) {
            out(409, ['ok' => false, 'error' => 'conflict', 'rev' => $meta['rev']]);
        }
        daily_backup($dir);
        if ($action === 'set') {
            if (!isset($body['value']) || !is_string($body['value'])) out(400, ['ok' => false, 'error' => 'value']);
            $tmp = "$dir/$k.tmp";
            if (file_put_contents($tmp, GUARD . $body['value']) === false || !rename($tmp, val_path($dir, $k))) {
                out(500, ['ok' => false, 'error' => 'No se pudo escribir en el servidor']);
            }
        } else {
            @unlink(val_path($dir, $k));
        }
        $meta = ['rev' => (int) $meta['rev'] + 1, 'session' => $session, 'at' => date('c')];
        file_put_contents($metaFile, json_encode($meta));
        out(200, ['ok' => true, 'rev' => $meta['rev']]);

    default:
        out(400, ['ok' => false, 'error' => 'action']);
}
