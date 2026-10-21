# hixsonregencyhouse.com — Regency House Assisted Living

Static website for **Regency House Assisted Living** (assisted living & respite
care, 2062 Hamill Road, Hixson, TN 37343).

Built on the same system as `kirbygateliving.com`, so fixes port between the
two sites.

## How it works

- `content/*.html` — one file per page (body only, with a `<!--meta -->` block)
- `templates/base.html` — shared header, nav, CTA band, footer, Google tag
- `build.py` — assembles `public/` from the above; also writes `sitemap.xml`,
  `robots.txt`, `CNAME`, the legacy redirect stubs, and the FAQ structured data
- `public/` — the deployable site (**never edit by hand**; edit `content/` and rebuild)

```bash
python3 build.py                           # build
cd public && python3 -m http.server 8741   # preview at localhost:8741
```

Push to `main` and GitHub Actions rebuilds and redeploys automatically (~30s).

## Pages

`/` · `/about-us/` · `/assisted-living/` · `/respite-care/` · `/amenities/` ·
`/rates-floor-plans/` · `/reviews/` · `/contact-us/` · `/thank-you/` ·
`/privacy-policy/` · `/terms-of-service/` · `/ada-compliance/` ·
`/nondiscrimination/` · `404`

**No memory care page.** Licence #0537-00000150 carries no Alzheimer's or
dementia unit designation, so memory care is absent by design — not an omission.

## Tracking

IDs are placeholder tokens in `templates/base.html`, `content/contact-us.html`
and `public/assets/js/main.js`. Stamp them in with one validated command:

```bash
./setup-ids.sh --ga4 G-XXXXXXXXXX --ads AW-XXXXXXXXX \
               --form-label XXXXXXXXXXXXXXX --lead-email office@example.com
```

`--revert` restores the placeholders. `--phone "423-555-0123"` changes the
number everywhere — display text, `tel:` links and structured data.

## Go-live checklist

1. **Settings → Pages → Source: GitHub Actions.** The workflow publishes to
   `https://<username>.github.io/Regency-Website/`.
2. **Settings → Pages → Custom domain:** `www.hixsonregencyhouse.com`, then
   tick **Enforce HTTPS** once the certificate issues.
3. **DNS** at the registrar:
   - `www` **CNAME** → `<username>.github.io`
   - apex `@` **A** records → `185.199.108.153`, `185.199.109.153`,
     `185.199.110.153`, `185.199.111.153`
   - **Do not touch MX records** — `info@hixsonregencyhouse.com` runs on this
     domain, so breaking them takes the facility's email down with it.
4. **Activate the lead form.** Submit it once; FormSubmit emails a one-time
   activation link to `info@hixsonregencyhouse.com` that somebody must click.
   **Until then no leads are delivered** — the most common way a new site
   silently loses every enquiry.
5. **Google Ads conversion:** create the "Submit lead form" action (page load
   on `/thank-you/`), then `./setup-ids.sh --form-label <label>`.
6. **Photos.** See `public/assets/img/README.md` — including the consent rules.

## FAQ structured data

`build.py` generates `FAQPage` JSON-LD from the FAQ accordions actually
rendered on each page. Google requires FAQ schema to match visible content, so
editing a question in `content/` updates the schema automatically. Do not add
FAQ schema by hand.
