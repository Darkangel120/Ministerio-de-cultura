import { useState } from 'react';

const CANALES = [
  ['Sede principal', 'Av. Panteón, Foro Libertador, Caracas 1010, Distrito Capital'],
  ['Atención telefónica', '+58 212-482-0000 (lunes a viernes, 8:00 a 16:00)'],
  ['Correo institucional', 'contacto@mincultura.gob.ve'],
  ['Foro de denuncias', 'A través del foro comunitario de este portal'],
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
    <div className="contenedor">
      <div className="pagina-titulo">
        <h1>Contacto</h1>
        <p className="subtitulo">Canales oficiales y formulario de atención al pueblo.</p>
      </div>
      <div className="grilha grilha-2">
        <section className="tarjeta">
          <h3 style={{ color: 'var(--azul)', marginTop: 0 }}>Canales institucionales</h3>
          {CANALES.map(([t, d]) => (
            <p key={t}><strong>{t}:</strong> {d}</p>
          ))}
        </section>
        <section className="tarjeta">
          <h3 style={{ color: 'var(--azul)', marginTop: 0 }}>Escríbenos</h3>
          {estado && <div className="aviso aviso-ok">{estado}</div>}
          <form onSubmit={enviar}>
            <div className="campo">
              <label htmlFor="nombre">Nombre completo</label>
              <input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </div>
            <div className="campo">
              <label htmlFor="correo">Correo electrónico</label>
              <input id="correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
            </div>
            <div className="campo">
              <label htmlFor="mensaje">Mensaje</label>
              <textarea id="mensaje" rows="5" value={mensaje} onChange={(e) => setMensaje(e.target.value)} required />
            </div>
            <button className="btn" type="submit">Enviar</button>
          </form>
        </section>
      </div>
    </div>
  );
}