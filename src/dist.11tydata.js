const { hub } = require('../lib/hub.js');
module.exports = { eleventyComputed: { hub: d => { const p = d.p, w = p.region ? `in ${p.region.name}` : `near ${d.cal.metros[p.metro.slug].near}`; return hub({ cal: d.cal, races: p.races, where: w, what: p.dist.name.toLowerCase(), one: p.dist.one, scope: 'year' }); } } };
