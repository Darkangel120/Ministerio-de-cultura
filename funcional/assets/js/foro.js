// Variables globales
let publicaciones = []; // Se cargarán desde PHP
let eventosCalendario = []; // Se cargarán desde PHP

// Función para cargar publicaciones desde PHP
async function loadPublicacionesFromPHP() {
    try {
        const response = await fetch('foro.php?action=get_publicaciones');
        const result = await response.json();

        if (result.success) {
            publicaciones = result.data;
        } else {
            console.error('Error cargando publicaciones:', result.message);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Función para cargar eventos desde PHP
async function loadEventosFromPHP() {
    try {
        const response = await fetch('calendario.php?action=get_eventos');
        const result = await response.json();

        if (result.success) {
            eventosCalendario = result.data;
        } else {
            console.error('Error cargando eventos:', result.message);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Función para renderizar publicaciones
function renderizarPublicaciones() {
    const feed = document.getElementById('feedPosts');
    feed.innerHTML = '';

    publicaciones.forEach((pub, index) => {
        const postCard = document.createElement('div');
        postCard.className = 'post-card';

        const mediaHTML = renderizarMedia(pub.archivo, pub.archivoTipo);
        const commentsHTML = renderizarComentarios(pub.comentarios || []);

        postCard.innerHTML = `
            <div class="post-header">
                <div class="user-avatar"><i class="fas fa-user"></i></div>
                <div class="post-user-info">
                    <div class="post-author">${pub.autor || 'Cultor Anónimo'}</div>
                    <div class="post-meta">
                        ${new Date(pub.fecha).toLocaleDateString()}
                        <span class="post-category">${pub.categoria}</span>
                    </div>
                </div>
            </div>
            <div class="post-content">
                <div class="post-text">
                    <strong>${pub.titulo}</strong><br>
                    ${pub.descripcion}
                </div>
                ${mediaHTML ? `<div class="post-media">${mediaHTML}</div>` : ''}
            </div>
            <div class="post-stats">
                ${pub.likes || 0} Me gusta
            </div>
            <div class="post-actions">
                <button class="btn-action btn-like" data-index="${index}">
                    <span class="like-icon"><i class="fas fa-thumbs-up"></i></span> Me gusta
                </button>
                <button class="btn-action btn-comentar" data-index="${index}">
                    <span class="comment-icon"><i class="fas fa-comment"></i></span> Comentar
                </button>
            </div>
            <div class="comments-section" id="comments-${index}" style="display: none;">
                ${commentsHTML}
                <div class="add-comment">
                    <div class="add-comment-avatar"><i class="fas fa-user"></i></div>
                    <div class="comment-input">
                        <input type="text" placeholder="Comparte tu opinión artística..." data-index="${index}">
                        <button type="button" onclick="agregarComentario(${index})">Compartir</button>
                    </div>
                </div>
            </div>
        `;

        feed.appendChild(postCard);
    });
}

// Función para renderizar media
function renderizarMedia(archivo, tipo) {
    if (!archivo) return '<span><i class="fas fa-palette"></i></span>';

    if (tipo.startsWith('image/')) {
        return `<img src="${archivo}" alt="Imagen">`;
    } else if (tipo.startsWith('video/')) {
        return `<video controls><source src="${archivo}" type="${tipo}"></video>`;
    } else if (tipo.startsWith('audio/')) {
        return `<audio controls><source src="${archivo}" type="${tipo}"></audio>`;
    } else {
        return '<span><i class="fas fa-file"></i></span>';
    }
}

// Función para renderizar comentarios
function renderizarComentarios(comentarios) {
    return comentarios.map(com => `
        <div class="comentario">
            <div class="comentario-autor">${com.autor || 'Anónimo'}</div>
            <div class="comentario-texto">${com.texto}</div>
            <div class="comentario-fecha">${new Date(com.fecha).toLocaleDateString()}</div>
        </div>
    `).join('');
}

// Función para manejar el envío del formulario
document.getElementById('arteForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const formData = new FormData(this);

    try {
        const response = await fetch('foro.php?action=add_publicacion', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            alert('Publicación creada exitosamente');
            await loadPublicacionesFromPHP();
            renderizarPublicaciones();
            this.reset();
            document.getElementById('filePreview').innerHTML = '';
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al procesar la solicitud');
    }
});

// Función para manejar likes
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-like')) {
        const index = e.target.dataset.index;
        publicaciones[index].likes = (publicaciones[index].likes || 0) + 1;
        localStorage.setItem('publicaciones', JSON.stringify(publicaciones));
        renderizarPublicaciones();
    }

    if (e.target.classList.contains('btn-comentar')) {
        const index = e.target.dataset.index;
        const commentsDiv = document.getElementById(`comments-${index}`);
        commentsDiv.style.display = commentsDiv.style.display === 'none' ? 'block' : 'none';
    }
});

// Función para manejar comentarios
document.addEventListener('submit', async function(e) {
    if (e.target.classList.contains('comentario-form')) {
        e.preventDefault();
        const index = e.target.dataset.index;
        const input = e.target.querySelector('input');
        const publicacionId = publicaciones[index].id;
        const comentario = {
            texto: input.value
        };

        try {
            const response = await fetch('foro.php?action=add_comentario', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ publicacion_id: publicacionId, comentario: comentario })
            });

            const result = await response.json();

            if (result.success) {
                await loadPublicacionesFromPHP();
                renderizarPublicaciones();
                input.value = '';
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al agregar comentario');
        }
    }
});

// Función para agregar comentario desde el botón
async function agregarComentario(index) {
    const input = document.querySelector(`input[data-index="${index}"]`);
    if (input.value.trim()) {
        const publicacionId = publicaciones[index].id;
        const comentario = {
            texto: input.value.trim()
        };

        try {
            const response = await fetch('foro.php?action=add_comentario', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ publicacion_id: publicacionId, comentario: comentario })
            });

            const result = await response.json();

            if (result.success) {
                await loadPublicacionesFromPHP();
                renderizarPublicaciones();
                input.value = '';
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al agregar comentario');
        }
    }
}

