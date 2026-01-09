<?php
session_start();
require_once 'config.php';

// Obtener publicaciones del foro
$pdo = conectarDB();
$stmt = $pdo->prepare("SELECT FIRST 10 fp.*, u.nombre_completo FROM foro_publicaciones fp LEFT JOIN usuarios u ON fp.usuario_id = u.id WHERE fp.activo = 1 ORDER BY fp.fecha_publicacion DESC");
$stmt->execute();
$publicaciones = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Obtener eventos próximos para el sidebar
$stmt = $pdo->prepare("SELECT FIRST 3 * FROM eventos WHERE activo = 1 AND fecha >= CURRENT_DATE ORDER BY fecha ASC");
$stmt->execute();
$eventos = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Procesar nueva publicación
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['crear_publicacion'])) {
    if (!isset($_SESSION['usuario_id'])) {
        header('Location: login.php');
        exit();
    }

    $titulo = sanitizar($_POST['titulo']);
    $categoria = sanitizar($_POST['categoria']);
    $descripcion = sanitizar($_POST['descripcion']);
    $usuario_id = $_SESSION['usuario_id'];

    // Manejar archivo multimedia
    $archivo_url = null;
    $tipo_archivo = null;
    if (isset($_FILES['archivo']) && $_FILES['archivo']['error'] == 0) {
        $upload_dir = 'assets/uploads/';
        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0755, true);
        }

        $file_name = uniqid() . '_' . basename($_FILES['archivo']['name']);
        $file_path = $upload_dir . $file_name;

        if (move_uploaded_file($_FILES['archivo']['tmp_name'], $file_path)) {
            $archivo_url = $file_path;

            // Determinar tipo de archivo
            $file_type = $_FILES['archivo']['type'];
            if (strpos($file_type, 'image/') === 0) {
                $tipo_archivo = 'imagen';
            } elseif (strpos($file_type, 'video/') === 0) {
                $tipo_archivo = 'video';
            } elseif (strpos($file_type, 'audio/') === 0) {
                $tipo_archivo = 'audio';
            }
        }
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO foro_publicaciones (usuario_id, titulo, categoria, descripcion, archivo_url, tipo_archivo) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$usuario_id, $titulo, $categoria, $descripcion, $archivo_url, $tipo_archivo]);

        // Registrar en logs
        $stmt = $pdo->prepare("INSERT INTO logs_sistema (usuario_id, accion, descripcion, ip_address) VALUES (?, 'crear_publicacion', 'Publicación creada: ' || ?, ?)");
        $stmt->execute([$usuario_id, $titulo, $_SERVER['REMOTE_ADDR']]);

        header('Location: foro.php?success=1');
        exit();
    } catch (Exception $e) {
        $error = "Error al crear la publicación: " . $e->getMessage();
    }
}

