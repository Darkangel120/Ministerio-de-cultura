import { useEffect, useRef, useState } from 'react';

export default function Dropdown({ trigger, children, alinear = 'der' }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const cerrar = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false); };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, []);

  return (
    <div className={`dropdown dropdown-${abierto ? 'abierto' : 'cerrado'}`} ref={ref}>
      <button type="button" className="dropdown-trigger" onClick={() => setAbierto((a) => !a)} aria-haspopup="menu" aria-expanded={abierto}>
        {trigger}
      </button>
      {abierto && <div className={`dropdown-menu dropdown-menu-${alinear}`} role="menu">{children}</div>}
    </div>
  );
}