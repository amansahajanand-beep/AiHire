import { jsPDF } from 'jspdf';
import logoUrl from '../assets/logo.png';
import { weightedEntries, weightage, labels } from '../components/candidates/MatchBreakdown';
import { formatDate, humanReviewLabel } from './helpers';

// Premium "AI recruitment report" layout, drawn with vector primitives so it stays crisp at any zoom.
// Card-based, blue palette, outline icons, progress bars and a ring. Content flows onto extra pages if a
// candidate has more data than two pages can hold; the normal case is exactly two pages.

const PW = 595.28;
const PH = 841.89;
const M = 32;
const CW = PW - M * 2;
const TOP = 78;
const BOTTOM = PH - 50;
const GAP = 10;
const PAD = 16;
const HEAD = 36; // card title area

const C = {
  blue: '#2563EB',
  navy: '#0F172A',
  bg: '#F8FAFC',
  white: '#FFFFFF',
  border: '#E2E8F0',
  slate: '#475569',
  green: '#16A34A',
  amber: '#F59E0B',
  red: '#DC2626',
  blueTint: '#EFF6FF',
  blueLine: '#DBEAFE',
  greenTint: '#F0FDF4',
  greenLine: '#BBF7D0',
  amberTint: '#FFFBEB',
  amberLine: '#FDE68A',
  track: '#E2E8F0',
  shadow: '#EEF2F7',
};

// The built-in PDF font only covers Latin-1, so swap common typographic characters.
function clean(value) {
  return String(value ?? '')
    .replace(/[–—]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[•·]/g, '-')
    .replace(/…/g, '...')
    .replace(/[^\x09\x0A\x0D\x20-\x7E -ÿ]/g, '');
}

function asText(value) {
  if (value == null) return '';
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join(', ');
  if (typeof value === 'object') return Object.values(value).map(asText).filter(Boolean).join(' - ');
  return String(value);
}

function timeOf(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return [d.getHours(), d.getMinutes(), d.getSeconds()].map((n) => String(n).padStart(2, '0')).join(':');
}

function fileBase(candidate) {
  const safe = clean(candidate.name || 'candidate').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return `${safe || 'candidate'}_report`;
}

const rgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

// Green for positive outcomes, amber for in-between, red for negative, blue otherwise.
function tone(label) {
  const v = String(label || '').toLowerCase();
  if (/not recommended|reject|low match|no hire/.test(v)) return C.red;
  if (/shortlist|recommend|hire|strong/.test(v)) return C.green;
  if (/review|pending|consider|caution|insufficient/.test(v)) return C.amber;
  return C.blue;
}

function matchLabel(score) {
  if (score >= 85) return 'Excellent Match';
  if (score >= 70) return 'Strong Match';
  if (score >= 50) return 'Moderate Match';
  return 'Low Match';
}

async function loadLogo() {
  try {
    const blob = await (await fetch(logoUrl)).blob();
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const size = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve({ w: 1145, h: 348 });
      img.src = dataUrl;
    });
    return { dataUrl, ...size };
  } catch {
    return null; // never invent a logo; the header simply omits it if the file cannot be read
  }
}

