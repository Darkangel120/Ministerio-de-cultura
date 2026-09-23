import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { CATEGORIAS_FORO } from '../constantes';
import MediaArchivo from '../componentes/MediaArchivo';

const nuevoVacio = { titulo: '', categoria: 'musica', descripcion: '', archivo: null };

export default function Foro() {
  const { usuario } = useAuth();
  const [publicaciones, setPublicaciones] = useState([]);
  const [error, setError] = useState(null);
  const [nueva, setNueva] = useState(nuevoVacio);
  const [editando, setEditando] = useState(null);
  const [comentariosDe, setComentariosDe] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [textoComentario, setTextoComentario] = useState('');

  const cargar = async () => {
    try {
      const r = await api('/api/foro');
      setPublicaciones(r.publicaciones);
    } catch (e) { setError(e.message); }
  };
  useEffect(() => { cargar(); }, []);

  const abrirComentarios = async (id) => {
    setComentariosDe(id);
    const r = await api(`/api/foro/publicaciones/${id}/comentarios`);
    setComentarios(r.comentarios);
  };

  const crearPublicacion = async (e) => {
    e.preventDefault();
    if (!usuario) { setError('Debes iniciar sesión para publicar'); return; }
    const fd = new FormData();
    fd.append('titulo', nueva.titulo);
    fd.append('categoria', nueva.categoria);
    fd.append('descripcion', nueva.descripcion);
    if (nueva.archivo) fd.append('archivo', nueva.archivo);
    try {
      await api('/api/foro/publicaciones', { method: 'POST', body: fd });
      setNueva(nuevoVacio);
      cargar();
    } catch (err) { setError(err.message); }
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('titulo', editando.titulo);
    fd.append('categoria', editando.categoria);
    fd.append('descripcion', editando.descripcion);
    if (editando.archivo) fd.append('archivo', editando.archivo);
    await api(`/api/foro/publicaciones/${editando.id}`, { method: 'PUT', body: fd });
    setEditando(null);
    cargar();
  };

  const toggleLike = async (p) => {
    if (!usuario) { setError('Debes iniciar sesión para dar like'); return; }
    try {
      const r = await api(`/api/foro/publicaciones/${p.id}/like`, { method: 'POST' });
      setPublicaciones((prev) => prev.map((x) =>
        x.id === p.id
          ? { ...x, mio_like: r.liked, likes_count: x.likes_count + (r.liked ? 1 : -1) }
          : x
      ));
    } catch (err) { setError(err.message); }
  };

  const borrar = async (id) => {
    if (!window.confirm('¿Eliminar esta publicación?')) return;
    try {
      await api(`/api/foro/publicaciones/${id}`, { method: 'DELETE' });
      if (comentariosDe === id) setComentariosDe(null);
      cargar();
    } catch (err) { setError(err.message); }
  };

  const enviarComentario = async (e) => {
    e.preventDefault();
    if (!usuario) { setError('Debes iniciar sesión para comentar'); return; }
    await api(`/api/foro/publicaciones/${comentariosDe}/comentarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comentario: textoComentario }),
    });
    setTextoComentario('');
    abrirComentarios(comentariosDe);
  };

  return (
    <div className="contenedor">
      <h2>Foro Comunitario Cultural</h2>
      {error && <div className="aviso aviso-error">{error}</div>}

      <div className="tarjeta">
        <h3 style={{ color: 'var(--azul)', marginTop: 0 }}>Nueva publicación</h3>
        <form onSubmit={crearPublicacion}>
          <div className="grilha grilha-2">
            <div className="campo">
              <label htmlFor="titulo">Título *</label>
              <input id="titulo" value={nueva.titulo} onChange={(e) => setNueva({ ...nueva, titulo: e.target.value })} required />
            </div>
            <div className="campo">
              <label htmlFor="categoria">Categoría *</label>
              <select id="categoria" value={nueva.categoria} onChange={(e) => setNueva({ ...nueva, categoria: e.target.value })}>
                {Object.entries(CATEGORIAS_FORO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="campo">
            <label htmlFor="descripcion">Descripción *</label>
            <textarea id="descripcion" rows="4" value={nueva.descripcion} onChange={(e) => setNueva({ ...nueva, descripcion: e.target.value })} required />
          </div>
          <div className="campo">
            <label htmlFor="archivo">Adjuntar imagen, video o audio (opcional, máx. 5 MB)</label>
            <input id="archivo" type="file" accept=".jpg,.jpeg,.png,.gif,.webp,.mp4,.webm,.mov,.mp3,.wav,.ogg" onChange={(e) => setNueva({ ...nueva, archivo: e.target.files[0] || null })} />
          </div>
          <button className="btn" type="submit" disabled={!usuario}>Publicar</button>
        </form>
      </div>

      {publicaciones.map((p) => (
        <article className="tarjeta" key={p.id} style={{ borderLeft: `4px solid ${p.mio_like ? 'var(--amarillo)' : 'var(--azul)'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, color: 'var(--azul)' }}>{p.titulo}</h3>
            <span style={{ background: 'var(--amarillo)', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>{CATEGORIAS_FORO[p.categoria] || p.categoria}</span>
          </div>
          <p style={{ color: '#666', fontSize: 13 }}>
            por <strong>{p.autor_nombre}</strong> · {new Date(p.fecha_publicacion).toLocaleDateString('es-VE', { dateStyle: 'long' })}
          </p>
          <p>{p.descripcion}</p>
          <MediaArchivo publicacion={p} />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
            <button className="btn-sec" type="button" onClick={() => toggleLike(p)} style={{ padding: '4px 10px', fontSize: 13 }}>
              {p.mio_like ? '♥' : '♡'} {p.likes_count}
            </button>
            <button className="btn-bajo" type="button" onClick={() => abrirComentarios(p.id)} style={{ padding: '4px 10px', fontSize: 13 }}>
              Comentarios ({p.comments_count})
            </button>
            {usuario?.id === p.usuario_id && (
              <>
                <button className="btn-bajo" type="button" onClick={() => setEditando({ ...p, archivo: null })}>Editar</button>
                <button className="btn-bajo" type="button" onClick={() => borrar(p.id)}>Eliminar</button>
              </>
            )}
          </div>

          {editando?.id === p.id && (
            <form onSubmit={guardarEdicion} style={{ marginTop: 14, borderTop: '1px solid var(--borde)', paddingTop: 12 }}>
              <div className="campo"><label>Título</label><input value={editando.titulo} onChange={(e) => setEditando({ ...editando, titulo: e.target.value })} required /></div>
              <div className="campo">
                <label>Categoría</label>
                <select value={editando.categoria} onChange={(e) => setEditando({ ...editando, categoria: e.target.value })}>
                  {Object.entries(CATEGORIAS_FORO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="campo"><label>Descripción</label><textarea rows="4" value={editando.descripcion} onChange={(e) => setEditando({ ...editando, descripcion: e.target.value })} required /></div>
              <div className="campo"><label>Nuevo archivo (opcional)</label><input type="file" accept=".jpg,.jpeg,.png,.gif,.webp,.mp4,.webm,.mov,.mp3,.wav,.ogg" onChange={(e) => setEditando({ ...editando, archivo: e.target.files[0] || null })} /></div>
              <button className="btn" type="submit">Guardar</button>{' '}
              <button className="btn-bajo" type="button" onClick={() => setEditando(null)}>Cancelar</button>
            </form>
          )}

          {comentariosDe === p.id && (
            <div style={{ marginTop: 14, borderTop: '1px solid var(--borde)', paddingTop: 12 }}>
              {comentarios.map((c) => (
                <div key={c.id} style={{ marginBottom: 8 }}>
                  <strong>{c.autor_nombre}</strong>: {c.comentario}
                  <div style={{ fontSize: 11, color: '#888' }}>{new Date(c.fecha_comentario).toLocaleString('es-VE')}</div>
                </div>
              ))}
              <form onSubmit={enviarComentario} style={{ display: 'flex', gap: 8 }}>
                <input value={textoComentario} onChange={(e) => setTextoComentario(e.target.value)} placeholder="Escribe un comentario…" required />
                <button className="btn" type="submit" disabled={!usuario}>Comentar</button>
              </form>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}