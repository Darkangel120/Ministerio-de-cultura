<?php
session_start();
require_once 'config.php';

// Destruir la sesión
session_destroy();

// Redirigir al inicio
header('Location: index.php');
exit();
?>
