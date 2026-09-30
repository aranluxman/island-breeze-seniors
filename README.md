# Island Breeze Seniors Day Program — Website

Hand-written static site for Island Breeze Seniors Day Program (Markham, ON). Plain HTML/CSS/JS, no framework, no build step.

```
public/
  index.html        the whole site (single page)
  styles.css        design tokens, layout, components, motion (reduced-motion safe)
  main.js           menu, scroll reveal, scroll-spy, lazy map, contact form
  thanks.html       no-JS form landing page
  404.html          real 404 (stops Pages serving the home page for missing URLs)
  robots.txt, sitemap.xml, _headers
  fonts/            self-hosted Atkinson Hyperlegible + Fraunces (SIL OFL)
  img/              hero-scene.svg, og-image.jpg (1200x630 share image)
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

## Contact form (FormSubmit)

The form posts to `https://formsubmit.co/aran.luxman@gmail.com` (temporary recipient).

1. **Activate it once:** the first real submission from the live site triggers a FormSubmit email to that address. Click the confirm link, or no messages will arrive.
2. After activating, FormSubmit gives you a random alias. Replace the email in the form `action` in `index.html` with that alias so the address isn't visible in the page source.
3. Before handing over, change the recipient to the organization's address (it needs its own one-time activation).

The email-list checkbox only adds a "Yes, add me to the email list" line to the message. A real mailing list (e.g. Buttondown or Mailchimp) is a later step.

## Photos

There are no photos yet: the build environment can't reach stock photo sites, and real program photos haven't been supplied. The design uses an illustrated sunset scene and SVG icons instead.

- Hero: replace `img/hero-scene.svg` in the `<img class="hero-bg">` with a `<picture>` (AVIF + WebP at 800/1280/1920w). Keep `fetchpriority="high"`.
- Program cards: add `<div class="program-media"><img …></div>` at the top of a card; the hover zoom is already styled.
- **Consent:** only use photos where everyone identifiable has agreed to appear on the website.

## Before launch — questions for the owner

1. **Hours:** which days and times does the program run? (Then add `openingHours` to the JSON-LD.)
2. **Registration and fees:** how does someone join? Is there a fee, a waitlist, or an intake form?
3. **Black Health Initiative:** who is the partner or funder, what does it offer, and what name should appear?
4. **Program schedule:** days and times for game nights, arts & crafts, Laughter Yoga, meditation and poetry. Only crochet (Mondays) is confirmed. What time is crochet?
5. **Partner logos:** permission to use the Carefirst, EYRND OHT, Government of Canada and Markham Museum logos?
6. **Photos:** real photos of the program, with consent from everyone shown.
7. **Accessibility and parking** at 4460 14th Ave: elevator, accessible entrance, parking, transit?
8. **Social media:** are facebook.com/Islandbreezeseniors and instagram.com/islandbreezeseniors55 the right accounts? Any others?
9. **Form email:** which address should website messages go to?
10. **Domain:** who has the GoDaddy login for islandbreezeseniors.ca, and is any email set up on that domain?

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
