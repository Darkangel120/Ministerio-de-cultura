import { AREAS_VE } from '../constantes';
import { MUNICIPIOS_POR_ESTADO, PARROQUIAS_POR_ESTADO } from '../datos/ubicaciones';

export function SelectEstado({ value, onChange, disabled, required }) {
  return (
    <select value={value || ''} onChange={(e) => onChange(e.target.value)} disabled={disabled} required={required}>
      <option value="">Seleccione un estado</option>
      {AREAS_VE.map((e) => <option key={e} value={e}>{e}</option>)}
    </select>
  );
}

export function SelectMunicipio({ estado, value, onChange, disabled, required }) {
  return (
    <select value={value || ''} onChange={(e) => onChange(e.target.value)} disabled={disabled || !estado} required={required}>
      <option value="">{estado ? 'Seleccione un municipio' : 'Primero elija el estado'}</option>
      {(MUNICIPIOS_POR_ESTADO[estado] || []).map((m) => <option key={m} value={m}>{m}</option>)}
    </select>
  );
}

export function SelectParroquia({ estado, municipio, value, onChange, disabled, required }) {
  return (
    <select value={value || ''} onChange={(e) => onChange(e.target.value)} disabled={disabled || !municipio} required={required}>
      <option value="">{municipio ? 'Seleccione una parroquia' : 'Primero elija el municipio'}</option>
      {((PARROQUIAS_POR_ESTADO[estado] || {})[municipio] || []).map((p) => <option key={p} value={p}>{p}</option>)}
    </select>
  );
}