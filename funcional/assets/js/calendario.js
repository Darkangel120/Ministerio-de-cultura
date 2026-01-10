// Datos de eventos desde PHP
let currentYear = window.calendarData ? window.calendarData.currentYear : new Date().getFullYear();
let eventos = window.calendarData ? window.calendarData.eventos : [];
let currentMonth = window.calendarData ? window.calendarData.currentMonth : new Date().getMonth() + 1;
let currentUser = window.calendarData ? window.calendarData.usuario : null;


document.addEventListener('DOMContentLoaded', function() {
    initializeCalendar();
    loadEventos();

    // Establecer mes actual en el filtro
    document.getElementById('monthFilter').value = currentMonth;

    // Filtros
    document.getElementById('monthFilter').addEventListener('change', function() {
        currentMonth = parseInt(this.value);
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
        // Auto-fill email field with current user's email
        if (currentUser && currentUser.correo) {
            document.getElementById('correo').value = currentUser.correo;
        }
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
            const eventoDate = new Date(evento.FECHA + 'T00:00:00');
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

    eventosContainer.innerHTML = '';

    let filteredEventos = eventos.filter(evento => {
        const eventoDate = new Date(evento.FECHA + 'T00:00:00');
        return eventoDate.getMonth() + 1 === currentMonth && eventoDate.getFullYear() === currentYear;
    });

    if (filteredEventos.length === 0) {
        eventosContainer.innerHTML = '<p>No hay eventos programados para este mes.</p>';
        return;
    }

    filteredEventos.forEach(evento => {
        const eventoDiv = document.createElement('div');
        eventoDiv.className = 'evento-item';
        eventoDiv.innerHTML = `
            <h4>${evento.NOMBRE_ACTIVIDAD}</h4>
            <p><strong>Fecha:</strong> ${formatDate(evento.FECHA)} a las ${formatTime(evento.HORA)}</p>
            <p><strong>Lugar:</strong> ${evento.DIRECCION}</p>
            <p><strong>Disciplina:</strong> ${evento.DISCIPLINA}</p>
        `;
        eventoDiv.onclick = () => showEventoDetails(evento);
        eventosContainer.appendChild(eventoDiv);
    });
}

function showEventoDetails(evento) {
    const modal = document.getElementById('eventoModal');
    const title = document.getElementById('eventoTitle');
    const details = document.getElementById('eventoDetails');

    title.textContent = evento.NOMBRE_ACTIVIDAD;
    let detailsHtml = `
        <p><strong>Fecha:</strong> ${formatDate(evento.FECHA)} a las ${formatTime(evento.HORA)}</p>
        <p><strong>Lugar:</strong> ${evento.DIRECCION}</p>
        <p><strong>Disciplina:</strong> ${evento.DISCIPLINA}</p>
        <p><strong>Tipo de Actividad:</strong> ${evento.TIPO_ACTIVIDAD}</p>
        <p><strong>Objetivo:</strong> ${evento.OBJETIVO}</p>
        <p><strong>Organización:</strong> ${evento.ORGANIZACION}</p>
        <p><strong>Municipio:</strong> ${evento.MUNICIPIO}</p>
        <p><strong>Estado:</strong> ${evento.ESTADO}</p>
    `;

    // Add edit and delete buttons if the event belongs to the current user
    if (currentUser && evento.CORREO_USUARIO === currentUser.correo) {
        detailsHtml += `
            <div class="event-actions" style="margin-top: 20px; text-align: center;">
                <button onclick="editEvent(${evento.ID})" class="btn-edit" style="background-color: #007bff; color: white; border: none; padding: 8px 16px; margin-right: 10px; cursor: pointer; border-radius: 4px;">Editar</button>
                <button onclick="deleteEvent(${evento.ID})" class="btn-delete" style="background-color: #dc3545; color: white; border: none; padding: 8px 16px; cursor: pointer; border-radius: 4px;">Eliminar</button>
            </div>
        `;
    }

    details.innerHTML = detailsHtml;
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
                    <h4>${evento.NOMBRE_ACTIVIDAD}</h4>
                    <p><strong>Hora:</strong> ${formatTime(evento.HORA)}</p>
                    <p><strong>Lugar:</strong> ${evento.DIRECCION}</p>
                    <p><strong>Disciplina:</strong> ${evento.DISCIPLINA}</p>
                </div>
            `;
        });
        activitiesHtml += '</div>';
        details.innerHTML = activitiesHtml;
    }

    modal.style.display = "block";
}

function formatDate(dateString) {
    // Asegurar que la fecha se interprete correctamente sin problemas de zona horaria
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatTime(timeString) {
    // Convertir hora de 24 horas a 12 horas
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}

function addNewActivity() {
    const form = document.getElementById('addActivityForm');
    const formData = new FormData(form);

    // Mostrar indicador de carga
    const submitBtn = form.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Agregando...';
    submitBtn.disabled = true;

    // Enviar formulario via AJAX
    fetch('calendario.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(data => {
        // Verificar si la respuesta contiene mensaje de éxito
        if (data.includes('Actividad agregada exitosamente')) {
            // Cerrar modal
            document.getElementById('addActivityModal').style.display = "none";

            // Limpiar formulario
            form.reset();

            // Mostrar mensaje de éxito
            alert('Actividad agregada exitosamente.');

            // Recargar la página para actualizar el calendario
            location.reload();
        } else if (data.includes('Error al agregar la actividad')) {
            // Mostrar mensaje de error
            alert('Error al agregar la actividad. Por favor, inténtelo de nuevo.');
        } else {
            // Si no podemos determinar el resultado, recargar la página
            location.reload();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al procesar la solicitud. Por favor, inténtelo de nuevo.');
    })
    .finally(() => {
        // Restaurar botón
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
}

function editEvent(eventId) {
    // For now, just show an alert. In a real implementation, this would open an edit modal
    alert('Funcionalidad de edición próximamente disponible. Evento ID: ' + eventId);
}

function deleteEvent(eventId) {
    if (confirm('¿Está seguro de que desea eliminar esta actividad?')) {
        // Send delete request to server
        fetch('delete_event.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'event_id=' + eventId
        })
        .then(response => response.text())
        .then(data => {
            if (data.includes('eliminado')) {
                alert('Actividad eliminada exitosamente.');
                location.reload();
            } else {
                alert('Error al eliminar la actividad.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al procesar la solicitud.');
        });
    }
}
