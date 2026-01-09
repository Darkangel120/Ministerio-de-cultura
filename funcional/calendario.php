<?php
session_start();
require_once 'config.php';

// Obtener todos los eventos
$pdo = conectarDB();
$stmt = $pdo->prepare("SELECT * FROM eventos WHERE activo = 1 ORDER BY fecha ASC");
$stmt->execute();
$eventos = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Procesar filtros
$filtro_mes = isset($_GET['mes']) ? (int)$_GET['mes'] : date('m');
$filtro_anio = isset($_GET['anio']) ? (int)$_GET['anio'] : date('Y');
$filtro_categoria = isset($_GET['categoria']) ? sanitizar($_GET['categoria']) : '';

$query = "SELECT * FROM eventos WHERE activo = 1 AND EXTRACT(MONTH FROM fecha) = ? AND EXTRACT(YEAR FROM fecha) = ?";
$params = [$filtro_mes, $filtro_anio];

if ($filtro_categoria) {
    $query .= " AND categoria = ?";
    $params[] = $filtro_categoria;
}

$query .= " ORDER BY fecha ASC";

$stmt = $pdo->prepare($query);
$stmt->execute($params);
$eventos_filtrados = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Calendario Cultural - Ministerio del Poder Popular para la Cultura</title>
    <link rel="icon" href="assets/favicon.jpg">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/calendario.css">
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
                    <?php if (isset($_SESSION['usuario_id'])): ?>
                        <li><a href="dashboard.php" onclick="closeMenu()">Dashboard</a></li>
                        <li><a href="logout.php" onclick="closeMenu()">Salir</a></li>
                    <?php else: ?>
                        <li><a href="login.php" onclick="closeMenu()">Iniciar Sesión</a></li>
                    <?php endif; ?>
                </ul>
            </nav>
        </div>
    </header>

    <!-- Overlay para menu mobile -->
    <div class="overlay" id="overlay" onclick="closeMenu()"></div>

    <!-- Hero Section -->
    <section class="hero">
        <div class="hero-content">
            <h2>Calendario Cultural</h2>
            <p>Descubre todos los eventos culturales programados en Venezuela</p>
        </div>
    </section>

    <!-- Filtros -->
    <section class="filtros-section">
        <div class="container">
            <form method="GET" action="calendario.php" class="filtros-form">
                <div class="filtro-group">
                    <label for="mes">Mes:</label>
                    <select name="mes" id="mes">
                        <?php for ($i = 1; $i <= 12; $i++): ?>
                            <option value="<?php echo $i; ?>" <?php echo ($filtro_mes == $i) ? 'selected' : ''; ?>>
                                <?php echo date('F', mktime(0, 0, 0, $i, 1)); ?>
                            </option>
                        <?php endfor; ?>
                    </select>
                </div>
                <div class="filtro-group">
                    <label for="anio">Año:</label>
                    <select name="anio" id="anio">
                        <?php for ($i = date('Y'); $i <= date('Y') + 2; $i++): ?>
                            <option value="<?php echo $i; ?>" <?php echo ($filtro_anio == $i) ? 'selected' : ''; ?>>
                                <?php echo $i; ?>
                            </option>
                        <?php endfor; ?>
                    </select>
                </div>
                <div class="filtro-group">
                    <label for="categoria">Categoría:</label>
                    <select name="categoria" id="categoria">
                        <option value="">Todas las categorías</option>
                        <option value="musica" <?php echo ($filtro_categoria == 'musica') ? 'selected' : ''; ?>>Música</option>
                        <option value="danza" <?php echo ($filtro_categoria == 'danza') ? 'selected' : ''; ?>>Danza</option>
                        <option value="teatro" <?php echo ($filtro_categoria == 'teatro') ? 'selected' : ''; ?>>Teatro</option>
                        <option value="artesPlasticas" <?php echo ($filtro_categoria == 'artesPlasticas') ? 'selected' : ''; ?>>Artes Plásticas</option>
                        <option value="literatura" <?php echo ($filtro_categoria == 'literatura') ? 'selected' : ''; ?>>Literatura</option>
                        <option value="cine" <?php echo ($filtro_categoria == 'cine') ? 'selected' : ''; ?>>Cine</option>
                    </select>
                </div>
                <button type="submit" class="btn-filtro">Filtrar</button>
            </form>
        </div>
    </section>

    <!-- Lista de Eventos -->
    <section class="eventos-section">
        <div class="container">
            <div class="eventos-list">
                <?php if (empty($eventos_filtrados)): ?>
                    <div class="no-eventos">
                        <i class="fas fa-calendar-times"></i>
                        <h3>No hay eventos programados</h3>
                        <p>Para el período seleccionado no se encontraron eventos.</p>
                    </div>
                <?php else: ?>
                    <?php foreach ($eventos_filtrados as $evento): ?>
                    <div class="evento-card-full">
                        <div class="evento-fecha">
                            <div class="fecha-numero"><?php echo date('d', strtotime($evento['FECHA'])); ?></div>
                            <div class="fecha-mes"><?php echo strtoupper(date('M', strtotime($evento['FECHA']))); ?></div>
                        </div>
                        <div class="evento-content">
                            <div class="evento-header">
                                <h3><?php echo htmlspecialchars($evento['NOMBRE_ACTIVIDAD']); ?></h3>
                                <span class="evento-categoria categoria-<?php echo $evento['CATEGORIA']; ?>">
                                    <?php echo ucfirst($evento['CATEGORIA']); ?>
                                </span>
                            </div>
                            <div class="evento-details">
                                <div class="evento-info">
                                    <i class="fas fa-clock"></i>
                                    <span><?php echo date('H:i', strtotime($evento['HORA_INICIO'])); ?> - <?php echo date('H:i', strtotime($evento['HORA_FIN'])); ?></span>
                                </div>
                                <div class="evento-info">
                                    <i class="fas fa-map-marker-alt"></i>
                                    <span><?php echo htmlspecialchars($evento['DIRECCION']); ?></span>
                                </div>
                                <div class="evento-info">
                                    <i class="fas fa-users"></i>
                                    <span><?php echo htmlspecialchars($evento['PARTICIPANTES']); ?></span>
                                </div>
                            </div>
                            <p class="evento-descripcion"><?php echo htmlspecialchars($evento['DESCRIPCION']); ?></p>
                            <?php if ($evento['REQUIERE_INSCRIPCION']): ?>
                                <div class="evento-inscripcion">
                                    <button class="btn-inscribirse" onclick="inscribirseEvento(<?php echo $evento['ID']; ?>)">
                                        <i class="fas fa-user-plus"></i> Inscribirse
                                    </button>
                                </div>
                            <?php endif; ?>
                        </div>
                    </div>
                    <?php endforeach; ?>
                <?php endif; ?>
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

    <script src="assets/js/calendario.js"></script>
</body>
</html>
