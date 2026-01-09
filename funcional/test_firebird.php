<?php
if (extension_loaded('pdo_firebird')) {
    echo "Firebird PDO está instalado correctamente.";
} else {
    echo "Firebird PDO NO está instalado.";
}
?>
