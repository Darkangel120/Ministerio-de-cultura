import { Star } from 'lucide-react';

const LEMAS = [
  'Cultura es el alma del pueblo',
  'Misión Cultura llega a cada comunidad',
  'Defender la cultura es defender la Patria',
  'Arte, memoria y tradición venezolana',
  'El poder popular es cultura',
  'Somos el pueblo que hace cultura',
];

export default function CintaCultura() {
  const texto = [...LEMAS, ...LEMAS].map((l, i) => (
    <span key={i}>{l} <Star size={12} style={{ margin: '0 14px', verticalAlign: '-1px', opacity: 0.75 }} /></span>
  ));
  return (
    <div className="franja-cinta">
      <div className="cinta amarilla-cinta"><div className="cinta-inner">{texto}</div></div>
      <div className="cinta azul-cinta"><div className="cinta-inner">{texto}</div></div>
      <div className="cinta roja-cinta"><div className="cinta-inner">{texto}</div></div>
    </div>
  );
}