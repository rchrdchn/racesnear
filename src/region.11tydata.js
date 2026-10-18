const { hub } = require('../lib/hub.js');
module.exports = { eleventyComputed: { hub: d => hub({ cal: d.cal, races: d.p.races, where: `in ${d.p.region.name}`, scope: 'year' }) } };
