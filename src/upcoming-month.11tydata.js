const { hub } = require('../lib/hub.js');
module.exports = { eleventyComputed: { hub: d => hub({ cal: d.cal, races: d.p.races, where: 'across our ten cities', scope: 'month', label: `${d.p.name} ${d.p.y}` }) } };
