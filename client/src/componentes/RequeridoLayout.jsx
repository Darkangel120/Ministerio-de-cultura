import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequeridoLayout({ roles }) {
  const { usuario, cargando } = useAuth();
  if (cargando) return <div className="contenedor">Cargando…</div>;
  if (!usuario) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(usuario.tipo)) return <Navigate to="/" replace />;
  return <Outlet />;
}