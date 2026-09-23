import { Link } from 'react-router-dom';
import useDatos from '../hooks/useDatos';
import { MESES } from '../constantes';
import Revelar from '../componentes/Revelar';
import CintaCultura from '../componentes/CintaCultura';

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
        <span className="globo globo-1" />
        <span className="globo globo-2" />
        <span className="globo globo-3" />
        <p className="hero-linea">Misión Cultura · Ministerio del Poder Popular para la Cultura</p>
        <h1>La cultura es vida, memoria y futuro del pueblo</h1>
        <p>
          Impulsamos la participación popular y la defensa de la identidad nacional.
          Explora la agenda cultural, conoce a nuestros cultores y participa en la
          comunidad cultural de toda Venezuela.
        </p>
        <div className="hero-cta">
          <Link className="btn" to="/registro">Registrarme</Link>
          <Link className="btn btn-sec" to="/calendario" style={{ color: '#fff' }}>Ver la Agenda Cultural</Link>
        </div>
      </section>

      <CintaCultura />

      <Revelar>
        <h2 className="seccion-titulo"><span className="emoji-sec">📰</span> Noticias</h2>
      </Revelar>
      {errNoticias && <div className="aviso aviso-error">{errNoticias}</div>}
      <div className="grilha grilha-3">
        {(noticias?.noticias || []).map((n, i) => (
          <Revelar demora={i * 90} key={n.id}>
            <article className="tarjeta" style={{ height: '100%' }}>
              <span className="badge badge-azul" style={{ marginBottom: 10 }}>
                {new Date(n.fecha_publicacion).toLocaleDateString('es-VE', { dateStyle: 'long' })}
              </span>
              <h3 style={{ color: 'var(--azul)', marginTop: 0 }}>{n.titulo}</h3>
              <p>{n.contenido}</p>
            </article>
          </Revelar>
        ))}
      </div>

      <Revelar>
        <h2 className="seccion-titulo"><span className="emoji-sec">🎭</span> Próximos Eventos</h2>
      </Revelar>
      {errEventos && <div className="aviso aviso-error">{errEventos}</div>}
      <div className="grilha grilha-3">
        {(eventos?.eventos || []).map((e, i) => (
          <Revelar demora={i * 90} key={e.id}>
            <article className="tarjeta">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <h3 style={{ margin: 0 }}>{e.nombre_actividad}</h3>
                <span className="badge badge-amarillo">{e.disciplina}</span>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: 14 }}>
                📍 <strong>{e.estado}</strong> — {e.municipio}
              </p>
              <p style={{ margin: 0 }}><strong>{fechaEvento(e)}</strong> · {e.hora?.slice(0, 5)} h</p>
            </article>
          </Revelar>
        ))}
        {(eventos?.eventos || []).length === 0 && !errEventos && (
          <div className="vacio"><span className="simbolo">🎪</span>Aún no hay actividades programadas.</div>
        )}
      </div>
      <Revelar>
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <Link className="btn btn-sec" to="/calendario" style={{ color: '#fff' }}>
            🗓️ Ver la Agenda Cultural completa
          </Link>
        </div>
      </Revelar>
    </div>
  );
}