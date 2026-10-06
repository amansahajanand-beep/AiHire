import { jsPDF } from 'jspdf';
import { weightedEntries, weightage, labels } from '../components/candidates/MatchBreakdown';
import { formatDate } from './helpers';

const MARGIN = 48;
const COLORS = {
  ink: [15, 23, 42],
  body: [71, 85, 105],
  muted: [100, 116, 139],
  line: [226, 232, 240],
  accent: [79, 70, 229],
  purple: [124, 58, 237],
  green: [16, 185, 129],
  amber: [245, 158, 11],
  red: [239, 68, 68],
};

// The built-in PDF fonts only cover Latin-1, so swap common typographic characters.
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

function scoreColor(score) {
  if (score >= 66) return COLORS.green;
  if (score >= 41) return COLORS.amber;
  return COLORS.red;
}

/** Builds and downloads a PDF of the candidate detail/report from the already-loaded candidate data. */
export function downloadCandidateReport(candidate) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const contentW = pageW - MARGIN * 2;
  let y = MARGIN;

  const ensure = (h) => {
    if (y + h > pageH - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const text = (value, { size = 10, bold = false, color = COLORS.body, indent = 0, gap = 4 } = {}) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(clean(value), contentW - indent);
    const lineH = size * 1.4;
    lines.forEach((line) => {
      ensure(lineH);
      doc.text(line, MARGIN + indent, y + size);
      y += lineH;
    });
    y += gap;
  };

  const heading = (title) => {
    ensure(40);
    y += 8;
    doc.setDrawColor(...COLORS.line);
    doc.line(MARGIN, y, pageW - MARGIN, y);
    y += 10;
    text(title, { size: 13, bold: true, color: COLORS.ink, gap: 6 });
  };

  const bullets = (items) => items.forEach((item) => text(`-  ${asText(item)}`, { indent: 6, gap: 3 }));

  // Header
  text(candidate.name || 'Candidate', { size: 20, bold: true, color: COLORS.ink, gap: 2 });
  text(candidate.job || '-', { size: 11, color: COLORS.muted, gap: 8 });
  const screenedOn = candidate.screenedOn ? formatDate(candidate.screenedOn) : '-';
  const screenedTime = candidate.screenedOn ? timeOf(candidate.screenedOn) : '';
  const facts = [
    ['Applied for', candidate.job || '-'],
    ['Screened on', screenedOn],
    ['Time', screenedTime || '-'],
    ['Location', candidate.location || '-'],
    ['Status', candidate.status || candidate.screeningStatus || '-'],
    ['Email', candidate.email || '-'],
    ['Phone', candidate.phone || '-'],
  ];
  facts.forEach(([label, value]) => {
    text(`${label}: ${value}`, { color: COLORS.body, gap: 1 });
  });

  // Match score
  heading('AI Match Score');
  const score = Math.round(Number(candidate.score) || 0);
  text(`${score} / 100`, { size: 24, bold: true, color: scoreColor(score), gap: 2 });
  text(candidate.status || candidate.humanEvaluation || 'Screened profile', { color: COLORS.muted });

  // Match breakdown (same weighted calculation as the page)
  heading('AI Match Breakdown');
  const entries = weightedEntries(candidate.breakdown);
  if (entries.length === 0) text('No breakdown available.', { color: COLORS.muted });
  entries.forEach(([key, value]) => {
    const max = weightage[key] ?? 100;
    const barW = contentW - 170;
    ensure(22);
    const color = key === 'overall' ? scoreColor(value) : COLORS.purple;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...color);
    doc.text(clean(labels[key] || key), MARGIN, y + 10);
    doc.setFillColor(...COLORS.line);
    doc.roundedRect(MARGIN + 90, y + 2, barW, 8, 4, 4, 'F');
    const filled = Math.max(0, Math.min(1, value / max)) * barW;
    if (filled > 0) {
      doc.setFillColor(...color);
      doc.roundedRect(MARGIN + 90, y + 2, Math.max(filled, 8), 8, 4, 4, 'F');
    }
    doc.setFont('helvetica', 'bold');
    doc.text(`${value} / ${max}`, pageW - MARGIN, y + 10, { align: 'right' });
    y += 22;
  });

  // Strengths / weaknesses (same fallbacks as the page)
  const done = candidate.screeningStatus === 'completed';
  const strengths = candidate.strengths?.length
    ? candidate.strengths
    : done ? ['See AI Summary below'] : ['Screening in progress...'];
  const weaknesses = candidate.weaknesses?.length
    ? candidate.weaknesses
    : !done
      ? ['Waiting for screening result']
      : candidate.risk ? [`Risk flag: ${candidate.risk}`] : ['No weak areas returned yet'];
  heading('Strengths');
  bullets(strengths);
  heading('Missing / Weak Areas');
  bullets(weaknesses);

  if (candidate.summary || candidate.remarks || candidate.growthPattern) {
    heading('AI Summary');
    if (candidate.growthPattern) text(`Growth: ${candidate.growthPattern}`, { color: COLORS.accent });
    text(candidate.summary || candidate.remarks || '');
  }

  if ((candidate.interviewQuestions || []).length > 0) {
    heading('Interview Questions');
    candidate.interviewQuestions.forEach((q, i) => text(`${i + 1}. ${asText(q)}`, { indent: 6, gap: 3 }));
  }

  if ((candidate.skills || []).length > 0) {
    heading('Skills');
    text(asText(candidate.skills));
  }

  if ((candidate.experienceHistory || []).length > 0) {
    heading('Work Experience');
    candidate.experienceHistory.forEach((exp) => {
      text(asText(exp.title), { bold: true, color: COLORS.ink, gap: 1 });
      text([exp.company, exp.duration].map(asText).filter(Boolean).join('  |  '), { color: COLORS.muted, gap: 1 });
      if (exp.description) text(asText(exp.description), { gap: 6 });
    });
  }

  if ((candidate.education || []).length > 0) {
    heading('Education');
    candidate.education.forEach((edu) => {
      text(asText(edu.degree), { bold: true, color: COLORS.ink, gap: 1 });
      text([edu.school, edu.year].map(asText).filter(Boolean).join('  |  '), { color: COLORS.muted, gap: 6 });
    });
  }

  // Footer with page numbers
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p += 1) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text(`Candidate report - ${clean(candidate.name || '')}`, MARGIN, pageH - 24);
    doc.text(`Page ${p} of ${pages}`, pageW - MARGIN, pageH - 24, { align: 'right' });
  }

  const safeName = clean(candidate.name || 'candidate').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'candidate';
  doc.save(`${safeName}_report.pdf`);
}
