// Data-driven FAQs, ItemLists and sports schema for the NBA site. FAQ answers come from the same
// schedule and local-TV data the page shows, so they stay current after every nightly refresh.
const tv = require('./tv.js');
const site = require('../src/_data/site.json');
const week = require('../src/_data/week.json');
const sched = require('../src/_data/schedule.json');
const U = site.url;
const list = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
const long = d => new Date(d).toLocaleDateString('en-US', { timeZone: 'America/New_York', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
const match = g => `${g.a.name} at ${g.h.name}`;
const teams = () => tv.teams.map(t => ({ t, l: tv.local[t.slug] }));

const etToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date(process.env.BUILD_NOW || Date.now()));
const when = n => n.day === etToday() ? 'tonight' : `on ${n.label}`;
function homeFaq() {
  const n = tv.nextNight(), nat = n.games.filter(g => g.nat_);
  const moved = teams().filter(x => x.l.fdsn).map(x => x.t.name), ant = teams().filter(x => x.l.row === 'antenna').map(x => x.t.name);
  const first = sched.games.map(g => g.date).sort()[0];
  const started = first && new Date(first) < new Date(process.env.BUILD_NOW || Date.now());
  return [
    { q: `What NBA games are on national TV ${n.games.length ? when(n) : 'tonight'}?`, a: !n.games.length ? 'No games are scheduled in the next few days.' : nat.length ? `${list(nat.map(g => `${match(g)} on ${g.nat_.label} (${g.et} ET)`))}.` : `None. All ${n.games.length} games on ${n.label} air on the teams' local channels and League Pass.` },
    { q: 'Which NBA teams changed TV channels for 2026-27?', a: `${moved.length} teams moved after FanDuel Sports Network shut down: ${list(moved)}.` },
    { q: 'Which NBA teams are on free antenna TV this season?', a: `${ant.length} teams have free broadcast TV as their main local home: ${list(ant)}. NBC and ABC national games are also free with an antenna.` },
    { q: 'When does the 2026-27 NBA season start?', a: first ? `The regular season ${started ? 'tipped off' : 'tips off'} on ${long(first)}.` : 'The schedule has not been published yet.' },
  ];
}
function tonightFaq() {
  const n = tv.nextNight(), g = n.games, nat = g.filter(x => x.nat_);
  if (!g.length) return [{ q: 'What NBA games are on TV tonight?', a: 'No games are scheduled in the next few days.' }];
  return [
    { q: `What NBA games are on TV ${when(n)}?`, a: `${g.length} game${g.length === 1 ? '' : 's'} on ${n.label}: ${list(g.slice(0, 5).map(x => `${match(x)} (${x.et} ET)`))}${g.length > 5 ? `, plus ${g.length - 5} more` : ''}.` },
    { q: `Which games ${when(n)} are on national TV?`, a: nat.length ? `${list(nat.map(x => `${match(x)} on ${x.nat_.label}`))}. National games replace local TV for those teams.` : 'None. Every game airs on the teams\' local channels, and on League Pass outside both markets.' },
    { q: `What time does the first game tip off ${when(n)}?`, a: `${match(g[0])} tips off at ${g[0].et} ET (${g[0].pt} PT).` },
    { q: "How do I watch a game that isn't on national TV?", a: "In each team's home market it airs on that team's local channel (antenna, DAZN, cable or the team's app). Everywhere else in the US it's on NBA League Pass." },
  ];
}
const blackoutsFaq = () => [
  { q: 'Why is my NBA game blacked out on League Pass?', a: "Either you live in that team's home market, where its games air on the local channel instead, or the game is on national TV (ESPN, ABC, NBC, Peacock or Prime Video), which League Pass blacks out live everywhere in the US." },
  { q: 'Are national NBA games blacked out on League Pass?', a: 'Yes. Games on ESPN, ABC, NBC, Peacock and Prime Video are blacked out live on League Pass across the US. NBA TV games are not exclusive.' },
  { q: 'How do I legally watch a blacked-out NBA game?', a: "Watch it where it airs: your team's local channel or app at home, or the national network for national games. Our team pages list each channel and streaming option." },
  { q: 'Can a ZIP code be in two teams\' markets?', a: "Yes. Some areas sit inside more than one team's market, so both teams' local games can be blacked out there. The NBA's own blackout guide is the final word." },
];
function whichNightFaq() {
  const D = { MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday', SUN: 'Sunday' };
  return week.filter(w => D[w.d] && w.n).slice(0, 5).map(w => ({ q: `Which network has NBA games on ${D[w.d]} nights?`, a: `${w.n}.${w.s ? ' ' + w.s.replace(/\.?$/, '.') : ''}` }));
}
const teamItems = slugs => tv.teams.filter(t => !slugs || slugs.includes(t.slug)).map((t, i) => ({ '@type': 'ListItem', position: i + 1, url: `${U}/teams/${t.slug}/`, name: t.full }));
function event(g) {
  const e = { '@type': 'SportsEvent', name: `${g.a.full} at ${g.h.full}`, sport: 'Basketball', startDate: g.date, eventStatus: 'https://schema.org/EventScheduled', eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    homeTeam: { '@type': 'SportsTeam', name: g.h.full, sport: 'Basketball' }, awayTeam: { '@type': 'SportsTeam', name: g.a.full, sport: 'Basketball' }, superEvent: { '@type': 'SportsEvent', name: 'NBA 2026-27 regular season' } };
  if (g.venue) e.location = { '@type': 'StadiumOrArena', name: g.venue, address: { '@type': 'PostalAddress', addressLocality: g.h.city, addressCountry: g.h.slug === 'raptors' ? 'CA' : 'US' } };
  const ch = g.nat_ ? [g.nat_.label] : [g.hl && g.hl.short, g.al && g.al.short].filter(Boolean);
  if (ch.length) e.subjectOf = { '@type': 'BroadcastEvent', name: `${e.name} on TV`, isLiveBroadcast: true, startDate: g.date, publishedOn: [...new Set(ch)].map(n => ({ '@type': 'BroadcastService', name: n })) };
  return e;
}
const tonightItems = () => tv.nextNight().games.map((g, i) => ({ '@type': 'ListItem', position: i + 1, item: event(g) }));
function teamNodes(t) {
  const l = tv.local[t.slug];
  return [{ '@type': 'SportsTeam', '@id': `${U}/teams/${t.slug}/#team`, name: t.full, sport: 'Basketball', memberOf: { '@type': 'SportsOrganization', name: 'NBA' }, location: { '@type': 'Place', name: t.city }, description: `Local TV in 2026-27: ${l.tv}. Streaming: ${l.stream}.` },
    ...tv.forTeam(t.abbr, 5).map(event)];
}
module.exports = { homeFaq, tonightFaq, blackoutsFaq, whichNightFaq, teamItems, tonightItems, teamNodes, event };
