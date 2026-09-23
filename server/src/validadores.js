export const AREAS_TEMATICAS = [
  'musica', 'danza', 'teatro', 'artesPlasticas', 'literatura', 'artesanias', 'cine', 'fotografia',
];
export const AREAS_VE = [
  'Distrito Capital', 'Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas', 'Bolívar',
  'Carabobo', 'Cojedes', 'Delta Amacuro', 'Falcón', 'Guárico', 'Lara', 'Mérida',
  'Miranda', 'Monagas', 'Nueva Esparta', 'Portuguesa', 'Sucre', 'Táchira',
  'Trujillo', 'Vargas', 'Yaracuy', 'Zulia',
];
export const CATEGORIAS_FORO = [
  'danza', 'musica', 'artesPlasticas', 'poesia', 'teatro', 'cine', 'fotografia', 'artesanias',
];
export const CARGOS_RESPONSABLE = ['Animador', 'Coordinador', 'Facilitador', 'Tutor'];
export const TIPOS_ORGANIZACION = ['comuna', 'circuito'];
export const TIPOS_ACTIVIDAD = [
  'Cumpleaños viva Venezuela',
  'despligues homenajes/ amor en acción/ jornada',
  'Presentación artística',
  'taller o conversatorio',
  'tomas culturales',
  'talleres formativos',
  'Asamblea en disiplinas',
];
export const DISCIPLINAS_EVENTO = [
  'Artes plásticas', 'artesanía', 'audiovisual', 'danza', 'gastronomía', 'literatura', 'música', 'teatro',
];
export const OBJETIVOS_TRANSFORMADORES = [
  'ECONOMÍA: MODERNIZACIÓN PRODUCTIVA',
  'ECONOMÍA: DIVERSIFICACIÓN MÁS ALLÁ DEL PETRÓLEO',
  'ECONOMÍA: DESARROLLO TECNOLÓGICO',
  'ECONOMÍA: FORTALECIMIENTO DE SECTORES COMO AGROALIMENTARIO Y TURISMO',
  'INDEPENDENCIA PLENA: REFUERZO DE LA SOBERANÍA NACIONAL FRENTE A BLOQUEOS E INJERENCIAS EXTERNAS',
  'PAZ, SEGURIDAD E INTEGRACIÓN TERRITORIAL: GARANTIZAR LA ESTABILIDAD INTERNA Y LA DEFENSA DEL PAIS',
  'RECUPERACIÓN Y COMPROMISO SOCIAL: RESTITUCIÓN Y PROTECCIÓN DE DERECHOS SOCIALES',
  'RECUPERACIÓN Y COMPROMISO SOCIAL: ATENCION A SECTORES VULNERABLES',
  'POLÍTICA (DEMOCRACIA Y PODER POPULAR): PROMOCIÓN DE LA PARTICIPACIÓN POPULAR',
  'POLÍTICA (DEMOCRACIA Y PODER POPULAR): NUEVOS MÉTODOS DE GOBIERNO',
  'ECOSOCIALISMO (CIENCIA Y TECNOLOGÍA): PROTECCIÓN AMBIENTAL',
  'ECOSOCIALISMO (CIENCIA Y TECNOLOGÍA): ENFRENTAMIENTO AL CAMBIO CLIMÁTICO Y DESARROLLO CIENTÍFICO-TECNOLÓGICO',
  'GEOPOLÍTICA: POSICIONAMIENTO DE VENEZUELA EN UN NUEVO ORDEN MUNDIAL MULTIPOLAR',
];
export const MESES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
export const MESES_NOMBRES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
export const PARTICIPAR_KEYS = ['ninos', 'ninas', 'jovenes_masculinos', 'jovenes_femeninas', 'adultos_masculinos', 'adultos_femeninas'];

export const esEmail = (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
export const numeroEntero = (v, min = 0) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= min ? n : null;
};