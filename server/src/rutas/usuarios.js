import { Router } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import { query } from '../db.js';
import { esEmail, AREAS_VE } from '../validadores.js';

const router = Router();

const foto = multer({
  storage: multer.diskStorage({
    destination: process.env.UPLOAD_DIR || 'uploads',
    filename: (_req, file, cb) => cb(null, `foto-${crypto.randomBytes(8).toString('hex')}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: Number(process.env.MAX_FILE_SIZE) || 5242880 },
  fileFilter: (_req, file, cb) => {
    if (!['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(path.extname(file.originalname).toLowerCase())) {
      return cb(new Error('Solo se permiten imágenes'));
    }
    cb(null, true);
  },
});

const JERARQUIA = {
  admin: ['admin', 'director_general', 'director_operativo', 'funcionario'],
  director_general: ['director_operativo', 'funcionario'],
  director_operativo: ['funcionario'],
};

router.post('/', async (req, res) => {
  if (!JERARQUIA[req.usuario.tipo]) return res.status(403).json({ error: 'No autorizado para crear usuarios' });
  const { nombre_completo, email, telefono, tipo_usuario, password, estado, municipio } = req.body || {};
  if (!JERARQUIA[req.usuario.tipo].includes(tipo_usuario)) {
    return res.status(403).json({ error: 'Tipo de usuario no permitido para su rol' });
  }
  if (!nombre_completo?.trim() || !esEmail(email)) return res.status(400).json({ error: 'Nombre y correo válidos son obligatorios' });
  if (typeof password !== 'string' || password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener mínimo 6 caracteres' });

  const esTerritorial = ['director_operativo', 'funcionario'].includes(tipo_usuario);
  const estadoOk = estado?.trim() && AREAS_VE.includes(estado.trim());
  if (esTerritorial && !estadoOk) return res.status(400).json({ error: 'Seleccione un estado válido para el ámbito territorial' });
  if (tipo_usuario === 'funcionario' && !municipio?.trim()) return res.status(400).json({ error: 'El municipio es obligatorio para un responsable por municipio' });
  if (req.usuario.tipo === 'director_operativo' && estado?.trim() !== req.usuario.estado) {
    return res.status(403).json({ error: 'Solo puede crear responsables de su estado' });
  }

  const exist = await query('SELECT id FROM usuarios WHERE email = $1', [email.trim()]);
  if (exist.rows.length) return res.status(409).json({ error: 'El correo ya está registrado' });
  const hash = await bcrypt.hash(password, 10);
  const r = await query(
    `INSERT INTO usuarios (nombre_completo, email, telefono, tipo_usuario, estado, municipio, password_hash) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, nombre_completo, email, tipo_usuario, estado, municipio`,
    [nombre_completo.trim(), email.trim(), telefono?.trim() || null, tipo_usuario, esTerritorial ? estado.trim() : null, tipo_usuario === 'funcionario' ? municipio.trim() : null, hash]
  );
  res.status(201).json({ usuario: r.rows[0] });
});

router.get('/me', async (req, res) => {
  const u = await query('SELECT id, nombre_completo, email, telefono, tipo_usuario, estado, municipio, foto_url, fecha_registro FROM usuarios WHERE id = $1', [req.usuario.id]);
  if (!u.rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
  const cultor = await query('SELECT * FROM cultores WHERE correo = $1 AND activo = 1', [u.rows[0].email]);
  res.json({ usuario: u.rows[0], cultor: cultor.rows[0] || null });
});

router.post('/me/foto', foto.single('foto'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Debes adjuntar una imagen' });
  const r = await query(
    'UPDATE usuarios SET foto_url = $1 WHERE id = $2 RETURNING id, nombre_completo, email, telefono, tipo_usuario, estado, municipio, foto_url',
    [`/uploads/${req.file.filename}`, req.usuario.id]
  );
  res.json({ usuario: r.rows[0] });
});

router.put('/me', async (req, res) => {
  const { nombre_completo, telefono } = req.body || {};
  if (!nombre_completo?.trim()) return res.status(400).json({ error: 'Nombre obligatorio' });
  const r = await query(
    'UPDATE usuarios SET nombre_completo = $1, telefono = $2 WHERE id = $3 RETURNING id, nombre_completo, email, telefono, tipo_usuario, estado, municipio, foto_url',
    [nombre_completo.trim(), telefono?.trim() || null, req.usuario.id]
  );
  res.json({ usuario: r.rows[0] });
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'ID inválido' });
  const u = await query('SELECT id, nombre_completo, email, telefono, tipo_usuario, estado, municipio, foto_url, fecha_registro FROM usuarios WHERE id = $1 AND activo = 1', [id]);
  if (!u.rows.length) return res.status(404).json({ error: 'Perfil no encontrado' });
  const usuario = u.rows[0];
  const [cultor, posts, totalCom, totalLikes, stats] = await Promise.all([
    query('SELECT * FROM cultores WHERE correo = $1 AND activo = 1', [usuario.email]),
    query(
      `SELECT fp.*, u.nombre_completo AS autor_nombre,
        (SELECT COUNT(*) FROM foro_likes WHERE publicacion_id = fp.id)::int AS likes_count,
        (SELECT COUNT(*) FROM foro_comentarios WHERE publicacion_id = fp.id AND activo = 1)::int AS comments_count
       FROM foro_publicaciones fp LEFT JOIN usuarios u ON u.id = fp.usuario_id
       WHERE fp.usuario_id = $1 AND fp.activo = 1 ORDER BY fp.fecha_publicacion DESC`,
      [id]
    ),
    query('SELECT COUNT(*)::int AS total FROM foro_comentarios WHERE usuario_id = $1 AND activo = 1', [id]),
    query('SELECT COUNT(*)::int AS total FROM foro_likes WHERE publicacion_id IN (SELECT id FROM foro_publicaciones WHERE usuario_id = $1) AND usuario_id != $1', [id]),
    query('SELECT COUNT(*)::int AS total FROM foro_publicaciones WHERE usuario_id = $1 AND activo = 1', [id]),
  ]);
  res.json({
    usuario,
    cultor: cultor.rows[0] || null,
    publicaciones: posts.rows,
    stats: {
      comentarios: totalCom.rows[0].total,
      likes_recibidos: totalLikes.rows[0].total,
      publicaciones: stats.rows[0].total,
    },
  });
});

export default router;