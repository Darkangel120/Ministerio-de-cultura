import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Footer() {
  const { usuario, esAdmin } = useAuth();
  const puedeRegistro = usuario && usuario.tipo !== 'publico';
  return (
    <footer className="pie">
      <div className="pie-interno">
        <div>
          <h3>Ministerio de Cultura</h3>
          <p>República Bolivariana de Venezuela</p>
          <p>Av. Panteón, Foro Libertador</p>
          <p>Caracas, Venezuela</p>
        </div>
        <div>
          <h3>Enlaces Rápidos</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li><Link to="/mision-vision">Misión y Visión</Link></li>
            <li><Link to="/marco-legal">Marco Legal</Link></li>
            <li><Link to="/transparencia">Transparencia</Link></li>
            <li><Link to="/contacto">Contacto</Link></li>
          </ul>
        </div>
        <div>
          <h3>Servicios</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {puedeRegistro && <li><Link to="/registro">Registro Cultural</Link></li>}
            <li><Link to="/calendario">Eventos</Link></li>
            <li><Link to="/foro">Foro Comunitario</Link></li>
          </ul>
        </div>
        {esAdmin && (
          <div>
            <h3>Administración</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li><Link to="/panel">Panel</Link></li>
              <li><Link to="/reportes">Reportes</Link></li>
            </ul>
          </div>
        )}
      </div>
      <div className="pie-copia">
        <p>© 2026 Ministerio del Poder Popular para la Cultura - Todos los derechos reservados</p>
        <p>Realizado por Rodolfo Gómez</p>
      </div>
    </footer>
  );
}