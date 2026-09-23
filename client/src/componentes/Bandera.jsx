import { Star } from 'lucide-react';

export default function Bandera() {
  return (
    <div className="bandera" aria-hidden="true">
      <div className="amarilla" />
      <div className="azul">
        <div className="estrellas">
          {Array.from({ length: 8 }).map((_, i) => <Star key={i} size={7} fill="currentColor" stroke="none" />)}
        </div>
      </div>
      <div className="roja" />
    </div>
  );
}