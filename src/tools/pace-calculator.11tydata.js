// Build-time data for /tools/pace-calculator/: FAQ answers, the no-JS pace chart and the
// "find a race" links all come from the same math (src/assets/pace.js) and race data the page uses.
const P = require('../assets/pace.js');
const site = require('../_data/site.json');
const D = Object.fromEntries(P.D.map(d => [d.id, d]));
const HUB = { '5k': '5k-races', '10k': '10k-races', half: 'half-marathons', marathon: 'marathons' };
const pace = (d, sec) => P.hms(P.solve(D[d].mi, sec).perMi);
const paceKm = (d, sec) => P.hms(P.solve(D[d].mi, sec).perKm);
module.exports = {
  eleventyComputed: {
    tool: d => {
      const hubs = Object.entries(HUB).map(([id, slug]) => {
        const cities = d.cal.list.map(m => { const x = m.dists.find(z => z.slug === slug); return x ? { slug: m.slug, name: m.name, short: m.short, n: x.count || 0 } : null; }).filter(Boolean);
        return { id, label: D[id].label, slug, cities, total: cities.reduce((t, c) => t + c.n, 0) };
      });
      // No-JS pace chart: 6:00 to 14:00 per mile, every 30 seconds.
      const chart = [];
      for (let s = 360; s <= 840; s += 30) chart.push({ mi: P.hms(s), km: P.hms(s / (1 / P.KM)), k5: P.hms(s * D['5k'].mi), k10: P.hms(s * D['10k'].mi), half: P.hms(s * D.half.mi, true), mar: P.hms(s * D.marathon.mi, true) });
      const ex = P.solve(D.marathon.mi, 14400);
      const example = { finish: '4:00:00', perMi: P.hms(ex.perMi), perKm: P.hms(ex.perKm), mph: ex.mph.toFixed(2), kph: ex.kph.toFixed(2),
        preds: P.D.map(x => ({ label: x.label, t: (r => P.hms(r, r >= 3600))(P.riegel(14400, D.marathon.mi, x.mi)), pace: P.hms(P.riegel(14400, D.marathon.mi, x.mi) / x.mi) })),
        splits: P.splits(D.marathon.mi, 14400, 'mi').map(r => ({ at: r.at, t: P.hms(r.t, true) })) };
      return { hubs, chart, example, dists: P.D.map(x => ({ id: x.id, label: x.label, mi: +x.mi.toFixed(4), km: +x.km.toFixed(4) })) };
    },
    hub: d => {
      const halves = (d.cal.list || []).reduce((t, m) => { const x = m.dists.find(z => z.slug === 'half-marathons'); return t + (x ? x.count || 0 : 0); }, 0);
      const faq = [
        { q: 'What pace do I need for a 4 hour marathon?', a: `A 4:00:00 marathon is ${pace('marathon', 14400)} per mile, or ${paceKm('marathon', 14400)} per kilometer, held for all 26.2 miles.` },
        { q: 'What pace is a sub 2 hour half marathon?', a: `To break 2:00:00 in a half marathon you need to average ${pace('half', 7200)} per mile (${paceKm('half', 7200)} per km) or faster.` },
        { q: 'What pace is a 30 minute 5K?', a: `A 30:00 5K is ${pace('5k', 1800)} per mile, or ${paceKm('5k', 1800)} per kilometer.` },
        { q: 'How accurate is the race time predictor?', a: `It uses the Riegel formula (T2 = T1 x (D2 / D1)^1.06), so treat it as an estimate. For example, a 30:00 5K predicts about ${P.hms(P.riegel(1800, D['5k'].mi, D.marathon.mi), true)} for a marathon, but longer races also depend on training volume, heat and hills.` },
        { q: 'Where can I find a half marathon near me?', a: `Races Near lists ${halves} upcoming half marathons across ${d.cal.list.length} US cities, with dates, prices and early-bird deadlines. Pick your city in the list on this page.` }
      ];
      return { faq, items: [], count: 0, intro: '' };
    },
    schema: d => ({ '@context': 'https://schema.org', '@type': 'WebApplication', '@id': site.url + d.page.url + '#app', name: 'Race pace calculator', url: site.url + d.page.url, applicationCategory: 'SportsApplication', operatingSystem: 'Any (web browser)', browserRequirements: 'Works without JavaScript as a pace chart; JavaScript adds the live calculator.', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, publisher: { '@id': site.url + '/#org' }, featureList: ['Pace per mile and per km from a goal time', 'Finish time from a pace', 'Mile and km split table', 'Race time predictions at other distances (Riegel formula)'] })
  }
};
