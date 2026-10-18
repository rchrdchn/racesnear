// Everything the templates need, computed once per build from races.json + metros.json.
const { ymd, addDays, weekend, MONTHS, DISTS, D } = require('../../lib/util.js');
const data = require('./races.json');
const metros = require('./metros.json');
const { cutName } = require('../../lib/seo.js');
const { fmt } = require('../../lib/util.js');
module.exports = () => {
  const today = ymd(new Date());
  const [wkS, wkE] = weekend(today), in30 = addDays(today, 30), in21 = addDays(today, 21), in90 = addDays(today, 90);
  const year = +today.slice(0, 4), seasonYears = `${year}-${String(year + 1).slice(2)}`;
  // Next occurrence of each season (the current one if it is still running), in calendar order.
  const SEAS = [['winter', 'Winter', 11, 1], ['spring', 'Spring', 2, 4], ['summer', 'Summer', 5, 7], ['fall', 'Fall', 8, 10]];
  const seasons = SEAS.map(([slug, name, m0, m1]) => {
    for (const y of [year - 1, year, year + 1]) {
      const s = new Date(Date.UTC(y, m0, 1)), e = new Date(Date.UTC(m0 > m1 ? y + 1 : y, m1 + 1, 0));
      const start = s.toISOString().slice(0, 10), end = e.toISOString().slice(0, 10);
      if (end >= today) return { slug, name, start, end, label: m0 > m1 ? `${y}-${String(y + 1).slice(2)}` : String(y), months: m0 > m1 ? 'December to February' : `${MONTHS[m0][0].toUpperCase() + MONTHS[m0].slice(1)} to ${MONTHS[m1][0].toUpperCase() + MONTHS[m1].slice(1)}` };
    }
  }).sort((a, b) => a.start.localeCompare(b.start));
  const NEAR = { nyc: 'NYC', 'bay-area': 'the Bay Area', 'washington-dc': 'DC', 'denver-boulder': 'Denver', 'los-angeles': 'Los Angeles' };
  const up = data.races.filter(r => r.date >= today).sort((a, b) => a.date.localeCompare(b.date) || (a.start || '99').localeCompare(b.start || '99') || a.name.localeCompare(b.name));
  // Race page titles: "{Name} {Year}: Date, Price, Registration". When the same name repeats in a year
  // (several dates or cities), the title carries the date, then the city, so every title is unique.
  { const k1 = r => cutName(r.name, 45).toLowerCase() + '|' + r.date.slice(0, 4), k2 = r => cutName(r.name, 45).toLowerCase() + '|' + r.date, c1 = {}, c2 = {};
    for (const r of up) { c1[k1(r)] = (c1[k1(r)] || 0) + 1; c2[k2(r)] = (c2[k2(r)] || 0) + 1; }
    for (const r of up) { const nm = cutName(r.name, 45), dt = fmt(r.date, { month: 'short', day: 'numeric', year: 'numeric' });
      r.titleTag = c1[k1(r)] === 1 ? `${nm} ${r.date.slice(0, 4)}: Date, Price, Registration | Races Near` : c2[k2(r)] === 1 ? `${nm}, ${dt}: Date, Price, Registration` : null; }
    // Same name and date (two listings): short name + date + area, then start time, then a counter.
    const rest = up.filter(r => !r.titleTag), seen = {};
    for (const r of rest) { const m = metros.find(x => x.slug === r.metro), g = (m.regions.find(x => x.slug === r.region) || {}).name || r.city;
      const dt = fmt(r.date, { month: 'short', day: 'numeric', year: 'numeric' }); let t = `${cutName(r.name, 36)}, ${dt}, ${g}`;
      if (seen[t]) t = `${cutName(r.name, 36)}, ${dt}${r.start ? ', ' + require('../../lib/util.js').time12(r.start) : ''} (${g})`;
      if (seen[t]) t += ` #${seen[t] + 1}`;
      seen[t] = (seen[t] || 0) + 1; r.titleTag = t; } }
  const M = {}, regionPages = [], distPages = [], monthPages = [], racePages = [], seasonPages = [];
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
    const near = NEAR[m.slug] || m.name;
    const mseasons = [];
    for (const se of seasons) {
      const list = rs.filter(r => r.date >= se.start && r.date <= se.end);
      if (!list.length) continue;
      const sd = DISTS.map(d => ({ ...d, count: list.filter(r => r.cats.includes(d.cat)).length })).filter(d => d.count >= 2);
      mseasons.push({ ...se, count: list.length, dists: sd });
      seasonPages.push({ metro: { ...m, near }, season: se, dist: null, races: list, dists: sd });
      for (const d of sd) seasonPages.push({ metro: { ...m, near }, season: se, dist: d, races: list.filter(r => r.cats.includes(d.cat)), dists: sd });
    }
    M[m.slug] = { ...m, near, all: rs, next90: rs.filter(r => r.date <= in90), seasons: mseasons, count: rs.length, weekend: rs.filter(r => r.date >= wkS && r.date <= wkE), next30: rs.filter(r => r.date <= in30), early, regions, dists, months };
    for (const g of regions) regionPages.push({ metro: m, region: g, races: rs.filter(r => r.region === g.slug), dists: DISTS.filter(d => rs.some(r => r.region === g.slug && r.cats.includes(d.cat))) });
    for (const d of dists) {
      const list = rs.filter(r => r.cats.includes(d.cat));
      const sub = m.regions.map(g => ({ ...g, count: list.filter(r => r.region === g.slug).length })).filter(g => g.count);
      distPages.push({ metro: m, dist: d, region: null, races: list, subs: sub });
      for (const g of sub) distPages.push({ metro: m, dist: d, region: g, races: list.filter(r => r.region === g.slug), subs: sub });
    }
    for (const r of rs) racePages.push({ race: r, metro: m });
  }
  const allNext90 = up.filter(r => r.date <= in90);
  const siteMonths = [];
  for (let i = 0; i < 12; i++) {
    const d = D(today.slice(0, 8) + '01'); d.setUTCMonth(d.getUTCMonth() + i);
    const y = d.getUTCFullYear(), mo = d.getUTCMonth(), key = `${y}-${String(mo + 1).padStart(2, '0')}`;
    const list = up.filter(r => r.date.startsWith(key));
    if (list.length) siteMonths.push({ y, m: mo, key, name: MONTHS[mo][0].toUpperCase() + MONTHS[mo].slice(1), slug: `${MONTHS[mo]}-${y}`, races: list, count: list.length, in90: key <= in90.slice(0, 7) });
  }
  const allWeekend = up.filter(r => r.date >= wkS && r.date <= wkE);
  const allEarly = metros.flatMap(m => M[m.slug].early).sort((a, b) => a.nextIncrease.date.localeCompare(b.nextIncrease.date));
  const turkey = up.filter(r => /turkey|gobble|thanksgiving|pie run|run for pie/i.test(r.name) && r.date >= `${today.slice(0, 4)}-11-20` && r.date <= `${today.slice(0, 4)}-11-30`);
  const fallHalves = up.filter(r => r.metro === 'bay-area' && r.cats.includes('half') && r.date <= `${today.slice(0, 4)}-12-31`);
  const newYear = up.filter(r => r.date === `${+today.slice(0, 4) + 1}-01-01`);
  return { today, wkS, wkE, in30, in90, seasonYears, seasons, seasonPages, siteMonths, allNext90, updated: data.updated, total: up.length, metros: M, list: metros.map(m => M[m.slug]), regionPages, distPages, monthPages, racePages, allWeekend, allEarly, turkey, fallHalves, newYear, dists: DISTS, year };
};
