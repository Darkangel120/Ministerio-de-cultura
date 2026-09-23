import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  const esStaff = ['admin', 'director_general'].includes(req.usuario.tipo);
  let stats = {};

  if (esStaff) {
    const [ev, cu, pu] = await Promise.all([
      query('SELECT COUNT(*)::int AS total FROM eventos WHERE activo = 1'),
      query('SELECT COUNT(*)::int AS total FROM cultores WHERE activo = 1'),
      query('SELECT COUNT(*)::int AS total FROM foro_publicaciones WHERE activo = 1'),
    ]);
    stats = {
      eventos: ev.rows[0].total,
      cultores: cu.rows[0].total,
      publicaciones: pu.rows[0].total,
    };
  } else {
    const [misPu, misCo, ev] = await Promise.all([
      query('SELECT COUNT(*)::int AS total FROM foro_publicaciones WHERE usuario_id = $1 AND activo = 1', [req.usuario.id]),
      query('SELECT COUNT(*)::int AS total FROM foro_comentarios WHERE usuario_id = $1 AND activo = 1', [req.usuario.id]),
      query('SELECT COUNT(*)::int AS total FROM eventos WHERE activo = 1'),
    ]);
    stats = {
      publicaciones: misPu.rows[0].total,
      comentarios: misCo.rows[0].total,
      eventos: ev.rows[0].total,
    };
  }

  const prox = await query(
    'SELECT * FROM eventos WHERE activo = 1 AND fecha >= CURRENT_DATE ORDER BY fecha ASC, hora ASC LIMIT 5'
  );
  res.json({ stats, proximosEventos: prox.rows });
});

export default router;