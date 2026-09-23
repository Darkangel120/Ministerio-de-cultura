<?php
session_start();
require_once 'config.php';

// Verificar sesión
if (!isset($_SESSION['usuario_id'])) {
    if (php_sapi_name() === 'cli' || !empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest') {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'No autorizado']);
        exit();
    }
    header('Location: login.php');
    exit();
}

// Manejar peticiones AJAX
if (isset($_GET['action']) && $_GET['action'] == 'get_stats') {
    header('Content-Type: application/json');
    try {
        $pdo = conectarDB();
        $usuario = obtenerUsuarioActual();
        
        $stats = [];
        
        $tipos_con_stats = ['funcionario', 'admin', 'director_general', 'director_operativo'];
        
        if (in_array($usuario['TIPO_USUARIO'], $tipos_con_stats)) {
            $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM eventos WHERE activo = 1");
            $stmt->execute();
            $stats['eventosProximos'] = $stmt->fetch()['TOTAL'];
            
            $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM cultores WHERE activo = 1");
            $stmt->execute();
            $stats['cultoresRegistrados'] = $stmt->fetch()['TOTAL'];
            
            $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM foro_publicaciones WHERE activo = 1");
            $stmt->execute();
            $stats['reportesGenerados'] = $stmt->fetch()['TOTAL'];
            
        } elseif ($usuario['TIPO_USUARIO'] == 'cultor') {
            $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM foro_publicaciones WHERE usuario_id = ? AND activo = 1");
            $stmt->execute([$_SESSION['usuario_id']]);
            $stats['eventosProximos'] = $stmt->fetch()['TOTAL'];
            
            $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM foro_comentarios WHERE usuario_id = ? AND activo = 1");
            $stmt->execute([$_SESSION['usuario_id']]);
            $stats['cultoresRegistrados'] = $stmt->fetch()['TOTAL'];
            
            $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM eventos WHERE activo = 1");
            $stmt->execute();
            $stats['reportesGenerados'] = $stmt->fetch()['TOTAL'];
        }
        
        echo json_encode(['success' => true, 'stats' => $stats]);
        exit();
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        exit();
    }
}

// Obtener datos del usuario
$usuario = obtenerUsuarioActual();

// Obtener estadísticas según el tipo de usuario
$pdo = conectarDB();

$tipos_con_stats = ['funcionario', 'admin', 'director_general', 'director_operativo'];

