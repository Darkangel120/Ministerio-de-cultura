// Importar eventos del calendario
let eventosCalendario = [
    {
        id: 1,
        titulo: "Concierto Sinfónico",
        titulo: "Danza Tradicional Venezolana",
        hora: "19:00",
        categoria: "danza",
        descripcion: "Gran concierto con la Orquesta Sinfónica de Venezuela",
        participantes: ["Orquesta Sinfónica", "Director Invitado"],
        tipoUsuario: "funcionario"
    },
    {
        id: 2,
        titulo: "Exposición de Arte Contemporáneo",
        fecha: `${new Date().getFullYear()}-01-20`,
        hora: "10:00",
        lugar: "Galería de Arte Nacional",
        descripcion: "Muestra de artistas venezolanos contemporáneos",
        participantes: ["Artistas Plásticos", "Curadores"],
        tipoUsuario: "cultor"
    },
    {
        id: 3,
        titulo: "Festival de Danza Folklórica",
        fecha: `${new Date().getFullYear()}-01-25`,
        hora: "18:00",
        lugar: "Complejo Cultural, Maracaibo",
        descripcion: "Presentación de danza folklórica venezolana, mostrando la riqueza de nuestras tradiciones culturales.",
        archivo: null,
        tipoUsuario: "cultor"
    }
];

