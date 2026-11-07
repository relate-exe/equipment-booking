// All dates are "YYYY-MM-DD" strings in the user's local calendar. No timezone math.
export const pad = (n) => String(n).padStart(2, '0');
export const toKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`; // m is 0-based

export function todayKey() {
  const d = new Date();
  return toKey(d.getFullYear(), d.getMonth(), d.getDate());
}

export function daysBetween(fromKey, toKeyStr) {
  const a = Date.UTC(...fromKey.split('-').map((v, i) => (i === 1 ? Number(v) - 1 : Number(v))));
  const b = Date.UTC(...toKeyStr.split('-').map((v, i) => (i === 1 ? Number(v) - 1 : Number(v))));
  return Math.round((b - a) / 86400000);
}

// Plain date math only: "in 3 days", "today", "2 days ago". Nothing medical is inferred.
export function relativeLabel(dateKey, today = todayKey()) {
  const n = daysBetween(today, dateKey);
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n === -1) return 'Yesterday';
  return n > 0 ? `In ${n} days` : `${Math.abs(n)} days ago`;
}

export function formatDate(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function monthGrid(year, month) {
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells = Array(first).fill(null);
  for (let d = 1; d <= days; d++) cells.push(toKey(year, month, d));
  while (cells.length % 7) cells.push(null);
  return cells;
}

export const fmtDateTime = (iso) =>
  new Date(iso).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

// <input type="datetime-local"> works in local time without a zone; convert both ways
export const toLocalInput = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const localInputToISO = (v) => new Date(v).toISOString();

// Every local calendar day (YYYY-MM-DD) that a booking touches
export function daysCovered(startISO, endISO) {
  const s = new Date(startISO);
  const e = new Date(new Date(endISO).getTime() - 1);
  const out = [];
  const d = new Date(s.getFullYear(), s.getMonth(), s.getDate());
  while (d <= e) {
    out.push(toKey(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setDate(d.getDate() + 1);
  }
  return out;
}
