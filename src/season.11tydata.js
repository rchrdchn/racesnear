const { hub } = require('../lib/hub.js');
module.exports = { eleventyComputed: { hub: d => { const p = d.p; return hub({ cal: d.cal, races: p.races, where: `near ${p.metro.near}`, what: p.dist ? p.dist.name.toLowerCase() : 'races', one: p.dist ? p.dist.one : 'race', scope: 'month', label: `${p.season.name.toLowerCase()} ${p.season.label}` }); } } };
