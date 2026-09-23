document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Aquí iría la lógica de autenticación
    // Por ahora, simulamos un login exitoso
    if (email && password) {
        alert('Inicio de sesión exitoso. Redirigiendo al dashboard...');
        window.location.href = 'dashboard.html';
    } else {
        alert('Por favor, complete todos los campos.');
    }
});
