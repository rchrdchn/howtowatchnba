// Compact data for the in-browser blackout checker: ZIP prefix map + per-team local options.
const zip = require('./_data/zipMarkets.json'), teams = require('./_data/teams.json'), local = require('./_data/localTv.json');
module.exports = class { data() { return { permalink: '/assets/markets.json', eleventyExcludeFromCollections: true }; }
  render() { return JSON.stringify({ map: zip.map, teams: Object.fromEntries(teams.map(t => { const l = local[t.slug]; return [t.slug, { n: t.name, f: t.full, c: t.c1, tv: l.tv, s: l.short, st: l.stream, fr: l.free, dz: l.dazn, row: l.row }]; })) }); } };
