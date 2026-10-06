// Strip characters that are not valid in a file name.
function clean(value) {
  return String(value ?? '').replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '');
}

function fileBase(candidate) {
  const safe = clean(candidate.name || 'candidate').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return `${safe || 'candidate'}_report`;
}

// ---- PDF: an export of the candidate detail page exactly as it is displayed -------------------

const PDF_MARGIN = 24;
const PAGE_BG = '#F8FAFC';
const SCALE = 2;
const PAD = 16 * SCALE;

/**
 * Captures what is currently rendered inside `element` as a canvas, plus the y positions (canvas pixels)
 * where a page break would not cut through a card. Elements marked data-html2canvas-ignore are left out;
 * `skip(el)` can exclude more (used to avoid repeating the page header for every tab).
 */
export async function captureCandidatePage(element, skip = () => false) {
  if (!element) throw new Error('Nothing to export yet.');
  const { default: html2canvas } = await import('html2canvas-pro');
  const shot = await html2canvas(element, {
    scale: SCALE,
    backgroundColor: PAGE_BG,
    useCORS: true,
    logging: false,
    windowWidth: Math.max(element.scrollWidth, 1024),
    ignoreElements: (el) => skip(el),
  });

  // Pad the capture so rings and shadows that extend past the page edge (e.g. the avatar) are not clipped.
  const canvas = document.createElement('canvas');
  canvas.width = shot.width + PAD * 2;
  canvas.height = shot.height + PAD * 2;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = PAGE_BG;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(shot, PAD, PAD);

  const rootTop = element.getBoundingClientRect().top;
  const breaks = [...element.querySelectorAll('.rounded-xl.border, .rounded-2xl.border, .rounded-lg.border')]
    .filter((el) => !skip(el) && !el.closest('[data-html2canvas-ignore]'))
    .map((el) => Math.round((el.getBoundingClientRect().bottom - rootTop) * SCALE) + PAD)
    .filter((y) => y > 0 && y < canvas.height);
  return { canvas, breaks };
}

/** Stacks the captures top to bottom and writes them to a paginated A4 PDF. */
export async function downloadCandidateReportPdf(captures, candidate) {
  if (!captures?.length) throw new Error('Nothing to export yet.');
  const { jsPDF } = await import('jspdf');

  const width = Math.max(...captures.map((c) => c.canvas.width));
  const height = captures.reduce((sum, c) => sum + c.canvas.height, 0);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = PAGE_BG;
  ctx.fillRect(0, 0, width, height);
  const breaks = [];
  let offset = 0;
  captures.forEach((c) => {
    ctx.drawImage(c.canvas, 0, offset);
    c.breaks.forEach((y) => breaks.push(y + offset));
    offset += c.canvas.height;
    if (offset < height) breaks.push(offset);
  });
  breaks.sort((x, y) => x - y);

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const imgW = pageW - PDF_MARGIN * 2;
  const pxPerPt = width / imgW;
  const pageHpx = Math.floor((pageH - PDF_MARGIN * 2 - 14) * pxPerPt);

  const slices = [];
  let start = 0;
  while (start < height) {
    let end = Math.min(start + pageHpx, height);
    if (end < height) {
      const safe = breaks.filter((y) => y > start + pageHpx * 0.35 && y <= end).pop();
      if (safe) end = safe;
    }
    slices.push([start, end]);
    start = end;
  }

  slices.forEach(([top, bottom], index) => {
    if (index > 0) doc.addPage();
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, pageW, pageH, 'F');
    const part = document.createElement('canvas');
    part.width = width;
    part.height = bottom - top;
    part.getContext('2d').drawImage(canvas, 0, top, width, bottom - top, 0, 0, width, bottom - top);
    doc.addImage(part.toDataURL('image/png'), 'PNG', PDF_MARGIN, PDF_MARGIN, imgW, (bottom - top) / pxPerPt, undefined, 'FAST');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(`Page ${index + 1} of ${slices.length}`, pageW - PDF_MARGIN, pageH - 14, { align: 'right' });
  });

  doc.save(`${fileBase(candidate)}.pdf`);
}
