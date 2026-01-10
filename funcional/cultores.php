<?php
session_start();
require_once 'config.php';

// Conectar a la base de datos
$pdo = conectarDB();

// Verificar sesión
if (!isset($_SESSION['usuario_id'])) {
    header('Location: login.php');
    exit();
}

// Procesar solicitudes GET (para AJAX)
if ($_SERVER['REQUEST_METHOD'] == 'GET' && isset($_GET['action'])) {
    header('Content-Type: application/json');

    if ($_GET['action'] == 'get_cultores') {
        // Obtener todos los cultores activos
        $stmt = $pdo->prepare("SELECT * FROM cultores WHERE activo = 1 ORDER BY nombres_apellidos ASC");
        $stmt->execute();
        $cultores = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'cultores' => $cultores]);
        exit();
    } elseif ($_GET['action'] == 'delete_cultor' && isset($_GET['id'])) {
        // Eliminar cultor (marcar como inactivo)
        $id = (int)$_GET['id'];

        try {
            $stmt = $pdo->prepare("UPDATE cultores SET activo = 0 WHERE id = ?");
            $stmt->execute([$id]);

            echo json_encode(['success' => true, 'message' => 'Cultor eliminado exitosamente.']);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Error al eliminar cultor: ' . $e->getMessage()]);
        }
        exit();
    }
}

// Procesar formulario de cultor
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    if (isset($_POST['action'])) {
        if ($_POST['action'] == 'add_cultor') {
            // Agregar nuevo cultor
            $nombres_apellidos = sanitizar($_POST['nombres_apellidos']);
            $telefono = sanitizar($_POST['telefono']);
            $cedula = sanitizar($_POST['cedula']);
            $correo = sanitizar($_POST['correo']);
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

            try {
                $stmt = $pdo->prepare("INSERT INTO cultores (nombres_apellidos, telefono, cedula, correo, area_tematica, disciplina, comuna, municipio, parroquia, carnet_patria, direccion, lugar_nacimiento, fecha_nacimiento, edad, trayectoria_anios, organizacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$nombres_apellidos, $telefono, $cedula, $correo, $area_tematica, $disciplina, $comuna, $municipio, $parroquia, $carnet_patria, $direccion, $lugar_nacimiento, $fecha_nacimiento, $edad, $trayectoria_anios, $organizacion]);

                $success = "Cultor registrado exitosamente.";
            } catch (Exception $e) {
                $error = "Error al registrar cultor: " . $e->getMessage();
            }
        } elseif ($_POST['action'] == 'edit_cultor') {
            // Editar cultor existente
            $id = (int)$_POST['cultor_id'];
            $nombres_apellidos = sanitizar($_POST['nombres_apellidos']);
            $telefono = sanitizar($_POST['telefono']);
            $cedula = sanitizar($_POST['cedula']);
            $correo = sanitizar($_POST['correo']);
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

            try {
                $stmt = $pdo->prepare("UPDATE cultores SET nombres_apellidos = ?, telefono = ?, cedula = ?, correo = ?, area_tematica = ?, disciplina = ?, comuna = ?, municipio = ?, parroquia = ?, carnet_patria = ?, direccion = ?, lugar_nacimiento = ?, fecha_nacimiento = ?, edad = ?, trayectoria_anios = ?, organizacion = ? WHERE id = ?");
                $stmt->execute([$nombres_apellidos, $telefono, $cedula, $correo, $area_tematica, $disciplina, $comuna, $municipio, $parroquia, $carnet_patria, $direccion, $lugar_nacimiento, $fecha_nacimiento, $edad, $trayectoria_anios, $organizacion, $id]);

                $success = "Cultor actualizado exitosamente.";
            } catch (Exception $e) {
                $error = "Error al actualizar cultor: " . $e->getMessage();
            }
        } elseif ($_POST['action'] == 'delete_cultor') {
            // Eliminar cultor (marcar como inactivo)
            $id = (int)$_POST['cultor_id'];

            try {
                $stmt = $pdo->prepare("UPDATE cultores SET activo = 0 WHERE id = ?");
                $stmt->execute([$id]);

                $success = "Cultor eliminado exitosamente.";
            } catch (Exception $e) {
                $error = "Error al eliminar cultor: " . $e->getMessage();
            }
        }
    }
}

