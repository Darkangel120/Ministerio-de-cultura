import { useState } from 'react';
import { MapPin, Phone, Mail, MessageCircle, Send, Clock } from 'lucide-react';

const CANALES = [
  ['Sede principal', 'Av. Panteón, Foro Libertador, Caracas 1010, Distrito Capital', MapPin],
  ['Atención telefónica', '+58 212-482-0000 (lunes a viernes, 8:00 a 16:00)', Phone],
  ['Correo institucional', 'contacto@mincultura.gob.ve', Mail],
  ['Foro de denuncias', 'A través del foro comunitario de este portal', MessageCircle],
];

export default function Contacto() {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [estado, setEstado] = useState(null);

  const enviar = async (e) => {
    e.preventDefault();
    // ponytail: sin backend de mensajería (no existía); simula envío y confirma
    setEstado(`Gracias ${nombre}, tu mensaje fue recibido. Nuestro equipo te responderá a ${correo}.`);
    setNombre(''); setCorreo(''); setMensaje('');
  };

  return (
    <div className="contenedor max-l">
      <section className="pagina-hero">
        <div className="hero-icono"><Mail size={42} /></div>
        <h1>Contacto</h1>
        <p>
          Canales oficiales de atención al pueblo y formulario de consultas de la Misión Cultura.
        </p>
      </section>

      <div className="grilha grilha-2" style={{ marginBottom: 24 }}>
        {CANALES.map(([titulo, detalle, Icon]) => (
          <section className="tarjeta" key={titulo}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div className="icono-circulo" style={{ width: 46, height: 46, flex: 'none' }}><Icon size={21} /></div>
              <div>
                <h3 style={{ color: 'var(--azul)', margin: '0 0 4px' }}>{titulo}</h3>
                <p style={{ margin: 0, color: 'var(--texto-suave)', fontSize: 14.5 }}>{detalle}</p>
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="grilha" style={{ gap: 20, gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)' }}>
        <section className="tarjeta">
          <div className="seccion-cabecera" style={{ marginTop: 0 }}>
            <div className="icono-circulo"><Send size={22} /></div>
            <h2 style={{ margin: 0 }}>Escríbenos</h2>
          </div>
          {estado && <div className="aviso aviso-ok">{estado}</div>}
          <form onSubmit={enviar}>
            <div className="grilha grilha-2">
              <div className="campo"><label htmlFor="nombre">Nombre completo</label><input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required /></div>
              <div className="campo"><label htmlFor="correo">Correo electrónico</label><input id="correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required /></div>
            </div>
            <div className="campo"><label htmlFor="mensaje">Mensaje</label><textarea id="mensaje" rows="5" value={mensaje} onChange={(e) => setMensaje(e.target.value)} required /></div>
            <button className="btn" type="submit"><Send size={15} /> Enviar</button>
          </form>
        </section>

        <aside className="tarjeta" style={{ alignSelf: 'start' }}>
          <h3 style={{ color: 'var(--azul)', marginTop: 0 }}>Horario de atención</h3>
          <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={16} color="var(--azul)" /> Lunes a viernes, 8:00 a.m. – 4:00 p.m.
          </p>
          <p style={{ color: 'var(--texto-suave)', fontSize: 14 }}>
            Las consultas recibidas por el formulario son respondidas por los equipos institucionales
            en un plazo de hasta 5 días hábiles.
          </p>
        </aside>
      </div>
    </div>
  );
}