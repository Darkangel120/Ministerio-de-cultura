export default function MisionVision() {
  return (
    <div className="contenedor max-m">
      <div className="pagina-titulo">
        <h1>Misión y Visión</h1>
        <p className="subtitulo">El norte institucional del Ministerio del Poder Popular para la Cultura.</p>
      </div>
      <div className="grilha grilha-2">
        <section className="tarjeta">
          <span className="badge badge-rojo">Misión</span>
          <h3 style={{ color: 'var(--azul)' }}>Nuestra Misión</h3>
          <p>
            Garantizar el derecho del pueblo venezolano a la cultura, impulsando la creación,
            la producción, la circulación y el disfrute de los bienes culturales, así como la
            formación integral de los cultores y cultoras, fortaleciendo la identidad nacional
            y el poder popular cultural.
          </p>
        </section>
        <section className="tarjeta">
          <span className="badge badge-azul">Visión</span>
          <h3 style={{ color: 'var(--azul)' }}>Nuestra Visión</h3>
          <p>
            Ser la institución rectora de la política cultural del Estado venezolano, consolidando
            un modelo de gestión participativo y protagónico donde las comunidades sean las
            protagonistas del desarrollo cultural, en el marco del Plan de la Patria y de una
            geopolítica internacional multipolar.
          </p>
        </section>
      </div>
    </div>
  );
}