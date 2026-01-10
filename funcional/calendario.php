<?php
session_start();
require_once 'config.php';

// Verificar sesión
verificarSesion();

// Procesar acciones AJAX
if (isset($_GET['action'])) {
    header('Content-Type: application/json');

    if ($_GET['action'] === 'get_eventos') {
        // Obtener eventos próximos para el sidebar
        $pdo = conectarDB();
        $stmt = $pdo->prepare("SELECT FIRST 3 * FROM eventos WHERE activo = 1 ORDER BY fecha DESC");
        $stmt->execute();
        $eventos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Formatear para JavaScript
        $eventos_formateados = array_map(function($evento) {
            return [
                'id' => $evento['ID'],
                'titulo' => $evento['NOMBRE_ACTIVIDAD'],
                'descripcion' => $evento['DESCRIPCION'] ?? 'Evento cultural',
                'fecha' => $evento['FECHA'],
                'hora' => $evento['HORA'],
                'lugar' => $evento['DIRECCION'],
                'participantes' => $evento['PARTICIPANTES'] ?? 'Abierto al público',
                'tipoUsuario' => 'cultor' // Asumiendo que son para cultores por defecto
            ];
        }, $eventos);

        echo json_encode(['success' => true, 'data' => $eventos_formateados]);
        exit();
    }
}

