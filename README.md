# Races Near

Source code for **[racesnear.com](https://racesnear.com)**: a running race calendar for planning ahead.

Runners pick a city and see every upcoming race in the next 90 days, plus season and month hubs, early-bird price deadlines and what's on this weekend. The audience is everyday runners (5K to marathon, road and trail) in 10 US metros: Bay Area, New York City, Los Angeles, Chicago, Boston, Washington DC, Seattle, Denver/Boulder, Austin and San Diego.

- **Live site:** https://racesnear.com
- **Repo:** https://github.com/rchrdchn/racesnear (branch `main`)
- **Newsletter:** https://racesnear.beehiiv.com/subscribe
- **Contact:** hello@racesnear.com

## How the site makes money

1. **RunSignup affiliate.** Races Near is a RunSignup affiliate. Every `runsignup.com` link gets an affiliate token appended (stored as `runsignupAffiliateToken` in `src/_data/site.json`; never paste it into docs or chats). RunSignup pays a share of the processing fee on registrations within 30 days of the click. Only RunSignup links are tagged: the `aff()` helper checks the link host. Tagged links use `rel="sponsored noopener"` and the footer and `/about/#affiliate-links` disclose it.
2. **Other affiliate programs.** ACTIVE Network (applied, pending), Ahotu / World's Sports Group (terms received, waiting on how to apply) and Race Roster Promoter (per-event, organizer-set rewards; not applied). Drafts live in the git-ignored `outreach/` folder.

### Affiliate status tracker (as of Oct 21, 2026)

| Program | Site | Applied | Status | Next step |
|---|---|---|---|---|
| RunSignup (affiliate ID 911) | Races Near | Before launch | Active; links live since `d9e32cc` | Keep tagging RunSignup links |
| ACTIVE Network | Races Near | Oct 17 | Pending | Submit W-9 after approval, then add links |
| Ahotu / World's Sports Group | Races Near | Inquiry; terms received Oct 20 | Terms: 20% of Ahotu's 20% margin (about 4% of the order). Follow-up sent Oct 20 asking how to apply, how tracking links work and whether there's a race feed | Wait for reply |
| Awin publisher account (Tiny Labs LLC, 3126478) | All | Oct 16 | Approved; no race brands joined | Look for running brands if useful |
| Race Roster Promoter | Races Near | – | Not applied | Revisit later |
3. **Sponsors.** `/advertise/` sells featured race listings, a newsletter sponsor slot and price-increase alerts, with launch pricing. Paid placements are labeled.

Rule: money never changes which races are listed or how they are sorted.

## Tech stack

- [Eleventy](https://www.11ty.dev/) 3 with Nunjucks (the only dependency)
- Plain CSS (`src/assets/style.css`) and vanilla JS (`src/assets/site.js`: header, burger, city picker, filters). Self-hosted Fraunces and Manrope fonts.
- Node 20 (`engines: >=20`)
- GitHub Actions nightly data refresh and IndexNow ping
- Cloudflare Pages hosting, Cloudflare Email Routing for hello@
- beehiiv newsletter

## Folder structure

```
.
├── .github/workflows/nightly.yml  Nightly race refresh with safeguards, build, check, commit, IndexNow (3:05 AM PT)
├── lib/util.js                    Date (Pacific), distance and URL helpers
├── scripts/
│   ├── fetch-races.mjs            RunSignup API + curated majors, merged and deduped (npm run data)
│   ├── check.mjs                  Internal link check over _site (npm run check)
│   └── indexnow.mjs               Pings IndexNow with every sitemap URL (npm run indexnow)
├── outreach/                      Affiliate drafts; git-ignored, never committed
├── src/
│   ├── _data/
│   │   ├── races.json             Generated race list (do not edit by hand)
│   │   ├── curated.json           Hand-checked majors not on RunSignup (NYRR, BAA, Rock 'n' Roll, ...)
│   │   ├── metros.json            10 metros: slug, name, state, centre ZIP, radius, areas (regions)
│   │   ├── cal.js                 Everything templates need, computed once per build (90-day lists, months, seasons, deadlines, weekend)
│   │   ├── nightly.json           Date stamp written by the nightly job so a deploy always happens
│   │   └── site.json              Name, URL, email, tagline, newsletterUrl, affiliate settings, IndexNow key name
│   ├── _includes/
│   │   ├── base.njk               Layout: head, sticky header, burger, newsletter band, footer with affiliate note
│   │   ├── macros.njk             Race cards, lists and badges
│   │   ├── newsletter.njk         Newsletter band
│   │   └── guidelist.njk          Guide grid (home and /guides/)
│   ├── index.njk                  Home: city picker, upcoming per city, deadlines, hubs, this weekend
│   ├── metro.njk                  /<metro>/ next 90 days with filters
│   ├── dist.njk                   /<metro>/<distance>/ (and per area)
│   ├── region.njk                 /<metro>/<area>/
│   ├── season.njk                 /<metro>/<season>-races/ and /<metro>/<season>-<distance>/
│   ├── month.njk                  /<metro>/<year>/<month>/
│   ├── metro-weekend.njk          /<metro>/this-weekend/
│   ├── race.njk                   /<metro>/races/<slug>/ race page with Event schema
│   ├── upcoming.njk, upcoming-month.njk, this-weekend.njk, price-increases.njk
│   ├── guides/                    Hand-written guides (Nunjucks) + guides.json defaults + index
│   ├── tools/                     Free tools: pace-calculator.njk + .11tydata.js (see Free tools)
│   ├── newsletter.njk             /newsletter/ subscribe page with per-city links
│   ├── about.md, advertise.md, privacy.md, 404.njk
│   ├── sitemap.njk, robots.txt, site.webmanifest, favicon.svg, _headers
│   └── <key>.txt                  IndexNow key file
└── eleventy.config.js             Filters (aff, affUrl, affRel, regUrl, nlUrl, ...), JSON-LD, passthrough
```

`_site/` and `node_modules/` are git-ignored. A build makes about 2,600 pages.

## Data and how it refreshes

### RunSignup

`npm run data` runs one radius query per metro centre (`zip` and `radius` in `metros.json`) against RunSignup's public race API (no key needed for public races), for today through the next window. Unauthenticated pagination stops at 1,000 results per query. Names are cleaned (title case, years stripped) and each race gets a stable slug.

### Curated majors

`src/_data/curated.json` holds big races that are not on RunSignup, verified only from the organizer's official page. Fields match the RunSignup shape plus:

- `region`: explicit area slug
- `badge`: short status on cards (Sold out, Lottery: ..., Qualifier (closed))
- `regStatus`: full registration note
- `priceNote`: "See site" or the published price
- `state`: override (for example VA for Arlington races in the DC metro)
- `checked`: date verified

The fetch script merges them in. Past curated entries drop out automatically. A curated race is skipped when RunSignup lists the same race (same metro, same date, near-identical name). Charity-team, bib, virtual and volunteer pages never count as a match. The script logs "Curated: N listed, N deduped, N past".

### Nightly refresh

`.github/workflows/nightly.yml` runs at 10:05 UTC (3:05 AM PDT, 2:05 AM PST) and on demand:

1. `npm ci`, then `npm run data`.
2. Writes today's Pacific date to `nightly.json`, so there is always a commit and "this weekend", the 90-day window and deadlines roll forward.
3. `npm run build` and `npm run check`, then commits `src/_data` to `main`. The push deploys on Cloudflare Pages.
4. Waits for the deploy (polls the key file for up to 10 minutes) and runs `npm run indexnow`.

Safeguards:

- If the fetch fails, yesterday's `races.json` is restored and the job continues.
- If the race count drops more than 30%, yesterday's data is kept.
- If the build or link check fails, nothing is committed.

## Content types

- **Generated pages:** metro, distance, area, season, month, weekend and one page per race, plus site-wide upcoming and price-increase pages.
- **Guides:** hand-written Nunjucks pages in `src/guides/` that pull live lists from `cal`.

### Adding a guide

Create `src/guides/<name>.njk`. `guides.json` sets the layout and the `guide` tag.

```yaml
---
permalink: /guides/best-fall-half-marathons-bay-area-2026/
short: "Best fall half marathons in the Bay Area 2026"   # label in guide lists
title: "Best Fall Half Marathons in the Bay Area 2026 | Races Near"
description: "One or two sentences for search results."
date: 2026-10-17
nlMetro: bay-area                                        # newsletter link tagged for this city
---
{% import "macros.njk" as k %}
<div class="wrap prose">
<p class="crumbs"><a href="/">Home</a> / <a href="/guides/">Guides</a> / ...</p>
<h1>...</h1>
...
</div>
```

The guide shows up on `/guides/`, the home page and the sitemap.

### Adding a curated race

Add an entry to `curated.json` with an `id`, `metro`, `name`, `date`, `url` (official page), `distances`, `badge`, `regStatus`, `priceNote` and `checked`. Run `npm run data` and confirm the "deduped" count in the log, then build and check.

## Free tools

### Race pace calculator: `/tools/pace-calculator/`

- **What it does:** pick a distance (5K, 10K, 10 miles, half, marathon or a custom distance in miles or km) and enter a goal finish time or a pace (per mile or per km). It shows finish time, pace per mile and per km, speed, a mile or km split table (even pacing, cumulative times) and predicted times at the other distances.
- **Math:** `src/assets/pace.js` (UMD, used by both the browser and the build). Pace = time / distance; finish = pace x distance; predictions use the Riegel formula `T2 = T1 x (D2 / D1)^1.06`, labelled as an estimate on the page. Distances: 5K 3.107 mi, 10K 6.214 mi, half 21.0975 km, marathon 42.195 km. Check: a 4:00:00 marathon = 9:09/mi (5:41/km); a 2:00:00 half = 9:09/mi; a 30:00 5K = 9:39/mi.
- **Files:** `src/tools/pace-calculator.njk` (page), `src/tools/pace-calculator.11tydata.js` (FAQ answers, the 4:00:00 marathon example that is pre-rendered into the HTML, the no-JS pace chart, and the "find a race" city links with live counts from `cal`), `src/assets/pace-ui.js` (form handling), `.pc-*` rules at the end of `src/assets/style.css`.
- **No JS:** the form is hidden, and the pre-rendered example result, the pace chart (6:00 to 14:00 per mile, every 30 seconds) and the formula section still show.
- **Plumbing:** footer "Site" list, a line under the home page Guides, a line on every 5K, 10K, half and marathon distance hub, and the Bay Area half marathon guide. In the sitemap automatically; listed in `src/llms.11ty.js`. Share image key `tool-pace-calculator` (`lib/og.js` TOOLS list, label in `scripts/og.mjs`).
- **Adding another tool:** add the page under `src/tools/`, add its slug to `TOOLS` in `lib/og.js`, link it from the footer and llms.txt, and follow the checklist in the shared patterns table below.

## Local setup

```bash
# Node 20 (same as CI)
npm ci
npm run dev        # http://localhost:8080 with live reload
npm run data       # optional: refresh races.json (takes a minute or two)
npm run build      # build to _site/
npm run check      # internal link check
```

## Deploy

- **Host:** Cloudflare Pages, project `racesnear`, connected to this repo.
- **Production branch:** `main`; every push deploys. Preview URL: `racesnear.pages.dev`.
- **Build command:** `npm run build` | **Output:** `_site` | **Node:** 20
- **Domains:** `racesnear.com` (canonical). `www.racesnear.com` returns a 301 to the apex.
- Pushing from the build box: `git -c credential.helper= -c credential.helper='!/usr/local/bin/gh auth git-credential' push`.
- Keep `outreach/` out of commits (it is git-ignored).

## SEO

`npm run build` runs Eleventy, then `scripts/og.mjs` (share images) and `scripts/postbuild.mjs`. The postbuild step is shared with the soccer and NBA sites:

- It fails the build on double-escaped entities in `<head>` (`&amp;amp;`, `&amp;#39;`), titles over 65 characters, descriptions over 160, or a `dateModified` with no visible date.
- It hashes each sitemap page (title, description, `<main>`; text between `<!--nohash-->` markers is ignored) against `lastmod.json`. Only changed pages get a new timestamp, which fills the visible "Updated" line, JSON-LD `dateModified` and the sitemap `<lastmod>`.
- It writes `.indexnow.json` with only new, changed and removed URLs. `npm run indexnow` sends those (add `-- --all` to resend the whole sitemap). Commit `lastmod.json` with every change.

Titles and descriptions go through `lib/seo.js` (`seoTitle`, `seoDesc`), which decodes entities once and fits them to 65 and 160 characters. Hub pages get their intro sentence, FAQ and ItemList from `lib/hub.js`. BreadcrumbList is generated from the visible breadcrumb.

- Canonical URL, title and description on every page.
- Structured data: `Event` on race pages (with `Place`, `PostalAddress`, `Offer` or `AggregateOffer`; offer URLs are affiliate-tagged only for RunSignup), `Organization` and `WebSite`.
- `/sitemap.xml` (about 2,600 URLs, real per-page lastmod), referenced from `robots.txt`. `robots.txt` allows every crawler and names the search, AI search, assistant and AI training bots explicitly.
- `/feed.xml` (guides) and `/llms.txt` (data-driven summary of cities and hubs).
- **IndexNow:** changed URLs only, sent after the deploy by the nightly job. Key name is `indexNowKey` in `site.json`; the file is `src/<key>.txt`.
- **Google Search Console:** owned by the site owner. Resubmit `/sitemap.xml` after big changes.

## Newsletter

beehiiv publication at https://racesnear.beehiiv.com/subscribe (`newsletterUrl` in `site.json`). The header Free email pill, the newsletter band and `/newsletter/` link there in a new tab with `rel="noopener"`. The `nlUrl` filter adds `utm_source=site` and `utm_campaign=<metro>` (or `all`) so signups can be traced by city. Copy: upcoming races near you, plus early-bird price deadlines, every week.

## Email

`hello@racesnear.com` uses Cloudflare Email Routing (MX records point to Cloudflare) and forwards to the owner's inbox.

## Recurring routines

Times are Pacific.

| What | When | How |
|---|---|---|
| Race refresh, deploy, IndexNow | Daily 3:05 AM | GitHub Action |
| Curated majors re-check (dates, lottery and sold-out status) | Monthly, and when big races open registration | By hand from official pages; bump `checked` |
| New guides (seasonal: turkey trots, New Year's Day, fall halves, ...) | As seasons approach | Hand-written in `src/guides/` |
| Weekly newsletter | Weekly | Sent from beehiiv |

## Common tasks and troubleshooting

- **A race is missing:** if it is on RunSignup, check that it falls inside the metro radius and the date window. If not, add it to `curated.json` from the official page.
- **A race appears twice:** the dedupe needs the same metro, same date and a close name. Fix the curated name or date to match.
- **A link is not affiliate-tagged:** only `runsignup.com` hosts are tagged. Malformed source URLs (for example a doubled scheme) are left alone; fix them in the data if they come from curated entries.
- **Nightly kept old data:** look for the warning in the Actions log (fetch failed or count dropped over 30%). Rerun the workflow later.
- **Push rejected:** pull with rebase first, since the nightly bot commits to `main` every day.
- **Page 404s right after a push:** wait for the Pages deploy to finish (check runs on the commit), then recheck.

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
