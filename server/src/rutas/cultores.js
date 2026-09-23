import { Router } from 'express';
import { query } from '../db.js';
import { AREAS_TEMATICAS, numeroEntero } from '../validadores.js';

const router = Router();
const esStaff = (u) => ['admin', 'director_general', 'director_operativo', 'funcionario'].includes(u.tipo);

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
  f.organizacion = b.organizacion?.trim() || '';
  return { ficha: f };
};

router.get('/', async (req, res) => {
  const cond = ['activo = 1'];
  const params = [];
  let i = 1;
  if (req.query.area_tematica) { cond.push(`area_tematica = $${i++}`); params.push(req.query.area_tematica); }
  if (req.query.municipio) { cond.push(`municipio = $${i++}`); params.push(req.query.municipio); }
  if (req.query.q) { cond.push(`(nombres_apellidos ILIKE $${i++} OR cedula ILIKE $${i++})`); params.push(`%${req.query.q}%`, `%${req.query.q}%`); }
  const r = await query(`SELECT * FROM cultores WHERE ${cond.join(' AND ')} ORDER BY nombres_apellidos ASC`, params);
  res.json({ cultores: r.rows });
});

router.get('/opciones', async (_req, res) => {
  const [areas, muns] = await Promise.all([
    query('SELECT DISTINCT area_tematica FROM cultores WHERE activo = 1 ORDER BY area_tematica'),
    query('SELECT DISTINCT municipio FROM cultores WHERE activo = 1 ORDER BY municipio'),
  ]);
  res.json({ areas: areas.rows.map((r) => r.area_tematica), municipios: muns.rows.map((r) => r.municipio) });
});

router.get('/:id', async (req, res) => {
  const r = await query('SELECT * FROM cultores WHERE id = $1 AND activo = 1', [req.params.id]);
  if (!r.rows.length) return res.status(404).json({ error: 'Cultor no encontrado' });
  res.json({ cultor: r.rows[0] });
});

router.post('/', esStaff ? async (req, res) => {
  const { ficha, error } = validarFicha(req.body || {});
  if (error) return res.status(400).json({ error });
  const exist = await query('SELECT id FROM cultores WHERE cedula = $1 OR correo = $2', [ficha.cedula, ficha.correo]);
  if (exist.rows.length) return res.status(409).json({ error: 'Cédula o correo ya registrados' });
  const cols = Object.keys(ficha);
  const vals = cols.map((_, i) => `$${i + 1}`);
  const r = await query(`INSERT INTO cultores (${cols.join(', ')}) VALUES (${vals.join(', ')}) RETURNING *`, cols.map((c) => ficha[c]));
  res.status(201).json({ cultor: r.rows[0] });
} : async (req, res) => res.status(403).json({ error: 'No autorizado' }));

router.put('/:id', esStaff ? async (req, res) => {
  const { ficha, error } = validarFicha(req.body || {});
  if (error) return res.status(400).json({ error });
  const exist = await query('SELECT id FROM cultores WHERE (cedula = $1 OR correo = $2) AND id != $3', [ficha.cedula, ficha.correo, req.params.id]);
  if (exist.rows.length) return res.status(409).json({ error: 'Cédula o correo ya registrados' });
  const sets = Object.keys(ficha).map((c, i) => `${c} = $${i + 1}`);
  const r = await query(`UPDATE cultores SET ${sets.join(', ')} WHERE id = $${sets.length + 1} RETURNING *`, [...Object.keys(ficha).map((c) => ficha[c]), req.params.id]);
  if (!r.rows.length) return res.status(404).json({ error: 'Cultor no encontrado' });
  res.json({ cultor: r.rows[0] });
} : async (req, res) => res.status(403).json({ error: 'No autorizado' }));

router.delete('/:id', esStaff ? async (req, res) => {
  const r = await query('UPDATE cultores SET activo = 0 WHERE id = $1 AND activo = 1 RETURNING id', [req.params.id]);
  if (!r.rows.length) return res.status(404).json({ error: 'Cultor no encontrado' });
  res.json({ ok: true });
} : async (req, res) => res.status(403).json({ error: 'No autorizado' }));

export default router;