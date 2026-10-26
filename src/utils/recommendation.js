// Groups the free-text AI recommendation into the buckets the Candidates page summarises.
export function recommendationBucket(text) {
  const v = String(text || '').toLowerCase();
  if (!v) return 'other';
  if (/not recommended|reject|below|low match|no hire/.test(v)) return 'not';
  if (/consider|proceed|caution|interview/.test(v)) return 'consider';
  if (/recommend|shortlist|strong hire|hire/.test(v)) return 'recommended';
  return 'other';
}

export const BUCKET_STYLE = {
  recommended: { pill: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  consider: { pill: 'bg-blue-50 text-blue-700', dot: 'bg-blue-500' },
  not: { pill: 'bg-red-50 text-red-700', dot: 'bg-red-500' },
  other: { pill: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
};
