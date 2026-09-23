import jwt from 'jsonwebtoken';

export const COOKIE_NOMBRE = 'mc_token';

export const firmarToken = (usuario) =>
  jwt.sign(
    { id: usuario.id, email: usuario.email, tipo: usuario.tipo_usuario, nombre: usuario.nombre_completo },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );

export const autenticar = (req, res, next) => {
  const token = req.cookies?.[COOKIE_NOMBRE];
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Sesión inválida o expirada' });
  }
};

export const autorizarRoles = (...roles) => (req, res, next) => {
  if (!req.usuario || !roles.includes(req.usuario.tipo)) {
    return res.status(403).json({ error: 'No autorizado' });
  }
  next();
};