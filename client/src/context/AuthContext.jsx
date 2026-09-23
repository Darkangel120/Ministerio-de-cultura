import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cultor, setCultor] = useState(null);
  const [cargando, setCargando] = useState(true);

  const refrescar = async () => {
    try {
      const { usuario: u, cultor: c } = await api('/api/usuarios/me');
      setUsuario(u);
      setCultor(c);
    } catch {
      setUsuario(null);
      setCultor(null);
    }
  };

  useEffect(() => {
    (async () => { await refrescar(); setCargando(false); })();
  }, []);

  const login = async (email, password) => {
    const r = await api('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    await refrescar();
    return r;
  };

  const registrar = async (datos) => {
    const r = await api('/api/auth/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    });
    await refrescar();
    return r;
  };

  const logout = async () => {
    await api('/api/auth/logout', { method: 'POST' });
    setUsuario(null);
    setCultor(null);
  };

  const esStaff = usuario && ['admin', 'director_general', 'director_operativo', 'funcionario'].includes(usuario.tipo);
  const esAdmin = usuario && ['admin', 'director_general'].includes(usuario.tipo);

  return (
    <AuthContext.Provider value={{ usuario, cultor, cargando, login, registrar, logout, refrescar, esStaff, esAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);