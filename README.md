# racesnear.com

Races Near: a multi-metro race calendar for planning ahead. Upcoming races (next 90 days), season and month hubs, early-bird price deadlines and this weekend, in 10 US metros.
Same stack as howtowatchsoccerusa / howtowatchnba: Eleventy 3, Cloudflare Pages, GitHub Actions nightly refresh. Newsletter (beehiiv) not set up yet; the Free email button points to /newsletter/.

## Commands
- `npm run data`: refresh `src/_data/races.json` from the RunSignup public API (one radius query per metro centre in `src/_data/metros.json`) plus `src/_data/curated.json` (hand-checked majors not on RunSignup).
- `npm run build`: build to `_site` (about 2,570 pages).
- `npm run check`: internal link check.
- `npm run indexnow`: ping IndexNow with every sitemap URL after a deploy (key file `src/<indexNowKey>.txt`).
- QA: `node /workspace/.pwtool/races-qa.js http://localhost:8795` (axe at 1280/375, overflow at 320/375, screenshots to /workspace/screens/racesnear) and `node /workspace/.pwtool/burger.js http://localhost:8795 races /workspace/screens/racesnear`.

## Pages
- `/` upcoming races near you: city picker, next 90 days per city, early-bird deadlines, month and season hubs, this weekend.
- `/upcoming/` next 3 months across all cities; `/upcoming/<month>-<year>/` site-wide month hubs.
- `/<metro>/` upcoming races near the city (next 90 days with filters), `/<metro>/<distance>/`, `/<metro>/<season>-races/`, `/<metro>/<season>-<distance>/` (e.g. `/nyc/fall-marathons/`), `/<metro>/<year>/<month>/`, `/<metro>/<area>/`, `/<metro>/this-weekend/`, `/<metro>/races/<slug>/`.
- `/this-weekend/`, `/price-increases/`, `/guides/`, `/about/`, `/advertise/`, `/newsletter/`.

## Config (`src/_data/site.json`)
- `newsletterUrl`: beehiiv subscribe URL. Empty = "Coming soon" band and the /newsletter/ page.
- `runsignupAffiliateToken`: when set, RunSignup links get `?aflt_token=` and rel=sponsored.
- `cfAnalyticsToken`: Cloudflare Web Analytics token (empty = no beacon).

## Deploy
- GitHub `rchrdchn/racesnear`, Cloudflare Pages project `racesnear`: build `npm run build`, output `_site`, NODE_VERSION 20. Push to main deploys production.
- Nightly GitHub Action (`.github/workflows/nightly.yml`, 3:05 AM PT): `npm run data`, stamp `src/_data/nightly.json`, build + link check, commit and push (Pages redeploys, so "this weekend" and the 90-day window roll forward), then IndexNow. If the fetch fails or the race count drops more than 30%, it keeps yesterday's races.

## Newsletter plan: one publication, metro segments
One beehiiv publication. Every signup link carries `utm_campaign=<metro-slug>` (see the `nlUrl` filter). A beehiiv automation tags each subscriber with their metro; each send goes to one segment per metro.

## Later phase (not built)
- Run-club directory per metro, tied to races.
- More sources: Race Roster, UltraSignup, ACTIVE (respect their terms); more metros (Atlanta, Minneapolis, Philadelphia).
