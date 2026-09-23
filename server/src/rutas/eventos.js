import { Router } from 'express';
import { query } from '../db.js';
import { autenticar, autenticarOpcional } from '../auth.js';
import { esStaff, esNacional, alcance, alcanceEn, estamparAlcance } from '../alcance.js';
import {
  AREAS_VE, TIPOS_ORGANIZACION, CARGOS_RESPONSABLE, TIPOS_ACTIVIDAD,
  DISCIPLINAS_EVENTO, OBJETIVOS_TRANSFORMADORES, MESES, PARTICIPAR_KEYS, numeroEntero,
} from '../validadores.js';

const router = Router();

const validarEvento = (b) => {
  const e = {};
  const req = [
    'estado', 'municipio', 'parroquia', 'organizacion', 'direccion', 'consejo_comunal',
    'nombre_comuna', 'vocero_nombre', 'vocero_cedula', 'vocero_telefono',
    'responsable_nombre', 'responsable_cedula', 'responsable_telefono', 'nombre_actividad',
  ];
  for (const k of req) {
    if (!b[k]?.trim()) return { error: `Campo obligatorio faltante: ${k}` };
    e[k] = b[k].trim();
  }
  if (!AREAS_VE.includes(e.estado)) return { error: 'Estado inválido' };
  if (!TIPOS_ORGANIZACION.includes(b.tipo_organizacion || 'comuna')) return { error: 'Tipo de organización inválido' };
  if (!CARGOS_RESPONSABLE.includes(b.responsable_cargo)) return { error: 'Cargo inválido' };
  if (!TIPOS_ACTIVIDAD.includes(b.tipo_actividad)) return { error: 'Tipo de actividad inválido' };
  if (!DISCIPLINAS_EVENTO.includes(b.disciplina)) return { error: 'Disciplina inválida' };
  if (!OBJETIVOS_TRANSFORMADORES.includes(b.objetivo)) return { error: 'Objetivo transformador inválido' };
  const mes = Number(b.mes);
  if (!MESES.includes(mes)) return { error: 'Mes inválido' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.fecha)) return { error: 'Fecha inválida' };
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(b.hora)) return { error: 'Hora inválida' };
  const duracion = numeroEntero(b.duracion, 1);
  if (duracion === null) return { error: 'Duración inválida' };
  const part = {};
  for (const k of PARTICIPAR_KEYS) {
    const n = numeroEntero(b[k]);
    if (n === null) return { error: `Participación inválida en ${k}` };
    part[k] = n;
  }
  e.tipo_organizacion = b.tipo_organizacion || 'comuna';
  e.responsable_cargo = b.responsable_cargo;
  e.tipo_actividad = b.tipo_actividad;
  e.disciplina = b.disciplina;
  e.objetivo = b.objetivo;
  e.ubicacion_exacta = b.ubicacion_exacta?.trim() || null;
  e.nombre_consejo = b.nombre_consejo?.trim() || null;
  e.mes = mes; e.fecha = b.fecha; e.hora = b.hora;
  e.duracion = duracion;
  Object.assign(e, part);
  return { evento: e };
};

const COLUMNAS_VALIDAS_ORDEN = { fecha: 1, nombre_actividad: 1, estado: 1, municipio: 1 };

// Vista de calendario: el personal de gestión ve solo su ámbito; el público ve todo el país
const vistaSegunAlcance = (u) => (esStaff(u) ? alcance(u) : { sql: 'TRUE', params: [] });

router.get('/', autenticarOpcional, async (req, res) => {
  const mes = Number(req.query.mes);
  const anio = Number(req.query.anio);
  const orderBy = COLUMNAS_VALIDAS_ORDEN[req.query.orderBy] ? req.query.orderBy : 'fecha';
  const dir = req.query.dir === 'asc' ? 'ASC' : 'DESC';
  const vista = vistaSegunAlcance(req.usuario);
  if (mes && MESES.includes(mes) && anio) {
    const r = await query(
      `SELECT * FROM eventos WHERE activo = 1 AND ${vista.sql} AND mes = $${vista.params.length + 1} AND EXTRACT(YEAR FROM fecha) = $${vista.params.length + 2} ORDER BY fecha ${dir}, hora ASC`,
      [...vista.params, mes, anio]
    );
    return res.json({ eventos: r.rows });
  }
  const r = await query(
    `SELECT * FROM eventos WHERE activo = 1 AND ${vista.sql} ORDER BY fecha ${dir}, hora ASC`,
    vista.params
  );
  res.json({ eventos: r.rows });
});

