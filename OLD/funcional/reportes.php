<?php
session_start();
require_once 'config.php';

// Verificar sesión
if (!isset($_SESSION['usuario_id'])) {
    header('Location: login.php');
    exit();
}

// Verificar permisos - Funcionarios, Admin y Directores pueden acceder
$roles_permitidos = ['funcionario', 'admin', 'director_general', 'director_operativo'];
if (!in_array($_SESSION['usuario_tipo'], $roles_permitidos)) {
    header('Location: dashboard.php');
    exit();
}

// Obtener datos del usuario
$usuario = obtenerUsuarioActual();
$roles_crear_usuario = ['admin', 'director_general', 'director_operativo'];
$puede_crear_usuario = $usuario && in_array(strtolower($usuario['TIPO_USUARIO']), $roles_crear_usuario);

// Conectar a la base de datos
$pdo = conectarDB();

// Obtener estadísticas generales
$stmt = $pdo->prepare("SELECT COUNT(*) as total FROM eventos WHERE activo = 1");
$stmt->execute();
$total_eventos = $stmt->fetch()['TOTAL'];

$stmt = $pdo->prepare("SELECT COUNT(*) as total FROM cultores WHERE activo = 1");
$stmt->execute();
$total_cultores = $stmt->fetch()['TOTAL'];

// Obtener eventos por mes actual
$currentMonth = date('m');
$currentYear = date('Y');
$stmt = $pdo->prepare("SELECT COUNT(*) as total FROM eventos WHERE activo = 1 AND mes = ? AND EXTRACT(YEAR FROM fecha) = ?");
$stmt->execute([$currentMonth, $currentYear]);
$eventos_mes_actual = $stmt->fetch()['TOTAL'];

// Procesar filtros para reportes detallados
$filtros = [];
$query_params = [];
$tipo_reporte_select = isset($_POST['tipo_reporte_select']) ? $_POST['tipo_reporte_select'] : '';
$tipo_vista = isset($_POST['tipo_vista']) ? $_POST['tipo_vista'] : 'general'; // general o detallado

// Variables para almacenar las fechas seleccionadas
$fecha_desde = isset($_POST['filtro_fecha_desde']) ? $_POST['filtro_fecha_desde'] : '';
$fecha_hasta = isset($_POST['filtro_fecha_hasta']) ? $_POST['filtro_fecha_hasta'] : '';

