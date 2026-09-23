import { useEffect, useRef } from 'react';

export default function Revelar({ children, demora = 0, estilo = {} }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add('visible');
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="revelar" style={{ ...estilo, transitionDelay: `${demora}ms` }}>
      {children}
    </div>
  );
}