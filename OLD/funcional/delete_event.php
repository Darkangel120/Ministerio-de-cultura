<?php
session_start();
require_once 'config.php';

// Verificar sesión
verificarSesion();

// Verificar permisos - Solo funcionarios pueden eliminar eventos
if ($_SESSION['usuario_tipo'] !== 'funcionario') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'No tienes permisos para eliminar eventos']);
    exit();
}

// Verificar que sea una petición POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit();
}

// Obtener el ID del evento
$event_id = isset($_POST['event_id']) ? (int)$_POST['event_id'] : 0;

if ($event_id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID de evento inválido']);
    exit();
}

try {
    $pdo = conectarDB();

    // Verificar que el evento existe y pertenece al usuario actual
    $usuario_actual = obtenerUsuarioActual();
    $stmt = $pdo->prepare("SELECT id FROM eventos WHERE id = ? AND correo_usuario = ? AND activo = 1");
    $stmt->execute([$event_id, $usuario_actual['EMAIL']]);
    $evento = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$evento) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Evento no encontrado o no tienes permisos para eliminarlo']);
        exit();
    }

    // Eliminar el evento (marcar como inactivo)
    $stmt = $pdo->prepare("UPDATE eventos SET activo = 0 WHERE id = ?");
    $stmt->execute([$event_id]);

    echo json_encode(['success' => true, 'message' => 'Evento eliminado exitosamente']);

} catch (Exception $e) {
    error_log("Error al eliminar evento: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
}
?>