if (isset($_POST['generar_reporte'])) {
    if ($tipo_reporte_select == 'eventos') {
        // Filtros de eventos
        if (!empty($_POST['filtro_responsable'])) {
            $filtros[] = "responsable_nombre LIKE ?";
            $query_params[] = '%' . $_POST['filtro_responsable'] . '%';
        }
        if (!empty($_POST['filtro_municipio'])) {
            $filtros[] = "municipio = ?";
            $query_params[] = $_POST['filtro_municipio'];
        }
        if (!empty($_POST['filtro_evento'])) {
            $filtros[] = "id = ?";
            $query_params[] = $_POST['filtro_evento'];
        }
        if (!empty($_POST['filtro_fecha_desde'])) {
            $filtros[] = "fecha >= ?";
            $query_params[] = $_POST['filtro_fecha_desde'];
        }
        if (!empty($_POST['filtro_fecha_hasta'])) {
            $filtros[] = "fecha <= ?";
            $query_params[] = $_POST['filtro_fecha_hasta'];
        }

        $where_clause = !empty($filtros) ? "WHERE activo = 1 AND " . implode(" AND ", $filtros) : "WHERE activo = 1";
        $query = "SELECT * FROM eventos $where_clause ORDER BY fecha DESC";
        $stmt = $pdo->prepare($query);
        $stmt->execute($query_params);
        $eventos_filtrados = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } elseif ($tipo_reporte_select == 'cultores') {
        // Filtros de cultores
        if (!empty($_POST['filtro_area_tematica'])) {
            $filtros[] = "area_tematica = ?";
            $query_params[] = $_POST['filtro_area_tematica'];
        }
        if (!empty($_POST['filtro_fecha_desde'])) {
            $filtros[] = "fecha_registro >= ?";
            $query_params[] = $_POST['filtro_fecha_desde'];
        }
        if (!empty($_POST['filtro_fecha_hasta'])) {
            $filtros[] = "fecha_registro <= ?";
            $query_params[] = $_POST['filtro_fecha_hasta'];
        }

        $where_clause = !empty($filtros) ? "WHERE activo = 1 AND " . implode(" AND ", $filtros) : "WHERE activo = 1";
        $query = "SELECT * FROM cultores $where_clause ORDER BY fecha_registro DESC";
        $stmt = $pdo->prepare($query);
        $stmt->execute($query_params);
        $cultores_filtrados = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } elseif ($tipo_reporte_select == 'usuarios') {
        // Filtros de usuarios
        if (!empty($_POST['filtro_tipo_usuario'])) {
            $filtros[] = "tipo_usuario = ?";
            $query_params[] = $_POST['filtro_tipo_usuario'];
        }
        if (!empty($_POST['filtro_fecha_desde'])) {
            $filtros[] = "fecha_registro >= ?";
            $query_params[] = $_POST['filtro_fecha_desde'];
        }
        if (!empty($_POST['filtro_fecha_hasta'])) {
            $filtros[] = "fecha_registro <= ?";
            $query_params[] = $_POST['filtro_fecha_hasta'];
        }

        $where_clause = !empty($filtros) ? "WHERE activo = 1 AND " . implode(" AND ", $filtros) : "WHERE activo = 1";
        $query = "SELECT * FROM usuarios $where_clause ORDER BY fecha_registro DESC";
        $stmt = $pdo->prepare($query);
        $stmt->execute($query_params);
        $usuarios_filtrados = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    // Para actividad_ejecutada y actividad_reportada, asumir que son similares a eventos por ahora
    elseif ($tipo_reporte_select == 'actividad_ejecutada' || $tipo_reporte_select == 'actividad_reportada') {
        // Similar a eventos
        if (!empty($_POST['filtro_responsable'])) {
            $filtros[] = "responsable_nombre LIKE ?";
            $query_params[] = '%' . $_POST['filtro_responsable'] . '%';
        }
        if (!empty($_POST['filtro_fecha_desde'])) {
            $filtros[] = "fecha >= ?";
            $query_params[] = $_POST['filtro_fecha_desde'];
        }
        if (!empty($_POST['filtro_fecha_hasta'])) {
            $filtros[] = "fecha <= ?";
            $query_params[] = $_POST['filtro_fecha_hasta'];
        }

        $where_clause = !empty($filtros) ? "WHERE activo = 1 AND " . implode(" AND ", $filtros) : "WHERE activo = 1";
        $query = "SELECT * FROM eventos $where_clause ORDER BY fecha DESC";
        $stmt = $pdo->prepare($query);
        $stmt->execute($query_params);
        $actividades_filtradas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}

// Obtener listas para filtros
$stmt = $pdo->prepare("SELECT DISTINCT responsable_nombre FROM eventos WHERE activo = 1 ORDER BY responsable_nombre");
$stmt->execute();
$responsables = $stmt->fetchAll(PDO::FETCH_COLUMN);

$stmt = $pdo->prepare("SELECT DISTINCT municipio FROM eventos WHERE activo = 1 ORDER BY municipio");
$stmt->execute();
$municipios_eventos = $stmt->fetchAll(PDO::FETCH_COLUMN);

$stmt = $pdo->prepare("SELECT id, nombre_actividad FROM eventos WHERE activo = 1 ORDER BY nombre_actividad");
$stmt->execute();
$eventos_lista = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Estadísticas de cultores por área temática
$stmt = $pdo->prepare("SELECT area_tematica, COUNT(*) as total FROM cultores WHERE activo = 1 GROUP BY area_tematica ORDER BY total DESC");
$stmt->execute();
$cultores_por_area = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Estadísticas de eventos por disciplina
$stmt = $pdo->prepare("SELECT disciplina, COUNT(*) as total FROM eventos WHERE activo = 1 GROUP BY disciplina ORDER BY total DESC");
$stmt->execute();
$eventos_por_disciplina = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reportes - Ministerio del Poder Popular para la Cultura</title>
    <link rel="icon" href="assets/favicon.jpg">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/dashboard.css">
    <link rel="stylesheet" href="assets/css/style.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js"></script>
    <style>
        :root {
            --amarillo: #FFD700;
            --azul: #003893;
            --rojo: #CF142B;
            --blanco: #FFFFFF;
            --gris-claro: #F5F5F5;
            --gris: #666;
            --negro: #1a1a1a;
        }
        
        .reportes-container { 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 20px; 
        }
        
        .reportes-header { 
            text-align: center; 
            margin-bottom: 30px; 
        }
        
        .reportes-header h1 {
            color: var(--azul);
            font-size: 36px;
            margin-bottom: 10px;
            position: relative;
            padding-bottom: 15px;
        }
        
        .reportes-header h1::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 80px;
            height: 3px;
            background: var(--rojo);
        }
        
        .reportes-header p {
            color: var(--gris);
            font-size: 16px;
        }
        
        .estadisticas-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 30px; 
            margin-bottom: 40px; 
        }
        
        .estadistica-card {
            background: var(--blanco);
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 3px 15px rgba(0,0,0,0.1);
            text-align: center;
            transition: transform 0.3s, box-shadow 0.3s;
        }
        
        .estadistica-card:hover { 
            transform: translateY(-5px); 
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }
        
        .estadistica-card h3 { 
            color: var(--azul); 
            margin-bottom: 15px; 
            font-size: 16px; 
            font-weight: 600;
        }
        
        .estadistica-card .numero { 
            font-size: 48px; 
            font-weight: bold; 
            color: var(--rojo); 
            margin: 10px 0; 
        }
        
        .estadistica-card .icono { 
            font-size: 40px; 
            color: var(--azul); 
            margin-bottom: 15px; 
        }
        
        .tipo-reporte-form {
            background: var(--blanco);
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 3px 15px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        
        .tipo-reporte-form h3 { 
            color: var(--azul); 
            margin-bottom: 20px; 
        }
        
        .form-group { 
            margin-bottom: 15px; 
        }
        
        .form-group label { 
            display: block; 
            margin-bottom: 5px; 
            font-weight: 600; 
            color: var(--negro); 
        }
        
        .form-group select, .form-group input { 
            width: 100%; 
            padding: 10px; 
            border: 1px solid #ddd; 
            border-radius: 5px; 
            font-size: 14px;
            transition: border-color 0.3s;
        }
        
        .form-group select:focus, .form-group input:focus {
            outline: none;
            border-color: var(--azul);
        }
        
        .filtros-container { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 15px; 
            margin-top: 20px;
            padding: 20px;
            background: var(--gris-claro);
            border-radius: 10px;
        }
        
        .btn-generar {
            background: var(--rojo);
            color: var(--blanco);
            padding: 12px 30px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            margin-top: 15px;
            transition: transform 0.3s, box-shadow 0.3s;
        }
        
        .btn-generar:hover { 
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(207, 20, 43, 0.4);
        }
        
        .btn-generar i { 
            margin-right: 8px; 
        }
        
        .resultados-section {
            background: var(--blanco);
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 3px 15px rgba(0,0,0,0.1);
            margin-top: 30px;
        }
        
        .resultados-section h3 { 
            color: var(--azul); 
            margin-bottom: 20px; 
        }
        
        .tabla-wrapper {
            overflow-x: auto;
            margin-top: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        
        .resultados-table {
            width: 100%;
            border-collapse: collapse;
            min-width: 800px;
        }
        
        .resultados-table th, .resultados-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
            white-space: nowrap;
        }
        
        .resultados-table th {
            background: var(--azul);
            color: var(--blanco);
            font-weight: 600;
            position: sticky;
            top: 0;
            z-index: 10;
        }
        
        .resultados-table tbody tr:hover { 
            background: var(--gris-claro); 
        }
        
        .resultados-table td.truncate {
            max-width: 200px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .chart-container {
            background: var(--blanco);
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 3px 15px rgba(0,0,0,0.1);
            margin-top: 30px;
        }
        
        .chart-container h3 { 
            color: var(--azul); 
            margin-bottom: 20px; 
        }
        
        .no-data {
            text-align: center;
            padding: 40px;
            color: var(--gris);
            font-style: italic;
        }
        
        .tipo-vista-selector {
            display: flex;
            gap: 15px;
            margin: 20px 0;
            padding: 15px;
            background: var(--gris-claro);
            border-radius: 10px;
        }
        
        .tipo-vista-option {
            flex: 1;
        }
        
        .tipo-vista-option input[type="radio"] {
            display: none;
        }
        
        .tipo-vista-option label {
            display: block;
            padding: 15px;
            background: var(--blanco);
            border: 2px solid #ddd;
            border-radius: 6px;
            cursor: pointer;
            text-align: center;
            transition: all 0.3s;
            font-weight: 600;
        }
        
        .tipo-vista-option input[type="radio"]:checked + label {
            background: var(--azul);
            color: var(--blanco);
            border-color: var(--azul);
        }
        
        .tipo-vista-option label:hover {
            border-color: var(--azul);
        }
        
        .resumen-general {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        
        .resumen-card {
            background: linear-gradient(135deg, var(--amarillo) 0%, var(--azul) 50%, var(--rojo) 100%);
            color: var(--blanco);
            padding: 25px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 3px 15px rgba(0,0,0,0.2);
            transition: transform 0.3s;
        }
        
        .resumen-card:hover {
            transform: translateY(-5px);
        }
        
        .resumen-card h4 {
            margin: 0 0 10px 0;
            font-size: 14px;
            opacity: 0.9;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }
        
        .resumen-card .valor {
            font-size: 36px;
            font-weight: bold;
            margin: 10px 0;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
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
                    <li><a href="foro.php" onclick="closeMenu()">Foro</a></li>
                    <li><a href="dashboard.php" onclick="closeMenu()">Menu Principal</a></li>
                    <li><a href="calendario.php">Calendario</a></li>
                    <li><a href="cultores.php">Cultores</a></li>
                    <?php if ($puede_crear_usuario): ?>
                        <li><a href="crear_usuario.php">Crear Usuario</a></li>
                    <?php endif; ?>
                    <li><a href="logout.php" onclick="closeMenu()">Cerrar Sesión</a></li>
                </ul>
            </nav>
        </div>
    </header>

    <!-- Overlay para menu mobile -->
    <div class="overlay" id="overlay" onclick="closeMenu()"></div>
    
    <div class="reportes-container">
        <div class="reportes-header">
            <h1><i class="fas fa-chart-bar"></i> Reportes y Estadísticas</h1>
            <p>Sistema de Gestión Cultural del Ministerio del Poder Popular para la Cultura</p>
        </div>
        
        <!-- Estadísticas Generales -->
        <div class="estadisticas-grid">
            <div class="estadistica-card">
                <div class="icono"><i class="fas fa-calendar-check"></i></div>
                <h3>Total de Eventos</h3>
                <div class="numero"><?php echo $total_eventos; ?></div>
            </div>
            <div class="estadistica-card">
                <div class="icono"><i class="fas fa-users"></i></div>
                <h3>Total de Cultores</h3>
                <div class="numero"><?php echo $total_cultores; ?></div>
            </div>
            <div class="estadistica-card">
                <div class="icono"><i class="fas fa-calendar-alt"></i></div>
                <h3>Eventos este Mes</h3>
                <div class="numero"><?php echo $eventos_mes_actual; ?></div>
            </div>
        </div>
        
        <!-- Formulario de Tipo de Reporte -->
        <form method="POST" class="tipo-reporte-form">
            <h3><i class="fas fa-filter"></i> Generar Reporte Personalizado</h3>
            
            <div class="form-group">
                <label for="tipo_reporte_select">Seleccione el tipo de reporte:</label>
                <select name="tipo_reporte_select" id="tipo_reporte_select" required>
                    <option value="">-- Seleccione --</option>
                    <option value="eventos" <?php echo ($tipo_reporte_select == 'eventos') ? 'selected' : ''; ?>>Eventos</option>
                    <option value="cultores" <?php echo ($tipo_reporte_select == 'cultores') ? 'selected' : ''; ?>>Cultores</option>
                    <option value="usuarios" <?php echo ($tipo_reporte_select == 'usuarios') ? 'selected' : ''; ?>>Usuarios del Sistema</option>
                    <option value="actividad_ejecutada" <?php echo ($tipo_reporte_select == 'actividad_ejecutada') ? 'selected' : ''; ?>>Actividades Ejecutadas</option>
                    <option value="actividad_reportada" <?php echo ($tipo_reporte_select == 'actividad_reportada') ? 'selected' : ''; ?>>Actividades Reportadas</option>
                </select>
            </div>
            
            <!-- Selector de Tipo de Vista -->
            <div class="tipo-vista-selector">
                <div class="tipo-vista-option">
                    <input type="radio" id="vista_general" name="tipo_vista" value="general" <?php echo ($tipo_vista == 'general' || empty($tipo_vista)) ? 'checked' : ''; ?>>
                    <label for="vista_general">
                        <i class="fas fa-chart-pie"></i><br>
                        Vista General<br>
                        <small>Solo totales y resumen</small>
                    </label>
                </div>
                <div class="tipo-vista-option">
                    <input type="radio" id="vista_detallada" name="tipo_vista" value="detallado" <?php echo ($tipo_vista == 'detallado') ? 'checked' : ''; ?>>
                    <label for="vista_detallada">
                        <i class="fas fa-list"></i><br>
                        Vista Detallada<br>
                        <small>Todos los registros</small>
                    </label>
                </div>
            </div>
            
            <!-- Filtros dinámicos -->
            <div id="filtros-dinamicos" class="filtros-container" style="display: none;">
                <!-- Los filtros se cargarán dinámicamente según el tipo de reporte -->
            </div>
            
            <button type="submit" name="generar_reporte" class="btn-generar">
                <i class="fas fa-chart-line"></i> Generar Reporte
            </button>
        </form>
        
        <!-- Resultados del Reporte -->
        <?php if (isset($_POST['generar_reporte'])): ?>
            <div class="resultados-section">
                <h3>
                    <i class="fas fa-file-alt"></i> 
                    Resultados del Reporte: <?php echo ucfirst(str_replace('_', ' ', $tipo_reporte_select)); ?>
                    (<?php echo ($tipo_vista == 'detallado') ? 'Vista Detallada' : 'Vista General'; ?>)
                </h3>
                
                <?php if ($tipo_vista == 'general'): ?>
                    <!-- VISTA GENERAL - SOLO TOTALES -->
                    <div class="resumen-general">
                        <?php if ($tipo_reporte_select == 'eventos' && isset($eventos_filtrados)): ?>
                            <div class="resumen-card">
                                <h4>Total de Eventos</h4>
                                <div class="valor"><?php echo count($eventos_filtrados); ?></div>
                            </div>
                            <?php
                            // Contar por disciplina
                            $por_disciplina = [];
                            foreach ($eventos_filtrados as $evento) {
                                $disc = $evento['DISCIPLINA'] ?? 'Sin especificar';
                                $por_disciplina[$disc] = ($por_disciplina[$disc] ?? 0) + 1;
                            }
                            foreach ($por_disciplina as $disciplina => $cantidad):
                            ?>
                            <div class="resumen-card">
                                <h4><?php echo htmlspecialchars($disciplina); ?></h4>
                                <div class="valor"><?php echo $cantidad; ?></div>
                            </div>
                            <?php endforeach; ?>
                            
                        <?php elseif ($tipo_reporte_select == 'cultores' && isset($cultores_filtrados)): ?>
                            <div class="resumen-card">
                                <h4>Total de Cultores</h4>
                                <div class="valor"><?php echo count($cultores_filtrados); ?></div>
                            </div>
                            <?php
                            // Contar por área temática
                            $por_area = [];
                            foreach ($cultores_filtrados as $cultor) {
                                $area = $cultor['AREA_TEMATICA'] ?? 'Sin especificar';
                                $por_area[$area] = ($por_area[$area] ?? 0) + 1;
                            }
                            foreach ($por_area as $area => $cantidad):
                            ?>
                            <div class="resumen-card">
                                <h4><?php echo htmlspecialchars($area); ?></h4>
                                <div class="valor"><?php echo $cantidad; ?></div>
                            </div>
                            <?php endforeach; ?>
                            
                        <?php elseif ($tipo_reporte_select == 'usuarios' && isset($usuarios_filtrados)): ?>
                            <div class="resumen-card">
                                <h4>Total de Usuarios</h4>
                                <div class="valor"><?php echo count($usuarios_filtrados); ?></div>
                            </div>
                            <?php
                            // Contar por tipo
                            $por_tipo = [];
                            foreach ($usuarios_filtrados as $usuario) {
                                $tipo = $usuario['TIPO_USUARIO'] ?? 'Sin especificar';
                                $por_tipo[$tipo] = ($por_tipo[$tipo] ?? 0) + 1;
                            }
                            foreach ($por_tipo as $tipo => $cantidad):
                            ?>
                            <div class="resumen-card">
                                <h4><?php echo ucfirst(htmlspecialchars($tipo)); ?></h4>
                                <div class="valor"><?php echo $cantidad; ?></div>
                            </div>
                            <?php endforeach; ?>
                            
                        <?php elseif (($tipo_reporte_select == 'actividad_ejecutada' || $tipo_reporte_select == 'actividad_reportada') && isset($actividades_filtradas)): ?>
                            <div class="resumen-card">
                                <h4>Total de Actividades</h4>
                                <div class="valor"><?php echo count($actividades_filtradas); ?></div>
                            </div>
                        <?php endif; ?>
                    </div>
                    
                <?php else: ?>
                    <!-- VISTA DETALLADA - TODOS LOS DATOS -->
                    <?php if ($tipo_reporte_select == 'eventos' && isset($eventos_filtrados)): ?>
                        <?php if (count($eventos_filtrados) > 0): ?>
                            <div class="tabla-wrapper">
                            <table class="resultados-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Actividad</th>
                                        <th>Tipo</th>
                                        <th>Disciplina</th>
                                        <th>Fecha/Hora</th>
                                        <th>Duración (hrs)</th>
                                        <th>Estado</th>
                                        <th>Municipio</th>
                                        <th>Parroquia</th>
                                        <th>Organización</th>
                                        <th>Comuna</th>
                                        <th>Consejo Comunal</th>
                                        <th>Vocero</th>
                                        <th>Cédula Vocero</th>
                                        <th>Tel. Vocero</th>
                                        <th>Responsable</th>
                                        <th>Cédula Resp.</th>
                                        <th>Tel. Resp.</th>
                                        <th>Cargo Resp.</th>
                                        <th>Objetivo</th>
                                        <th>Niños</th>
                                        <th>Niñas</th>
                                        <th>Jóvenes M</th>
                                        <th>Jóvenes F</th>
                                        <th>Adultos M</th>
                                        <th>Adultos F</th>
                                        <th>Total Asist.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($eventos_filtrados as $evento): 
                                        $total_asistentes = ($evento['NINOS'] ?? 0) + ($evento['NINAS'] ?? 0) + 
                                                          ($evento['JOVENES_MASCULINOS'] ?? 0) + ($evento['JOVENES_FEMENINAS'] ?? 0) + 
                                                          ($evento['ADULTOS_MASCULINOS'] ?? 0) + ($evento['ADULTOS_FEMENINAS'] ?? 0);
                                    ?>
                                    <tr>
                                        <td><?php echo $evento['ID']; ?></td>
                                        <td><?php echo htmlspecialchars($evento['NOMBRE_ACTIVIDAD']); ?></td>
                                        <td><?php echo htmlspecialchars($evento['TIPO_ACTIVIDAD']); ?></td>
                                        <td><?php echo htmlspecialchars($evento['DISCIPLINA']); ?></td>
                                        <td><?php echo date('d/m/Y', strtotime($evento['FECHA'])) . ' ' . substr($evento['HORA'], 0, 5); ?></td>
                                        <td><?php echo $evento['DURACION']; ?></td>
                                        <td><?php echo htmlspecialchars($evento['ESTADO']); ?></td>
                                        <td><?php echo htmlspecialchars($evento['MUNICIPIO']); ?></td>
                                        <td><?php echo htmlspecialchars($evento['PARROQUIA']); ?></td>
                                        <td><?php echo htmlspecialchars($evento['ORGANIZACION']); ?></td>
                                        <td><?php echo htmlspecialchars($evento['NOMBRE_COMUNA']); ?></td>
                                        <td><?php echo htmlspecialchars($evento['CONSEJO_COMUNAL']); ?></td>
                                        <td><?php echo htmlspecialchars($evento['VOCERO_NOMBRE']); ?></td>
                                        <td><?php echo htmlspecialchars($evento['VOCERO_CEDULA']); ?></td>
                                        <td><?php echo htmlspecialchars($evento['VOCERO_TELEFONO']); ?></td>
                                        <td><?php echo htmlspecialchars($evento['RESPONSABLE_NOMBRE']); ?></td>
                                        <td><?php echo htmlspecialchars($evento['RESPONSABLE_CEDULA']); ?></td>
                                        <td><?php echo htmlspecialchars($evento['RESPONSABLE_TELEFONO']); ?></td>
                                        <td><?php echo htmlspecialchars($evento['RESPONSABLE_CARGO']); ?></td>
                                        <td class="truncate" title="<?php echo htmlspecialchars($evento['OBJETIVO']); ?>"><?php echo htmlspecialchars(substr($evento['OBJETIVO'], 0, 50)) . '...'; ?></td>
                                        <td><?php echo $evento['NINOS'] ?? 0; ?></td>
                                        <td><?php echo $evento['NINAS'] ?? 0; ?></td>
                                        <td><?php echo $evento['JOVENES_MASCULINOS'] ?? 0; ?></td>
                                        <td><?php echo $evento['JOVENES_FEMENINAS'] ?? 0; ?></td>
                                        <td><?php echo $evento['ADULTOS_MASCULINOS'] ?? 0; ?></td>
                                        <td><?php echo $evento['ADULTOS_FEMENINAS'] ?? 0; ?></td>
                                        <td><strong><?php echo $total_asistentes; ?></strong></td>
                                    </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                            </div>
                        <?php else: ?>
                            <div class="no-data">No se encontraron eventos con los filtros seleccionados.</div>
                        <?php endif; ?>
                        
                    <?php elseif ($tipo_reporte_select == 'cultores' && isset($cultores_filtrados)): ?>
                        <?php if (count($cultores_filtrados) > 0): ?>
                            <div class="tabla-wrapper">
                            <table class="resultados-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombres y Apellidos</th>
                                        <th>Cédula</th>
                                        <th>Teléfono</th>
                                        <th>Correo</th>
                                        <th>Área Temática</th>
                                        <th>Disciplina</th>
                                        <th>Fecha Nacimiento</th>
                                        <th>Edad</th>
                                        <th>Lugar Nacimiento</th>
                                        <th>Comuna</th>
                                        <th>Municipio</th>
                                        <th>Parroquia</th>
                                        <th>Dirección</th>
                                        <th>Carnet Patria</th>
                                        <th>Trayectoria (años)</th>
                                        <th>Organización</th>
                                        <th>Fecha Registro</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($cultores_filtrados as $cultor): ?>
                                    <tr>
                                        <td><?php echo $cultor['ID']; ?></td>
                                        <td><?php echo htmlspecialchars($cultor['NOMBRES_APELLIDOS']); ?></td>
                                        <td><?php echo htmlspecialchars($cultor['CEDULA']); ?></td>
                                        <td><?php echo htmlspecialchars($cultor['TELEFONO']); ?></td>
                                        <td><?php echo htmlspecialchars($cultor['CORREO']); ?></td>
                                        <td><?php echo htmlspecialchars($cultor['AREA_TEMATICA']); ?></td>
                                        <td><?php echo htmlspecialchars($cultor['DISCIPLINA']); ?></td>
                                        <td><?php echo date('d/m/Y', strtotime($cultor['FECHA_NACIMIENTO'])); ?></td>
                                        <td><?php echo $cultor['EDAD']; ?></td>
                                        <td><?php echo htmlspecialchars($cultor['LUGAR_NACIMIENTO']); ?></td>
                                        <td><?php echo htmlspecialchars($cultor['COMUNA']); ?></td>
                                        <td><?php echo htmlspecialchars($cultor['MUNICIPIO']); ?></td>
                                        <td><?php echo htmlspecialchars($cultor['PARROQUIA']); ?></td>
                                        <td class="truncate" title="<?php echo htmlspecialchars($cultor['DIRECCION']); ?>"><?php echo htmlspecialchars($cultor['DIRECCION']); ?></td>
                                        <td><?php echo htmlspecialchars($cultor['CARNET_PATRIA']); ?></td>
                                        <td><?php echo $cultor['TRAYECTORIA_ANIOS']; ?></td>
                                        <td><?php echo htmlspecialchars($cultor['ORGANIZACION']); ?></td>
                                        <td><?php echo date('d/m/Y', strtotime($cultor['FECHA_REGISTRO'])); ?></td>
                                    </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                            </div>
                        <?php else: ?>
                            <div class="no-data">No se encontraron cultores con los filtros seleccionados.</div>
                        <?php endif; ?>
                        
                    <?php elseif ($tipo_reporte_select == 'usuarios' && isset($usuarios_filtrados)): ?>
                        <?php if (count($usuarios_filtrados) > 0): ?>
                            <div class="tabla-wrapper">
                            <table class="resultados-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre Completo</th>
                                        <th>Email</th>
                                        <th>Teléfono</th>
                                        <th>Tipo Usuario</th>
                                        <th>Fecha Registro</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($usuarios_filtrados as $usuario): ?>
                                    <tr>
                                        <td><?php echo $usuario['ID']; ?></td>
                                        <td><?php echo htmlspecialchars($usuario['NOMBRE_COMPLETO']); ?></td>
                                        <td><?php echo htmlspecialchars($usuario['EMAIL']); ?></td>
                                        <td><?php echo htmlspecialchars($usuario['TELEFONO'] ?? 'No registrado'); ?></td>
                                        <td><?php echo ucfirst($usuario['TIPO_USUARIO']); ?></td>
                                        <td><?php echo date('d/m/Y H:i', strtotime($usuario['FECHA_REGISTRO'])); ?></td>
                                        <td><?php echo $usuario['ACTIVO'] == 1 ? '<span style="color: green;">Activo</span>' : '<span style="color: red;">Inactivo</span>'; ?></td>
                                    </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                            </div>
                        <?php else: ?>
                            <div class="no-data">No se encontraron usuarios con los filtros seleccionados.</div>
                        <?php endif; ?>
                        
                    <?php elseif (($tipo_reporte_select == 'actividad_ejecutada' || $tipo_reporte_select == 'actividad_reportada') && isset($actividades_filtradas)): ?>
                        <?php if (count($actividades_filtradas) > 0): ?>
                            <div class="tabla-wrapper">
                            <table class="resultados-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Actividad</th>
                                        <th>Tipo</th>
                                        <th>Disciplina</th>
                                        <th>Fecha/Hora</th>
                                        <th>Estado</th>
                                        <th>Municipio</th>
                                        <th>Parroquia</th>
                                        <th>Responsable</th>
                                        <th>Cargo</th>
                                        <th>Estado Actividad</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($actividades_filtradas as $actividad): ?>
                                    <tr>
                                        <td><?php echo $actividad['ID']; ?></td>
                                        <td><?php echo htmlspecialchars($actividad['NOMBRE_ACTIVIDAD']); ?></td>
                                        <td><?php echo htmlspecialchars($actividad['TIPO_ACTIVIDAD']); ?></td>
                                        <td><?php echo htmlspecialchars($actividad['DISCIPLINA']); ?></td>
                                        <td><?php echo date('d/m/Y', strtotime($actividad['FECHA'])) . ' ' . substr($actividad['HORA'], 0, 5); ?></td>
                                        <td><?php echo htmlspecialchars($actividad['ESTADO']); ?></td>
                                        <td><?php echo htmlspecialchars($actividad['MUNICIPIO']); ?></td>
                                        <td><?php echo htmlspecialchars($actividad['PARROQUIA']); ?></td>
                                        <td><?php echo htmlspecialchars($actividad['RESPONSABLE_NOMBRE']); ?></td>
                                        <td><?php echo htmlspecialchars($actividad['RESPONSABLE_CARGO']); ?></td>
                                        <td><?php echo $tipo_reporte_select == 'actividad_ejecutada' ? '<span style="color: green;">Ejecutada</span>' : '<span style="color: orange;">Reportada</span>'; ?></td>
                                    </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                            </div>
                        <?php else: ?>
                            <div class="no-data">No se encontraron actividades con los filtros seleccionados.</div>
                        <?php endif; ?>
                    <?php endif; ?>
                <?php endif; ?>
            </div>
            
            <!-- Botones de descarga -->
            <div class="chart-container">
                <button class="btn-generar" onclick="descargarPDF('<?php echo $tipo_reporte_select; ?>', '<?php echo $tipo_vista; ?>')">
                    <i class="fas fa-file-pdf"></i> Descargar Reporte en PDF
                </button>
            </div>
        <?php endif; ?>
        
        <!-- Gráficas Estadísticas -->
        <div class="chart-container">
            <h3><i class="fas fa-chart-pie"></i> Distribución de Cultores por Área Temática</h3>
            <?php if (count($cultores_por_area) > 0): ?>
                <table class="resultados-table">
                    <thead>
                        <tr>
                            <th>Área Temática</th>
                            <th>Cantidad de Cultores</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($cultores_por_area as $area): ?>
                        <tr>
                            <td><?php echo htmlspecialchars($area['AREA_TEMATICA']); ?></td>
                            <td><?php echo $area['TOTAL']; ?></td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php else: ?>
                <div class="no-data">No hay datos disponibles</div>
            <?php endif; ?>
        </div>
        
        <div class="chart-container">
            <h3><i class="fas fa-chart-bar"></i> Distribución de Eventos por Disciplina</h3>
            <?php if (count($eventos_por_disciplina) > 0): ?>
                <table class="resultados-table">
                    <thead>
                        <tr>
                            <th>Disciplina</th>
                            <th>Cantidad de Eventos</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($eventos_por_disciplina as $disc): ?>
                        <tr>
                            <td><?php echo htmlspecialchars($disc['DISCIPLINA']); ?></td>
                            <td><?php echo $disc['TOTAL']; ?></td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php else: ?>
                <div class="no-data">No hay datos disponibles</div>
            <?php endif; ?>
        </div>
    </div>
    
    <script>
    // Cargar filtros dinámicos según el tipo de reporte
    document.getElementById('tipo_reporte_select').addEventListener('change', function() {
        const tipoReporte = this.value;
        const filtrosContainer = document.getElementById('filtros-dinamicos');
        
        if (!tipoReporte) {
            filtrosContainer.style.display = 'none';
            filtrosContainer.innerHTML = '';
            return;
        }
        
        filtrosContainer.style.display = 'grid';
        let filtrosHTML = '';
        
        // Filtros comunes de fecha
        filtrosHTML += `
            <div class="form-group">
                <label for="filtro_fecha_desde">Fecha Desde:</label>
                <input type="date" name="filtro_fecha_desde" id="filtro_fecha_desde" value="<?php echo $fecha_desde; ?>">
            </div>
            <div class="form-group">
                <label for="filtro_fecha_hasta">Fecha Hasta:</label>
                <input type="date" name="filtro_fecha_hasta" id="filtro_fecha_hasta" value="<?php echo $fecha_hasta; ?>">
            </div>
        `;
        
        // Filtros específicos por tipo
        if (tipoReporte === 'eventos' || tipoReporte === 'actividad_ejecutada' || tipoReporte === 'actividad_reportada') {
            filtrosHTML += `
                <div class="form-group">
                    <label for="filtro_responsable">Responsable:</label>
                    <select name="filtro_responsable" id="filtro_responsable">
                        <option value="">Todos</option>
                        <?php foreach ($responsables as $resp): ?>
                        <option value="<?php echo htmlspecialchars($resp); ?>"><?php echo htmlspecialchars($resp); ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
            `;
            
            if (tipoReporte === 'eventos') {
                filtrosHTML += `
                    <div class="form-group">
                        <label for="filtro_municipio">Municipio:</label>
                        <select name="filtro_municipio" id="filtro_municipio">
                            <option value="">Todos</option>
                            <?php foreach ($municipios_eventos as $mun): ?>
                            <option value="<?php echo htmlspecialchars($mun); ?>"><?php echo htmlspecialchars($mun); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="filtro_evento">Evento Específico:</label>
                        <select name="filtro_evento" id="filtro_evento">
                            <option value="">Todos</option>
                            <?php foreach ($eventos_lista as $ev): ?>
                            <option value="<?php echo $ev['ID']; ?>"><?php echo htmlspecialchars($ev['NOMBRE_ACTIVIDAD']); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                `;
            }
        } else if (tipoReporte === 'cultores') {
            filtrosHTML += `
                <div class="form-group">
                    <label for="filtro_area_tematica">Área Temática:</label>
                    <select name="filtro_area_tematica" id="filtro_area_tematica">
                        <option value="">Todas</option>
                        <?php foreach ($cultores_por_area as $area): ?>
                        <option value="<?php echo htmlspecialchars($area['AREA_TEMATICA']); ?>">
                            <?php echo htmlspecialchars($area['AREA_TEMATICA']); ?>
                        </option>
                        <?php endforeach; ?>
                    </select>
                </div>
            `;
        } else if (tipoReporte === 'usuarios') {
            filtrosHTML += `
                <div class="form-group">
                    <label for="filtro_tipo_usuario">Tipo de Usuario:</label>
                    <select name="filtro_tipo_usuario" id="filtro_tipo_usuario">
                        <option value="">Todos</option>
                        <option value="funcionario">Funcionario</option>
                        <option value="cultor">Cultor</option>
                    </select>
                </div>
            `;
        }
        
        filtrosContainer.innerHTML = filtrosHTML;
    });
    
    // Disparar el evento change al cargar si ya hay un tipo seleccionado
    if (document.getElementById('tipo_reporte_select').value) {
        document.getElementById('tipo_reporte_select').dispatchEvent(new Event('change'));
    }
    
    // Función mejorada para generar PDF con diseño del gobierno venezolano
    function descargarPDF(tipo, tipoVista) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Colores oficiales del gobierno venezolano (exactos del style.css)
        const colorAmarillo = [255, 215, 0]; // #FFD700
        const colorAzul = [0, 56, 147]; // #003893
        const colorRojo = [207, 20, 43]; // #CF142B
        
        const marginLeft = 20;
        const marginRight = 20;
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        let yPos = 20;
        
        // ============== ENCABEZADO OFICIAL ==============
        // Franja tricolor superior (simulando bandera)
        doc.setFillColor(colorAmarillo[0], colorAmarillo[1], colorAmarillo[2]);
        doc.rect(0, 0, pageWidth, 8, 'F');
        doc.setFillColor(colorAzul[0], colorAzul[1], colorAzul[2]);
        doc.rect(0, 8, pageWidth, 8, 'F');
        doc.setFillColor(colorRojo[0], colorRojo[1], colorRojo[2]);
        doc.rect(0, 16, pageWidth, 8, 'F');
        
        // Agregar las 8 estrellas en la franja azul
        const estrellasY = 12; // Centro de la franja azul
        const espacioTotal = pageWidth - 40; // Dejar márgenes
        const espacioEntre = espacioTotal / 7; // Espacio entre estrellas
        const inicioX = 20; // Margen inicial
        
        // Función para dibujar una estrella de 5 puntas
        function dibujarEstrella(x, y, radio) {
            const puntos = 5;
            const radioInterno = radio * 0.4;
            doc.setFillColor(255, 255, 255); // Blanco
            
            doc.saveGraphicsState();
            doc.setLineWidth(0);
            
            // Calcular puntos de la estrella
            let coordenadas = [];
            for (let i = 0; i < puntos * 2; i++) {
                const r = i % 2 === 0 ? radio : radioInterno;
                const angulo = (Math.PI / puntos) * i - Math.PI / 2;
                coordenadas.push({
                    x: x + r * Math.cos(angulo),
                    y: y + r * Math.sin(angulo)
                });
            }
            
            // Dibujar la estrella
            doc.lines(
                coordenadas.slice(1).map((punto, idx) => [
                    punto.x - coordenadas[idx].x,
                    punto.y - coordenadas[idx].y
                ]),
                coordenadas[0].x,
                coordenadas[0].y,
                [1, 1],
                'F'
            );
            
            doc.restoreGraphicsState();
        }
        
        // Dibujar las 8 estrellas
        for (let i = 0; i < 8; i++) {
            const estrella_x = inicioX + (i * espacioEntre);
            dibujarEstrella(estrella_x, estrellasY, 1.5);
        }
        
        yPos = 35;
        
        // Escudo y título principal
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(colorAzul[0], colorAzul[1], colorAzul[2]);
        doc.text("REPÚBLICA BOLIVARIANA DE VENEZUELA", pageWidth / 2, yPos, { align: 'center' });
        yPos += 8;
        
        doc.setFontSize(14);
        doc.text("MINISTERIO DEL PODER POPULAR PARA LA CULTURA", pageWidth / 2, yPos, { align: 'center' });
        yPos += 7;
        
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text("Despacho Ministerial", pageWidth / 2, yPos, { align: 'center' });
        yPos += 15;
        
        // Línea decorativa
        doc.setDrawColor(colorRojo[0], colorRojo[1], colorRojo[2]);
        doc.setLineWidth(1);
        doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);
        yPos += 10;
        
        // ============== TÍTULO DEL REPORTE ==============
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(colorRojo[0], colorRojo[1], colorRojo[2]);
        const tituloReporte = `REPORTE ${tipoVista === 'general' ? 'GENERAL' : 'DETALLADO'} DE ${tipo.toUpperCase().replace('_', ' ')}`;
        doc.text(tituloReporte, pageWidth / 2, yPos, { align: 'center' });
        yPos += 15;
        
        // ============== INFORMACIÓN DEL REPORTE ==============
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        
        const fechaHoy = new Date();
        const fechaFormateada = fechaHoy.toLocaleDateString('es-VE', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        doc.text(`Fecha de Emisión: ${fechaFormateada}`, marginLeft, yPos);
        yPos += 6;
        
        const horaEmision = fechaHoy.toLocaleTimeString('es-VE', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        doc.text(`Hora de Emisión: ${horaEmision}`, marginLeft, yPos);
        yPos += 6;
        
        doc.text(`Tipo de Vista: ${tipoVista === 'general' ? 'General (Resumen)' : 'Detallada (Completa)'}`, marginLeft, yPos);
        yPos += 10;
        
        // Fechas de filtro si existen
        const fechaDesde = document.getElementById('filtro_fecha_desde')?.value;
        const fechaHasta = document.getElementById('filtro_fecha_hasta')?.value;
        
        if (fechaDesde || fechaHasta) {
            doc.setFont("helvetica", "bold");
            doc.text("Período del Reporte:", marginLeft, yPos);
            yPos += 6;
            doc.setFont("helvetica", "normal");
            
            if (fechaDesde && fechaHasta) {
                doc.text(`  Desde: ${new Date(fechaDesde).toLocaleDateString('es-VE')}`, marginLeft, yPos);
                yPos += 6;
                doc.text(`  Hasta: ${new Date(fechaHasta).toLocaleDateString('es-VE')}`, marginLeft, yPos);
                yPos += 6;
            } else if (fechaDesde) {
                doc.text(`  Desde: ${new Date(fechaDesde).toLocaleDateString('es-VE')}`, marginLeft, yPos);
                yPos += 6;
            } else if (fechaHasta) {
                doc.text(`  Hasta: ${new Date(fechaHasta).toLocaleDateString('es-VE')}`, marginLeft, yPos);
                yPos += 6;
            }
        }
        
        yPos += 5;
        
        // Línea separadora
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);
        yPos += 10;
        
        // ============== CONTENIDO DEL REPORTE ==============
        if (tipoVista === 'general') {
            // VISTA GENERAL - SOLO RESUMEN
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(colorAzul[0], colorAzul[1], colorAzul[2]);
            doc.text("RESUMEN EJECUTIVO", marginLeft, yPos);
            yPos += 10;
            
            // Obtener datos de resumen de la página
            const resumenCards = document.querySelectorAll('.resumen-card');
            
            if (resumenCards.length > 0) {
                doc.setFontSize(11);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(0, 0, 0);
                
                resumenCards.forEach((card, index) => {
                    const titulo = card.querySelector('h4').textContent.trim();
                    const valor = card.querySelector('.valor').textContent.trim();
                    
                    // Fondo alternado
                    if (index % 2 === 0) {
                        doc.setFillColor(245, 245, 245);
                        doc.rect(marginLeft - 5, yPos - 5, pageWidth - marginLeft - marginRight + 10, 12, 'F');
                    }
                    
                    doc.setFont("helvetica", "bold");
                    doc.text(titulo + ':', marginLeft, yPos);
                    doc.setFont("helvetica", "normal");
                    doc.text(valor, pageWidth - marginRight - 30, yPos, { align: 'right' });
                    
                    yPos += 12;
                    
                    // Control de página
                    if (yPos > pageHeight - 50) {
                        doc.addPage();
                        yPos = 30;
                    }
                });
            }
            
        } else {
            // VISTA DETALLADA - TABLA COMPLETA (DIVIDIDA SI ES NECESARIA)
            const table = document.querySelector('.resultados-table');
            
            if (table) {
                const headers = [];
                const data = [];
                
                // Obtener encabezados
                table.querySelectorAll('thead th').forEach(th => {
                    headers.push(th.textContent.trim());
                });
                
                // Obtener datos
                table.querySelectorAll('tbody tr').forEach(tr => {
                    const row = [];
                    tr.querySelectorAll('td').forEach(td => {
                        row.push(td.textContent.trim());
                    });
                    data.push(row);
                });
                
                // Si la tabla tiene muchas columnas (más de 10), dividirla en secciones
                if (headers.length > 10) {
                    // Definir secciones lógicas según el tipo de reporte
                    let seccionesColumnas = [];
                    
                    if (tipo === 'eventos' || tipo === 'actividad_ejecutada' || tipo === 'actividad_reportada') {
                        // EVENTOS: Dividir en 3 secciones lógicas
                        // Sección 1: Información básica del evento
                        seccionesColumnas.push({
                            titulo: 'Información del Evento',
                            columnas: [0, 1, 2, 3, 4, 5, 6, 7, 8]
                        });
                        
                        // Sección 2: Datos de organización y responsables
                        seccionesColumnas.push({
                            titulo: 'Organización y Responsables',
                            columnas: [0, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]
                        });
                        
                        // Sección 3: Objetivo y asistencia
                        seccionesColumnas.push({
                            titulo: 'Objetivo y Asistencia',
                            columnas: [0, 1, 19, 20, 21, 22, 23, 24, 25, 26]
                        });
                    } else if (tipo === 'cultores') {
                        // CULTORES: Dividir en 3 secciones lógicas
                        // Sección 1: Información personal
                        seccionesColumnas.push({
                            titulo: 'Información Personal',
                            columnas: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
                        });
                        
                        // Sección 2: Ubicación y registro
                        seccionesColumnas.push({
                            titulo: 'Ubicación y Registro',
                            columnas: [0, 1, 10, 11, 12, 13, 14, 17]
                        });
                        
                        // Sección 3: Trayectoria y organización
                        seccionesColumnas.push({
                            titulo: 'Trayectoria y Organización',
                            columnas: [0, 1, 15, 16]
                        });
                    } else {
                        // Para otros tipos, dividir automáticamente
                        seccionesColumnas.push({
                            titulo: 'Datos Principales',
                            columnas: [0, 1, 2, 3, 4, 5, 6, 7]
                        });
                        
                        let columnasRestantes = [];
                        for (let i = 8; i < headers.length; i++) {
                            columnasRestantes.push(i);
                        }
                        
                        let seccionNum = 2;
                        while (columnasRestantes.length > 0) {
                            let cols = [0].concat(columnasRestantes.splice(0, 6));
                            seccionesColumnas.push({
                                titulo: `Datos Adicionales ${seccionNum}`,
                                columnas: cols
                            });
                            seccionNum++;
                        }
                    }
                    
                    // Generar cada sección una debajo de la otra
                    seccionesColumnas.forEach((seccion, seccionIdx) => {
                        // Verificar si hay espacio suficiente, si no, nueva página
                        if (yPos > 220) {
                            doc.addPage();
                            yPos = 30;
                        }
                        
                        // Título de sección
                        doc.setFontSize(11);
                        doc.setFont("helvetica", "bold");
                        doc.setTextColor(colorRojo[0], colorRojo[1], colorRojo[2]);
                        doc.text(seccion.titulo, marginLeft, yPos);
                        yPos += 8;
                        
                        // Obtener headers y data de esta sección
                        const seccionHeaders = seccion.columnas.map(idx => headers[idx]);
                        const seccionData = data.map(row => seccion.columnas.map(idx => row[idx]));
                        
                        doc.autoTable({
                            head: [seccionHeaders],
                            body: seccionData,
                            startY: yPos,
                            margin: { left: marginLeft, right: marginRight },
                            styles: {
                                fontSize: 8,
                                cellPadding: 2.5,
                                overflow: 'linebreak',
                                halign: 'left',
                                lineWidth: 0.1,
                                lineColor: [200, 200, 200]
                            },
                            headStyles: {
                                fillColor: colorAzul,
                                textColor: [255, 255, 255],
                                fontStyle: 'bold',
                                halign: 'center',
                                fontSize: 8,
                                cellPadding: 3
                            },
                            alternateRowStyles: {
                                fillColor: [245, 245, 245]
                            },
                            columnStyles: {
                                0: { cellWidth: 12, fontStyle: 'bold', fillColor: [250, 250, 250] }, // ID destacado
                            },
                            didDrawPage: function(data) {
                                // Encabezado en páginas adicionales
                                if (data.pageNumber > 1 && data.pageCount > 1) {
                                    doc.setFontSize(9);
                                    doc.setTextColor(100);
                                    doc.text(`${tituloReporte} - ${seccion.titulo} (Continuación)`, pageWidth / 2, 15, { align: 'center' });
                                }
                            }
                        });
                        
                        yPos = doc.lastAutoTable.finalY + 10;
                    });
                    
                    // Agregar nota informativa al final (si hay espacio en la página)
                    if (yPos < 250) {
                        yPos += 5;
                        doc.setFontSize(9);
                        doc.setFont("helvetica", "italic");
                        doc.setTextColor(100, 100, 100);
                        doc.text("Nota: Los datos están organizados en secciones temáticas para facilitar su lectura. Utilice el ID como referencia.", marginLeft, yPos);
                    }
                    
                } else {
                    // Tabla pequeña, mostrar normalmente
                    doc.autoTable({
                        head: [headers],
                        body: data,
                        startY: yPos,
                        margin: { left: marginLeft, right: marginRight },
                        styles: {
                            fontSize: 9,
                            cellPadding: 4,
                            overflow: 'linebreak',
                            halign: 'left'
                        },
                        headStyles: {
                            fillColor: colorAzul,
                            textColor: [255, 255, 255],
                            fontStyle: 'bold',
                            halign: 'center'
                        },
                        alternateRowStyles: {
                            fillColor: [245, 245, 245]
                        },
                        columnStyles: {
                            0: { cellWidth: 15 }, // ID
                        },
                        didDrawPage: function(data) {
                            // Encabezado en páginas adicionales
                            if (data.pageNumber > 1) {
                                doc.setFontSize(10);
                                doc.setTextColor(100);
                                doc.text(`${tituloReporte} (Continuación)`, pageWidth / 2, 15, { align: 'center' });
                            }
                        }
                    });
                    
                    yPos = doc.lastAutoTable.finalY + 15;
                }
            }
        }
        
        // ============== PIE DE PÁGINA EN TODAS LAS PÁGINAS ==============
        const pageCount = doc.internal.getNumberOfPages();
        
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            
            // Línea superior del pie
            doc.setDrawColor(colorAzul[0], colorAzul[1], colorAzul[2]);
            doc.setLineWidth(0.5);
            doc.line(marginLeft, pageHeight - 25, pageWidth - marginRight, pageHeight - 25);
            
            // Información del pie
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(80, 80, 80);
            
            // Número de página
            doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 18, { align: 'center' });
            
            // Información institucional
            doc.setFontSize(7);
            doc.text("Ministerio del Poder Popular para la Cultura", pageWidth / 2, pageHeight - 13, { align: 'center' });
            doc.text("Av. Panteón, Foro Libertador, Caracas 1010", pageWidth / 2, pageHeight - 9, { align: 'center' });
            doc.text("Teléfono: +58 (212) 509-8600 | www.cultura.gob.ve", pageWidth / 2, pageHeight - 5, { align: 'center' });
        }
        
        // ============== DESCARGAR PDF ==============
        const fechaArchivo = new Date().toISOString().split('T')[0];
        const tipoDoc = tipoVista === 'general' ? 'GENERAL' : 'DETALLADO';
        const nombreArchivo = `MPPC_REPORTE_${tipoDoc}_${tipo.toUpperCase()}_${fechaArchivo}.pdf`;
        doc.save(nombreArchivo);
    }
    </script>
</body>
</html>