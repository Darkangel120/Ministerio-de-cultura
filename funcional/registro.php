<?php
session_start();
require_once 'config.php';

// Si ya está logueado, redirigir al dashboard
if (isset($_SESSION['usuario_id'])) {
    header('Location: dashboard.php');
    exit();
}

// Procesar registro
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $nombre_completo = sanitizar($_POST['nombre_completo']);
    $email = sanitizar($_POST['email']);
    $telefono = sanitizar($_POST['telefono']);
    $tipo_usuario = sanitizar($_POST['tipo_usuario']);
    $password = $_POST['password'];
    $password_confirm = $_POST['password_confirm'];

    // Validaciones
    $errores = [];

    if (strlen($password) < 8) {
        $errores[] = "La contraseña debe tener al menos 8 caracteres";
    }

    if ($password !== $password_confirm) {
        $errores[] = "Las contraseñas no coinciden";
    }

    // Verificar si el email ya existe
    $pdo = conectarDB();
    $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        $errores[] = "El correo electrónico ya está registrado";
    }

    if (empty($errores)) {
        try {
            $password_hash = password_hash($password, PASSWORD_DEFAULT);

            $stmt = $pdo->prepare("INSERT INTO usuarios (nombre_completo, email, telefono, tipo_usuario, password, fecha_registro, activo) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 1)");
            $stmt->execute([$nombre_completo, $email, $telefono, $tipo_usuario, $password_hash]);

            $usuario_id = $pdo->lastInsertId();

            $success = "Registro exitoso. Ahora puedes iniciar sesión.";
        } catch (Exception $e) {
            $errores[] = "Error al registrar usuario: " . $e->getMessage();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registro Cultural - Ministerio del Poder Popular para la Cultura</title>
    <link rel="icon" href="assets/favicon.jpg">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/registro.css">
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
    <!-- Barra Superior -->
    <div class="top-bar">
        <div class="container">
            <div><i class="fas fa-phone"></i> 0212-XXX-XXXX | <i class="fas fa-envelope"></i> atencionciudadana@mincultura.gob.ve</div>
            <div class="social-links">
                <a href="#" title="Facebook">Facebook</a>
                <a href="#" title="Twitter">Twitter</a>
                <a href="#" title="Instagram">Instagram</a>
                <a href="#" title="YouTube">YouTube</a>
            </div>
        </div>
    </div>

    <!-- Header Principal -->
    <header>
        <div class="header-content">
            <div class="logo-section">
                <div class="logo"><img src="assets/favicon.jpg" alt="logo"></div>
                <div class="logo-text">
                    <h1>Ministerio del Poder Popular para la Cultura</h1>
                    <p>República Bolivariana de Venezuela</p>
                </div>
            </div>
            <div class="menu-toggle" onclick="toggleMenu()">
                <span></span>
                <span></span>
                <span></span>
            </div>
            <nav id="mainNav">
                <ul>
                    <li><a href="index.php" onclick="closeMenu()">Inicio</a></li>
                    <li><a href="index.php#noticias" onclick="closeMenu()">Noticias</a></li>
                    <li><a href="index.php#agenda" onclick="closeMenu()">Agenda</a></li>
                    <li><a href="index.php#ministerio" onclick="closeMenu()">El Ministerio</a></li>
                    <li><a href="index.php#multimedia" onclick="closeMenu()">Multimedia</a></li>
                    <li><a href="foro.php" onclick="closeMenu()">Foro</a></li>
                    <li><a href="login.php" onclick="closeMenu()">Iniciar Sesión</a></li>
                </ul>
            </nav>
        </div>
    </header>

    <!-- Overlay para menu mobile -->
    <div class="overlay" id="overlay" onclick="closeMenu()"></div>

    <!-- Registro Section -->
    <section class="registro-section">
        <div class="container">
            <div class="registro-container">
                <div class="registro-header">
                    <h2><i class="fas fa-user-plus"></i> Registro Cultural</h2>
                    <p>Únete a la comunidad cultural venezolana</p>
                </div>

                <?php if (isset($success)): ?>
                <div class="alert success">
                    <i class="fas fa-check-circle"></i>
                    <?php echo $success; ?>
                </div>
                <?php endif; ?>

                <?php if (!empty($errores)): ?>
                <div class="alert error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <ul>
                        <?php foreach ($errores as $error): ?>
                        <li><?php echo $error; ?></li>
                        <?php endforeach; ?>
                    </ul>
                </div>
                <?php endif; ?>

                <form method="POST" action="registro.php" class="registro-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="nombre_completo">
                                <i class="fas fa-user"></i> Nombre Completo *
                            </label>
                            <input type="text" id="nombre_completo" name="nombre_completo" required
                                   value="<?php echo isset($_POST['nombre_completo']) ? htmlspecialchars($_POST['nombre_completo']) : ''; ?>">
                        </div>

                        <div class="form-group">
                            <label for="email">
                                <i class="fas fa-envelope"></i> Correo Electrónico *
                            </label>
                            <input type="email" id="email" name="email" required
                                   value="<?php echo isset($_POST['email']) ? htmlspecialchars($_POST['email']) : ''; ?>">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="telefono">
                                <i class="fas fa-phone"></i> Teléfono
                            </label>
                            <input type="tel" id="telefono" name="telefono"
                                   value="<?php echo isset($_POST['telefono']) ? htmlspecialchars($_POST['telefono']) : ''; ?>">
                        </div>

                        <div class="form-group">
                            <label for="tipo_usuario">
                                <i class="fas fa-users"></i> Tipo de Usuario *
                            </label>
                            <select id="tipo_usuario" name="tipo_usuario" required>
                                <option value="">Seleccionar...</option>
                                <option value="cultor" <?php echo (isset($_POST['tipo_usuario']) && $_POST['tipo_usuario'] == 'cultor') ? 'selected' : ''; ?>>Cultor</option>
                                <option value="funcionario" <?php echo (isset($_POST['tipo_usuario']) && $_POST['tipo_usuario'] == 'funcionario') ? 'selected' : ''; ?>>Funcionario</option>
                                <option value="institucion" <?php echo (isset($_POST['tipo_usuario']) && $_POST['tipo_usuario'] == 'institucion') ? 'selected' : ''; ?>>Institución</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="password">
                                <i class="fas fa-lock"></i> Contraseña *
                            </label>
                            <input type="password" id="password" name="password" required minlength="8">
                            <small class="form-help">Mínimo 8 caracteres</small>
                        </div>

                        <div class="form-group">
                            <label for="password_confirm">
                                <i class="fas fa-lock"></i> Confirmar Contraseña *
                            </label>
                            <input type="password" id="password_confirm" name="password_confirm" required minlength="8">
                        </div>
                    </div>

                    <div class="form-group checkbox-group">
                        <label class="checkbox-label">
                            <input type="checkbox" name="terminos" id="terminos" required>
                            <span class="checkmark"></span>
                            Acepto los <a href="#" target="_blank">términos y condiciones</a> y la <a href="#" target="_blank">política de privacidad</a>
                        </label>
                    </div>

                    <button type="submit" class="btn-registro">
                        <i class="fas fa-user-plus"></i> Registrarse
                    </button>
                </form>

                <div class="registro-footer">
                    <p>¿Ya tienes cuenta? <a href="login.php">Inicia sesión aquí</a></p>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer>
        <div class="footer-content">
            <div class="footer-section">
                <h3>Ministerio de Cultura</h3>
                <p>República Bolivariana de Venezuela</p>
                <p>Av. Panteón, Foro Libertador</p>
                <p>Caracas, Venezuela</p>
            </div>
            <div class="footer-section">
                <h3>Enlaces Rápidos</h3>
                <ul>
                    <li><a href="#">Misión y Visión</a></li>
                    <li><a href="#">Marco Legal</a></li>
                    <li><a href="#">Transparencia</a></li>
                    <li><a href="#">Contacto</a></li>
                </ul>
            </div>
            <div class="footer-section">
                <h3>Servicios</h3>
                <ul>
                    <li><a href="registro.php">Registro Cultural</a></li>
                    <li><a href="#">Becas y Ayudas</a></li>
                    <li><a href="#">Patrimonio Cultural</a></li>
                    <li><a href="calendario.php">Eventos</a></li>
                </ul>
            </div>
            <div class="footer-section">
                <h3>Síguenos</h3>
                <ul>
                    <li><a href="#">Facebook</a></li>
                    <li><a href="#">Twitter</a></li>
                    <li><a href="#">Instagram</a></li>
                    <li><a href="#">YouTube</a></li>
                </ul>
            </div>
        </div>
        <div class="footer-bottom">
            <p>© 2026 Ministerio del Poder Popular para la Cultura - Todos los derechos reservados</p>
            <p>Desarrollado por OTIC - Oficina de Tecnologías de la Información y la Comunicación</p>
        </div>
    </footer>

    <script src="assets/js/registro.js"></script>
</body>
</html>
