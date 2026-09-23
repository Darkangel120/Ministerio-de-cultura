import { Pencil, Heart, MessageCircle, MessageSquare, Camera } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import useDatos from '../hooks/useDatos';
import { iniciales, colorAvatar } from '../lib/iniciales';
import { AREAS_TEMATICAS, CATEGORIAS_FORO } from '../constantes';
import MediaArchivo from '../componentes/MediaArchivo';

const ROL_LABEL = { admin: 'Administrador', director_general: 'Director General', director_operativo: 'Director Operativo', funcionario: 'Funcionario', cultor: 'Cultor', publico: 'Público' };

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

  const subirFoto = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    setMsg(null);
    setErrEdit(null);
    const fd = new FormData();
    fd.append('foto', archivo);
    try {
      await api('/api/usuarios/me/foto', { method: 'POST', body: fd });
      setMsg('Foto de perfil actualizada.');
      window.location.reload();
    } catch (err) { setErrEdit(err.message); }
  };

  if (error) return <div className="contenedor"><div className="aviso aviso-error">{error}</div></div>;
  if (!datos) return <div className="contenedor">Cargando perfil…</div>;

  const { usuario: u, cultor, publicaciones = [], stats = {} } = datos;

  return (
    <div className="contenedor" style={{ maxWidth: 860, margin: '0 auto' }}>
      <div className="tarjeta" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="perfil-cab">
          {u.foto_url ? (
            <img className="perfil-foto" src={u.foto_url} alt={u.nombre_completo} />
          ) : (
            <span className="avatar perfil-avatar" style={colorAvatar(u.nombre_completo)}>{iniciales(u.nombre_completo)}</span>
          )}
          <div>
            <h2>{u.nombre_completo}</h2>
            <div className="metadatos">
              {u.email} · {u.telefono || 'sin teléfono'} · <span className="badge badge-amarillo">{ROL_LABEL[u.tipo_usuario] || u.tipo_usuario}</span>
            </div>
            {esPropio && (
              <div className="componer-pie" style={{ marginTop: 14 }}>
                <label className="adjuntar">
                  <Camera size={15} /> Cambiar foto
                  <input type="file" accept=".jpg,.jpeg,.png,.webp,.gif" onChange={subirFoto} />
                </label>
              </div>
            )}
          </div>
        </div>
        <div style={{ padding: '22px 24px' }}>
          {esPropio && (
            <button className="btn btn-sec btn-sm" type="button" onClick={() => setEditando(!editando)}>
              <Pencil size={13} style={{ verticalAlign: '-2px', marginRight: 5 }} />
              {editando ? 'Cancelar' : 'Editar mis datos'}
            </button>
          )}
          {cultor && (
            <div className="perfil-ficha" style={{ marginTop: esPropio ? 16 : 0 }}>
              <h3 style={{ marginTop: 0, color: 'var(--azul)' }}>Ficha de Cultor</h3>
              <p style={{ margin: 0 }}>
                <span className="badge badge-azul" style={{ marginRight: 6 }}>{AREAS_TEMATICAS[cultor.area_tematica] || cultor.area_tematica}</span>
                {cultor.disciplina} · Cédula {cultor.cedula}<br />
                {cultor.comuna} · {cultor.municipio}, {cultor.parroquia}<br />
                Trayectoria: {cultor.trayectoria_anios} años · Organización: {cultor.organizacion || '—'}
              </p>
            </div>
          )}
          {esPropio && editando && (
            <form onSubmit={guardar} style={{ marginTop: 16 }}>
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
      </div>

      <div className="grilha grilha-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <div className="tarjeta tarjeta-estadistica"><div className="valor">{stats.publicaciones ?? publicaciones.length}</div><div className="etiqueta">Publicaciones</div></div>
        <div className="tarjeta tarjeta-estadistica"><div className="valor">{stats.comentarios ?? 0}</div><div className="etiqueta">Comentarios</div></div>
        <div className="tarjeta tarjeta-estadistica"><div className="valor">{stats.likes_recibidos ?? 0}</div><div className="etiqueta">Likes recibidos</div></div>
      </div>

      <h2 className="seccion-titulo">Publicaciones de {u.nombre_completo}</h2>
      {publicaciones.map((p) => (
        <article className="tarjeta" key={p.id}>
          <div className="post-cab">
            <h4 style={{ margin: 0, color: 'var(--azul)' }}>{p.titulo}</h4>
            <span className="badge badge-amarillo">{CATEGORIAS_FORO[p.categoria] || p.categoria}</span>
          </div>
          <p>{p.descripcion}</p>
          <MediaArchivo publicacion={p} />
          <p style={{ color: 'var(--texto-fantasma)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 14, marginTop: 10 }}>
            <span><Heart size={13} fill="var(--rojo)" color="var(--rojo)" style={{ verticalAlign: '-1px', marginRight: 3 }} />{p.likes_count}</span>
            <span><MessageSquare size={13} color="var(--azul)" style={{ verticalAlign: '-1px', marginRight: 3 }} />{p.comments_count}</span>
            <span>{new Date(p.fecha_publicacion).toLocaleDateString('es-VE', { dateStyle: 'long' })}</span>
          </p>
        </article>
      ))}
      {publicaciones.length === 0 && (
        <div className="vacio"><MessageCircle size={42} style={{ marginBottom: 8 }} />Este usuario aún no ha publicado.</div>
      )}
    </div>
  );
}