if (in_array($usuario['TIPO_USUARIO'], $tipos_con_stats)) {
    // Estadísticas para funcionarios, admin y directores
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM eventos WHERE activo = 1");
    $stmt->execute();
    $total_eventos = $stmt->fetch()['TOTAL'];

    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM cultores WHERE activo = 1");
    $stmt->execute();
    $total_cultores = $stmt->fetch()['TOTAL'];

    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM foro_publicaciones WHERE activo = 1");
    $stmt->execute();
    $total_publicaciones = $stmt->fetch()['TOTAL'];

    // Próximos eventos
    $stmt = $pdo->prepare("SELECT FIRST 5 * FROM eventos WHERE activo = 1 AND fecha >= CURRENT_DATE ORDER BY fecha ASC");
    $stmt->execute();
    $proximos_eventos = $stmt->fetchAll(PDO::FETCH_ASSOC);

} elseif ($usuario['TIPO_USUARIO'] == 'cultor') {
    // Estadísticas para cultores
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM foro_publicaciones WHERE usuario_id = ? AND activo = 1");
    $stmt->execute([$_SESSION['usuario_id']]);
    $mis_publicaciones = $stmt->fetch()['TOTAL'];

    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM foro_comentarios WHERE usuario_id = ? AND activo = 1");
    $stmt->execute([$_SESSION['usuario_id']]);
    $mis_comentarios = $stmt->fetch()['TOTAL'];

    // Próximos eventos (todos)
    $stmt = $pdo->prepare("SELECT FIRST 5 * FROM eventos WHERE activo = 1 AND fecha >= CURRENT_DATE ORDER BY fecha ASC");
    $stmt->execute();
    $proximos_eventos = $stmt->fetchAll(PDO::FETCH_ASSOC);
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Ministerio del Poder Popular para la Cultura</title>
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
                    <?php if ($usuario['TIPO_USUARIO'] == 'funcionario'): ?>
                        <li><a href="calendario.php">Calendario</a></li>
                        <li><a href="cultores.php">Cultores</a></li>
                        <li><a href="reportes.php">Reportes</a></li>
                    <?php endif; ?>
                    <?php if ($usuario['TIPO_USUARIO'] == 'admin' || $usuario['TIPO_USUARIO'] == 'director_general' || $usuario['TIPO_USUARIO'] == 'director_operativo'): ?>
                        <li><a href="crear_usuario.php">Crear Usuario</a></li>
                    <?php endif; ?>
                    <li><a href="logout.php">Cerrar Sesión</a></li>
                </ul>
            </nav>
        </div>
    </header>

    <!-- Overlay para menu mobile -->
    <div class="overlay" id="overlay" onclick="closeMenu()"></div>

    <!-- Dashboard Section -->
    <section class="dashboard-section">
        <div class="container">
            <div class="dashboard-header">
                <p>Bienvenido, <?php echo htmlspecialchars($usuario['NOMBRE_COMPLETO']); ?></p>
            </div>

            <div class="dashboard-grid">
                <?php if ($usuario['TIPO_USUARIO'] == 'funcionario' || $usuario['TIPO_USUARIO'] == 'admin' || $usuario['TIPO_USUARIO'] == 'director_general' || $usuario['TIPO_USUARIO'] == 'director_operativo'): ?>
                    <!-- Estadísticas para funcionarios -->
                    <div class="dashboard-card">
                        <div class="card-icon">
                            <i class="fas fa-calendar-alt"></i>
                        </div>
                        <div class="card-content">
                            <h3 id="eventos-counter"><?php echo $total_eventos; ?></h3>
                            <p>Eventos Registrados</p>
                        </div>
                    </div>

                    <div class="dashboard-card">
                        <div class="card-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="card-content">
                            <h3 id="cultores-counter"><?php echo $total_cultores; ?></h3>
                            <p>Cultores Registrados</p>
                        </div>
                    </div>

                    <div class="dashboard-card">
                        <div class="card-icon">
                            <i class="fas fa-chart-bar"></i>
                        </div>
                        <div class="card-content">
                            <h3 id="reportes-counter"><?php echo $total_publicaciones; ?></h3>
                            <p>Publicaciones</p>
                        </div>
                    </div>

                <?php elseif ($usuario['TIPO_USUARIO'] == 'cultor'): ?>
                    <!-- Estadísticas para cultores -->
                    <div class="dashboard-card">
                        <div class="card-icon">
                            <i class="fas fa-edit"></i>
                        </div>
                        <div class="card-content">
                            <h3 id="eventos-counter"><?php echo $mis_publicaciones; ?></h3>
                            <p>Mis Publicaciones</p>
                        </div>
                    </div>

                    <div class="dashboard-card">
                        <div class="card-icon">
                            <i class="fas fa-comment"></i>
                        </div>
                        <div class="card-content">
                            <h3 id="cultores-counter"><?php echo $mis_comentarios; ?></h3>
                            <p>Mis Comentarios</p>
                        </div>
                    </div>

                    <div class="dashboard-card">
                        <div class="card-icon">
                            <i class="fas fa-calendar-check"></i>
                        </div>
                        <div class="card-content">
                            <h3 id="reportes-counter">0</h3>
                            <p>Eventos Inscritos</p>
                        </div>
                    </div>

                    <div class="dashboard-card">
                        <div class="card-icon">
                            <i class="fas fa-user-edit"></i>
                        </div>
                        <div class="card-content">
                            <h3>Perfil</h3>
                            <p>Actualizar</p>
                        </div>
                    </div>
                <?php endif; ?>
            </div>

            <!-- Próximos Eventos -->
            <div class="dashboard-events">
                <h3><i class="fas fa-calendar"></i> Próximos Eventos</h3>
                <div class="events-list">
                    <?php if (empty($proximos_eventos)): ?>
                        <div class="no-events">
                            <i class="fas fa-calendar-times"></i>
                            <p>No hay eventos próximos programados.</p>
                        </div>
                    <?php else: ?>
                        <?php foreach ($proximos_eventos as $evento): ?>
                        <div class="event-item">
                            <div class="event-date">
                                <span class="day"><?php echo date('d', strtotime($evento['FECHA'])); ?></span>
                                <span class="month"><?php echo strtoupper(date('M', strtotime($evento['FECHA']))); ?></span>
                            </div>
                            <div class="event-info">
                                <h4><?php echo htmlspecialchars($evento['NOMBRE_ACTIVIDAD']); ?></h4>
                                <p><i class="fas fa-clock"></i> <?php echo date('H:i', strtotime($evento['HORA'])); ?> - <?php echo htmlspecialchars($evento['DIRECCION']); ?></p>
                                <p><i class="fas fa-tag"></i> <?php echo htmlspecialchars($evento['DISCIPLINA']); ?></p>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Acciones Rápidas -->
            <div class="dashboard-actions">
                <h3><i class="fas fa-bolt"></i> Acciones Rápidas</h3>
                <div class="actions-grid">
                    <a href="foro.php" class="action-btn">
                        <i class="fas fa-plus"></i>
                        <span>Nueva Publicación</span>
                    </a>
                    <a href="calendario.php" class="action-btn">
                        <i class="fas fa-calendar-plus"></i>
                        <span>Ver Eventos</span>
                    </a>
                    <?php if ($usuario['TIPO_USUARIO'] == 'funcionario' || $usuario['TIPO_USUARIO'] == 'admin' || $usuario['TIPO_USUARIO'] == 'director_general' || $usuario['TIPO_USUARIO'] == 'director_operativo'): ?>
                        <a href="cultores.php" class="action-btn">
                            <i class="fas fa-users-cog"></i>
                            <span>Gestionar Cultores</span>
                        </a>
                        <a href="reportes.php" class="action-btn">
                            <i class="fas fa-chart-bar"></i>
                            <span>Reportes</span>
                        </a>
                        <a href="crear_usuario.php" class="action-btn">
                            <i class="fas fa-user-plus"></i>
                            <span>Crear Usuario</span>
                        </a>
                    <?php endif; ?>
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
            <p>Realizado por Rodolfo Gómez</p>
        </div>
    </footer>

    <script src="assets/js/dashboard.js"></script>
</body>
</html>
