import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { firmarToken, COOKIE_NOMBRE, autenticar } from '../auth.js';
import { esEmail, numeroEntero, AREAS_TEMATICAS } from '../validadores.js';

const router = Router();
const ROLE_SELF_REGISTRABLES = ['cultor', 'publico'];

const calcularEdad = (fechaNacimiento) => {
  const nac = new Date(fechaNacimiento);
  const hoy = new Date();
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
};

router.post('/registro', async (req, res) => {
  const { nombre_completo, email, telefono, tipo_usuario, password, cedula, area_tematica, disciplina, comuna, municipio, parroquia, carnet_patria, direccion, lugar_nacimiento, fecha_nacimiento, trayectoria_anios, organizacion } = req.body || {};

  if (!nombre_completo?.trim() || !esEmail(email)) return res.status(400).json({ error: 'Nombre y correo válidos son obligatorios' });
  if (typeof password !== 'string' || password.length < 8) return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres' });
  if (!ROLE_SELF_REGISTRABLES.includes(tipo_usuario)) return res.status(400).json({ error: 'Tipo de usuario no permitido en auto-registro' });

  const existe = await query('SELECT id FROM usuarios WHERE email = $1', [email.trim()]);
  if (existe.rows.length) return res.status(409).json({ error: 'El correo ya está registrado' });

  if (tipo_usuario === 'cultor') {
    if (!cedula?.trim() || !AREA_TEMATICAS.includes(area_tematica) || !disciplina?.trim() ||
        !municipio?.trim() || !parroquia?.trim() || !carnet_patria?.trim() ||
        !direccion?.trim() || !lugar_nacimiento?.trim() || !fecha_nacimiento?.trim()) {
      return res.status(400).json({ error: 'Faltan datos obligatorios de la ficha de cultor' });
    }
    const cedulaUnica = await query('SELECT id FROM cultores WHERE cedula = $1 OR correo = $2', [cedula.trim(), email.trim()]);
    if (cedulaUnica.rows.length) return res.status(409).json({ error: 'Cédula o correo ya registrado como cultor' });
  }

  const hash = await bcrypt.hash(password, 10);
  const r = await query(
    `INSERT INTO usuarios (nombre_completo, email, telefono, tipo_usuario, password_hash)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [nombre_completo.trim(), email.trim(), telefono?.trim() || null, tipo_usuario, hash]
  );
  const usuario = r.rows[0];

  if (tipo_usuario === 'cultor') {
    const edad = calcularEdad(fecha_nacimiento);
    await query(
      `INSERT INTO cultores (nombres_apellidos, telefono, cedula, correo, area_tematica, disciplina, comuna, municipio, parroquia, carnet_patria, direccion, lugar_nacimiento, fecha_nacimiento, edad, trayectoria_anios, organizacion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [nombre_completo.trim(), telefono?.trim() || '', cedula.trim(), email.trim(), area_tematica, disciplina.trim(), comuna?.trim() || '', municipio.trim(), parroquia.trim(), carnet_patria.trim(), direccion.trim(), lugar_nacimiento.trim(), fecha_nacimiento, edad, numeroEntero(trayectoria_anios, 0) ?? 0, organizacion?.trim() || '']
    );
  }

  res.cookie(COOKIE_NOMBRE, firmarToken(usuario), {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.COOKIE_SECURE === 'true',
    maxAge: 12 * 60 * 60 * 1000,
  });
  res.status(201).json({ ok: true, usuario: { id: usuario.id, nombre: usuario.nombre_completo, email: usuario.email, tipo: usuario.tipo_usuario } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!esEmail(email) || typeof password !== 'string') return res.status(400).json({ error: 'Credenciales inválidas' });
  const r = await query('SELECT * FROM usuarios WHERE email = $1 AND activo = 1', [email.trim()]);
  const usuario = r.rows[0];
  if (!usuario || !(await bcrypt.compare(password, usuario.password_hash))) {
    return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
  }
  res.cookie(COOKIE_NOMBRE, firmarToken(usuario), {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.COOKIE_SECURE === 'true',
    maxAge: 12 * 60 * 60 * 1000,
  });
  res.json({ ok: true, usuario: { id: usuario.id, nombre: usuario.nombre_completo, email: usuario.email, tipo: usuario.tipo_usuario } });
});

router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NOMBRE);
  res.json({ ok: true });
});

router.get('/me', autenticar, async (req, res) => {
  const r = await query('SELECT id, nombre_completo, email, telefono, tipo_usuario, fecha_registro FROM usuarios WHERE id = $1', [req.usuario.id]);
  if (!r.rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ usuario: r.rows[0] });
});

export default router;