import { Link } from 'react-router-dom';
import useDatos from '../hooks/useDatos';
import { MESES } from '../constantes';

export default function Inicio() {
  const { datos: noticias, error: errNoticias } = useDatos('/api/noticias?limite=3');
  const { datos: eventos, error: errEventos } = useDatos('/api/eventos/nuevos');

  const fechaEvento = (e) => {
    const d = new Date(e.fecha);
    return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
  };

  return (
    <div className="contenedor">
      <section className="hero">
        <h1>Misión Cultura</h1>
        <p>
          El Ministerio del Poder Popular para la Cultura impulsa el desarrollo cultural del
          pueblo venezolano, promoviendo la participación popular y la defensa de la identidad nacional.
        </p>
        <div className="hero-cta">
          <Link className="btn" to="/registro">Registrarme</Link>
          <Link className="btn btn-sec" to="/foro" style={{ color: '#fff' }}>Visitar el Foro</Link>
        </div>
      </section>

      <h2 className="seccion-titulo">Noticias</h2>
      {errNoticias && <div className="aviso aviso-error">{errNoticias}</div>}
      <div className="grilha grilha-3">
        {(noticias?.noticias || []).map((n) => (
          <article className="tarjeta" key={n.id}>
            <span className="badge badge-azul" style={{ marginBottom: 10 }}>
              {new Date(n.fecha_publicacion).toLocaleDateString('es-VE', { dateStyle: 'long' })}
            </span>
            <h3 style={{ color: 'var(--azul)', marginTop: 0 }}>{n.titulo}</h3>
            <p>{n.contenido}</p>
          </article>
        ))}
      </div>

      <h2 className="seccion-titulo">Próximos Eventos</h2>
      {errEventos && <div className="aviso aviso-error">{errEventos}</div>}
      <div className="grilha grilha-3">
        {(eventos?.eventos || []).map((e) => (
          <article className="tarjeta" key={e.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>{e.nombre_actividad}</h3>
              <span className="badge badge-amarillo">{e.disciplina}</span>
            </div>
            <p style={{ color: 'var(--texto-suave)', margin: '0 0 10px' }}>{e.municipio}, {e.estado}</p>
            <p style={{ margin: 0 }}><strong>{fechaEvento(e)}</strong> · {e.hora?.slice(0, 5)} h</p>
          </article>
        ))}
      </div>
    </div>
  );
}