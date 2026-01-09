// El formulario ahora envía datos a login.php para procesamiento
// No se necesita JavaScript adicional para el envío básico
// Se puede agregar validación del lado cliente si es necesario

document.getElementById('loginForm').addEventListener('submit', function(e) {
    // Validación básica del lado cliente
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        e.preventDefault();
        alert('Por favor, complete todos los campos.');
        return false;
    }

    // El formulario se enviará normalmente a login.php
    // No se previene el envío por defecto
});
