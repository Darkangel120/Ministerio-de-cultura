import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import './estilos/base.css';
import Header from './componentes/Header';
import Footer from './componentes/Footer';
import Bandera from './componentes/Bandera';
import RequeridoLayout from './componentes/RequeridoLayout';
import Inicio from './paginas/Inicio';
import MisionVision from './paginas/MisionVision';
import MarcoLegal from './paginas/MarcoLegal';
import Transparencia from './paginas/Transparencia';
import Contacto from './paginas/Contacto';
import Login from './paginas/Login';
import Registro from './paginas/Registro';
import Foro from './paginas/Foro';
import Perfil from './paginas/Perfil';
import Panel from './paginas/Panel';
import Calendario from './paginas/Calendario';
import Cultores from './paginas/Cultores';
import Reportes from './paginas/Reportes';
import CrearUsuario from './paginas/CrearUsuario';

const ROLES_GESTION = ['admin', 'director_general', 'director_operativo', 'funcionario'];
const ROLES_CREAR_USUARIO = ['admin', 'director_general', 'director_operativo'];

function Layout() {
  return (
    <>
      <Bandera />
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Inicio />} />
            <Route path="/mision-vision" element={<MisionVision />} />
            <Route path="/marco-legal" element={<MarcoLegal />} />
            <Route path="/transparencia" element={<Transparencia />} />
            <Route path="/contacto" element={<Contacto />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/foro" element={<Foro />} />
            <Route path="/calendario" element={<Calendario />} />
            <Route path="/perfil/:id" element={<Perfil />} />
            <Route element={<RequeridoLayout roles={ROLES_GESTION} />}>
              <Route path="/panel" element={<Panel />} />
              <Route path="/cultores" element={<Cultores />} />
              <Route path="/reportes" element={<Reportes />} />
              <Route element={<RequeridoLayout roles={ROLES_CREAR_USUARIO} />}>
                <Route path="/crear-usuario" element={<CrearUsuario />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);