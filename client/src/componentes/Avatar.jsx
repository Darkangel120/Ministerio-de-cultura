import { iniciales, colorAvatar } from '../lib/iniciales';

export default function Avatar({ foto, nombre, clase = 'avatar' }) {
  if (foto) return <img className={clase} src={foto} alt={nombre || 'avatar'} />;
  return <span className={clase} style={colorAvatar(nombre)}>{iniciales(nombre || 'Anónimo')}</span>;
}