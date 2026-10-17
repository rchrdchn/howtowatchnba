// WCAG helpers: keep brand colors, but darken just enough for AA text contrast.
const hex = h => h.replace('#', '').match(/../g).map(x => parseInt(x, 16));
const lum = h => { const c = hex(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => m - n); return (y + 0.05) / (x + 0.05); };
const toHex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
// Darken a background until white text on it reaches `min` (default 4.6).
function safeBg(h, min = 4.6) { let c = hex(h); for (let i = 0; i < 40 && ratio(toHex(c), '#ffffff') < min; i++) c = c.map(v => v * 0.96); return toHex(c); }
// Best readable text color on a background, preferring the candidates in order.
function bestText(bg, cands = ['#ffffff', '#0f1b2d'], min = 4.6) { return cands.find(c => ratio(bg, c) >= min) || cands.sort((a, b) => ratio(bg, b) - ratio(bg, a))[0]; }
module.exports = { safeBg, bestText, ratio };
