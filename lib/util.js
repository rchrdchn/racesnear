// Shared date, distance and URL helpers for templates and computed data.
const TZ = 'America/Los_Angeles';
const ymd = (d, tz = TZ) => new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const D = s => new Date(s + 'T12:00:00Z');
const addDays = (s, n) => new Date(D(s).getTime() + n * 864e5).toISOString().slice(0, 10);
const dow = s => D(s).getUTCDay();
const fmt = (s, o) => D(s).toLocaleDateString('en-US', { timeZone: 'UTC', ...o });
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const DISTS = [
  { slug: '5k-races', cat: '5k', name: '5K races', short: '5K', one: '5K' },
  { slug: '10k-races', cat: '10k', name: '10K races', short: '10K', one: '10K' },
  { slug: 'half-marathons', cat: 'half', name: 'Half marathons', short: 'Half', one: 'half marathon' },
  { slug: 'marathons', cat: 'marathon', name: 'Marathons', short: 'Marathon', one: 'marathon' },
  { slug: 'ultramarathons', cat: 'ultra', name: 'Ultramarathons', short: 'Ultra', one: 'ultra' },
  { slug: 'trail-races', cat: 'trail', name: 'Trail races', short: 'Trail', one: 'trail race' },
];
// Weekend window: Sat+Sun of this week (on Sunday, just today). Mon-Fri look ahead to the coming Sat-Sun.
function weekend(today) {
  const w = dow(today);
  if (w === 0) return [today, today];
  if (w === 6) return [today, addDays(today, 1)];
  const sat = addDays(today, 6 - w); return [sat, addDays(sat, 1)];
}
function tzOffset(date, time, tz) {
  const d = new Date(`${date}T${time || '12:00'}:00Z`);
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(d).map(x => [x.type, x.value]));
  const local = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
  const off = Math.round((local - d.getTime()) / 6e4), s = off < 0 ? '-' : '+', a = Math.abs(off);
  return `${s}${String(Math.floor(a / 60)).padStart(2, '0')}:${String(a % 60).padStart(2, '0')}`;
}
const time12 = t => { if (!t) return null; let [h, m] = t.split(':').map(Number); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${h}:${String(m).padStart(2, '0')} ${ap}`; };
const money = n => n == null ? null : '$' + (Number.isInteger(n) ? n : n.toFixed(2));
module.exports = { TZ, ymd, D, addDays, dow, fmt, MONTHS, DISTS, weekend, tzOffset, time12, money };
