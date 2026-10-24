// Refresh src/_data/races.json from the RunSignup public API (no key needed for public races)
// plus hand-curated majors from src/_data/curated.json. Run: npm run data
import { readFileSync, writeFileSync } from 'node:fs';
const root = new URL('../src/_data/', import.meta.url).pathname;
const TZ = 'America/Los_Angeles';
const ymd = d => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const today = ymd(new Date());
const end = new Date(new Date(today + 'T12:00:00Z').getTime() + 365 * 864e5).toISOString().slice(0, 10);

// Metros and sub-regions live in src/_data/metros.json (shared with the site). A sub-region matches by
// city name first, then by 3-digit ZIP prefix. Races that match no sub-region are outside the footprint.
const METROS = JSON.parse(readFileSync(root + 'metros.json', 'utf8'));
const locate = (m, city, zip) => {
  const c = city.toLowerCase(), z3 = String(zip || '').slice(0, 3);
  return m.regions.find(r => (r.cities || []).some(x => x.toLowerCase() === c)) || m.regions.find(r => (r.zip3 || []).includes(z3)) || null;
};
const RUN_TYPES = new Set(['running_race', 'trail_race', 'running_only']);
const SKIP_NAME = /\b(bus|vendor|volunteer|run club|packet|parking|shuttle|merch|donation only|test race)\b|runsignup page/i;

