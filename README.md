# howtowatchnba.com

Eleventy site: "where is my team on TV this year". Local build only; not deployed yet.

## Commands
- `npm run schedule`: pull the season schedule + national TV from ESPN's public scoreboard feed into `src/_data/schedule.json` (one request per day, ~3 s).
- `npm run build`: build to `_site/`. `BUILD_NOW=2026-10-21T16:00:00Z npm run build` previews another night.
- `npm run check`: internal link check. `npm run indexnow`: ping IndexNow after deploy (key file is `src/<key>.txt`).

## Data
- `src/_data/schedule.json`: ESPN feed (unofficial, no license). National exclusives = NBC, NBCSN, Peacock, ESPN, ABC, Prime Video. NBA TV is non-exclusive.
- `src/_data/localTv.json`: hand-checked local TV for all 30 teams: `tv`, `short`, `row` (antenna | dazn | local | lp, used by the tonight grid), `stream`, `free`, `dazn`, `fdsn`, `prev`, `unconfirmed[]`, `status`, `checked`, `sources[]`. Re-check weekly; anything not confirmed goes in `unconfirmed` and shows on the site.
- `src/_data/zipMarkets.json`: approximate 3-digit ZIP prefix -> home team map for the blackout checker. NBA's guide is linked as the final word.
- `src/_data/teams.json`: names, ESPN abbreviations, brand colors.
- `src/_data/site.json`: set `cfAnalyticsToken` (Cloudflare Web Analytics) and `newsletterUrl` (e.g. a beehiiv subscribe URL) before launch.

## Deploy (later)
Cloudflare Pages, build `npm run schedule && npm run build`, output `_site`. Nightly rebuild via deploy hook, like the soccer site.
