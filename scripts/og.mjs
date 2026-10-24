// Post-build: 1200x630 share images -> _site/og/<key>.png (see lib/og.js), plus /logo.png for
// Organization schema. Same approach as the soccer and Races Near generators: an SVG card rendered by sharp.
import sharp from 'sharp'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { SECTIONS, TOOLS } = require('../lib/og.js'); const { plain } = require('../lib/seo.js');
const teams = require('../src/_data/teams.json'), local = require('../src/_data/localTv.json');
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const wrap = (t, n) => { const out = []; let l = ''; for (const w of t.split(' ')) { if ((l + ' ' + w).trim().length > n) { out.push(l); l = w; } else l = (l + ' ' + w).trim(); } out.push(l); return out; };
const ball = '<g transform="translate(80 60) scale(1.2)"><rect x="6" y="8" width="52" height="48" rx="14" fill="#ff4f5e" transform="rotate(-8 32 32)"/><circle cx="32" cy="32" r="13" fill="#ffd23f" stroke="#0f1b2d" stroke-width="3"/><path d="M19 32h26M32 19v26M23 22c5 6 5 14 0 20M41 22c-5 6-5 14 0 20" fill="none" stroke="#0f1b2d" stroke-width="2.5"/></g>';
function card(title, label, c1 = '#d42a3c', c2 = '#ffd23f') {
  let lines = wrap(title, 22), fs_ = 76; if (lines.length > 3) { fs_ = 58; lines = wrap(title, 30).slice(0, 4); }
  const tl = lines.map((l, i) => `<tspan x="80" dy="${i ? fs_ * 1.1 : 0}">${esc(l)}</tspan>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#f4f8ff"/><rect width="1200" height="14" fill="${c1}"/><rect y="14" width="1200" height="6" fill="${c2}"/>${ball}
<text x="176" y="118" font-family="DejaVu Sans, Arial, sans-serif" font-weight="700" font-size="32" fill="#0f1b2d">How to Watch <tspan fill="#d42a3c">NBA</tspan></text>
<text x="80" y="226" font-family="DejaVu Sans Mono, monospace" font-weight="700" font-size="22" fill="#1769c2" letter-spacing="3">${esc(label)}</text>
<text x="80" y="${226 + 34 + fs_}" font-family="DejaVu Sans, Arial, sans-serif" font-weight="700" font-size="${fs_}" fill="#0f1b2d">${tl}</text>
<rect y="540" width="1200" height="90" fill="#0f1b2d"/><text x="80" y="595" font-family="DejaVu Sans, Arial, sans-serif" font-size="26" font-weight="700" fill="#ffffff">howtowatchnba.com</text><text x="1120" y="595" text-anchor="end" font-family="DejaVu Sans Mono, monospace" font-size="20" fill="#cfd8e8">2026-27 local TV for all 30 teams</text></svg>`;
}
const LABEL = { tonight: 'TONIGHT ON TV', teams: 'ALL 30 TEAMS', blackouts: 'LEAGUE PASS BLACKOUTS', 'which-night': 'NATIONAL TV BY NIGHT', moved: 'AFTER FANDUEL SPORTS NETWORK', guides: 'HOW-TO-WATCH GUIDES', news: 'TONIGHT AND SCORES', about: 'ABOUT', advertise: 'ADVERTISE', contact: 'CONTACT', privacy: 'PRIVACY' };
const h1 = u => { const f = path.join('_site', u, 'index.html'); if (!fs.existsSync(f)) return null; const m = fs.readFileSync(f, 'utf8').match(/<h1[^>]*>([\s\S]*?)<\/h1>/); return m ? plain(m[1].replace(/<br>/g, ' ')) : null; };
fs.mkdirSync('_site/og', { recursive: true });
let n = 0;
const out = async (key, svg) => { await sharp(Buffer.from(svg)).png().toFile(`_site/og/${key}.png`); n++; };
await out('default', card('Your team moved channels. Here\'s where.', '2026-27 NBA ON TV'));
for (const s of SECTIONS) { const t = h1(`/${s}/`); if (t) await out(s, card(t, LABEL[s])); }
for (const s of TOOLS) { const t = h1(`/tools/${s}/`); if (t) await out('tool-' + s, card(t, 'FREE TOOL · 2026-27 COST CALCULATOR')); }
for (const t of teams) await out('team-' + t.slug, card(`How to watch the ${t.full}`, `2026-27 LOCAL TV: ${local[t.slug].short}`.toUpperCase().slice(0, 52), t.c1, t.c2));
// Per-post news cards (og/news-<slug>.png): dark, high-contrast scoreboard built from each post's front
// matter, so every new preview or recap the morning routine writes gets its own card with no extra step.
// Matchups come from `games` (schedule.json) or `teamsMentioned` pairs; recap scores are read from the
// post's own text ("76ers 114, Cavaliers 106" or "the Pistons beat the Celtics 121-113"). Optional front
// matter override: `card: { kicker: "...", rows: [["PHI", 114, "CLE", 106]] }`. Team colors only, no logos.
const matter = require('gray-matter'); const tv = require('../lib/tv.js');
const byAbbr = Object.fromEntries(teams.map(t => [t.abbr, t]));
const W = (s, px) => [...String(s)].reduce((a, c) => a + (c === ' ' ? 0.35 : /[A-Z]/.test(c) ? 0.8 : /[0-9]/.test(c) ? 0.7 : /[il.,'!|]/.test(c) ? 0.36 : /[mw]/.test(c) ? 1.0 : 0.7), 0) * px;
const fit = (s, px, max) => { while (px > 22 && W(s, px) > max) px -= 2; return px; };
const VERBS = '(?:beat|beats|topped|tops|edged|edges|routed|routs|held off|holds off|outlasted|rallied past|rallied to beat|downed|defeated|blew out|knocked off|stunned|crushed|handled|dispatched|survived)';
const rx = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function score(text, A, B) {
  for (const [x, y] of [[A, B], [B, A]]) {
    let m = text.match(new RegExp(`\\b${rx(x.name)} (\\d{2,3}),? (?:the )?${rx(y.name)} (\\d{2,3})\\b`));
    if (m) return { [x.abbr]: +m[1], [y.abbr]: +m[2] };
    m = text.match(new RegExp(`\\b${rx(x.name)}\\b[^.;:]{0,90}?\\b${VERBS} (?:the )?${rx(y.name)},? (\\d{2,3})-(\\d{2,3})`));
    if (m) { const hi = Math.max(+m[1], +m[2]), lo = Math.min(+m[1], +m[2]); return { [x.abbr]: hi, [y.abbr]: lo }; }
  }
  return null;
}
const shortDate = d => new Date(d).toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
function postRows(fm, text) {
  const all = tv.all(), games = (fm.games || []).map(id => all.find(g => g.id === String(id))).filter(Boolean);
  let pairs = games.map(g => ({ a: byAbbr[g.away], h: byAbbr[g.home], g }));
  if (!pairs.length) { const tm = (fm.teamsMentioned || []).filter(a => byAbbr[a]); for (let i = 0; i + 1 < tm.length; i += 2) pairs.push({ a: byAbbr[tm[i]], h: byAbbr[tm[i + 1]], vs: true }); }
  pairs = pairs.filter(p => p.a && p.h);
  const total = Math.max((fm.games || []).length, pairs.length);
  if (fm.card && Array.isArray(fm.card.rows)) {
    const rows = fm.card.rows.filter(r => byAbbr[r[0]] && byAbbr[r[2]]).slice(0, 3).map(([w, ws, l, ls]) => ({ l: byAbbr[w], ls, r: byAbbr[l], rs, win: true }));
    if (rows.length) return { rows, total: Math.max(total, rows.length), more: Math.max(total, rows.length) - rows.length };
  }
  if (fm.postType === 'recap') {
    const scored = pairs.map(p => ({ ...p, s: score(text, p.a, p.h) })).filter(p => p.s);
    const rows = (scored.length ? scored : pairs).slice(0, 3).map(p => {
      if (!p.s) return { l: p.a, r: p.h, mid: p.vs ? 'vs' : 'at' };
      const [w, l] = p.s[p.a.abbr] > p.s[p.h.abbr] ? [p.a, p.h] : [p.h, p.a];
      return { l: w, ls: p.s[w.abbr], r: l, rs: p.s[l.abbr], win: true };
    });
    return { rows, total, more: total - rows.length };
  }
  // Preview: national TV games first, then the rest by tip time.
  const sorted = [...pairs].sort((x, y) => (!!y.g?.nat_ - !!x.g?.nat_) || ((x.g?.date || '') < (y.g?.date || '') ? -1 : 1));
  const rows = sorted.slice(0, 3).map(p => ({ l: p.a, r: p.h, mid: p.vs ? 'vs' : 'at', tip: p.g ? `${p.g.et} ET` : '', net: p.g?.nat_?.label || '' }));
  return { rows, total, more: total - rows.length };
}
function chip(t, x, y, s) {
  const c = t.c1 && t.c1.toLowerCase() !== '#000000' ? t.c1 : '#2b3a55';
  return `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="14" fill="${c}" stroke="${t.c2 || '#ffffff'}" stroke-width="4"/><text x="${x + s / 2}" y="${y + s / 2 + 10}" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-weight="700" font-size="${t.abbr.length > 3 ? 20 : 26}" fill="${t.on || '#ffffff'}">${esc(t.abbr)}</text>`;
}
const F = 'font-family="DejaVu Sans, Arial, sans-serif" font-weight="700"';
function newsCard(fm, text) {
  const recap = fm.postType === 'recap', { rows, total, more } = postRows(fm, text);
  const day = recap ? new Date(new Date(fm.date).getTime() - 864e5) : new Date(fm.date);
  const kicker = (fm.card && fm.card.kicker) || (recap ? 'FINAL SCORES' : 'TONIGHT ON TV');
  const accent = recap ? '#ff4f5e' : '#ffd23f', ink = recap ? '#ffffff' : '#0f1b2d';
  const count = total ? `${total} GAME${total === 1 ? '' : 'S'}${recap ? '' : ' TONIGHT'}` : '';
  if (!rows.length) return card(fm.title, `${kicker} · ${shortDate(day)}`);
  const n = rows.length, rh = n === 1 ? 150 : n === 2 ? 128 : 92, gap = n === 3 ? 12 : 16, top = 210, cs = n === 3 ? 64 : 76;
  const body = rows.map((r, i) => {
    const y = top + i * (rh + gap), cy = y + rh / 2, fs = n === 3 ? 46 : 54;
    let s = `<rect x="64" y="${y}" width="1072" height="${rh}" rx="22" fill="#16243d"/>`;
    s += chip(r.l, 88, cy - cs / 2, cs);
    if (r.win) {
      const nx = 88 + cs + 22, sx = 600 - 30;
      s += `<text x="${nx}" y="${cy + fs * 0.36}" ${F} font-size="${fit(r.l.name, fs, sx - nx - 140)}" fill="#ffffff">${esc(r.l.name)}</text>`;
      s += `<text x="${sx}" y="${cy + fs * 0.38}" text-anchor="end" ${F} font-size="${fs + 6}" fill="${accent}">${r.ls}</text>`;
      s += `<text x="600" y="${cy + 12}" text-anchor="middle" ${F} font-size="34" fill="#5d6f8f">–</text>`;
      s += `<text x="630" y="${cy + fs * 0.38}" ${F} font-size="${fs + 6}" fill="#9fb0cc">${r.rs}</text>`;
      const rx_ = 1112 - cs - 22;
      s += `<text x="${rx_}" y="${cy + fs * 0.36}" text-anchor="end" ${F} font-size="${fit(r.r.name, fs, rx_ - 630 - 140)}" fill="#9fb0cc">${esc(r.r.name)}</text>`;
      s += chip(r.r, 1112 - cs, cy - cs / 2, cs);
    } else {
      const nx = 88 + cs + 22, pair = `${r.l.name} ${r.mid} ${r.r.name}`, right = [r.tip, r.net].filter(Boolean).join(' · ');
      const rw = right ? W(right, 30) + 20 : 0, f2 = fit(pair, fs, 1112 - nx - rw - 30);
      s += `<text x="${nx}" y="${cy + f2 * 0.36}" ${F} font-size="${f2}" fill="#ffffff">${esc(r.l.name)} <tspan fill="#7f93b5" font-size="${Math.round(f2 * 0.7)}">${r.mid}</tspan> ${esc(r.r.name)}</text>`;
      if (right) s += `<text x="1112" y="${cy + 11}" text-anchor="end" ${F} font-size="30" fill="${r.net ? accent : '#cfd8e8'}">${esc(right)}</text>`;
    }
    return s;
  }).join('');
  const moreTxt = more > 0 ? `+${more} more game${more === 1 ? '' : 's'}${recap ? ', all finals inside' : ': channels for every team inside'}` : (recap ? 'Box scores, key moments and replays inside' : 'Channels, streams and blackout notes inside');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#0b1526"/><rect width="1200" height="12" fill="#ff4f5e"/><rect y="12" width="1200" height="6" fill="#ffd23f"/>
<g transform="translate(64 44)">${ball.replace('translate(80 60) scale(1.2)', 'scale(1)')}</g>
<text x="140" y="92" ${F} font-size="32" fill="#ffffff">How to Watch <tspan fill="#ff4f5e">NBA</tspan></text>
<text x="1136" y="92" text-anchor="end" ${F} font-size="32" fill="#ffffff">${esc(shortDate(day))}</text>
<rect x="64" y="128" width="${W(kicker, 28) + 48}" height="56" rx="28" fill="${accent}"/><text x="88" y="166" ${F} font-size="28" fill="${ink}" letter-spacing="1">${esc(kicker)}</text>
<text x="${64 + W(kicker, 28) + 72}" y="166" ${F} font-size="28" fill="#9fb0cc" letter-spacing="1">${esc(count)}</text>
${body}
<text x="64" y="${Math.min(top + n * (rh + gap) + 30, 556)}" font-family="DejaVu Sans, Arial, sans-serif" font-size="28" fill="#cfd8e8">${esc(moreTxt)}</text>
<rect y="578" width="1200" height="52" fill="#ff4f5e"/><text x="64" y="614" ${F} font-size="26" fill="#ffffff">howtowatchnba.com</text><text x="1136" y="614" text-anchor="end" ${F} font-size="22" fill="#ffffff">Every game, every channel</text></svg>`;
}
for (const f of fs.readdirSync('src/news').filter(f => f.endsWith('.md'))) {
  const { data, content } = matter(fs.readFileSync(path.join('src/news', f), 'utf8'));
  const text = [data.title, data.description, ...(data.faqs || []).map(x => x.a), content].join(' \n ').replace(/\{%\s*team\s+"(\w+)"\s*%\}/g, (m, a) => byAbbr[a] ? byAbbr[a].name : a).replace(/\{%[^%]*%\}/g, ' ').replace(/[*_]/g, '');
  await out('news-' + f.replace(/\.md$/, ''), newsCard(data, text));
}
await sharp(Buffer.from(fs.readFileSync('src/favicon.svg'))).resize(512, 512).png().toFile('_site/logo.png');
console.log('og images:', n);
