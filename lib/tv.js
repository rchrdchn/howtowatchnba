// Channel logic shared by templates: national windows from ESPN, local channels from localTv.json.
const teams = require('../src/_data/teams.json');
const local = require('../src/_data/localTv.json');
const sched = require('../src/_data/schedule.json');
const byAbbr = Object.fromEntries(teams.map(t => [t.abbr, t]));
const EXCL = { 'NBC': 'nbc', 'NBCSN': 'nbc', 'Peacock': 'nbc', 'ESPN': 'espn', 'ABC': 'espn', 'ESPN2': 'espn', 'Prime Video': 'prime' };
const ROWS = [
  ['nbc', 'NBC / Peacock', 'National'], ['espn', 'ESPN / ABC', 'National'], ['prime', 'Prime Video', 'National'], ['nbatv', 'NBA TV', 'National, local still airs'],
  ['antenna', 'Free antenna', 'Local TV, free'], ['dazn', 'DAZN', 'Local streaming'], ['local', 'Local TV & team apps', 'Cable, RSN or app'], ['lp', 'League Pass', 'Out of market only']];
const etDay = d => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date(d));
const fmt = (d, tz, o) => new Intl.DateTimeFormat('en-US', { timeZone: tz, ...o }).format(new Date(d));
const time = (d, tz) => fmt(d, tz, { hour: 'numeric', minute: '2-digit' }).replace(':00', '').replace(' ', '');
function national(g) { const n = g.nat.filter(x => EXCL[x]); return n.length ? { row: EXCL[n[0]], label: n.includes('NBC') ? 'NBC / Peacock' : n.includes('NBCSN') ? 'Peacock / NBCSN' : n.join(' / ') } : null; }
function decorate(g) {
  const h = byAbbr[g.home], a = byAbbr[g.away];
  const nat = national(g);
  return { ...g, h, a, nat_: nat, nbatv: g.nat.includes('NBA TV'), et: time(g.date, 'America/New_York'), pt: time(g.date, 'America/Los_Angeles'), day: etDay(g.date),
    dayLabel: fmt(g.date, 'America/New_York', { weekday: 'short', month: 'short', day: 'numeric' }),
    hl: h ? local[h.slug] : null, al: a ? local[a.slug] : null };
}
let _all; const all = () => _all || (_all = sched.games.filter(g => byAbbr[g.home] && byAbbr[g.away]).map(decorate));
const now = () => new Date(process.env.BUILD_NOW || Date.now());
let _up; function upcomingAll() { if (_up) return _up; const cut = new Date(now().getTime() - 3 * 3600e3).toISOString(); return (_up = all().filter(g => g.date >= cut && !/FINAL|POSTPONED|CANCELED/.test(g.status))); }
function nextNight() { const up = upcomingAll(); if (!up.length) return { day: null, games: [] }; const d = up[0].day; return { day: d, label: up[0].dayLabel, games: up.filter(g => g.day === d) }; }
function forTeam(abbr, n = 8) { return upcomingAll().filter(g => g.home === abbr || g.away === abbr).slice(0, n); }
// What a fan of `side` team sees for game g.
function teamChannel(g, abbr) {
  if (g.nat_) return { kind: 'nat', label: g.nat_.label };
  const t = byAbbr[abbr], l = local[t.slug];
  return { kind: l.row === 'antenna' ? 'free' : l.row === 'dazn' ? 'dazn' : l.row === 'lp' ? 'lp' : 'local', label: l.short + (g.nbatv ? ' (also NBA TV)' : '') };
}
function grid(games) {
  if (!games.length) return null;
  const SLOT = 30 * 60e3, LEN = 5;
  const t0 = Math.floor(Math.min(...games.map(g => +new Date(g.date))) / SLOT) * SLOT;
  const tEnd = Math.max(...games.map(g => +new Date(g.date))) + LEN * SLOT;
  const nSlots = Math.ceil((tEnd - t0) / SLOT);
  const slots = Array.from({ length: nSlots }, (_, i) => time(t0 + i * SLOT, 'America/New_York'));
  const blocks = Object.fromEntries(ROWS.map(r => [r[0], []]));
  for (const g of games) {
    const s = Math.round((+new Date(g.date) - t0) / SLOT);
    const b = (row, title, sub, team) => blocks[row].push({ s, title, sub, team, g });
    const m = `${g.a.name} at ${g.h.name}`;
    if (g.nat_) { b(g.nat_.row, m, `${g.et} ET · ${g.nat_.label}`, null); continue; }
    if (g.nbatv) b('nbatv', m, `${g.et} ET · NBA TV`, null);
    for (const [t, l] of [[g.a, g.al], [g.h, g.hl]]) {
      if (l.row === 'lp') continue;
      b(l.row, m, `${t.name} fans · ${l.short}`, t);
      if (l.dazn && l.row !== 'dazn') b('dazn', m, `${t.name} fans · DAZN`, t);
    }
    b('lp', m, `${g.et} ET · outside both markets`, null);
  }
  const rows = [];
  for (const [id, label, sub] of ROWS) {
    const lanes = [];
    for (const bl of blocks[id].sort((x, y) => x.s - y.s)) { let i = lanes.findIndex(end => end <= bl.s); if (i < 0) { i = lanes.length; lanes.push(0); } lanes[i] = bl.s + LEN; bl.lane = i; }
    if (lanes.length) rows.push({ id, label, sub, lanes: lanes.length, blocks: blocks[id] });
  }
  let r = 2; for (const row of rows) { row.r0 = r; r += row.lanes; }
  return { slots, nSlots, len: LEN, rows };
}
module.exports = { ROWS, byAbbr, all, upcomingAll, nextNight, forTeam, teamChannel, grid, local, teams, time, etDay };
