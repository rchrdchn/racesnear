// Hub pages (city, distance, area, season, month, upcoming, weekend, deadlines): the answer-first
// intro sentence, a short FAQ and the ItemList, all generated from the same race list the page shows.
const u = require('./util.js');
const site = require('../src/_data/site.json');
const md = s => u.fmt(s, { month: 'long', day: 'numeric' });
const wmd = s => u.fmt(s, { weekday: 'long', month: 'long', day: 'numeric' });
const raceUrl = r => `/${r.metro}/races/${r.slug}/`;
const n = (k, one, many) => `${k} ${k === 1 ? one : many}`;
const is = k => (k === 1 ? 'is' : 'are');
const list3 = rs => { const names = rs.slice(0, 3).map(r => `${r.name} (${u.fmt(r.date, { weekday: 'short' })})`); return names.length < 3 ? names.join(' and ') : `${names[0]}, ${names[1]} and ${names[2]}`; };

// o: { cal, races, where ("near Boston"), what ("races"), one ("race"), scope: next90|year|month|weekend|early, label (month name), city (show city in "next" sentence) }
function hub(o) {
  const { cal, races = [], where, what = 'races', one = 'race', scope = 'year', label } = o;
  // Eleventy first calls computed data with placeholder values to map dependencies.
  if (!cal || typeof cal.today !== 'string' || !cal.today || !Array.isArray(races) || !races.every(r => r && typeof r.date === 'string')) return { intro: '', faq: [], items: [], count: 0 };
  const today = cal.today, in90 = cal.in90;
  const up = races.filter(r => r.date >= today);
  const n90 = up.filter(r => r.date <= in90);
  const next = up[0];
  const nextTxt = r => `${r.name} on ${wmd(r.date)} in ${r.city}`;
  let intro;
  if (scope === 'month') intro = up.length ? `${n(up.length, one, what)} ${is(up.length)} on the calendar ${where} in ${label}, starting with ${nextTxt(next)}.` : `No ${what} are listed ${where} in ${label} yet.`;
  else if (scope === 'weekend') intro = up.length ? `${n(up.length, one, what)} ${is(up.length)} on ${where} this weekend (${wmd(cal.wkS)}${cal.wkE !== cal.wkS ? ` and ${wmd(cal.wkE)}` : ''}); the first is ${nextTxt(next)}.` : `No ${what} are listed ${where} this weekend (${md(cal.wkS)}${cal.wkE !== cal.wkS ? ` to ${md(cal.wkE)}` : ''}) yet.`;
  else if (scope === 'early') { const e = races[0]; intro = e ? `${n(races.length, one, what)} raise their entry fee ${where} in the next three weeks; the first deadline is ${e.name} on ${md(e.nextIncrease.date)}.` : `No ${what} ${where} publish a price increase in the next three weeks.`; }
  else intro = n90.length ? `${n(n90.length, one, what)} ${is(n90.length)} coming up ${where} in the next 90 days; the next is ${nextTxt(next)}.` : next ? `No ${what} are listed ${where} in the next 90 days; the next is ${nextTxt(next)}.` : `No upcoming ${what} are listed ${where} yet.`;

  const faq = [];
  // 1. How many
  if (scope === 'month') faq.push({ q: `How many ${what} are ${where} in ${label}?`, a: up.length ? `${n(up.length, one, what)} ${is(up.length)} listed ${where} in ${label}. The first is ${nextTxt(next)}${up.length > 1 ? `, and the last is ${up[up.length - 1].name} on ${md(up[up.length - 1].date)}` : ''}.` : `None are listed yet. New races are added every night.` });
  else if (scope === 'weekend') faq.push({ q: `How many ${what} are ${where} this weekend?`, a: up.length ? `${n(up.length, one, what)}: ${list3(up)}${up.length > 3 ? `, plus ${up.length - 3} more` : ''}.` : `None are listed yet for ${md(cal.wkS)}${cal.wkE !== cal.wkS ? ` to ${md(cal.wkE)}` : ''}.` });
  else faq.push({ q: `How many ${what} are ${where} in the next 3 months?`, a: n90.length ? `${n(n90.length, one, what)} ${is(n90.length)} listed ${where} between ${md(today)} and ${md(in90)}. The next is ${nextTxt(next)}.` : `None are listed between ${md(today)} and ${md(in90)}.${next ? ` The next one after that is ${nextTxt(next)}.` : ''}` });
  // 2. Cheapest
  const pool = (scope === 'year' || scope === 'next90') ? n90 : up;
  const priced = pool.filter(r => r.priceFrom != null && r.priceFrom > 0).sort((a, b) => a.priceFrom - b.priceFrom || a.date.localeCompare(b.date));
  if (priced.length) { const c = priced[0]; faq.push({ q: `What is the cheapest ${one} ${where}${scope === 'month' ? ` in ${label}` : scope === 'weekend' ? ' this weekend' : ' right now'}?`, a: `${c.name} on ${md(c.date)} has the lowest listed entry fee${scope === 'year' || scope === 'next90' ? ' in the next 90 days' : ''}: ${u.money(c.priceFrom)}. Prices are before the registration platform's processing fee.` }); }
  // 3. Early-bird
  const eb = up.filter(r => r.nextIncrease && r.nextIncrease.date >= today && r.date > r.nextIncrease.date).sort((a, b) => a.nextIncrease.date.localeCompare(b.nextIncrease.date));
  if (scope !== 'early') faq.push({ q: `When does the next early-bird price end for ${what} ${where}?`, a: eb.length ? `${eb[0].name}: the ${eb[0].nextIncrease.event} goes from ${u.money(eb[0].nextIncrease.from)} to ${u.money(eb[0].nextIncrease.to)} after ${md(eb[0].nextIncrease.date)}.${eb.length > 1 ? ` ${eb.length - 1} more of these ${what} publish a later price increase.` : ''}` : `None of these ${what} publish an upcoming price increase. Check each race page for its full price schedule.` });
  else if (races.length) { const big = races.slice().sort((a, b) => (b.nextIncrease.to - b.nextIncrease.from) - (a.nextIncrease.to - a.nextIncrease.from))[0]; if (big) faq.push({ q: `Which race ${where} has the biggest price jump soon?`, a: `${big.name}: the ${big.nextIncrease.event} goes from ${u.money(big.nextIncrease.from)} to ${u.money(big.nextIncrease.to)} after ${md(big.nextIncrease.date)}.` }); }
  // 4. Weekend, or long races in the month
  if (scope === 'month') { const h = up.filter(r => r.cats.includes('half')), m = up.filter(r => r.cats.includes('marathon')); faq.push({ q: `Are there half marathons or marathons ${where} in ${label}?`, a: h.length || m.length ? `Yes: ${n(h.length, 'half marathon', 'half marathons')} and ${n(m.length, 'marathon', 'marathons')}.${(m[0] || h[0]) ? ` The first is ${(m[0] && (!h[0] || m[0].date <= h[0].date) ? m[0] : h[0]).name} on ${md((m[0] && (!h[0] || m[0].date <= h[0].date) ? m[0] : h[0]).date)}.` : ''}` : `No half marathons or marathons are listed ${where} in ${label} yet.` }); }
  else if (scope !== 'weekend' && scope !== 'early') { const wk = up.filter(r => r.date >= cal.wkS && r.date <= cal.wkE); faq.push({ q: `Are there ${what} ${where} this weekend?`, a: wk.length ? `Yes, ${wk.length}: ${list3(wk)}${wk.length > 3 ? `, plus ${wk.length - 3} more` : ''}.` : `None are listed for ${md(cal.wkS)}${cal.wkE !== cal.wkS ? ` to ${md(cal.wkE)}` : ''}.${next ? ` The next is ${nextTxt(next)}.` : ''}` }); }

  const items = (scope === 'next90' ? n90 : races).slice(0, 30).map((r, i) => ({ '@type': 'ListItem', position: i + 1, url: site.url + raceUrl(r), name: r.name }));
  return { intro, faq, items, count: races.length };
}
module.exports = { hub };
