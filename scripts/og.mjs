// Post-build: 1200x630 share images -> _site/og/<key>.png (keys in lib/og.js), plus /logo.png for
// Organization schema. Each card is an SVG rendered by sharp. Race pages get their own card (date tile,
// name, city, distances, price and the next price rise); city hubs get the headline, race count and the
// next race; other pages get the H1 and the first sentence of their description.
// Text is DejaVu (on the Cloudflare build image); scripts/og-widths.json holds glyph widths so long
// names wrap and shrink to fit instead of running off the card.
import sharp from 'sharp'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { ogSources } = require('../lib/og.js'); const { plain } = require('../lib/seo.js');
const { fmt, time12, money } = require('../lib/util.js');
const cal = require('../src/_data/cal.js')();

const WD = JSON.parse(fs.readFileSync(new URL('./og-widths.json', import.meta.url), 'utf8'));
const W = (s, size, f = 'bold') => [...s].reduce((a, ch) => a + (WD[f][ch] ?? 0.7), 0) * size;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const SANS = 'DejaVu Sans, Arial, sans-serif', SERIF = 'DejaVu Serif, Georgia, serif', MONO = 'DejaVu Sans Mono, monospace';
const C = { bg1: '#0e3a57', bg2: '#071d2d', or: '#e8572e', orl: '#ff8a5c', cream: '#fff6ec', ink: '#0e2433', mu: '#a9c4d6', white: '#ffffff', gold: '#ffc857' };

