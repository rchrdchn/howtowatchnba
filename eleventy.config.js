const tv = require('./lib/tv.js');
const color = require('./lib/color.js');
module.exports = function (c) {
  c.addPassthroughCopy({ 'src/assets': 'assets' });
  ['favicon.svg', '_headers', 'site.webmanifest'].forEach(f => c.addPassthroughCopy('src/' + f));
  c.addPassthroughCopy('src/*.txt');
  c.addGlobalData('tv', tv);
  c.addFilter('safeBg', h => color.safeBg(h));
  c.addFilter('bestText', (bg, a, b) => color.bestText(bg, [a, b, '#ffffff', '#0f1b2d'].filter(Boolean)));
  c.addFilter('json', v => JSON.stringify(v).replace(/</g, '\\u003c'));
  c.addFilter('local', slug => tv.local[slug]);
  c.addFilter('forTeam', (abbr, n) => tv.forTeam(abbr, n));
  c.addFilter('teamChannel', (g, abbr) => tv.teamChannel(g, abbr));
  c.addFilter('grid', games => tv.grid(games));
  c.addFilter('kind', l => l.row === 'antenna' ? ['FREE TV', ''] : l.row === 'dazn' ? ['DAZN', 'dz'] : l.row === 'lp' ? ['LEAGUE PASS', ''] : ['TEAM NETWORK', 'app']);
  c.addFilter('longDate', d => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }));
  c.addFilter('etLong', d => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }));
  c.addFilter('pt', d => tv.time(d, 'America/Los_Angeles'));
  c.addFilter('sitemapPages', ps => ps.filter(p => p.url && p.url.endsWith('/') && !p.data.noindex).sort((a, b) => a.url === '/' ? -1 : b.url === '/' ? 1 : a.url.localeCompare(b.url)));
  c.addFilter('isoDate', d => new Date(d).toISOString().slice(0, 10));

  // SEO helpers shared with the soccer and Races Near sites (lib/seo.js).
  const seo = require('./lib/seo.js'), pages = require('./lib/pages.js'), site = require('./src/_data/site.json');
  const { ogKey } = require('./lib/og.js');
  c.addFilter('seoTitle', s => seo.seoTitle(s));
  c.addFilter('seoDesc', s => seo.seoDesc(s));
  c.addFilter('ogImage', url => `${site.url}/og/${ogKey(url)}.png`);
  c.addFilter('xml', s => seo.plain(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
  c.addFilter('sortByChecked', ts => [...ts].sort((a, b) => (tv.local[b.slug].checked || '').localeCompare(tv.local[a.slug].checked || '') || a.full.localeCompare(b.full)));
  c.addFilter('rfc822', d => new Date(typeof d === 'string' && d.length === 10 ? d + 'T12:00:00Z' : d).toUTCString());
  // Visible "Updated" date; scripts/postbuild.mjs fills it (and dateModified, sitemap lastmod) from lastmod.json.
  c.addShortcode('updated', () => '<p class="upd">Updated <time datetime="__LASTMOD_ISO__">__LASTMOD__</time></p>');
  // One JSON-LD graph per page: Organization + WebSite by @id, the page node with dateModified, ItemList on hubs,
  // FAQPage where a FAQ is shown, SportsTeam + next SportsEvents on team pages, AboutPage on /about/.
  c.addFilter('pageGraph', d => {
    const url = site.url + d.url, og = `${site.url}/og/${ogKey(d.url)}.png`;
    const org = { '@type': 'Organization', '@id': site.url + '/#org', name: site.name, url: site.url + '/', logo: { '@type': 'ImageObject', url: site.url + '/logo.png', width: 512, height: 512 }, email: site.email, sameAs: [site.newsletterUrl].filter(Boolean) };
    const web = { '@type': 'WebSite', '@id': site.url + '/#website', name: site.name, url: site.url + '/', publisher: { '@id': org['@id'] }, inLanguage: 'en-US' };
    const items = d.list === 'teams' ? pages.teamItems() : d.list === 'moved' ? pages.teamItems(tv.teams.filter(t => tv.local[t.slug].fdsn).map(t => t.slug)) : d.list === 'tonight' ? pages.tonightItems() : null;
    const pg = { '@type': d.kind || (items ? 'CollectionPage' : 'WebPage'), '@id': url + '#webpage', url, name: seo.seoTitle(d.title), description: seo.seoDesc(d.description), isPartOf: { '@id': web['@id'] }, inLanguage: 'en-US', primaryImageOfPage: { '@type': 'ImageObject', url: og }, dateModified: '__LASTMOD_ISO__' };
    if (d.kind === 'AboutPage') pg.about = { '@id': org['@id'] };
    if (d.kind === 'NewsArticle' || d.kind === 'Article') {
      Object.assign(pg, { headline: seo.seoTitle(d.title), author: { '@type': 'Organization', name: d.author || site.name, url: site.url + '/about/' }, publisher: { '@id': org['@id'] }, image: og });
      if (d.date) pg.datePublished = new Date(d.date).toISOString();
      const gs = (d.games || []).map(id => tv.all().find(x => x.id === String(id))).filter(Boolean);
      if (gs.length) pg.about = gs.map(pages.event);
      if (d.teamsMentioned) pg.mentions = d.teamsMentioned.map(a => tv.byAbbr[a]).filter(Boolean).map(t => ({ '@type': 'SportsTeam', name: t.full, url: `${site.url}/teams/${t.slug}/` }));
    }
    if (items && items.length) pg.mainEntity = { '@type': 'ItemList', numberOfItems: items.length, itemListElement: items };
    const g = [org, web, pg];
    if (d.t) { const tn = pages.teamNodes(d.t); pg.about = { '@id': tn[0]['@id'] }; g.push(...tn); }
    if (d.faqs && d.faqs.length) g.push({ '@type': 'FAQPage', '@id': url + '#faq', mainEntity: d.faqs.map(x => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })) });
    return JSON.stringify({ '@context': 'https://schema.org', '@graph': g }).replace(/</g, '\\u003c');
  });
  c.addTransform('crumbsLd', function (html) {
    if (!(this.page.outputPath || '').endsWith('.html')) return html;
    const ld = seo.crumbsLd(html, this.page.url, site.url);
    return ld ? html.replace('</head>', ld + '</head>') : html;
  });
  // Email CTA with fallbacks for visitors whose browser has no default mail app: mailto button, Copy email, visible address, Gmail/Outlook web compose.

  // Guides: TOC ids, collection, and prose helpers (ported from soccer, NBA-styled).
  const sl = s => String(s).replace(/<[^>]+>/g, '').toLowerCase().replace(/&[a-z#0-9]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  c.addFilter('withIds', html => html.replace(/<h2>(.*?)<\/h2>/g, (m, x) => `<h2 id="${sl(x)}">${x}</h2>`));
  c.addFilter('toc', html => [...html.matchAll(/<h2>(.*?)<\/h2>/g)].map(m => ({ id: sl(m[1]), text: m[1].replace(/<[^>]+>/g, '') })));
  c.addCollection('guides', api => api.getFilteredByGlob('src/guides/*.md').sort((a, b) => {
    const t = g => new Date(g.data.updated || g.date).getTime() || 0;
    return (t(b) - t(a)) || ((a.data.order || 99) - (b.data.order || 99));
  }));

  // News: daily tonight previews and scores recaps under /news/ (written by the morning routine).
  c.addCollection('news', api => api.getFilteredByGlob('src/news/*.md').sort((a, b) => (b.date - a.date) || a.data.title.localeCompare(b.data.title)));
  // Team mention in team colors, linked to the team page: {% team "BOS" %} or {% team "BOS", "Boston Celtics" %}.
  c.addShortcode('team', (abbr, label) => {
    const t = tv.byAbbr[abbr]; if (!t) throw new Error('team shortcode: unknown team ' + abbr);
    return `<a class="tmn" href="/teams/${t.slug}/" style="--c1:${color.safeBg(t.c1)};--c2:${t.c2}">${label || t.name}</a>`;
  });

  c.addShortcode('emailOptions', (subject = '', label = 'Email us') => {
    const to = 'hello@howtowatchnba.com', e = encodeURIComponent, q = s => s.replace(/&/g, '&amp;');
    const mailto = `mailto:${to}${subject ? `?subject=${e(subject)}` : ''}`;
    const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${e(to)}${subject ? `&su=${e(subject)}` : ''}`;
    const outlook = `https://outlook.office.com/mail/deeplink/compose?to=${e(to)}${subject ? `&subject=${e(subject)}` : ''}`;
    return `<div class="emo"><p class="emobtns"><a class="btn" href="${q(mailto)}">${label}</a><button type="button" class="btn2 ecopy" data-email="${to}">Copy email</button></p>`
      + `<p class="emoalt"><span class="emaddr">${to}</span><span class="emweb">No mail app? <a href="${q(gmail)}" target="_blank" rel="noopener">Open in Gmail</a> · <a href="${q(outlook)}" target="_blank" rel="noopener">Open in Outlook</a></span></p></div>`;
  });
  return { dir: { input: 'src', includes: '_includes', data: '_data', output: '_site' }, templateFormats: ['njk', 'md', '11ty.js'], markdownTemplateEngine: 'njk', htmlTemplateEngine: 'njk' };
};
