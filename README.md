# Nordic Homes & Renovering — Landing Page

A privacy-friendly, static brand-awareness landing page for a construction
company. No lead-gen forms, no quote CTAs — just a showcase of past work
with anonymous engagement tracking for marketing insight.

## Stack

- Static HTML/CSS/JS — no framework, no build step
- [Cloudflare Pages](https://pages.cloudflare.com/) for hosting
- Cloudflare Pages Functions (`/functions`) for server-side logic
- No database — engagement events are relayed to a Google Sheet via a
  Google Apps Script Web App

## Project structure

```
/
├── index.html                       single landing page
├── /css/styles.css
├── /js/tracking.js                  anonymous engagement tracking
├── /images/                         drop project photos here
├── /functions/api/geo.js            Cloudflare edge geolocation
├── /functions/api/log.js            engagement logging relay -> Google Sheets
└── /docs/apps-script-reference.gs   reference Apps Script (deploy manually)
```

## Privacy approach

- No cookies, no localStorage, no persistent visitor ID.
- No IP address or user agent is ever collected or forwarded.
- Engagement events (`page_view`, `time_spent_30s`, `scrolled_50_percent`)
  are sent from the browser to `/api/log` (same-origin, no CORS needed).
- `/api/log` runs server-side on Cloudflare, attaches a coarse location
  (city/region/country from `request.cf`) and a server-side timestamp, then
  relays the event to Google Sheets. Because that final hop is
  server-to-server, only Cloudflare's edge IP ever reaches Google — the
  visitor's real IP never leaves Cloudflare's network.

## Local setup

1. Drop your project photos into `/images` (referenced from `index.html`'s
   portfolio section).
2. Deploy the Apps Script in `/docs/apps-script-reference.gs` to a Google
   Sheet (see comments in that file for steps) and grab the Web App URL.
3. In the Cloudflare Pages dashboard, set the environment variable:
   - `GOOGLE_SHEETS_WEBHOOK_URL` — the Apps Script Web App deployment URL
4. Push to the connected GitHub repo — Cloudflare Pages builds automatically
   (no build command needed; this is a static site).

## Manual steps (cannot be automated from this repo)

- Create the Google Sheet and deploy the Apps Script Web App.
- Set `GOOGLE_SHEETS_WEBHOOK_URL` in the Cloudflare Pages dashboard
  (Settings > Environment variables) for both Production and Preview.
- Connect this repo to a Cloudflare Pages project if not already connected.
