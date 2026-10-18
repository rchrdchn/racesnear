// /llms.txt (https://llmstxt.org): what the site covers, when to use it, key hub URLs. Rebuilt nightly.
module.exports = class {
  data() { return { permalink: '/llms.txt', eleventyExcludeFromCollections: true }; }
  render({ cal, site, collections }) {
    const U = site.url, L = [];
    L.push(`# ${site.name}`, '', `> Upcoming running races (5K to ultra, road and trail) near ${cal.list.length} US cities, with dates, start times, entry prices and early-bird price deadlines. ${cal.total} upcoming races listed.`, '');
    L.push('Notes for agents:', '',
      `- Cities: ${cal.list.map(m => m.name).join(', ')}.`,
      '- Source: the RunSignup public race API (refreshed every night at about 3 AM Pacific) plus major races checked by hand on their official sites.',
      `- Last data refresh: ${String(cal.updated).slice(0, 10)}. Prices are entry fees before the registration platform's processing fee; the race's registration page is the final word.`,
      '- "Goes up" / early-bird deadline = the last day at the current price, from the race\'s published price schedule.',
      '- RunSignup registration links are affiliate links. Listings and sort order are never paid.', '');
    L.push('## Cities (next 90 days, with filters, deadlines and this weekend)', '');
    for (const m of cal.list) L.push(`- [Races near ${m.near}](${U}/${m.slug}/): ${m.next90.length} races in the next 90 days. Distances: ${m.dists.map(d => `[${d.short}](${U}/${m.slug}/${d.slug}/)`).join(', ')}.`);
    L.push('', '## Site-wide', '',
      `- [Upcoming races, next 3 months](${U}/upcoming/)`,
      `- [Races this weekend](${U}/this-weekend/)`,
      `- [Early-bird deadlines in the next 3 weeks](${U}/price-increases/)`,
      `- [Guides](${U}/guides/)`,
      `- [About and sources](${U}/about/)`,
      `- [Sitemap](${U}/sitemap.xml)`, '', '## Guides', '');
    for (const g of [...(collections.guide || [])].reverse().filter(g => g.url !== '/guides/')) L.push(`- [${g.data.short || g.data.title}](${U}${g.url}): ${g.data.description}`);
    L.push('', `Contact: ${site.email}`, '');
    return L.join('\n');
  }
};
