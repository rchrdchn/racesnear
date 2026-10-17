// Everything the templates need, computed once per build from races.json + metros.json.
const { ymd, addDays, weekend, MONTHS, DISTS, D } = require('../../lib/util.js');
const data = require('./races.json');
const metros = require('./metros.json');
module.exports = () => {
  const today = ymd(new Date());
  const [wkS, wkE] = weekend(today), in30 = addDays(today, 30), in21 = addDays(today, 21);
  const up = data.races.filter(r => r.date >= today).sort((a, b) => a.date.localeCompare(b.date) || (a.start || '99').localeCompare(b.start || '99') || a.name.localeCompare(b.name));
  const M = {}, regionPages = [], distPages = [], monthPages = [], racePages = [];
  for (const m of metros) {
    const rs = up.filter(r => r.metro === m.slug);
    const regions = m.regions.map(g => ({ ...g, count: rs.filter(r => r.region === g.slug).length })).filter(g => g.count);
    const dists = DISTS.map(d => ({ ...d, count: rs.filter(r => r.cats.includes(d.cat)).length })).filter(d => d.count);
    const early = rs.filter(r => r.nextIncrease && r.nextIncrease.date >= today && r.nextIncrease.date <= in21 && r.date > r.nextIncrease.date).sort((a, b) => a.nextIncrease.date.localeCompare(b.nextIncrease.date) || a.date.localeCompare(b.date));
    const months = [];
    for (let i = 0; i < 12; i++) {
      const d = D(today.slice(0, 8) + '01'); d.setUTCMonth(d.getUTCMonth() + i);
      const y = d.getUTCFullYear(), mo = d.getUTCMonth(), key = `${y}-${String(mo + 1).padStart(2, '0')}`;
      const list = rs.filter(r => r.date.startsWith(key));
      if (list.length) { const mp = { metro: m, y, m: mo, key, name: MONTHS[mo][0].toUpperCase() + MONTHS[mo].slice(1), slug: MONTHS[mo], races: list }; months.push({ ...mp, races: undefined, count: list.length }); monthPages.push(mp); }
    }
    M[m.slug] = { ...m, all: rs, count: rs.length, weekend: rs.filter(r => r.date >= wkS && r.date <= wkE), next30: rs.filter(r => r.date <= in30), early, regions, dists, months };
    for (const g of regions) regionPages.push({ metro: m, region: g, races: rs.filter(r => r.region === g.slug), dists: DISTS.filter(d => rs.some(r => r.region === g.slug && r.cats.includes(d.cat))) });
    for (const d of dists) {
      const list = rs.filter(r => r.cats.includes(d.cat));
      const sub = m.regions.map(g => ({ ...g, count: list.filter(r => r.region === g.slug).length })).filter(g => g.count);
      distPages.push({ metro: m, dist: d, region: null, races: list, subs: sub });
      for (const g of sub) distPages.push({ metro: m, dist: d, region: g, races: list.filter(r => r.region === g.slug), subs: sub });
    }
    for (const r of rs) racePages.push({ race: r, metro: m });
  }
  const allWeekend = up.filter(r => r.date >= wkS && r.date <= wkE);
  const allEarly = metros.flatMap(m => M[m.slug].early).sort((a, b) => a.nextIncrease.date.localeCompare(b.nextIncrease.date));
  const turkey = up.filter(r => /turkey|gobble|thanksgiving|pie run|run for pie/i.test(r.name) && r.date >= `${today.slice(0, 4)}-11-20` && r.date <= `${today.slice(0, 4)}-11-30`);
  const fallHalves = up.filter(r => r.metro === 'bay-area' && r.cats.includes('half') && r.date <= `${today.slice(0, 4)}-12-31`);
  const newYear = up.filter(r => r.date === `${+today.slice(0, 4) + 1}-01-01`);
  return { today, wkS, wkE, in30, updated: data.updated, total: up.length, metros: M, list: metros.map(m => M[m.slug]), regionPages, distPages, monthPages, racePages, allWeekend, allEarly, turkey, fallHalves, newYear, dists: DISTS, year: +today.slice(0, 4) };
};
