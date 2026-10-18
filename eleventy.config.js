const u = require('./lib/util.js');
const seo = require('./lib/seo.js');
const { ogKey } = require('./lib/og.js');
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
    ld.image = [r.logo, `${site.url}/og/${r.metro}.png`].filter(Boolean);
    if (r.priceFrom != null) ld.offers = { '@type': 'AggregateOffer', priceCurrency: 'USD', lowPrice: r.priceFrom, highPrice: r.priceTo || r.priceFrom, url: aff(r.url), availability: r.open ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut', validFrom: r.regOpen || undefined };
    else ld.offers = { '@type': 'Offer', url: aff(r.url), availability: r.open ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut' };
    ld.organizer = { '@type': 'Organization', name: r.name, url: r.website || r.url };
    return ld;
  });

  // SEO helpers shared with the soccer and NBA sites (lib/seo.js): decode once, fit to 65 / 160 chars.
  c.addFilter('seoTitle', s => seo.seoTitle(s));
  c.addFilter('seoDesc', s => seo.seoDesc(s));
  c.addFilter('ogImage', url => `${site.url}/og/${ogKey(url)}.png`);
  // Visible "Updated" date. scripts/postbuild.mjs fills it (and dateModified) from lastmod.json.
  c.addShortcode('updated', () => '<p class="upd">Updated <time datetime="__LASTMOD_ISO__">__LASTMOD__</time></p>');
  c.addFilter('xml', s => seo.plain(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
  c.addFilter('rfc822', d => new Date(typeof d === 'string' && d.length === 10 ? d + 'T12:00:00Z' : d).toUTCString());
  // One JSON-LD graph per page: Organization + WebSite (by @id), the page node with dateModified,
  // ItemList and FAQPage on hubs, Article on guides, AboutPage on /about/.
  c.addFilter('pageGraph', d => {
    const url = site.url + d.url, og = `${site.url}/og/${ogKey(d.url)}.png`;
    const org = { '@type': 'Organization', '@id': site.url + '/#org', name: site.name, url: site.url + '/', logo: { '@type': 'ImageObject', url: site.url + '/logo.png', width: 512, height: 512 }, email: site.email, description: site.tagline, sameAs: [site.newsletterUrl].filter(Boolean) };
    const web = { '@type': 'WebSite', '@id': site.url + '/#website', name: site.name, url: site.url + '/', publisher: { '@id': org['@id'] }, inLanguage: 'en-US' };
    const pg = { '@type': d.kind || (d.hub ? 'CollectionPage' : 'WebPage'), '@id': url + '#webpage', url, name: seo.seoTitle(d.title), description: seo.seoDesc(d.description), isPartOf: { '@id': web['@id'] }, inLanguage: 'en-US', primaryImageOfPage: { '@type': 'ImageObject', url: og }, dateModified: '__LASTMOD_ISO__' };
    if (d.kind === 'AboutPage') pg.about = { '@id': org['@id'] };
    if (d.hub && d.hub.items.length) pg.mainEntity = { '@type': 'ItemList', numberOfItems: d.hub.count, itemListElement: d.hub.items };
    const g = [org, web, pg];
    if (d.hub && d.hub.faq.length) g.push({ '@type': 'FAQPage', '@id': url + '#faq', mainEntity: d.hub.faq.map(x => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })) });
    if (d.article) g.push({ '@type': 'Article', '@id': url + '#article', headline: seo.seoTitle(d.title), description: seo.seoDesc(d.description), datePublished: new Date(d.date).toISOString().slice(0, 10), dateModified: '__LASTMOD_ISO__', author: { '@id': org['@id'] }, publisher: { '@id': org['@id'] }, image: og, mainEntityOfPage: { '@id': pg['@id'] } });
    return JSON.stringify({ '@context': 'https://schema.org', '@graph': g }).replace(/</g, '\\u003c');
  });
  // BreadcrumbList JSON-LD from the visible crumbs on every page (lib/seo.js).
  c.addTransform('crumbsLd', function (html) {
    if (!(this.page.outputPath || '').endsWith('.html')) return html;
    const ld = seo.crumbsLd(html, this.page.url, site.url);
    return ld ? html.replace('</head>', ld + '</head>') : html;
  });
  c.addShortcode('emailOptions', (subject = '', label = 'Email us') => {
    const to = site.email, e = encodeURIComponent, q = s => s.replace(/&/g, '&amp;');
    const mailto = `mailto:${to}${subject ? `?subject=${e(subject)}` : ''}`;
    const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${e(to)}${subject ? `&su=${e(subject)}` : ''}`;
    const outlook = `https://outlook.office.com/mail/deeplink/compose?to=${e(to)}${subject ? `&subject=${e(subject)}` : ''}`;
    return `<div class="emo"><p class="emobtns"><a class="btn" href="${q(mailto)}">${label}</a><button type="button" class="btn2 ecopy" data-email="${to}">Copy email</button></p>`
      + `<p class="emoalt"><span class="emaddr">${to}</span><span class="emweb">No mail app? <a href="${q(gmail)}" target="_blank" rel="noopener">Open in Gmail</a> · <a href="${q(outlook)}" target="_blank" rel="noopener">Open in Outlook</a></span></p></div>`;
  });
  return { dir: { input: 'src', includes: '_includes', data: '_data', output: '_site' }, templateFormats: ['njk', 'md', '11ty.js'], markdownTemplateEngine: 'njk', htmlTemplateEngine: 'njk' };
};
