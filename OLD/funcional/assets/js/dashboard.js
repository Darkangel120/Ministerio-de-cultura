// Funcionalidad del dashboard integrada con PHP
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard cargado');
    loadDashboardStats();
});

async function loadDashboardStats() {
    try {
        const response = await fetch('dashboard.php?action=get_stats');
        const data = await response.json();

        if (data.success) {
            // Actualizar elementos del DOM con datos reales
            updateDashboardUI(data.stats);
        } else {
            console.error('Error cargando estadísticas:', data.message);
            // Mostrar datos por defecto o mensaje de error
            showDefaultStats();
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        showDefaultStats();
    }
}

function updateDashboardUI(stats) {
    // Actualizar contadores en el dashboard
    const elementos = {
        'eventos-counter': stats.eventosProximos || 0,
        'cultores-counter': stats.cultoresRegistrados || 0,
        'reportes-counter': stats.reportesGenerados || 0
    };

    Object.keys(elementos).forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = elementos[id];
        }
    });
}

function showDefaultStats() {
    // Mostrar estadísticas por defecto cuando falla la carga
    updateDashboardUI({
        eventosProximos: 0,
        cultoresRegistrados: 0,
        reportesGenerados: 0
    });
}
