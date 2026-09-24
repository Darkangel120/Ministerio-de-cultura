import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  const limite = Math.max(1, Math.min(Number(req.query.limite) || 3, 20));
  const r = await query(
    'SELECT id, titulo, contenido, imagen_url, fecha_publicacion FROM noticias WHERE activo = 1 ORDER BY fecha_publicacion DESC LIMIT $1',
    [limite]
  );
  res.json({ noticias: r.rows });
});

export default router;