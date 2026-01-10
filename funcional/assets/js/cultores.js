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

async function loadCultoresFromPHP() {
    try {
        const response = await fetch('cultores.php?action=get_cultores');
        const data = await response.json();
        cultores = data.cultores || [];
    } catch (error) {
        console.error('Error loading cultores:', error);
        cultores = [];
    }
}

function loadCultores(cultoresToShow = cultores) {
    const cultoresGrid = document.getElementById('cultoresGrid');
    cultoresGrid.innerHTML = '';

    if (cultoresToShow.length === 0) {
        cultoresGrid.innerHTML = '<div class="no-cultores"><i class="fas fa-users"></i><h3>No se encontraron cultores</h3><p>No hay cultores registrados con los filtros seleccionados.</p></div>';
        return;
    }

    cultoresToShow.forEach(cultor => {
        const cultorCard = document.createElement('div');
        cultorCard.className = 'cultor-card';
        cultorCard.innerHTML = `
            <div class="cultor-header">
                <div class="cultor-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="cultor-info">
                    <h3>${cultor.NOMBRES_APELLIDOS}</h3>
                    <p class="cultor-disciplina">${getAreaTematicaName(cultor.AREA_TEMATICA)} - ${cultor.DISCIPLINA}</p>
                </div>
            </div>
            <div class="cultor-details">
                <div class="detail-item">
                    <i class="fas fa-phone"></i>
                    <span>${cultor.TELEFONO}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-envelope"></i>
                    <span>${cultor.CORREO}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${cultor.MUNICIPIO}, ${cultor.PARROQUIA}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-building"></i>
                    <span>${cultor.ORGANIZACION}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-calendar"></i>
                    <span>${cultor.TRAYECTORIA_ANIOS} años de trayectoria</span>
                </div>
            </div>
            <div class="cultor-actions">
                <button class="btn-edit" onclick="editarCultor(${cultor.ID})">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn-delete" onclick="eliminarCultor(${cultor.ID})">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
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
    const formAction = document.getElementById('formAction');
    const cultorIdField = document.getElementById('cultorId');

    if (cultorId) {
        const cultor = cultores.find(c => c.ID == cultorId);
        if (cultor) {
            document.getElementById('nombres_apellidos').value = cultor.NOMBRES_APELLIDOS;
            document.getElementById('telefono').value = cultor.TELEFONO;
            document.getElementById('cedula').value = cultor.CEDULA;
            document.getElementById('correo').value = cultor.CORREO;
            document.getElementById('area_tematica').value = cultor.AREA_TEMATICA;
            document.getElementById('disciplina').value = cultor.DISCIPLINA;
            document.getElementById('comuna').value = cultor.COMUNA || '';
            document.getElementById('municipio').value = cultor.MUNICIPIO;
            document.getElementById('parroquia').value = cultor.PARROQUIA;
            document.getElementById('carnet_patria').value = cultor.CARNET_PATRIA;
            document.getElementById('direccion').value = cultor.DIRECCION;
            document.getElementById('lugar_nacimiento').value = cultor.LUGAR_NACIMIENTO;
            document.getElementById('fecha_nacimiento').value = cultor.FECHA_NACIMIENTO;
            document.getElementById('edad').value = cultor.EDAD;
            document.getElementById('trayectoria_anios').value = cultor.TRAYECTORIA_ANIOS;
            document.getElementById('organizacion').value = cultor.ORGANIZACION;
            formAction.value = 'edit_cultor';
            cultorIdField.value = cultorId;
            title.textContent = 'Editar Cultor';
        }
    } else {
        form.reset();
        formAction.value = 'add_cultor';
        cultorIdField.value = '';
        title.textContent = 'Agregar Cultor';
    }

    modal.style.display = "block";
}

function saveCultor() {
    // Submit the form normally to the PHP script
    document.getElementById('cultorForm').submit();
}

function editCultor(cultorId) {
    showModal(cultorId);
}

function editarCultor(cultorId) {
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

async function eliminarCultor(cultorId) {
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
    disciplinaSelect.innerHTML = '<option value="">Todas las Áreas</option>';
    const disciplinas = [...new Set(cultores.map(c => c.AREA_TEMATICA))].sort();

    disciplinas.forEach(disciplina => {
        const option = document.createElement('option');
        option.value = disciplina;
        option.textContent = getAreaTematicaName(disciplina);
        disciplinaSelect.appendChild(option);
    });

    // Populate municipio filter
    const municipioSelect = document.getElementById('filterMunicipio');
    municipioSelect.innerHTML = '<option value="">Todos los Municipios</option>';
    const municipios = [...new Set(cultores.map(c => c.MUNICIPIO))].sort();

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
        filteredCultores = filteredCultores.filter(c => c.AREA_TEMATICA === disciplinaFilter);
    }

    if (municipioFilter) {
        filteredCultores = filteredCultores.filter(c => c.MUNICIPIO === municipioFilter);
    }

    loadCultores(filteredCultores);
}
