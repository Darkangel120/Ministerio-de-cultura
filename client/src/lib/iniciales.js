export const iniciales = (nombre) =>
  (nombre || '').split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';

const PALETA = ['#003893', '#0e7490', '#166534', '#92400e', '#9d174d', '#b91c1c'];

export const colorAvatar = (nombre) => {
  let h = 0;
  for (const c of (nombre || '')) h = (h * 31 + c.codePointAt(0)) >>> 0;
  return { background: PALETA[h % PALETA.length] };
};