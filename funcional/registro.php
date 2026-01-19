<?php
session_start();
require_once 'config.php';

// Si ya está logueado, redirigir al dashboard
if (isset($_SESSION['usuario_id'])) {
    header('Location: dashboard.php');
    exit();
}

// Función para calcular la edad a partir de la fecha de nacimiento
function calcularEdad($fecha_nacimiento) {
    $fecha_nac = new DateTime($fecha_nacimiento);
    $hoy = new DateTime();
    $edad = $hoy->diff($fecha_nac);
    return $edad->y;
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

    // Validaciones adicionales para cultores
    if ($tipo_usuario == 'cultor') {
        if (empty($_POST['cedula'])) $errores[] = "La cédula es requerida para cultores";
        if (empty($_POST['area_tematica'])) $errores[] = "El área temática es requerida para cultores";
        if (empty($_POST['disciplina'])) $errores[] = "La disciplina es requerida para cultores";
        if (empty($_POST['municipio'])) $errores[] = "El municipio es requerido para cultores";
        if (empty($_POST['parroquia'])) $errores[] = "La parroquia es requerida para cultores";
        if (empty($_POST['carnet_patria'])) $errores[] = "El código Carnet Patria es requerido para cultores";
        if (empty($_POST['direccion'])) $errores[] = "La dirección es requerida para cultores";
        if (empty($_POST['lugar_nacimiento'])) $errores[] = "El lugar de nacimiento es requerido para cultores";
        if (empty($_POST['fecha_nacimiento'])) $errores[] = "La fecha de nacimiento es requerida para cultores";
        if (!isset($_POST['trayectoria_anios'])) $errores[] = "Los años de trayectoria son requeridos para cultores";
        if (empty($_POST['organizacion'])) $errores[] = "La organización es requerida para cultores";
    }

    if (empty($errores)) {
        try {
            $password_hash = password_hash($password, PASSWORD_DEFAULT);

            $stmt = $pdo->prepare("INSERT INTO usuarios (nombre_completo, email, telefono, tipo_usuario, password, fecha_registro, activo) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 1)");
            $stmt->execute([$nombre_completo, $email, $telefono, $tipo_usuario, $password_hash]);

            $usuario_id = $pdo->lastInsertId();

            // Si es cultor, guardar datos adicionales en tabla cultores
            if ($tipo_usuario == 'cultor') {
                $cedula = sanitizar($_POST['cedula']);
                $area_tematica = sanitizar($_POST['area_tematica']);
                $disciplina = sanitizar($_POST['disciplina']);
                $comuna = sanitizar($_POST['comuna']);
                $municipio = sanitizar($_POST['municipio']);
                $parroquia = sanitizar($_POST['parroquia']);
                $carnet_patria = sanitizar($_POST['carnet_patria']);
                $direccion = sanitizar($_POST['direccion']);
                $lugar_nacimiento = sanitizar($_POST['lugar_nacimiento']);
                $fecha_nacimiento = $_POST['fecha_nacimiento'];
                $edad = (int)$_POST['edad'];
                $trayectoria_anios = (int)$_POST['trayectoria_anios'];
                $organizacion = sanitizar($_POST['organizacion']);

                $stmt = $pdo->prepare("INSERT INTO cultores (nombres_apellidos, telefono, cedula, correo, area_tematica, disciplina, comuna, municipio, parroquia, carnet_patria, direccion, lugar_nacimiento, fecha_nacimiento, edad, trayectoria_anios, organizacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$nombre_completo, $telefono, $cedula, $email, $area_tematica, $disciplina, $comuna, $municipio, $parroquia, $carnet_patria, $direccion, $lugar_nacimiento, $fecha_nacimiento, $edad, $trayectoria_anios, $organizacion]);
            }

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
                                <option value="Publico en general" <?php echo (isset($_POST['tipo_usuario']) && $_POST['tipo_usuario'] == 'institucion') ? 'selected' : ''; ?>>Institución</option>
                            </select>
                        </div>
                    </div>

                    <!-- Campos adicionales para cultores -->
                    <div id="cultorFields">
                        <h4>Información del Cultor</h4>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="cedula">
                                    <i class="fas fa-id-card"></i> Cédula *
                                </label>
                                <input type="text" id="cedula" name="cedula"
                                       value="<?php echo isset($_POST['cedula']) ? htmlspecialchars($_POST['cedula']) : ''; ?>">
                            </div>
                            <div class="form-group">
                                <label for="area_tematica">
                                    <i class="fas fa-palette"></i> Área Temática *
                                </label>
                                <select id="area_tematica" name="area_tematica">
                                    <option value="">Seleccionar...</option>
                                    <option value="musica" <?php echo (isset($_POST['area_tematica']) && $_POST['area_tematica'] == 'musica') ? 'selected' : ''; ?>>Música</option>
                                    <option value="danza" <?php echo (isset($_POST['area_tematica']) && $_POST['area_tematica'] == 'danza') ? 'selected' : ''; ?>>Danza</option>
                                    <option value="teatro" <?php echo (isset($_POST['area_tematica']) && $_POST['area_tematica'] == 'teatro') ? 'selected' : ''; ?>>Teatro</option>
                                    <option value="artesPlasticas" <?php echo (isset($_POST['area_tematica']) && $_POST['area_tematica'] == 'artesPlasticas') ? 'selected' : ''; ?>>Artes Plásticas</option>
                                    <option value="literatura" <?php echo (isset($_POST['area_tematica']) && $_POST['area_tematica'] == 'literatura') ? 'selected' : ''; ?>>Literatura</option>
                                    <option value="artesanias" <?php echo (isset($_POST['area_tematica']) && $_POST['area_tematica'] == 'artesanias') ? 'selected' : ''; ?>>Artesanías</option>
                                    <option value="cine" <?php echo (isset($_POST['area_tematica']) && $_POST['area_tematica'] == 'cine') ? 'selected' : ''; ?>>Cine</option>
                                    <option value="fotografia" <?php echo (isset($_POST['area_tematica']) && $_POST['area_tematica'] == 'fotografia') ? 'selected' : ''; ?>>Fotografía</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="disciplina">
                                    <i class="fas fa-music"></i> Disciplina *
                                </label>
                                <input type="text" id="disciplina" name="disciplina"
                                       value="<?php echo isset($_POST['disciplina']) ? htmlspecialchars($_POST['disciplina']) : ''; ?>">
                            </div>
                            <div class="form-group">
                                <label for="comuna">
                                    <i class="fas fa-building"></i> Comuna
                                </label>
                                <input type="text" id="comuna" name="comuna"
                                       value="<?php echo isset($_POST['comuna']) ? htmlspecialchars($_POST['comuna']) : ''; ?>">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="municipio">
                                    <i class="fas fa-map-marker-alt"></i> Municipio *
                                </label>
                                <input type="text" id="municipio" name="municipio"
                                       value="<?php echo isset($_POST['municipio']) ? htmlspecialchars($_POST['municipio']) : ''; ?>">
                            </div>
                            <div class="form-group">
                                <label for="parroquia">
                                    <i class="fas fa-map-marker-alt"></i> Parroquia *
                                </label>
                                <input type="text" id="parroquia" name="parroquia"
                                       value="<?php echo isset($_POST['parroquia']) ? htmlspecialchars($_POST['parroquia']) : ''; ?>">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="carnet_patria">
                                    <i class="fas fa-credit-card"></i> Código Carnet Patria *
                                </label>
                                <input type="text" id="carnet_patria" name="carnet_patria"
                                       value="<?php echo isset($_POST['carnet_patria']) ? htmlspecialchars($_POST['carnet_patria']) : ''; ?>">
                            </div>
                            <div class="form-group">
                                <label for="direccion">
                                    <i class="fas fa-home"></i> Dirección Exacta de Domicilio *
                                </label>
                                <input type="text" id="direccion" name="direccion"
                                       value="<?php echo isset($_POST['direccion']) ? htmlspecialchars($_POST['direccion']) : ''; ?>">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="lugar_nacimiento">
                                    <i class="fas fa-globe"></i> Lugar de Nacimiento *
                                </label>
                                <input type="text" id="lugar_nacimiento" name="lugar_nacimiento"
                                       value="<?php echo isset($_POST['lugar_nacimiento']) ? htmlspecialchars($_POST['lugar_nacimiento']) : ''; ?>">
                            </div>
                            <div class="form-group">
                                <label for="fecha_nacimiento">
                                    <i class="fas fa-calendar"></i> Fecha Nacimiento *
                                </label>
                                <input type="date" id="fecha_nacimiento" name="fecha_nacimiento"
                                       value="<?php echo isset($_POST['fecha_nacimiento']) ? htmlspecialchars($_POST['fecha_nacimiento']) : ''; ?>">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="trayectoria_anios">
                                    <i class="fas fa-clock"></i> Años de Trayectoria *
                                </label>
                                <input type="number" id="trayectoria_anios" name="trayectoria_anios" min="0" max="100"
                                       value="<?php echo isset($_POST['trayectoria_anios']) ? htmlspecialchars($_POST['trayectoria_anios']) : ''; ?>">
                            </div>
                            <div class="form-group">
                                <label for="organizacion">
                                    <i class="fas fa-users"></i> Organización Social a la que pertenece *
                                </label>
                                <input type="text" id="organizacion" name="organizacion"
                                       value="<?php echo isset($_POST['organizacion']) ? htmlspecialchars($_POST['organizacion']) : ''; ?>">
                            </div>
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
                            <p>Acepto los <a href="#" target="_blank">términos y condiciones</a> y la <a href="#" target="_blank">política de privacidad</a></p>
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

    <script src="assets/js/registro.js"></script>
</body>
</html>
