# Races This Weekend (working name)

A multi-metro race calendar: this weekend, the next 30 days, and early-bird price deadlines in 10 US metros.
Same stack as howtowatchsoccerusa / howtowatchnba: Eleventy 3, Cloudflare Pages (not deployed yet), beehiiv (not set up yet).

## Commands
- `npm run data`: refresh `src/_data/races.json` from the RunSignup public API (one radius query per metro centre in `src/_data/metros.json`) plus `src/_data/curated.json` (hand-checked majors not on RunSignup).
- `npm run build`: build to `_site` (about 2,350 pages).
- `npm run check`: internal link check.
- QA: `node /workspace/.pwtool/races-qa.js http://localhost:8795` (axe at 1280/375, overflow at 320/375, screenshots) and `node /workspace/.pwtool/burger.js http://localhost:8795 races /workspace/screens/bayarearaces`.

## Config to fill in before launch (`src/_data/site.json`)
- `name`, `domain`, `url`, `email`, `logoA/B/C`: currently placeholders for racesthisweekend.com. Also update `src/robots.txt`.
- `newsletterUrl`: beehiiv subscribe URL. Empty = "Coming soon" band and a /newsletter/ page.
- `runsignupAffiliateToken`: when set, RunSignup links get `?aflt_token=` and rel=sponsored.
- `cfAnalyticsToken`.

## Newsletter plan: one publication, metro segments
One beehiiv publication. Every signup link carries `utm_campaign=<metro-slug>` (see the `nlUrl` filter). A beehiiv automation (or a custom field "metro" on an embed form) tags each subscriber with their metro; each Thursday send goes to one segment per metro with that city's weekend races and price increases. One list, one sender reputation, one sponsor deck, with per-city sponsor slots.

## Deploy notes (when approved)
- Cloudflare Pages build command `npm run data && npm run build`, output `_site`, NODE_VERSION 20, plus a daily deploy hook so "this weekend" and prices stay fresh.

## Later phase (not built)
- Run-club directory per metro (/bay-area/run-clubs/): name, meet day/time, pace, vibe, Strava/Instagram link. Note runvibe.co already lists run clubs by metro, so ours should tie clubs to races (club race teams, group signups).
- More sources: Race Roster, UltraSignup, ACTIVE (respect their terms); more metros (Atlanta, Minneapolis, Philadelphia were next in line).
