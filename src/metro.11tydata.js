const { hub } = require('../lib/hub.js');
module.exports = { eleventyComputed: { hub: d => hub({ cal: d.cal, races: d.m.next90, where: `near ${d.m.near}`, scope: 'next90' }), faqTitle: d => `Races near ${d.m.near}: quick answers` } };
