<?php
session_start();
require_once 'config.php';

// Verificar sesión
if (!isset($_SESSION['usuario_id'])) {
    header('Location: login.php');
    exit();
}

// Obtener datos del usuario actual o del usuario solicitado
$usuario_id = isset($_GET['id']) ? (int)$_GET['id'] : $_SESSION['usuario_id'];
$es_mi_perfil = ($usuario_id == $_SESSION['usuario_id']);

$pdo = conectarDB();

// Obtener datos del usuario
$stmt = $pdo->prepare("SELECT * FROM usuarios WHERE id = ? AND activo = 1");
$stmt->execute([$usuario_id]);
$usuario = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$usuario) {
    header('Location: foro.php');
    exit();
}

// Obtener datos adicionales si es cultor
$cultor = null;
if ($usuario['TIPO_USUARIO'] == 'cultor') {
    $stmt = $pdo->prepare("SELECT * FROM cultores WHERE correo = ? AND activo = 1");
    $stmt->execute([$usuario['EMAIL']]);
    $cultor = $stmt->fetch(PDO::FETCH_ASSOC);
}

// Obtener publicaciones del usuario (con verificación de like si está logueado)
if (isset($_SESSION['usuario_id'])) {
    $sql = "SELECT fp.*,
                   CASE
                       WHEN fl.ID IS NOT NULL THEN 1
                       ELSE 0
                   END as LIKED,
                   (SELECT COUNT(*) FROM foro_likes WHERE publicacion_id = fp.ID) as LIKES_COUNT,
                   (SELECT COUNT(*) FROM foro_comentarios WHERE publicacion_id = fp.ID AND activo = 1) as COMMENTS_COUNT
            FROM foro_publicaciones fp
            LEFT JOIN foro_likes fl ON fl.publicacion_id = fp.ID AND fl.usuario_id = ?
            WHERE fp.usuario_id = ? AND fp.activo = 1
            ORDER BY fp.fecha_publicacion DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$_SESSION['usuario_id'], $usuario_id]);
} else {
    $sql = "SELECT fp.*,
                   (SELECT COUNT(*) FROM foro_likes WHERE publicacion_id = fp.ID) as LIKES_COUNT,
                   (SELECT COUNT(*) FROM foro_comentarios WHERE publicacion_id = fp.ID AND activo = 1) as COMMENTS_COUNT
            FROM foro_publicaciones fp
            WHERE fp.usuario_id = ? AND fp.activo = 1
            ORDER BY fp.fecha_publicacion DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$usuario_id]);
}
$publicaciones = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Obtener estadísticas
$stmt = $pdo->prepare("SELECT COUNT(*) as total FROM foro_publicaciones WHERE usuario_id = ? AND activo = 1");
$stmt->execute([$usuario_id]);
$total_publicaciones = $stmt->fetch()['TOTAL'];

$stmt = $pdo->prepare("SELECT COUNT(*) as total FROM foro_comentarios WHERE usuario_id = ? AND activo = 1");
$stmt->execute([$usuario_id]);
$total_comentarios = $stmt->fetch()['TOTAL'];

$stmt = $pdo->prepare("SELECT COUNT(*) as total FROM foro_likes WHERE publicacion_id IN (SELECT id FROM foro_publicaciones WHERE usuario_id = ?) AND usuario_id != ?");
$stmt->execute([$usuario_id, $usuario_id]);
$total_likes_recibidos = $stmt->fetch()['TOTAL'];

