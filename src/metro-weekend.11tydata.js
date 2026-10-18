const { hub } = require('../lib/hub.js');
module.exports = { eleventyComputed: { hub: d => hub({ cal: d.cal, races: d.m.weekend, where: `near ${d.m.near}`, scope: 'weekend' }) } };
