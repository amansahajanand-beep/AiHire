export function getScoreColor(score) {
  if (score >= 85) return { text: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', fill: '#10B981', label: 'Excellent Match' };
  if (score >= 70) return { text: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', fill: '#F59E0B', label: 'Strong Match' };
  if (score >= 50) return { text: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', fill: '#F59E0B', label: 'Moderate Match' };
  return { text: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', fill: '#EF4444', label: 'Low Match' };
}

export function getStatusColor(status) {
  const map = {
    Shortlisted: 'bg-blue-50 text-blue-700 border-blue-200',
    'Human Review': 'bg-amber-50 text-amber-700 border-amber-200',
    Review: 'bg-amber-50 text-amber-700 border-amber-200',
    Pending: 'bg-slate-100 text-slate-600 border-slate-200',
    'Low Match': 'bg-red-50 text-red-700 border-red-200',
    Rejected: 'bg-red-50 text-red-700 border-red-200',
    Published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Draft: 'bg-amber-50 text-amber-700 border-amber-200',
    Closed: 'bg-violet-50 text-violet-700 border-violet-200',
    Archived: 'bg-slate-100 text-slate-500 border-slate-200',
    'On Hold': 'bg-slate-100 text-slate-500 border-slate-200',
  };
  return map[status] || 'bg-slate-50 text-slate-600 border-slate-200';
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getInitials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// Human Review shows the human's action (Shortlist / Reject / Move to Review); no action is N/A.
export function humanReviewLabel(value) {
  const v = String(value || '').trim().toLowerCase();
  if (v === 'shortlisted') return 'Shortlisted';
  if (v === 'rejected') return 'Rejected';
  if (v === 'human review') return 'Human Review';
  return 'N/A';
}

/** Centre-crops an image file to a square and returns a small JPEG data URL (default 256px). */
export function resizeImageToDataUrl(file, size = 256, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file'));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      canvas.getContext('2d').drawImage(
        img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size
      );
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image'));
    };
    img.src = url;
  });
}
