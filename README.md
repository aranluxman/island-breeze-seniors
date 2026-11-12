# Island Breeze Seniors Day Program — Website

Hand-written static site for Island Breeze Seniors Day Program (Markham, ON). Plain HTML/CSS/JS, no framework, no build step.

```
content/site-content.json   editable content (monthly calendar, activities, milestones, FAQ, partners)
scripts/                    render-content.mjs, optimize-images.mjs (dev tools, no deps)
docs/content-checklist.md   sources + open questions (not published)
public/
  index.html        the whole site (single page)
  styles.css        design tokens, layout, components, motion (reduced-motion safe)
  main.js           menu, scroll reveal, scroll-spy, lazy map, contact form, Join Now panel, calendar (today, next program, print, add to calendar), Help assistant
  data/faq.json     knowledge for the scripted Help assistant (site facts only; no AI)
  data/calendar.json generated from the content file: the calendar data the page and Help assistant read
  calendar/         the original monthly calendar flyers (PDF), offered as downloads
  thanks.html       no-JS form landing page
  404.html          real 404 (stops Pages serving the home page for missing URLs)
  robots.txt, sitemap.xml, _headers
  fonts/            self-hosted Atkinson Hyperlegible (SIL OFL), used for headings and text
  img/              og-image.jpg (1200x630 share image) + optimized photos
  logo.png / logo-600.png / logo-*.webp   the organization's own logo (transparent background)
  favicon-32.png, icon-192.png, apple-touch-icon.png   the logo's sun, cut from the same image
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

## Each month: the program calendar

1. Put the new flyer in `public/calendar/` (for example `december-2026.pdf`).
2. In `content/site-content.json`, under `calendar.months`, add a month (copy November's): `id` (`2026-12`), `title`, `pdf`, and one line per program day under `events`: `date`, `kind`, `start` and `end` in 24-hour time. Add `"venue": "milliken"` (or a new venue under `calendar.venues`) only when an event isn't in the Amenity Room. Days without a line show as "No program".
3. New kind of event? Add it under `calendar.kinds` with a name, an icon id (`a-...` in the sprite in `index.html`), an accent (`palm`, `ocean`, `sunset`, `pink`) and a one-line description.
4. Run `node scripts/render-content.mjs`.

That rebuilds the month grid and phone list, the "Every Monday…" cards, the hero's "Times", the "When are the programs?" FAQ answer, the Event structured data for Google, and `public/data/calendar.json`, which the Help assistant uses to answer questions like "what's on Tuesday?". The page shows the first month that hasn't ended yet. On the live page, `main.js` marks today and past days (Toronto time), shows the next program with **Add to my calendar** (.ics) and **Directions**, folds away past weeks on phones, and prints just the calendar on one landscape page.

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

## Join Now panel and Help assistant

- **Join Now** (header) opens a panel: Call, Email, or Send a message. Without JavaScript it's a link to the contact form.
- **Help** (bottom-right) is a *scripted* assistant, not an AI, so it never invents facts. It knows about 70 topics (owner, location and room, directions, joining, cost, caregivers, every calendar event, past activities, partners and more) from `public/data/faq.json`, and answers schedule questions live from `data/calendar.json` ("what's on Wednesday?", "when is bingo?", "this week", "November 18", "today").
- Typos are fine: about 300 common misspellings are fixed first ("loction", "excercise", "wensday", "Charmain"), and any remaining word within one or two letters of a keyword (including swapped letters) still matches. Words it already knows are never treated as typos of other words.
- When it isn't sure, it says so and offers Call / Email / Send a message, plus "You might also ask" suggestions. No tracking, cookies or third-party scripts; nothing is stored.
- To add an answer, add an entry to `faq.json` (`q`, `keywords`, `answer`). Only add facts that are on the site or confirmed by the owner.
- Both new forms send through the **same FormSubmit address as the main contact form** — they read it from that form's `action`, so changing the recipient is one edit.

## Images

`scripts/optimize-images.mjs` turns a source image into `public/img/<name>-{800,1280}.{webp,jpg}` using Playwright's Chromium (the 1280 size is skipped for small sources, so nothing is upscaled):

```bash
node scripts/optimize-images.mjs incoming/bingo.jpg photo-bingo
node scripts/render-content.mjs
```

Photos are listed under `photos` in the content file (file base, alt text, caption, proportions, optional crop position). Then:
- `gallery` sets the order of the home-page carousel.
- `photoSlots` sets where photos appear elsewhere: hero arch, activity groups (by group id), joining, about, story and the call band.

A photo appears only once its files exist, so there are never empty placeholders. The current photos were supplied by the owner in October 2026, with consent confirmed, and lightly colour-corrected and sharpened before optimizing.

The carousel is a native scroll-snap strip: it swipes on touch, scrolls with the keyboard, and works without JavaScript. `main.js` adds previous/next buttons and the "3 of 9" counter. It never auto-advances.

## Logo

The site uses the organization's own logo, exactly as supplied (Nov 2026): sun over the sea, palm-tree "I", "Island Breeze / Seniors Day Program" and "Where Every Senior Matters". The white background was made transparent without redrawing anything, so it sits on the sand-coloured header and on a sand plaque in the footer. The favicons are the logo's sun, cut from the same image. To replace it, export a new transparent PNG at the same names (`logo.png`, `logo-600.png`, `logo-600.webp`, `logo-400.webp`).

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
