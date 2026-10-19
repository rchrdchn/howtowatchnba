// "Cheapest way to watch your team" (/tools/cheapest-way-to-watch-your-team/). Vanilla JS.
// Data is embedded at build time from teams.json, localTv.json, schedule.json, zipMarkets.json and prices.json.
(function () {
  var el = document.getElementById('tcd'), f = document.getElementById('tcf'); if (!el || !f) return;
  var D = JSON.parse(el.textContent), P = D.P, T = {};
  D.T.forEach(function (t) { T[t.s] = t; });
  var $ = function (id) { return document.getElementById(id); };
  var money = function (n) { return n === 0 ? 'Free' : '$' + n.toFixed(2); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  function zipCheck(t) {
    var z = $('tcz').value.trim(), r = $('tczr');
    if (!/^\d{5}$/.test(z)) { r.textContent = ''; return; }
    var m = D.Z[z.slice(0, 3)] || [];
    var inn = t ? m.indexOf(t.s) >= 0 : false;
    if (t) f.querySelector('input[name=mk][value=' + (inn ? 'in' : 'out') + ']').checked = true;
    r.textContent = !t ? '' : inn ? 'ZIP ' + z + ' looks like ' + t.short + ' home territory.' : 'ZIP ' + z + ' looks outside ' + t.short + ' home territory' + (m.length ? ' (home teams: ' + m.map(function (s) { return T[s] ? T[s].short : s; }).join(', ') + ').' : '.');
  }
  function run(e) {
    var t = T[$('tct').value], out = $('tcr');
    if (e && e.target && (e.target.id === 'tcz' || e.target.id === 'tct')) zipCheck(t);
    if (!t) { $('tcoh').textContent = 'Pick your team'; return; }
    var c = t.c, inn = f.querySelector('input[name=mk]:checked').value === 'in';
    $('g-loc-t').textContent = (inn ? 'Local games' : 'Out-of-market games') + ' (' + c.local + ')';
    $('g-nbc-t').textContent = 'NBC and Peacock games (' + c.nbc + ')';
    $('g-espn-t').textContent = 'ESPN and ABC games (' + c.espn + ')';
    $('g-prime-t').textContent = 'Prime Video games (' + c.prime + ')';
    var rows = [], mo = 0, sea = 0, unknown = [], months = c.months || 7, free = 0, need = [], L = t.loc || {};
    var best = function (id) { var s = P[id], m = s.p * months; return s.a != null && s.a < m ? s.a : m; };
    var price = function (id) { var s = P[id]; return money(s.p) + '/mo' + (s.a != null ? ' or ' + money(s.a) + '/season' : ''); };
    // need[] collects services so a shared one (Peacock as the base for an NBC Sports add-on) is only counted once.
    function add(id, games, why) {
      for (var i = 0; i < need.length; i++) if (need[i].id === id) { need[i].g += games; need[i].why += '. ' + why; return; }
      need.push({ id: id, g: games, why: why });
    }
    function priced(n) {
      var s = P[n.id], m = s.p * months, b = best(n.id); mo += s.p; sea += b;
      rows.push('<tr><th scope="row">' + esc(s.n) + '<small>' + esc(n.why) + '</small></th><td>' + (n.g || 'Base plan') + '</td><td>' + money(s.p) + '<small>/mo</small></td><td>' + money(b) + (s.a != null && s.a < m ? '<small class="b">' + esc(s.al || 'yearly plan') + '</small>' : '') + '</td></tr>');
    }
    function unpriced(name, games, why) { unknown.push(name); rows.push('<tr><th scope="row">' + esc(name) + '<small>' + esc(why) + '</small></th><td>' + games + '</td><td colspan="2" class="na">Price not in our data yet</td></tr>'); }
    function freeRow(name, games, why) { free += games; rows.push('<tr><th scope="row">' + esc(name) + '<small>' + esc(why) + '</small></th><td>' + games + '</td><td>Free</td><td>Free</td></tr>'); }
    var outMk = !inn || t.row === 'lp';
    if ($('g-loc').checked) {
      if (outMk) {
        var lpId = best('team-pass') <= best('league-pass') ? 'team-pass' : 'league-pass', other = lpId === 'team-pass' ? 'league-pass' : 'team-pass';
        add(lpId, c.local, (t.row === 'lp' ? 'Raptors games in the US' : 'Out-of-market ' + t.short + ' games') + '. Blacked out in the ' + t.short + ' home area and for national games. ' + P[other].n + ': ' + price(other));
      }
      else if (t.row === 'antenna') freeRow(t.ch + ' (antenna)', c.local, 'Local ' + t.short + ' games. ' + (L.svc && P[L.svc] ? 'Or stream on ' + P[L.svc].n + ': ' + price(L.svc) : 'Stream: ' + t.st));
      else if (L.svc && P[L.svc]) {
        add(L.svc, c.local, 'Local ' + t.short + ' games on ' + t.ch + (t.free ? '. Free on local TV: ' + t.free : ''));
        if (L.base) add(L.base, 0, 'Needed for the ' + P[L.svc].n + ' add-on');
      }
      else unpriced(t.st, c.local, 'Local ' + t.short + ' games on ' + t.ch + (t.free ? '. Free on local TV: ' + t.free : ''));
    }
    if ($('g-nbc').checked && c.nbc) add('peacock', c.nbc, c.nbcOta + ' of them also free on NBC with an antenna');
    if ($('g-espn').checked && c.espn) add('espn-unlimited', c.espn, c.abc ? c.abc + ' of them also free on ABC with an antenna' : 'ESPN and ESPN2 games');
    if ($('g-prime').checked && c.prime) add('prime', c.prime, 'Prime Video exclusives, included with Prime');
    need.forEach(priced);
    $('tcoh').textContent = t.n + ': cheapest combo';
    if (!rows.length) { out.innerHTML = '<p class="fine">Tick at least one group of games.</p>'; return; }
    var antennaFree = (inn && t.row === 'antenna' ? c.local : 0) + c.nbcOta + c.abc;
    out.innerHTML = '<dl class="tc-kpi"><div><dt>Per month</dt><dd>' + money(+mo.toFixed(2)) + (unknown.length ? '<small>+ ' + unknown.length + ' unpriced</small>' : '') + '</dd></div><div><dt>Season (' + months + ' mo)</dt><dd>' + money(+sea.toFixed(2)) + (unknown.length ? '<small>+ unpriced</small>' : '') + '</dd></div></dl>'
      + '<div class="tc-tw"><table class="tc-t"><caption>What you need for the games you ticked</caption><thead><tr><th scope="col">Service</th><th scope="col">Games</th><th scope="col">Monthly</th><th scope="col">Season</th></tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'
      + '<ul class="tc-notes">' + (unknown.length ? '<li>Totals leave out ' + esc(unknown.join(' and ')) + ': we have not checked ' + (unknown.length > 1 ? 'those prices' : 'that price') + ' yet.</li>' : '')
      + (outMk && $('g-loc').checked ? '<li>League Pass and Team Pass black out your home team\'s local games and every national game, so this assumes you live outside the ' + esc(t.short) + ' home area.</li>' : '')
      + '<li>Free with an antenna: about ' + antennaFree + ' of ' + c.total + ' ' + esc(t.short) + ' games' + (inn && t.row === 'antenna' ? ' (local games plus NBC and ABC)' : ' (NBC and ABC national games)') + '.</li>'
      + (t.ok ? '' : '<li>Some ' + esc(t.short) + ' local TV details are still unconfirmed. Check the team page.</li>')
      + '<li>Prices checked ' + esc(D.d) + ' on each provider\'s own page. Taxes and fees not included.</li></ul>'
      + '<p class="tc-more"><a href="/teams/' + esc(t.s) + '/">' + esc(t.n) + ' channels and next games →</a></p>';
    try { history.replaceState(null, '', '?team=' + encodeURIComponent(t.s)); } catch (x) {}
  }
  f.addEventListener('change', run); f.addEventListener('input', run); f.addEventListener('submit', function (e) { e.preventDefault(); });
  var q = /[?&]team=([^&#]+)/.exec(location.search); if (q && T[decodeURIComponent(q[1])]) $('tct').value = decodeURIComponent(q[1]);
  run();
})();
