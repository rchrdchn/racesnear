---
layout: base.njk
permalink: /about/
title: "About Races Near: How We Check Race Data"
description: "Who runs Races Near, where our race listings come from, how we check dates and prices every night, and how to report a correction."
kind: AboutPage
---
<div class="wrap prose">

<p class="crumbs"><a href="/">Home</a> / About</p>

# About Races Near

{% updated %}

<p class="lead">Races Near is a free race calendar for ten of the most active running cities in the US. It answers two questions fast: what is coming up near me, and which races get more expensive soon?</p>

## Who we are

Races Near is a small, independent site. We are not owned by, or affiliated with, any race, timing company or registration platform. We build the calendar for runners who sign up weeks or months ahead and want every option in one place.

## Where the races come from

- **RunSignup public race API.** Every night at about 3 AM Pacific we pull upcoming races within a set radius of each city center: dates, distances, start times, price schedules and registration windows. {{ cal.total }} upcoming races are listed right now.
- **Hand-checked majors.** Some big races use their own registration systems. We add those by hand, only from the organizer's official page, and show the date we checked.

Races on other platforms (Race Roster, UltraSignup, ACTIVE and organizers' own sites) are not all listed yet. If your race is missing, email us.

## How we check the data

- **Every night, automatically.** The refresh rebuilds every page. If the feed fails, or the number of races drops by more than 30%, we keep the previous day's data instead of publishing a broken calendar.
- **No duplicates.** When a hand-checked race also appears on RunSignup (same city, same date, near-identical name), we show one listing.
- **Past races drop off.** Finished races leave the calendar automatically.
- **Dated pages.** Every page shows when its content last changed, and each race page names its source.

## How prices work

Price shows the current entry fee for the cheapest distance, before the platform's processing fee. "Goes up" is the last day at the current price, from the race's published schedule. Races can change prices without notice, so the registration page is the final word.

## Why these ten cities

We picked cities where lots of people run and lots of young adults are getting into it: high scores in the ACSM American Fitness Index, Strava's 2025 Year in Sport city leaderboards, a high share of residents aged 25 to 34 (US Census 2024 estimates), and a deep race calendar. More cities are coming.

<h2 id="affiliate-links">Affiliate links</h2>

Races Near is a RunSignup affiliate. When you register for a race through one of our RunSignup links, RunSignup shares part of its processing fee with us, at no extra cost to you. Links to official race sites and other platforms are not affiliate links. Affiliate status never changes which races we list or how we sort them.

## Corrections

Spot a wrong date, price or start time? Email [hello@racesnear.com](mailto:hello@racesnear.com) with the race name and what changed. We check it against the race's own page and fix confirmed errors quickly.

## Contact

{% emailOptions "Hello", "Email us" %}

</div>
