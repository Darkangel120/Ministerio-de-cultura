<?php
// Configuración de la base de datos
define('DB_HOST', 'localhost');
define('DB_NAME', __DIR__ . '/db/MINISTERIO_CULTURA.FDB');
define('DB_USER', 'SYSDBA');
define('DB_PASS', 'Darkangel12*');

// Función para conectar a la base de datos
function conectarDB() {
    try {
        $dsn = "firebird:dbname=" . DB_HOST . ":" . DB_NAME . ";charset=UTF8";
        $pdo = new PDO($dsn, DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch (PDOException $e) {
        die("Error de conexión: " . $e->getMessage());
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
?>
