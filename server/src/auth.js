import jwt from 'jsonwebtoken';
import { query } from './db.js';

export const COOKIE_NOMBRE = 'mc_token';

export const firmarToken = (usuario) =>
  jwt.sign(
    { id: usuario.id, email: usuario.email, tipo: usuario.tipo_usuario, nombre: usuario.nombre_completo },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );

const leerUsuario = async (claims) => {
  if (!claims?.id) return null;
  const r = await query(
    'SELECT id, email, tipo_usuario AS tipo, nombre_completo AS nombre, estado, municipio FROM usuarios WHERE id = $1 AND activo = 1',
    [claims.id]
  );
  return r.rows[0] || null;
};

const hidratar = (claims) => leerUsuario(claims);

export const autenticar = (req, res, next) => {
  const token = req.cookies?.[COOKIE_NOMBRE];
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  try {
    const claims = jwt.verify(token, process.env.JWT_SECRET);
    hidratar(claims)
      .then((u) => {
        if (!u) return res.status(401).json({ error: 'Sesión inválida o expirada' });
        req.usuario = u;
        next();
      })
      .catch(() => res.status(500).json({ error: 'Error de sesión' }));
  } catch {
    return res.status(401).json({ error: 'Sesión inválida o expirada' });
  }
};

// No rechaza: deja req.usuario solo si hay sesión válida (rutas públicas con vista por rol)
export const autenticarOpcional = (req, _res, next) => {
  const token = req.cookies?.[COOKIE_NOMBRE];
  if (!token) return next();
  try {
    const claims = jwt.verify(token, process.env.JWT_SECRET);
    hidratar(claims).then((u) => {
      if (u) req.usuario = u;
      next();
    }).catch(() => next());
  } catch {
    next();
  }
};

export const autorizarRoles = (...roles) => (req, res, next) => {
  if (!req.usuario || !roles.includes(req.usuario.tipo)) {
    return res.status(403).json({ error: 'No autorizado' });
  }
  next();
};