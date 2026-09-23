import { Router } from 'express';
import { query } from '../db.js';
import { esStaff, esNacional, alcance, alcanceEn, estamparAlcance } from '../alcance.js';
import { AREAS_TEMATICAS, numeroEntero } from '../validadores.js';

const router = Router();

const validarFicha = (b) => {
  const req = ['nombres_apellidos', 'telefono', 'cedula', 'correo', 'disciplina', 'comuna', 'municipio', 'parroquia', 'carnet_patria', 'direccion', 'lugar_nacimiento', 'fecha_nacimiento'];
  const f = {};
  for (const k of req) {
    if (!b[k]?.trim()) return { error: `Campo obligatorio faltante: ${k}` };
    f[k] = b[k].trim();
  }
  if (!AREAS_TEMATICAS.includes(b.area_tematica)) return { error: 'Área temática inválida' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.fecha_nacimiento)) return { error: 'Fecha de nacimiento inválida' };
  for (const k of ['edad', 'trayectoria_anios']) {
    const n = numeroEntero(b[k]);
    if (n === null) return { error: `${k} inválido` };
    f[k] = n;
  }
  f.area_tematica = b.area_tematica;
  f.estado = b.estado?.trim() || '';
  f.organizacion = b.organizacion?.trim() || '';
  return { ficha: f };
};

router.get('/', async (req, res) => {
  const alc = esStaff(req.usuario) ? alcance(req.usuario) : { sql: 'correo = $1', params: [req.usuario.email] };
  const cond = [`activo = 1 AND ${alc.sql}`];
  const params = [...alc.params];
  let i = params.length + 1;
  if (req.query.area_tematica) { cond.push(`area_tematica = $${i++}`); params.push(req.query.area_tematica); }
  if (req.query.estado) { cond.push(`estado = $${i++}`); params.push(req.query.estado); }
  if (req.query.municipio) { cond.push(`municipio = $${i++}`); params.push(req.query.municipio); }
  if (req.query.q) { cond.push(`(nombres_apellidos ILIKE $${i++} OR cedula ILIKE $${i++})`); params.push(`%${req.query.q}%`, `%${req.query.q}%`); }
  const r = await query(`SELECT * FROM cultores WHERE ${cond.join(' AND ')} ORDER BY nombres_apellidos ASC`, params);
  res.json({ cultores: r.rows });
});

router.get('/opciones', async (req, res) => {
  const alc = esStaff(req.usuario) ? alcance(req.usuario) : { sql: 'TRUE', params: [] };
  const [areas, muns, ests] = await Promise.all([
    query(`SELECT DISTINCT area_tematica FROM cultores WHERE activo = 1 AND ${alc.sql} ORDER BY area_tematica`, alc.params),
    query(`SELECT DISTINCT municipio FROM cultores WHERE activo = 1 AND ${alc.sql} ORDER BY municipio`, alc.params),
    query(`SELECT DISTINCT estado FROM cultores WHERE activo = 1 AND ${alc.sql} ORDER BY estado`, alc.params),
  ]);
  res.json({ areas: areas.rows.map((r) => r.area_tematica), municipios: muns.rows.map((r) => r.municipio), estados: ests.rows.map((r) => r.estado) });
});

router.get('/:id', async (req, res) => {
  const alc = esStaff(req.usuario) ? alcanceEn(req.usuario, 2) : { sql: 'correo = $2', params: [req.usuario.email] };
  const r = await query(`SELECT * FROM cultores WHERE id = $1 AND activo = 1 AND ${alc.sql}`, [Number(req.params.id), ...alc.params]);
  if (!r.rows.length) return res.status(404).json({ error: 'Cultor no encontrado' });
  res.json({ cultor: r.rows[0] });
});

router.use(async (req, res, next) => {
  if (!['POST', 'PUT', 'DELETE'].includes(req.method)) return next();
  if (!esStaff(req.usuario)) return res.status(403).json({ error: 'Solo personal autorizado' });
  next();
});

router.post('/', async (req, res) => {
  const { ficha, error } = validarFicha(req.body || {});
  if (error) return res.status(400).json({ error });
  Object.assign(ficha, estamparAlcance(req.usuario));
  const exist = await query('SELECT id FROM cultores WHERE cedula = $1 OR correo = $2', [ficha.cedula, ficha.correo]);
  if (exist.rows.length) return res.status(409).json({ error: 'Cédula o correo ya registrados' });
  const cols = Object.keys(ficha);
  const vals = cols.map((_, i) => `$${i + 1}`);
  const r = await query(`INSERT INTO cultores (${cols.join(', ')}) VALUES (${vals.join(', ')}) RETURNING *`, cols.map((c) => ficha[c]));
  res.status(201).json({ cultor: r.rows[0] });
});

router.put('/:id', async (req, res) => {
  const { ficha, error } = validarFicha(req.body || {});
  if (error) return res.status(400).json({ error });
  Object.assign(ficha, estamparAlcance(req.usuario));
  const id = Number(req.params.id);
  const exist = await query('SELECT id FROM cultores WHERE (cedula = $1 OR correo = $2) AND id != $3', [ficha.cedula, ficha.correo, id]);
  if (exist.rows.length) return res.status(409).json({ error: 'Cédula o correo ya registrados' });
  const sets = Object.keys(ficha).map((c, i) => `${c} = $${i + 1}`);
  const alc = esStaff(req.usuario) ? alcanceEn(req.usuario, sets.length + 2) : { sql: 'TRUE', params: [] };
  const r = await query(
    `UPDATE cultores SET ${sets.join(', ')} WHERE id = $${sets.length + 1} AND ${alc.sql} RETURNING *`,
    [...Object.keys(ficha).map((c) => ficha[c]), id, ...alc.params]
  );
  if (!r.rows.length) return res.status(404).json({ error: 'Cultor no encontrado' });
  res.json({ cultor: r.rows[0] });
});

router.delete('/:id', async (req, res) => {
  const alc = alcanceEn(req.usuario, 2);
  const r = await query(`UPDATE cultores SET activo = 0 WHERE id = $1 AND activo = 1 AND ${alc.sql} RETURNING id`, [Number(req.params.id), ...alc.params]);
  if (!r.rows.length) return res.status(404).json({ error: 'Cultor no encontrado' });
  res.json({ ok: true });
});

export default router;