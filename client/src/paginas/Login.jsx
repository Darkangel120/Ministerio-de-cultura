import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Landmark } from 'lucide-react';
import Bandera from '../componentes/Bandera';
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

  useEffect(() => {
    if (usuario) navigate(destinoSegunRol(usuario.tipo), { replace: true });
  }, [usuario]);

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
    <div className="contenedor">
      <div className="split">
        <aside className="panel-azul">
          <div>
            <div style={{ width: 64, marginBottom: 18 }}><Bandera /></div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Landmark size={28} color="var(--amarillo)" /> Misión Cultura
            </h2>
            <p>
              Accede a la plataforma del Ministerio del Poder Popular para la Cultura:
              registra actividades, consulta el calendario cultural y participa en la
              comunidad de cultores del país.
            </p>
          </div>
          <p style={{ margin: 0, fontSize: 13, opacity: '0.8' }}>
            Atención a las necesidades de cultores, cultoras y comunidades organizadas.
          </p>
        </aside>
        <div className="panel-form">
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
            <button className="btn btn-sec" type="submit" disabled={cargando} style={{ width: '100%' }}>
              {cargando ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>
          <p style={{ marginTop: 18 }}>
            ¿No tienes cuenta? <Link to="/registro">Regístrate aquí</Link>
          </p>
        </div>
      </div>
    </div>
  );
}