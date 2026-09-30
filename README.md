# Island Breeze Seniors Day Program — Website

Hand-written static site for Island Breeze Seniors Day Program (Markham, ON). Plain HTML/CSS/JS, no framework, no build step.

```
content/site-content.json   editable content (activities, milestones, FAQ, partners)
scripts/                    render-content.mjs, optimize-images.mjs (dev tools, no deps)
docs/content-checklist.md   sources + open questions (not published)
public/
  index.html        the whole site (single page)
  styles.css        design tokens, layout, components, motion (reduced-motion safe)
  main.js           menu, scroll reveal, scroll-spy, lazy map, contact form
  thanks.html       no-JS form landing page
  404.html          real 404 (stops Pages serving the home page for missing URLs)
  robots.txt, sitemap.xml, _headers
  fonts/            self-hosted Atkinson Hyperlegible + Fraunces (SIL OFL)
  img/              og-image.jpg (1200x630 share image) + optimized illustrations
  logo.svg, favicon.svg
wrangler.toml       pages_build_output_dir = ./public
```

## Cloudflare Pages build configuration

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | *(leave empty)* |
| Build output directory | `public` |
| Root directory | *(leave empty — repo root)* |
| Production branch | `main` |

CLI alternative: `npx wrangler pages deploy public --project-name island-breeze-seniors`

## Updating content (activities, milestones, FAQ, partners)

All of it lives in **`content/site-content.json`**. After editing:

```bash
node scripts/render-content.mjs
```

This rewrites the marked blocks (`<!-- @content:NAME -->`) in `public/index.html`. It has no dependencies and the output is committed, so Cloudflare Pages still needs no build step. Only add facts that have a source or come from the owner. `docs/content-checklist.md` tracks what's verified and what's still open.

## Contact form (FormSubmit)

The form posts to `https://formsubmit.co/aran.luxman@gmail.com` (**temporary** recipient).

- Visitors choose **"Call me back"** (phone required, email optional) or **"Email me"** (email required).
- There's no newsletter checkbox, because no mailing-list workflow exists.
- A success message appears only when FormSubmit replies `success: "true"`. An unactivated form, a network failure or any other reply shows an error with the phone number.
- **Activation:** the first real submission sends a confirmation email to the recipient, and nothing is delivered until it's clicked. Test once from the live site after publishing.
- After activating, replace the email in the form `action` with the random alias FormSubmit provides, so the address isn't visible in the page source.
- Before handover, switch to the organization's inbox (it needs its own activation) and keep the privacy note accurate.

## Images

`scripts/optimize-images.mjs` turns a source image into `public/img/<name>-{800,1280}.{webp,jpg}` using Playwright's Chromium:

```bash
node scripts/optimize-images.mjs incoming/dominoes.png illus-dominoes
node scripts/render-content.mjs
```

Slots are defined under `illustrations` in the content file (`illus-crochet` → Creative activities, `illus-dominoes` → Social games, `illus-tea` → About). A slot appears only once its files exist, so there are never empty placeholders.

The three supplied images are **painted illustrations, not photos of Island Breeze members**. They're captioned "Illustration". Replace them with consented community photos when available.

## Before launch — owner questions

See `docs/content-checklist.md` (section "Unresolved").

## Moving islandbreezeseniors.ca to this site

1. In Cloudflare Pages → the project → **Custom domains**, add `islandbreezeseniors.ca` and `www.islandbreezeseniors.ca`.
2. **Check for email first.** In GoDaddy DNS, note any MX, TXT (SPF/DKIM) and CNAME records. If they exist, the domain has email and those records must be copied exactly.
3. Either (a) move DNS to Cloudflare: add the domain to Cloudflare (free plan), check every imported record against GoDaddy, then change the nameservers at GoDaddy to the two Cloudflare ones; or (b) keep DNS at GoDaddy and add the CNAME records Cloudflare Pages shows you. Option (a) is simpler and required for the bare `islandbreezeseniors.ca`.
4. Cancel the GoDaddy Website Builder plan only after the new site loads on the domain. Keep the domain registration itself.
5. In `index.html`, `robots.txt` and `sitemap.xml`, replace `https://island-breeze-seniors.pages.dev/` with `https://islandbreezeseniors.ca/` (canonical, og:url, og:image, JSON-LD, sitemap).
6. Redirect `island-breeze-seniors.pages.dev` to the .ca with a Cloudflare **Bulk Redirect** (301, preserve path).
7. Add the .ca to Google Search Console and submit `sitemap.xml`.

## Google Business Profile (biggest local-search win)

1. Go to business.google.com and sign in with the organization's Google account (islandbreezeseniors@gmail.com).
2. Search for "Island Breeze Seniors Day Program". Claim it if a listing exists; otherwise create one.
3. Category: **Senior citizen center** (add *Non-profit organization* as secondary).
4. Address: 4460 14th Avenue, Unit 314, Markham, ON L3R 1H1. Phone 416-319-7763. Website: the site URL.
5. Verify: Google offers video, phone/SMS, or a postcard. The owner (or someone on site) must do it.
6. After verification: add hours (once confirmed), description, photos (with consent), and post events like the Monday crochet class.
7. Ask happy members and families for Google reviews.