// Greedy wrap by measured width; the first size whose wrap fits n lines wins, else ellipsis at the smallest.
function fit(text, w, n, sizes, f = 'serif') {
  const wrap = size => { const out = []; let l = ''; for (const word of text.split(/\s+/)) { const t = l ? l + ' ' + word : word; if (W(t, size, f) <= w || !l) l = t; else { out.push(l); l = word; } } out.push(l); return out; };
  for (const size of sizes) { const lines = wrap(size); if (lines.length <= n && lines.every(x => W(x, size, f) <= w)) return { size, lines }; }
  const size = sizes[sizes.length - 1], out = wrap(size), keep = out.slice(0, n);
  let last = keep[keep.length - 1];
  if (out.length > n || W(last, size, f) > w) { while (last && W(last + '…', size, f) > w) last = last.slice(0, -1); keep[keep.length - 1] = last.replace(/[\s,:;•·–-]+$/, '') + '…'; }
  return { size, lines: keep };
}
const clip = (s, size, w, f = 'bold') => { if (W(s, size, f) <= w) return s; while (s && W(s + '…', size, f) > w) s = s.slice(0, -1); return s.trimEnd() + '…'; };
const txt = (x, y, s, size, fill, o = {}) => `<text x="${x}" y="${y}" font-family="${o.ff || SANS}" font-weight="${o.fw || 700}" font-size="${size}" fill="${fill}"${o.anchor ? ` text-anchor="${o.anchor}"` : ''}${o.ls ? ` letter-spacing="${o.ls}"` : ''}>${o.raw ? s : esc(s)}</text>`;
// A pill: returns [svg, width].
function pill(x, y, label, o = {}) {
  const size = o.size || 26, f = o.f || 'bold', w = Math.ceil(W(label, size, f)) + 2 * (o.pad || 20), h = o.h || 50;
  return [`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${o.bg || 'none'}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="2"` : ''}/>` + txt(x + w / 2, y + h / 2 + size * 0.36, label, size, o.fg || C.white, { anchor: 'middle', ff: f === 'mono' ? MONO : SANS }), w];
}
// The site's pin mark, recoloured for a dark background.
const pin = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M32 5C19.8 5 10 14.6 10 26.6c0 15.8 18.8 30.8 20.2 31.8 1 .8 2.6.8 3.6 0C35.2 57.4 54 42.4 54 26.6 54 14.6 44.2 5 32 5z" fill="${C.or}"/><rect x="19" y="16" width="26" height="20" rx="4" fill="#fff"/><rect x="19" y="16" width="26" height="6.5" rx="3" fill="${C.ink}"/></g>`;
const dot = (x, y, s = 0.42) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M32 5C19.8 5 10 14.6 10 26.6c0 15.8 18.8 30.8 20.2 31.8 1 .8 2.6.8 3.6 0C35.2 57.4 54 42.4 54 26.6 54 14.6 44.2 5 32 5z" fill="${C.orl}"/><circle cx="32" cy="26" r="8" fill="${C.bg2}"/></g>`;

function frame(body, right = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.bg1}"/><stop offset="1" stop-color="${C.bg2}"/></linearGradient></defs>
<rect width="1200" height="630" fill="url(#g)"/>
<path d="M760 560 C 880 470, 820 380, 960 330 S 1120 230, 1060 120 S 1180 40, 1230 20" fill="none" stroke="#ffffff" stroke-opacity=".07" stroke-width="16" stroke-linecap="round" stroke-dasharray="2 34"/>
<rect width="1200" height="10" fill="${C.or}"/><rect y="10" width="1200" height="4" fill="${C.gold}"/>
${pin(70, 34, 0.9)}${txt(134, 82, 'Races <tspan fill="' + C.orl + '">Near</tspan>', 34, C.white, { raw: true })}
${right ? txt(1120, 80, right, 22, C.mu, { anchor: 'end', ff: MONO, ls: 2 }) : ''}
${body}
<rect y="546" width="1200" height="84" fill="#051521"/><rect y="546" width="1200" height="3" fill="${C.or}"/>
${txt(80, 598, 'racesnear.com', 28, C.white)}${txt(1120, 597, '5Ks to marathons · early-bird deadlines', 21, C.mu, { anchor: 'end', ff: MONO, fw: 400 })}</svg>`;
}

// "Price goes up Oct 25 → $60" only when every distance rises that day (or there is one distance);
// otherwise name what rises: "5K price goes up…", "5K & 10K price goes up…", "3 distances: price goes up…".
// Older data has no events/all fields: then only the one named event is known to rise.
function riseLabel(r, inc, maxW) {
  const labels = [...new Set(r.distances.map(q => q.label))];
  const evs = inc.events || [{ event: inc.event, to: inc.to }];
  const all = labels.length <= 1 || (inc.all ?? labels.every(l => evs.some(e => e.event === l)));
  const tos = [...new Set(evs.map(e => e.to))], day = fmt(inc.date, { month: 'short', day: 'numeric' });
  const what = all ? '' : evs.length === 1 ? evs[0].event : evs.length === 2 ? `${evs[0].event} & ${evs[1].event}` : `${evs.length} distances:`;
  const head = what ? `${what} price goes up ${day}` : `Price goes up ${day}`;
  const fits = t => W(t, 26) + 44 <= maxW;
  const full = tos.length === 1 && tos[0] ? `${head} → ${money(tos[0])}` : head;
  if (fits(full)) return full;
  if (fits(head)) return head;
  return clip(head, 26, maxW - 44);
}

// Race page: date tile | kicker, name, city, distance chips; price row below.
function raceCard(r, m) {
  const d = o => fmt(r.date, o);
  let s = '';
  // date tile
  s += `<rect x="80" y="140" width="190" height="236" rx="18" fill="${C.cream}"/><path d="M80 158a18 18 0 0 1 18-18h154a18 18 0 0 1 18 18v38H80z" fill="${C.or}"/>`;
  s += txt(175, 180, d({ weekday: 'short' }).toUpperCase(), 28, C.white, { anchor: 'middle', ls: 3 });
  s += txt(175, 302, d({ day: 'numeric' }), 110, C.ink, { anchor: 'middle' });
  s += txt(175, 350, (d({ month: 'short' }) + ' ' + d({ year: 'numeric' })).toUpperCase(), 26, C.or, { anchor: 'middle', ff: MONO, ls: 2 });
  const X = 316, RW = 1120 - X;
  const kick = d({ weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase() + (r.start ? ' · ' + time12(r.start) : '');
  s += txt(X, 160, clip(kick, 24, RW, 'mono'), 24, C.gold, { ff: MONO, ls: 2 });
  // name: 2 big lines, else 3 smaller; sizes keep the chips above the price row (y 448)
  const name = r.name.replace(/\s+/g, ' ').trim();
  let t = fit(name, RW, 2, [66, 60, 54]);
  if (t.lines.length > 2 || W(t.lines[t.lines.length - 1], t.size, 'serif') > RW || t.lines.some(l => l.endsWith('…'))) t = fit(name, RW, 3, [46, 42, 38]);
  const lh = Math.round(t.size * 1.1); let y = 176 + t.size;
  s += `<text font-family="${SERIF}" font-weight="700" font-size="${t.size}" fill="${C.white}">` + t.lines.map((l, i) => `<tspan x="${X}" y="${y + i * lh}">${esc(l)}</tspan>`).join('') + '</text>';
  y += (t.lines.length - 1) * lh + 46;
  const place = r.city && r.city !== m.short && !m.name.includes(r.city) ? `${r.city} · ${m.name}` : (r.city || m.name);
  s += dot(X - 4, y - 24) + txt(X + 26, y, clip(place, 28, RW - 30), 28, C.mu);
  // distance chips, one row, "+N" if they do not all fit
  y += 18; let x = X; const ds = [...new Set(r.distances.map(q => q.label))];
  for (let i = 0; i < ds.length; i++) {
    const rest = ds.length - i - 1, more = rest ? pill(0, 0, `+${rest}`, { size: 22, h: 44, pad: 16 })[1] + 10 : 0;
    const [p, w] = pill(x, y, ds[i], { size: 22, h: 44, pad: 18, bg: '#ffffff14', stroke: '#ffffff40' });
    if (x + w + more > 1120) { s += pill(x, y, `+${ds.length - i}`, { size: 22, h: 44, pad: 16, fg: C.mu, stroke: '#ffffff30' })[0]; break; }
    s += p; x += w + 10;
  }
  // price row
  const today = cal.today; let px = 80; const PY = 448;
  if (r.priceFrom != null) {
    const pr = money(r.priceFrom) + (r.priceTo != null && r.priceTo !== r.priceFrom ? '–' + money(r.priceTo) : '');
    const [p, w] = pill(px, PY, 'FROM ' + pr, { size: 32, h: 70, pad: 28, bg: C.gold, fg: C.ink }); s += p; px += w + 18;
  }
  const inc = r.nextIncrease && r.nextIncrease.date >= today ? r.nextIncrease : null;
  if (inc) {
    s += pill(px, PY + 8, riseLabel(r, inc, 1120 - px), { size: 26, h: 54, pad: 22, bg: C.or })[0];
  } else if (r.open) s += pill(px, PY + 8, 'Registration open', { size: 26, h: 54, pad: 22, stroke: C.orl, fg: C.orl })[0];
  else if (r.priceFrom == null) s += txt(80, PY + 50, 'Distances, start time and registration link inside', 26, C.mu, { fw: 400 });
  return frame(s, m.name.toUpperCase());
}

// Headline card: kicker, H1 (2 big lines, else 3), a hook line, optional chips and a NEXT UP strip.
function headCard({ kicker, title, hook, chips = [], next, right }) {
  let s = txt(80, 168, kicker, 24, C.gold, { ff: MONO, ls: 3 });
  let t = fit(title, 1040, 2, [74, 66, 60]);
  if (t.lines.some(l => l.endsWith('…'))) t = fit(title, 1040, 3, [58, 50, 44]);
  const lh = Math.round(t.size * 1.1); let y = 186 + t.size;
  s += `<text font-family="${SERIF}" font-weight="700" font-size="${t.size}" fill="${C.white}">` + t.lines.map((l, i) => `<tspan x="80" y="${y + i * lh}">${esc(l)}</tspan>`).join('') + '</text>';
  y += (t.lines.length - 1) * lh;
  const bottom = next ? 440 : 530;
  if (hook && y + 56 <= bottom - (chips.length ? 64 : 0)) { y += 56; const h = fit(hook, 1040, 1, [30, 27, 24], 'sans'); s += txt(80, y, h.lines[0], h.size, C.mu, { fw: 400 }); }
  if (chips.length && y + 74 <= bottom) { y += 28; let x = 80; for (const c of chips) { const [p, w] = pill(x, y, c, { size: 24, h: 46, pad: 20, bg: '#ffffff14', stroke: '#ffffff40' }); if (x + w > 1120) break; s += p; x += w + 12; } }
  if (next) {
    s += `<rect x="80" y="452" width="1040" height="70" rx="14" fill="#ffffff10" stroke="#ffffff26"/>` + txt(108, 497, 'NEXT UP', 22, C.gold, { ff: MONO, ls: 2 });
    const when = fmt(next.date, { weekday: 'short', month: 'short', day: 'numeric' });
    s += txt(1092, 498, when, 26, C.orl, { anchor: 'end' });
    s += txt(240, 498, clip(next.name, 26, 1092 - 240 - W(when, 26) - 30), 26, C.white);
  }
  return frame(s, right);
}

const LABEL = { default: 'RACE CALENDAR · 10 US CITIES', upcoming: 'NEXT 3 MONTHS', 'this-weekend': 'THIS WEEKEND', 'price-increases': 'EARLY-BIRD DEADLINES', guides: 'RACE GUIDES', about: 'ABOUT', advertise: 'ADVERTISE', newsletter: 'FREE WEEKLY EMAIL' };
const page = u => { const f = path.join('_site', u, 'index.html'); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null; };
const h1 = html => { const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/); return m ? plain(m[1]) : null; };
const first = html => { const m = html.match(/<meta name="description" content="([^"]*)"/); if (!m) return null; const d = plain(m[1].replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"')); return (d.match(/^.+?[.!?](?=\s|$)/) || [d])[0]; };

function svgFor(key, u) {
  if (key.startsWith('race-')) return null;
  const html = page(u); if (!html) return null;
  const title = key === 'default' ? 'Upcoming races near you, before the price goes up.' : h1(html); if (!title) return null;
  const M = cal.metros[key];
  if (M) {
    const nx = (M.weekend[0] || M.next30[0] || M.next90[0]);
    return headCard({ kicker: `RACE CALENDAR · ${M.state}`, title, hook: first(html), chips: [`${M.next90.length} races in the next 90 days`, `${M.early.length} early-bird deadlines`], next: nx, right: M.name.toUpperCase() });
  }
  const kicker = LABEL[key] || (key.startsWith('guide-') ? 'RACE GUIDE' : key.startsWith('tool-') ? 'FREE TOOL · PACE CALCULATOR' : 'RACE CALENDAR · 2026-27');
  const CHIPS = { default: [`${cal.total} upcoming races`, '10 US metros', 'Free weekly email'], 'this-weekend': [`${cal.allWeekend.length} races this weekend`, '10 US metros'], upcoming: [`${cal.allNext90.length} races in the next 90 days`], 'price-increases': [`${cal.allEarly.length} early-bird deadlines`, 'Sign up before the price goes up'] };
  return headCard({ kicker, title, hook: first(html), chips: CHIPS[key] || [] });
}

const jobs = Object.entries(ogSources()).map(([k, u]) => [k, () => svgFor(k, u)]);
for (const d of fs.readdirSync('src/guides')) if (/\.(njk|md)$/.test(d) && d !== 'index.njk') { const pl = (fs.readFileSync('src/guides/' + d, 'utf8').match(/permalink:\s*"?([^"\n]+)/) || [])[1]; if (pl) { const k = 'guide-' + pl.split('/').filter(Boolean)[1]; jobs.push([k, () => svgFor(k, pl.trim())]); } }
for (const { race, metro } of cal.racePages) jobs.push([`race-${metro.slug}-${race.slug}`, () => raceCard(race, cal.metros[metro.slug] || metro)]);

export { raceCard, headCard, svgFor, riseLabel };
if (import.meta.url === `file://${process.argv[1]}`) {
  const t0 = Date.now(); fs.mkdirSync('_site/og', { recursive: true });
  let n = 0, bytes = 0;
  for (let i = 0; i < jobs.length; i += 16) await Promise.all(jobs.slice(i, i + 16).map(async ([key, mk]) => {
    const svg = mk(); if (!svg) return;
    const out = `_site/og/${key}.png`; await sharp(Buffer.from(svg)).png({ palette: true, compressionLevel: 9 }).toFile(out); n++; bytes += fs.statSync(out).size;
  }));
  await sharp(Buffer.from(fs.readFileSync('src/favicon.svg'))).resize(512, 512).png().toFile('_site/logo.png');
  console.log(`og images: ${n}, ${(bytes / 1048576).toFixed(1)} MB, ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
