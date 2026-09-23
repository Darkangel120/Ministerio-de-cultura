export default function MisionVision() {
  return (
    <div className="contenedor">
      <h2>Misión y Visión</h2>
      <div className="grilha grilha-2">
        <section className="tarjeta">
          <h3 style={{ color: 'var(--azul)' }}>Misión</h3>
          <p>
            Garantizar el derecho del pueblo venezolano a la cultura, impulsando la creación,
            la producción, la circulación y el disfrute de los bienes culturales, así como la
            formación integral de los cultores y cultoras, fortaleciendo la identidad nacional
            y el poder popular cultural.
          </p>
        </section>
        <section className="tarjeta">
          <h3 style={{ color: 'var(--azul)' }}>Visión</h3>
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