// Variables globales
let publicaciones = JSON.parse(localStorage.getItem('publicaciones')) || [
    {
        titulo: "Danza Tradicional Venezolana",
        categoria: "danza",
        descripcion: "Presentación de danza folklórica venezolana, mostrando la riqueza de nuestras tradiciones culturales.",
        archivo: null,
        archivoTipo: null,
        autor: "María González",
        fecha: "2024-01-15T10:00:00.000Z",
        likes: 12,
        comentarios: [
            { autor: "Carlos Ruiz", texto: "¡Hermosa presentación! Me encanta la energía.", fecha: "2024-01-15T11:30:00.000Z" },
            { autor: "Ana López", texto: "Las danzas tradicionales son el alma de Venezuela.", fecha: "2024-01-15T12:15:00.000Z" }
        ]
    },
    {
        titulo: "Poesía Contemporánea",
        categoria: "poesia",
        descripcion: "Poema original sobre la identidad venezolana y la lucha por la paz.",
        archivo: null,
        archivoTipo: null,
        autor: "José Martínez",
        fecha: "2024-01-14T15:20:00.000Z",
        likes: 8,
        comentarios: [
            { autor: "Elena Torres", texto: "Palabras profundas que tocan el corazón.", fecha: "2024-01-14T16:45:00.000Z" }
        ]
    },
    {
        titulo: "Música Llanera",
        categoria: "musica",
        descripcion: "Interpretación de música llanera con instrumentos tradicionales venezolanos.",
        archivo: null,
        archivoTipo: null,
        autor: "Pedro Ramírez",
        fecha: "2024-01-13T18:30:00.000Z",
        likes: 15,
        comentarios: [
            { autor: "Rosa Díaz", texto: "La música llanera siempre me hace sentir en casa.", fecha: "2024-01-13T19:10:00.000Z" },
            { autor: "Luis Fernández", texto: "¡Excelente ejecución! Los instrumentos suenan perfectos.", fecha: "2024-01-13T20:05:00.000Z" },
            { autor: "Carmen Vega", texto: "Orgullo venezolano en cada nota.", fecha: "2024-01-13T21:30:00.000Z" }
        ]
    },
    {
        titulo: "Arte Urbano Contemporáneo",
        categoria: "artesPlasticas",
        descripcion: "Mural urbano que representa la diversidad cultural de Venezuela.",
        archivo: null,
        archivoTipo: null,
        autor: "Sofía Morales",
        fecha: "2024-01-12T14:00:00.000Z",
        likes: 20,
        comentarios: [
            { autor: "Diego Silva", texto: "El arte urbano es una forma poderosa de expresión.", fecha: "2024-01-12T15:20:00.000Z" },
            { autor: "Valentina Castro", texto: "¡Increíble trabajo! Los colores representan perfectamente nuestra diversidad.", fecha: "2024-01-12T16:40:00.000Z" }
        ]
    },
    {
        titulo: "Teatro Experimental",
        categoria: "teatro",
        descripcion: "Obra de teatro experimental que explora temas sociales actuales en Venezuela.",
        archivo: null,
        archivoTipo: null,
        autor: "Grupo Teatral Libertad",
        fecha: "2024-01-11T20:00:00.000Z",
        likes: 18,
        comentarios: [
            { autor: "Miguel Ángel", texto: "El teatro experimental abre nuevas perspectivas.", fecha: "2024-01-11T21:15:00.000Z" },
            { autor: "Isabel Rojas", texto: "Muy reflexivo y actual. ¡Felicitaciones!", fecha: "2024-01-11T22:30:00.000Z" },
            { autor: "Fernando Gutiérrez", texto: "El mensaje social es muy importante.", fecha: "2024-01-12T08:45:00.000Z" }
        ]
    },
    {
        titulo: "Fotografía Documental",
        categoria: "fotografia",
        descripcion: "Serie fotográfica documentando la vida cotidiana en comunidades indígenas venezolanas.",
        archivo: null,
        archivoTipo: null,
        autor: "Laura Hernández",
        fecha: "2024-01-10T12:30:00.000Z",
        likes: 25,
        comentarios: [
            { autor: "Roberto Mendoza", texto: "La fotografía documental es esencial para preservar nuestra historia.", fecha: "2024-01-10T13:50:00.000Z" },
            { autor: "Gabriela Paz", texto: "Imágenes poderosas que cuentan historias reales.", fecha: "2024-01-10T14:20:00.000Z" },
            { autor: "Andrés Soto", texto: "Hermoso trabajo de documentación cultural.", fecha: "2024-01-10T15:10:00.000Z" }
        ]
    }
];

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
document.getElementById('arteForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const formData = new FormData(this);
    const archivo = formData.get('archivo');

    let archivoURL = null;
    let archivoTipo = null;

    if (archivo && archivo.size > 0) {
        archivoURL = URL.createObjectURL(archivo);
        archivoTipo = archivo.type;
    }

    const nuevaPublicacion = {
        titulo: formData.get('titulo'),
        categoria: formData.get('categoria'),
        descripcion: formData.get('descripcion'),
        archivo: archivoURL,
        archivoTipo: archivoTipo,
        autor: 'Cultor Anónimo', // En un sistema real, esto vendría del login
        fecha: new Date().toISOString(),
        likes: 0,
        comentarios: []
    };

    publicaciones.unshift(nuevaPublicacion);
    localStorage.setItem('publicaciones', JSON.stringify(publicaciones));

    renderizarPublicaciones();
    this.reset();
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
document.addEventListener('submit', function(e) {
    if (e.target.classList.contains('comentario-form')) {
        e.preventDefault();
        const index = e.target.dataset.index;
        const input = e.target.querySelector('input');
        const comentario = {
            autor: 'Usuario Anónimo', // En un sistema real, esto vendría del login
            texto: input.value,
            fecha: new Date().toISOString()
        };

        if (!publicaciones[index].comentarios) {
            publicaciones[index].comentarios = [];
        }
        publicaciones[index].comentarios.push(comentario);
        localStorage.setItem('publicaciones', JSON.stringify(publicaciones));
        renderizarPublicaciones();
        input.value = '';
    }
});

// Función para agregar comentario desde el botón
function agregarComentario(index) {
    const input = document.querySelector(`input[data-index="${index}"]`);
    if (input.value.trim()) {
        const comentario = {
            autor: 'Usuario Anónimo',
            texto: input.value.trim(),
            fecha: new Date().toISOString()
        };

        if (!publicaciones[index].comentarios) {
            publicaciones[index].comentarios = [];
        }
        publicaciones[index].comentarios.push(comentario);
        localStorage.setItem('publicaciones', JSON.stringify(publicaciones));
        renderizarPublicaciones();
        input.value = '';
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

// Inicializar la página
document.addEventListener('DOMContentLoaded', function() {
    renderizarPublicaciones();
    renderizarEventosInvitaciones();
});
