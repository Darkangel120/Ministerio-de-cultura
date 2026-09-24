import { FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../api';
import generarPDF from '../lib/reportePDF';

const TIPOS = {
  eventos: 'Eventos',
  cultores: 'Cultores',
  usuarios: 'Usuarios del Sistema',
  actividad_ejecutada: 'Actividades Ejecutadas',
  actividad_reportada: 'Actividades Reportadas',
};

// Columnas de presentación (nombres de columna del modelo)
const EVENTO_COLS = ['id', 'correo_usuario', 'estado', 'municipio', 'parroquia', 'organizacion', 'tipo_organizacion', 'direccion', 'ubicacion_exacta', 'consejo_comunal', 'nombre_consejo', 'nombre_comuna', 'vocero_nombre', 'vocero_cedula', 'responsable_nombre', 'responsable_cargo', 'tipo_actividad', 'disciplina', 'nombre_actividad', 'objetivo', 'mes', 'fecha', 'hora', 'duracion', 'ninos', 'ninas', 'jovenes_masculinos', 'jovenes_femeninas', 'adultos_masculinos', 'adultos_femeninas', 'asistentes'];
const CULTOR_COLS = ['id', 'nombres_apellidos', 'telefono', 'cedula', 'correo', 'area_tematica', 'disciplina', 'comuna', 'estado', 'municipio', 'parroquia', 'carnet_patria', 'fecha_nacimiento', 'trayectoria_anios', 'organizacion'];
const USUARIO_COLS = ['id', 'nombre_completo', 'email', 'telefono', 'tipo_usuario', 'estado', 'municipio', 'fecha_registro'];

export default function Reportes() {
  const [tipo, setTipo] = useState('eventos');
  const [vista, setVista] = useState('detallado');
  const [filtros, setFiltros] = useState({ responsable: '', municipio: '', id_evento: '', area_tematica: '', tipo_usuario: '', fecha_desde: '', fecha_hasta: '' });
  const [opciones, setOpciones] = useState({ responsables: [], municipios: [], eventos: [], areas: [], tipos_usuario: [] });
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    api('/api/reportes/filtros').then(setOpciones).catch((e) => setError(e.message));
  }, []);

  const set = (k) => (e) => setFiltros({ ...filtros, [k]: e.target.value });

  const columnas = tipo === 'cultores' ? CULTOR_COLS : tipo === 'usuarios' ? USUARIO_COLS : EVENTO_COLS;

  const consultar = async () => {
    setError(null); setCargando(true);
    try {
      const payload = { tipo, vista, ...filtros };
      if (!['eventos', 'actividad_ejecutada', 'actividad_reportada'].includes(tipo)) delete payload.responsable;
      const r = await api('/api/reportes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      setResultado(r);
    } catch (err) { setError(err.message); }
    finally { setCargando(false); }
  };

  const descargarPDF = async () => {
    const payload = { tipo, vista, ...filtros };
    const r = await api('/api/reportes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const subtitulo = [
      `Tipo: ${TIPOS[tipo]}`,
      ...(filtros.municipio ? [`Municipio: ${filtros.municipio}`] : []),
      ...(filtros.responsable ? [`Responsable: ${filtros.responsable}`] : []),
      ...(filtros.fecha_desde ? [`Desde: ${filtros.fecha_desde}`] : []),
      ...(filtros.fecha_hasta ? [`Hasta: ${filtros.fecha_hasta}`] : []),
    ].join(' · ');
    generarPDF({
      titulo: TIPOS[tipo],
      subtitulo,
      cabecera: [`Generado el ${new Date().toLocaleString('es-VE')} por el sistema de reportes`],
      columnas: columnas.map((c) => c.replace(/_/g, ' ').toUpperCase()),
      filas: r.filas,
      resumen: r.vista === 'general' ? r.resumen : {},
      distribuciones: r.distribuciones,
    });
  };

  return (
    <div className="contenedor">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div className="pagina-titulo" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
          <h1>Reportes</h1>
          <p className="subtitulo">Genera informes detallados o generales y descárgalos en PDF.</p>
        </div>
        <button className="btn" type="button" onClick={descargarPDF}>Descargar PDF</button>
      </div>
      {error && <div className="aviso aviso-error">{error}</div>}

      <div className="tarjeta">
        <div className="grilha grilha-2">
          <div className="campo">
            <label htmlFor="tipo">Tipo de reporte</label>
            <select id="tipo" value={tipo} onChange={(e) => { setTipo(e.target.value); setResultado(null); }}>
              {Object.entries(TIPOS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="vista">Vista</label>
            <select id="vista" value={vista} onChange={(e) => setVista(e.target.value)}>
              <option value="general">General (resumen)</option>
              <option value="detallado">Detallado</option>
            </select>
          </div>
          {(tipo === 'eventos' || tipo === 'actividad_ejecutada' || tipo === 'actividad_reportada') && (
            <>
              <div className="campo">
                <label htmlFor="responsable">Responsable</label>
                <select id="responsable" value={filtros.responsable} onChange={set('responsable')}>
                  <option value="">Todos</option>
                  {opciones.responsables.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="campo">
                <label htmlFor="municipio">Municipio</label>
                <select id="municipio" value={filtros.municipio} onChange={set('municipio')}>
                  <option value="">Todos</option>
                  {opciones.municipios.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="campo">
                <label htmlFor="id_evento">Evento</label>
                <select id="id_evento" value={filtros.id_evento} onChange={set('id_evento')}>
                  <option value="">Todos</option>
                  {opciones.eventos.map((e) => <option key={e.id} value={e.id}>{e.nombre_actividad}</option>)}
                </select>
              </div>
            </>
          )}
          {tipo === 'cultores' && (
            <div className="campo">
              <label htmlFor="area_tematica">Área temática</label>
              <select id="area_tematica" value={filtros.area_tematica} onChange={set('area_tematica')}>
                <option value="">Todas</option>
                {opciones.areas.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          )}
          {tipo === 'usuarios' && (
            <div className="campo">
              <label htmlFor="tipo_usuario">Tipo de usuario</label>
              <select id="tipo_usuario" value={filtros.tipo_usuario} onChange={set('tipo_usuario')}>
                <option value="">Todos</option>
                {opciones.tipos_usuario.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}
          <div className="campo"><label htmlFor="fecha_desde">Desde</label><input id="fecha_desde" type="date" value={filtros.fecha_desde} onChange={set('fecha_desde')} /></div>
          <div className="campo"><label htmlFor="fecha_hasta">Hasta</label><input id="fecha_hasta" type="date" value={filtros.fecha_hasta} onChange={set('fecha_hasta')} /></div>
        </div>
        <button className="btn btn-sec" type="button" onClick={consultar} disabled={cargando}>{cargando ? 'Generando…' : 'Generar Reporte'}</button>
      </div>

      {resultado && (
        <div className="tarjeta tabla-wrap">
          {resultado.vista === 'general' ? (
            <p><strong>Total:</strong> {resultado.resumen.total ?? resultado.filas.length}{resultado.resumen.asistentes != null ? ` · Asistentes: ${resultado.resumen.asistentes}` : ''}</p>
          ) : (
            <table className="tabla">
              <thead>
                <tr>{columnas.map((c) => <th key={c}>{c.replace(/_/g, ' ')}</th>)}</tr>
              </thead>
              <tbody>
                {resultado.filas.map((f, i) => (
                  <tr key={i}>{columnas.map((c) => <td key={c}>{f[c] ?? '—'}</td>)}</tr>
                ))}
              </tbody>
            </table>
          )}
          {resultado.filas.length === 0 && (
            <div className="vacio"><FileText size={42} style={{ marginBottom: 8 }} />No hay registros para este reporte.</div>
          )}
        </div>
      )}
    </div>
  );
}