const toKm = s => {
  if (!s) return null; const m = String(s).match(/([\d.]+)\s*(k|km|miles?|mi|m|meters?|yards?|yd)?\b/i); if (!m) return null;
  const n = parseFloat(m[1]), u = (m[2] || 'k').toLowerCase();
  if (u === 'k' || u === 'km') return n; if (u.startsWith('mi')) return n * 1.609344; if (u.startsWith('y')) return n * 0.0009144; return n / 1000;
};
const cat = km => km == null ? null : km >= 4.6 && km <= 5.4 ? '5k' : km >= 9.5 && km <= 10.6 ? '10k' : km >= 20.6 && km <= 22.2 ? 'half' : km >= 41.6 && km <= 43.2 ? 'marathon' : km > 43.2 ? 'ultra' : 'other';
const label = (s, km) => {
  const c = cat(km); if (c === '5k') return '5K'; if (c === '10k') return '10K'; if (c === 'half') return 'Half marathon'; if (c === 'marathon') return 'Marathon';
  if (km && Math.abs(km - 50) < 0.6) return '50K'; if (km && Math.abs(km - 80.47) < 1) return '50 miles'; if (km && Math.abs(km - 160.9) < 2) return '100 miles';
  const mi = String(s).match(/([\d.]+)\s*mi/i); if (mi) return `${+mi[1]} ${+mi[1] === 1 ? 'mile' : 'miles'}`; return String(s).replace(/\s+/g, ' ').trim();
};
// RunSignup dates are "M/D/YYYY HH:MM" in the race's local time.
const parse = s => { if (!s) return null; const m = s.match(/(\d+)\/(\d+)\/(\d{4})(?:\s+(\d+):(\d+))?/); if (!m) return null; return { d: `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`, t: m[4] != null ? `${m[4].padStart(2, '0')}:${m[5]}` : null }; };
const money = s => s == null ? null : parseFloat(String(s).replace(/[^\d.]/g, '')) || null;
const clean = s => String(s || '').replace(/[\u2014\u2013]/g, '-').replace(/\s+/g, ' ').trim();
const strip = h => clean(String(h || '').replace(/<(br|\/p|\/li|\/h\d)\s*\/?>/gi, '. ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|\u00a0/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, "'").replace(/&quot;|&ldquo;|&rdquo;/g, '"').replace(/&[a-z#0-9]+;/gi, ' ')).replace(/\s+([.!?,;:])/g, '$1').replace(/([.!?])(\s*\.)+/g, '$1').replace(/(\.\s*){2,}/g, '. ').replace(/^\.\s*/, '');
const summary = h => { const t = strip(h); if (!t) return ''; const ss = t.match(/[^.!?]+[.!?]+/g) || [t]; let o = ''; for (const s of ss) { if ((o + s).length > 320) break; o += s; } return clean(o || t.slice(0, 300) + '...'); };
const slugify = s => clean(s).toLowerCase().replace(/&/g, ' and ').replace(/['’™®]/g, '').replace(/\b(20\d\d)\b/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70).replace(/-$/, '');
const titleCase = s => /[a-z]/.test(s) ? s.replace(/\b([A-Z]{4,})\b/g, w => w[0] + w.slice(1).toLowerCase()).replace(/San Francisco/gi, 'San Francisco') : s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

async function fetchRunSignup(m) {
  const out = [];
  // One radius query per metro centre. Unauthenticated pagination stops at 1,000 results.
  for (let page = 1; page <= 4; page++) {
    const u = `https://runsignup.com/Rest/races?format=json&start_date=${today}&end_date=${end}&zipcode=${m.zip}&radius=${m.radius}&results_per_page=250&page=${page}&events=T&include_event_days=T`;
    let j; for (let t = 0; t < 3; t++) { try { j = await (await fetch(u, { headers: { 'User-Agent': 'RaceCalendar/1.0 (race listings)' } })).json(); break; } catch (e) { await new Promise(r => setTimeout(r, 2000)); } }
    if (!j || !j.races) { console.warn(m.slug, 'RunSignup:', JSON.stringify(j).slice(0, 200)); break; }
    out.push(...j.races.map(x => x.race)); if (j.races.length < 250) break;
  }
  return out;
}

function shape(r, now, m) {
  const city = clean(r.address?.city || ''), reg = locate(m, city, r.address?.zipcode), region = reg && reg.slug;
  const nd = parse(r.next_date);
  if (!region || !nd || nd.d < today || nd.d > end || SKIP_NAME.test(r.name) || r.is_draft_race === 'T' || r.is_private_race === 'T') return { skip: !region ? `region:${city}` : 'filter' };
  const evs = (r.events || []).filter(e => RUN_TYPES.has(e.event_type) && parse(e.start_time)?.d === nd.d);
  if (!evs.length) return { skip: 'no-running-events' };
  const trailWords = /\btrail|\bridge|single ?track|fire ?road|\bhills? run|\bdipsea|\bxc\b|cross country/i;
  const isTrail = evs.some(e => e.event_type === 'trail_race') || trailWords.test(r.name) || /\btrail(s)?\b/i.test(strip(r.description).slice(0, 600));
  const seen = new Set(), dist = [];
  let start = null, priceNow = null, priceMax = null, inc = null, regOpen = null, regClose = null; const rises = [];
  for (const e of evs) {
    const km = toKm(e.distance), c = cat(km), l = label(e.distance || e.name, km);
    if (e.distance && !seen.has(l) && km >= 0.9) { seen.add(l); dist.push({ label: l, cat: c, km: km ? +km.toFixed(2) : null }); }
    const st = parse(e.start_time); if (st?.t && st.t !== '00:00' && (!start || st.t < start)) start = st.t;
    const periods = (e.registration_periods || []).map(p => ({ o: parse(p.registration_opens), c: parse(p.registration_closes), fee: money(p.race_fee), pf: money(p.processing_fee) })).filter(p => p.o && p.c);
    for (const p of periods) { if (!regOpen || p.o.d < regOpen) regOpen = p.o.d; if (!regClose || p.c.d > regClose) regClose = p.c.d; }
    const key = p => p.d + 'T' + (p.t || '00:00');
    const cur = periods.find(p => key(p.o) <= now && now <= key(p.c)) || periods.find(p => key(p.o) > now);
    if (cur && cur.fee && km >= 0.9) {
      if (priceNow == null || cur.fee < priceNow) priceNow = cur.fee; if (priceMax == null || cur.fee > priceMax) priceMax = cur.fee;
      const nx = periods.filter(p => key(p.o) > key(cur.o)).sort((a, b) => key(a.o) < key(b.o) ? -1 : 1)[0];
      if (nx && nx.fee > cur.fee && key(cur.o) <= now) rises.push({ date: cur.c.d, event: clean(l), from: cur.fee, to: nx.fee });
    }
  }
  // Next price rise: the earliest one, plus every distance that rises that day (events) and whether that is all of them (all).
  if (rises.length) {
    const d = rises.reduce((m, x) => x.date < m ? x.date : m, rises[0].date), same = rises.filter(x => x.date === d);
    const by = new Map(); for (const x of same) by.set(x.event, by.has(x.event) && by.get(x.event) !== x.to ? null : x.to); // two fees for one distance: no single new price
    const events = [...by].map(([event, to]) => ({ event, to }));
    inc = { ...same[0], events, all: dist.every(q => events.some(e => e.event === q.label)) };
  }
  if (!dist.length) return { skip: 'no-distances' };
  const order = { '5k': 1, '10k': 2, half: 3, marathon: 4, ultra: 5, other: 0 };
  dist.sort((a, b) => (a.km || 0) - (b.km || 0));
  const cats = [...new Set(dist.map(d => d.cat).filter(c => c && c !== 'other'))].sort((a, b) => order[a] - order[b]);
  if (isTrail) cats.push('trail');
  const open = r.is_registration_open === 'T';
  return {
    id: 'rs-' + r.race_id, metro: m.slug, source: 'RunSignup', name: titleCase(clean(r.name)).replace(/^20\d\d\s+/, '').replace(/\s*[-(]?\s*20\d\d\s*\)?\s*$/, ''), date: nd.d, endDate: parse(r.next_end_date)?.d || nd.d, start,
    city, region, street: clean(r.address?.street || ''), zip: r.address?.zipcode || '', distances: dist, cats, trail: isTrail,
    priceFrom: priceNow, priceTo: priceMax, nextIncrease: inc, regOpen, regClose, open,
    url: r.url, website: r.external_race_url || null, logo: r.logo_url || null, summary: summary(r.description), modified: r.last_modified,
  };
}

const now = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()).replace(' ', 'T');
const skipped = {}, races = [], seen = new Set(), perMetro = {}; let rawTotal = 0;
for (const m of METROS) {
  const raw = await fetchRunSignup(m); rawTotal += raw.length; perMetro[m.slug] = { raw: raw.length, kept: 0 };
  for (const r of raw) {
    if (seen.has(r.race_id)) continue;
    const s = shape(r, now, m); if (s.skip) { const k = s.skip.startsWith('region') ? 'outside-footprint' : s.skip; skipped[k] = (skipped[k] || 0) + 1; continue; }
    seen.add(r.race_id); races.push(s); perMetro[m.slug].kept++;
  }
}
// Hand-curated majors that are not on RunSignup (Race Roster, NYRR, BAA, own platforms). Verified against official
// race or organizer pages; each entry carries a `checked` date. Past entries drop out automatically (date < today).
// Dedupe: if RunSignup already lists the same race (same metro, same date, near-identical name), keep the RunSignup
// listing (live prices, affiliate link) and skip the curated one. Charity-team and bib-resale pages never count as a match.
const STOP = new Set(['the', 'and', 'a', 'of', 'at', 'in', 'by', 'presented', 'race', 'run', 'annual', 'inc']);
const toks = s => clean(s).toLowerCase().replace(/&/g, ' and ').replace(/['\u2019]/g, '').replace(/\b20\d\d\b/g, ' ').split(/[^a-z0-9]+/).filter(w => w && !STOP.has(w));
const NOT_RACE = /\b(team|bibs?|charity|fundrais\w*|reservation|virtual|volunteers?|shakeout|training)\b/i;
const sameRace = (a, b) => {
  if (a.metro !== b.metro || a.date !== b.date || NOT_RACE.test(b.name)) return false;
  const A = new Set(toks(a.name)), B = new Set(toks(b.name)); if (!A.size || !B.size) return false;
  const inter = [...A].filter(w => B.has(w)).length;
  return inter / new Set([...A, ...B]).size >= 0.6 || inter === Math.min(A.size, B.size) && inter >= 3;
};
const curatedAll = JSON.parse(readFileSync(root + 'curated.json', 'utf8'));
const pastCurated = curatedAll.filter(c => c.date < today).length;
const rsList = races.slice(), dupes = [];
const curated = curatedAll.filter(c => c.date >= today && c.date <= end).filter(c => { const d = rsList.find(r => sameRace(c, r)); if (d) dupes.push(`${c.name} = ${d.name} (${d.id})`); return !d; });
for (const c of curated) {
  const m = METROS.find(x => x.slug === c.metro);
  const region = m.regions.some(g => g.slug === c.region) ? c.region : locate(m, c.city, c.zip)?.slug || m.regions[0].slug;
  races.push({ source: 'Official site', open: true, priceFrom: null, priceTo: null, nextIncrease: null, logo: null, ...c, region });
}
if (dupes.length) console.log('Curated skipped as RunSignup duplicates:', dupes);
console.log(`Curated: ${curated.length} listed, ${dupes.length} deduped, ${pastCurated} past (dropped).`);
// Unique slugs: name-based; add the month when two listings share a name (series races).
races.sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
const used = new Map();
for (const r of races) { let s = slugify(r.name) || r.id; if (used.has(r.metro + '/' + s)) s += '-' + new Date(r.date + 'T12:00:00Z').toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }).toLowerCase(); if (used.has(r.metro + '/' + s)) s += '-' + r.date.slice(8); used.set(r.metro + '/' + s, 1); r.slug = s; }
writeFileSync(root + 'races.json', JSON.stringify({ updated: now, from: today, to: end, sources: { runsignup: races.filter(r => r.source === 'RunSignup').length, curated: curated.length }, perMetro, races }, null, 1));
console.log(perMetro); console.log(`RunSignup raw ${rawTotal}, kept ${races.length - curated.length}, curated ${curated.length}, total ${races.length}. Skipped:`, skipped);