// Función para abrir modal de publicación
function openPostModal() {
    document.getElementById('postModal').style.display = 'block';
}

// Función para cerrar modal de publicación
function closePostModal() {
    document.getElementById('postModal').style.display = 'none';
    document.getElementById('arteForm').reset();
    document.getElementById('filePreview').innerHTML = '';
}

// Función para preview de archivo
document.getElementById('archivo').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('filePreview');

    if (file) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            };
            reader.readAsDataURL(file);
        } else {
            preview.innerHTML = `<p>Archivo seleccionado: ${file.name}</p>`;
        }
    } else {
        preview.innerHTML = '';
    }
});

// Función para toggle menu (igual que en otras páginas)
function toggleMenu() {
    const nav = document.getElementById('mainNav');
    const overlay = document.getElementById('overlay');
    nav.classList.toggle('active');
    overlay.classList.toggle('active');
}

function closeMenu() {
    const nav = document.getElementById('mainNav');
    const overlay = document.getElementById('overlay');
    nav.classList.remove('active');
    overlay.classList.remove('active');
}

// Función para renderizar invitaciones a eventos
function renderizarEventosInvitaciones() {
    const eventosGrid = document.getElementById('eventosInvitaciones');
    eventosGrid.innerHTML = '';

    // Filtrar eventos próximos (próximos 30 días)
    const hoy = new Date();
    const treintaDias = new Date();
    treintaDias.setDate(hoy.getDate() + 30);

    const eventosProximos = eventosCalendario.filter(evento => {
        const fechaEvento = new Date(evento.fecha);
        return fechaEvento >= hoy && fechaEvento <= treintaDias;
    });

    if (eventosProximos.length === 0) {
        eventosGrid.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px;">No hay eventos próximos programados.</p>';
        return;
    }

    eventosProximos.forEach(evento => {
        const eventoCard = document.createElement('div');
        eventoCard.className = 'evento-card';

        const fechaFormateada = new Date(evento.fecha).toLocaleDateString('es-ES', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });

        eventoCard.innerHTML = `
            <div class="evento-titulo">
                <span><i class="fas fa-theater-masks"></i></span> ${evento.titulo}
            </div>
            <div class="evento-fecha">
                <span><i class="fas fa-calendar-alt"></i></span> ${fechaFormateada} - ${evento.hora}
            </div>
            <div class="evento-lugar">
                <span><i class="fas fa-map-marker-alt"></i></span> ${evento.lugar}
            </div>
            <div class="evento-descripcion">
                ${evento.descripcion}
            </div>
            <div class="evento-participantes">
                <strong>Participantes:</strong> ${evento.participantes.join(', ')}
            </div>
            <div class="evento-tipo">${evento.tipoUsuario === 'cultor' ? 'Para Cultores' : 'Para Funcionarios'}</div>
        `;

        eventoCard.onclick = () => mostrarDetalleEvento(evento);
        eventosGrid.appendChild(eventoCard);
    });
}

