// Which share image a URL uses: one per team page, one per news post, one per section, default for the rest.
const fs = require('node:fs'), path = require('node:path');
const teams = require('../src/_data/teams.json');
const SECTIONS = ['tonight', 'teams', 'blackouts', 'which-night', 'moved', 'guides', 'news', 'about', 'advertise', 'contact', 'privacy'];
const TOOLS = ['cheapest-way-to-watch-your-team'];
const slugs = new Set(teams.map(t => t.slug));
function ogKey(url) {
  const s = (url || '/').split('/').filter(Boolean);
  if (s[0] === 'teams' && slugs.has(s[1])) return 'team-' + s[1];
  if (s[0] === 'news' && s[1] && fs.existsSync(path.join(__dirname, '../src/news', s[1] + '.md'))) return 'news-' + s[1];
  if (s[0] === 'tools' && TOOLS.includes(s[1])) return 'tool-' + s[1];
  return SECTIONS.includes(s[0]) ? s[0] : 'default';
}
module.exports = { ogKey, SECTIONS, TOOLS };
