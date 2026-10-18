const { hub } = require('../lib/hub.js');
module.exports = { eleventyComputed: { hub: d => hub({ cal: d.cal, races: d.p.races, where: `near ${d.cal.metros[d.p.metro.slug].near}`, scope: 'month', label: `${d.p.name} ${d.p.y}` }) } };
