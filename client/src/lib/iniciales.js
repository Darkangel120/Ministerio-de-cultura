export const iniciales = (nombre) =>
  (nombre || '').split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';

export const colorAvatar = (nombre) => {
  let h = 0;
  for (const c of (nombre || '')) h = (h * 31 + c.codePointAt(0)) % 360;
  return { background: `hsl(${h} 45% 38%)` };
};