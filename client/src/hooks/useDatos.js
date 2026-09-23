import { useEffect, useState } from 'react';
import { api } from '../api';

// ponytail: fetch con estado en ~20 líneas; un data-fetching lib si el proyecto crece
export default function useDatos(path, deps = []) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    let vivo = true;
    api(path)
      .then((d) => vivo && setDatos(d))
      .catch((e) => vivo && setError(e.message));
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { datos, error };
}