import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const destinoSegunRol = (tipo) =>
  ['admin', 'director_general', 'director_operativo', 'funcionario'].includes(tipo) ? '/panel' : '/foro';

export default function Login() {
  const { login, usuario } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  if (usuario) {
    navigate(destinoSegunRol(usuario.tipo), { replace: true });
    return null;
  }

  const enviar = async (e) => {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const r = await login(email, password);
      navigate(destinoSegunRol(r.usuario.tipo), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="contenedor" style={{ maxWidth: 460, margin: '0 auto' }}>
      <div className="tarjeta">
        <h2 style={{ color: 'var(--azul)', marginTop: 0 }}>Iniciar Sesión</h2>
        {error && <div className="aviso aviso-error">{error}</div>}
        <form onSubmit={enviar}>
          <div className="campo">
            <label htmlFor="email">Correo electrónico</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </div>
          <div className="campo">
            <label htmlFor="password">Contraseña</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="btn" type="submit" disabled={cargando}>{cargando ? 'Ingresando…' : 'Ingresar'}</button>
        </form>
        <p style={{ marginTop: 16 }}>
          ¿No tienes cuenta? <Link to="/registro">Regístrate aquí</Link>
        </p>
      </div>
    </div>
  );
}