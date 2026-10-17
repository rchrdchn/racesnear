const u = require('./lib/util.js');
const site = require('./src/_data/site.json');
const metros = require('./src/_data/metros.json');
const MB = Object.fromEntries(metros.map(m => [m.slug, m]));
module.exports = function (c) {
  c.addPassthroughCopy({ 'src/assets': 'assets' });
  ['favicon.svg', '_headers', 'site.webmanifest'].forEach(f => c.addPassthroughCopy('src/' + f));
  c.addPassthroughCopy('src/*.txt');
  c.addGlobalData('build', () => ({ v: Date.now().toString(36), year: new Date().getFullYear(), now: new Date().toISOString() }));
  c.addFilter('json', v => JSON.stringify(v).replace(/</g, '\\u003c'));
  c.addFilter('long', s => u.fmt(s, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
  c.addFilter('md', s => u.fmt(s, { month: 'long', day: 'numeric' }));
  c.addFilter('mds', s => u.fmt(s, { month: 'short', day: 'numeric' }));
  c.addFilter('wd', s => u.fmt(s, { weekday: 'short' }));
  c.addFilter('wdl', s => u.fmt(s, { weekday: 'long' }));
  c.addFilter('mon', s => u.fmt(s, { month: 'short' }));
  c.addFilter('day', s => +s.slice(8));
  c.addFilter('t12', u.time12);
  c.addFilter('money', u.money);
  c.addFilter('metro', s => MB[s]);
  c.addFilter('regionName', (r) => (MB[r.metro].regions.find(g => g.slug === r.region) || {}).name || '');
  c.addFilter('raceUrl', r => `/${r.metro}/races/${r.slug}/`);
  // RunSignup affiliate tagging: only runsignup.com URLs get aflt_token (never official race sites, Race Roster, etc.).
  const isRS = url => { try { return /(^|\.)runsignup\.com$/i.test(new URL(url).hostname); } catch { return false; } };
  const aff = url => { if (!url || !site.runsignupAffiliateToken || !isRS(url) || /[?&]aflt_token=/.test(url)) return url; const [u, h] = url.split('#'); return u + (u.includes('?') ? '&' : '?') + 'aflt_token=' + encodeURIComponent(site.runsignupAffiliateToken) + (h ? '#' + h : ''); };
  c.addFilter('affUrl', aff);
  c.addFilter('affRel', (url, base = 'noopener') => site.runsignupAffiliateToken && isRS(url) ? 'sponsored noopener' : base);
  c.addFilter('regUrl', r => aff(r.url));
  c.addFilter('regRel', r => site.runsignupAffiliateToken && isRS(r.url) ? 'sponsored noopener' : 'noopener');
  c.addFilter('nlUrl', slug => site.newsletterUrl ? site.newsletterUrl + (site.newsletterUrl.includes('?') ? '&' : '?') + 'utm_source=site&utm_campaign=' + (slug || 'all') : '/newsletter/' + (slug ? '#' + slug : ''));
  c.addFilter('distList', r => r.distances.map(d => d.label).join(', '));
  c.addFilter('daysUntil', (s, today) => Math.round((u.D(s) - u.D(today)) / 864e5));
  c.addFilter('tc', s => String(s).replace(/(^|\s)([a-z])/g, (x, a, b) => a + b.toUpperCase()));
  c.addFilter('limit', (a, n) => (a || []).slice(0, n));
  c.addFilter('where', (a, k, v) => (a || []).filter(x => x[k] === v));
  c.addFilter('sitemapPages', ps => ps.filter(p => p.url && p.url.endsWith('/') && !p.data.noindex).sort((a, b) => a.url === '/' ? -1 : b.url === '/' ? 1 : a.url.localeCompare(b.url)));
  c.addFilter('isoDate', d => new Date(d).toISOString().slice(0, 10));
  c.addFilter('eventLd', (r) => {
    const m = MB[r.metro], off = u.tzOffset(r.date, r.start, m.tz);
    const ld = { '@context': 'https://schema.org', '@type': 'Event', name: r.name, startDate: r.start ? `${r.date}T${r.start}:00${off}` : r.date, endDate: r.endDate || r.date,
      eventStatus: 'https://schema.org/EventScheduled', eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode', sport: 'Running',
      location: { '@type': 'Place', name: r.street || r.city, address: { '@type': 'PostalAddress', streetAddress: r.street || undefined, addressLocality: r.city, postalCode: r.zip || undefined, addressRegion: r.state || m.state, addressCountry: 'US' } },
      url: `${site.url}/${r.metro}/races/${r.slug}/`, description: r.summary || `${r.name}: ${r.distances.map(d => d.label).join(', ')} in ${r.city}.` };
    if (r.logo) ld.image = [r.logo];
    if (r.priceFrom != null) ld.offers = { '@type': 'AggregateOffer', priceCurrency: 'USD', lowPrice: r.priceFrom, highPrice: r.priceTo || r.priceFrom, url: aff(r.url), availability: r.open ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut', validFrom: r.regOpen || undefined };
    else ld.offers = { '@type': 'Offer', url: aff(r.url), availability: r.open ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut' };
    ld.organizer = { '@type': 'Organization', name: r.name, url: r.website || r.url };
    return ld;
  });
  c.addShortcode('emailOptions', (subject = '', label = 'Email us') => {
    const to = site.email, e = encodeURIComponent, q = s => s.replace(/&/g, '&amp;');
    const mailto = `mailto:${to}${subject ? `?subject=${e(subject)}` : ''}`;
    const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${e(to)}${subject ? `&su=${e(subject)}` : ''}`;
    const outlook = `https://outlook.office.com/mail/deeplink/compose?to=${e(to)}${subject ? `&subject=${e(subject)}` : ''}`;
    return `<div class="emo"><p class="emobtns"><a class="btn" href="${q(mailto)}">${label}</a><button type="button" class="btn2 ecopy" data-email="${to}">Copy email</button></p>`
      + `<p class="emoalt"><span class="emaddr">${to}</span><span class="emweb">No mail app? <a href="${q(gmail)}" target="_blank" rel="noopener">Open in Gmail</a> · <a href="${q(outlook)}" target="_blank" rel="noopener">Open in Outlook</a></span></p></div>`;
  });
  return { dir: { input: 'src', includes: '_includes', data: '_data', output: '_site' }, templateFormats: ['njk', 'md'], markdownTemplateEngine: 'njk', htmlTemplateEngine: 'njk' };
};
