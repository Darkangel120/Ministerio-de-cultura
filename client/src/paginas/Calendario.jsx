import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Landmark, Plus, Pencil, Trash2, Flag, XCircle } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { SelectEstado, SelectMunicipio } from '../componentes/SelectUbicacion';
import {
  MESES, CARGOS_RESPONSABLE, TIPOS_ORGANIZACION, TIPOS_ACTIVIDAD,
  DISCIPLINAS_EVENTO, OBJETIVOS_TRANSFORMADORES, ESTADO_EJECUCION,
} from '../constantes';

const vacio = {
  estado: '', municipio: '', parroquia: '', organizacion: '', tipo_organizacion: 'comuna',
  direccion: '', ubicacion_exacta: '', consejo_comunal: '', nombre_consejo: '', nombre_comuna: '',
  vocero_nombre: '', vocero_cedula: '', vocero_telefono: '',
  responsable_nombre: '', responsable_cedula: '', responsable_telefono: '', responsable_cargo: '',
  tipo_actividad: '', disciplina: '', nombre_actividad: '', objetivo: '',
  mes: '', fecha: '', hora: '', duracion: '',
  ninos: 0, ninas: 0, jovenes_masculinos: 0, jovenes_femeninas: 0, adultos_masculinos: 0, adultos_femeninas: 0,
};

