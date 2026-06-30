# DalaBygg & Renovering — Landing Page

A privacy-friendly, static brand-awareness landing page for a construction
company. No lead-gen forms, no quote CTAs — just a showcase of past work
with anonymous engagement tracking for marketing insight.

## Stack

- Static HTML/CSS/JS — no framework, no build step
- A single [Cloudflare Worker](https://developers.cloudflare.com/workers/)
  with a static assets binding, deployed via `wrangler` — serves `/public`
  and handles `/api/*` routes itself
- No database — engagement events are relayed to a Google Sheet via a
  Google Apps Script Web App

> Note: this project was originally built for classic Cloudflare Pages
> (file-based routing under `/functions`). It was restructured into the
> Workers-with-assets format below because the project was deployed
> through Cloudflare's "Create a Worker" flow, which doesn't recognize
> the Pages `/functions` convention.

## Project structure

```
/
├── wrangler.jsonc                    Worker config + assets binding
├── package.json
├── /src
│   ├── index.js                      Worker entry — routes /api/*, falls through to assets
│   ├── geo.js                        Cloudflare edge geolocation
│   └── log.js                        engagement logging relay -> Google Sheets
├── /public                           everything served as static assets
│   ├── index.html
│   ├── /css/styles.css
│   ├── /js/tracking.js               anonymous engagement tracking
│   └── /images/                      project photos
└── /docs/apps-script-reference.gs    reference Apps Script (deploy manually)
```

## Privacy approach

- No cookies, no localStorage, no persistent visitor ID.
- No IP address or user agent is ever collected or forwarded.
- Engagement events (`page_view`, `time_spent_30s`, `scrolled_50_percent`)
  are sent from the browser to `/api/log` (same-origin, no CORS needed).
- `/api/log` runs server-side in the Worker, attaches a coarse location
  (city/region/country from `request.cf`) and a server-side timestamp, then
  relays the event to Google Sheets. Because that final hop is
  server-to-server, only Cloudflare's edge IP ever reaches Google — the
  visitor's real IP never leaves Cloudflare's network.

## Local setup

1. `npm install` to pull in `wrangler`.
2. Drop your project photos into `/public/images` (referenced from
   `public/index.html`'s portfolio section).
3. Deploy the Apps Script in `/docs/apps-script-reference.gs` to a Google
   Sheet (see comments in that file for steps) and grab the Web App URL.
4. Set the `GOOGLE_SHEETS_WEBHOOK_URL` secret (see below).
5. `npm run dev` to preview locally, `npm run deploy` to ship (or push to
   the connected GitHub repo if the Worker is set up for Git-based deploys).

## Manual steps (cannot be automated from this repo)

- Create the Google Sheet and deploy the Apps Script Web App.
- Set the `GOOGLE_SHEETS_WEBHOOK_URL` secret — either:
  - `npx wrangler secret put GOOGLE_SHEETS_WEBHOOK_URL`, or
  - Cloudflare dashboard → Workers & Pages → this Worker → Settings →
    Variables and Secrets → add `GOOGLE_SHEETS_WEBHOOK_URL` as a Secret
    (not a plaintext variable, since it's effectively a write endpoint).
- If deploying via the dashboard's Git integration instead of `wrangler
  deploy`, point the build at this repo with no build command — Wrangler
  reads `wrangler.jsonc` directly.
