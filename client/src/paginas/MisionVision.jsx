import { Link } from 'react-router-dom';
import { Target, Eye, Compass, HeartHandshake, Landmark, Music4, Users } from 'lucide-react';

const VALORES = [
  ['Identidad nacional', Landmark],
  ['Participación popular', Users],
  ['Soberanía cultural', Compass],
  ['Justicia social', HeartHandshake],
  ['Diversidad creativa', Music4],
];

export default function MisionVision() {
  return (
    <div className="contenedor max-l">
      <section className="pagina-hero">
        <div className="hero-icono"><Target size={42} /></div>
        <h1>Misión y Visión</h1>
        <p>
          El norte institucional del Ministerio del Poder Popular para la Cultura: garantizar el
          derecho del pueblo venezolano a la cultura y consolidar un modelo de gestión participativo
          y protagónico.
        </p>
      </section>

      <div className="grilha grilha-2">
        <section className="tarjeta">
          <div className="icono-circulo" style={{ background: 'linear-gradient(135deg, var(--rojo), #8f101f)' }}>
            <Target size={24} />
          </div>
          <span className="badge badge-rojo" style={{ margin: '14px 0 6px' }}>Misión</span>
          <h3 style={{ color: 'var(--azul)', margin: 0 }}>Nuestra Misión</h3>
          <p>
            Garantizar el derecho del pueblo venezolano a la cultura, impulsando la creación,
            la producción, la circulación y el disfrute de los bienes culturales, así como la
            formación integral de los cultores y cultoras, fortaleciendo la identidad nacional
            y el poder popular cultural.
          </p>
        </section>
        <section className="tarjeta">
          <div className="icono-circulo"><Eye size={24} /></div>
          <span className="badge badge-azul" style={{ margin: '14px 0 6px' }}>Visión</span>
          <h3 style={{ color: 'var(--azul)', margin: 0 }}>Nuestra Visión</h3>
          <p>
            Ser la institución rectora de la política cultural del Estado venezolano, consolidando
            un modelo de gestión participativo y protagónico donde las comunidades sean las
            protagonistas del desarrollo cultural, en el marco del Plan de la Patria y de una
            geopolítica internacional multipolar.
          </p>
        </section>
      </div>

      <div className="seccion-cabecera">
        <div className="icono-circulo" style={{ background: 'linear-gradient(135deg, var(--amarillo), #c2910a)' }}><HeartHandshake size={24} /></div>
        <h2>Valores que nos guían</h2>
      </div>
      <div className="valores">
        {VALORES.map(([nombre, Icon]) => (
          <span className="chip" key={nombre}><Icon size={15} /> {nombre}</span>
        ))}
      </div>

      <section className="tarjeta" style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ color: 'var(--azul)', margin: 0 }}>Participa del quehacer cultural</h3>
          <p style={{ margin: '4px 0 0', color: 'var(--texto-suave)' }}>Conoce las actividades del pueblo venezolano y únete a la comunidad cultural.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link className="btn" to="/calendario">Ver Eventos</Link>
          <Link className="btn btn-sec" to="/foro">Foro Comunitario</Link>
        </div>
      </section>
    </div>
  );
}