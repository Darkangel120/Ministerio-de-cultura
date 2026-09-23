import { useEffect, useState } from 'react';
import { api } from '../api';
import { AREAS_TEMATICAS } from '../constantes';

const vacio = {
  nombres_apellidos: '', telefono: '', cedula: '', correo: '', area_tematica: '',
  disciplina: '', comuna: '', municipio: '', parroquia: '', carnet_patria: '',
  direccion: '', lugar_nacimiento: '', fecha_nacimiento: '', edad: '', trayectoria_anios: 0, organizacion: '',
};

export default function Cultores() {
  const [cultores, setCultores] = useState([]);
  const [opciones, setOpciones] = useState({ areas: [], municipios: [] });
  const [fArea, setFArea] = useState('');
  const [fMun, setFMun] = useState('');
  const [error, setError] = useState(null);
  const [form, setForm] = useState(vacio);
  const [editandoId, setEditandoId] = useState(null);
  const [abierto, setAbierto] = useState(false);

  const cargar = async () => {
    const q = new URLSearchParams();
    if (fArea) q.set('area_tematica', fArea);
    if (fMun) q.set('municipio', fMun);
    try {
      const r = await api(`/api/cultores?${q.toString()}`);
      setCultores(r.cultores);
    } catch (e) { setError(e.message); }
  };

  useEffect(() => { cargar(); }, [fArea, fMun]);
  useEffect(() => {
    api('/api/cultores/opciones').then((r) => setOpciones(r)).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const abrirNuevo = () => { setForm(vacio); setEditandoId(null); setAbierto(true); };
  const abrirEdicion = (c) => { const { id, fecha_registro, ...resto } = c; resto.fecha_nacimiento = c.fecha_nacimiento.slice(0, 10); setForm(resto); setEditandoId(id); setAbierto(true); };

  const guardar = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (editandoId) await api(`/api/cultores/${editandoId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      else await api('/api/cultores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      setAbierto(false);
      cargar();
    } catch (err) { setError(err.message); }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este cultor?')) return;
    try { await api(`/api/cultores/${id}`, { method: 'DELETE' }); cargar(); } catch (err) { setError(err.message); }
  };

  return (
    <div className="contenedor">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h2>Cultores</h2>
        <button className="btn" type="button" onClick={abrirNuevo}>Registrar Cultor</button>
      </div>
      {error && <div className="aviso aviso-error">{error}</div>}

      <div className="tarjeta" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div className="campo" style={{ minWidth: 180 }}>
          <label htmlFor="fArea">Área temática</label>
          <select id="fArea" value={fArea} onChange={(e) => setFArea(e.target.value)}>
            <option value="">Todas las áreas</option>
            {opciones.areas.map((a) => <option key={a} value={a}>{AREAS_TEMATICAS[a] || a}</option>)}
          </select>
        </div>
        <div className="campo" style={{ minWidth: 180 }}>
          <label htmlFor="fMun">Municipio</label>
          <select id="fMun" value={fMun} onChange={(e) => setFMun(e.target.value)}>
            <option value="">Todos los municipios</option>
            {opciones.municipios.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div className="grilha grilha-3">
        {cultores.map((c) => (
          <div className="tarjeta" key={c.id}>
            <h3 style={{ color: 'var(--azul)', margin: 0, fontSize: 17 }}>{c.nombres_apellidos}</h3>
            <p style={{ color: '#666', fontSize: 13 }}>{AREAS_TEMATICAS[c.area_tematica] || c.area_tematica} — {c.disciplina}</p>
            <p>Cédula: {c.cedula}<br />Correo: {c.correo}<br />Municipio: {c.municipio}, {c.parroquia}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-sec" type="button" onClick={() => abrirEdicion(c)}>Editar</button>
              <button className="btn-bajo" type="button" onClick={() => eliminar(c.id)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      {abierto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', overflowY: 'auto', zIndex: 50 }}>
          <div className="tarjeta" style={{ maxWidth: 820, margin: '40px auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ color: 'var(--azul)' }}>{editandoId ? 'Editar Cultor' : 'Registrar Cultor'}</h2>
              <button className="btn-bajo" type="button" onClick={() => setAbierto(false)}>Cerrar</button>
            </div>
            <form onSubmit={guardar}>
              <div className="grilha grilha-2">
                <div className="campo"><label>Nombres y apellidos *</label><input value={form.nombres_apellidos} onChange={set('nombres_apellidos')} required /></div>
                <div className="campo"><label>Teléfono *</label><input value={form.telefono} onChange={set('telefono')} required /></div>
                <div className="campo"><label>Cédula *</label><input value={form.cedula} onChange={set('cedula')} required /></div>
                <div className="campo"><label>Correo *</label><input type="email" value={form.correo} onChange={set('correo')} required /></div>
                <div className="campo"><label>Área temática *</label>
                  <select value={form.area_tematica} onChange={set('area_tematica')} required>
                    <option value="">Seleccionar...</option>
                    {Object.entries(AREAS_TEMATICAS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select></div>
                <div className="campo"><label>Disciplina *</label><input value={form.disciplina} onChange={set('disciplina')} required /></div>
                <div className="campo"><label>Comuna *</label><input value={form.comuna} onChange={set('comuna')} required /></div>
                <div className="campo"><label>Municipio *</label><input value={form.municipio} onChange={set('municipio')} required /></div>
                <div className="campo"><label>Parroquia *</label><input value={form.parroquia} onChange={set('parroquia')} required /></div>
                <div className="campo"><label>Código carnet patria *</label><input value={form.carnet_patria} onChange={set('carnet_patria')} required /></div>
                <div className="campo"><label>Dirección exacta *</label><input value={form.direccion} onChange={set('direccion')} required /></div>
                <div className="campo"><label>Lugar de nacimiento *</label><input value={form.lugar_nacimiento} onChange={set('lugar_nacimiento')} required /></div>
                <div className="campo"><label>Fecha de nacimiento *</label><input type="date" value={form.fecha_nacimiento} onChange={set('fecha_nacimiento')} required /></div>
                <div className="campo"><label>Edad *</label><input type="number" min="0" value={form.edad} onChange={set('edad')} required /></div>
                <div className="campo"><label>Años de trayectoria *</label><input type="number" min="0" max="100" value={form.trayectoria_anios} onChange={set('trayectoria_anios')} required /></div>
                <div className="campo"><label>Organización *</label><input value={form.organizacion} onChange={set('organizacion')} required /></div>
              </div>
              <button className="btn" type="submit">{editandoId ? 'Guardar Cambios' : 'Registrar Cultor'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}