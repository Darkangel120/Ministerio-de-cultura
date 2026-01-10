<?php
session_start();
require_once 'config.php';

// Obtener publicaciones del foro
$pdo = conectarDB();

// Consulta para usuarios logueados (con verificación de like)
if (isset($_SESSION['usuario_id'])) {
    $sql = "SELECT FIRST 10 
                fp.*, 
                u.nombre_completo, 
                CASE 
                    WHEN fl.ID IS NOT NULL THEN 1 
                    ELSE 0 
                END as LIKED,
                (SELECT COUNT(*) FROM foro_likes WHERE publicacion_id = fp.ID) as LIKES_COUNT,
                (SELECT COUNT(*) FROM foro_comentarios WHERE publicacion_id = fp.ID AND activo = 1) as COMMENTS_COUNT 
            FROM foro_publicaciones fp 
            LEFT JOIN usuarios u ON fp.usuario_id = u.id 
            LEFT JOIN foro_likes fl ON fl.publicacion_id = fp.ID AND fl.usuario_id = ? 
            WHERE fp.activo = 1 
            ORDER BY fp.fecha_publicacion DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$_SESSION['usuario_id']]);
} else {
    // Consulta para usuarios no logueados
    $sql = "SELECT FIRST 10 
                fp.*, 
                u.nombre_completo,
                (SELECT COUNT(*) FROM foro_likes WHERE publicacion_id = fp.ID) as LIKES_COUNT,
                (SELECT COUNT(*) FROM foro_comentarios WHERE publicacion_id = fp.ID AND activo = 1) as COMMENTS_COUNT 
            FROM foro_publicaciones fp 
            LEFT JOIN usuarios u ON fp.usuario_id = u.id 
            WHERE fp.activo = 1 
            ORDER BY fp.fecha_publicacion DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
}
$publicaciones = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Obtener eventos próximos para el sidebar
$stmt = $pdo->prepare("SELECT FIRST 3 * FROM eventos WHERE activo = 1 ORDER BY fecha DESC");
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
        $stmt = $pdo->prepare("INSERT INTO foro_comentarios (publicacion_id, usuario_id, comentario, activo) VALUES (?, ?, ?, 1)");
        $stmt->execute([$publicacion_id, $usuario_id, $comentario]);
        header('Location: foro.php#post-' . $publicacion_id);
        exit();
    } catch (Exception $e) {
        $error = "Error al crear el comentario: " . $e->getMessage();
    }
}