// Procesar nuevo comentario
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['crear_comentario'])) {
    if (!isset($_SESSION['usuario_id'])) {
        header('Location: login.php');
        exit();
    }

    $publicacion_id = (int)$_POST['publicacion_id'];
    $comentario = sanitizar($_POST['comentario']);
    $usuario_id = $_SESSION['usuario_id'];

    try {
        $stmt = $pdo->prepare("INSERT INTO foro_comentarios (publicacion_id, usuario_id, comentario) VALUES (?, ?, ?)");
        $stmt->execute([$publicacion_id, $usuario_id, $comentario]);

        header('Location: foro.php#post-' . $publicacion_id);
        exit();
    } catch (Exception $e) {
        $error = "Error al crear el comentario: " . $e->getMessage();
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Foro de Cultores - Ministerio del Poder Popular para la Cultura</title>
    <link rel="icon" href="assets/favicon.jpg">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/foro.css">
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
            <h2>Foro de Cultores</h2>
            <p>Comparte tu arte: danza, música, artes plásticas, poesía y más. ¡Interactúa con la comunidad cultural!</p>
        </div>
    </section>

    <!-- Feed Principal -->
    <section id="feed">
        <div class="container">
            <div class="feed-layout">
                <!-- Sidebar Izquierdo -->
                <aside class="feed-sidebar">
                    <!-- Invitaciones a Eventos -->
                    <div class="eventos-invitaciones">
                        <h3><i class="fas fa-theater-masks"></i> Eventos Próximos</h3>
                        <p class="sidebar-subtitle">¡Únete a la Comunidad Cultural!</p>
                        <div class="eventos-grid">
                            <?php foreach ($eventos as $evento): ?>
                            <div class="evento-card">
                                <div class="evento-fecha">
                                    <span><?php echo date('d M', strtotime($evento['fecha'])); ?></span>
                                </div>
                                <h4><?php echo htmlspecialchars($evento['nombre_actividad']); ?></h4>
                                <p><?php echo htmlspecialchars($evento['direccion']); ?></p>
                                <a href="calendario.php" class="evento-link">Ver más</a>
                            </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </aside>

                <!-- Contenido Principal -->
                <main class="feed-main">
                    <?php if (isset($_GET['success'])): ?>
                    <div class="alert success">Publicación creada exitosamente.</div>
                    <?php endif; ?>

                    <?php if (isset($error)): ?>
                    <div class="alert error"><?php echo $error; ?></div>
                    <?php endif; ?>

                    <!-- Caja de Publicación -->
                    <?php if (isset($_SESSION['usuario_id'])): ?>
                    <div class="post-box">
                        <div class="post-box-header">
                            <div class="user-avatar"><i class="fas fa-user"></i></div>
                            <div class="post-input">
                                <input type="text" id="quickPost" placeholder="¿Qué obra cultural estás creando? Comparte tu inspiración..." readonly onclick="openPostModal()">
                            </div>
                        </div>
                    </div>
                    <?php else: ?>
                    <div class="post-box">
                        <div class="post-box-header">
                            <div class="user-avatar"><i class="fas fa-lock"></i></div>
                            <div class="post-input">
                                <input type="text" placeholder="Inicia sesión para compartir tu arte..." readonly onclick="window.location.href='login.php'">
                            </div>
                        </div>
                    </div>
                    <?php endif; ?>

                    <!-- Feed de Publicaciones -->
                    <div class="feed-posts">
                        <?php foreach ($publicaciones as $pub): ?>
                        <div class="post-card" id="post-<?php echo $pub['ID']; ?>">
                            <div class="post-header">
                                <div class="post-user">
                                    <div class="user-avatar"><i class="fas fa-user"></i></div>
                                    <div class="user-info">
                                        <h4><?php echo htmlspecialchars($pub['NOMBRE_COMPLETO'] ?? 'Usuario Anónimo'); ?></h4>
                                        <span><?php echo date('d M Y, H:i', strtotime($pub['FECHA_PUBLICACION'])); ?></span>
                                    </div>
                                </div>
                                <div class="post-category">
                                    <span class="category-badge category-<?php echo $pub['CATEGORIA']; ?>"><?php echo ucfirst($pub['CATEGORIA']); ?></span>
                                </div>
                            </div>
                            <div class="post-content">
                                <h3><?php echo htmlspecialchars($pub['TITULO']); ?></h3>
                                <p><?php echo nl2br(htmlspecialchars($pub['DESCRIPCION'])); ?></p>
                                <?php if ($pub['ARCHIVO_URL']): ?>
                                <div class="post-media">
                                    <?php if ($pub['TIPO_ARCHIVO'] == 'imagen'): ?>
                                        <img src="<?php echo htmlspecialchars($pub['ARCHIVO_URL']); ?>" alt="Imagen de la publicación" onclick="openMediaModal(this.src)">
                                    <?php elseif ($pub['TIPO_ARCHIVO'] == 'video'): ?>
                                        <video controls>
                                            <source src="<?php echo htmlspecialchars($pub['ARCHIVO_URL']); ?>" type="video/mp4">
                                            Tu navegador no soporta el elemento de video.
                                        </video>
                                    <?php elseif ($pub['TIPO_ARCHIVO'] == 'audio'): ?>
                                        <audio controls>
                                            <source src="<?php echo htmlspecialchars($pub['ARCHIVO_URL']); ?>" type="audio/mpeg">
                                            Tu navegador no soporta el elemento de audio.
                                        </audio>
                                    <?php endif; ?>
                                </div>
                                <?php endif; ?>
                            </div>
                            <div class="post-actions">
                                <button class="btn-action btn-comentar" onclick="toggleComments(<?php echo $pub['ID']; ?>)">
                                    <i class="fas fa-comment"></i> Comentarios
                                </button>
                                <button class="btn-action btn-like" onclick="likePost(<?php echo $pub['ID']; ?>)">
                                    <i class="fas fa-heart"></i> Me gusta
                                </button>
                            </div>

                            <!-- Comentarios -->
                            <div class="comments-section" id="comments-<?php echo $pub['ID']; ?>" style="display: none;">
                                <?php
                                $stmt = $pdo->prepare("SELECT fc.*, u.nombre_completo FROM foro_comentarios fc LEFT JOIN usuarios u ON fc.usuario_id = u.id WHERE fc.publicacion_id = ? AND fc.activo = 1 ORDER BY fc.fecha_comentario ASC");
                                $stmt->execute([$pub['ID']]);
                                $comentarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
                                ?>

                                <?php foreach ($comentarios as $comentario): ?>
                                <div class="comment">
                                    <div class="comment-user">
                                        <div class="user-avatar"><i class="fas fa-user"></i></div>
                                        <div class="comment-content">
                                            <h5><?php echo htmlspecialchars($comentario['NOMBRE_COMPLETO'] ?? 'Usuario Anónimo'); ?></h5>
                                            <p><?php echo nl2br(htmlspecialchars($comentario['COMENTARIO'])); ?></p>
                                            <span class="comment-date"><?php echo date('d M Y, H:i', strtotime($comentario['FECHA_COMENTARIO'])); ?></span>
                                        </div>
                                    </div>
                                </div>
                                <?php endforeach; ?>

                                <?php if (isset($_SESSION['usuario_id'])): ?>
                                <div class="comment-form">
                                    <form method="POST" action="">
                                        <input type="hidden" name="publicacion_id" value="<?php echo $pub['ID']; ?>">
                                        <input type="hidden" name="crear_comentario" value="1">
                                        <div class="comment-input">
                                            <textarea name="comentario" placeholder="Escribe un comentario..." required></textarea>
                                            <button type="submit" class="btn-comment">Comentar</button>
                                        </div>
                                    </form>
                                </div>
                                <?php endif; ?>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </main>
            </div>
        </div>
    </section>

    <!-- Modal para Crear Publicación -->
    <div id="postModal" class="modal">
        <div class="modal-content post-modal">
            <span class="close" onclick="closePostModal()">&times;</span>
            <h3>Crear Publicación</h3>
            <form method="POST" action="" enctype="multipart/form-data">
                <input type="hidden" name="crear_publicacion" value="1">
                <div class="form-row">
                    <div class="form-group">
                        <label for="titulo">Título</label>
                        <input type="text" id="titulo" name="titulo" required>
                    </div>
                    <div class="form-group">
                        <label for="categoria">Categoría</label>
                        <select id="categoria" name="categoria" required>
                            <option value="">Seleccionar...</option>
                            <option value="danza">Danza</option>
                            <option value="musica">Música</option>
                            <option value="artesPlasticas">Artes Plásticas</option>
                            <option value="poesia">Poesía</option>
                            <option value="teatro">Teatro</option>
                            <option value="cine">Cine</option>
                            <option value="fotografia">Fotografía</option>
                            <option value="artesanias">Artesanías</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="descripcion">¿Qué quieres compartir?</label>
                    <textarea id="descripcion" name="descripcion" rows="4" placeholder="Describe tu arte, comparte tus pensamientos..." required></textarea>
                </div>
                <div class="form-group">
                    <label for="archivo">Agregar foto, video o audio</label>
                    <input type="file" id="archivo" name="archivo" accept="image/*,video/*,audio/*">
                    <div id="filePreview"></div>
                </div>
                <button type="submit" class="btn-submit">Publicar</button>
            </form>
        </div>
    </div>

    <!-- Modal para Multimedia -->
    <div id="mediaModal" class="modal">
        <div class="modal-content media-modal">
            <span class="close" onclick="closeMediaModal()">&times;</span>
            <img id="mediaContent" src="" alt="Multimedia">
        </div>
    </div>

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

    <script src="assets/js/foro.js"></script>
</body>
</html>
