const local = require('./_data/localTv.json');
const { safeBg, bestText } = require('../lib/color.js');
const faq = (t, l) => [
  { q: `What channel are ${t.name} games on in 2026-27?`, a: `Local ${t.name} games air on ${l.tv}. National games air on ESPN/ABC, NBC/Peacock or Prime Video instead.` },
  { q: `How can I stream the ${t.name} without cable?`, a: `${l.stream}.${l.dazn ? ' DAZN carries local games in the home market.' : ''}` },
  { q: `Can I watch the ${t.name} for free?`, a: l.free ? `Yes: ${l.free}. You need a TV antenna in the home market. National games on NBC and ABC are free with an antenna anywhere in the US.` : `No free local package has been announced. National games on NBC and ABC are free with an antenna anywhere in the US.` },
  { q: `Are ${t.name} games blacked out on League Pass?`, a: t.slug === 'raptors' ? `In the US, Raptors games that aren't on national TV are available on League Pass.` : `Yes, inside the team's home market, and for every national game. Outside the market, League Pass shows their non-national games.` },
  ...(l.fdsn ? [{ q: `Are the ${t.name} still on FanDuel Sports Network?`, a: `No. FanDuel Sports Network shut down after the 2025-26 season. The ${t.name} moved to ${l.short}.` }] : [])
];
module.exports = {
  layout: 'base.njk',
  pagination: { data: 'teams', size: 1, alias: 't', addAllPagesToCollections: true },
  permalink: d => `/teams/${d.t.slug}/`,
  eleventyComputed: {
    l: d => local[d.t.slug],
    faqs: d => faq(d.t, local[d.t.slug]),
    preTeam: d => d.t.slug,
    title: d => `How to Watch the ${d.t.full} (2026-27): TV & Streaming`,
    description: d => { const l = local[d.t.slug]; return `Where to watch the ${d.t.full} in 2026-27: ${l.tv.split(';')[0]}. Streaming: ${l.stream}. Next games, channels and League Pass blackouts.`; },
    teamStyle: d => { const c1 = safeBg(d.t.c1), c2 = d.t.c2; return `--c1:${c1};--c2:${c2};--on:#ffffff;--hiFg:${bestText(c2, [c1, '#0f1b2d', '#ffffff'])}`; }
  }
};
