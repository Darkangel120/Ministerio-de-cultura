import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { usuario, logout, esStaff } = useAuth();
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
          <h2 style={{ margin: 0, fontSize: 15, color: '#333', fontFamily: 'Georgia, serif' }}>Ministerio del Poder Popular para la Cultura</h2>
          <p>Misión Cultura</p>
        </div>
        <nav className="menu">
          <ul>
            <li><NavLink to="/" end={true}>Inicio</NavLink></li>
            <li><NavLink to="/foro">Foro</NavLink></li>
            {esStaff && <li><NavLink to="/panel">Panel</NavLink></li>}
            {esStaff && <li><NavLink to="/calendario">Calendario</NavLink></li>}
            {esStaff && <li><NavLink to="/cultores">Cultores</NavLink></li>}
            {esStaff && <li><NavLink to="/reportes">Reportes</NavLink></li>}
            {(usuario?.tipo === 'admin' || usuario?.tipo === 'director_general' || usuario?.tipo === 'director_operativo') && <li><NavLink to="/crear-usuario">Crear Usuario</NavLink></li>}
            {usuario ? (
              <>
                <li><NavLink to={`/perfil/${usuario.id}`}>Mi Perfil</NavLink></li>
                <li><button className="btn-bajo" onClick={salir}>Cerrar Sesión</button></li>
              </>
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