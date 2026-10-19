// /llms.txt (https://llmstxt.org): what the site covers, when to use it, every team's channel. Rebuilt nightly.
const tv = require('../lib/tv.js');
module.exports = class {
  data() { return { permalink: '/llms.txt', eleventyExcludeFromCollections: true }; }
  render({ site, teams, localTv }) {
    const U = site.url, L = [], n = tv.nextNight();
    L.push(`# ${site.name}`, '', `> Where every NBA team's games are on TV and streaming in the US for the ${site.season} season: local channels for all 30 teams, national TV by night, a League Pass blackout checker and tonight's games on one grid.`, '');
    L.push('Notes for agents:', '',
      "- Schedule and national TV come from ESPN's public scoreboard feed, refreshed every night at about 2:15 AM Pacific.",
      `- Local channels are checked by hand against team and station sources. Each team page shows its sources and last check date. Last local check: ${site.localChecked}.`,
      '- National exclusives (ESPN, ABC, NBC, Peacock, NBCSN, Prime Video) replace local TV and are blacked out on League Pass. NBA TV is not exclusive.',
      '- "Unconfirmed" on a page means we could not confirm that detail yet.', '');
    if (n.games.length) L.push(`## Next game night: ${n.label}`, '', ...n.games.map(g => `- ${g.a.full} at ${g.h.full}, ${g.et} ET: ${g.nat_ ? g.nat_.label + ' (national)' : 'local TV and League Pass'}`), '');
    L.push('## Teams (local TV home in ' + site.season + ')', '');
    for (const t of teams) { const l = localTv[t.slug]; L.push(`- [${t.full}](${U}/teams/${t.slug}/): ${l.tv}. Streaming: ${l.stream}.${l.fdsn ? ' Moved after FanDuel Sports Network shut down.' : ''}`); }
    L.push('', '## Hubs', '',
      `- [NBA games tonight on TV](${U}/tonight/)`, `- [All 30 teams](${U}/teams/)`, `- [Where every team moved](${U}/moved/)`,
      `- [National TV by night](${U}/which-night/)`, `- [League Pass blackout checker](${U}/blackouts/)`, `- [Cheapest way to watch your team](${U}/tools/cheapest-way-to-watch-your-team/): pick a team and market; lists the local channel or stream, national games by network (NBC/Peacock, ESPN/ABC, Prime Video) with game counts, and monthly and season cost from checked prices (each team's local stream, Peacock Premium, ESPN Unlimited, Amazon Prime, League Pass and Team Pass). Add ?team=<slug> (same slugs as /teams/).`, `- [About and sources](${U}/about/)`,
      `- [RSS: local TV checks](${U}/feed.xml)`, `- [Sitemap](${U}/sitemap.xml)`, '', `Contact and corrections: ${site.email}`, '');
    return L.join('\n');
  }
};
