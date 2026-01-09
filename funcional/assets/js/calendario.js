// Variables globales para eventos
let currentYear = new Date().getFullYear();
let eventos = []; // Se cargarán desde PHP

let currentMonth = new Date().getMonth() + 1;


document.addEventListener('DOMContentLoaded', function() {
    initializeCalendar();
    loadEventos();

    // Filtros
    document.getElementById('monthFilter').addEventListener('change', async function() {
        currentMonth = parseInt(this.value);
        await loadEventosFromPHP(); // Recargar eventos al cambiar mes
        initializeCalendar();
        loadEventos();
    });

    document.getElementById('userFilter').addEventListener('change', loadEventos);

    // Modal de eventos
    const modal = document.getElementById('eventoModal');
    const closeBtn = document.getElementsByClassName('close')[0];

    closeBtn.onclick = function() {
        modal.style.display = "none";
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    // Modal de agregar actividad
    const addActivityBtn = document.getElementById('addActivityBtn');
    const addActivityModal = document.getElementById('addActivityModal');
    const closeAddActivityBtn = document.getElementById('closeAddActivityModal');
    const addActivityForm = document.getElementById('addActivityForm');

    addActivityBtn.onclick = function() {
        addActivityModal.style.display = "block";
    }

    closeAddActivityBtn.onclick = function() {
        addActivityModal.style.display = "none";
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
        if (event.target == addActivityModal) {
            addActivityModal.style.display = "none";
        }
    }

    addActivityForm.addEventListener('submit', function(e) {
        e.preventDefault();
        addNewActivity();
    });
});

function initializeCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';

    // Headers de días
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    diasSemana.forEach(dia => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = dia;
        calendarGrid.appendChild(header);
    });

    // Calcular primer día del mes
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    // Generar días del calendario
    for (let i = 0; i < 42; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';

        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        const dayNumber = currentDate.getDate();
        const isCurrentMonth = currentDate.getMonth() === currentMonth - 1;

        if (!isCurrentMonth) {
            dayDiv.classList.add('other-month');
        }

        // Marcar hoy
        const today = new Date();
        if (currentDate.toDateString() === today.toDateString()) {
            dayDiv.classList.add('today');
        }

        dayDiv.innerHTML = `<div class="day-number">${dayNumber}</div>`;

        // Agregar eventos del día
        const dayEvents = eventos.filter(evento => {
            const eventoDate = new Date(evento.fecha);
            return eventoDate.toDateString() === currentDate.toDateString();
        });

        // Marcar días con eventos
        if (dayEvents.length > 0 && isCurrentMonth) {
            dayDiv.classList.add('has-events');
            const eventDot = document.createElement('div');
            eventDot.className = 'event-dot';
            dayDiv.appendChild(eventDot);
        }

        // Hacer el día clickeable para mostrar actividades
        if (isCurrentMonth) {
            dayDiv.onclick = () => showDayActivities(currentDate, dayEvents);
            dayDiv.style.cursor = 'pointer';
        }

        calendarGrid.appendChild(dayDiv);
    }
}

function loadEventos() {
    const eventosContainer = document.getElementById('eventosContainer');
    const userFilter = document.getElementById('userFilter').value;
    
    eventosContainer.innerHTML = '';
    
    let filteredEventos = eventos.filter(evento => {
        const eventoDate = new Date(evento.fecha);
        return eventoDate.getMonth() + 1 === currentMonth && eventoDate.getFullYear() === currentYear;
    });
    
    if (userFilter) {
        filteredEventos = filteredEventos.filter(evento => evento.tipoUsuario === userFilter);
    }
    
    if (filteredEventos.length === 0) {
        eventosContainer.innerHTML = '<p>No hay eventos programados para este mes.</p>';
        return;
    }
    
    filteredEventos.forEach(evento => {
        const eventoDiv = document.createElement('div');
        eventoDiv.className = 'evento-item';
        eventoDiv.innerHTML = `
            <h4>${evento.titulo}</h4>
            <p><strong>Fecha:</strong> ${formatDate(evento.fecha)} a las ${evento.hora}</p>
            <p><strong>Lugar:</strong> ${evento.lugar}</p>
            <p><strong>Participantes:</strong> ${evento.participantes.join(', ')}</p>
        `;
        eventoDiv.onclick = () => showEventoDetails(evento);
        eventosContainer.appendChild(eventoDiv);
    });
}

function showEventoDetails(evento) {
    const modal = document.getElementById('eventoModal');
    const title = document.getElementById('eventoTitle');
    const details = document.getElementById('eventoDetails');
    
    title.textContent = evento.titulo;
    details.innerHTML = `
        <p><strong>Fecha:</strong> ${formatDate(evento.fecha)} a las ${evento.hora}</p>
        <p><strong>Lugar:</strong> ${evento.lugar}</p>
        <p><strong>Descripción:</strong> ${evento.descripcion}</p>
        <p><strong>Participantes:</strong> ${evento.participantes.join(', ')}</p>
        <p><strong>Tipo de Usuario:</strong> ${evento.tipoUsuario === 'cultor' ? 'Cultor' : 'Funcionario'}</p>
    `;
    
    modal.style.display = "block";
}

function showDayActivities(date, dayEvents) {
    const modal = document.getElementById('eventoModal');
    const title = document.getElementById('eventoTitle');
    const details = document.getElementById('eventoDetails');

    const formattedDate = date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    title.textContent = `Actividades del ${formattedDate}`;

    if (dayEvents.length === 0) {
        details.innerHTML = '<p>No hay actividades programadas para este día.</p>';
    } else {
        let activitiesHtml = '<div class="day-activities">';
        dayEvents.forEach(evento => {
            activitiesHtml += `
                <div class="activity-item" onclick="showEventoDetails(${JSON.stringify(evento).replace(/"/g, '"')})">
                    <h4>${evento.titulo}</h4>
                    <p><strong>Hora:</strong> ${evento.hora}</p>
                    <p><strong>Lugar:</strong> ${evento.lugar}</p>
                    <p><strong>Tipo:</strong> ${evento.tipoUsuario === 'cultor' ? 'Cultor' : 'Funcionario'}</p>
                </div>
            `;
        });
        activitiesHtml += '</div>';
        details.innerHTML = activitiesHtml;
    }

    modal.style.display = "block";
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Función para cargar eventos desde PHP
async function loadEventosFromPHP() {
    try {
        const response = await fetch('calendario.php?action=get_eventos');
        const data = await response.json();
        eventos = data.eventos || [];
    } catch (error) {
        console.error('Error cargando eventos:', error);
        // Mantener eventos vacíos si falla la carga
        eventos = [];
    }
}

// Función para agregar nueva actividad (enviar a PHP)
async function addNewActivity() {
    const formData = new FormData(document.getElementById('addActivityForm'));

    try {
        const response = await fetch('calendario.php?action=add_evento', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            alert('Actividad agregada exitosamente');
            document.getElementById('addActivityModal').style.display = 'none';
            document.getElementById('addActivityForm').reset();
            // Recargar eventos
            await loadEventosFromPHP();
            initializeCalendar();
            loadEventos();
        } else {
            alert('Error al agregar actividad: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al procesar la solicitud');
    }
}