router.get('/nuevos', autenticarOpcional, async (_req, res) => {
  const r = await query('SELECT * FROM eventos WHERE activo = 1 AND fecha >= CURRENT_DATE ORDER BY fecha ASC, hora ASC LIMIT 3');
  res.json({ eventos: r.rows });
});

// lecturas anteriores son públicas; a partir de aquí todo requiere sesión
router.use(autenticar);

router.post('/', async (req, res) => {
  if (!esStaff(req.usuario)) return res.status(403).json({ error: 'No autorizado' });
  const { evento, error } = validarEvento(req.body || {});
  if (error) return res.status(400).json({ error });
  Object.assign(evento, estamparAlcance(req.usuario));
  const cols = Object.keys(evento);
  const vals = cols.map((_, i) => `$${i + 2}`);
  const r = await query(
    `INSERT INTO eventos (correo_usuario, ${cols.join(', ')}) VALUES ($1, ${vals.join(', ')}) RETURNING *`,
    [req.usuario.email, ...cols.map((c) => evento[c])]
  );
  res.status(201).json({ evento: r.rows[0] });
});

router.put('/:id', async (req, res) => {
  if (!esStaff(req.usuario)) return res.status(403).json({ error: 'No autorizado' });
  const id = Number(req.params.id);
  const { evento, error } = validarEvento(req.body || {});
  if (error) return res.status(400).json({ error });
  Object.assign(evento, estamparAlcance(req.usuario));
  const esNac = esNacional(req.usuario);
  const base = esNac ? 2 : 3;
  const sets = Object.keys(evento).map((c, i) => `${c} = $${i + base}`);
  const alc = esNac ? { sql: 'TRUE', params: [] } : alcanceEn(req.usuario, base + sets.length);
  const prop = esNac ? '' : ' AND correo_usuario = $2';
  const r = await query(
    `UPDATE eventos SET ${sets.join(', ')} WHERE id = $1 AND activo = 1 AND ${alc.sql}${prop} RETURNING *`,
    esNac
      ? [id, ...Object.keys(evento).map((c) => evento[c])]
      : [id, req.usuario.email, ...Object.keys(evento).map((c) => evento[c]), ...alc.params]
  );
  if (!r.rows.length) return res.status(404).json({ error: 'Evento no encontrado' });
  res.json({ evento: r.rows[0] });
});

const actualizarEstado = (estado) => async (req, res) => {
  if (!esStaff(req.usuario)) return res.status(403).json({ error: 'No autorizado' });
  const id = Number(req.params.id);
  const esNac = esNacional(req.usuario);
  const alc = esNac ? { sql: 'TRUE', params: [] } : alcanceEn(req.usuario, 3);
  const prop = esNac ? '' : ' AND correo_usuario = $2';
  const r = await query(
    `UPDATE eventos SET estado_ejecucion = '${estado}' WHERE id = $1 AND activo = 1 AND ${alc.sql}${prop} RETURNING *`,
    esNac ? [id] : [id, req.usuario.email, ...alc.params]
  );
  if (!r.rows.length) return res.status(404).json({ error: 'Evento no encontrado' });
  res.json({ evento: r.rows[0] });
};

router.post('/:id/ejecutar', actualizarEstado('reportada'));
router.post('/:id/cancelar', actualizarEstado('cancelada'));

router.delete('/:id', async (req, res) => {
  if (!esStaff(req.usuario)) return res.status(403).json({ error: 'No autorizado' });
  const id = Number(req.params.id);
  const esNac = esNacional(req.usuario);
  const alc = esNac ? { sql: 'TRUE', params: [] } : alcanceEn(req.usuario, 3);
  const prop = esNac ? '' : ' AND correo_usuario = $2';
  const r = await query(
    `UPDATE eventos SET activo = 0 WHERE id = $1 AND activo = 1 AND ${alc.sql}${prop} RETURNING id`,
    esNac ? [id] : [id, req.usuario.email, ...alc.params]
  );
  if (!r.rows.length) return res.status(404).json({ error: 'Evento no encontrado' });
  res.json({ ok: true });
});

export default router;