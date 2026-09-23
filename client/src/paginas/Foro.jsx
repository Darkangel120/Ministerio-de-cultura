import { useEffect, useState } from 'react';
import { Heart, MessageCircle, MessagesSquare, X, Trash2, Pencil, Upload, Image as ImageIcon } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../componentes/Avatar';
import { CATEGORIAS_FORO } from '../constantes';
import MediaArchivo from '../componentes/MediaArchivo';

const nuevoVacio = { titulo: '', categoria: 'musica', descripcion: '', archivo: null };

const hace = (iso) => {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  const min = Math.floor(s / 60);
  const h = Math.floor(min / 60);
  const d = Math.floor(h / 24);
  const sem = Math.floor(d / 7);
  const unidad = (n, sg, pl) => `hace ${n} ${n === 1 ? sg : pl}`;
  if (s < 60) return s <= 5 ? 'hace unos segundos' : unidad(s, 'segundo', 'segundos');
  if (min < 60) return unidad(min, 'minuto', 'minutos');
  if (h < 24) return unidad(h, 'hora', 'horas');
  if (d < 7) return unidad(d, 'día', 'días');
  if (d < 30) return unidad(sem, 'semana', 'semanas');
  return new Intl.DateTimeFormat('es-VE', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
};

export default function Foro() {
  const { usuario } = useAuth();
  const [publicaciones, setPublicaciones] = useState([]);
  const [error, setError] = useState(null);
  const [nueva, setNueva] = useState(nuevoVacio);
  const [componer, setComponer] = useState(false);
  const [editando, setEditando] = useState(null);
  const [eliminando, setEliminando] = useState(null);
  const [abiertos, setAbiertos] = useState({});
  const [comentarios, setComentarios] = useState({});
  const [textoComentario, setTextoComentario] = useState('');

  const cargar = async () => {
    try {
      const r = await api('/api/foro');
      setPublicaciones(r.publicaciones);
    } catch (e) { setError(e.message); }
  };
  useEffect(() => { cargar(); }, []);

  const abrirComentarios = async (id) => {
    const abierto = !abiertos[id];
    setAbiertos((prev) => ({ ...prev, [id]: abierto }));
    if (abierto && !comentarios[id]) {
      const r = await api(`/api/foro/publicaciones/${id}/comentarios`);
      setComentarios((prev) => ({ ...prev, [id]: r.comentarios }));
    }
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
      setComponer(false);
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
    try {
      await api(`/api/foro/publicaciones/${editando.id}`, { method: 'PUT', body: fd });
      setEditando(null);
      cargar();
    } catch (err) { setError(err.message); }
  };

  const confirmarBorrado = async () => {
    try {
      await api(`/api/foro/publicaciones/${eliminando.id}`, { method: 'DELETE' });
      setPublicaciones((prev) => prev.filter((x) => x.id !== eliminando.id));
      setEliminando(null);
    } catch (err) { setError(err.message); }
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

  const enviarComentario = async (e) => {
    e.preventDefault();
    if (!usuario) { setError('Debes iniciar sesión para comentar'); return; }
    const id = e.target.dataset.id;
    await api(`/api/foro/publicaciones/${id}/comentarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comentario: textoComentario }),
    });
    setTextoComentario('');
    const r = await api(`/api/foro/publicaciones/${id}/comentarios`);
    setComentarios((prev) => ({ ...prev, [id]: r.comentarios }));
    setPublicaciones((prev) => prev.map((x) => x.id === id ? { ...x, comments_count: x.comments_count + 1 } : x));
  };

  const nombreComp = usuario ? usuario.nombre_completo : '';

  return (
    <div className="contenedor">
      <div className="pagina-titulo">
        <h1>Foro Comunitario Cultural</h1>
        <p className="subtitulo">Comparte experiencias, propuestas y saberes con la comunidad cultural.</p>
      </div>
      {error && <div className="aviso aviso-error">{error}</div>}

      <div className="feed-layout">
        <div className="feed">
          <div className="tarjeta component-caja">
            <div className="componer" onClick={() => usuario ? setComponer(true) : setError('Debes iniciar sesión para publicar')}>
              <Avatar foto={usuario?.foto_url} nombre={usuario?.nombre_completo} />
              <span className="pista">{usuario ? `¿Qué estás pensando, ${nombreComp.split(' ')[0]}?` : 'Inicia sesión para publicar…'}</span>
            </div>

            {componer && (
              <form className="componer-form" onSubmit={crearPublicacion}>
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
                  <textarea id="descripcion" rows="3" value={nueva.descripcion} onChange={(e) => setNueva({ ...nueva, descripcion: e.target.value })} required />
                </div>
                <div className="componer-pie">
                  <label className="adjuntar">
                    <Upload size={15} /> Adjuntar imagen, video o audio (máx. 5 MB)
                    <input type="file" accept=".jpg,.jpeg,.png,.gif,.webp,.mp4,.webm,.mov,.mp3,.wav,.ogg" onChange={(e) => setNueva({ ...nueva, archivo: e.target.files[0] || null })} />
                  </label>
                  {nueva.archivo && <span className="fecha">{nueva.archivo.name}</span>}
                  <div className="grow" />
                  <button className="btn btn-bajo" type="button" onClick={() => { setComponer(false); setNueva(nuevoVacio); }}><X size={15} /> Cancelar</button>
                  <button className="btn" type="submit">Publicar</button>
                </div>
              </form>
            )}
          </div>

          {publicaciones.map((p) => (
            <article className="tarjeta post" key={p.id}>
              <header className="post-cab">
                <Avatar foto={p.autor_foto} nombre={p.autor_nombre} />
                <div className="caja-autor grow">
                  <div className="nombre">{p.autor_nombre}</div>
                  <div className="post-fecha">
                    <span className="badge badge-amarillo">{CATEGORIAS_FORO[p.categoria] || p.categoria}</span>
                    {' · '}{hace(p.fecha_publicacion)}
                  </div>
                </div>
                {usuario?.id === p.usuario_id && (
                  <div className="autor-opciones">
                    <button className="icono-btn" type="button" title="Editar" onClick={() => setEditando({ ...p, archivo: null })}><Pencil size={15} /></button>
                    <button className="icono-btn" type="button" title="Eliminar" onClick={() => setEliminando(p)}><Trash2 size={15} /></button>
                  </div>
                )}
              </header>

              <div className="post-cuerpo">
                <h3>{p.titulo}</h3>
                <p>{p.descripcion}</p>
                <MediaArchivo publicacion={p} />
              </div>

              <div className="post-stats">
                <span>{p.likes_count} Me gusta</span>
                <button type="button" className={abiertos[p.id] ? 'comentando pos-texto' : 'pos-texto'} onClick={() => abrirComentarios(p.id)}>
                  {p.comments_count} Comentarios
                </button>
              </div>

              <div className="post-barra">
                <button type="button" className={p.mio_like ? 'gustado-l' : ''} onClick={() => toggleLike(p)}>
                  <Heart size={16} fill={p.mio_like ? 'currentColor' : 'none'} /> {p.mio_like ? 'Te gusta' : 'Me gusta'}
                </button>
                <button type="button" className={abiertos[p.id] ? 'comentando' : ''} onClick={() => abrirComentarios(p.id)}>
                  <MessageCircle size={16} /> Comentarios
                </button>
              </div>

              {abiertos[p.id] && (
                <div className="comentario-bloque">
                  <div className="post-stats" style={{ marginTop: 0 }}>
                    <strong className="small-cab">Comentarios</strong>
                  </div>
                  {(comentarios[p.id] || []).map((c) => (
                    <div className="comentario" key={c.id}>
                      <Avatar clase="avatar mini" foto={c.autor_foto} nombre={c.autor_nombre} />
                      <div className="burbuja">
                        <div className="nombre-c">{c.autor_nombre}</div>
                        <p className="m0">{c.comentario}</p>
                        <div className="pie">{hace(c.fecha_comentario)}</div>
                      </div>
                    </div>
                  ))}
                  {(comentarios[p.id] || []).length === 0 && <p className="vacio no-pad">Sé la primera voz en comentar.</p>}
                  <form className="publicar-comentario" data-id={p.id} onSubmit={enviarComentario}>
                    <Avatar clase="avatar mini" foto={usuario?.foto_url} nombre={usuario?.nombre_completo} />
                    <input className="grow" value={textoComentario} onChange={(e) => setTextoComentario(e.target.value)} placeholder="Escribe un comentario…" disabled={!usuario} required />
                    <button className="btn" type="submit" disabled={!usuario}>Comentar</button>
                  </form>
                </div>
              )}
            </article>
          ))}

          {publicaciones.length === 0 && (
            <div className="vacio"><MessagesSquare size={42} style={{ marginBottom: 8 }} />Todavía no hay publicaciones. ¡Sé la primera voz!</div>
          )}
        </div>

        <aside className="foro-aside">
          <div className="tarjeta">
            <h3 style={{ marginTop: 0, color: 'var(--azul)' }}>Nuestro foro</h3>
            <ul className="lista-amable">
              <li>Espacio libre para cultores, comunidades y personal del Ministerio.</li>
              <li>Respeta y construye: un diálogo respetuoso fortalece el quehacer cultural.</li>
              <li>Adjunta imágenes, videos o audios de tus actividades (máx. 5 MB).</li>
              <li>El autor puede editar o eliminar sus publicaciones.</li>
            </ul>
          </div>
        </aside>
      </div>

      {editando && (
        <div className="modal-fondo" onClick={(e) => { if (e.target === e.currentTarget) setEditando(null); }}>
          <div className="tarjeta modal-tarjeta" style={{ marginBottom: 0, maxWidth: 620 }}>
            <div className="modal-cab">
              <h2>Editar publicación</h2>
              <button className="icono-btn cerrar" type="button" onClick={() => setEditando(null)}><X size={18} /></button>
            </div>
            <form className="modal-cuerpo" onSubmit={guardarEdicion}>
              <div className="campo"><label>Título</label><input value={editando.titulo} onChange={(e) => setEditando({ ...editando, titulo: e.target.value })} required /></div>
              <div className="campo">
                <label>Categoría</label>
                <select value={editando.categoria} onChange={(e) => setEditando({ ...editando, categoria: e.target.value })}>
                  {Object.entries(CATEGORIAS_FORO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="campo"><label>Descripción</label><textarea rows="4" value={editando.descripcion} onChange={(e) => setEditando({ ...editando, descripcion: e.target.value })} required /></div>
              {editando.archivo_url && (
                <div className="vista-previa">
                  <div className="etiqueta"><ImageIcon size={14} /> Archivo actual de la publicación</div>
                  <MediaArchivo publicacion={editando} />
                </div>
              )}
              <div className="campo">
                <label>Reemplazar archivo (opcional)</label>
                <div className="componer-pie">
                  <label className="adjuntar">
                    <Upload size={15} /> {editando.archivo ? editando.archivo.name : 'Seleccionar archivo nuevo'}
                    <input type="file" accept=".jpg,.jpeg,.png,.gif,.webp,.mp4,.webm,.mov,.mp3,.wav,.ogg" onChange={(e) => setEditando({ ...editando, archivo: e.target.files[0] || null })} />
                  </label>
                  {editando.archivo && <button className="btn btn-bajo" type="button" onClick={() => setEditando({ ...editando, archivo: null })}>Quitar</button>}
                </div>
              </div>
              <div className="componer-pie" style={{ marginTop: 18 }}>
                <div className="grow" />
                <button className="btn btn-bajo" type="button" onClick={() => setEditando(null)}>Cancelar</button>
                <button className="btn" type="submit">Guardar cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {eliminando && (
        <div className="modal-fondo" onClick={(e) => { if (e.target === e.currentTarget) setEliminando(null); }}>
          <div className="tarjeta modal-tarjeta" style={{ marginBottom: 0, maxWidth: 460 }}>
            <div className="modal-cab">
              <h2>Eliminar publicación</h2>
              <button className="icono-btn cerrar" type="button" onClick={() => setEliminando(null)}><X size={18} /></button>
            </div>
            <div className="modal-cuerpo">
              <p style={{ marginTop: 0 }}>¿Estás seguro de que deseas eliminar esta publicación?</p>
              <p className="m0" style={{ color: 'var(--texto-suave)', fontSize: 14 }}>«<strong>{eliminando.titulo}</strong>» — Esta acción no se puede deshacer.</p>
              <div className="componer-pie" style={{ marginTop: 20 }}>
                <div className="grow" />
                <button className="btn btn-bajo" type="button" onClick={() => setEliminando(null)}>Cancelar</button>
                <button className="btn" type="button" onClick={confirmarBorrado}><Trash2 size={15} /> Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}