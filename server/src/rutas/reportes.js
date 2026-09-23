import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

const APPLY = (condiciones, params, claves, cuerpo) => {
  let i = params.length + 1;
  const where = ['activo = 1'];
  for (const clave of claves) {
    const val = cuerpo[clave];
    if (!val) continue;
    if (clave === 'responsable') {
      where.push(`(nombre_actividad ILIKE $${i++} OR nombre_comuna ILIKE $${i++})`);
      params.push(`%${val}%`, `%${val}%`);
    } else if (clave === 'id_evento') {
      where.push(`id = $${i++}`);
      params.push(Number(val));
    } else if (clave === 'fecha_desde') {
      where.push(`fecha >= $${i++}`);
      params.push(val);
    } else if (clave === 'fecha_hasta') {
      where.push(`fecha <= $${i++}`);
      params.push(val);
    } else {
      where.push(`${clave} = $${i++}`);
      params.push(val);
    }
  }
  condiciones.push(`WHERE ${where.join(' AND ')}`);
};

router.get('/filtros', async (req, res) => {
  const [resp, muns, evs, areas, tipos] = await Promise.all([
    query('SELECT DISTINCT responsable_nombre AS r FROM eventos WHERE activo = 1 ORDER BY r'),
    query('SELECT DISTINCT municipio FROM eventos WHERE activo = 1 ORDER BY municipio'),
    query('SELECT DISTINCT id, nombre_actividad FROM eventos WHERE activo = 1 ORDER BY id'),
    query('SELECT DISTINCT area_tematica FROM cultores WHERE activo = 1 ORDER BY area_tematica'),
  ]);
  res.json({
    responsables: resp.rows.map((x) => x.r),
    municipios: muns.rows.map((x) => x.municipio),
    eventos: evs.rows,
    areas: areas.rows.map((x) => x.area_tematica),
    tipos_usuario: ['funcionario', 'cultor'],
  });
});

router.post('/', async (req, res) => {
  if (!['admin', 'director_general', 'director_operativo', 'funcionario'].includes(req.usuario.tipo)) {
    return res.status(403).json({ error: 'No autorizado' });
  }
  const { tipo = 'eventos', vista = 'detallado', ...filtros } = req.body || {};
  const condiciones = [];
  const params = [];
  let queryStr = '';

  if (tipo === 'eventos' || tipo === 'actividad_ejecutada' || tipo === 'actividad_reportada') {
    if (tipo !== 'eventos') {
      const estado = tipo === 'actividad_ejecutada' ? 'ejecutado' : 'reportada';
      condiciones.push(`WHERE activo = 1 AND estado_ejecucion = '${estado}'`);
    } else {
      APPLY(condiciones, params, ['responsable', 'municipio', 'id_evento', 'fecha_desde', 'fecha_hasta'], filtros);
    }
    queryStr = `SELECT *, (ninos + ninas + jovenes_masculinos + jovenes_femeninas + adultos_masculinos + adultos_femeninas) AS asistentes
                FROM eventos ${condiciones[0] || ''} ORDER BY fecha DESC`;
  } else if (tipo === 'cultores') {
    if (filtros.area_tematica || filtros.fecha_desde || filtros.fecha_hasta) {
      const where = ['activo = 1'];
      if (filtros.area_tematica) { params.push(filtros.area_tematica); where.push(`area_tematica = $${params.length}`); }
      if (filtros.fecha_desde) { params.push(filtros.fecha_desde); where.push(`fecha_registro >= $${params.length}`); }
      if (filtros.fecha_hasta) { params.push(filtros.fecha_hasta); where.push(`fecha_registro <= $${params.length}`); }
      condiciones.push(`WHERE ${where.join(' AND ')}`);
    }
    queryStr = `SELECT * FROM cultores ${condiciones[0] || ''} ORDER BY nombres_apellidos`;
  } else if (tipo === 'usuarios') {
    const where = ['activo = 1'];
    if (filtros.tipo_usuario) { params.push(filtros.tipo_usuario); where.push(`tipo_usuario = $${params.length}`); }
    if (filtros.fecha_desde) { params.push(filtros.fecha_desde); where.push(`fecha_registro >= $${params.length}`); }
    if (filtros.fecha_hasta) { params.push(filtros.fecha_hasta); where.push(`fecha_registro <= $${params.length}`); }
    condiciones.push(`WHERE ${where.join(' AND ')}`);
    queryStr = `SELECT id, nombre_completo, email, telefono, tipo_usuario, fecha_registro, activo FROM usuarios ${condiciones[0]} ORDER BY fecha_registro DESC`;
  } else {
    return res.status(400).json({ error: 'Tipo de reporte inválido' });
  }

  const r = await query(queryStr, params);
  const filas = r.rows;

  let resumen = {};
  if (vista === 'general') {
    if (tipo === 'eventos' || tipo === 'actividad_ejecutada' || tipo === 'actividad_reportada') {
      resumen = { total: filas.length, asistentes: filas.reduce((s, f) => s + Number(f.asistentes), 0) };
    } else {
      resumen = { total: filas.length };
    }
  }

  const [porArea, porDisciplina] = await Promise.all([
    query('SELECT area_tematica, COUNT(*)::int AS total FROM cultores WHERE activo = 1 GROUP BY area_tematica ORDER BY area_tematica'),
    query('SELECT disciplina, COUNT(*)::int AS total FROM eventos WHERE activo = 1 GROUP BY disciplina ORDER BY disciplina'),
  ]);

  res.json({
    tipo, vista, filas, resumen,
    distribuciones: {
      cultores_por_area: porArea.rows,
      eventos_por_disciplina: porDisciplina.rows,
    },
  });
});

export default router;