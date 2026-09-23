const SECCIONES = [
  ['Principios', 'Acceso oportuno y gratuito a la información sobre gestión, presupuesto y resultados del Ministerio.'],
  ['Salarios y personal', 'Estructura de personal y escalas salariales publicadas conforme a la normativa vigente.'],
  ['Contrataciones', 'Publicación de procesos de contratación pública y adjudicaciones en el sistema nacional.'],
  ['Inversión cultural', 'Programas de financiamiento y de la Misión Cultura: partidas, beneficiarios y estados de ejecución.'],
];

export default function Transparencia() {
  return (
    <div className="contenedor">
      <div className="pagina-titulo">
        <h1>Transparencia y Acceso a la Información</h1>
        <p className="subtitulo">
          Conforme a la Ley de Transparencia del Sector Público, este portal publica la información
          relativa a la gestión institucional.
        </p>
      </div>
      <div className="grilha grilha-2">
        {SECCIONES.map(([t, d]) => (
          <section className="tarjeta" key={t}>
            <span className="badge badge-azul">{t}</span>
            <h3 style={{ color: 'var(--azul)' }}>{t}</h3>
            <p style={{ margin: 0 }}>{d}</p>
          </section>
        ))}
      </div>
    </div>
  );
}