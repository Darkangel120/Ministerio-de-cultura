import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import Dropdown from './Dropdown';

export default function Header() {
  const { usuario, logout, esStaff, puedeCrearUsuario } = useAuth();
  const navigate = useNavigate();

  const salir = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="cabecera">
      <div className="cabecera-interno">
        <Link to="/" className="logo-img-item"><img className="logo-img" src="/favicon.jpg" alt="Logo del Ministerio del Poder Popular para la Cultura" /></Link>
        <div className="titulos">
          <h1>República Bolivariana de Venezuela</h1>
          <h2 style={{ margin: 0, fontSize: 16 }}>Ministerio del Poder Popular para la Cultura</h2>
          <p>Misión Cultura</p>
        </div>
        <nav className="menu">
          <ul>
            <li><NavLink to="/" end={true}>Inicio</NavLink></li>
            <li><NavLink to="/foro">Foro</NavLink></li>
            {esStaff ? (
              <li>
                <Dropdown
                  alinear="izq"
                  trigger={<><LayoutDashboard size={15} /> Servicios <ChevronDown size={13} /></>}
                >
                  <Link to="/panel">Panel de Gestión</Link>
                  <Link to="/calendario">Eventos</Link>
                  <Link to="/cultores">Registro de Cultores</Link>
                  {puedeCrearUsuario && <Link to="/crear-usuario">Creación de Usuarios</Link>}
                  <Link to="/reportes">Reportes</Link>
                </Dropdown>
              </li>
            ) : (
              <li><NavLink to="/calendario">Eventos</NavLink></li>
            )}
            {usuario ? (
              <li>
                <Dropdown alinear="der" trigger={<Avatar clase="avatar avatar-chico" foto={usuario.foto_url} nombre={usuario.nombre_completo} />}>
                  <Link to={`/perfil/${usuario.id}`}>Mi Perfil</Link>
                  <button type="button" className="danger" onClick={salir}>Cerrar Sesión</button>
                </Dropdown>
              </li>
            ) : (
              <>
                <li><NavLink to="/login">Iniciar Sesión</NavLink></li>
                <li><NavLink to="/registro">Registro</NavLink></li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}