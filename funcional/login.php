<?php
session_start();
require_once 'config.php';

// Si ya está logueado, redirigir al dashboard
if (isset($_SESSION['usuario_id'])) {
    header('Location: dashboard.php');
    exit();
}

// Procesar login
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $email = sanitizar($_POST['email']);
    $password = $_POST['password'];

    $pdo = conectarDB();
    $stmt = $pdo->prepare("SELECT id, nombre_completo, tipo_usuario, password_hash, activo FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($usuario && password_verify($password, $usuario['PASSWORD_HASH'])) {
        if ($usuario['ACTIVO'] == 1) {
            // Login exitoso
            $_SESSION['usuario_id'] = $usuario['ID'];
            $_SESSION['usuario_nombre'] = $usuario['NOMBRE_COMPLETO'];
            $_SESSION['usuario_tipo'] = $usuario['TIPO_USUARIO'];

            // Registrar en logs
            $stmt = $pdo->prepare("INSERT INTO logs_sistema (usuario_id, accion, descripcion, ip_address) VALUES (?, 'login', 'Inicio de sesión exitoso', ?)");
            $stmt->execute([$usuario['ID'], $_SERVER['REMOTE_ADDR']]);

            header('Location: dashboard.php');
            exit();
        } else {
            $error = "Cuenta desactivada. Contacte al administrador.";
        }
    } else {
        $error = "Correo electrónico o contraseña incorrectos.";
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Iniciar Sesión - Ministerio del Poder Popular para la Cultura</title>
    <link rel="icon" href="assets/favicon.jpg">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/login.css">
</head>
<body>
    <div class="login-container">
        <div class="login-header">
            <div class="logo"><img src="assets/favicon.jpg" alt="logo"></div>
            <h1>Ministerio del Poder Popular para la Cultura</h1>
            <p>Iniciar Sesión</p>
        </div>
        <form class="login-form" id="loginForm">
            <div class="form-group">
                <label for="email">Correo Electrónico</label>
                <input type="email" id="email" name="email" required>
            </div>
            <div class="form-group">
                <label for="password">Contraseña</label>
                <input type="password" id="password" name="password" required>
            </div>
            <button type="submit" class="btn-login">Iniciar Sesión</button>
        </form>
        <div class="login-footer">
            <p>¿No tienes cuenta? <a href="registro.php">Regístrate aquí</a></p>
            <p><a href="index.php">Volver al Inicio</a></p>
        </div>
    </div>
    <script src="assets/js/login.js"></script>
</body>
</html>
