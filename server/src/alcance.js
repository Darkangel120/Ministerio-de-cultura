// Ámbito territorial por rol:
//   admin / director_general (nacional)   → todo el país
//   director_operativo (director por estado) → solo su estado
//   funcionario (responsable por municipio)  → solo su municipio
//   cultor / publico                         → sin ámbito de gestión

export const esStaff = (u) => ['admin', 'director_general', 'director_operativo', 'funcionario'].includes(u.tipo);
export const esNacional = (u) => ['admin', 'director_general'].includes(u.tipo);
export const esDirectorEstado = (u) => u.tipo === 'director_operativo';
export const esResponsableMunicipio = (u) => u.tipo === 'funcionario';

// Fragmento WHERE + parámetros para filas alcanzables en una tabla con columnas estado/municipio
export const alcance = (u) => {
  if (esNacional(u)) return { sql: 'TRUE', params: [] };
  if (esDirectorEstado(u)) return { sql: 'estado = $1', params: [u.estado] };
  return { sql: 'estado = $1 AND municipio = $2', params: [u.estado, u.municipio] };
};

// Igual que alcance pero reindexado para insertarse en una consulta cuyos parámetros del ámbito
// empiezan en el índice `base` (1-based), tras otros parámetros previos.
export const alcanceEn = (u, base) => {
  const a = alcance(u);
  if (a.sql === 'TRUE') return { sql: 'TRUE', params: [] };
  return {
    sql: `estado = $${base}` + (a.params.length > 1 ? ` AND municipio = $${base + 1}` : ''),
    params: a.params,
  };
};

// Datos que el responsable ESTAMPA en aquello que registra (integridad del dato)
export const estamparAlcance = (u) => {
  if (esResponsableMunicipio(u)) return { estado: u.estado, municipio: u.municipio };
  if (esDirectorEstado(u)) return { estado: u.estado };
  return null;
};