const PARTICIPANTES = [
  ['ninos', 'Niños (1 a 12 años)'],
  ['ninas', 'Niñas (1 a 12 años)'],
  ['jovenes_masculinos', 'Jóvenes masculinos (12 a 17 años)'],
  ['jovenes_femeninas', 'Jóvenes femeninas (12 a 17 años)'],
  ['adultos_masculinos', 'Adultos masculinos (18+)'],
  ['adultos_femeninas', 'Adultas femeninas (18+)'],
];

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function Calendario() {
  const { usuario } = useAuth();
  const esStaff = ['admin', 'director_general', 'director_operativo', 'funcionario'].includes(usuario?.tipo);
  const esNacional = usuario?.tipo === 'admin' || usuario?.tipo === 'director_general';
  const estadoFijo = ['director_operativo', 'funcionario'].includes(usuario?.tipo);
  const municipioFijo = usuario?.tipo === 'funcionario';
  const puedeEditar = (ev) => esNacional || ev?.correo_usuario === usuario?.email;
  const ahora = new Date();
  const [anio, setAnio] = useState(ahora.getFullYear());
  const [mes, setMes] = useState(ahora.getMonth() + 1);
  const [eventos, setEventos] = useState([]);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(vacio);
  const [editandoId, setEditandoId] = useState(null);
  const [abierto, setAbierto] = useState(false);
  const [detalle, setDetalle] = useState(null);

  const cargar = async () => {
    try {
      const r = await api(`/api/eventos?mes=${mes}&anio=${anio}`);
      setEventos(r.eventos);
    } catch (e) { setError(e.message); }
  };
  useEffect(() => { cargar(); }, [mes, anio]);

  const primerDia = new Date(anio, mes - 1, 1).getDay();
  const diasMes = new Date(anio, mes, 0).getDate();
  const celdas = Array.from({ length: primerDia }, () => null).concat(Array.from({ length: diasMes }, (_, i) => i + 1));
  const porDia = {};
  eventos.forEach((e) => { const d = new Date(e.fecha).getDate(); (porDia[d] = porDia[d] || []).push(e); });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const abrirNuevo = () => {
    setForm({ ...vacio, mes: String(mes), estado: usuario?.estado || '', municipio: municipioFijo ? usuario?.municipio || '' : '' });
    setEditandoId(null);
    setAbierto(true);
  };
  const abrirEdicion = (ev) => {
    const { id, fecha, hora, ...resto } = ev;
    const alcanceUsuario = { ...resto, estado: estadoFijo ? usuario?.estado : resto.estado, municipio: municipioFijo ? usuario?.municipio : resto.municipio };
    setForm({ ...alcanceUsuario, fecha: fecha.slice(0, 10), hora: hora.slice(0, 5), mes: String(ev.mes) });
    setEditandoId(id);
    setAbierto(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError(null);
    const payload = { ...form, mes: Number(form.mes) };
    try {
      if (editandoId) await api(`/api/eventos/${editandoId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      else await api('/api/eventos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      setAbierto(false);
      cargar();
    } catch (err) { setError(err.message); }
  };

  const ejecutar = async (id) => {
    try { await api(`/api/eventos/${id}/ejecutar`, { method: 'POST' }); cargar(); } catch (err) { setError(err.message); }
  };
  const cancelar = async (id) => {
    if (!window.confirm('¿Cancelar esta actividad? Quedará registrada como cancelada.')) return;
    try { await api(`/api/eventos/${id}/cancelar`, { method: 'POST' }); setAbierto(false); cargar(); } catch (err) { setError(err.message); }
  };
  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta actividad?')) return;
    try { await api(`/api/eventos/${id}`, { method: 'DELETE' }); setAbierto(false); cargar(); } catch (err) { setError(err.message); }
  };

  const cambiarMes = (delta) => {
    const m0 = mes + delta;
    if (m0 === 0) { setMes(12); setAnio(anio - 1); }
    else if (m0 === 13) { setMes(1); setAnio(anio + 1); }
    else setMes(m0);
  };
  const irHoy = () => { setMes(ahora.getMonth() + 1); setAnio(ahora.getFullYear()); };

  return (
    <div className="contenedor">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div className="pagina-titulo" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
          <h1>Agenda de Eventos Culturales</h1>
          <p className="subtitulo">Actividades culturales del pueblo venezolano, de acceso público.</p>
        </div>
        {esStaff && (
          <button className="btn" type="button" onClick={abrirNuevo} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Plus size={18} /> Registrar Evento
          </button>
        )}
      </div>
      {error && <div className="aviso aviso-error">{error}</div>}

      <div className="tarjeta">
        <div className="cal-cab">
          <div className="cal-nav">
            <button className="cal-flecha" type="button" onClick={() => cambiarMes(-1)} title="Mes anterior"><ChevronLeft size={20} /></button>
            <strong className="cal-fecha">{MESES[mes - 1]} {anio}</strong>
            <button className="cal-flecha" type="button" onClick={() => cambiarMes(1)} title="Mes siguiente"><ChevronRight size={20} /></button>
          </div>
          <button className="btn btn-bajo btn-sm" type="button" onClick={irHoy}>Hoy</button>
          <div className="cal-selecciona">
            <select aria-label="Mes" value={mes} onChange={(e) => setMes(Number(e.target.value))}>
              {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <input type="number" aria-label="Año" value={anio} onChange={(e) => setAnio(Number(e.target.value))} />
          </div>
          <span style={{ color: 'var(--texto-suave)', fontSize: 14, marginLeft: 'auto' }}>
            {eventos.length} actividad{eventos.length === 1 ? '' : 'es'}
          </span>
        </div>
        <div className="cal-grid">
          {DIAS.map((d) => <div className="cal-dia-nombre" key={d}>{d}</div>)}
          {celdas.map((d, i) => (
            <div className={d ? 'cal-dia' : 'cal-dia cal-dia-vacio'} key={i}>
              {d && (
                <>
                  <div className="num">{d}</div>
                  {(porDia[d] || []).map((ev) => (
                    <div key={ev.id} className="cal-evento" title={puedeEditar(ev) ? 'Editar actividad' : ev.nombre_actividad}
                      onClick={() => (puedeEditar(ev) ? abrirEdicion(ev) : setDetalle(ev))}>
                      {ev.nombre_actividad}
                    </div>
                  ))}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {detalle && !esStaff && (
        <div className="modal-fondo" onClick={(e) => { if (e.target === e.currentTarget) setDetalle(null); }}>
          <div className="tarjeta modal-tarjeta" style={{ marginBottom: 0, maxWidth: 640 }}>
            <div className="modal-cab">
              <h2>{detalle.nombre_actividad}</h2>
              <button className="btn btn-bajo cerrar" type="button" onClick={() => setDetalle(null)}>Cerrar</button>
            </div>
            <div className="modal-cuerpo">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                <span className="badge badge-amarillo">{detalle.disciplina}</span>
                <span className="badge badge-azul">{detalle.tipo_actividad}</span>
                <span className="badge badge-rojo">{ESTADO_EJECUCION[detalle.estado_ejecucion] || detalle.estado_ejecucion || 'programada'}</span>
              </div>
              <div className="perfil-ficha" style={{ marginBottom: 12 }}>
                <p style={{ margin: 0, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={16} color="var(--rojo)" /> <strong>{detalle.estado}</strong> — {detalle.municipio}, parroquia {detalle.parroquia}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Landmark size={15} color="var(--azul)" /> {detalle.direccion}
                </p>
                {detalle.ubicacion_exacta && <p style={{ margin: '4px 0 0', fontSize: 14 }}>Punto y círculo: {detalle.ubicacion_exacta}</p>}
              </div>
              <div className="perfil-ficha" style={{ marginBottom: 12 }}>
                <p style={{ margin: 0, fontSize: 14 }}>
                  <strong>{new Date(detalle.fecha).toLocaleDateString('es-VE', { dateStyle: 'long' })}</strong> · {detalle.hora?.slice(0, 5)} h · {detalle.duracion} hora{Number(detalle.duracion) === 1 ? '' : 's'}
                </p>
              </div>
              <p style={{ margin: 0, fontSize: 14 }}>
                <strong>Objetivo transformador:</strong> {detalle.objetivo}<br />
                <strong>Organización:</strong> {(TIPOS_ORGANIZACION[detalle.tipo_organizacion] || detalle.tipo_organizacion)} · {detalle.nombre_comuna}
              </p>
            </div>
          </div>
        </div>
      )}

      {abierto && (
        <div className="modal-fondo" onClick={(e) => { if (e.target === e.currentTarget) setAbierto(false); }}>
          <div className="tarjeta modal-tarjeta" style={{ marginBottom: 0 }}>
            <div className="modal-cab">
              <h2>{editandoId ? 'Editar Actividad' : 'Nueva Actividad — Misión Cultura'}</h2>
              <button className="btn btn-bajo cerrar" type="button" onClick={() => setAbierto(false)}>Cerrar</button>
            </div>
            <div className="modal-cuerpo">
              <form onSubmit={guardar}>
                <div className="form-seccion" style={{ marginTop: 0, borderTop: 'none', paddingTop: 0 }}>
                  <h3>Información General</h3>
                  <div className="campo"><label>Correo electrónico</label><input value={usuario?.email} readOnly /></div>
                </div>
                <div className="form-seccion">
                  <h3>Ubicación Geográfica</h3>
                  <div className="grilha grilha-2">
                    <div className="campo"><label>Estado *</label>
                      <SelectEstado value={form.estado} onChange={(v) => setForm({ ...form, estado: v, municipio: municipioFijo ? form.municipio : '' })} disabled={estadoFijo} required /></div>
                    <div className="campo"><label>Municipio *</label>
                      <SelectMunicipio estado={form.estado} value={form.municipio} onChange={set('municipio')} disabled={municipioFijo} required /></div>
                    <div className="campo"><label>Parroquia *</label><input value={form.parroquia} onChange={set('parroquia')} required /></div>
                    <div className="campo"><label>Organización *</label><input value={form.organizacion} onChange={set('organizacion')} required /></div>
                    <div className="campo"><label>Identificar si es comunas o circuito comunal</label>
                      <select value={form.tipo_organizacion} onChange={set('tipo_organizacion')}>
                        {Object.entries(TIPOS_ORGANIZACION).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select></div>
                    <div className="campo"><label>Dirección exacta *</label><input value={form.direccion} onChange={set('direccion')} required /></div>
                    <div className="campo"><label>Ubicación exacta del punto y círculo</label><input value={form.ubicacion_exacta} onChange={set('ubicacion_exacta')} /></div>
                    <div className="campo"><label>Consejo comunal vinculado *</label><input value={form.consejo_comunal} onChange={set('consejo_comunal')} required /></div>
                    <div className="campo"><label>Nombre del consejo comunal</label><input value={form.nombre_consejo} onChange={set('nombre_consejo')} /></div>
                    <div className="campo"><label>Nombre de la comuna o circuito comunal *</label><input value={form.nombre_comuna} onChange={set('nombre_comuna')} required /></div>
                  </div>
                </div>
                <div className="form-seccion">
                  <h3>Datos del Vocero Responsable de la Comunidad</h3>
                  <div className="grilha grilha-3">
                    <div className="campo"><label>Nombre y apellido *</label><input value={form.vocero_nombre} onChange={set('vocero_nombre')} required /></div>
                    <div className="campo"><label>Cédula *</label><input value={form.vocero_cedula} onChange={set('vocero_cedula')} required /></div>
                    <div className="campo"><label>Teléfono *</label><input value={form.vocero_telefono} onChange={set('vocero_telefono')} required /></div>
                  </div>
                </div>
                <div className="form-seccion">
                  <h3>Datos del Responsable por Misión Cultura</h3>
                  <div className="grilha grilha-2">
                    <div className="campo"><label>Nombre y apellido *</label><input value={form.responsable_nombre} onChange={set('responsable_nombre')} required /></div>
                    <div className="campo"><label>Teléfono *</label><input value={form.responsable_telefono} onChange={set('responsable_telefono')} required /></div>
                    <div className="campo"><label>Cédula *</label><input value={form.responsable_cedula} onChange={set('responsable_cedula')} required /></div>
                    <div className="campo"><label>Cargo *</label>
                      <select value={form.responsable_cargo} onChange={set('responsable_cargo')} required>
                        <option value="">Seleccione un cargo</option>
                        {CARGOS_RESPONSABLE.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select></div>
                  </div>
                </div>
                <div className="form-seccion">
                  <h3>Descripción de la Actividad</h3>
                  <div className="grilha grilha-2">
                    <div className="campo"><label>Tipo de actividad *</label>
                      <select value={form.tipo_actividad} onChange={set('tipo_actividad')} required>
                        <option value="">Seleccione un tipo de actividad</option>
                        {TIPOS_ACTIVIDAD.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select></div>
                    <div className="campo"><label>Disciplina *</label>
                      <select value={form.disciplina} onChange={set('disciplina')} required>
                        <option value="">Seleccione una disciplina</option>
                        {DISCIPLINAS_EVENTO.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select></div>
                    <div className="campo"><label>Nombre de la actividad *</label><input value={form.nombre_actividad} onChange={set('nombre_actividad')} required /></div>
                    <div className="campo"><label>Objetivo transformador (contenido) *</label>
                      <select value={form.objetivo} onChange={set('objetivo')} required>
                        <option value="">Seleccione un objetivo transformador</option>
                        {OBJETIVOS_TRANSFORMADORES.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select></div>
                  </div>
                </div>
                <div className="form-seccion">
                  <h3>Fecha y Hora</h3>
                  <div className="grilha grilha-3">
                    <div className="campo"><label>Mes *</label>
                      <select value={form.mes} onChange={set('mes')} required>
                        <option value="">Seleccione</option>
                        {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                      </select></div>
                    <div className="campo"><label>Fecha *</label><input type="date" value={form.fecha} onChange={set('fecha')} required /></div>
                    <div className="campo"><label>Hora *</label><input type="time" value={form.hora} onChange={set('hora')} required /></div>
                    <div className="campo"><label>Duración (horas) *</label><input type="number" min="1" value={form.duracion} onChange={set('duracion')} required /></div>
                  </div>
                </div>
                <div className="form-seccion">
                  <h3>Datos de Participación (Beneficiarios)</h3>
                  <div className="grilha grilha-3">
                    {PARTICIPANTES.map(([k, label]) => (
                      <div className="campo" key={k}><label>{label} *</label><input type="number" min="0" value={form[k]} onChange={set(k)} required /></div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
                  <button className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }} type="submit">
                    <Pencil size={15} /> {editandoId ? 'Guardar Cambios' : 'Agregar Actividad'}
                  </button>
                  {editandoId && (
                    <>
                      <button className="btn btn-sec" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }} type="button" onClick={() => ejecutar(editandoId)}>
                        <Flag size={15} /> Marcar como Reportada
                      </button>
                      <button className="btn btn-bajo" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }} type="button" onClick={() => cancelar(editandoId)}>
                        <XCircle size={15} /> Cancelar Actividad
                      </button>
                      <button className="btn btn-bajo" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }} type="button" onClick={() => eliminar(editandoId)}>
                        <Trash2 size={15} /> Eliminar
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}