// Post-build: 1200x630 share images -> _site/og/<key>.png (see lib/og.js), plus /logo.png for
// Organization schema. Same approach as the soccer site's generator: an SVG card rendered by sharp.
import sharp from 'sharp'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { ogSources } = require('../lib/og.js'); const { plain } = require('../lib/seo.js');
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const wrap = (t, n) => { const out = []; let l = ''; for (const w of t.split(' ')) { if ((l + ' ' + w).trim().length > n) { out.push(l); l = w; } else l = (l + ' ' + w).trim(); } out.push(l); return out; };
const pin = '<g transform="translate(80 64) scale(1.1)"><path d="M32 5C19.8 5 10 14.6 10 26.6c0 15.8 18.8 30.8 20.2 31.8 1 .8 2.6.8 3.6 0C35.2 57.4 54 42.4 54 26.6 54 14.6 44.2 5 32 5z" fill="#0b4a6f"/><rect x="19" y="16" width="26" height="20" rx="4" fill="#fff"/><rect x="19" y="16" width="26" height="6.5" rx="3" fill="#c2401e"/></g>';
function card(title, label) {
  let lines = wrap(title, 24), fs_ = 72; if (lines.length > 3) { fs_ = 56; lines = wrap(title, 32).slice(0, 4); }
  const tl = lines.map((l, i) => `<tspan x="80" dy="${i ? fs_ * 1.12 : 0}">${esc(l)}</tspan>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#f4f7f9"/><rect width="1200" height="12" fill="#c2401e"/>${pin}
<text x="170" y="118" font-family="DejaVu Sans, Arial, sans-serif" font-weight="700" font-size="30" fill="#0e2433">Races <tspan fill="#c2401e">Near</tspan></text>
<text x="80" y="222" font-family="DejaVu Sans Mono, monospace" font-weight="700" font-size="22" fill="#0b4a6f" letter-spacing="3">${esc(label)}</text>
<text x="80" y="${222 + 34 + fs_}" font-family="DejaVu Serif, Georgia, serif" font-weight="700" font-size="${fs_}" fill="#0e2433">${tl}</text>
<rect y="540" width="1200" height="90" fill="#0b4a6f"/><text x="80" y="595" font-family="DejaVu Sans, Arial, sans-serif" font-size="26" font-weight="700" fill="#ffffff">racesnear.com</text><text x="1120" y="595" text-anchor="end" font-family="DejaVu Sans Mono, monospace" font-size="20" fill="#d6e6f0">5Ks to marathons · early-bird deadlines</text></svg>`;
}
const LABEL = { default: 'RACE CALENDAR · 10 US CITIES', upcoming: 'NEXT 3 MONTHS', 'this-weekend': 'THIS WEEKEND', 'price-increases': 'EARLY-BIRD DEADLINES', guides: 'RACE GUIDES', about: 'ABOUT', advertise: 'ADVERTISE', newsletter: 'FREE WEEKLY EMAIL' };
const h1 = u => { const f = path.join('_site', u, 'index.html'); if (!fs.existsSync(f)) return null; const m = fs.readFileSync(f, 'utf8').match(/<h1[^>]*>([\s\S]*?)<\/h1>/); return m ? plain(m[1]) : null; };
const jobs = Object.entries(ogSources());
for (const d of fs.readdirSync('src/guides')) if (/\.(njk|md)$/.test(d) && d !== 'index.njk') { const pl = (fs.readFileSync('src/guides/' + d, 'utf8').match(/permalink:\s*"?([^"\n]+)/) || [])[1]; if (pl) jobs.push(['guide-' + pl.split('/').filter(Boolean)[1], pl.trim()]); }
fs.mkdirSync('_site/og', { recursive: true });
let n = 0;
for (const [key, u] of jobs) {
  const t = key === 'default' ? 'Upcoming races near you, before the price goes up.' : h1(u); if (!t) continue;
  const label = LABEL[key] || (key.startsWith('guide-') ? 'RACE GUIDE' : 'UPCOMING RACES');
  await sharp(Buffer.from(card(t, label))).png().toFile(`_site/og/${key}.png`); n++;
}
await sharp(Buffer.from(fs.readFileSync('src/favicon.svg'))).resize(512, 512).png().toFile('_site/logo.png');
console.log('og images:', n);
