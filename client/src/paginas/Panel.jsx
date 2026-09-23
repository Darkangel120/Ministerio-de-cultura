import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useDatos from '../hooks/useDatos';
import { MESES, ESTADO_EJECUCION } from '../constantes';

const ETIQUETAS = {
  eventos: 'Eventos registrados',
  cultores: 'Cultores registrados',
  publicaciones: 'Publicaciones',
  comentarios: 'Comentarios',
};

export default function Panel() {
  const { usuario } = useAuth();
  const { datos, error } = useDatos('/api/dashboard');

  const fmt = (e) => {
    const d = new Date(e.fecha);
    return `${d.getDate()} ${MESES[d.getMonth()]}, ${e.hora?.slice(0, 5)} h`;
  };

  return (
    <div className="contenedor">
      <div className="pagina-titulo">
        <h1>Panel de Gestión</h1>
        <p className="subtitulo">Bienvenido, <strong>{usuario?.nombre_completo}</strong> — resumen de la actividad cultural.</p>
      </div>
      {error && <div className="aviso aviso-error">{error}</div>}

      <div className="grilha grilha-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {datos && Object.entries(datos.stats || {}).map(([k, v]) => (
          <div className="tarjeta tarjeta-estadistica" key={k}>
            <div className="valor">{v}</div>
            <div className="etiqueta">{ETIQUETAS[k] || k}</div>
          </div>
        ))}
      </div>

      <h2 className="seccion-titulo">Próximos Eventos</h2>
      <div className="tarjeta">
        {(datos?.proximosEventos || []).map((e) => (
          <div className="fila" key={e.id}>
            <div>
              <div className="fila-titulo">{e.nombre_actividad}</div>
              <div className="fila-detalle">{e.municipio}, {e.estado} · {fmt(e)}</div>
            </div>
            <span className="badge badge-amarillo">{ESTADO_EJECUCION[e.estado_ejecucion] || e.estado_ejecucion}</span>
          </div>
        ))}
        {(datos?.proximosEventos || []).length === 0 && (
          <div className="vacio"><span className="simbolo">🗓️</span>No hay eventos próximos registrados.</div>
        )}
      </div>
      <Link className="btn btn-sec" to="/calendario">Ir al Calendario</Link>
    </div>
  );
}