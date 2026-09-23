import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import useDatos from '../hooks/useDatos';
import { AREAS_TEMATICAS, CATEGORIAS_FORO } from '../constantes';
import MediaArchivo from '../componentes/MediaArchivo';

export default function Perfil() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const { datos, error } = useDatos(`/api/usuarios/${id}`);
  const [form, setForm] = useState({ nombre_completo: '', telefono: '' });
  const [editando, setEditando] = useState(false);
  const [msg, setMsg] = useState(null);
  const [errEdit, setErrEdit] = useState(null);

  useEffect(() => {
    if (datos) {
      setForm({
        nombre_completo: datos.usuario.nombre_completo || '',
        telefono: datos.usuario.telefono || '',
      });
    }
  }, [datos]);

  const esPropio = usuario?.id === Number(id);

  const guardar = async (e) => {
    e.preventDefault();
    setErrEdit(null);
    setMsg(null);
    try {
      const r = await api('/api/usuarios/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setForm({ nombre_completo: r.usuario.nombre_completo, telefono: r.usuario.telefono || '' });
      setEditando(false);
      setMsg('Datos actualizados.');
    } catch (err) { setErrEdit(err.message); }
  };

  if (error) return <div className="contenedor"><div className="aviso aviso-error">{error}</div></div>;
  if (!datos) return <div className="contenedor">Cargando perfil…</div>;

  const { usuario: u, cultor, publicaciones = [], stats = {} } = datos;

  return (
    <div className="contenedor" style={{ maxWidth: 860, margin: '0 auto' }}>
      <div className="tarjeta">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <h2 style={{ color: 'var(--azul)', marginTop: 0 }}>{u.nombre_completo}</h2>
          {esPropio && (
            <button className="btn-sec" type="button" onClick={() => setEditando(!editando)}>
              {editando ? 'Cancelar' : 'Editar mis datos'}
            </button>
          )}
        </div>
        <p>Correo: {u.email} · Teléfono: {u.telefono || '—'} · Rol: {u.tipo_usuario}</p>
        {cultor && (
          <div style={{ background: '#faf8f0', border: '1px solid var(--borde)', borderRadius: 6, padding: 12 }}>
            <h3 style={{ marginTop: 0, color: 'var(--rojo)' }}>Ficha de Cultor</h3>
            <p>
              Cédula: {cultor.cedula} · {AREAS_TEMATICAS[cultor.area_tematica] || cultor.area_tematica} — {cultor.disciplina}<br />
              Comuna: {cultor.comuna} · Municipio: {cultor.municipio}, {cultor.parroquia}<br />
              Trayectoria: {cultor.trayectoria_anios} años · Organización: {cultor.organizacion || '—'}
            </p>
          </div>
        )}
        {esPropio && editando && (
          <form onSubmit={guardar} style={{ marginTop: 12 }}>
            {msg && <div className="aviso aviso-ok">{msg}</div>}
            {errEdit && <div className="aviso aviso-error">{errEdit}</div>}
            <div className="grilha grilha-2">
              <div className="campo"><label htmlFor="nombre_completo">Nombre completo</label><input id="nombre_completo" value={form.nombre_completo} onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })} required /></div>
              <div className="campo"><label htmlFor="telefono">Teléfono</label><input id="telefono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} /></div>
            </div>
            <button className="btn" type="submit">Guardar cambios</button>
          </form>
        )}
      </div>

      <div className="grilha grilha-3">
        <div className="tarjeta" style={{ textAlign: 'center' }}><div style={{ fontSize: 30, fontWeight: 700, color: 'var(--azul)' }}>{stats.publicaciones ?? publicaciones.length}</div><div style={{ color: '#666', fontSize: 12, textTransform: 'uppercase' }}>Publicaciones</div></div>
        <div className="tarjeta" style={{ textAlign: 'center' }}><div style={{ fontSize: 30, fontWeight: 700, color: 'var(--azul)' }}>{stats.comentarios ?? 0}</div><div style={{ color: '#666', fontSize: 12, textTransform: 'uppercase' }}>Comentarios</div></div>
        <div className="tarjeta" style={{ textAlign: 'center' }}><div style={{ fontSize: 30, fontWeight: 700, color: 'var(--azul)' }}>{stats.likes_recibidos ?? 0}</div><div style={{ color: '#666', fontSize: 12, textTransform: 'uppercase' }}>Likes recibidos</div></div>
      </div>

      <h3>Publicaciones de {u.nombre_completo}</h3>
      {publicaciones.map((p) => (
        <article className="tarjeta" key={p.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <h4 style={{ margin: 0, color: 'var(--azul)' }}>{p.titulo}</h4>
            <span style={{ background: 'var(--amarillo)', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>{CATEGORIAS_FORO[p.categoria] || p.categoria}</span>
          </div>
          <p>{p.descripcion}</p>
          <MediaArchivo publicacion={p} />
          <p style={{ color: '#888', fontSize: 12 }}>♥ {p.likes_count} · 💬 {p.comments_count} · {new Date(p.fecha_publicacion).toLocaleDateString('es-VE', { dateStyle: 'long' })}</p>
        </article>
      ))}
    </div>
  );
}