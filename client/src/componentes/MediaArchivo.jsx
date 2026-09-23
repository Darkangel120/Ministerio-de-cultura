export default function MediaArchivo({ publicacion }) {
  if (!publicacion.archivo_url) return null;
  if (publicacion.tipo_archivo === 'imagen') {
    return <img src={publicacion.archivo_url} alt={publicacion.titulo} style={{ maxWidth: '100%', borderRadius: 8, marginTop: 10 }} />;
  }
  if (publicacion.tipo_archivo === 'video') {
    return <video src={publicacion.archivo_url} controls style={{ maxWidth: '100%', borderRadius: 8, marginTop: 10 }} />;
  }
  if (publicacion.tipo_archivo === 'audio') {
    return <audio src={publicacion.archivo_url} controls style={{ width: '100%', marginTop: 10 }} />;
  }
  return null;
}