// Procesar formulario de agregar actividad
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['addActivityForm'])) {
    try {
        $pdo = conectarDB();

        // Preparar datos del formulario
        $correo = sanitizar($_POST['correo']);
        $estado = sanitizar($_POST['estado']);
        $municipio = sanitizar($_POST['municipio']);
        $parroquia = sanitizar($_POST['parroquia']);
        $organizacion = sanitizar($_POST['organizacion']);
        $tipoOrganizacion = sanitizar($_POST['tipoOrganizacion']);
        $direccion = sanitizar($_POST['direccion']);
        $ubicacionExacta = sanitizar($_POST['ubicacionExacta']);
        $consejoComunal = sanitizar($_POST['consejoComunal']);
        $nombreConsejo = sanitizar($_POST['nombreConsejo']);
        $nombreComuna = sanitizar($_POST['nombreComuna']);
        $voceroNombre = sanitizar($_POST['voceroNombre']);
        $voceroCedula = sanitizar($_POST['voceroCedula']);
        $voceroTelefono = sanitizar($_POST['voceroTelefono']);
        $responsableNombre = sanitizar($_POST['responsableNombre']);
        $responsableCedula = sanitizar($_POST['responsableCedula']);
        $responsableTelefono = sanitizar($_POST['responsableTelefono']);
        $responsableCargo = sanitizar($_POST['responsableCargo']);
        $tipoActividad = sanitizar($_POST['tipoActividad']);
        $disciplina = sanitizar($_POST['disciplina']);
        $nombreActividad = sanitizar($_POST['nombreActividad']);
        $objetivo = sanitizar($_POST['objetivo']);
        $mes = (int)$_POST['mes'];
        $fecha = $_POST['fecha'];
        $hora = $_POST['hora'];
        $duracion = (int)$_POST['duracion'];
        $ninos = (int)$_POST['ninos'];
        $ninas = (int)$_POST['ninas'];
        $jovenesMasculinos = (int)$_POST['jovenesMasculinos'];
        $jovenesFemeninas = (int)$_POST['jovenesFemeninas'];
        $adultosMasculinos = (int)$_POST['adultosMasculinos'];
        $adultosFemeninas = (int)$_POST['adultosFemeninas'];

        // Insertar en la base de datos
        $stmt = $pdo->prepare("INSERT INTO eventos (
            correo_usuario, estado, municipio, parroquia, organizacion, tipo_organizacion,
            direccion, ubicacion_exacta, consejo_comunal, nombre_consejo, nombre_comuna,
            vocero_nombre, vocero_cedula, vocero_telefono, responsable_nombre, responsable_cedula,
            responsable_telefono, responsable_cargo, tipo_actividad, disciplina, nombre_actividad,
            objetivo, mes, fecha, hora, duracion, ninos, ninas, jovenes_masculinos,
            jovenes_femeninas, adultos_masculinos, adultos_femeninas
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

        $stmt->execute([
            $correo, $estado, $municipio, $parroquia, $organizacion, $tipoOrganizacion,
            $direccion, $ubicacionExacta, $consejoComunal, $nombreConsejo, $nombreComuna,
            $voceroNombre, $voceroCedula, $voceroTelefono, $responsableNombre, $responsableCedula,
            $responsableTelefono, $responsableCargo, $tipoActividad, $disciplina, $nombreActividad,
            $objetivo, $mes, $fecha, $hora, $duracion, $ninos, $ninas, $jovenesMasculinos,
            $jovenesFemeninas, $adultosMasculinos, $adultosFemeninas
        ]);

        $success_message = "Actividad agregada exitosamente.";
    } catch (Exception $e) {
        $error_message = "Error al agregar la actividad: " . $e->getMessage();
    }
}

// Obtener eventos para el mes actual
$currentMonth = isset($_GET['month']) ? (int)$_GET['month'] : date('m');
$currentYear = date('Y');

$pdo = conectarDB();
$query = "SELECT * FROM eventos WHERE activo = 1 AND mes = ? AND EXTRACT(YEAR FROM fecha) = ? ORDER BY fecha ASC";
$stmt = $pdo->prepare($query);
$stmt->execute([$currentMonth, $currentYear]);
$eventos_mes = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Convertir eventos a formato JSON para JavaScript
$eventos_json = json_encode($eventos_mes);

// Obtener información del usuario actual
$usuario_actual = obtenerUsuarioActual();
$usuario_email = $usuario_actual ? $usuario_actual['EMAIL'] : '';
$usuario_json = json_encode([
    'id' => $usuario_actual ? $usuario_actual['ID'] : null,
    'correo' => $usuario_email,
    'tipo' => $usuario_actual ? $usuario_actual['TIPO_USUARIO'] : null
]);
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

    <!-- Overlay para menu mobile -->
    <div class="overlay" id="overlay" onclick="closeMenu()"></div>

    <div class="calendario-container">

        <div class="calendario-controls">
            <h2>Calendario de Eventos Culturales</h2>
            <div class="filters">
                <p>Filtro:</p>
                <select id="monthFilter">
                    <option value="1">Enero</option>
                    <option value="2">Febrero</option>
                    <option value="3">Marzo</option>
                    <option value="4">Abril</option>
                    <option value="5">Mayo</option>
                    <option value="6">Junio</option>
                    <option value="7">Julio</option>
                    <option value="8">Agosto</option>
                    <option value="9">Septiembre</option>
                    <option value="10">Octubre</option>
                    <option value="11">Noviembre</option>
                    <option value="12">Diciembre</option>
                </select>
            </div>
        </div>

        <main class="calendario-main">
            <div class="calendar-section">
                <div class="calendar-grid" id="calendarGrid">
                    <!-- Calendario se generará dinámicamente -->
                </div>
            </div>

            <div class="eventos-section">
                <div class="eventos-list" id="eventosList">
                    <h3>Actividades Pautadas para este Mes</h3>
                    <div id="eventosContainer">
                        <!-- Eventos se cargarán dinámicamente -->
                    </div>
                </div>
            </div>
        </main>
    </div>

    <!-- Botón flotante para agregar actividad -->
    <button id="addActivityBtn" class="floating-btn">+</button>

    <!-- Modal para detalles del evento -->
    <div id="eventoModal" class="modal">
        <div class="modal-content">
            <span class="close">&times;</span>
            <h3 id="eventoTitle">Detalles del Evento</h3>
            <div id="eventoDetails">
                <!-- Detalles del evento -->
            </div>
        </div>
    </div>

    <!-- Modal para agregar actividad -->
    <div id="addActivityModal" class="modal">
        <div class="modal-content add-activity-modal">
            <span class="close" id="closeAddActivityModal">&times;</span>
            <h3>Agregar Nueva Actividad</h3>
            <?php if (isset($success_message)): ?>
                <div class="alert alert-success"><?php echo $success_message; ?></div>
            <?php endif; ?>
            <?php if (isset($error_message)): ?>
                <div class="alert alert-error"><?php echo $error_message; ?></div>
            <?php endif; ?>
            <form id="addActivityForm" method="POST" action="calendario.php">
                <input type="hidden" name="addActivityForm" value="1">
                <div class="form-section">
                    <h4>Información General</h4>
                    <div class="form-group">
                        <label for="correo">Correo electrónico *</label>
                        <input type="email" id="correo" name="correo" required readonly>
                    </div>
                </div>

                <div class="form-section">
                    <h4>Ubicación Geográfica</h4>
                    <div class="form-group">
                        <label for="estado">ESTADO *</label>
                        <select id="estado" name="estado" required>
                            <option value="">Seleccione un estado</option>
                            <option value="Distrito Capital">Distrito Capital</option>
                            <option value="Amazonas">Amazonas</option>
                            <option value="Anzoátegui">Anzoátegui</option>
                            <option value="Apure">Apure</option>
                            <option value="Aragua">Aragua</option>
                            <option value="Barinas">Barinas</option>
                            <option value="Bolívar">Bolívar</option>
                            <option value="Carabobo">Carabobo</option>
                            <option value="Cojedes">Cojedes</option>
                            <option value="Delta Amacuro">Delta Amacuro</option>
                            <option value="Falcón">Falcón</option>
                            <option value="Guárico">Guárico</option>
                            <option value="Lara">Lara</option>
                            <option value="Mérida">Mérida</option>
                            <option value="Miranda">Miranda</option>
                            <option value="Monagas">Monagas</option>
                            <option value="Nueva Esparta">Nueva Esparta</option>
                            <option value="Portuguesa">Portuguesa</option>
                            <option value="Sucre">Sucre</option>
                            <option value="Táchira">Táchira</option>
                            <option value="Trujillo">Trujillo</option>
                            <option value="Vargas">Vargas</option>
                            <option value="Yaracuy">Yaracuy</option>
                            <option value="Zulia">Zulia</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="municipio">MUNICIPIO *</label>
                        <input type="text" id="municipio" name="municipio" required>
                    </div>
                    <div class="form-group">
                        <label for="parroquia">PARROQUIA *</label>
                        <input type="text" id="parroquia" name="parroquia" required>
                    </div>
                    <div class="form-group">
                        <label for="organizacion">ORGANIZACIÓN *</label>
                        <input type="text" id="organizacion" name="organizacion" required>
                    </div>
                    <div class="form-group">
                        <label for="tipoOrganizacion">IDENTIFICAR SI ES COMUNAS O CIRCUITO COMUNAL</label>
                        <select id="tipoOrganizacion" name="tipoOrganizacion">
                            <option value="comuna">Comuna</option>
                            <option value="circuito">Circuito Comunal</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="direccion">DIRECCIÓN EXACTA DONDE SE VA REALIZAR LA ACTIVIDAD *</label>
                        <input type="text" id="direccion" name="direccion" required>
                    </div>
                    <div class="form-group">
                        <label for="ubicacionExacta">COLOCAR LA UBICACIÓN EXACTA DEL PUNTO Y CIRCULO DE LA ACTIVIDAD</label>
                        <input type="text" id="ubicacionExacta" name="ubicacionExacta">
                    </div>
                    <div class="form-group">
                        <label for="consejoComunal">CONSEJO COMUNAL VINCULADO AL PUNTO Y CIRCULO DE LA ACTIVIDAD *</label>
                        <input type="text" id="consejoComunal" name="consejoComunal" required>
                    </div>
                    <div class="form-group">
                        <label for="nombreConsejo">NOMBRE DEL CONSEJO COMUNAL</label>
                        <input type="text" id="nombreConsejo" name="nombreConsejo">
                    </div>
                    <div class="form-group">
                        <label for="nombreComuna">NOMBRE LA COMUNA O CIRCUITO COMUNAL *</label>
                        <input type="text" id="nombreComuna" name="nombreComuna" required>
                    </div>
                </div>

                <div class="form-section">
                    <h4>Datos del Vocero Responsable de la Comunidad</h4>
                    <div class="form-group">
                        <label for="voceroNombre">NOMBRE Y APELLIDO *</label>
                        <input type="text" id="voceroNombre" name="voceroNombre" required>
                    </div>
                    <div class="form-group">
                        <label for="voceroCedula">CÉDULA *</label>
                        <input type="text" id="voceroCedula" name="voceroCedula" required>
                    </div>
                    <div class="form-group">
                        <label for="voceroTelefono">TELÉFONO *</label>
                        <input type="tel" id="voceroTelefono" name="voceroTelefono" required>
                    </div>
                </div>

                <div class="form-section">
                    <h4>Datos del Responsable por Misión Cultura</h4>
                    <div class="form-group">
                        <label for="responsableNombre">NOMBRE Y APELLIDO *</label>
                        <input type="text" id="responsableNombre" name="responsableNombre" required>
                    </div>
                    <div class="form-group">
                        <label for="responsableCedula">CÉDULA *</label>
                        <input type="text" id="responsableCedula" name="responsableCedula" required>
                    </div>
                    <div class="form-group">
                        <label for="responsableTelefono">TELÉFONO *</label>
                        <input type="tel" id="responsableTelefono" name="responsableTelefono" required>
                    </div>
                    <div class="form-group">
                        <label for="responsableCargo">CARGO *</label>
                        <select id="responsableCargo" name="responsableCargo" required>
                            <option value="">Seleccione un cargo</option>
                            <option value="Animador">Animador</option>
                            <option value="Coordinador">Coordinador</option>
                            <option value="Facilitador">Facilitador</option>
                            <option value="Tutor">Tutor</option>
                        </select>
                    </div>
                </div>

                <div class="form-section">
                    <h4>Descripción de la Actividad</h4>
                    <div class="form-group">
                        <label for="tipoActividad">TIPO DE ACTIVIDAD *</label>
                        <select id="tipoActividad" name="tipoActividad" required>
                            <option value="">Seleccione un tipo de actividad</option>
                            <option value="Cumpleaños viva Venezuela">Cumpleaños viva Venezuela</option>
                            <option value="despligues homenajes/ amor en acción/ jornada">despligues homenajes/ amor en acción/ jornada</option>
                            <option value="Presentación artística">Presentación artística</option>
                            <option value="taller o conversatorio">taller o conversatorio</option>
                            <option value="tomas culturales">tomas culturales</option>
                            <option value="talleres formativos">talleres formativos</option>
                            <option value="Asamblea en disiplinas">Asamblea en disiplinas</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="disciplina">DISCIPLINA *</label>
                        <select id="disciplina" name="disciplina" required>
                            <option value="">Seleccione una disciplina</option>
                            <option value="Artes plásticas">Artes plásticas</option>
                            <option value="artesanía">artesanía</option>
                            <option value="audiovisual">audiovisual</option>
                            <option value="danza">danza</option>
                            <option value="gastronomía">gastronomía</option>
                            <option value="literatura">literatura</option>
                            <option value="música">música</option>
                            <option value="teatro">teatro</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="nombreActividad">NOMBRE DE LA ACTIVIDAD *</label>
                        <input type="text" id="nombreActividad" name="nombreActividad" required>
                    </div>
                    <div class="form-group">
                        <label for="objetivo">OBJETIVO TRANSFORMADOR DE LA ACTIVIDAD (CONTENIDO) *</label>
                        <select id="objetivo" name="objetivo" required>
                            <option value="">Seleccione un objetivo transformador</option>
                            <option value="ECONOMÍA: MODERNIZACIÓN PRODUCTIVA">ECONOMÍA: MODERNIZACIÓN PRODUCTIVA</option>
                            <option value="ECONOMÍA: DIVERSIFICACIÓN MÁS ALLÁ DEL PETRÓLEO">ECONOMÍA: DIVERSIFICACIÓN MÁS ALLÁ DEL PETRÓLEO</option>
                            <option value="ECONOMÍA: DESARROLLO TECNOLÓGICO">ECONOMÍA: DESARROLLO TECNOLÓGICO</option>
                            <option value="ECONOMÍA: FORTALECIMIENTO DE SECTORES COMO AGROALIMENTARIO Y TURISMO">ECONOMÍA: FORTALECIMIENTO DE SECTORES COMO AGROALIMENTARIO Y TURISMO</option>
                            <option value="INDEPENDENCIA PLENA: REFUERZO DE LA SOBERANÍA NACIONAL FRENTE A BLOQUEOS E INJERENCIAS EXTERNAS">INDEPENDENCIA PLENA: REFUERZO DE LA SOBERANÍA NACIONAL FRENTE A BLOQUEOS E INJERENCIAS EXTERNAS</option>
                            <option value="PAZ, SEGURIDAD E INTEGRACIÓN TERRITORIAL: GARANTIZAR LA ESTABILIDAD INTERNA Y LA DEFENSA DEL PAIS">PAZ, SEGURIDAD E INTEGRACIÓN TERRITORIAL: GARANTIZAR LA ESTABILIDAD INTERNA Y LA DEFENSA DEL PAIS</option>
                            <option value="RECUPERACIÓN Y COMPROMISO SOCIAL: RESTITUCIÓN Y PROTECCIÓN DE DERECHOS SOCIALES">RECUPERACIÓN Y COMPROMISO SOCIAL: RESTITUCIÓN Y PROTECCIÓN DE DERECHOS SOCIALES</option>
                            <option value="RECUPERACIÓN Y COMPROMISO SOCIAL: ATENCION A SECTORES VULNERABLES">RECUPERACIÓN Y COMPROMISO SOCIAL: ATENCION A SECTORES VULNERABLES</option>
                            <option value="POLÍTICA (DEMOCRACIA Y PODER POPULAR): PROMOCIÓN DE LA PARTICIPACIÓN POPULAR">POLÍTICA (DEMOCRACIA Y PODER POPULAR): PROMOCIÓN DE LA PARTICIPACIÓN POPULAR</option>
                            <option value="POLÍTICA (DEMOCRACIA Y PODER POPULAR): NUEVOS MÉTODOS DE GOBIERNO">POLÍTICA (DEMOCRACIA Y PODER POPULAR): NUEVOS MÉTODOS DE GOBIERNO</option>
                            <option value="ECOSOCIALISMO (CIENCIA Y TECNOLOGÍA): PROTECCIÓN AMBIENTAL">ECOSOCIALISMO (CIENCIA Y TECNOLOGÍA): PROTECCIÓN AMBIENTAL</option>
                            <option value="ECOSOCIALISMO (CIENCIA Y TECNOLOGÍA): ENFRENTAMIENTO AL CAMBIO CLIMÁTICO Y DESARROLLO CIENTÍFICO-TECNOLÓGICO">ECOSOCIALISMO (CIENCIA Y TECNOLOGÍA): ENFRENTAMIENTO AL CAMBIO CLIMÁTICO Y DESARROLLO CIENTÍFICO-TECNOLÓGICO</option>
                            <option value="GEOPOLÍTICA: POSICIONAMIENTO DE VENEZUELA EN UN NUEVO ORDEN MUNDIAL MULTIPOLAR">GEOPOLÍTICA: POSICIONAMIENTO DE VENEZUELA EN UN NUEVO ORDEN MUNDIAL MULTIPOLAR</option>
                        </select>
                    </div>
                </div>

                <div class="form-section">
                    <h4>Fecha y Hora</h4>
                    <div class="form-group">
                        <label for="mes">MES EN QUE SE REALIZA LA ACTIVIDAD *</label>
                        <select id="mes" name="mes" required>
                            <option value="1">Enero</option>
                            <option value="2">Febrero</option>
                            <option value="3">Marzo</option>
                            <option value="4">Abril</option>
                            <option value="5">Mayo</option>
                            <option value="6">Junio</option>
                            <option value="7">Julio</option>
                            <option value="8">Agosto</option>
                            <option value="9">Septiembre</option>
                            <option value="10">Octubre</option>
                            <option value="11">Noviembre</option>
                            <option value="12">Diciembre</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="fecha">FECHA *</label>
                        <input type="date" id="fecha" name="fecha" required>
                    </div>
                    <div class="form-group">
                        <label for="hora">HORA *</label>
                        <input type="time" id="hora" name="hora" required>
                    </div>
                    <div class="form-group">
                        <label for="duracion">DURACIÓN *</label>
                        <input type="number" id="duracion" name="duracion" min="1" required>
                    </div>
                </div>

                <div class="form-section">
                    <h4>Datos de Participación (Beneficiarios)</h4>
                    <div class="form-group">
                        <label for="ninos">NIÑOS (1 a 12 años) *</label>
                        <input type="number" id="ninos" name="ninos" min="0" required>
                    </div>
                    <div class="form-group">
                        <label for="ninas">NIÑAS (1 a 12 años) *</label>
                        <input type="number" id="ninas" name="ninas" min="0" required>
                    </div>
                    <div class="form-group">
                        <label for="jovenesMasculinos">JÓVENES MASCULINOS (12 a 17 años) *</label>
                        <input type="number" id="jovenesMasculinos" name="jovenesMasculinos" min="0" required>
                    </div>
                    <div class="form-group">
                        <label for="jovenesFemeninas">JÓVENES FEMENINAS (12 a 17 AÑOS) *</label>
                        <input type="number" id="jovenesFemeninas" name="jovenesFemeninas" min="0" required>
                    </div>
                    <div class="form-group">
                        <label for="adultosMasculinos">ADULTOS MASCULINOS (18 años y más) *</label>
                        <input type="number" id="adultosMasculinos" name="adultosMasculinos" min="0" required>
                    </div>
                    <div class="form-group">
                        <label for="adultosFemeninas">ADULTOS FEMENINAS (18 años y más) *</label>
                        <input type="number" id="adultosFemeninas" name="adultosFemeninas" min="0" required>
                    </div>
                </div>

                <button type="submit" class="submit-btn">Agregar Actividad</button>
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
            <p>Desarrollado por OTIC - Oficina de Tecnologías de la Información y la Comunicación</p>
        </div>
    </footer>

    <script>
        // Pasar datos de PHP a JavaScript
        window.calendarData = {
            eventos: <?php echo $eventos_json; ?>,
            currentMonth: <?php echo $currentMonth; ?>,
            currentYear: <?php echo $currentYear; ?>,
            usuario: <?php echo $usuario_json; ?>
        };
    </script>
    <script src="assets/js/calendario.js"></script>
</body>
</html>
