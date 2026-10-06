// Total years of experience, derived from a candidate's structured experience entries
// (`experienceHistory[].duration`, e.g. "Feb 2026 - Present", "2019 - 2022", "2 years 3 months").
// Free text such as the AI summary is deliberately NOT used.

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const DATE_TOKEN = /(?:\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?,?\s+|\b(0?[1-9]|1[0-2])[/.-])?\b((?:19|20)\d{2})\b/gi;
const OPEN_ENDED = /present|current|till\s*date|to\s*date|now|ongoing/i;

function explicitYears(text) {
  const years = /(\d+(?:\.\d+)?)\s*(?:years?|yrs?)\b/i.exec(text);
  const months = /(\d+(?:\.\d+)?)\s*(?:months?|mos?)\b/i.exec(text);
  if (!years && !months) return null;
  return (years ? Number(years[1]) : 0) + (months ? Number(months[1]) / 12 : 0);
}

function rangeInMonths(text, now) {
  const tokens = [...text.matchAll(DATE_TOKEN)].map((m) => ({
    month: m[1] ? MONTHS.indexOf(m[1].toLowerCase()) : m[2] ? Number(m[2]) - 1 : null,
    year: Number(m[3]),
  }));
  if (tokens.length === 0) return null;
  const start = tokens[0];
  const startIdx = start.year * 12 + (start.month ?? 0);
  let endIdx;
  if (tokens.length >= 2) {
    const end = tokens[1];
    // A named month counts through the end of that month; a bare year ends where that year starts.
    endIdx = end.year * 12 + (end.month ?? -1) + 1;
  } else if (OPEN_ENDED.test(text)) {
    endIdx = now.getFullYear() * 12 + now.getMonth() + 1;
  } else {
    return null;
  }
  if (endIdx < startIdx) return null;
  return [startIdx, endIdx];
}

/** Returns total years (number) or null when no duration can be read. Overlapping periods count once. */
export function getExperienceYears(candidate, now = new Date()) {
  const entries = Array.isArray(candidate?.experienceHistory) ? candidate.experienceHistory : [];
  const ranges = [];
  let extraYears = 0;
  let found = false;

  entries.forEach((entry) => {
    const text = typeof entry?.duration === 'string' ? entry.duration : '';
    if (!text) return;
    const explicit = explicitYears(text);
    if (explicit != null) {
      extraYears += explicit;
      found = true;
      return;
    }
    const range = rangeInMonths(text, now);
    if (range) {
      ranges.push(range);
      found = true;
    }
  });

  if (!found) return null;

  ranges.sort((a, b) => a[0] - b[0]);
  let months = 0;
  let current = null;
  ranges.forEach(([start, end]) => {
    if (!current || start > current[1]) {
      if (current) months += current[1] - current[0];
      current = [start, end];
    } else {
      current[1] = Math.max(current[1], end);
    }
  });
  if (current) months += current[1] - current[0];

  return Math.round((months / 12 + extraYears) * 100) / 100;
}

// "2 years", "2.5 years", "5+ years", "3 yrs"
const EXPERIENCE_QUERY = /(\d+(?:\.\d+)?)\s*(\+)?\s*(?:years?|yrs?)\b/gi;

/** Splits a search string into experience constraints and the remaining plain keywords. */
export function parseExperienceQuery(query) {
  const constraints = [];
  const rest = String(query || '').replace(EXPERIENCE_QUERY, (_, num, plus) => {
    constraints.push({ value: Number(num), atLeast: Boolean(plus) });
    return ' ';
  });
  return { constraints, rest };
}

/**
 * "5+ years" -> 5 or more. "2 years" / "2.5 years" -> approximately exactly that, give or take 3 months
 * (so "2 years" matches 1.75 to 2.25 and never 3 or 4).
 */
export function matchesExperience(years, { value, atLeast }) {
  if (years == null) return false;
  if (atLeast) return years >= value;
  return Math.abs(years - value) <= 0.25;
}
