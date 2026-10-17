// Nightly: pull the NBA schedule + national TV from ESPN's public scoreboard feed, one day at a time.
// Local channels come from src/_data/localTv.json (hand-checked), not from ESPN.
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
const OUT = new URL('../src/_data/schedule.json', import.meta.url);
const END = process.env.SEASON_END || '2027-04-11';
const etDay = d => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(d);
const start = new Date(Date.now() - 86400e3), days = [];
for (let d = new Date(etDay(start) + 'T12:00:00Z'); etDay(d) <= END; d = new Date(d.getTime() + 86400e3)) days.push(etDay(d).replace(/-/g, ''));
async function day(ymd) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${ymd}`, { headers: { 'user-agent': 'howtowatchnba-schedule/1.0' } });
      if (!r.ok) throw new Error(r.status);
      return (await r.json()).events || [];
    } catch (e) { if (i === 2) throw new Error(`${ymd}: ${e.message}`); await new Promise(s => setTimeout(s, 1500)); }
  }
}
const games = [], fails = [];
for (let i = 0; i < days.length; i += 8) {
  const batch = await Promise.allSettled(days.slice(i, i + 8).map(day));
  batch.forEach((b, j) => b.status === 'fulfilled' ? games.push(...b.value) : fails.push(days[i + j]));
}
const out = games.filter(e => (e.season?.type ?? 2) >= 2).map(e => {
  const c = e.competitions[0], side = h => c.competitors.find(x => x.homeAway === h);
  const geo = c.geoBroadcasts || [], pick = t => geo.filter(b => b.market?.type === t).map(b => b.media?.shortName).filter(Boolean);
  return { id: e.id, date: e.date.length === 17 ? e.date.replace('Z', ':00Z') : e.date, home: side('home').team.abbreviation, away: side('away').team.abbreviation,
    nat: [...new Set(pick('National'))], espnLocal: { home: pick('Home'), away: pick('Away') }, status: c.status?.type?.name || '', venue: c.venue?.fullName || '', note: (c.notes || []).map(n => n.headline).join('; ') };
}).sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
if (out.length < 10 && existsSync(OUT)) { console.error(`Only ${out.length} games fetched; keeping existing schedule.json`); process.exit(fails.length ? 1 : 0); }
writeFileSync(OUT, JSON.stringify({ updated: new Date().toISOString(), source: 'ESPN public scoreboard feed (unofficial)', failedDays: fails, games: out }, null, 0));
console.log(`${out.length} games from ${days[0]} to ${days.at(-1)}${fails.length ? `, failed days: ${fails.join(',')}` : ''}`);
