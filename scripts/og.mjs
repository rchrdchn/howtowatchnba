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
const LABEL = { tonight: 'TONIGHT ON TV', teams: 'ALL 30 TEAMS', blackouts: 'LEAGUE PASS BLACKOUTS', 'which-night': 'NATIONAL TV BY NIGHT', moved: 'AFTER FANDUEL SPORTS NETWORK', guides: 'HOW-TO-WATCH GUIDES', about: 'ABOUT', advertise: 'ADVERTISE', contact: 'CONTACT', privacy: 'PRIVACY' };
const h1 = u => { const f = path.join('_site', u, 'index.html'); if (!fs.existsSync(f)) return null; const m = fs.readFileSync(f, 'utf8').match(/<h1[^>]*>([\s\S]*?)<\/h1>/); return m ? plain(m[1].replace(/<br>/g, ' ')) : null; };
fs.mkdirSync('_site/og', { recursive: true });
let n = 0;
const out = async (key, svg) => { await sharp(Buffer.from(svg)).png().toFile(`_site/og/${key}.png`); n++; };
await out('default', card('Your team moved channels. Here\'s where.', '2026-27 NBA ON TV'));
for (const s of SECTIONS) { const t = h1(`/${s}/`); if (t) await out(s, card(t, LABEL[s])); }
for (const s of TOOLS) { const t = h1(`/tools/${s}/`); if (t) await out('tool-' + s, card(t, 'FREE TOOL · 2026-27 COST CALCULATOR')); }
for (const t of teams) await out('team-' + t.slug, card(`How to watch the ${t.full}`, `2026-27 LOCAL TV: ${local[t.slug].short}`.toUpperCase().slice(0, 52), t.c1, t.c2));
await sharp(Buffer.from(fs.readFileSync('src/favicon.svg'))).resize(512, 512).png().toFile('_site/logo.png');
console.log('og images:', n);
