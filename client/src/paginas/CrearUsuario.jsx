import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const JERARQUIA = {
  admin: ['admin', 'director_general', 'director_operativo', 'funcionario'],
  director_general: ['director_operativo', 'funcionario'],
  director_operativo: ['funcionario'],
};

const LABEL = { admin: 'Administrador', director_general: 'Director General', director_operativo: 'Director Operativo', funcionario: 'Funcionario' };

const vacio = { nombre_completo: '', email: '', telefono: '', tipo_usuario: '', password: '', confirm_password: '' };

export default function CrearUsuario() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(vacio);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(null);
  const [cargando, setCargando] = useState(false);

  const rolesPermitidos = JERARQUIA[usuario?.tipo] || [];
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setError(null);
    setOk(null);
    if (form.password !== form.confirm_password) { setError('Las contraseñas no coinciden'); return; }
    setCargando(true);
    try {
      const { confirm_password, ...payload } = form;
      await api('/api/usuarios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      setOk(`Usuario ${form.nombre_completo} (${LABEL[form.tipo_usuario]}) creado correctamente.`);
      setForm(vacio);
    } catch (err) { setError(err.message); }
    finally { setCargando(false); }
  };

  return (
    <div className="contenedor max-m">
      <div className="pagina-titulo">
        <h1>Crear Nuevo Usuario</h1>
        <p className="subtitulo">
          Puede crear usuarios de los siguientes tipos: {rolesPermitidos.map((r, i) => <span key={r}><span className="badge badge-azul">{LABEL[r]}</span>{i < rolesPermitidos.length - 1 ? ' ' : ''}</span>)}.
        </p>
      </div>
      <div className="tarjeta">
        {error && <div className="aviso aviso-error">{error}</div>}
        {ok && <div className="aviso aviso-ok">{ok}</div>}
        <form onSubmit={enviar}>
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
              <option value="">Seleccionar tipo de usuario</option>
              {rolesPermitidos.map((r) => <option key={r} value={r}>{LABEL[r]}</option>)}
            </select>
          </div>
          <div className="grilha grilha-2">
            <div className="campo">
              <label htmlFor="password">Contraseña *</label>
              <input id="password" type="password" minLength={6} value={form.password} onChange={set('password')} required />
            </div>
            <div className="campo">
              <label htmlFor="confirm_password">Confirmar contraseña *</label>
              <input id="confirm_password" type="password" minLength={6} value={form.confirm_password} onChange={set('confirm_password')} required />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn" type="submit" disabled={cargando}>{cargando ? 'Creando…' : 'Crear Usuario'}</button>
            <button className="btn btn-sec" type="button" onClick={() => navigate('/panel')}>Volver al Panel</button>
          </div>
        </form>
      </div>
    </div>
  );
}