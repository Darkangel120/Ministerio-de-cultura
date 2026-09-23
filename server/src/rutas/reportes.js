import { Router } from 'express';
import { query } from '../db.js';
import { esStaff, alcance } from '../alcance.js';

const router = Router();

// Fragmento WHERE del ámbito del usuario para una tabla con columnas estado/municipio,
// reindexando los parámetros a partir de `params`. Devuelve cuántos parámetros consumió.
const condAlcance = (u, params) => {
  const alc = alcance(u);
  if (alc.sql === 'TRUE') return { sql: 'TRUE', scope: 0 };
  const i = params.length;
  params.push(...alc.params);
  return { sql: `estado = $${i + 1}` + (alc.params.length > 1 ? ` AND municipio = $${i + 2}` : ''), scope: alc.params.length };
};

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
  const alc = alcance(req.usuario);
  const base = `activo = 1 AND ${alc.sql}`;
  const [resp, muns, evs, areas] = await Promise.all([
    query(`SELECT DISTINCT responsable_nombre AS r FROM eventos WHERE ${base} ORDER BY r`, alc.params),
    query(`SELECT DISTINCT municipio FROM eventos WHERE ${base} ORDER BY municipio`, alc.params),
    query(`SELECT DISTINCT id, nombre_actividad FROM eventos WHERE ${base} ORDER BY id`, alc.params),
    query(`SELECT DISTINCT area_tematica FROM cultores WHERE ${base} ORDER BY area_tematica`, alc.params),
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
  if (!esStaff(req.usuario)) return res.status(403).json({ error: 'No autorizado' });
  const { tipo = 'eventos', vista = 'detallado', ...filtros } = req.body || {};
  const condiciones = [];
  const params = [];
  let queryStr = '';

  const alc = condAlcance(req.usuario, params);

  if (tipo === 'eventos' || tipo === 'actividad_ejecutada' || tipo === 'actividad_reportada') {
    const where = [`activo = 1 AND ${alc.sql}`];
    if (tipo !== 'eventos') {
      const estado = tipo === 'actividad_ejecutada' ? 'ejecutado' : 'reportada';
      params.push(estado);
      where.push(`estado_ejecucion = $${params.length}`);
    } else {
      APPLY(condiciones, params, ['responsable', 'municipio', 'id_evento', 'fecha_desde', 'fecha_hasta'], filtros);
      const extra = condiciones[0] ? condiciones[0].slice(6) : 'TRUE';
      condiciones[0] = `WHERE ${where.join(' AND ')} AND ${extra}`;
    }
    if (tipo === 'eventos') {
      queryStr = `SELECT *, (ninos + ninas + jovenes_masculinos + jovenes_femeninas + adultos_masculinos + adultos_femeninas) AS asistentes
                  FROM eventos ${condiciones[0]} ORDER BY fecha DESC`;
    } else {
      queryStr = `SELECT *, (ninos + ninas + jovenes_masculinos + jovenes_femeninas + adultos_masculinos + adultos_femeninas) AS asistentes
                  FROM eventos WHERE ${where.join(' AND ')} ORDER BY fecha DESC`;
    }
  } else if (tipo === 'cultores') {
    const where = [`activo = 1 AND ${alc.sql}`];
    if (filtros.area_tematica) { params.push(filtros.area_tematica); where.push(`area_tematica = $${params.length}`); }
    if (filtros.fecha_desde) { params.push(filtros.fecha_desde); where.push(`fecha_registro >= $${params.length}`); }
    if (filtros.fecha_hasta) { params.push(filtros.fecha_hasta); where.push(`fecha_registro <= $${params.length}`); }
    queryStr = `SELECT * FROM cultores WHERE ${where.join(' AND ')} ORDER BY nombres_apellidos`;
  } else if (tipo === 'usuarios') {
    const where = [`activo = 1 AND ${alc.sql}`];
    if (filtros.tipo_usuario) { params.push(filtros.tipo_usuario); where.push(`tipo_usuario = $${params.length}`); }
    if (filtros.fecha_desde) { params.push(filtros.fecha_desde); where.push(`fecha_registro >= $${params.length}`); }
    if (filtros.fecha_hasta) { params.push(filtros.fecha_hasta); where.push(`fecha_registro <= $${params.length}`); }
    condiciones.push(`WHERE ${where.join(' AND ')}`);
    queryStr = `SELECT id, nombre_completo, email, telefono, tipo_usuario, estado, municipio, fecha_registro, activo FROM usuarios ${condiciones[0]} ORDER BY fecha_registro DESC`;
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

  const distParams = params.slice(0, alc.scope);
  const [porArea, porDisciplina] = await Promise.all([
    query(`SELECT area_tematica, COUNT(*)::int AS total FROM cultores WHERE activo = 1 AND ${alc.sql} GROUP BY area_tematica ORDER BY area_tematica`, distParams),
    query(`SELECT disciplina, COUNT(*)::int AS total FROM eventos WHERE activo = 1 AND ${alc.sql} GROUP BY disciplina ORDER BY disciplina`, distParams),
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