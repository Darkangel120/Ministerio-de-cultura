<?php
session_start();
require_once 'config.php';

// Verificar sesión
if (!isset($_SESSION['usuario_id'])) {
    header('Location: login.php');
    exit();
}

// Obtener datos del usuario
$usuario = obtenerUsuarioActual();

// Definir jerarquía de roles (orden descendente - mayor a menor)
$jerarquia_roles = [
    'admin' => ['admin', 'director_general', 'director_operativo', 'funcionario'],
    'director_general' => ['director_operativo', 'funcionario'],
    'director_operativo' => ['funcionario'],
    'funcionario' => [],
    'cultor' => [],
    'publico_general' => []
];

// Roles que pueden acceder a esta página
$roles_con_acceso = ['admin', 'director_general', 'director_operativo'];
$tipo_usuario = strtolower($usuario['TIPO_USUARIO'] ?? '');

// Verificar si el usuario tiene acceso
if (!in_array($tipo_usuario, $roles_con_acceso)) {
    // Redirigir según el tipo de usuario
    if ($tipo_usuario == 'funcionario') {
        header('Location: dashboard.php');
    } else {
        header('Location: foro.php');
    }
    exit();
}

// Obtener roles que puede crear el usuario actual
$roles_permitidos = $jerarquia_roles[$tipo_usuario] ?? [];

// Procesar formulario de creación de usuario
$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    // Validar token CSRF
    if (!validarTokenCSRF($_POST['csrf_token'] ?? '')) {
        $error = "Token de seguridad inválido.";
    } else {
        $nombre_completo = sanitizar($_POST['nombre_completo'] ?? '');
        $email = sanitizar($_POST['email'] ?? '');
        $telefono = sanitizar($_POST['telefono'] ?? '');
        $tipo_usuario_nuevo = sanitizar($_POST['tipo_usuario'] ?? '');
        $password = $_POST['password'] ?? '';
        $confirm_password = $_POST['confirm_password'] ?? '';

        // Validaciones
        if (empty($nombre_completo) || empty($email) || empty($password) || empty($tipo_usuario_nuevo)) {
            $error = "Todos los campos marcados con * son obligatorios.";
        } elseif ($password !== $confirm_password) {
            $error = "Las contraseñas no coinciden.";
        } elseif (strlen($password) < 6) {
            $error = "La contraseña debe tener al menos 6 caracteres.";
        } elseif (!in_array($tipo_usuario_nuevo, $roles_permitidos)) {
            $error = "No tiene permisos para crear un usuario de tipo: " . ucwords(str_replace('_', ' ', $tipo_usuario_nuevo));
        } else {
            $pdo = conectarDB();
            
            // Verificar si el email ya existe
            $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = ?");
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                $error = "El correo electrónico ya está registrado.";
            } else {
                // Hash de contraseña
                $password_hash = password_hash($password, PASSWORD_DEFAULT);
                
                // Insertar nuevo usuario (sin cedula ya que no existe en la tabla)
                $stmt = $pdo->prepare("INSERT INTO usuarios (nombre_completo, email, telefono, tipo_usuario, password_hash, activo, fecha_registro) VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)");
                
                if ($stmt->execute([$nombre_completo, $email, $telefono, $tipo_usuario_nuevo, $password_hash])) {
                    $success = "Usuario creado exitosamente.";
                    // Limpiar formulario
                    $_POST = array();
                } else {
                    $error = "Error al crear el usuario. Por favor, intente nuevamente.";
                }
            }
        }
    }
}

