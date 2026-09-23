import { AREAS_VE } from '../constantes';
import { MUNICIPIOS_POR_ESTADO } from '../datos/ubicaciones';

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