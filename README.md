# How to Watch NBA

Source code for **[howtowatchnba.com](https://howtowatchnba.com)**: where is my NBA team on TV this season?

The 2026-27 season reshuffled local NBA TV. FanDuel Sports Network shut down, 13 teams found new homes and many signed one-year deals. The site gives US (and Raptors) fans a fast answer: tonight's games with channels, every team's local TV and streaming option, national windows, and a ZIP blackout checker for League Pass.

- **Live site:** https://howtowatchnba.com
- **Repo:** https://github.com/rchrdchn/howtowatchnba (branch `main`)
- **Newsletter:** https://howtowatchnba.beehiiv.com/subscribe
- **Contact:** hello@howtowatchnba.com

## How the site makes money

1. **Sponsors.** `/advertise/` sells a newsletter sponsor slot (one per weekly issue), banners on team pages and sponsorship of the tonight grid. Paid placements are labeled sponsored.
2. **Affiliates (planned).** No affiliate links are live yet. The About page says some links may become affiliate links and will be labeled. When a program approves us (for example a streaming service or League Pass partner), tag only that service's links and use `rel="sponsored nofollow noopener"`, the same as the soccer site.

### Affiliate status tracker (as of Oct 21, 2026)

No programs applied yet. NBA streaming affiliate programs (League Pass, regional sports networks, live TV services) have not been researched yet. The shared Awin publisher account (Tiny Labs LLC, 3126478) is approved and can be used here.

| Program | Site | Applied | Status | Next step |
|---|---|---|---|---|
| NBA streaming programs | NBA | – | Not researched | Research programs, then apply with owner approval |

Editorial rule: legal, licensed viewing only, and money never changes what a page says about where a game airs.

## Tech stack

- [Eleventy](https://www.11ty.dev/) 3 with Nunjucks (the only dependency)
- Plain CSS (`src/assets/style.css`) and vanilla JS (`src/assets/site.js`: header, burger, blackout checker). Self-hosted Bricolage Grotesque font.
- Node 20
- GitHub Actions for the nightly schedule refresh and IndexNow ping
- Cloudflare Pages hosting, Cloudflare Email Routing for hello@
- beehiiv newsletter

## Folder structure

```
.
├── .github/workflows/nightly.yml  Nightly schedule refresh, build, check, commit, IndexNow (2:15 AM PT)
├── lib/
│   ├── tv.js                      Channel logic: national windows from ESPN + local channels, tonight grid, times
│   ├── pages.js                   Data-driven FAQs, ItemLists, SportsTeam and SportsEvent schema
│   ├── seo.js                     Title (≤65) and description (≤160) helpers, BreadcrumbList from crumbs (shared)
│   ├── og.js                      Which share image a URL uses
│   └── color.js                   WCAG helpers: darken team colors just enough for AA contrast
├── scripts/
│   ├── fetch-schedule.mjs         ESPN scoreboard feed to src/_data/schedule.json (npm run schedule)
│   ├── check.mjs                  Internal link check over _site (npm run check)
│   ├── og.mjs                     Share images to _site/og/ and /logo.png (runs in npm run build)
│   ├── postbuild.mjs              Head checks, real lastmod from content hashes, .indexnow.json (runs in npm run build)
│   └── indexnow.mjs               Pings IndexNow with changed URLs (npm run indexnow; --all for every URL)
├── src/
│   ├── _data/
│   │   ├── schedule.json          Generated season schedule with national TV (do not edit by hand)
│   │   ├── localTv.json           Hand-checked local TV for all 30 teams
│   │   ├── prices.json            Checked prices only (national services, League Pass, Prime, every team's local stream) with source + checked date, used by the cheapest-way tool
│   │   ├── teams.json             Names, ESPN abbreviations, slugs, brand colors
│   │   ├── zipMarkets.json        3-digit ZIP prefix to home team(s), for the blackout checker
│   │   ├── week.json              The weekly national TV pattern (Mon to Sun)
│   │   ├── site.json              Name, URL, email, season, localChecked date, newsletterUrl, IndexNow key name
│   │   └── build.js               Build time and cache-busting version
│   ├── _includes/
│   │   ├── base.njk               Layout: head, sticky header, burger menu, footer with 30 team chips
│   │   ├── tonight.njk            Tonight grid (who's on, where)
│   │   ├── checker.njk            ZIP + team blackout checker (the only select on the site)
│   │   ├── tiles.njk, week.njk    Team tiles and the national week strip
│   │   ├── moved.njk              "Where every team moved" table
│   │   └── newsletter.njk         Newsletter band
│   ├── index.njk                  Home: tonight, checker, week strip, team tiles
│   ├── tonight.njk                /tonight/
│   ├── teams.njk, team.njk        /teams/ and one page per team (team.11tydata.js adds FAQ and colors)
│   ├── moved.njk                  /moved/ where every team's local TV went
│   ├── which-night.njk            /which-night/ national TV by night
│   ├── blackouts.njk              /blackouts/ League Pass blackout checker
│   ├── tools/                     Free tools: cheapest-way-to-watch-your-team.njk + .11tydata.js (see Free tools)
│   ├── markets.11ty.js            Builds /assets/markets.json for the in-browser checker
│   ├── about.md, advertise.md, contact.md, privacy.md, 404.njk
│   ├── index/tonight/blackouts/which-night.11tydata.js  Data-driven FAQs for those pages
│   ├── feed.njk, llms.11ty.js     /feed.xml (local TV checks) and /llms.txt
│   ├── sitemap.njk, robots.txt, site.webmanifest, favicon.svg
│   ├── _headers                   Security and font caching headers
│   └── <key>.txt                  IndexNow key file
├── lastmod.json                   Content hash and last-changed time per URL (committed by the nightly job)
└── eleventy.config.js             Filters (local, forTeam, grid, pt, safeBg, ...) and passthrough copy
```

`_site/` and `node_modules/` are git-ignored.

## Data and how it refreshes

| File | Source | Updated |
|---|---|---|
| `schedule.json` | ESPN's public scoreboard feed (unofficial, no license). One request per day of the season, about 1,200 games. | Nightly, automatic |
| `localTv.json` | Team announcements, station releases, trade press | By hand, weekly |
| `prices.json` | Each provider's own price page (URL and checked date stored per price). Peacock and ESPN match the soccer site's `services.json` | By hand; recheck before each season and when a provider announces a change |
| `zipMarkets.json` | Hand-built approximation of team markets | Rarely |
| `week.json` | National TV deals | When the pattern changes |

National exclusives are NBC, NBCSN, Peacock, ESPN, ABC and Prime Video; those replace local TV. NBA TV is not exclusive, so local channels still carry it.

`localTv.json` fields per team: `tv`, `short`, `row` (antenna, dazn, local or lp; drives the tonight grid label), `stream`, `free`, `dazn`, `fdsn`, `prev`, `notes`, `unconfirmed[]`, `status`, `checked`, `sources[]`. Anything not confirmed goes in `unconfirmed` and shows on the site. After a check, bump `localChecked` in `site.json`.

### Nightly refresh

`.github/workflows/nightly.yml` runs at 09:15 UTC (2:15 AM PDT, 1:15 AM PST) and on demand:

1. `npm ci`, `npm run schedule`, `npm run build`, `npm run check`
2. Commits `src/_data` and `lastmod.json` to `main` if anything changed. The push deploys on Cloudflare Pages, and "tonight" rolls over to the new day.
3. Waits until the live sitemap shows this build's lastmod time (up to 10 minutes), then pings IndexNow with only the new, changed or removed URLs.

Safeguards:

- Each day's feed request retries 3 times.
- If fewer than 10 games come back, the script keeps the existing `schedule.json`.
- If the build or link check fails, nothing is committed and the live site keeps the previous version.

## Content types

- **Generated pages:** home, tonight, 30 team pages, teams index, moved, which-night, blackouts.
- **Static pages** in Markdown: about, advertise, contact, privacy.
- **Posts and guides:** guides live in `src/guides/` (hub `/guides/`). Daily posts live in `src/news/` (hub `/news/`, layout `src/_includes/post.njk`): a "How to Watch NBA Tonight" preview on game days (`postType: preview`) and an "NBA Scores & Results" recap the morning after (`postType: recap`), written by the morning routine. Front matter `games` (ESPN game ids) becomes SportsEvent schema and `teamsMentioned` becomes `mentions`; `{% team "BOS" %}` renders a team-colored link to the team page.

### Adding a page

Create `src/<slug>.md` (or `.njk`):

```yaml
---
layout: base.njk
permalink: /<slug>/
title: "Page Title | How to Watch NBA"
description: "One or two sentences for search results."
---
<div class="wrap prose">
<p class="crumbs"><a href="/">Home</a> / Page</p>

# Page title
...
</div>
```

Add it to the nav or footer in `base.njk` if needed. The sitemap picks up every page that ends in `/`.

## Free tools

### Cheapest way to watch your team: `/tools/cheapest-way-to-watch-your-team/`

- **What it does:** pick a team, say whether you live in its home area (or type a ZIP, which sets that using the approximate `zipMarkets.json` map), and tick local, NBC/Peacock, ESPN/ABC and Prime Video games. It lists each service with how many of that team's games it carries, monthly and season cost, and how many games are free with an antenna.
- **Data:** game counts per team from `schedule.json` (NBC, NBCSN and Peacock = Peacock; ESPN, ESPN2 and ABC = ESPN Unlimited; Prime Video; everything else is local, and NBA TV games still air locally). Local channel, stream and free-TV details from `localTv.json`. Season length = the months the team's schedule spans (7, October to April).
- **Prices:** `src/_data/prices.json` holds checked prices only. Each entry in `services` has `name`, `price` (monthly), `annual` (season or yearly plan, or null), `annualLabel`, `note`, `source` (the provider page it was read on) and `checked`. `local` maps each team slug to its in-market stream (`svc`), plus `base` when the stream is an add-on that needs another service (the NBC Sports networks need Peacock), `free` for antenna-only teams with no paid stream, and `lp` for the Raptors (League Pass in the US). All prices below were checked Oct 18, 2026 (ESPN Unlimited on Oct 17):
  - National: Peacock Premium $12.99/mo or $129.99/yr; ESPN Unlimited $31.99/mo or $319.99/yr; Amazon Prime $14.99/mo or $139/yr (standalone Prime Video $8.99/mo is listed but not used, since Amazon's NBA help page says the games are for Prime members).
  - NBA League Pass $16.99/mo or $109.99/season; Premium $24.99/mo or $159.99/season; Team Pass $13.99/mo. All black out local and national games (nba.com/league-pass-purchase and the NBA Team Pass help article).
  - Local streams: NBC Sports Boston $14.95, Bay Area $17.95, California $17.95, Philadelphia $24.95 (Peacock add-ons, monthly); YES on DAZN $19.99/mo or Nets Season Pass $119.99; MSG+ on DAZN $29.99/mo or $279.99; CHSN Bulls Only $19.99/mo; Altitude+ $19.95/mo or $199.99/yr; SCHN+ $19.99/mo or $199.99/yr; ClipperVision $14.95/mo or $89.95; Spectrum SportsNet+ $19.99/mo or $199.99; Thunder+ $19.99/mo or $108.99; Monumental+ $19.99/mo or $179.99/yr; MavsTV+ $14.99/mo or $99.99; Bucks+ $19.99/mo or $99.99; Pelicans+ $14.99/mo or $104.99 (early bird $99.99 to Oct 21); Suns+ $14.99/mo or $109.99; BlazerVision $19.99/mo or $120; Jazz+ $19.99/mo or $124.99/yr; DAZN team packages (Cavs, Pacers, Grizzlies, Timberwolves, Spurs, Hornets, Magic, Pistons) $19.99/mo or $119.99/season.
  - Free: Hawks and Heat local games are over the air (Heat's Local 10+ Platinum app is free in South Florida). No team needs a cable or live TV bundle as its only option, so none is priced.
  - **How totals work:** season = monthly x months (7) or the season/yearly price if cheaper. In market, antenna teams count as free (the stream price is shown as an option). Out of market, the tool picks the cheaper of Team Pass and League Pass. Peacock is counted once even when it is both the NBC service and the base for an NBC Sports add-on. Anything without a checked price shows "Price not in our data yet" and is left out of totals.
- **Files:** `src/tools/cheapest-way-to-watch-your-team.njk`, `.11tydata.js` (team counts, FAQ, WebApplication schema), `src/assets/team-cost.js`, `.tc-*` rules at the end of `src/assets/style.css`.
- **No JS:** the form is hidden; the per-team table (local channel and game counts by network) and the price table carry the answer.
- **Plumbing:** footer Tools list, a link on every team page (`?team=<slug>` preselects the team), home "Every team's channel" note and `/blackouts/`. In the sitemap automatically and listed in `src/llms.11ty.js`. Share image `og/tool-cheapest-way-to-watch-your-team.png` (`TOOLS` in `lib/og.js`).

## Local setup

```bash
# Node 20 (same as CI)
npm ci
npm run dev        # http://localhost:8080 with live reload
npm run schedule   # optional: refresh schedule.json (about 1 request per day, a few seconds)
npm run build      # build to _site/
npm run check      # internal link check
```

Preview another night: `BUILD_NOW=2026-10-21T16:00:00Z npm run build`.

## Deploy

- **Host:** Cloudflare Pages, project `howtowatchnba`, connected to this repo.
- **Production branch:** `main`; every push deploys. Preview URL: `howtowatchnba.pages.dev`.
- **Build command:** `npm run build` | **Output:** `_site` | **Node:** `NODE_VERSION=20`
- **Domains:** `howtowatchnba.com` (canonical). `www.howtowatchnba.com` returns a 301 to the apex through a Cloudflare redirect rule.
- **Analytics:** Cloudflare Web Analytics. Set `cfAnalyticsToken` in `site.json` only if you want the manual beacon instead of the Pages dashboard setting.
- Pushing from the build box: `git -c credential.helper= -c credential.helper='!/usr/local/bin/gh auth git-credential' push`.

## SEO

- **Titles and descriptions** go through `lib/seo.js`: titles 65 characters or less, descriptions 160 or less, entities decoded once.
- **Build checks** (`scripts/postbuild.mjs`): the build fails on double-escaped entities in `<head>`, long titles or descriptions, or a `dateModified` without a visible Updated line.
- **Real lastmod:** each page's title, description and main content are hashed. Only pages whose hash changed get a new time in `lastmod.json`. That time feeds the sitemap `<lastmod>`, the visible "Updated" line under each H1 and `dateModified` in JSON-LD, so all three match.
- **Structured data:** one graph per page with `Organization`, `WebSite` and the page node. Team pages add `SportsTeam` and the next five games as `SportsEvent` with the TV channel. `/teams/`, `/moved/` and `/tonight/` add an `ItemList`. FAQs (home, tonight, blackouts, which-night, team pages) are visible and marked up as `FAQPage`. Breadcrumbs come from the `crumbs` line.
- **Share images:** 1200x630 cards per team and section in `/og/`, built by `scripts/og.mjs` with sharp.
  - **News posts get their own card** (`og/news-<slug>.png`), so each preview or recap shows a scoreboard when shared. It's dark and high contrast and readable at thumbnail size: the date, a TONIGHT ON TV or FINAL SCORES pill, up to three matchups with team-color chips (no logos), then "+N more games".
  - **Matchups** come from `games` (via `schedule.json`). If those games have aged out of the schedule, the card pairs up `teamsMentioned` and shows "vs".
  - **Recap scores** are read from the post's own text, either "76ers 114, Cavaliers 106" or "the Pistons beat the Celtics 121-113".
  - **Previews** list national TV games first, with tip time and network.
  - **Override:** add `card: { kicker: "...", rows: [["PHI", 114, "CLE", 106]] }` to the front matter when a recap's wording doesn't match those patterns. Each row is winner, score, loser, score.
  - **No extra step for the morning routine.** Any new `.md` in `src/news/` gets a card and absolute `og:image` / `twitter:image` tags on the next build. `lib/og.js` maps `/news/<slug>/` to `news-<slug>`.
  - **Article tags:** news pages also send `og:type=article` and `article:published_time`.
- **AI search:** `/llms.txt` and `/feed.xml` rebuild with every deploy. `robots.txt` allows every crawler and names the main search and AI bots explicitly.
- **IndexNow:** the nightly job pings only changed URLs. `npm run indexnow -- --all` sends the full sitemap. The key name is `indexNowKey` in `site.json` and the file is `src/<key>.txt`.
- **Google Search Console:** owned by the site owner. Resubmit `/sitemap.xml` after big changes.

## Newsletter

beehiiv publication at https://howtowatchnba.beehiiv.com/subscribe (`newsletterUrl` in `site.json`). The header Free email pill and the newsletter band link there in a new tab. If `newsletterUrl` is empty, the band hides the button.

## Email

`hello@howtowatchnba.com` (`site.email`) uses Cloudflare Email Routing and forwards to the owner's inbox. Advertise and contact pages show the address with Copy email and Gmail / Outlook compose fallbacks.

## Recurring routines

Times are Pacific.

| What | When | How |
|---|---|---|
| Schedule refresh, deploy, IndexNow | Daily 2:15 AM | GitHub Action |
| Pre-game post (tonight's games and channels) | Daily, about 7 AM | Scheduled routine |
| Post-game post | Daily, after games | Scheduled routine |
| Weekly guide | Monday, about 7:30 AM | Scheduled routine |
| Local TV re-check (`localTv.json`, `localChecked`) | Weekly | By hand from sources |

## Common tasks and troubleshooting

- **A team's channel changed:** edit its entry in `localTv.json` (add the source, update `checked`), bump `localChecked`, build, check, push.
- **A detail is unconfirmed:** put it in that team's `unconfirmed` list instead of guessing.
- **Blackout checker shows the wrong team:** fix the prefix in `zipMarkets.json`. The NBA's guide stays linked as the final word.
- **Tonight shows yesterday:** the nightly Action probably failed. Check the Actions tab and run the workflow by hand.
- **Schedule looks short:** ESPN may be down; the script refuses to overwrite with fewer than 10 games. Rerun later.
- **Push rejected:** pull with rebase first, since the nightly bot commits to `main`.
- **Low contrast on a team color:** use the `safeBg` and `bestText` filters rather than raw brand colors.

## Shared patterns across our 3 sites

We run three sister sites built the same way: howtowatchsoccerusa.com, howtowatchnba.com and racesnear.com. They share layout patterns on purpose, so **any fix on one site gets checked and applied on the other two** in the same session.

| Pattern | What it is | Where it lives |
|---|---|---|
| Sticky header | Logo, nav links, a dark Advertise pill and a colored "Free email" pill that opens the beehiiv subscribe page in a new tab (`rel="noopener"`). | `src/_includes/base.njk`, header rules in `src/assets/style.css` |
| Burger menu (1100px and below) | Logo + Free email + a 44px burger. The panel opens under the sticky header with stacked full-width links and Advertise at the bottom. Closes on X, Esc, link tap or outside tap; locks scroll, moves focus into the menu and loops Tab. Without JS it falls back to a swipeable link row. | `src/assets/site.js` + `base.njk` |
| Newsletter CTAs | Header pill, a signup band near the footer and inline blocks all point to the beehiiv subscribe URL, new tab. | `base.njk`, newsletter include, `site.json` |
| Email fallbacks | `mailto:` links plus a Copy email button, the visible address, and Gmail / Outlook web compose links, for visitors without a mail app. | Advertise and contact pages, footer |
| Select dropdowns | `appearance:none` with a custom SVG chevron in the site's ink color at `right 16px center` (soccer: 15px), `padding-right:44px`. Never set a `background:` shorthand on a select after this rule, because it wipes the chevron image. Use `background-color` instead. | `src/assets/style.css` |
| Light theme only | No dark mode on any site. Each site has its own palette. | `:root` variables in `style.css` |
| Copy rules | Short paragraphs, no em dashes, no owner name in site copy or drafts. | Everywhere |
| Free tools | One page per tool under `/tools/<name>/`: answer-first intro with real numbers, the live calculator (vanilla JS, no libraries, data embedded at build time), a static table or formula that works without JS, How it works, FAQ (FAQPage) plus WebApplication JSON-LD, newsletter box, own share image (`og/tool-<name>.png` or `og/tools-<name>.png`). Linked from the footer, home, related hubs/team pages and guides; listed in the sitemap and llms.txt. `?team=<slug>` preselects a team on the two cost tools. Never show a price that is not in the site's checked data. | `src/tools/`, `src/assets/<tool>.js` |
| QA before push | Build, internal link check, axe (contrast and names) and an overflow check at 320/375/1280 with Playwright, then verify live after the Pages deploy. | Playwright helpers live outside the repos, in `/workspace/.pwtool/` on the build box |
