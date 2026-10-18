// Which share image a URL uses: one per team page, one per section, default for the rest.
const teams = require('../src/_data/teams.json');
const SECTIONS = ['tonight', 'teams', 'blackouts', 'which-night', 'moved', 'about', 'advertise', 'contact', 'privacy'];
const slugs = new Set(teams.map(t => t.slug));
function ogKey(url) {
  const s = (url || '/').split('/').filter(Boolean);
  if (s[0] === 'teams' && slugs.has(s[1])) return 'team-' + s[1];
  return SECTIONS.includes(s[0]) ? s[0] : 'default';
}
module.exports = { ogKey, SECTIONS };
