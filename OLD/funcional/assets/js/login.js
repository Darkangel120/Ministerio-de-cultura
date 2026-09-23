
document.getElementById('loginForm').addEventListener('submit', function(e) {
    // Validación básica del lado cliente
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        e.preventDefault();
        alert('Por favor, complete todos los campos.');
        return false;
    }
});
