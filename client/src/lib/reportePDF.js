import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const AMARILLO = [255, 215, 0];
const AZUL = [0, 56, 147];
const ROJO = [207, 20, 43];

export const USUARIO_LABEL = {
  admin: 'Administrador', director_general: 'Director General', director_operativo: 'Director Operativo',
  funcionario: 'Funcionario', cultor: 'Cultor', publico: 'Público en general',
};

// Membretación: barra tricolor horizontal con estrellas en la franja azul
const membrete = (doc, titulo, subtitulo) => {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(...AMARILLO); doc.rect(0, 0, w, 6, 'F');
  doc.setFillColor(...AZUL); doc.rect(0, 6, w, 6, 'F');
  doc.setFontSize(5); doc.setTextColor(255, 255, 255);
  doc.text('★ ★ ★ ★ ★ ★ ★ ★', 70, 10.5); // 8 estrellas en la franja azul
  doc.setFillColor(...ROJO); doc.rect(0, 12, w, 6, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(13); doc.setFont('helvetica', 'bold');
  doc.text('Ministerio del Poder Popular para la Cultura', w / 2, 26, { align: 'center' });
  doc.setFontSize(11); doc.setFont('helvetica', 'normal');
  doc.text('República Bolivariana de Venezuela · Misión Cultura', w / 2, 33, { align: 'center' });
  doc.setFontSize(13); doc.setFont('helvetica', 'bold');
  doc.text(titulo, w / 2, 42, { align: 'center' });
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text(subtitulo, w / 2, 49, { align: 'center' });
  doc.line(14, 53, w - 14, 53);
};

export default function generarPDF({ titulo, subtitulo, cabecera = [], columnas, filas, resumen, distribuciones }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  membrete(doc, titulo, subtitulo);
  const w = doc.internal.pageSize.getWidth();

  if (cabecera.length) {
    doc.setFontSize(9);
    cabecera.forEach((linea, i) => doc.text(linea, 14, 57 + i * 5));
  }
  let yInicial = 59 + cabecera.length * 5;

  autoTable(doc, {
    startY: yInicial,
    head: [columnas],
    body: filas.map((f) => columnas.map((c) => (f[c] ?? '') === null ? '—' : String(f[c]))),
    styles: { fontSize: 7.5, cellPadding: 1.6 },
    headStyles: { fillColor: AZUL },
    alternateRowStyles: { fillColor: [242, 245, 250] },
    margin: { top: 60, bottom: 15 },
  });

  let y = doc.lastAutoTable.finalY + 8;
  if (resumen && Object.keys(resumen).length) {
    doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text('Resumen', 14, y);
    doc.setFont('helvetica', 'normal');
    Object.entries(resumen).forEach(([k, v]) => {
      y += 5;
      doc.text(`${k}: ${v}`, 18, y);
    });
    y += 8;
  }
  if (distribuciones?.cultores_por_area?.length) {
    doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text('Cultores por área temática', 14, y); y += 5;
    doc.setFont('helvetica', 'normal');
    distribuciones.cultores_por_area.forEach((d) => { doc.text(`${d.area_tematica}: ${d.total}`, 18, y); y += 5; });
    y += 8;
  }
  if (distribuciones?.eventos_por_disciplina?.length) {
    doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text('Eventos por disciplina', 14, y); y += 5;
    doc.setFont('helvetica', 'normal');
    distribuciones.eventos_por_disciplina.forEach((d) => { doc.text(`${d.disciplina}: ${d.total}`, 18, y); y += 5; });
  }

  const paginas = doc.internal.getNumberOfPages();
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Página ${i} de ${paginas} · Ministerio del Poder Popular para la Cultura · Realizado por Rodolfo Gómez`, w / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
  }
  doc.save(`${titulo.replace(/\s+/g, '_')}.pdf`);
}