// Procesar actualización de perfil
if (isset($_GET['action']) && $_GET['action'] === 'update_profile' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');

    if (!$es_mi_perfil) {
        echo json_encode(['success' => false, 'message' => 'No tienes permisos para editar este perfil']);
        exit();
    }

    $nombre_completo = sanitizar($_POST['nombre_completo'] ?? '');
    $telefono = sanitizar($_POST['telefono'] ?? '');

    if (empty($nombre_completo)) {
        echo json_encode(['success' => false, 'message' => 'El nombre completo es obligatorio']);
        exit();
    }

    try {
        $stmt = $pdo->prepare("UPDATE usuarios SET nombre_completo = ?, telefono = ? WHERE id = ?");
        $stmt->execute([$nombre_completo, $telefono, $usuario_id]);

        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error al actualizar el perfil: ' . $e->getMessage()]);
    }
    exit();
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Perfil de <?php echo htmlspecialchars($usuario['NOMBRE_COMPLETO']); ?> - Ministerio del Poder Popular para la Cultura</title>
    <link rel="icon" href="assets/favicon.jpg">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/foro.css">
    <link rel="stylesheet" href="assets/css/style.css">
    <style>
        .perfil-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem 0;
            margin-bottom: 2rem;
        }
        .perfil-info {
            display: flex;
            align-items: center;
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }
        .perfil-avatar {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background: rgba(255,255,255,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
            margin-right: 2rem;
        }
        .perfil-details h1 {
            margin: 0 0 0.5rem 0;
            font-size: 2rem;
        }
        .perfil-stats {
            display: flex;
            gap: 2rem;
            margin-top: 1rem;
        }
        .stat-item {
            text-align: center;
        }
        .stat-number {
            font-size: 1.5rem;
            font-weight: bold;
        }
        .stat-label {
            font-size: 0.9rem;
            opacity: 0.9;
        }
        .perfil-tabs {
            display: flex;
            border-bottom: 1px solid #e0e0e0;
            margin-bottom: 2rem;
        }
        .tab-btn {
            padding: 1rem 2rem;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1rem;
            border-bottom: 3px solid transparent;
            transition: all 0.3s;
        }
        .tab-btn.active {
            border-bottom-color: #667eea;
            color: #667eea;
            font-weight: bold;
        }
        .tab-content {
            display: none;
        }
        .tab-content.active {
            display: block;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
        }
        .info-card {
            background: white;
            border-radius: 8px;
            padding: 1.5rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .info-card h3 {
            margin-top: 0;
            color: #333;
            border-bottom: 2px solid #667eea;
            padding-bottom: 0.5rem;
        }
        .info-item {
            margin-bottom: 1rem;
        }
        .info-label {
            font-weight: bold;
            color: #666;
        }
        .info-value {
            color: #333;
        }
        .publicaciones-grid {
            display: grid;
            gap: 1.5rem;
        }
        .publicacion-card {
            background: white;
            border-radius: 8px;
            padding: 1.5rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .publicacion-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }
        .publicacion-titulo {
            font-size: 1.2rem;
            font-weight: bold;
            color: #333;
        }
        .publicacion-fecha {
            color: #666;
            font-size: 0.9rem;
        }
        .publicacion-categoria {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            background: #667eea;
            color: white;
            border-radius: 20px;
            font-size: 0.8rem;
            margin-bottom: 1rem;
        }
        .publicacion-stats {
            display: flex;
            gap: 1rem;
            margin-top: 1rem;
            color: #666;
            font-size: 0.9rem;
        }
    </style>
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
                    <li><a href="index.php" onclick="closeMenu()">Inicio</a></li>
                    <li><a href="index.php#noticias" onclick="closeMenu()">Noticias</a></li>
                    <li><a href="index.php#agenda" onclick="closeMenu()">Agenda</a></li>
                    <li><a href="index.php#ministerio" onclick="closeMenu()">El Ministerio</a></li>
                    <li><a href="foro.php" onclick="closeMenu()">Foro</a></li>
                    <?php
                    $usuario_actual = obtenerUsuarioActual();
                    if ($usuario_actual && $usuario_actual['TIPO_USUARIO'] == 'funcionario'): ?>
                        <li><a href="dashboard.php">Menu Principal</a></li>
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

    <!-- Perfil Header -->
    <section class="perfil-header">
        <div class="perfil-info">
            <div class="perfil-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="perfil-details">
                <h1><?php echo htmlspecialchars($usuario['NOMBRE_COMPLETO']); ?></h1>
                <p><?php echo ucfirst($usuario['TIPO_USUARIO']); ?> registrado el <?php echo date('d/m/Y', strtotime($usuario['FECHA_REGISTRO'])); ?></p>
                <div class="perfil-stats">
                    <div class="stat-item">
                        <div class="stat-number"><?php echo $total_publicaciones; ?></div>
                        <div class="stat-label">Publicaciones</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number"><?php echo $total_likes_recibidos; ?></div>
                        <div class="stat-label">Likes Recibidos</div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Contenido Principal -->
    <section id="perfil-content">
        <div class="container">
            <div class="perfil-tabs">
                <button class="tab-btn active" onclick="showTab('publicaciones')">Publicaciones</button>
                <button class="tab-btn" onclick="showTab('informacion')">Información del Perfil</button>
            </div>

            <!-- Tab Publicaciones -->
            <div id="publicaciones" class="tab-content active">
                <div class="publicaciones-grid">
                    <?php if (empty($publicaciones)): ?>
                        <div class="no-publicaciones">
                            <i class="fas fa-edit"></i>
                            <p>Aún no hay publicaciones.</p>
                        </div>
                    <?php else: ?>
                        <?php foreach ($publicaciones as $pub): ?>
                        <div style = "width: 50%; margin-left: 32%;" class="post-card" id="post-<?php echo $pub['ID']; ?>">
                            <div class="post-header">
                                <div class="post-user">
                                    <div class="user-avatar"><i class="fas fa-user"></i></div>
                                    <div class="user-info">
                                        <h4><a href="perfil.php?id=<?php echo $pub['USUARIO_ID']; ?>" style="color: inherit; text-decoration: none;"><?php echo htmlspecialchars($usuario['NOMBRE_COMPLETO']); ?></a></h4>
                                        <span><?php echo date('d M Y, H:i', strtotime($pub['FECHA_PUBLICACION'])); ?></span>
                                    </div>
                                </div>
                                <div class="post-header-right">
                                    <div class="post-category">
                                        <span class="category-badge category-<?php echo $pub['CATEGORIA']; ?>"><?php echo ucfirst($pub['CATEGORIA']); ?></span>
                                    </div>
                                    <?php if ($es_mi_perfil): ?>
                                    <div class="post-menu">
                                        <button class="btn-menu" onclick="togglePostMenu(<?php echo $pub['ID']; ?>)">
                                            <i class="fas fa-ellipsis-v"></i>
                                        </button>
                                        <div class="post-menu-dropdown" id="menu-<?php echo $pub['ID']; ?>">
                                            <button onclick="editarPublicacion(<?php echo $pub['ID']; ?>)">
                                                <i class="fas fa-edit"></i> Editar
                                            </button>
                                            <button onclick="eliminarPublicacion(<?php echo $pub['ID']; ?>)">
                                                <i class="fas fa-trash"></i> Eliminar
                                            </button>
                                        </div>
                                    </div>
                                    <?php endif; ?>
                                </div>
                            </div>
                            <div class="post-content">
                                <h3><?php echo htmlspecialchars($pub['TITULO']); ?></h3>
                                <p><?php echo nl2br(htmlspecialchars($pub['DESCRIPCION'])); ?></p>
                                <?php if ($pub['ARCHIVO_URL']): ?>
                                <div class="post-media">
                                    <?php
                                    // Corregir la ruta del archivo eliminando 'funcional/' si existe
                                    $archivo_url = str_replace('funcional/', '', $pub['ARCHIVO_URL']);
                                    ?>
                                    <?php if ($pub['TIPO_ARCHIVO'] == 'imagen'): ?>
                                        <img src="<?php echo htmlspecialchars($archivo_url); ?>" alt="Imagen de la publicación" onclick="openMediaModal(this.src)">
                                    <?php elseif ($pub['TIPO_ARCHIVO'] == 'video'): ?>
                                        <video controls>
                                            <source src="<?php echo htmlspecialchars($archivo_url); ?>" type="video/mp4">
                                            Tu navegador no soporta el elemento de video.
                                        </video>
                                    <?php elseif ($pub['TIPO_ARCHIVO'] == 'audio'): ?>
                                        <audio controls>
                                            <source src="<?php echo htmlspecialchars($archivo_url); ?>" type="audio/mpeg">
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
                    <?php endif; ?>
                </div>
            </div>

            <!-- Tab Información -->
            <div id="informacion" class="tab-content">
                <?php if ($es_mi_perfil): ?>
                <div class="edit-profile-header" style="margin-bottom: 2rem; text-align: right;">
                    <button id="editProfileBtn" class="btn-submit" style="background: #667eea; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 5px; cursor: pointer;">
                        <i class="fas fa-edit"></i> Editar Perfil
                    </button>
                </div>
                <?php endif; ?>

                <div class="info-grid">
                    <div class="info-card">
                        <h3><i class="fas fa-user"></i> Información Personal</h3>
                        <div id="infoPersonalDisplay">
                            <div class="info-item">
                                <span class="info-label">Nombre Completo:</span>
                                <span class="info-value"><?php echo htmlspecialchars($usuario['NOMBRE_COMPLETO']); ?></span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Email:</span>
                                <span class="info-value"><?php echo htmlspecialchars($usuario['EMAIL']); ?></span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Teléfono:</span>
                                <span class="info-value"><?php echo htmlspecialchars($usuario['TELEFONO'] ?? 'No especificado'); ?></span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Tipo de Usuario:</span>
                                <span class="info-value"><?php echo ucfirst($usuario['TIPO_USUARIO']); ?></span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Fecha de Registro:</span>
                                <span class="info-value"><?php echo date('d/m/Y', strtotime($usuario['FECHA_REGISTRO'])); ?></span>
                            </div>
                        </div>

                        <?php if ($es_mi_perfil): ?>
                        <div id="infoPersonalEdit" style="display: none;">
                            <form id="editProfileForm">
                                <div class="form-group" style="margin-bottom: 1rem;">
                                    <label for="editNombre">Nombre Completo</label>
                                    <input type="text" id="editNombre" name="nombre_completo" value="<?php echo htmlspecialchars($usuario['NOMBRE_COMPLETO']); ?>" required>
                                </div>
                                <div class="form-group" style="margin-bottom: 1rem;">
                                    <label for="editTelefono">Teléfono</label>
                                    <input type="tel" id="editTelefono" name="telefono" value="<?php echo htmlspecialchars($usuario['TELEFONO'] ?? ''); ?>">
                                </div>
                                <div class="form-actions" style="margin-top: 1rem;">
                                    <button type="submit" class="btn-submit">Guardar Cambios</button>
                                    <button type="button" id="cancelEditBtn" class="btn-submit" style="background: #6c757d; margin-left: 1rem;">Cancelar</button>
                                </div>
                            </form>
                        </div>
                        <?php endif; ?>
                    </div>

                    <?php if ($cultor): ?>
                    <div class="info-card">
                        <h3><i class="fas fa-palette"></i> Información como Cultor</h3>
                        <div class="info-item">
                            <span class="info-label">Cédula:</span>
                            <span class="info-value"><?php echo htmlspecialchars($cultor['CEDULA']); ?></span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Área Temática:</span>
                            <span class="info-value"><?php echo ucfirst($cultor['AREA_TEMATICA']); ?></span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Disciplina:</span>
                            <span class="info-value"><?php echo htmlspecialchars($cultor['DISCIPLINA']); ?></span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Edad:</span>
                            <span class="info-value"><?php echo $cultor['EDAD']; ?> años</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Trayectoria:</span>
                            <span class="info-value"><?php echo $cultor['TRAYECTORIA_ANIOS']; ?> años</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Organización:</span>
                            <span class="info-value"><?php echo htmlspecialchars($cultor['ORGANIZACION']); ?></span>
                        </div>
                    </div>

                    <div class="info-card">
                        <h3><i class="fas fa-map-marker-alt"></i> Ubicación</h3>
                        <div class="info-item">
                            <span class="info-label">Estado:</span>
                            <span class="info-value">Distrito Capital</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Municipio:</span>
                            <span class="info-value"><?php echo htmlspecialchars($cultor['MUNICIPIO']); ?></span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Parroquia:</span>
                            <span class="info-value"><?php echo htmlspecialchars($cultor['PARROQUIA']); ?></span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Comuna:</span>
                            <span class="info-value"><?php echo htmlspecialchars($cultor['COMUNA']); ?></span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Dirección:</span>
                            <span class="info-value"><?php echo htmlspecialchars($cultor['DIRECCION']); ?></span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Lugar de Nacimiento:</span>
                            <span class="info-value"><?php echo htmlspecialchars($cultor['LUGAR_NACIMIENTO']); ?></span>
                        </div>
                    </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </section>

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

    <!-- Modal para Editar Publicación -->
    <div id="editPostModal" class="modal">
        <div class="modal-content post-modal">
            <span class="close" onclick="closeEditPostModal()">&times;</span>
            <h3>Editar Publicación</h3>
            <form id="editArteForm">
                <input type="hidden" id="editPostId" value="">
                <div class="form-row">
                    <div class="form-group">
                        <label for="editTitulo">Título</label>
                        <input type="text" id="editTitulo" required>
                    </div>
                    <div class="form-group">
                        <label for="editCategoria">Categoría</label>
                        <select id="editCategoria" required>
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
                    <label for="editDescripcion">¿Qué quieres compartir?</label>
                    <textarea id="editDescripcion" rows="4" placeholder="Describe tu arte, comparte tus pensamientos..." required></textarea>
                </div>
                <div class="form-group">
                    <label for="editArchivo">Cambiar Imagen (opcional)</label>
                    <input type="file" id="editArchivo" name="archivo" accept="image/*,video/*,audio/*">
                    <div id="editFilePreview"></div>
                </div>
                <button type="submit" class="btn-submit">Actualizar</button>
            </form>
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
            <p>Realizado por Rodolfo Gómez</p>
        </div>
    </footer>

    <script>
        function showTab(tabName) {
            // Ocultar todos los tabs
            const tabs = document.querySelectorAll('.tab-content');
            tabs.forEach(tab => tab.classList.remove('active'));

            // Mostrar el tab seleccionado
            document.getElementById(tabName).classList.add('active');

            // Actualizar botones
            const buttons = document.querySelectorAll('.tab-btn');
            buttons.forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
        }

        function toggleMenu() {
            const nav = document.getElementById('mainNav');
            const overlay = document.getElementById('overlay');
            nav.classList.toggle('active');
            overlay.classList.toggle('active');
        }

        function closeMenu() {
            const nav = document.getElementById('mainNav');
            const overlay = document.getElementById('overlay');
            nav.classList.remove('active');
            overlay.classList.remove('active');
        }

        // Función para editar perfil
        document.getElementById('editProfileBtn').addEventListener('click', function() {
            document.getElementById('infoPersonalDisplay').style.display = 'none';
            document.getElementById('infoPersonalEdit').style.display = 'block';
        });

        document.getElementById('cancelEditBtn').addEventListener('click', function() {
            document.getElementById('infoPersonalDisplay').style.display = 'block';
            document.getElementById('infoPersonalEdit').style.display = 'none';
        });

        document.getElementById('editProfileForm').addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(this);

            try {
                const response = await fetch('perfil.php?action=update_profile', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (result.success) {
                    // Actualizar la información mostrada
                    const infoValues = document.querySelectorAll('#infoPersonalDisplay .info-value');
                    infoValues[0].textContent = formData.get('nombre_completo'); // Nombre Completo
                    infoValues[2].textContent = formData.get('telefono') || 'No especificado'; // Teléfono

                    // Actualizar el nombre en el header
                    document.querySelector('.perfil-details h1').textContent = formData.get('nombre_completo');

                    // Ocultar el formulario y mostrar la info
                    document.getElementById('infoPersonalDisplay').style.display = 'block';
                    document.getElementById('infoPersonalEdit').style.display = 'none';

                    alert('Perfil actualizado exitosamente');
                } else {
                    alert('Error: ' + result.message);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error al actualizar el perfil');
            }
        });

        // Función para abrir modal de multimedia
        function openMediaModal(src) {
            const modal = document.getElementById('mediaModal');
            const img = document.getElementById('mediaContent');
            img.src = src;
            modal.style.display = 'block';
        }

        // Función para cerrar modal de multimedia
        function closeMediaModal() {
            const modal = document.getElementById('mediaModal');
            modal.style.display = 'none';
        }

        // Función para toggle del menú de publicación
        function togglePostMenu(postId) {
            const menu = document.getElementById(`menu-${postId}`);
            const allMenus = document.querySelectorAll('.post-menu-dropdown');

            // Cerrar todos los menús primero
            allMenus.forEach(m => {
                if (m.id !== `menu-${postId}`) {
                    m.classList.remove('show');
                }
            });

            // Toggle el menú actual
            menu.classList.toggle('show');
        }

        // Función para editar publicación
        async function editarPublicacion(postId) {
            try {
                const response = await fetch(`foro.php?action=get_publicacion&id=${postId}`);
                const data = await response.json();

                if (data.success) {
                    // Llenar el modal con los datos de la publicación
                    document.getElementById('editPostId').value = data.publicacion.ID;
                    document.getElementById('editTitulo').value = data.publicacion.TITULO;
                    document.getElementById('editCategoria').value = data.publicacion.CATEGORIA;
                    document.getElementById('editDescripcion').value = data.publicacion.DESCRIPCION;

                    // Abrir el modal
                    document.getElementById('editPostModal').style.display = 'block';

                    // Cerrar el menú
                    document.getElementById(`menu-${postId}`).classList.remove('show');
                } else {
                    alert('Error: ' + data.message);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error al cargar la publicación');
            }
        }

        // Función para eliminar publicación
        async function eliminarPublicacion(postId) {
            if (confirm('¿Estás seguro de que deseas eliminar esta publicación? Esta acción no se puede deshacer.')) {
                try {
                    const response = await fetch('foro.php?action=delete_publicacion', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ publicacion_id: postId })
                    });

                    const data = await response.json();

                    if (data.success) {
                        // Remover la publicación del DOM
                        const postElement = document.getElementById(`post-${postId}`);
                        if (postElement) {
                            postElement.remove();
                        }
                        alert('Publicación eliminada exitosamente');
                    } else {
                        alert('Error: ' + data.message);
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('Error al eliminar la publicación');
                }
            }
        }

        // Función para cerrar modal de edición
        function closeEditPostModal() {
            document.getElementById('editPostModal').style.display = 'none';
            document.getElementById('editArteForm').reset();
        }

        // Cerrar menús cuando se hace click fuera
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.post-menu')) {
                const allMenus = document.querySelectorAll('.post-menu-dropdown');
                allMenus.forEach(menu => menu.classList.remove('show'));
            }
        });
    </script>
</body>
</html>
