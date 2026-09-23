import { Scale, FileText, Receipt, BadgeCheck, Database } from 'lucide-react';

const SECCIONES = [
  ['Principios', 'Acceso oportuno y gratuito a la información sobre gestión, presupuesto y resultados del Ministerio.', Scale],
  ['Salarios y personal', 'Estructura de personal y escalas salariales publicadas conforme a la normativa vigente.', BadgeCheck],
  ['Contrataciones', 'Publicación de procesos de contratación pública y adjudicaciones en el sistema nacional.', FileText],
  ['Inversión cultural', 'Programas de financiamiento y de la Misión Cultura: partidas, beneficiarios y estados de ejecución.', Receipt],
];

export default function Transparencia() {
  return (
    <div className="contenedor max-l">
      <section className="pagina-hero">
        <div className="hero-icono"><Scale size={42} /></div>
        <h1>Transparencia y Acceso a la Información</h1>
        <p>
          Conforme a la Ley de Transparencia del Sector Público, este portal publica la información
          relativa a la gestión institucional del Ministerio.
        </p>
      </section>

      <div className="grilha grilha-2">
        {SECCIONES.map(([t, d, Icon]) => (
          <section className="tarjeta" key={t}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div className="icono-circulo" style={{ width: 46, height: 46, flex: 'none' }}><Icon size={21} /></div>
              <div>
                <h3 style={{ color: 'var(--azul)', margin: '0 0 6px' }}>{t}</h3>
                <p style={{ margin: 0, color: 'var(--texto-suave)', fontSize: 14.5 }}>{d}</p>
              </div>
            </div>
          </section>
        ))}
      </div>

      <section className="tarjeta" style={{ marginTop: 24, display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div className="icono-circulo" style={{ flex: 'none' }}><Database size={24} /></div>
        <div style={{ flex: 1, minWidth: 260 }}>
          <h3 style={{ color: 'var(--azul)', margin: 0 }}>Información institucional</h3>
          <p style={{ color: 'var(--texto-suave)', margin: '6px 0 0' }}>
            Los reportes consolidados de la gestión cultural se consultan desde el panel de
            administración, con filtros por responsable, municipio, área temática y fechas,
            y descarga en PDF.
          </p>
        </div>
      </section>
    </div>
  );
}