// Obtener filtros
$filtro_disciplina = isset($_GET['disciplina']) ? sanitizar($_GET['disciplina']) : '';
$filtro_municipio = isset($_GET['municipio']) ? sanitizar($_GET['municipio']) : '';

// Construir consulta con filtros
$query = "SELECT * FROM cultores WHERE activo = 1";
$params = [];

if ($filtro_disciplina) {
    $query .= " AND area_tematica = ?";
    $params[] = $filtro_disciplina;
}

if ($filtro_municipio) {
    $query .= " AND municipio = ?";
    $params[] = $filtro_municipio;
}

$query .= " ORDER BY nombres_apellidos ASC";

$stmt = $pdo->prepare($query);
$stmt->execute($params);
$cultores = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Obtener listas para filtros
$stmt = $pdo->prepare("SELECT DISTINCT area_tematica FROM cultores WHERE activo = 1 ORDER BY area_tematica");
$stmt->execute();
$disciplinas = $stmt->fetchAll(PDO::FETCH_COLUMN);

$stmt = $pdo->prepare("SELECT DISTINCT municipio FROM cultores WHERE activo = 1 ORDER BY municipio");
$stmt->execute();
$municipios = $stmt->fetchAll(PDO::FETCH_COLUMN);
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestión de Cultores - Ministerio del Poder Popular para la Cultura</title>
    <link rel="icon" href="assets/favicon.jpg">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/cultores.css">
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
    <div class="cultores-container">
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
                    <ul>
                    <li><a href="foro.php" onclick="closeMenu()">Foro</a></li>
                    <li><a href="dashboard.php" onclick="closeMenu()">Dashboard</a></li>
                    <li><a href="calendario.php">Calendario</a></li>
                    <li><a href="cultores.php">Cultores</a></li>
                    <li><a href="logout.php" onclick="closeMenu()">Cerrar Sesión</a></li>
                </ul>
            </nav>
        </div>
    </header>

        <main class="cultores-main">
            <div class="cultores-controls">
                <h2>Gestión de Cultores</h2>
                <button id="addCultorBtn" class="btn-add">Agregar Cultor</button>
            </div>

            <div class="cultores-filters">
                <div class="filter-group">
                    <label for="filterDisciplina">Filtrar por Área Temática:</label>
                    <select id="filterDisciplina">
                        <option value="">Todas las Áreas</option>
                        <?php foreach ($disciplinas as $disciplina): ?>
                            <option value="<?php echo $disciplina; ?>" <?php echo ($filtro_disciplina == $disciplina) ? 'selected' : ''; ?>>
                                <?php echo ucfirst($disciplina); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="filter-group">
                    <label for="filterMunicipio">Filtrar por Municipio:</label>
                    <select id="filterMunicipio">
                        <option value="">Todos los Municipios</option>
                        <?php foreach ($municipios as $municipio): ?>
                            <option value="<?php echo $municipio; ?>" <?php echo ($filtro_municipio == $municipio) ? 'selected' : ''; ?>>
                                <?php echo $municipio; ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
            </div>

            <?php if (isset($success)): ?>
            <div class="alert success">
                <i class="fas fa-check-circle"></i>
                <?php echo $success; ?>
            </div>
            <?php endif; ?>

            <?php if (isset($error)): ?>
            <div class="alert error">
                <i class="fas fa-exclamation-triangle"></i>
                <?php echo $error; ?>
            </div>
            <?php endif; ?>

            <div class="cultores-grid" id="cultoresGrid">
                <?php if (empty($cultores)): ?>
                    <div class="no-cultores">
                        <i class="fas fa-users"></i>
                        <h3>No se encontraron cultores</h3>
                        <p>No hay cultores registrados con los filtros seleccionados.</p>
                    </div>
                <?php else: ?>
                    <?php foreach ($cultores as $cultor): ?>
                    <div class="cultor-card">
                        <div class="cultor-header">
                            <div class="cultor-avatar">
                                <i class="fas fa-user"></i>
                            </div>
                            <div class="cultor-info">
                                <h3><?php echo htmlspecialchars($cultor['NOMBRES_APELLIDOS']); ?></h3>
                                <p class="cultor-disciplina"><?php echo ucfirst($cultor['AREA_TEMATICA']); ?> - <?php echo htmlspecialchars($cultor['DISCIPLINA']); ?></p>
                            </div>
                        </div>
                        <div class="cultor-details">
                            <div class="detail-item">
                                <i class="fas fa-phone"></i>
                                <span><?php echo htmlspecialchars($cultor['TELEFONO']); ?></span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-envelope"></i>
                                <span><?php echo htmlspecialchars($cultor['CORREO']); ?></span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-map-marker-alt"></i>
                                <span><?php echo htmlspecialchars($cultor['MUNICIPIO']); ?>, <?php echo htmlspecialchars($cultor['PARROQUIA']); ?></span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-building"></i>
                                <span><?php echo htmlspecialchars($cultor['ORGANIZACION']); ?></span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-calendar"></i>
                                <span><?php echo $cultor['TRAYECTORIA_ANIOS']; ?> años de trayectoria</span>
                            </div>
                        </div>
                        <div class="cultor-actions">
                            <button class="btn-edit" onclick="editarCultor(<?php echo $cultor['ID']; ?>)">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="btn-delete" onclick="eliminarCultor(<?php echo $cultor['ID']; ?>)">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        </div>
                    </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </main>
    </div>

    <!-- Modal para agregar/editar cultor -->
    <div id="cultorModal" class="modal">
        <div class="modal-content">
            <span class="close">&times;</span>
            <h3 id="modalTitle">Agregar Cultor</h3>
            <form id="cultorForm" method="POST" action="cultores.php">
                <input type="hidden" name="action" id="formAction" value="add_cultor">
                <input type="hidden" name="cultor_id" id="cultorId" value="">
                <div class="form-row">
                    <div class="form-group">
                        <label for="nombres_apellidos">Nombres y Apellidos *</label>
                        <input type="text" id="nombres_apellidos" name="nombres_apellidos" required>
                    </div>
                    <div class="form-group">
                        <label for="telefono">Teléfono *</label>
                        <input type="tel" id="telefono" name="telefono" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="cedula">Cédula *</label>
                        <input type="text" id="cedula" name="cedula" required>
                    </div>
                    <div class="form-group">
                        <label for="correo">Correo Electrónico *</label>
                        <input type="email" id="correo" name="correo" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="area_tematica">Área Temática *</label>
                        <select id="area_tematica" name="area_tematica" required>
                            <option value="">Seleccionar...</option>
                            <option value="musica">Música</option>
                            <option value="danza">Danza</option>
                            <option value="teatro">Teatro</option>
                            <option value="artesPlasticas">Artes Plásticas</option>
                            <option value="literatura">Literatura</option>
                            <option value="artesanias">Artesanías</option>
                            <option value="cine">Cine</option>
                            <option value="fotografia">Fotografía</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="disciplina">Disciplina *</label>
                        <input type="text" id="disciplina" name="disciplina" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="comuna">Comuna</label>
                        <input type="text" id="comuna" name="comuna">
                    </div>
                    <div class="form-group">
                        <label for="municipio">Municipio *</label>
                        <input type="text" id="municipio" name="municipio" required>
                    </div>
                    <div class="form-group">
                        <label for="parroquia">Parroquia *</label>
                        <input type="text" id="parroquia" name="parroquia" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="carnet_patria">Código Carnet Patria *</label>
                        <input type="text" id="carnet_patria" name="carnet_patria" required>
                    </div>
                    <div class="form-group">
                        <label for="direccion">Dirección Exacta de Domicilio *</label>
                        <input type="text" id="direccion" name="direccion" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="lugar_nacimiento">Lugar de Nacimiento *</label>
                        <input type="text" id="lugar_nacimiento" name="lugar_nacimiento" required>
                    </div>
                    <div class="form-group">
                        <label for="fecha_nacimiento">Fecha Nacimiento *</label>
                        <input type="date" id="fecha_nacimiento" name="fecha_nacimiento" required>
                    </div>
                    <div class="form-group">
                        <label for="edad">Edad *</label>
                        <input type="number" id="edad" name="edad" min="1" max="120" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="trayectoria_anios">Años de Trayectoria *</label>
                        <input type="number" id="trayectoria_anios" name="trayectoria_anios" min="0" max="100" required>
                    </div>
                    <div class="form-group">
                        <label for="organizacion">Organización Social a la que pertenece *</label>
                        <input type="text" id="organizacion" name="organizacion" required>
                    </div>
                </div>
                <button type="submit" class="btn-submit">Guardar</button>
            </form>
        </div>
    </div>

    <script src="assets/js/cultores.js"></script>
</body>
</html>
