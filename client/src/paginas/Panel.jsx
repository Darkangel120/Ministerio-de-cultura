import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useDatos from '../hooks/useDatos';
import { MESES, ESTADO_EJECUCION } from '../constantes';

export default function Panel() {
  const { usuario } = useAuth();
  const { datos, error } = useDatos('/api/dashboard');

  const fmt = (e) => {
    const d = new Date(e.fecha);
    return `${d.getDate()} ${MESES[d.getMonth()]}, ${e.hora?.slice(0, 5)} h`;
  };

  return (
    <div className="contenedor">
      <h2>Panel de Gestión</h2>
      <p>Bienvenido, <strong>{usuario?.nombre_completo}</strong></p>
      {error && <div className="aviso aviso-error">{error}</div>}

      <div className="grilha grilha-3">
        {datos && Object.entries(datos.stats || {}).map(([k, v]) => (
          <div className="tarjeta" key={k} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 34, fontWeight: 700, color: 'var(--azul)' }}>{v}</div>
            <div style={{ textTransform: 'uppercase', color: '#666', fontSize: 13 }}>
              {k === 'eventos' ? 'Eventos' : k === 'cultores' ? 'Cultores' : k === 'publicaciones' ? 'Publicaciones' : k === 'comentarios' ? 'Comentarios' : k}
            </div>
          </div>
        ))}
      </div>

      <h3>Próximos Eventos</h3>
      <div className="grilha">
        {(datos?.proximosEventos || []).map((e) => (
          <div className="tarjeta" key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <strong>{e.nombre_actividad}</strong>
              <div style={{ color: '#555', fontSize: 14 }}>{e.municipio}, {e.estado} · {fmt(e)}</div>
            </div>
            <span className="btn" style={{ display: 'inline-block', padding: '4px 10px', fontSize: 12 }}>{ESTADO_EJECUCION[e.estado_ejecucion] || e.estado_ejecucion}</span>
          </div>
        ))}
      </div>
      <Link className="btn btn-sec" to="/calendario">Ir al Calendario</Link>
    </div>
  );
}