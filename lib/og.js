// Which 1200x630 share image a page uses: one per city (city hubs and race pages), one per guide,
// one per site-wide section, plus a default. Rendered by scripts/og.mjs after the build.
const metros = require('../src/_data/metros.json').map(m => m.slug);
const SECTIONS = ['upcoming', 'this-weekend', 'price-increases', 'guides', 'about', 'advertise', 'newsletter'];
function ogKey(url) {
  const s = url.split('/').filter(Boolean);
  if (!s.length) return 'default';
  if (metros.includes(s[0])) return s[0];
  if (s[0] === 'guides' && s[1]) return 'guide-' + s[1];
  if (SECTIONS.includes(s[0])) return s[0];
  return 'default';
}
// The page whose H1 becomes the image headline for each key.
function ogSources() {
  return { default: '/', ...Object.fromEntries(metros.map(m => [m, `/${m}/`])), ...Object.fromEntries(SECTIONS.map(s => [s, `/${s}/`])) };
}
module.exports = { ogKey, ogSources };
