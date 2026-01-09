document.getElementById('registroForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const nombre = document.getElementById('nombre').value;
    const email = document.getElementById('email').value;
    const telefono = document.getElementById('telefono').value;
    const tipo = document.getElementById('tipo').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validaciones básicas
    if (password !== confirmPassword) {
        alert('Las contraseñas no coinciden.');
        return;
    }
    
    if (password.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres.');
        return;
    }
    
    // Aquí iría la lógica de registro
    // Por ahora, simulamos un registro exitoso
    if (nombre && email && telefono && tipo && password) {
        alert('Registro exitoso. Redirigiendo al login...');
        window.location.href = 'login.html';
    } else {
        alert('Por favor, complete todos los campos.');
    }
});
