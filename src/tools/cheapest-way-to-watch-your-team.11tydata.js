// Build-time data for /tools/cheapest-way-to-watch-your-team/. Sources: teams.json, localTv.json
// (each team's local channel and stream), schedule.json (which games are on national TV),
// zipMarkets.json (approximate home markets) and prices.json (checked prices only; anything without
// a checked price is shown as "price not in our data yet" and left out of totals).
const teams = require('../_data/teams.json');
const local = require('../_data/localTv.json');
const sched = require('../_data/schedule.json');
const zips = require('../_data/zipMarkets.json');
const prices = require('../_data/prices.json');
const site = require('../_data/site.json');
const P = prices.services;
const money = n => '$' + n.toFixed(2);
const list = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
const byAbbr = Object.fromEntries(teams.map(t => [t.abbr, t]));
const games = sched.games.filter(g => byAbbr[g.home] && byAbbr[g.away]);
const has = (g, ...n) => g.nat.some(x => n.includes(x));
function counts(abbr) {
  const gs = games.filter(g => g.home === abbr || g.away === abbr);
  const nbc = gs.filter(g => has(g, 'NBC', 'NBCSN', 'Peacock')), espn = gs.filter(g => has(g, 'ESPN', 'ABC', 'ESPN2') && !has(g, 'NBC', 'NBCSN', 'Peacock')), prime = gs.filter(g => has(g, 'Prime Video'));
  const ds = gs.map(g => g.date).sort(), a = new Date(ds[0]), b = new Date(ds[ds.length - 1]);
  return { total: gs.length, nbc: nbc.length, nbcOta: nbc.filter(g => has(g, 'NBC')).length, espn: espn.length, abc: espn.filter(g => has(g, 'ABC')).length, prime: prime.length, nbatv: gs.filter(g => has(g, 'NBA TV')).length,
    local: gs.length - nbc.length - espn.length - prime.length, months: (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + b.getUTCMonth() - a.getUTCMonth() + 1 };
}
const all = teams.map(t => ({ t, l: local[t.slug], c: counts(t.abbr) }));
const lg = (() => { const nbc = games.filter(g => has(g, 'NBC', 'NBCSN', 'Peacock')), espn = games.filter(g => has(g, 'ESPN', 'ABC', 'ESPN2') && !has(g, 'NBC', 'NBCSN', 'Peacock')); return { nbc: nbc.length, nbcOta: nbc.filter(g => has(g, 'NBC')).length, espn: espn.length, abc: espn.filter(g => has(g, 'ABC')).length, prime: games.filter(g => has(g, 'Prime Video')).length }; })();
const months = Math.max(...all.map(x => x.c.months));
// Local stream price per team (from prices.local), used for the page table, intro range and FAQ.
const locRows = all.map(({ t, l }) => { const m = prices.local[t.slug] || {}, v = m.svc && P[m.svc]; return { slug: t.slug, full: t.full, row: l.row, ch: l.short, st: l.stream, svc: v ? v.name : '', p: v ? money(v.price) : '', a: v && v.annual != null ? money(v.annual) : '', src: v ? v.source : '', base: m.base ? P[m.base].name : '', free: !!m.free, lp: !!m.lp, raw: v ? v.price : null }; });
const locP = locRows.filter(r => r.raw != null).map(r => r.raw), locMin = money(Math.min(...locP)), locMax = money(Math.max(...locP));
module.exports = {
  eleventyComputed: {
    tool: () => ({
      json: { T: all.map(({ t, l, c }) => ({ s: t.slug, n: t.full, short: t.name, row: l.row, ch: l.short, tv: l.tv, st: l.stream, free: l.free || '', ok: l.status === 'verified', loc: prices.local[t.slug] || {}, c })),
        P: Object.fromEntries(Object.entries(P).map(([k, v]) => [k, { n: v.name, p: v.price, a: v.annual, al: v.annualLabel }])), Z: zips.map, d: prices.checked },
      teams: all.map(({ t, l, c }) => ({ slug: t.slug, full: t.full, name: t.name, ch: l.short, row: l.row, free: l.free, st: l.stream, c })),
      lg, months, checked: prices.checked, pk: money(P.peacock.price), pkA: money(P.peacock.annual), es: money(P['espn-unlimited'].price), esA: money(P['espn-unlimited'].annual),
      antenna: all.filter(x => x.l.row === 'antenna').map(x => x.t.name),
      pr: money(P.prime.price), prA: money(P.prime.annual), pv: money(P['prime-video'].price), lp: money(P['league-pass'].price), lpA: money(P['league-pass'].annual), lpp: money(P['league-pass-premium'].price), lppA: money(P['league-pass-premium'].annual), tp: money(P['team-pass'].price),
      src: Object.fromEntries(['peacock', 'espn-unlimited', 'prime', 'league-pass'].map(k => [k, P[k].source])), locRows, locMin, locMax, locN: locP.length
    }),
    faqs: () => {
      const ant = all.filter(x => x.l.row === 'antenna').map(x => x.t.name);
      return [
        { q: 'What is the cheapest way to watch NBA games in 2026-27?', a: `An antenna. ${ant.length} teams have free broadcast TV as their local home (${list(ant)}), and ${lg.nbcOta} NBC and ${lg.abc} ABC national games are free over the air too. Everything else needs a paid service.` },
        { q: 'How much is Peacock for NBA games?', a: `Peacock Premium is ${money(P.peacock.price)} a month or ${money(P.peacock.annual)} a year. It streams the ${lg.nbc} NBC, NBCSN and Peacock games on this season's schedule.` },
        { q: 'Do I need ESPN Unlimited to watch NBA games on ESPN?', a: `Yes, to stream them. ESPN Unlimited is ${money(P['espn-unlimited'].price)} a month or ${money(P['espn-unlimited'].annual)} a year and covers the ${lg.espn} ESPN and ABC games. The ${lg.abc} ABC games are also free with an antenna.` },
        { q: 'How many NBA games are on Prime Video?', a: `${lg.prime} games on this season's schedule are on Prime Video. They come with Amazon Prime, ${money(P.prime.price)} a month or ${money(P.prime.annual)} a year. (A standalone Prime Video membership is ${money(P['prime-video'].price)} a month, but Amazon's NBA help page says the games are for Prime members, so the calculator uses full Prime.)` },
        { q: 'How much does my team\'s local stream cost?', a: `In-market streams for ${locP.length} teams run from ${locMin} to ${locMax} a month, and most have a cheaper season pass. The NBC Sports networks for the Celtics, Warriors, Kings and 76ers are Peacock add-ons, so you pay for Peacock too. ${ant.length} teams also air their local games free over the air.` },
        { q: 'Can I watch my local NBA team on League Pass?', a: `No. League Pass (${money(P['league-pass'].price)} a month or ${money(P['league-pass'].annual)} a season) and Team Pass (${money(P['team-pass'].price)} a month) black out your home team's local games and every national game. Use the local channel or stream listed for your team instead, or see our blackout checker.` }
      ];
    },
    schema: d => ({ '@context': 'https://schema.org', '@type': 'WebApplication', '@id': site.url + d.page.url + '#app', name: 'Cheapest way to watch your NBA team', url: site.url + d.page.url, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any (web browser)', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, publisher: { '@id': site.url + '/#org' }, featureList: ['All 30 teams', 'Local channel or stream for your market', 'National games by network (NBC/Peacock, ESPN/ABC, Prime Video)', 'Monthly and season cost from checked prices, including local streams, League Pass and Prime'] })
  }
};
