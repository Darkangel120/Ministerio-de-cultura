// Variables globales para cultores
let cultores = []; // Se cargarán desde PHP

document.addEventListener('DOMContentLoaded', async function() {
    await loadCultoresFromPHP();
    loadCultores();
    populateFilters();

    // Botón agregar cultor
    document.getElementById('addCultorBtn').addEventListener('click', function() {
        showModal();
    });

    // Formulario
    document.getElementById('cultorForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveCultor();
    });

    // Filtros
    document.getElementById('filterDisciplina').addEventListener('change', applyFilters);
    document.getElementById('filterMunicipio').addEventListener('change', applyFilters);

    // Modal
    const modal = document.getElementById('cultorModal');
    const closeBtn = document.getElementsByClassName('close')[0];

    closeBtn.onclick = function() {
        modal.style.display = "none";
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
});

function loadCultores(cultoresToShow = cultores) {
    const cultoresGrid = document.getElementById('cultoresGrid');
    cultoresGrid.innerHTML = '';

    if (cultoresToShow.length === 0) {
        cultoresGrid.innerHTML = '<p>No hay cultores registrados.</p>';
        return;
    }

    cultoresToShow.forEach(cultor => {
        const cultorCard = document.createElement('div');
        cultorCard.className = 'cultor-card';
        cultorCard.innerHTML = `
            <h4>${cultor.nombresApellidos}</h4>
            <p><strong>Cédula:</strong> ${cultor.cedula}</p>
            <p><strong>Teléfono:</strong> ${cultor.telefono}</p>
            <p><strong>Correo:</strong> ${cultor.correo}</p>
            <p><strong>Área Temática:</strong> ${getAreaTematicaName(cultor.areaTematica)}</p>
            <p><strong>Disciplina:</strong> ${cultor.disciplina}</p>
            <p><strong>Municipio:</strong> ${cultor.municipio}, ${cultor.parroquia}</p>
            <div class="cultor-actions">
                <button onclick="editCultor(${cultor.id})">Editar</button>
                <button onclick="deleteCultor(${cultor.id})">Eliminar</button>
            </div>
        `;
        cultoresGrid.appendChild(cultorCard);
    });
}

function getAreaTematicaName(area) {
    const areas = {
        'musica': 'Música',
        'danza': 'Danza',
        'teatro': 'Teatro',
        'artesPlasticas': 'Artes Plásticas',
        'literatura': 'Literatura',
        'artesanias': 'Artesanías',
        'cine': 'Cine',
        'fotografia': 'Fotografía'
    };
    return areas[area] || area;
}

function showModal(cultorId = null) {
    const modal = document.getElementById('cultorModal');
    const form = document.getElementById('cultorForm');
    const title = document.getElementById('modalTitle');

    if (cultorId) {
        const cultor = cultores.find(c => c.id === cultorId);
        if (cultor) {
            document.getElementById('cultorNombre').value = cultor.nombresApellidos;
            document.getElementById('cultorTelefono').value = cultor.telefono;
            document.getElementById('cultorCedula').value = cultor.cedula;
            document.getElementById('cultorCorreo').value = cultor.correo;
            document.getElementById('cultorAreaTematica').value = cultor.areaTematica;
            document.getElementById('cultorComuna').value = cultor.comuna;
            document.getElementById('cultorMunicipio').value = cultor.municipio;
            document.getElementById('cultorParroquia').value = cultor.parroquia;
            document.getElementById('cultorDisciplina').value = cultor.disciplina;
            document.getElementById('cultorCarnetPatria').value = cultor.carnetPatria;
            document.getElementById('cultorDireccion').value = cultor.direccion;
            document.getElementById('cultorLugarNacimiento').value = cultor.lugarNacimiento;
            document.getElementById('cultorFechaNacimiento').value = cultor.fechaNacimiento;
            document.getElementById('cultorEdad').value = cultor.edad;
            document.getElementById('cultorTrayectoria').value = cultor.trayectoria;
            document.getElementById('cultorOrganizacion').value = cultor.organizacion;
            form.dataset.cultorId = cultorId;
            title.textContent = 'Editar Cultor';
        }
    } else {
        form.reset();
        delete form.dataset.cultorId;
        title.textContent = 'Agregar Cultor';
    }

    modal.style.display = "block";
}

