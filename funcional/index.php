<?php
session_start();
require_once 'config.php';

$usuario = obtenerUsuarioActual();

// Obtener noticias destacadas
$pdo = conectarDB();
$stmt = $pdo->prepare("SELECT FIRST 3 * FROM noticias WHERE activo = 1 ORDER BY fecha_publicacion DESC");
$stmt->execute();
$noticias = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Obtener eventos próximos
$stmt = $pdo->prepare("SELECT FIRST 4 * FROM eventos WHERE activo = 1 AND fecha >= CURRENT_DATE ORDER BY fecha ASC");
$stmt->execute();
$eventos = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ministerio del Poder Popular para la Cultura</title>
    <link rel="icon" href="assets/favicon.jpg">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
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
                    <li><a href="#inicio" onclick="closeMenu()">Inicio</a></li>
                    <li><a href="#noticias" onclick="closeMenu()">Noticias</a></li>
                    <li><a href="#agenda" onclick="closeMenu()">Agenda</a></li>
                    <li><a href="#ministerio" onclick="closeMenu()">El Ministerio</a></li>
                    <li><a href="foro.php" onclick="closeMenu()">Foro</a></li>
                    <?php if ($usuario && $usuario['TIPO_USUARIO'] == 'funcionario'): ?>
                        <li><a href="dashboard.php">Dashboard</a></li>
                    <?php endif; ?>
                    <?php if (isset($_SESSION['usuario_id'])): ?>
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
    <section class="hero" id="inicio">
        <div class="hero-content">
            <h2>Cultura para el Pueblo Venezolano</h2>
            <p>Preservando nuestro patrimonio cultural, promoviendo las artes y fortaleciendo la identidad nacional</p>
            <a href="#agenda" class="btn">Ver Agenda Cultural</a>
        </div>
    </section>

    <!-- Noticias Destacadas -->
    <section id="noticias">
        <div class="container">
            <h2 class="section-title">Noticias Destacadas</h2>
            <div class="news-grid">
                <?php foreach ($noticias as $noticia): ?>
                <div class="news-card">
                    <div class="news-image"><i class="fas fa-newspaper"></i></div>
                    <div class="news-content">
                        <div class="news-date"><?php echo date('d \d\e F, Y', strtotime($noticia['FECHA_PUBLICACION'])); ?></div>
                        <h3><?php echo htmlspecialchars($noticia['TITULO']); ?></h3>
                        <p><?php echo htmlspecialchars(substr($noticia['CONTENIDO'], 0, 150)) . '...'; ?></p>
                        <a href="#" class="news-link">Leer más →</a>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
    </section>

    <!-- Agenda Cultural -->
    <section class="agenda-section" id="agenda">
        <div class="container">
            <h2 class="section-title">Agenda Cultural</h2>
            <?php if (!empty($eventos)): ?>
            <div class="eventos-grid">
                <?php foreach ($eventos as $evento): ?>
                <div class="evento-card">
                    <div class="evento-fecha">
                        <span><i class="fas fa-calendar"></i></span>
                        <span><?php echo date('d M', strtotime($evento['FECHA'])); ?></span>
                    </div>
                    <h3 class="evento-titulo"><?php echo htmlspecialchars($evento['NOMBRE_ACTIVIDAD']); ?></h3>
                    <p class="evento-lugar"><?php echo htmlspecialchars($evento['DIRECCION']); ?></p>
                </div>
                <?php endforeach; ?>
            </div>
            <?php else: ?>
            <div class="no-events-message">
                <p>No hay eventos próximos en la agenda cultural. ¡Mantente atento para futuras actividades!</p>
            </div>
            <?php endif; ?>
        </div>
    </section>

    <!-- Entes Adscritos -->
    <section id="ministerio">
        <div class="container">
            <h2 class="section-title">Entes Adscritos</h2>
            <div class="entes-grid">
                <div class="ente-card">
                    <div class="ente-icon"><i class="fas fa-book"></i></div>
                    <h3>Biblioteca Nacional</h3>
                </div>
                <div class="ente-card">
                    <div class="ente-icon"><i class="fas fa-film"></i></div>
                    <h3>CNAC</h3>
                </div>
                <div class="ente-card">
                    <div class="ente-icon"><i class="fas fa-theater-masks"></i></div>
                    <h3>CNT</h3>
                </div>
                <div class="ente-card">
                    <div class="ente-icon"><i class="fas fa-music"></i></div>
                    <h3>CNFM</h3>
                </div>
                <div class="ente-card">
                    <div class="ente-icon"><i class="fas fa-book"></i></div>
                    <h3>El Perro y la Rana</h3>
                </div>
                <div class="ente-card">
                    <div class="ente-icon"><i class="fas fa-landmark"></i></div>
                    <h3>CELARG</h3>
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
                    <li><a href="#">Registro Cultural</a></li>
                    <li><a href="#">Becas y Ayudas</a></li>
                    <li><a href="#">Patrimonio Cultural</a></li>
                    <li><a href="#">Eventos</a></li>
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
            
        </div>
    </footer>

    <script src="assets/js/script.js"></script>
</body>
</html>
