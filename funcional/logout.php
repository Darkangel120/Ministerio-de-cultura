<?php
session_start();
require_once 'config.php';

// Registrar logout en logs si hay sesión activa
if (isset($_SESSION['usuario_id'])) {
    $pdo = conectarDB();
    $stmt = $pdo->prepare("INSERT INTO logs_sistema (usuario_id, accion, descripcion, ip_address) VALUES (?, 'logout', 'Cierre de sesión', ?)");
    $stmt->execute([$_SESSION['usuario_id'], $_SERVER['REMOTE_ADDR']]);
}

// Destruir la sesión
session_destroy();

// Redirigir al inicio
header('Location: index.php');
exit();
?>