// Función para mostrar detalle del evento
function mostrarDetalleEvento(evento) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h3>${evento.titulo}</h3>
            <div style="margin-top: 20px;">
                <p><strong><i class="fas fa-calendar-alt"></i> Fecha:</strong> ${new Date(evento.fecha).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })} a las ${evento.hora}</p>
                <p><strong><i class="fas fa-map-marker-alt"></i> Lugar:</strong> ${evento.lugar}</p>
                <p><strong><i class="fas fa-edit"></i> Descripción:</strong> ${evento.descripcion}</p>
                <p><strong><i class="fas fa-users"></i> Participantes:</strong> ${evento.participantes.join(', ')}</p>
                <p><strong><i class="fas fa-bullseye"></i> Tipo:</strong> ${evento.tipoUsuario === 'cultor' ? 'Evento para Cultores' : 'Evento para Funcionarios'}</p>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'block';

    // Cerrar modal al hacer click fuera
    modal.onclick = function(event) {
        if (event.target === modal) {
            modal.remove();
        }
    };
}

// Función para abrir modal de eventos en móvil
function openEventosModal() {
    const modal = document.getElementById('eventosModal');
    modal.style.display = 'block';
    renderizarEventosModal();
}

// Función para cerrar modal de eventos en móvil
function closeEventosModal() {
    const modal = document.getElementById('eventosModal');
    modal.style.display = 'none';
}

// Función para renderizar eventos en el modal móvil
function renderizarEventosModal() {
    const eventosGrid = document.getElementById('eventosModalGrid');
    eventosGrid.innerHTML = '';

    // Filtrar eventos próximos (próximos 30 días)
    const hoy = new Date();
    const treintaDias = new Date();
    treintaDias.setDate(hoy.getDate() + 30);

    const eventosProximos = eventosCalendario.filter(evento => {
        const fechaEvento = new Date(evento.fecha);
        return fechaEvento >= hoy && fechaEvento <= treintaDias;
    });

    if (eventosProximos.length === 0) {
        eventosGrid.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px;">No hay eventos próximos programados.</p>';
        return;
    }

    eventosProximos.forEach(evento => {
        const eventoCard = document.createElement('div');
        eventoCard.className = 'evento-card';

        const fechaFormateada = new Date(evento.fecha).toLocaleDateString('es-ES', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });

        eventoCard.innerHTML = `
            <div class="evento-titulo">
                <span><i class="fas fa-theater-masks"></i></span> ${evento.titulo}
            </div>
            <div class="evento-fecha">
                <span><i class="fas fa-calendar-alt"></i></span> ${fechaFormateada} - ${evento.hora}
            </div>
            <div class="evento-lugar">
                <span><i class="fas fa-map-marker-alt"></i></span> ${evento.lugar}
            </div>
            <div class="evento-descripcion">
                ${evento.descripcion}
            </div>
            <div class="evento-participantes">
                <strong>Participantes:</strong> ${evento.participantes.join(', ')}
            </div>
            <div class="evento-tipo">${evento.tipoUsuario === 'cultor' ? 'Para Cultores' : 'Para Funcionarios'}</div>
        `;

        eventoCard.onclick = () => mostrarDetalleEvento(evento);
        eventosGrid.appendChild(eventoCard);
    });
}

// Inicializar la página
document.addEventListener('DOMContentLoaded', async function() {
    await loadPublicacionesFromPHP();
    await loadEventosFromPHP();
    renderizarPublicaciones();
    renderizarEventosInvitaciones();
});
