export default function MediaArchivo({ publicacion }) {
  if (!publicacion.archivo_url) return null;
  if (publicacion.tipo_archivo === 'imagen') {
    return <img src={publicacion.archivo_url} alt={publicacion.titulo} className="media" />;
  }
  if (publicacion.tipo_archivo === 'video') {
    return <video src={publicacion.archivo_url} controls className="media" />;
  }
  if (publicacion.tipo_archivo === 'audio') {
    return <audio src={publicacion.archivo_url} controls className="media" />;
  }
  return null;
}