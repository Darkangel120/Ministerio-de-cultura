import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import { query } from '../db.js';
import { autenticar } from '../auth.js';
import { CATEGORIAS_FORO } from '../validadores.js';

const router = Router();

const EXT_TIPO = {
  '.jpg': 'imagen', '.jpeg': 'imagen', '.png': 'imagen', '.gif': 'imagen', '.webp': 'imagen',
  '.mp4': 'video', '.webm': 'video', '.mov': 'video',
  '.mp3': 'audio', '.wav': 'audio', '.ogg': 'audio',
};
const MAX_BYTES = Number(process.env.MAX_FILE_SIZE) || 5242880;
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, file, cb) => cb(null, `${crypto.randomBytes(8).toString('hex')}${path.extname(file.originalname).toLowerCase()}`),
});
const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!EXT_TIPO[ext]) {
      const err = new Error('Extensión no permitida');
      err.code = 'FORMATO_NO_PERMITIDO';
      return cb(err);
    }
    cb(null, true);
  },
});

const feedSelect = `
  SELECT fp.*, u.nombre_completo AS autor_nombre, u.foto_url AS autor_foto,
    (SELECT COUNT(*) FROM foro_likes WHERE publicacion_id = fp.id)::int AS likes_count,
    (SELECT COUNT(*) FROM foro_comentarios WHERE publicacion_id = fp.id AND activo = 1)::int AS comments_count,
    EXISTS (SELECT 1 FROM foro_likes fl WHERE fl.publicacion_id = fp.id AND fl.usuario_id = $1) AS mio_like
  FROM foro_publicaciones fp
  LEFT JOIN usuarios u ON u.id = fp.usuario_id
  WHERE fp.activo = 1
`;

router.get('/', async (req, res) => {
  let miId = null;
  try {
    const token = req.cookies?.mc_token;
    if (token) miId = (await import('jsonwebtoken')).verify(token, process.env.JWT_SECRET).id;
  } catch { /* sesión opcional en vista pública */ }
  const r = await query(`${feedSelect} ORDER BY fp.fecha_publicacion DESC`, [miId ?? -1]);
  res.json({ publicaciones: r.rows });
});

router.post('/publicaciones', autenticar, upload.single('archivo'), async (req, res) => {
  const { titulo, categoria, descripcion } = req.body || {};
  if (!titulo?.trim() || !CATEGORIAS_FORO.includes(categoria) || !descripcion?.trim()) {
    return res.status(400).json({ error: 'Título, categoría y descripción son obligatorios' });
  }
  let archivo_url = null, tipo_archivo = null;
  if (req.file) {
    archivo_url = `/uploads/${req.file.filename}`;
    tipo_archivo = EXT_TIPO[path.extname(req.file.originalname).toLowerCase()];
  }
  const r = await query(
    `INSERT INTO foro_publicaciones (usuario_id, titulo, categoria, descripcion, archivo_url, tipo_archivo)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [req.usuario.id, titulo.trim(), categoria, descripcion.trim(), archivo_url, tipo_archivo]
  );
  res.status(201).json({ publicacion: r.rows[0] });
});

router.put('/publicaciones/:id', autenticar, upload.single('archivo'), async (req, res) => {
  const { titulo, categoria, descripcion } = req.body || {};
  const r = await query('SELECT * FROM foro_publicaciones WHERE id = $1 AND activo = 1', [req.params.id]);
  const pub = r.rows[0];
  if (!pub) return res.status(404).json({ error: 'Publicación no encontrada' });
  if (pub.usuario_id !== req.usuario.id) return res.status(403).json({ error: 'Solo el autor puede editar' });
  if (!titulo?.trim() || !CATEGORIAS_FORO.includes(categoria) || !descripcion?.trim()) {
    return res.status(400).json({ error: 'Título, categoría y descripción son obligatorios' });
  }
  let archivo_url = pub.archivo_url, tipo_archivo = pub.tipo_archivo;
  if (req.file) {
    archivo_url = `/uploads/${req.file.filename}`;
    tipo_archivo = EXT_TIPO[path.extname(req.file.originalname).toLowerCase()];
  }
  const up = await query(
    'UPDATE foro_publicaciones SET titulo = $1, categoria = $2, descripcion = $3, archivo_url = $4, tipo_archivo = $5 WHERE id = $6 RETURNING *',
    [titulo.trim(), categoria, descripcion.trim(), archivo_url, tipo_archivo, req.params.id]
  );
  res.json({ publicacion: up.rows[0] });
});

router.delete('/publicaciones/:id', autenticar, async (req, res) => {
  const r = await query('SELECT * FROM foro_publicaciones WHERE id = $1 AND activo = 1', [req.params.id]);
  const pub = r.rows[0];
  if (!pub) return res.status(404).json({ error: 'Publicación no encontrada' });
  if (pub.usuario_id !== req.usuario.id) return res.status(403).json({ error: 'Solo el autor puede eliminar' });
  await query('UPDATE foro_publicaciones SET activo = 0 WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

router.post('/publicaciones/:id/like', autenticar, async (req, res) => {
  const pubId = Number(req.params.id);
  const usuarioId = req.usuario.id;
  const existe = await query('SELECT id FROM foro_likes WHERE publicacion_id = $1 AND usuario_id = $2', [pubId, usuarioId]);
  if (existe.rows.length) {
    await query('DELETE FROM foro_likes WHERE publicacion_id = $1 AND usuario_id = $2', [pubId, usuarioId]);
    return res.json({ liked: false });
  }
  await query('INSERT INTO foro_likes (publicacion_id, usuario_id) VALUES ($1, $2)', [pubId, usuarioId]);
  res.json({ liked: true });
});

router.get('/publicaciones/:id/comentarios', async (req, res) => {
  const r = await query(
    `SELECT fc.*, u.nombre_completo AS autor_nombre, u.foto_url AS autor_foto
     FROM foro_comentarios fc LEFT JOIN usuarios u ON u.id = fc.usuario_id
     WHERE fc.publicacion_id = $1 AND fc.activo = 1 ORDER BY fc.fecha_comentario ASC`,
    [req.params.id]
  );
  res.json({ comentarios: r.rows });
});

router.post('/publicaciones/:id/comentarios', autenticar, async (req, res) => {
  const { comentario } = req.body || {};
  if (!comentario?.trim()) return res.status(400).json({ error: 'El comentario es obligatorio' });
  const pub = await query('SELECT id FROM foro_publicaciones WHERE id = $1 AND activo = 1', [req.params.id]);
  if (!pub.rows.length) return res.status(404).json({ error: 'Publicación no encontrada' });
  const r = await query(
    `INSERT INTO foro_comentarios (publicacion_id, usuario_id, comentario) VALUES ($1, $2, $3) RETURNING *`,
    [req.params.id, req.usuario.id, comentario.trim()]
  );
  res.status(201).json({ comentario: r.rows[0] });
});

export default router;