// Nombres legibles para los roles
$nombres_roles = [
    'admin' => 'Admin',
    'director_general' => 'Director General',
    'director_operativo' => 'Director Operativo',
    'funcionario' => 'Funcionario',
    'cultor' => 'Cultor',
    'publico_general' => 'Público General'
];
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Crear Usuario - Ministerio del Poder Popular para la Cultura</title>
    <link rel="icon" href="assets/favicon.jpg">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/dashboard.css">
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
    <!-- Barra Superior -->
    <div class="top-bar">
        <div class="container">
            <div><i class="fas fa-phone"></i> 0426-6574301| <i class="fas fa-envelope"></i> atencionciudadana@mincultura.gob.ve</div>
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
                    <li><a href="foro.php" onclick="closeMenu()">Foro</a></li>
                    <li><a href="dashboard.php" onclick="closeMenu()">Menu Principal</a></li>
                    <li><a href="calendario.php" onclick="closeMenu()">Calendario</a></li>
                    <li><a href="cultores.php" onclick="closeMenu()">Cultores</a></li>
                    <li><a href="reportes.php" onclick="closeMenu()">Reportes</a></li>
                    <li><a href="logout.php">Cerrar Sesión</a></li>
                </ul>
            </nav>
        </div>
    </header>

    <!-- Overlay para menu mobile -->
    <div class="overlay" id="overlay" onclick="closeMenu()"></div>

    <!-- Section Crear Usuario -->
    <section class="dashboard-section">
        <div class="container">
            <div class="dashboard-header">
                <p>Bienvenido, <?php echo htmlspecialchars($usuario['NOMBRE_COMPLETO']); ?></p>
                <h2>Crear Nuevo Usuario</h2>
                <p style="color: var(--azul); font-size: 14px; margin-top: 10px;">
                    <i class="fas fa-info-circle"></i>
                    Puede crear usuarios de los siguientes tipos:
                    <?php echo implode(', ', array_map(function($rol) use ($nombres_roles) {
                        return $nombres_roles[$rol] ?? ucwords(str_replace('_', ' ', $rol));
                    }, $roles_permitidos)); ?>
                </p>
            </div>

            <?php if ($error): ?>
                <div class="alert alert-error">
                    <i class="fas fa-exclamation-circle"></i>
                    <?php echo $error; ?>
                </div>
            <?php endif; ?>

            <?php if ($success): ?>
                <div class="alert alert-success">
                    <i class="fas fa-check-circle"></i>
                    <?php echo $success; ?>
                </div>
            <?php endif; ?>

            <div class="form-container">
                <form class="crear-usuario-form" id="crearUsuarioForm" method="post">
                    <input type="hidden" name="csrf_token" value="<?php echo generarTokenCSRF(); ?>">
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="nombre_completo">Nombre Completo *</label>
                            <input type="text" id="nombre_completo" name="nombre_completo" required 
                                   value="<?php echo htmlspecialchars($_POST['nombre_completo'] ?? ''); ?>">
                        </div>
                        <div class="form-group">
                            <label for="email">Correo Electrónico *</label>
                            <input type="email" id="email" name="email" required 
                                   value="<?php echo htmlspecialchars($_POST['email'] ?? ''); ?>">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="telefono">Teléfono</label>
                            <input type="tel" id="telefono" name="telefono" 
                                   value="<?php echo htmlspecialchars($_POST['telefono'] ?? ''); ?>">
                        </div>
                        <div class="form-group">
                            <label for="tipo_usuario">Tipo de Usuario *</label>
                            <select id="tipo_usuario" name="tipo_usuario" required>
                                <option value="">Seleccionar tipo de usuario</option>
                                <?php foreach ($roles_permitidos as $rol): ?>
                                    <option value="<?php echo $rol; ?>" <?php echo (($_POST['tipo_usuario'] ?? '') == $rol) ? 'selected' : ''; ?>>
                                        <?php echo $nombres_roles[$rol] ?? ucwords(str_replace('_', ' ', $rol)); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="password">Contraseña *</label>
                            <input type="password" id="password" name="password" required minlength="6">
                        </div>
                        <div class="form-group">
                            <label for="confirm_password">Confirmar Contraseña *</label>
                            <input type="password" id="confirm_password" name="confirm_password" required minlength="6">
                        </div>
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-user-plus"></i> Crear Usuario
                        </button>
                        <a href="dashboard.php" class="btn btn-secondary">
                            <i class="fas fa-arrow-left"></i> Volver al Dashboard
                        </a>
                    </div>
                </form>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer>
        <div class="container">
            <p>&copy; 2025 Ministerio del Poder Popular para la Cultura. Todos los derechos reservados.</p>
            <p>Realizado por Rodolfo Gómez</p>
        </div>
    </footer>

    <script src="assets/js/script.js"></script>
    <script>
        // Validación del formulario
        document.getElementById('crearUsuarioForm').addEventListener('submit', function(e) {
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm_password').value;
            
            if (password !== confirmPassword) {
                e.preventDefault();
                alert('Las contraseñas no coinciden. Por favor, verifique.');
            }
            
            if (password.length < 6) {
                e.preventDefault();
                alert('La contraseña debe tener al menos 6 caracteres.');
            }
        });
    </script>
</body>
</html>
