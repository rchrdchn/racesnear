const { hub } = require('../lib/hub.js');
module.exports = { eleventyComputed: { hub: d => hub({ cal: d.cal, races: d.cal.allEarly, where: 'across our ten cities', scope: 'early' }) } };
