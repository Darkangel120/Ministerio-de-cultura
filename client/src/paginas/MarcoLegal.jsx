import { Link } from 'react-router-dom';
import { Scale, BookOpen, FileText, Landmark, Globe2 } from 'lucide-react';

const NORMAS = [
  ['Constitución de la República Bolivariana de Venezuela', 'Artículo 98: creación cultural libre; Artículo 99: valores de la cultura; Artículo 100: culturas populares y expresiones tradicionales.', Landmark],
  ['Ley de Protección y Defensa del Patrimonio Cultural', 'Protección, defensa, registro y salvaguarda del patrimonio cultural tangible e intangible de la Nación.', Landmark],
  ['Ley del Instituto de las Artes Escénicas y Musicales', 'Fomento, promoción y difusión de las artes escénicas y la música.', Music4Icon],
  ['Ley del Libro', 'Fomento de la lectura y la producción literaria nacional.', BookOpen],
  ['Ley de la Cinematografía Nacional', 'Ordenamiento jurídico para el desarrollo de la cinematografía venezolana.', Globe2],
  ['Ley del Artesano y la Artesana', 'Reconocimiento y protección del trabajo artesanal como expresión del pueblo.', FileText],
];

function Music4Icon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
  );
}

export default function MarcoLegal() {
  return (
    <div className="contenedor max-l">
      <section className="pagina-hero">
        <div className="hero-icono"><Scale size={42} /></div>
        <h1>Marco Legal</h1>
        <p>
          El quehacer del Ministerio del Poder Popular para la Cultura se sustenta en el
          ordenamiento jurídico venezolano, que reconoce y protege la diversidad cultural de la Nación.
        </p>
      </section>

      <div className="grilha grilha-2">
        {NORMAS.map(([titulo, texto, Icon], i) => (
          <section className="tarjeta" key={titulo}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div className="icono-circulo" style={{ width: 46, height: 46 }}><Icon size={21} /></div>
              <span className="badge badge-azul">{String(i + 1).padStart(2, '0')}</span>
            </div>
            <h3 style={{ color: 'var(--azul)', margin: '0 0 8px' }}>{titulo}</h3>
            <p style={{ margin: 0, color: 'var(--texto-suave)', fontSize: 14.5 }}>{texto}</p>
          </section>
        ))}
      </div>

      <section className="tarjeta" style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ color: 'var(--azul)', margin: 0 }}>¿Cómo participar?</h3>
          <p style={{ margin: '4px 0 0', color: 'var(--texto-suave)' }}>Conoce los espacios de participación cultural y la agenda de actividades.</p>
        </div>
        <Link className="btn" to="/transparencia">Transparencia</Link>
      </section>
    </div>
  );
}