<?php
require_once 'config.php';

echo "<h1>Diagnóstico de Base de Datos</h1>";
echo "<style>body{font-family:Arial;margin:20px;} .error{color:red;} .success{color:green;} table{border-collapse:collapse;width:100%;} th,td{border:1px solid #ddd;padding:8px;text-align:left;} th{background-color:#f2f2f2;}</style>";

try {
    $pdo = conectarDB();
    echo "<p class='success'>✅ Conexión a la base de datos exitosa</p>";

    // Verificar tablas
    echo "<h2>Tablas en la base de datos:</h2>";
    $stmt = $pdo->query("SELECT r.RDB\$RELATION_NAME as table_name FROM RDB\$RELATIONS r WHERE r.RDB\$SYSTEM_FLAG = 0 AND r.RDB\$RELATION_TYPE = 0 ORDER BY r.RDB\$RELATION_NAME");
    $tables = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($tables) > 0) {
        echo "<ul>";
        foreach ($tables as $table) {
            $tableName = trim($table['TABLE_NAME']);
            echo "<li>$tableName</li>";
        }
        echo "</ul>";
    } else {
        echo "<p class='error'>❌ No se encontraron tablas</p>";
    }

    // Verificar tabla eventos
    echo "<h2>Tabla EVENTOS:</h2>";
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM eventos");
    $count = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "<p>Total de eventos: " . $count['TOTAL'] . "</p>";

    if ($count['TOTAL'] > 0) {
        echo "<h3>Primeros 5 eventos:</h3>";
        $stmt = $pdo->prepare("SELECT id, nombre_actividad, fecha, municipio, direccion FROM eventos ORDER BY fecha DESC ROWS 5");
        $stmt->execute();
        $eventos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (count($eventos) > 0) {
            echo "<table>";
            echo "<tr><th>ID</th><th>Nombre Actividad</th><th>Fecha</th><th>Municipio</th><th>Dirección</th></tr>";
            foreach ($eventos as $evento) {
                echo "<tr>";
                echo "<td>" . htmlspecialchars($evento['ID']) . "</td>";
                echo "<td>" . htmlspecialchars($evento['NOMBRE_ACTIVIDAD']) . "</td>";
                echo "<td>" . htmlspecialchars($evento['FECHA']) . "</td>";
                echo "<td>" . htmlspecialchars($evento['MUNICIPIO']) . "</td>";
                echo "<td>" . htmlspecialchars($evento['DIRECCION']) . "</td>";
                echo "</tr>";
            }
            echo "</table>";
        } else {
            echo "<p>No se pudieron obtener los detalles de los eventos</p>";
        }
    } else {
        echo "<p class='error'>❌ No hay eventos en la tabla</p>";
        echo "<h3>Intentando insertar un evento de prueba...</h3>";

        try {
            $stmt = $pdo->prepare("INSERT INTO eventos (correo_usuario, estado, municipio, parroquia, organizacion, direccion, consejo_comunal, nombre_comuna, vocero_nombre, vocero_cedula, vocero_telefono, responsable_nombre, responsable_cedula, responsable_telefono, responsable_cargo, tipo_actividad, disciplina, nombre_actividad, objetivo, mes, fecha, hora, duracion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                'admin@mincultura.gob.ve',
                'Distrito Capital',
                'Libertador',
                'Catedral',
                'Fundación Música Venezolana',
                'Teatro Nacional',
                'Consejo Comunal Catedral',
                'Comuna Catedral',
                'Juan Pérez',
                'V-87654321',
                '04149876543',
                'Ana López',
                'V-11223344',
                '04145566778',
                'Coordinador',
                'Presentación artística',
                'música',
                'Concierto de Música Tradicional',
                'PROMOCIÓN DE LA PARTICIPACIÓN POPULAR',
                1,
                '2024-01-15',
                '19:00:00',
                2
            ]);
            echo "<p class='success'>✅ Evento de prueba insertado correctamente</p>";
        } catch (Exception $e) {
            echo "<p class='error'>❌ Error al insertar evento de prueba: " . $e->getMessage() . "</p>";
        }
    }

} catch (PDOException $e) {
    echo "<p class='error'>❌ Error de conexión: " . $e->getMessage() . "</p>";
    echo "<p>Verifica que:</p>";
    echo "<ul>";
    echo "<li>Firebird esté ejecutándose</li>";
    echo "<li>El archivo de base de datos exista en: " . DB_NAME . "</li>";
    echo "<li>Las credenciales sean correctas</li>";
    echo "</ul>";
}
?>
