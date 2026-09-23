import { Router } from 'express';
import { query } from '../db.js';
import { esStaff, alcance } from '../alcance.js';

const router = Router();

router.get('/', async (req, res) => {
  if (esStaff(req.usuario)) {
    const alc = alcance(req.usuario);
    const base = `activo = 1 AND ${alc.sql}`;
    const [ev, cu, pu] = await Promise.all([
      query(`SELECT COUNT(*)::int AS total FROM eventos WHERE ${base}`, alc.params),
      query(`SELECT COUNT(*)::int AS total FROM cultores WHERE ${base}`, alc.params),
      query('SELECT COUNT(*)::int AS total FROM foro_publicaciones WHERE activo = 1'),
    ]);
    const prox = await query(
      `SELECT * FROM eventos WHERE ${base} AND fecha >= CURRENT_DATE ORDER BY fecha ASC, hora ASC LIMIT 5`,
      alc.params
    );
    return res.json({
      stats: { eventos: ev.rows[0].total, cultores: cu.rows[0].total, publicaciones: pu.rows[0].total },
      proximosEventos: prox.rows,
    });
  }

  const [misPu, misCo, ev] = await Promise.all([
    query('SELECT COUNT(*)::int AS total FROM foro_publicaciones WHERE usuario_id = $1 AND activo = 1', [req.usuario.id]),
    query('SELECT COUNT(*)::int AS total FROM foro_comentarios WHERE usuario_id = $1 AND activo = 1', [req.usuario.id]),
    query('SELECT COUNT(*)::int AS total FROM eventos WHERE activo = 1'),
  ]);
  const prox = await query('SELECT * FROM eventos WHERE activo = 1 AND fecha >= CURRENT_DATE ORDER BY fecha ASC, hora ASC LIMIT 5');
  res.json({
    stats: { publicaciones: misPu.rows[0].total, comentarios: misCo.rows[0].total, eventos: ev.rows[0].total },
    proximosEventos: prox.rows,
  });
});

export default router;