/** Builds and downloads the candidate screening report PDF from the candidate data loaded on the page. */
export async function downloadCandidateReportPdf(candidate) {
  const logo = await loadLogo();
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  let y = TOP;
  let pageNo = 1;

  // ---------- drawing primitives ----------
  const fillC = (hex) => doc.setFillColor(...rgb(hex));
  const drawC = (hex) => doc.setDrawColor(...rgb(hex));
  const textC = (hex) => doc.setTextColor(...rgb(hex));
  const rr = (x, yy, w, h, r, { fill, stroke, lw = 0.75 } = {}) => {
    if (fill) fillC(fill);
    if (stroke) {
      drawC(stroke);
      doc.setLineWidth(lw);
    }
    const style = fill && stroke ? 'FD' : fill ? 'F' : 'S';
    doc.roundedRect(x, yy, w, h, r, r, style);
  };
  const txt = (str, x, yy, { size = 9, bold = false, color = C.slate, align = 'left', charSpace = 0 } = {}) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    textC(color);
    doc.text(clean(str), x, yy, { align, charSpace });
  };
  const wrap = (str, size, bold, width) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    return doc.splitTextToSize(clean(str), width);
  };
  const widthOf = (str, size, bold) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    return doc.getTextWidth(clean(str));
  };
  const card = (x, yy, w, h, { fill = C.white, stroke = C.border, r = 12 } = {}) => {
    rr(x, yy + 1.4, w, h, r, { fill: C.shadow }); // very subtle shadow
    rr(x, yy, w, h, r, { fill, stroke });
  };
  const pill = (label, x, yy, { color = C.green, h = 17, size = 8.5, icon = true } = {}) => {
    const w = widthOf(label, size, true) + (icon ? 30 : 18);
    rr(x, yy, w, h, h / 2, { fill: color });
    let tx = x + 9;
    if (icon) {
      drawIcon('check', x + 14, yy + h / 2, { color: C.white, size: 8, lw: 1 });
      tx = x + 23;
    }
    txt(label, tx, yy + h / 2 + size * 0.34, { size, bold: true, color: C.white });
    return w;
  };

  // ---------- outline icons (one family: 1.1pt strokes, rounded) ----------
  function drawIcon(name, cx, cy, { color = C.blue, size = 12, lw = 1.1 } = {}) {
    const k = size / 12;
    drawC(color);
    doc.setLineWidth(lw);
    doc.setLineCap('round');
    doc.setLineJoin('round');
    const line = (x1, y1, x2, y2) => doc.line(cx + x1 * k, cy + y1 * k, cx + x2 * k, cy + y2 * k);
    const poly = (pts, close = false) => {
      const [first, ...rest] = pts;
      doc.lines(
        rest.map((p, i) => [(p[0] - (i === 0 ? first[0] : rest[i - 1][0])) * k, (p[1] - (i === 0 ? first[1] : rest[i - 1][1])) * k]),
        cx + first[0] * k,
        cy + first[1] * k,
        [1, 1],
        'S',
        close,
      );
    };
    const circ = (x, yy, r) => doc.circle(cx + x * k, cy + yy * k, r * k, 'S');
    const box = (x, yy, w, h, r = 1.2) => doc.roundedRect(cx + x * k, cy + yy * k, w * k, h * k, r * k, r * k, 'S');
    switch (name) {
      case 'person': circ(0, -2.4, 2.4); box(-4.5, 1.4, 9, 4.2, 2); break;
      case 'briefcase': box(-5.5, -3, 11, 8, 1.5); poly([[-2, -3], [-2, -5], [2, -5], [2, -3]]); line(-5.5, 0.5, 5.5, 0.5); break;
      case 'status': circ(0, 0, 5); circ(0, 0, 1.6); break;
      case 'calendar': box(-5.5, -4.5, 11, 10, 1.6); line(-5.5, -1.2, 5.5, -1.2); line(-2.5, -6, -2.5, -3.2); line(2.5, -6, 2.5, -3.2); break;
      case 'clock': circ(0, 0, 5.5); poly([[0, -3], [0, 0], [2.4, 1.6]]); break;
      case 'pin': circ(0, -1.6, 3.6); poly([[-3, 0.6], [0, 5.8], [3, 0.6]]); circ(0, -1.6, 1.2); break;
      case 'mail': box(-5.5, -3.8, 11, 7.6, 1.4); poly([[-5.2, -3.2], [0, 1], [5.2, -3.2]]); break;
      case 'phone': box(-3.2, -5.5, 6.4, 11, 1.5); line(-1, 3.4, 1, 3.4); break;
      case 'chart': box(-5.5, 0, 3, 5, 0.6); box(-1.5, -3, 3, 8, 0.6); box(2.5, -5.5, 3, 10.5, 0.6); break;
      case 'target': circ(0, 0, 5.5); circ(0, 0, 2.4); break;
      case 'cap': poly([[-6, -1], [0, -4.5], [6, -1], [0, 2.5]], true); poly([[-3.4, 0.8], [-3.4, 3.6], [0, 5], [3.4, 3.6], [3.4, 0.8]]); break;
      case 'shield': poly([[0, -5.5], [5, -3.6], [5, 0.6], [0, 5.6], [-5, 0.6], [-5, -3.6]], true); break;
      case 'check': poly([[-3.2, 0.2], [-1, 2.6], [3.4, -2.6]]); break;
      case 'checkCircle': circ(0, 0, 5.5); poly([[-2.6, 0.2], [-0.8, 2], [2.8, -2]]); break;
      case 'alert': circ(0, 0, 5.5); line(0, -2.6, 0, 0.8); doc.circle(cx, cy + 2.8 * k, 0.15 * k, 'S'); break;
      case 'sparkle': poly([[0, -6], [1.5, -1.5], [6, 0], [1.5, 1.5], [0, 6], [-1.5, 1.5], [-6, 0], [-1.5, -1.5]], true); break;
      case 'bulb': circ(0, -1.5, 4); line(-2, 3.4, 2, 3.4); line(-1.2, 5.2, 1.2, 5.2); break;
      case 'trend': poly([[-5.5, 4], [-1.5, 0], [1, 2.4], [5.5, -3]]); poly([[2, -3.4], [5.8, -3.4], [5.8, 0.4]]); break;
      case 'note': box(-4.5, -5.5, 9, 11, 1.4); line(-2.2, -2, 2.2, -2); line(-2.2, 0.6, 2.2, 0.6); line(-2.2, 3.2, 0.6, 3.2); break;
      case 'chat': box(-6, -4.8, 12, 8.4, 2); poly([[-2.4, 3.6], [-3.4, 6], [0.4, 3.6]]); break;
      case 'grid': box(-5.5, -5.5, 4.4, 4.4, 1); box(1.1, -5.5, 4.4, 4.4, 1); box(-5.5, 1.1, 4.4, 4.4, 1); box(1.1, 1.1, 4.4, 4.4, 1); break;
      default: circ(0, 0, 4);
    }
    doc.setLineCap('butt');
  }

  const badge = (name, cx, cy, color = C.blue, size = 18) => {
    rr(cx - size / 2, cy - size / 2, size, size, 5, { fill: color === C.blue ? C.blueTint : color === C.green ? C.greenTint : C.amberTint });
    drawIcon(name, cx, cy, { color, size: size * 0.55, lw: 1 });
  };

  // ---------- page chrome ----------
  const drawHeader = () => {
    fillC(C.bg);
    doc.rect(0, 0, PW, PH, 'F');
    if (logo) {
      const h = 28;
      doc.addImage(logo.dataUrl, 'PNG', M, 18, (h * logo.w) / logo.h, h, 'logo', 'FAST');
    }
    txt('CANDIDATE INTELLIGENCE REPORT', PW / 2 + 14, 37, { size: 8.5, bold: true, color: C.navy, align: 'center', charSpace: 0.6 });
    const date = candidate.screenedOn ? formatDate(candidate.screenedOn) : '-';
    const time = (candidate.screenedOn && timeOf(candidate.screenedOn)) || '';
    const right = PW - M;
    const timeW = time ? widthOf(time, 8.5, false) : 0;
    let x = right;
    if (time) {
      txt(time, x, 37, { size: 8.5, color: C.navy, align: 'right' });
      x -= timeW + 8;
      drawC(C.border);
      doc.setLineWidth(0.8);
      doc.line(x, 29, x, 40);
      x -= 8;
    }
    txt(date, x, 37, { size: 8.5, color: C.navy, align: 'right' });
    drawIcon('calendar', x - widthOf(date, 8.5, false) - 12, 34, { size: 10, lw: 0.9 });
    drawC(C.border);
    doc.setLineWidth(0.8);
    doc.line(M, 56, PW - M, 56);
  };
  const newPage = () => {
    doc.addPage();
    pageNo += 1;
    drawHeader();
    y = TOP;
  };
  const ensure = (h) => {
    if (y + h > BOTTOM) newPage();
  };

  // ---------- card with flowing items ----------
  // item = { h, draw(x, y, w) }
  const chunkHeight = (items) => HEAD + PAD + items.reduce((s, it) => s + it.h, 0) + 2;
  const drawChunk = (x, yy, w, title, icon, items, { height, fill = C.white, stroke = C.border, accent = C.blue } = {}) => {
    const h = height ?? chunkHeight(items);
    card(x, yy, w, h, { fill, stroke });
    badge(icon, x + PAD + 9, yy + 22, accent, 20);
    txt(title, x + PAD + 26, yy + 26, { size: 11, bold: true, color: accent === C.blue ? C.navy : accent });
    let iy = yy + HEAD;
    items.forEach((it) => {
      it.draw(x + PAD, iy, w - PAD * 2);
      iy += it.h;
    });
    return h;
  };
  const flowCard = (title, icon, items, opts = {}) => {
    let i = 0;
    let first = true;
    while (i < items.length) {
      let capacity = BOTTOM - y - HEAD - PAD - 2;
      if (items[i].h > capacity && y > TOP + 4) {
        newPage();
        capacity = BOTTOM - y - HEAD - PAD - 2;
      }
      const chunk = [];
      let used = 0;
      while (i < items.length && (chunk.length === 0 || used + items[i].h <= capacity)) {
        chunk.push(items[i]);
        used += items[i].h;
        i += 1;
      }
      const h = drawChunk(M, y, CW, first ? title : `${title} (continued)`, icon, chunk, opts);
      y += h + GAP;
      first = false;
      if (i < items.length) newPage();
    }
  };
  const pairCards = (left, right, wL, wR) => {
    const hL = chunkHeight(left.items);
    const hR = chunkHeight(right.items);
    const h = Math.max(hL, hR);
    if (y + h > BOTTOM && h <= BOTTOM - TOP) newPage();
    if (h > BOTTOM - TOP) {
      flowCard(left.title, left.icon, left.items, left.opts);
      flowCard(right.title, right.icon, right.items, right.opts);
      return;
    }
    drawChunk(M, y, wL, left.title, left.icon, left.items, { ...left.opts, height: h });
    drawChunk(M + wL + GAP, y, wR, right.title, right.icon, right.items, { ...right.opts, height: h });
    y += h + GAP;
  };

  // ---------- data ----------
  const name = candidate.name || 'Candidate';
  const score = Math.round(Number(candidate.score) || 0);
  const human = humanReviewLabel(candidate.humanEvaluation);
  const statusText = candidate.status || candidate.screeningStatus || '-';
  const heroLabel = human !== 'N/A' ? human : statusText;
  const heroColor = tone(heroLabel);
  const humanNote = asText(candidate.humanNote).trim().slice(0, 240) + (asText(candidate.humanNote).trim().length > 240 ? '…' : '');

  // ======================= PAGE 1 =======================
  drawHeader();

  // Hero
  const heroH = 74;
  card(M, y, CW, heroH, { fill: C.blueTint, stroke: C.blueLine, r: 14 });
  drawC(C.blueLine);
  fillC('#E3EEFF');
  doc.circle(M + CW - 52, y + heroH / 2, 30, 'F');
  fillC('#DCEAFE');
  doc.circle(M + CW - 118, y + heroH / 2 + 6, 16, 'F');
  rr(M, y, CW, heroH, 14, { stroke: C.blueLine });
  const nameLines = wrap(name, 24, true, CW - 190).slice(0, 2);
  txt(nameLines[0], M + 20, y + (nameLines.length > 1 ? 28 : 38), { size: 24, bold: true, color: C.navy });
  if (nameLines[1]) txt(nameLines[1], M + 20, y + 52, { size: 24, bold: true, color: C.navy });
  const roleLine = wrap(candidate.job || '-', 12, false, CW - 190)[0];
  txt(roleLine, M + 20, y + heroH - (nameLines.length > 1 ? 6 : 14), { size: 12, color: C.slate });
  const heroPillW = widthOf(heroLabel, 11, true) + 40;
  pill(heroLabel, M + CW - heroPillW - 20, y + heroH / 2 - 14, { color: heroColor, h: 28, size: 11 });
  y += heroH + GAP;

  // Candidate information + Match score
  const infoRows = [
    ['person', 'Applied for', candidate.job || '-', null],
    ['person', 'Human review', human, human === 'N/A' ? null : tone(human)],
    ...(humanNote ? [['note', 'Note', humanNote, null]] : []),
    ['calendar', 'Screened on', candidate.screenedOn ? formatDate(candidate.screenedOn) : '-', null],
    ['clock', 'Time', (candidate.screenedOn && timeOf(candidate.screenedOn)) || '-', null],
    ['pin', 'Current location', candidate.location || '-', null],
    ['mail', 'Email', candidate.email || '-', null],
    ['phone', 'Phone', candidate.phone || '-', null],
  ];
  const infoW = 296;
  const scoreW = CW - infoW - GAP;
  const valueW = infoW - PAD * 2 - 100;
  const rowHs = infoRows.map(([, , value, pillColor]) => {
    if (pillColor) return 22;
    return Math.max(22, wrap(value, 9.5, true, valueW).length * 12 + 10);
  });
  const infoH = Math.max(HEAD + PAD + rowHs.reduce((a, b) => a + b, 0), 226);
  ensure(infoH);
  card(M, y, infoW, infoH);
  badge('person', M + PAD + 9, y + 22, C.blue, 20);
  txt('Candidate Information', M + PAD + 26, y + 26, { size: 11, bold: true, color: C.navy });
  let ry = y + HEAD;
  infoRows.forEach(([icon, label, value, pillColor], i) => {
    drawIcon(icon, M + PAD + 6, ry + rowHs[i] / 2, { size: 11, lw: 1 });
    txt(label, M + PAD + 24, ry + rowHs[i] / 2 + 3, { size: 9, color: C.slate });
    if (pillColor) {
      const w = widthOf(value, 8.5, true) + 18;
      rr(M + PAD + 100, ry + rowHs[i] / 2 - 8, w, 16, 8, {
        fill: pillColor === C.green ? C.greenTint : pillColor === C.amber ? C.amberTint : pillColor === C.red ? '#FEF2F2' : C.blueTint,
        stroke: pillColor === C.green ? C.greenLine : pillColor === C.amber ? C.amberLine : pillColor === C.red ? '#FECACA' : C.blueLine,
      });
      txt(value, M + PAD + 109, ry + rowHs[i] / 2 + 3, { size: 8.5, bold: true, color: pillColor });
    } else {
      wrap(value, 9.5, true, valueW).forEach((line, li, arr) => {
        txt(line, M + PAD + 100, ry + rowHs[i] / 2 + 3 - ((arr.length - 1) * 12) / 2 + li * 12, { size: 9.5, bold: true, color: C.navy });
      });
    }
    ry += rowHs[i];
  });

  // Match score card with ring
  const sx = M + infoW + GAP;
  card(sx, y, scoreW, infoH);
  badge('clock', sx + PAD + 9, y + 22, C.blue, 20);
  txt('Match Score', sx + PAD + 26, y + 26, { size: 11, bold: true, color: C.navy });
  const rcx = sx + scoreW / 2;
  const rcy = y + HEAD + 68;
  const radius = 54;
  drawC(C.track);
  doc.setLineWidth(11);
  doc.circle(rcx, rcy, radius, 'S');
  const pct = Math.max(0, Math.min(100, score)) / 100;
  if (pct > 0) {
    const steps = Math.max(2, Math.round(120 * pct));
    const pts = Array.from({ length: steps + 1 }, (_, i) => {
      const a = -Math.PI / 2 + (2 * Math.PI * pct * i) / steps;
      return [rcx + radius * Math.cos(a), rcy + radius * Math.sin(a)];
    });
    drawC(C.blue);
    doc.setLineWidth(11);
    doc.setLineCap('round');
    doc.setLineJoin('round');
    doc.lines(pts.slice(1).map((p, i) => [p[0] - pts[i][0], p[1] - pts[i][1]]), pts[0][0], pts[0][1], [1, 1], 'S', false);
    doc.setLineCap('butt');
  }
  const scoreStr = String(score);
  const numW = widthOf(scoreStr, 34, true);
  const slashW = widthOf('/ 100', 12, false);
  const startX = rcx - (numW + 6 + slashW) / 2;
  txt(scoreStr, startX, rcy + 6, { size: 34, bold: true, color: C.navy });
  txt('/ 100', startX + numW + 6, rcy + 6, { size: 12, color: C.slate });
  txt('Match Score', rcx, rcy + 24, { size: 9, color: C.slate, align: 'center' });
  const pillLabel = heroLabel;
  const pw = widthOf(pillLabel, 10, true) + 36;
  pill(pillLabel, rcx - pw / 2, rcy + radius + 12, { color: heroColor, h: 22, size: 10 });
  txt(matchLabel(score), rcx, y + infoH - 11, { size: 9, color: C.slate, align: 'center' });
  y += infoH + GAP;

  // AI match breakdown
  const breakdown = weightedEntries(candidate.breakdown);
  const bdRowH = 26;
  const bdH = HEAD + 20 + Math.max(breakdown.length, 1) * bdRowH + 8;
  ensure(bdH);
  card(M, y, CW, bdH);
  badge('chart', M + PAD + 9, y + 22, C.blue, 20);
  txt('AI Match Breakdown', M + PAD + 26, y + 26, { size: 11, bold: true, color: C.navy });
  const colCat = M + PAD + 30;
  const colScore = M + PAD + 150;
  const colBar = M + PAD + 220;
  const colPct = M + CW - PAD;
  const barW = colPct - 44 - colBar;
  txt('Category', M + PAD, y + HEAD + 8, { size: 8, bold: true, color: C.slate });
  txt('Score', colScore, y + HEAD + 8, { size: 8, bold: true, color: C.slate });
  txt('Percent', colPct, y + HEAD + 8, { size: 8, bold: true, color: C.slate, align: 'right' });
  const catIcon = { skills: 'target', experience: 'briefcase', education: 'cap', stability: 'shield', overall: 'chart' };
  if (breakdown.length === 0) {
    txt('No breakdown available.', M + PAD, y + HEAD + 36, { size: 9.5, color: C.slate });
  }
  breakdown.forEach(([key, value], i) => {
    const max = weightage[key] ?? 100;
    const rowY = y + HEAD + 20 + i * bdRowH;
    const isOverall = key === 'overall';
    if (isOverall) rr(M + 8, rowY, CW - 16, bdRowH - 2, 7, { fill: C.blueTint });
    badge(catIcon[key] || 'target', M + PAD + 9, rowY + bdRowH / 2 - 1, C.blue, 18);
    txt(labels[key] || key, colCat, rowY + bdRowH / 2 + 2, { size: isOverall ? 10 : 9.5, bold: isOverall, color: C.navy });
    txt(`${value} / ${max}`, colScore, rowY + bdRowH / 2 + 2, { size: isOverall ? 10 : 9.5, bold: isOverall, color: C.navy });
    const ratio = Math.max(0, Math.min(1, value / max));
    rr(colBar, rowY + bdRowH / 2 - 5, barW, isOverall ? 10 : 8, 4, { fill: C.track });
    if (ratio > 0) rr(colBar, rowY + bdRowH / 2 - 5, Math.max(barW * ratio, 8), isOverall ? 10 : 8, 4, { fill: C.blue });
    txt(`${Math.round(ratio * 100)}%`, colPct, rowY + bdRowH / 2 + 2, { size: isOverall ? 10 : 9.5, bold: true, color: C.navy, align: 'right' });
  });
  y += bdH + GAP;

  // Strengths / weak areas
  const done = candidate.screeningStatus === 'completed';
  const strengths = candidate.strengths?.length
    ? candidate.strengths.map(asText)
    : done ? ['See Executive Summary'] : ['Screening in progress...'];
  const hasWeak = Boolean(candidate.weaknesses?.length);
  const weaknesses = hasWeak
    ? candidate.weaknesses.map(asText)
    : !done
      ? ['Waiting for screening result']
      : candidate.risk ? [`Risk flag: ${candidate.risk}`] : ['No significant risk identified from the profile.'];
  const colW = (CW - GAP) / 2;
  const listItems = (items, color, icon) => items.flatMap((text) => {
    const lines = wrap(text, 9, false, colW - PAD * 2 - 22);
    const h = lines.length * 12 + 8;
    return [{
      h,
      draw: (x, iy) => {
        drawIcon(icon, x + 6, iy + 6, { color, size: 10, lw: 1.1 });
        lines.forEach((line, li) => txt(line, x + 22, iy + 9 + li * 12, { size: 9, color: C.slate }));
      },
    }];
  });
  const strengthItems = listItems(strengths, C.green, 'check');
  const weakIsEmptyState = !hasWeak && done && !candidate.risk;
  const weakItems = weakIsEmptyState
    ? (() => {
      const lines = wrap(weaknesses[0], 9, false, colW - PAD * 2 - 10);
      return [{
        h: 24 + lines.length * 12 + 18,
        draw: (x, iy, w) => {
          drawIcon('checkCircle', x + w / 2, iy + 18, { color: C.green, size: 22, lw: 1.4 });
          lines.forEach((line, li) => txt(line, x + w / 2, iy + 46 + li * 12, { size: 9, color: C.slate, align: 'center' }));
        },
      }];
    })()
    : listItems(weaknesses, C.amber, 'alert');
  pairCards(
    { title: 'Key Strengths', icon: 'checkCircle', items: strengthItems, opts: { fill: C.greenTint, stroke: C.greenLine, accent: C.green } },
    { title: 'Missing / Weak Areas', icon: 'alert', items: weakItems, opts: { fill: C.amberTint, stroke: C.amberLine, accent: C.amber } },
    colW,
    colW,
  );

  // ======================= PAGE 2 =======================
  newPage();

  // AI Summary + Growth
  const summary = candidate.summary || candidate.remarks || '';
  const growth = candidate.growthPattern ? `${asText(candidate.growthPattern)}` : '';
  const textItems = (text, w, size = 9) => wrap(text, size, false, w).map((line) => ({
    h: size * 1.45,
    draw: (x, iy) => txt(line, x, iy + size, { size, color: C.slate }),
  }));
  if (summary || growth) {
    const summaryW = growth ? CW * 0.62 : CW;
    const growthW = CW - summaryW - GAP;
    const summaryItems = summary ? textItems(summary, summaryW - PAD * 2) : textItems('No summary returned yet.', summaryW - PAD * 2);
    if (growth) {
      const growthItems = textItems(growth, growthW - PAD * 2);
      pairCards(
        { title: 'Executive Summary', icon: 'sparkle', items: summaryItems, opts: { fill: C.blueTint, stroke: C.blueLine } },
        { title: 'Growth Pattern', icon: 'trend', items: growthItems, opts: { fill: C.greenTint, stroke: C.greenLine, accent: C.green } },
        summaryW,
        growthW,
      );
    } else {
      flowCard('Executive Summary', 'sparkle', summaryItems, { fill: C.blueTint, stroke: C.blueLine });
    }
  }

  // Interview questions
  const questions = (candidate.interviewQuestions || []).map(asText).filter(Boolean);
  if (questions.length > 0) {
    const qItems = questions.map((q, i) => {
      const lines = wrap(q, 9, false, CW - PAD * 2 - 52);
      const h = Math.max(28, lines.length * 11.5 + 13);
      return {
        h: h + 4,
        draw: (x, iy, w) => {
          rr(x, iy, w, h, 8, { fill: i % 2 === 0 ? C.bg : C.blueTint, stroke: i % 2 === 0 ? C.border : C.blueLine });
          doc.setFillColor(...rgb(C.blue));
          doc.circle(x + 18, iy + h / 2, 9, 'F');
          txt(String(i + 1).padStart(2, '0'), x + 18, iy + h / 2 + 2.6, { size: 7.5, bold: true, color: C.white, align: 'center' });
          lines.forEach((line, li) => txt(line, x + 38, iy + h / 2 - ((lines.length - 1) * 12) / 2 + 3 + li * 12, { size: 9, color: C.navy }));
        },
      };
    });
    flowCard('Interview Questions', 'chat', qItems);
  }

  // Work experience + education
  const experience = candidate.experienceHistory || [];
  const education = candidate.education || [];
  const expW = education.length > 0 ? CW * 0.58 : CW;
  const eduW = CW - expW - GAP;
  const expItems = experience.length === 0
    ? textItems('No experience details returned from screening yet.', expW - PAD * 2)
    : experience.map((exp, i) => {
      const title = asText(exp?.title) || '-';
      const meta = [exp?.company, exp?.duration].map(asText).filter(Boolean).join('  |  ');
      const desc = exp?.description ? wrap(asText(exp.description), 8.5, false, expW - PAD * 2 - 24) : [];
      const metaLines = meta ? wrap(meta, 8.5, false, expW - PAD * 2 - 24) : [];
      const h = 18 + metaLines.length * 11.5 + desc.length * 11.5 + 14;
      const current = /present|current|till\s*date|ongoing/i.test(String(exp?.duration || ''));
      return {
        h,
        draw: (x, iy, w) => {
          doc.setFillColor(...rgb(C.blue));
          doc.circle(x + 5, iy + 6, 3.2, 'F');
          if (i < experience.length - 1) {
            drawC(C.blueLine);
            doc.setLineWidth(1.2);
            doc.line(x + 5, iy + 11, x + 5, iy + h + 4);
          }
          txt(title, x + 20, iy + 9, { size: 10, bold: true, color: C.navy });
          if (current) {
            const cw = widthOf('Current', 7.5, true) + 14;
            rr(x + w - cw, iy - 1, cw, 14, 7, { fill: C.greenTint, stroke: C.greenLine });
            txt('Current', x + w - cw / 2, iy + 8.6, { size: 7.5, bold: true, color: C.green, align: 'center' });
          }
          let ty = iy + 22;
          metaLines.forEach((line) => { txt(line, x + 20, ty, { size: 8.5, color: C.blue }); ty += 11.5; });
          desc.forEach((line) => { txt(line, x + 20, ty + 1, { size: 8.5, color: C.slate }); ty += 11.5; });
        },
      };
    });
  const eduItems = education.map((edu) => {
    const degree = wrap(asText(edu?.degree) || '-', 9.5, true, eduW - PAD * 2);
    const school = wrap(asText(edu?.school), 8.5, false, eduW - PAD * 2);
    const year = asText(edu?.year);
    const h = degree.length * 12.5 + school.length * 11.5 + (year ? 13 : 0) + 14;
    return {
      h,
      draw: (x, iy) => {
        let ty = iy + 9;
        degree.forEach((line) => { txt(line, x, ty, { size: 9.5, bold: true, color: C.navy }); ty += 12.5; });
        school.forEach((line) => { txt(line, x, ty, { size: 8.5, color: C.slate }); ty += 11.5; });
        if (year) txt(year, x, ty + 1, { size: 8.5, color: C.blue });
      },
    };
  });
  if (education.length > 0) {
    pairCards(
      { title: 'Work Experience', icon: 'briefcase', items: expItems },
      { title: 'Education', icon: 'cap', items: eduItems },
      expW,
      eduW,
    );
  } else {
    flowCard('Work Experience', 'briefcase', expItems);
  }

  // Skills as chips
  const skills = (candidate.skills || []).map(asText).filter(Boolean);
  if (skills.length > 0) {
    const rowsOfChips = [];
    let row = [];
    let used = 0;
    const innerW = CW - PAD * 2;
    skills.forEach((skill) => {
      const w = Math.min(widthOf(skill, 8, false) + 18, innerW);
      if (used + w > innerW && row.length) {
        rowsOfChips.push(row);
        row = [];
        used = 0;
      }
      row.push({ skill, w });
      used += w + 6;
    });
    if (row.length) rowsOfChips.push(row);
    const chipItems = rowsOfChips.map((r) => ({
      h: 23,
      draw: (x, iy) => {
        let cx = x;
        r.forEach(({ skill, w }) => {
          rr(cx, iy, w, 17, 8.5, { fill: C.blueTint, stroke: C.blueLine });
          txt(skill, cx + w / 2, iy + 11.5, { size: 8, color: C.navy, align: 'center' });
          cx += w + 6;
        });
      },
    }));
    flowCard('Technical Skills', 'grid', chipItems);
  }

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p += 1) {
    doc.setPage(p);
    drawC(C.border);
    doc.setLineWidth(0.8);
    doc.line(M, PH - 40, PW - M, PH - 40);
    txt(name.toUpperCase(), M, PH - 28, { size: 7.5, bold: true, color: C.navy });
    txt(`- Candidate Intelligence Report`, M + widthOf(name.toUpperCase(), 7.5, true) + 4, PH - 28, { size: 7.5, color: C.slate });
    txt(`Page ${p} of ${pages}`, PW - M, PH - 28, { size: 7.5, color: C.slate, align: 'right' });
    txt('AI-generated results may be inaccurate. Please verify before making hiring decisions.', PW / 2, PH - 14, { size: 6.5, color: C.slate, align: 'center' });
  }

  doc.save(`${fileBase(candidate)}.pdf`);
}
