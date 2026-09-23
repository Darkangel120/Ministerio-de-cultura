import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AREAS_TEMATICAS } from '../constantes';

const destinoSegunRol = (tipo) =>
  ['admin', 'director_general', 'director_operativo', 'funcionario'].includes(tipo) ? '/panel' : '/foro';

const inicial = {
  nombre_completo: '', email: '', telefono: '', tipo_usuario: 'publico',
  password: '', password_confirm: '',
  cedula: '', area_tematica: '', disciplina: '', comuna: '', municipio: '', parroquia: '',
  carnet_patria: '', direccion: '', lugar_nacimiento: '', fecha_nacimiento: '',
  trayectoria_anios: '', organizacion: '',
};

export default function Registro() {
  const { registrar, usuario } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(inicial);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  if (usuario) {
    navigate(destinoSegunRol(usuario.tipo), { replace: true });
    return null;
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.password_confirm) { setError('Las contraseñas no coinciden'); return; }
    setCargando(true);
    try {
      const { password_confirm, tipo_usuario, ...datos } = form;
      const r = await registrar({ ...datos, tipo_usuario });
      navigate(destinoSegunRol(r.usuario.tipo), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const esCultor = form.tipo_usuario === 'cultor';

  return (
    <div className="contenedor max-m">
      <div className="pagina-titulo">
        <h1>Registro Cultural</h1>
        <p className="subtitulo">Únete a la comunidad de cultores y cultoras de la Patria.</p>
      </div>
      <div className="tarjeta">
        {error && <div className="aviso aviso-error">{error}</div>}
        <form onSubmit={enviar}>
          <div className="form-seccion">
            <h3>Datos de la cuenta</h3>
          <div className="campo">
            <label htmlFor="nombre_completo">Nombre completo *</label>
            <input id="nombre_completo" value={form.nombre_completo} onChange={set('nombre_completo')} required />
          </div>
          <div className="grilha grilha-2">
            <div className="campo">
              <label htmlFor="email">Correo electrónico *</label>
              <input id="email" type="email" value={form.email} onChange={set('email')} required />
            </div>
            <div className="campo">
              <label htmlFor="telefono">Teléfono</label>
              <input id="telefono" type="tel" value={form.telefono} onChange={set('telefono')} />
            </div>
          </div>
          <div className="campo">
            <label htmlFor="tipo_usuario">Tipo de usuario *</label>
            <select id="tipo_usuario" value={form.tipo_usuario} onChange={set('tipo_usuario')} required>
              <option value="cultor">Cultor</option>
              <option value="publico">Público en general</option>
            </select>
          </div>
          </div>

          {esCultor && (
            <>
              <div className="form-seccion">
                <h3>Información del Cultor</h3>
              <div className="grilha grilha-2">
                <div className="campo">
                  <label htmlFor="cedula">Cédula *</label>
                  <input id="cedula" value={form.cedula} onChange={set('cedula')} required={esCultor} />
                </div>
                <div className="campo">
                  <label htmlFor="area_tematica">Área temática *</label>
                  <select id="area_tematica" value={form.area_tematica} onChange={set('area_tematica')} required={esCultor}>
                    <option value="">Seleccionar...</option>
                    {Object.entries(AREAS_TEMATICAS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="campo">
                  <label htmlFor="disciplina">Disciplina *</label>
                  <input id="disciplina" value={form.disciplina} onChange={set('disciplina')} required={esCultor} />
                </div>
                <div className="campo">
                  <label htmlFor="comuna">Comuna</label>
                  <input id="comuna" value={form.comuna} onChange={set('comuna')} />
                </div>
                <div className="campo">
                  <label htmlFor="municipio">Municipio *</label>
                  <input id="municipio" value={form.municipio} onChange={set('municipio')} required={esCultor} />
                </div>
                <div className="campo">
                  <label htmlFor="parroquia">Parroquia *</label>
                  <input id="parroquia" value={form.parroquia} onChange={set('parroquia')} required={esCultor} />
                </div>
                <div className="campo">
                  <label htmlFor="carnet_patria">Código Carnet Patria *</label>
                  <input id="carnet_patria" value={form.carnet_patria} onChange={set('carnet_patria')} required={esCultor} />
                </div>
                <div className="campo">
                  <label htmlFor="direccion">Dirección exacta de domicilio *</label>
                  <input id="direccion" value={form.direccion} onChange={set('direccion')} required={esCultor} />
                </div>
                <div className="campo">
                  <label htmlFor="lugar_nacimiento">Lugar de nacimiento *</label>
                  <input id="lugar_nacimiento" value={form.lugar_nacimiento} onChange={set('lugar_nacimiento')} required={esCultor} />
                </div>
                <div className="campo">
                  <label htmlFor="fecha_nacimiento">Fecha de nacimiento *</label>
                  <input id="fecha_nacimiento" type="date" value={form.fecha_nacimiento} onChange={set('fecha_nacimiento')} required={esCultor} />
                </div>
                <div className="campo">
                  <label htmlFor="trayectoria_anios">Años de trayectoria *</label>
                  <input id="trayectoria_anios" type="number" min="0" max="100" value={form.trayectoria_anios} onChange={set('trayectoria_anios')} required={esCultor} />
                </div>
                <div className="campo">
                  <label htmlFor="organizacion">Organización social</label>
                  <input id="organizacion" value={form.organizacion} onChange={set('organizacion')} />
                </div>
              </div>
              </div>
            </>
          )}

          <div className="form-seccion">
            <h3>Contraseña</h3>
          <div className="grilha grilha-2">
            <div className="campo">
              <label htmlFor="password">Contraseña *</label>
              <input id="password" type="password" minLength={8} value={form.password} onChange={set('password')} required />
              <small>Mínimo 8 caracteres</small>
            </div>
            <div className="campo">
              <label htmlFor="password_confirm">Confirmar contraseña *</label>
              <input id="password_confirm" type="password" minLength={8} value={form.password_confirm} onChange={set('password_confirm')} required />
            </div>
          </div>
          </div>

          <button className="btn" type="submit" disabled={cargando}>{cargando ? 'Registrando…' : 'Registrarme'}</button>
          <p style={{ marginTop: 16 }}>
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
        </form>
      </div>
    </div>
  );
}