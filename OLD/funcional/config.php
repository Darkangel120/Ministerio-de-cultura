<?php
// Load environment variables
function loadEnv($path) {
    if (!file_exists($path)) {
        throw new Exception('Environment file not found: ' . $path);
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) {
            continue;
        }

        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);

        if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
            putenv(sprintf('%s=%s', $name, $value));
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}

function env($key, $default = null) {
    $value = getenv($key);
    if ($value === false) {
        return $default;
    }
    return $value;
}

// Load .env file
loadEnv(__DIR__ . '/.env');

// Configuración de la base de datos
define('DB_HOST', env('DB_HOST', 'localhost'));
define('DB_NAME', __DIR__ . '/db/MINISTERIO_CULTURA.FDB');
define('DB_USER', env('DB_USER', 'SYSDBA'));
define('DB_PASS', env('DB_PASS', 'Darkangel12*'));

// Función para conectar a la base de datos
function conectarDB() {
    try {
        $dsn = "firebird:dbname=" . DB_HOST . ":" . DB_NAME . ";charset=UTF8";
        $pdo = new PDO($dsn, DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch (PDOException $e) {
        throw new Exception("Error de conexión: " . $e->getMessage());
    }
}

// Función para sanitizar input
function sanitizar($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

// Función para verificar sesión
function verificarSesion() {
    if (!isset($_SESSION['usuario_id'])) {
        header('Location: login.php');
        exit();
    }
}

// Función para obtener usuario actual
function obtenerUsuarioActual() {
    if (isset($_SESSION['usuario_id'])) {
        $pdo = conectarDB();
        $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE id = ?");
        $stmt->execute([$_SESSION['usuario_id']]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    return null;
}

// Función para configurar sesiones seguras
function configurarSesionSegura() {
    // Solo configurar opciones de sesión si no hay una sesión activa
    if (session_status() === PHP_SESSION_NONE) {
        // Configurar opciones de sesión segura
        ini_set('session.cookie_httponly', 1);
        ini_set('session.cookie_secure', 0); // Cambiar a 1 si usas HTTPS
        ini_set('session.use_only_cookies', 1);
        ini_set('session.cookie_samesite', 'Strict');
    }

    // Regenerar ID de sesión periódicamente (solo si hay sesión activa)
    if (session_status() === PHP_SESSION_ACTIVE) {
        if (!isset($_SESSION['ultima_regeneracion'])) {
            $_SESSION['ultima_regeneracion'] = time();
        } elseif (time() - $_SESSION['ultima_regeneracion'] > 300) { // 5 minutos
            session_regenerate_id(true);
            $_SESSION['ultima_regeneracion'] = time();
        }
    }
}

// Función para configurar headers de seguridad
function configurarHeadersSeguridad() {
    // Headers de seguridad básicos
    header('X-Frame-Options: DENY');
    header('X-Content-Type-Options: nosniff');
    header('X-XSS-Protection: 1; mode=block');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Content-Security-Policy: default-src \'self\'; script-src \'self\' \'unsafe-inline\' https://cdnjs.cloudflare.com; style-src \'self\' \'unsafe-inline\' https://cdnjs.cloudflare.com https://fonts.googleapis.com; font-src \'self\' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src \'self\' data: https:;');
}

// Función para generar token CSRF
function generarTokenCSRF() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

// Función para validar token CSRF
function validarTokenCSRF($token) {
    if (!isset($_SESSION['csrf_token']) || empty($token)) {
        return false;
    }
    return hash_equals($_SESSION['csrf_token'], $token);
}
?>
