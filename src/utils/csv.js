// Cells that spreadsheets would run as formulas get a leading apostrophe; plain phone numbers are left alone.
function csvCell(value) {
  let str = String(value ?? '').replace(/\r?\n/g, ' ').trim();
  if (/^[=@\t\r]/.test(str) || (/^[+-]/.test(str) && !/^[+-]?[\d\s().-]+$/.test(str))) str = `'${str}`;
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

/** Downloads rows (first row = header) as a UTF-8 .csv file that Excel opens correctly. */
export function downloadCsv(rows, filename) {
  const text = rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
  const blob = new Blob(['\uFEFF', text], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
