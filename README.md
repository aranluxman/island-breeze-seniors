# Island Breeze Seniors Day Program — Website

Static one-page site for Island Breeze Seniors Day Program (Markham, ON). No build step.

- `public/` — the site (`index.html`, `styles.css`, `logo.svg`)
- `wrangler.toml` — Cloudflare Pages config

## Deploy to Cloudflare Pages

**Option A — Git (auto-deploys on every push):**
Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick this repo.
Framework preset: *None*. Build command: *(leave empty)*. Build output directory: `public`.

**Option B — CLI:**
```bash
npx wrangler login
npx wrangler pages deploy public --project-name island-breeze-seniors
```

## Before launch — confirm with owner
Search `index.html` for `[CONFIRM WITH OWNER` (shown as yellow dashed badges on the page):
- Regular program days and hours
- Registration process and any fees
- Black Health initiative partner name and details
- Real photos (currently none — link to Facebook/Instagram instead)
- Logo: `logo.svg` is a recreation; swap in the official file if available

## Sources used (verified Sept 2026)
- Facebook page (mission, phone, email): facebook.com/Islandbreezeseniors
- Instagram @islandbreezeseniors55 (crochet Mondays, game nights, Laughter Yoga, Carefirst tea party & health fair, Black Health initiative, Markham Museum visit)
- Corporations Canada record via canadacompanyregistry.com (incorporated 2018-10-29, 6 directors, 4460 14th Ave Unit 314)
- Open Government grants portal (ESDC SDPP Supporting Black Communities grant, 2021)
- EYRND OHT Town Hall deck, Jan 2025 (partner listing)
