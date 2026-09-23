export async function api(path, opciones = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    ...opciones,
  });
  let data = null;
  try { data = await res.json(); } catch { /* sin cuerpo */ }
  if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
  return data;
}