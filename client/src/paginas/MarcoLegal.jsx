const NORMAS = [
  ['Constitución de la República Bolivariana de Venezuela', 'Artículo 98: creación cultural libre; Artículo 99: valores de la cultura; Artículo 100: culturas populares y expresiones tradicionales.'],
  ['Ley de Protección y Defensa del Patrimonio Cultural', 'Protección, defensa, registro y salvaguarda del patrimonio cultural tangible e intangible de la Nación.'],
  ['Ley del Instituto de las Artes Escénicas y Musicales', 'Fomento, promoción y difusión de las artes escénicas y la música.'],
  ['Ley del Libro', 'Fomento de la lectura y la producción literaria nacional.'],
  ['Ley de la Cinematografía Nacional', 'Ordenamiento jurídico para el desarrollo de la cinematografía venezolana.'],
  ['Ley del Artesano y la Artesana', 'Reconocimiento y protección del trabajo artesanal como expresión del pueblo.'],
];

export default function MarcoLegal() {
  return (
    <div className="contenedor max-m">
      <div className="pagina-titulo">
        <h1>Marco Legal</h1>
        <p className="subtitulo">El quehacer del Ministerio se sustenta en el ordenamiento jurídico venezolano:</p>
      </div>
      {NORMAS.map(([titulo, texto], i) => (
        <section className="tarjeta" key={titulo} style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
          <div className="avatar" style={{ width: 44, fontSize: 16 }}>{String(i + 1).padStart(2, '0')}</div>
          <div>
            <h3 style={{ color: 'var(--azul)', marginTop: 0 }}>{titulo}</h3>
            <p style={{ margin: 0 }}>{texto}</p>
          </div>
        </section>
      ))}
    </div>
  );
}