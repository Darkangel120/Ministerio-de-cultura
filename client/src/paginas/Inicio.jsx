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
      <section className="tarjeta" style={{ background: 'linear-gradient(135deg, var(--azul) 0%, #0a2a6e 100%)', color: '#fff' }}>
        <h2 style={{ marginTop: 0 }}>Misión Cultura</h2>
        <p style={{ fontSize: 18 }}>
          El Ministerio del Poder Popular para la Cultura impulsa el desarrollo cultural del
          pueblo venezolano, promoviendo la participación popular y la defensa de la identidad nacional.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link className="btn" to="/registro" style={{ color: '#fff' }}>Registrarme</Link>
          <Link className="btn btn-sec" to="/foro" style={{ color: '#fff' }}>Visitar el Foro</Link>
        </div>
      </section>

      <h2>Noticias</h2>
      {errNoticias && <div className="aviso aviso-error">{errNoticias}</div>}
      <div className="grilha grilha-3">
        {(noticias?.noticias || []).map((n) => (
          <article className="tarjeta" key={n.id}>
            <h3 style={{ color: 'var(--azul)', marginTop: 0 }}>{n.titulo}</h3>
            <p>{n.contenido}</p>
            <small>{new Date(n.fecha_publicacion).toLocaleDateString('es-VE', { dateStyle: 'long' })}</small>
          </article>
        ))}
      </div>

      <h2>Próximos Eventos</h2>
      {errEventos && <div className="aviso aviso-error">{errEventos}</div>}
      <div className="grilha grilha-3">
        {(eventos?.eventos || []).map((e) => (
          <article className="tarjeta" key={e.id}>
            <h3 style={{ marginTop: 0 }}>{e.nombre_actividad}</h3>
            <p>{e.disciplina} — {e.municipio}, {e.estado}</p>
            <p><strong>{fechaEvento(e)}</strong> · {e.hora?.slice(0, 5)} h</p>
          </article>
        ))}
      </div>
    </div>
  );
}