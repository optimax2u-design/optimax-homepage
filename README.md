# Optimax Eye Specialist — Website

A fast, static website built with [Eleventy](https://www.11ty.dev/) and edited through [Pages CMS](https://pagescms.org). No frameworks: plain HTML, one CSS file and one small JS file. **81 pages** are generated from a handful of templates and data files.

Preview: https://optimax2u-design.github.io/optimax-homepage/

## Site map

The homepage is the new design. **Every other page uses the exact wording, order and images of the live optimaxeyespecialist.com page** (copied 29 Oct 2026), restyled in the homepage design. One HTML markup serves every screen size — layout changes are CSS only.

| Page | Address | Template | Content (word-for-word from live site) |
|---|---|---|---|
| Homepage | `/` | `src/index.njk` | `home.json` |
| Treatments overview | `/treatments/` | `src/treatments.njk` | `pages/treatments.json` |
| 10 treatment pages | `/zeiss-smile-pro/`, `/zeiss-smile/`, `/zeiss-presbyond/`, `/clear-max-lasik/`, `/femto-lasik/`, `/tesa/`, `/advanced-surface-ablation/`, `/icl/`, `/rigid-gas-permeable-lenses-rgp/`, `/flacs/` | `src/treatment.njk` | `pages/<address>.json` |
| Doctors (branch + language filters) | `/doctor/` | `src/doctors.njk` | `doctors.json` |
| 26 doctor profiles | `/doctor/<name>/` | `src/doctor.njk` | `doctors.json` |
| 25 branch pages | `/branches/<branch>/` | `src/branch.njk` | `branches.json` |
| About Us | `/about-us/` | `src/about.njk` | `pages/about.json` |
| FAQs | `/faqs/` | `src/faqs.njk` | `pages/faqs.json` |
| Financing Options | `/financing-options/` | `src/financing.njk` | `pages/financing.json` |
| Blog + 9 articles | `/blog/`, `/<article>/` | `src/blog.njk`, `src/post.njk` | `blog.json` |
| Privacy Policy, Terms of Use | `/privacy-policy/`, `/terms-of-use/` | `src/legal.njk` | `pages/privacy-policy.json`, `pages/terms-of-use.json` |
| Not found | `/404.html` | `src/404.njk` | — |

Treatment-page sections are typed (`intro`, `feature`, `suitpair`, `compare`, `steps`, `prepost`, `journey`, `why`, `awards`, `quotes`, `cards`, `cta`) and rendered in the live page's order. Booking forms use the live form fields (`forms.json`: "LASIK Enquiry Form" on treatment pages, "General Enquiry Form" on /treatments/). Images on inner pages load from the live site's media library (`optimaxeyespecialist.com/cms/wp-content/uploads/…`), so they already exist in WordPress.

Shared pieces live in `src/_includes/`: `layouts/base.njk` (top bar, one responsive menu, footer), `partials/booking.njk`, `partials/recognition.njk`, `macros.njk`.

## Edit content and images (no code)

1. Go to **https://app.pagescms.org** and sign in with GitHub.
2. Choose this repository. You'll see: **Homepage, Doctors, Branches, Site settings, Treatments, About page, FAQs page, Financing page, Blog, Privacy & Terms pages**.
3. Change text or click an image field to upload a new photo, then **Save**.
4. Saving commits to GitHub; the site rebuilds and goes live in about a minute.

Adding a doctor, branch, treatment or blog post creates its page automatically. Give it a **page address** (lowercase-with-dashes) and don't change it once it's live.

The booking form on a treatment page pre-selects that treatment; on a branch page it pre-selects the branch; on a doctor page it pre-selects their branch and sends the doctor's name with the request.

### Images

All images live in `src/assets/uploads/`. Recommended sizes:

| Slot | Size | Ratio |
|---|---|---|
| Hero photo (homepage) | 1200 × 1400 | 6:7 portrait |
| Treatment / page hero (cut-out) | 900 × 700 | ~4:3 |
| Doctor portraits | 600 × 750 | 4:5 |
| Award / panel / media logos | any, ≤ 52 px tall shown | transparent PNG or SVG |

Export photos as **WebP or JPG under ~200 KB**. The procedure-step illustrations on treatment pages currently load from the live site (`optimaxeyespecialist.com/cms/wp-content/uploads/…`); upload copies through the CMS to make them independent. If one ever fails to load, the step simply shows without a picture.

## Booking form

The form validates and shows "Request received". To receive leads, paste an endpoint (Formspree, Make/Zapier webhook or your CRM) into **Site settings → Form endpoint URL**. Fields sent: `name`, `phone`, `email`, `branch`, `service`, `page`, and `doctor` (doctor pages only).

## Publish with GitHub Pages

Every push to `main` (including CMS saves) runs `.github/workflows/deploy.yml`. Custom domain: add it under Settings → Pages; paths adjust automatically.

## Run locally

```bash
npm install
npm start        # http://localhost:8080
npm run build    # outputs to _site/
```

## Handover notes for the web agency (WordPress build)

This repository is the approved **design and content reference**. Suggested WordPress mapping:

| Here | WordPress |
|---|---|
| `layouts/base.njk` | `header.php` / `footer.php` (theme) |
| `treatment.njk` + `treatments.json → list` | Custom post type **Treatment** + ACF fields (hero, facts, suits/not suits, comparison rows, steps, before/after) |
| `doctor.njk` + `doctors.json` | CPT **Doctor** (title, credentials, specialties, languages, branches → relationship) |
| `branch.njk` + `branches.json` | CPT **Branch** (address, tel, WhatsApp, email, hours repeater, map link, region taxonomy) |
| `post.njk` + `blog.json` | Standard Posts (migrate existing articles; the 9 article texts here are short stand-ins) |
| `faqs.json`, `financing.json`, `about.json` | Pages with ACF repeaters, or Gutenberg blocks |
| `partials/booking.njk` | Existing enquiry form plugin, restyled to match |
| `style.css` / `main.js` | Enqueue as-is; colour tokens are in `:root` at the top of `style.css` |

Before launch: replace the Privacy Policy and Terms text with the company's official wording (the versions here are plain-English summaries), add a redirect from `/about-us-2/` to `/about-us/`, and confirm opening hours with each branch.

## Content rules

- Only real figures: 4.7★ / 916 Google reviews, 25 centres, since 1995 — update in the CMS when they change.
- Review quotes are short excerpts from real Google reviews shown on optimaxeyespecialist.com.
- Doctor names, credentials, positions, languages and branches, and branch addresses/phones/hours come from optimaxeyespecialist.com (October 2026).
- Treatment facts (timings, recovery, suitability) come from the live treatment pages, rewritten in plain language.