function saveCultor() {
    const form = document.getElementById('cultorForm');
    const cultorId = form.dataset.cultorId;

    const cultorData = {
        nombresApellidos: document.getElementById('cultorNombre').value,
        telefono: document.getElementById('cultorTelefono').value,
        cedula: document.getElementById('cultorCedula').value,
        correo: document.getElementById('cultorCorreo').value,
        areaTematica: document.getElementById('cultorAreaTematica').value,
        comuna: document.getElementById('cultorComuna').value,
        municipio: document.getElementById('cultorMunicipio').value,
        parroquia: document.getElementById('cultorParroquia').value,
        disciplina: document.getElementById('cultorDisciplina').value,
        carnetPatria: document.getElementById('cultorCarnetPatria').value,
        direccion: document.getElementById('cultorDireccion').value,
        lugarNacimiento: document.getElementById('cultorLugarNacimiento').value,
        fechaNacimiento: document.getElementById('cultorFechaNacimiento').value,
        edad: parseInt(document.getElementById('cultorEdad').value),
        trayectoria: parseInt(document.getElementById('cultorTrayectoria').value),
        organizacion: document.getElementById('cultorOrganizacion').value
    };

    if (cultorId) {
        // Editar cultor existente
        const index = cultores.findIndex(c => c.id == cultorId);
        if (index !== -1) {
            cultores[index] = { ...cultores[index], ...cultorData };
        }
    } else {
        // Agregar nuevo cultor
        const newId = Math.max(...cultores.map(c => c.id), 0) + 1;
        cultores.push({ id: newId, ...cultorData });
    }

    loadCultores();
    // Reset filters after adding/editing
    document.getElementById('filterDisciplina').value = '';
    document.getElementById('filterMunicipio').value = '';
    document.getElementById('cultorModal').style.display = "none";
}

function editCultor(cultorId) {
    showModal(cultorId);
}

async function deleteCultor(cultorId) {
    if (confirm('¿Está seguro de que desea eliminar este cultor?')) {
        try {
            const response = await fetch(`cultores.php?action=delete_cultor&id=${cultorId}`, {
                method: 'POST'
            });

            const result = await response.json();

            if (result.success) {
                alert('Cultor eliminado exitosamente');
                await loadCultoresFromPHP(); // Recargar cultores desde PHP
                loadCultores();
                // Reset filters after deleting
                document.getElementById('filterDisciplina').value = '';
                document.getElementById('filterMunicipio').value = '';
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al procesar la solicitud');
        }
    }
}

function populateFilters() {
    // Populate disciplina filter
    const disciplinaSelect = document.getElementById('filterDisciplina');
    const disciplinas = [...new Set(cultores.map(c => c.disciplina))].sort();

    disciplinas.forEach(disciplina => {
        const option = document.createElement('option');
        option.value = disciplina;
        option.textContent = disciplina;
        disciplinaSelect.appendChild(option);
    });

    // Populate municipio filter
    const municipioSelect = document.getElementById('filterMunicipio');
    const municipios = [...new Set(cultores.map(c => c.municipio))].sort();

    municipios.forEach(municipio => {
        const option = document.createElement('option');
        option.value = municipio;
        option.textContent = municipio;
        municipioSelect.appendChild(option);
    });
}

function applyFilters() {
    const disciplinaFilter = document.getElementById('filterDisciplina').value;
    const municipioFilter = document.getElementById('filterMunicipio').value;

    let filteredCultores = cultores;

    if (disciplinaFilter) {
        filteredCultores = filteredCultores.filter(c => c.disciplina === disciplinaFilter);
    }

    if (municipioFilter) {
        filteredCultores = filteredCultores.filter(c => c.municipio === municipioFilter);
    }

    loadCultores(filteredCultores);
}
