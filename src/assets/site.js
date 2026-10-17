(() => {
  const f = document.getElementById('ck');
  if (f) {
    let data; const vd = document.getElementById('vd'), zip = document.getElementById('zip'), sel = document.getElementById('cteam');
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const opts = t => {
      const o = [];
      if (t.row === 'antenna') o.push(['FREE', '', t.s, 'Antenna or any TV plan with local channels']);
      else if (t.row !== 'lp' && t.row !== 'dazn') o.push(['TV', '', t.s, 'Local TV in the home market']);
      else if (t.row === 'dazn' && !/^DAZN/.test(t.tv)) o.push(['TV', '', t.tv.split(';')[0], 'Local TV in the home market']);
      if (t.dz) o.push(['DAZN', 'dz', 'DAZN', 'Streams local games in the home market']);
      else if (t.st && t.st !== 'Not confirmed') o.push(['APP', 'ap', t.st, 'Streaming in the home market']);
      if (t.fr && t.row !== 'antenna') o.push(['FREE', '', 'Free games', t.fr]);
      return '<div class="opts">' + o.map(x => `<div class="opt"><i class="${x[1]}">${x[0]}</i><span>${esc(x[2])}<small>${esc(x[3])}</small></span></div>`).join('') + '</div>';
    };
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const z = zip.value.trim();
      vd.hidden = false;
      if (!/^\d{5}$/.test(z)) { vd.className = 'verdict unk'; vd.innerHTML = '<h3>Enter a 5-digit ZIP code.</h3>'; return; }
      try { data = data || await (await fetch('/assets/markets.json')).json(); } catch { vd.className = 'verdict unk'; vd.innerHTML = '<h3>Could not load the map. Try again.</h3>'; return; }
      const home = data.map[z.slice(0, 3)] || [], pick = sel.value, T = data.teams;
      const link = '<p>Double-check with the NBA\'s official blackout guide linked below.</p>';
      if (!pick) {
        if (!home.length) { vd.className = 'verdict unk'; vd.innerHTML = '<span class="st">NO HOME TEAM</span><h3>We couldn\'t place a home team for this ZIP.</h3><p>You may be outside every team\'s market, so League Pass would show all non-national games.</p>' + link; return; }
        const t = T[home[0]];
        vd.className = 'verdict'; vd.innerHTML = `<span class="st">IN MARKET</span><h3>Your home team${home.length > 1 ? 's' : ''}: ${home.map(s => esc(T[s].n)).join(', ')}. League Pass blacks out ${home.length > 1 ? 'their' : 'their'} local games here.</h3>${opts(t)}${home.length > 1 ? '<p>Pick a team above to see its options.</p>' : ''}${link}`;
        return;
      }
      const t = T[pick];
      if (home.includes(pick) && t.row !== 'lp') { vd.className = 'verdict'; vd.innerHTML = `<span class="st">BLACKED OUT</span><h3>You're in ${esc(t.n)} country. League Pass blacks out their local games here.</h3>${opts(t)}<p>National games are on ESPN, ABC, NBC, Peacock or Prime Video.</p>${link}`; }
      else { vd.className = 'verdict out'; vd.innerHTML = `<span class="st">YOU'RE CLEAR</span><h3>You're outside the ${esc(t.n)} market. League Pass shows their games that aren't on national TV.</h3><p>National games are blacked out on League Pass everywhere. Watch those on ESPN, ABC, NBC, Peacock or Prime Video.</p>${link}`; }
    });
  }
})();

// Copy-email buttons (.ecopy): clipboard API, then execCommand, then select the visible address. Shows "Copied!" for 2s.
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('.ecopy'); if (!b) return;
  const t = b.dataset.email, l = b.dataset.l || (b.dataset.l = b.textContent);
  const ok = () => { b.textContent = 'Copied!'; b.classList.add('done'); clearTimeout(b._t); b._t = setTimeout(() => { b.textContent = l; b.classList.remove('done'); }, 2000); };
  const old = () => {
    const a = document.createElement('textarea'); a.value = t; a.setAttribute('readonly', ''); a.style.cssText = 'position:fixed;top:0;left:0;opacity:0'; document.body.appendChild(a); a.select();
    let r = false; try { r = document.execCommand('copy'); } catch (x) {} a.remove();
    if (r) return ok();
    const n = (b.closest('.emo') || document).querySelector('.emaddr'); if (n) { const g = document.createRange(); g.selectNodeContents(n); const w = getSelection(); w.removeAllRanges(); w.addRange(g); }
    b.textContent = 'Press Ctrl+C / ⌘C';
  };
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(ok, old); else old();
});
