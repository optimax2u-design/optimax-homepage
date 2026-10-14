# Optimax Eye Specialist — Homepage

A fast, static homepage built with [Eleventy](https://www.11ty.dev/) and edited through [Pages CMS](https://pagescms.org). No frameworks: one HTML page, one CSS file (~20 KB) and one small JS file (~4 KB).

## Edit content and images (no code)

1. Go to **https://app.pagescms.org** and sign in with GitHub.
2. Choose this repository. You'll see four sections:
   - **Homepage** — hero, stat tiles, treatment finder, cards, journey, reviews, awards, booking form text
   - **Doctors** — names, credentials, portraits
   - **Branches** — the list in the booking form
   - **Site settings** — top bar, menu, footer, SEO, form endpoint
3. Change text or click an image field to upload a new photo, then **Save**.
4. Saving commits to GitHub; the site rebuilds and goes live in about a minute.

All placeholder images live in `src/assets/uploads/`. Recommended sizes:

| Slot | Size | Ratio |
|---|---|---|
| Hero photo | 1200 × 1400 | 6:7 portrait |
| Treatment / Why cards | 800 × 600 | 4:3 (cards crop to 16:9) |
| Doctor portraits | 600 × 750 | 4:5 |
| Award / panel / media logos | any, ≤ 52 px tall shown | transparent PNG or SVG |

Export photos as **WebP or JPG under ~200 KB** to keep the page fast.

## Booking form

Out of the box the form validates and shows "Request received". To actually receive leads, paste an endpoint (e.g. Formspree, Make or Zapier webhook, or your CRM) into **Site settings → Form endpoint URL**. Submissions are POSTed as form data with fields `name`, `phone`, `email`, `branch`, `service`.

## Publish with GitHub Pages

1. Push this folder to a GitHub repository (branch `main`).
2. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Every push (including CMS saves) runs `.github/workflows/deploy.yml`.

Custom domain: add it under Settings → Pages; the workflow adjusts paths automatically.

## Run locally

```bash
npm install
npm start        # http://localhost:8080
npm run build    # outputs to _site/
```

## Content rules

- Only real figures: 4.7★ / 916 Google reviews, 25 centres, since 1995 — update in the CMS when they change.
- Review quotes are short excerpts from real Google reviews shown on optimaxeyespecialist.com.
- Doctor names and credentials come from optimaxeyespecialist.com/doctor/; portraits are placeholders.
- Award, panel and media entries show names until logos are uploaded.
