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

    // Modal de eventos
    const eventoModal = document.getElementById('eventoModal');
    const eventoCloseBtn = eventoModal ? eventoModal.querySelector('.close') : null;

    console.log('eventoModal:', eventoModal);
    console.log('eventoCloseBtn:', eventoCloseBtn);

    if (eventoCloseBtn) {
        eventoCloseBtn.addEventListener('click', function() {
            console.log('Close button clicked for eventoModal');
            eventoModal.style.display = "none";
        });
    } else {
        console.error('eventoCloseBtn not found');
    }

    // Modal de agregar actividad
    const addActivityBtn = document.getElementById('addActivityBtn');
    const addActivityModal = document.getElementById('addActivityModal');
    const addActivityCloseBtn = addActivityModal ? addActivityModal.querySelector('.close') : null;
    const addActivityForm = document.getElementById('addActivityForm');

    console.log('addActivityBtn:', addActivityBtn);
    console.log('addActivityModal:', addActivityModal);
    console.log('addActivityCloseBtn:', addActivityCloseBtn);

    if (addActivityBtn) {
        addActivityBtn.addEventListener('click', function() {
            console.log('Add activity button clicked');
            if (addActivityModal) {
                addActivityModal.style.display = "block";
                // Auto-fill email field with current user's email
                if (currentUser && currentUser.correo) {
                    document.getElementById('correo').value = currentUser.correo;
                }
            }
        });
    } else {
        console.error('addActivityBtn not found');
    }

    if (addActivityCloseBtn) {
        addActivityCloseBtn.addEventListener('click', function() {
            console.log('Close button clicked for addActivityModal');
            if (addActivityModal) {
                addActivityModal.style.display = "none";
            }
        });
    } else {
        console.error('addActivityCloseBtn not found');
    }

    // Window click to close modals
    window.addEventListener('click', function(event) {
        console.log('Window click event:', event.target);
        if (event.target === eventoModal) {
            console.log('Closing eventoModal via window click');
            eventoModal.style.display = "none";
        }
        if (event.target === addActivityModal) {
            console.log('Closing addActivityModal via window click');
            addActivityModal.style.display = "none";
        }
    });

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

    // Determinar si es agregar o editar
    const isEdit = document.getElementById('editActivityForm').value === '1';
    const actionText = isEdit ? 'Actualizando...' : 'Agregando...';
    const successText = isEdit ? 'Actividad actualizada exitosamente.' : 'Actividad agregada exitosamente.';
    const errorText = isEdit ? 'Error al actualizar la actividad. Por favor, inténtelo de nuevo.' : 'Error al agregar la actividad. Por favor, inténtelo de nuevo.';

    // Mostrar indicador de carga
    const submitBtn = form.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = actionText;
    submitBtn.disabled = true;

    // Enviar formulario via AJAX
    fetch('calendario.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(data => {
        // Verificar si la respuesta contiene mensaje de éxito
        if (data.includes(successText)) {
            // Cerrar modal
            document.getElementById('addActivityModal').style.display = "none";

            // Limpiar formulario y resetear a modo agregar
            form.reset();
            document.getElementById('editActivityForm').value = '';
            document.getElementById('eventId').value = '';
            document.getElementById('submitBtn').textContent = 'Agregar Actividad';

            // Mostrar mensaje de éxito
            alert(successText);

            // Recargar la página para actualizar el calendario
            location.reload();
        } else if (data.includes(errorText)) {
            // Mostrar mensaje de error
            alert(errorText);
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
    // Fetch event data
    fetch('calendario.php?action=get_event&id=' + eventId)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Populate form with event data
                populateEditForm(data.data);
                // Show modal
                document.getElementById('addActivityModal').style.display = "block";
            } else {
                alert('Error al cargar los datos del evento: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al cargar los datos del evento.');
        });
}

function populateEditForm(eventData) {
    // Set form to edit mode
    document.getElementById('addActivityForm').querySelector('input[name="editActivityForm"]').value = '1';
    document.getElementById('eventId').value = eventData.ID;
    document.getElementById('submitBtn').textContent = 'Actualizar Actividad';

    // Populate form fields
    document.getElementById('correo').value = eventData.CORREO_USUARIO;
    document.getElementById('estado').value = eventData.ESTADO;
    document.getElementById('municipio').value = eventData.MUNICIPIO;
    document.getElementById('parroquia').value = eventData.PARROQUIA;
    document.getElementById('organizacion').value = eventData.ORGANIZACION;
    document.getElementById('tipoOrganizacion').value = eventData.TIPO_ORGANIZACION;
    document.getElementById('direccion').value = eventData.DIRECCION;
    document.getElementById('ubicacionExacta').value = eventData.UBICACION_EXACTA;
    document.getElementById('consejoComunal').value = eventData.CONSEJO_COMUNAL;
    document.getElementById('nombreConsejo').value = eventData.NOMBRE_CONSEJO;
    document.getElementById('nombreComuna').value = eventData.NOMBRE_COMUNA;
    document.getElementById('voceroNombre').value = eventData.VOCERO_NOMBRE;
    document.getElementById('voceroCedula').value = eventData.VOCERO_CEDULA;
    document.getElementById('voceroTelefono').value = eventData.VOCERO_TELEFONO;
    document.getElementById('responsableNombre').value = eventData.RESPONSABLE_NOMBRE;
    document.getElementById('responsableCedula').value = eventData.RESPONSABLE_CEDULA;
    document.getElementById('responsableTelefono').value = eventData.RESPONSABLE_TELEFONO;
    document.getElementById('responsableCargo').value = eventData.RESPONSABLE_CARGO;
    document.getElementById('tipoActividad').value = eventData.TIPO_ACTIVIDAD;
    document.getElementById('disciplina').value = eventData.DISCIPLINA;
    document.getElementById('nombreActividad').value = eventData.NOMBRE_ACTIVIDAD;
    document.getElementById('objetivo').value = eventData.OBJETIVO;
    document.getElementById('mes').value = eventData.MES;
    document.getElementById('fecha').value = eventData.FECHA;
    document.getElementById('hora').value = eventData.HORA;
    document.getElementById('duracion').value = eventData.DURACION;
    document.getElementById('ninos').value = eventData.NINOS;
    document.getElementById('ninas').value = eventData.NINAS;
    document.getElementById('jovenesMasculinos').value = eventData.JOVENES_MASCULINOS;
    document.getElementById('jovenesFemeninas').value = eventData.JOVENES_FEMENINAS;
    document.getElementById('adultosMasculinos').value = eventData.ADULTOS_MASCULINOS;
    document.getElementById('adultosFemeninas').value = eventData.ADULTOS_FEMENINAS;
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
