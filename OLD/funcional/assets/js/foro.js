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

// Función para manejar el envío del formulario (se moverá al DOMContentLoaded)

// Función para manejar likes
document.addEventListener('click', function(e) {
    console.log('Click detected on:', e.target);
    if (e.target.classList.contains('btn-like') || e.target.closest('.btn-like')) {
        const btn = e.target.classList.contains('btn-like') ? e.target : e.target.closest('.btn-like');
        const publicacionId = btn.getAttribute('data-publicacion-id');

        if (publicacionId) {
            e.preventDefault();
            toggleLike(publicacionId);
        }
    }

    if (e.target.classList.contains('btn-comentar') || e.target.closest('.btn-comentar')) {
        console.log('Comments button clicked');
        const btn = e.target.classList.contains('btn-comentar') ? e.target : e.target.closest('.btn-comentar');
        const publicacionId = btn.getAttribute('data-publicacion-id');
        console.log('Publicacion ID:', publicacionId);

        if (publicacionId) {
            e.preventDefault();
            openCommentsModal(publicacionId);
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

// Función para preview de archivo en edición
document.getElementById('editArchivo').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('editFilePreview');

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



// Función para abrir modal de eventos en móvil
function openEventosModal() {
    const modal = document.getElementById('eventosModal');
    modal.style.display = 'block';
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

// Función para abrir modal de comentarios
function openCommentsModal(publicacionId) {
    console.log('Opening comments modal for publicacionId:', publicacionId);
    try {
        const modal = document.getElementById('commentsModal');
        const commentsContent = document.getElementById('commentsContent');
        const commentPublicacionId = document.getElementById('commentPublicacionId');

        console.log('Modal element:', modal);
        console.log('Comments content element:', commentsContent);
        console.log('Comment publicacion id element:', commentPublicacionId);

        if (!modal) {
            console.error('Comments modal not found!');
            return;
        }

        if (!commentsContent) {
            console.error('Comments content div not found!');
            return;
        }

        if (!commentPublicacionId) {
            console.error('Comment publicacion id input not found!');
            return;
        }

        // Cargar comentarios
        loadComments(publicacionId);

        // Setear el ID de la publicación en el formulario
        commentPublicacionId.value = publicacionId;

        modal.style.display = 'flex';
        console.log('Modal display set to flex, current style:', modal.style.display);

        // Force visibility check
        setTimeout(() => {
            console.log('Modal visibility after timeout:', window.getComputedStyle(modal).display);
        }, 100);

    } catch (error) {
        console.error('Error opening comments modal:', error);
    }
}

// Función para cerrar modal de comentarios
function closeCommentsModal() {
    const modal = document.getElementById('commentsModal');
    modal.style.display = 'none';
}

// Función para cargar comentarios
async function loadComments(publicacionId) {
    console.log('Loading comments for publicacionId:', publicacionId);
    try {
        const response = await fetch(`foro.php?action=get_comentarios&publicacion_id=${publicacionId}`);
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Data received:', data);

        const commentsContent = document.getElementById('commentsContent');
        commentsContent.innerHTML = '';

        if (data.success) {
            if (data.comentarios && data.comentarios.length > 0) {
                data.comentarios.forEach(comentario => {
                    const commentDiv = document.createElement('div');
                    commentDiv.className = 'comment';
                    commentDiv.innerHTML = `
                        <div class="comment-user">
                            <div class="user-avatar"><i class="fas fa-user"></i></div>
                            <div class="comment-content">
                                <h5>${comentario.nombre_completo || 'Usuario Anónimo'}</h5>
                                <p>${comentario.comentario}</p>
                                <span class="comment-date">${new Date(comentario.fecha_comentario).toLocaleDateString('es-ES', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}</span>
                            </div>
                        </div>
                    `;
                    commentsContent.appendChild(commentDiv);
                });
            } else {
                commentsContent.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px;">No hay comentarios aún. ¡Sé el primero en comentar!</p>';
            }
        } else {
            commentsContent.innerHTML = '<p style="text-align: center; color: #dc3545; padding: 20px;">Error: ' + (data.message || 'Error desconocido al cargar comentarios') + '</p>';
            console.error('Error from server:', data.message);
        }
    } catch (error) {
        console.error('Error cargando comentarios:', error);
        const commentsContent = document.getElementById('commentsContent');
        commentsContent.innerHTML = '<p style="text-align: center; color: #dc3545; padding: 20px;">Error de conexión al cargar comentarios.</p>';
    }
}

// Función para toggle like
async function toggleLike(publicacionId) {
    const likeBtn = document.getElementById(`like-btn-${publicacionId}`);
    const icon = likeBtn.querySelector('i');

    try {
        const response = await fetch('foro.php?action=toggle_like', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ publicacion_id: publicacionId })
        });

        const data = await response.json();

        if (data.success) {
            // Update like button appearance
            if (data.liked) {
                likeBtn.classList.add('liked');
                icon.classList.remove('far');
                icon.classList.add('fas');
            } else {
                likeBtn.classList.remove('liked');
                icon.classList.remove('fas');
                icon.classList.add('far');
            }

            // Update the likes count in the button text
            const textNode = likeBtn.lastChild;
            textNode.textContent = ` Me gusta (${data.likes_count})`;
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al procesar el like');
    }
}

// Función para manejar el envío del formulario de comentarios
document.addEventListener('submit', async function(e) {
    if (e.target.id === 'commentForm') {
        e.preventDefault();

        const formData = new FormData(e.target);
        const publicacionId = formData.get('publicacion_id');
        const comentario = formData.get('comentario');

        try {
            const response = await fetch('foro.php?action=add_comentario', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    publicacion_id: publicacionId,
                    comentario: comentario
                })
            });

            const data = await response.json();

            if (data.success) {
                // Recargar comentarios
                loadComments(publicacionId);
                // Limpiar el formulario
                e.target.querySelector('textarea').value = '';
            } else {
                alert('Error: ' + data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al agregar comentario');
        }
    }
});

// Función para toggle del menú de publicación
function togglePostMenu(postId) {
    const menu = document.getElementById(`menu-${postId}`);
    const allMenus = document.querySelectorAll('.post-menu-dropdown');

    // Cerrar todos los menús primero
    allMenus.forEach(m => {
        if (m.id !== `menu-${postId}`) {
            m.classList.remove('show');
        }
    });

    // Toggle el menú actual
    menu.classList.toggle('show');
}

// Función para editar publicación
async function editarPublicacion(postId) {
    try {
        const response = await fetch(`foro.php?action=get_publicacion&id=${postId}`);
        const data = await response.json();

        if (data.success) {
            // Llenar el modal con los datos de la publicación
            document.getElementById('editPostId').value = data.publicacion.ID;
            document.getElementById('editTitulo').value = data.publicacion.TITULO;
            document.getElementById('editCategoria').value = data.publicacion.CATEGORIA;
            document.getElementById('editDescripcion').value = data.publicacion.DESCRIPCION;

            // Abrir el modal
            document.getElementById('editPostModal').style.display = 'block';

            // Cerrar el menú
            document.getElementById(`menu-${postId}`).classList.remove('show');
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar la publicación');
    }
}

// Función para eliminar publicación
async function eliminarPublicacion(postId) {
    if (confirm('¿Estás seguro de que deseas eliminar esta publicación? Esta acción no se puede deshacer.')) {
        try {
            const response = await fetch('foro.php?action=delete_publicacion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ publicacion_id: postId })
            });

            const data = await response.json();

            if (data.success) {
                // Remover la publicación del DOM
                const postElement = document.getElementById(`post-${postId}`);
                if (postElement) {
                    postElement.remove();
                }
                alert('Publicación eliminada exitosamente');
            } else {
                alert('Error: ' + data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al eliminar la publicación');
        }
    }
}

// Función para cerrar modal de edición
function closeEditPostModal() {
    document.getElementById('editPostModal').style.display = 'none';
    document.getElementById('editArteForm').reset();
}

// Cerrar menús cuando se hace click fuera
document.addEventListener('click', function(e) {
    if (!e.target.closest('.post-menu')) {
        const allMenus = document.querySelectorAll('.post-menu-dropdown');
        allMenus.forEach(menu => menu.classList.remove('show'));
    }
});

// Inicializar la página
document.addEventListener('DOMContentLoaded', async function() {
    await loadEventosFromPHP();
    renderizarEventosInvitaciones();

    // Función para manejar el envío del formulario
    const arteForm = document.getElementById('arteForm');
    if (arteForm) {
        arteForm.addEventListener('submit', async function(e) {
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
    }

    // Función para manejar el envío del formulario de edición
    const editArteForm = document.getElementById('editArteForm');
    if (editArteForm) {
        editArteForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            const postId = document.getElementById('editPostId').value;

            try {
                const response = await fetch('foro.php?action=edit_publicacion', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.success) {
                    // Actualizar la publicación en el DOM
                    const postElement = document.getElementById(`post-${postId}`);
                    if (postElement) {
                        const titleElement = postElement.querySelector('.post-content h3');
                        const categoryElement = postElement.querySelector('.category-badge');
                        const descElement = postElement.querySelector('.post-content p');

                        if (titleElement) titleElement.textContent = formData.get('titulo');
                        if (categoryElement) {
                            const categoria = formData.get('categoria');
                            categoryElement.textContent = categoria.charAt(0).toUpperCase() + categoria.slice(1);
                            categoryElement.className = `category-badge category-${categoria}`;
                        }
                        if (descElement) descElement.innerHTML = nl2br(formData.get('descripcion'));
                    }

                    closeEditPostModal();
                    alert('Publicación actualizada exitosamente');
                } else {
                    alert('Error: ' + data.message);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error al actualizar la publicación');
            }
        });
    }
});