// Procesar acciones AJAX
if (isset($_GET['action'])) {
    header('Content-Type: application/json');

    if ($_GET['action'] === 'toggle_like' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        if (!isset($_SESSION['usuario_id'])) {
            echo json_encode(['success' => false, 'message' => 'Debes iniciar sesión']);
            exit();
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $publicacion_id = (int)($data['publicacion_id'] ?? 0);
        $usuario_id = $_SESSION['usuario_id'];

        if ($publicacion_id <= 0) {
            echo json_encode(['success' => false, 'message' => 'ID de publicación inválido']);
            exit();
        }

        try {
            // Verificar si ya existe un like
            $stmt = $pdo->prepare("SELECT id FROM foro_likes WHERE publicacion_id = ? AND usuario_id = ?");
            $stmt->execute([$publicacion_id, $usuario_id]);
            $existing_like = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($existing_like) {
                // Remover like
                $stmt = $pdo->prepare("DELETE FROM foro_likes WHERE id = ?");
                $stmt->execute([$existing_like['ID']]);
                $liked = false;
            } else {
                // Agregar like
                $stmt = $pdo->prepare("INSERT INTO foro_likes (publicacion_id, usuario_id) VALUES (?, ?)");
                $stmt->execute([$publicacion_id, $usuario_id]);
                $liked = true;
            }

            // Obtener los nuevos conteos - CORREGIDO para Firebird
            $stmt = $pdo->prepare("
                SELECT 
                    (SELECT COUNT(*) FROM foro_likes WHERE publicacion_id = ?) as likes_count,
                    (SELECT COUNT(*) FROM foro_comentarios WHERE publicacion_id = ? AND activo = 1) as comments_count
                FROM RDB\$DATABASE
            ");
            $stmt->execute([$publicacion_id, $publicacion_id]);
            $counts = $stmt->fetch(PDO::FETCH_ASSOC);

            echo json_encode([
                'success' => true,
                'liked' => $liked,
                'likes_count' => (int)($counts['LIKES_COUNT'] ?? 0),
                'comments_count' => (int)($counts['COMMENTS_COUNT'] ?? 0)
            ]);
        } catch (Exception $e) {
            error_log("Error en toggle_like: " . $e->getMessage());
            echo json_encode(['success' => false, 'message' => 'Error al procesar el like: ' . $e->getMessage()]);
        }
        exit();
    }

    if ($_GET['action'] === 'get_comentarios' && isset($_GET['publicacion_id'])) {
        $publicacion_id = (int)$_GET['publicacion_id'];

        try {
            $stmt = $pdo->prepare("SELECT fc.*, u.nombre_completo FROM foro_comentarios fc LEFT JOIN usuarios u ON fc.usuario_id = u.id WHERE fc.publicacion_id = ? AND fc.activo = 1 ORDER BY fc.fecha_comentario ASC");
            $stmt->execute([$publicacion_id]);
            $comentarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Formatear los datos para JavaScript
            $comentarios_formateados = array_map(function($comentario) {
                return [
                    'id' => $comentario['ID'],
                    'publicacion_id' => $comentario['PUBLICACION_ID'],
                    'usuario_id' => $comentario['USUARIO_ID'],
                    'comentario' => $comentario['COMENTARIO'],
                    'fecha_comentario' => $comentario['FECHA_COMENTARIO'],
                    'activo' => $comentario['ACTIVO'],
                    'nombre_completo' => $comentario['NOMBRE_COMPLETO'] ?? 'Usuario Anónimo'
                ];
            }, $comentarios);

            echo json_encode(['success' => true, 'comentarios' => $comentarios_formateados]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Error al cargar comentarios']);
        }
        exit();
    }

    if ($_GET['action'] === 'add_comentario' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        if (!isset($_SESSION['usuario_id'])) {
            echo json_encode(['success' => false, 'message' => 'Debes iniciar sesión']);
            exit();
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $publicacion_id = (int)($data['publicacion_id'] ?? 0);
        $comentario = sanitizar($data['comentario'] ?? '');
        $usuario_id = $_SESSION['usuario_id'];

        if ($publicacion_id <= 0 || empty($comentario)) {
            echo json_encode(['success' => false, 'message' => 'Datos inválidos']);
            exit();
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO foro_comentarios (publicacion_id, usuario_id, comentario, activo) VALUES (?, ?, ?, 1)");
            $stmt->execute([$publicacion_id, $usuario_id, $comentario]);
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Error al agregar comentario']);
        }
        exit();
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
                        <div class="eventos-grid" id="eventosInvitaciones">
                            <?php foreach ($eventos as $evento): ?>
                            <div class="evento-card">
                                <div class="evento-fecha">
                                    <span><?php echo date('d M', strtotime($evento['FECHA'])); ?></span>
                                </div>
                                <h4><?php echo htmlspecialchars($evento['NOMBRE_ACTIVIDAD']); ?></h4>
                                <p><?php echo htmlspecialchars($evento['DIRECCION']); ?></p>
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
                                <button class="btn-action btn-comentar" data-publicacion-id="<?php echo $pub['ID']; ?>">
                                    <i class="fas fa-comment"></i> Comentarios (<?php echo $pub['COMMENTS_COUNT'] ?? 0; ?>)
                                </button>
                                <button class="btn-action btn-like <?php echo (isset($pub['LIKED']) && $pub['LIKED'] == 1) ? 'liked' : ''; ?>" id="like-btn-<?php echo $pub['ID']; ?>" data-publicacion-id="<?php echo $pub['ID']; ?>">
                                    <i class="<?php echo (isset($pub['LIKED']) && $pub['LIKED'] == 1) ? 'fas' : 'far'; ?> fa-heart"></i> Me gusta (<?php echo $pub['LIKES_COUNT'] ?? 0; ?>)
                                </button>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </main>
            </div>
        </div>
    </section>

    <!-- Botón flotante para eventos en móvil -->
    <button class="eventos-float-btn" onclick="openEventosModal()">
        <i class="fas fa-theater-masks"></i>
    </button>

    <!-- Modal para Crear Publicación -->
    <div id="postModal" class="modal">
        <div class="modal-content post-modal">
            <span class="close" onclick="closePostModal()">&times;</span>
            <h3>Crear Publicación</h3>
            <form id="arteForm" method="POST" action="" enctype="multipart/form-data">
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

    <!-- Modal para Comentarios -->
    <div id="commentsModal" class="modal">
        <div class="modal-content comments-modal">
            <span class="close" onclick="closeCommentsModal()">&times;</span>
            <h3>Comentarios</h3>
            <div id="commentsContent">
                <!-- Los comentarios se cargarán aquí dinámicamente -->
            </div>
            <?php if (isset($_SESSION['usuario_id'])): ?>
            <div class="comment-form">
                <form id="commentForm" method="POST" action="">
                    <input type="hidden" name="publicacion_id" id="commentPublicacionId" value="">
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

    <!-- Modal para Eventos -->
    <div id="eventosModal" class="modal">
        <div class="modal-content eventos-modal">
            <span class="close" onclick="closeEventosModal()">&times;</span>
            <h3><i class="fas fa-theater-masks"></i> Eventos Próximos</h3>
            <p class="sidebar-subtitle">¡Únete a la Comunidad Cultural!</p>
            <div class="eventos-invitaciones">
                <div class="eventos-grid">
                    <?php foreach ($eventos as $evento): ?>
                    <div class="evento-card">
                        <div class="evento-titulo">
                            <i class="fas fa-calendar-day"></i>
                            <?php echo htmlspecialchars($evento['NOMBRE_ACTIVIDAD']); ?>
                        </div>
                        <div class="evento-fecha">
                            <i class="fas fa-clock"></i>
                            <span><?php echo date('d M Y', strtotime($evento['FECHA'])); ?></span>
                        </div>
                        <div class="evento-lugar">
                            <i class="fas fa-map-marker-alt"></i>
                            <?php echo htmlspecialchars($evento['DIRECCION']); ?>
                        </div>
                        <div class="evento-descripcion">
                            <?php echo htmlspecialchars($evento['DESCRIPCION'] ?? 'Evento cultural'); ?>
                        </div>
                        <div class="evento-participantes">
                            Participantes: <?php echo htmlspecialchars($evento['PARTICIPANTES'] ?? 'Abierto al público'); ?>
                        </div>
                        <div class="evento-tipo">Evento Cultural</div>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>
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
    <script src="assets/js/script.js"></script>
</body>
</html>
