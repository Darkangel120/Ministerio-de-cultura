// Función para mostrar/ocultar campos de cultor
function toggleCultorFields() {
    const tipoUsuario = document.getElementById('tipo_usuario').value;
    const cultorFields = document.getElementById('cultorFields');

    if (tipoUsuario === 'cultor') {
        cultorFields.style.display = 'block';
    } else {
        cultorFields.style.display = 'none';
    }
}

// Event listener para el cambio de tipo de usuario
document.getElementById('tipo_usuario').addEventListener('change', toggleCultorFields);

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    toggleCultorFields();
});

document.getElementById('registroForm').addEventListener('submit', async function(e) {
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

    if (!nombre || !email || !telefono || !tipo || !password) {
        alert('Por favor, complete todos los campos.');
        return;
    }

    // Enviar datos al servidor PHP
    try {
        const formData = new FormData();
        formData.append('nombre', nombre);
        formData.append('email', email);
        formData.append('telefono', telefono);
        formData.append('tipo', tipo);
        formData.append('password', password);

        const response = await fetch('registro.php', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            alert('Registro exitoso. Redirigiendo al login...');
            window.location.href = 'login.php';
        } else {
            alert('Error en el registro: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al procesar la solicitud de registro');
    }
});
