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
   `https://mechuz.github.io/Regency-House-Hixson-Website/`.
2. **Settings → Pages → Custom domain:** `www.hixsonregencyhouse.com`, then
   tick **Enforce HTTPS** once the certificate issues.
3. **DNS at GoDaddy** — full click-by-click below under *GoDaddy, step by step*.
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


## Handing this over

The domain is the control point, not this repo. DNS lives at GoDaddy, so
whoever holds that GoDaddy account decides where the site points — GitHub,
Netlify, or anywhere else.

Three ways to hand over, easiest first:

1. **Add the new owner as an admin collaborator.** Settings → Collaborators →
   Add people → Admin. Full control, no downtime, nothing moves. Usually the
   right answer.
2. **Transfer the repository.** Settings → Danger Zone → Transfer ownership.
   History comes along. Afterwards, Pages and the custom domain have to be
   re-enabled on the receiving account, so there is a short window where the
   site is down — do it at a quiet hour.
3. **Leave GitHub entirely.** The site is plain static files with no build
   dependency beyond Python 3. Run `python3 build.py`, take the `public/`
   folder, upload it anywhere, and change the two DNS records at GoDaddy.

There is no lock-in at any layer. That is deliberate.


## GoDaddy, step by step

The domain and DNS stay at GoDaddy; only the files move. Same arrangement as
kirbygateliving.com.

### Before touching anything
1. Sign in at godaddy.com.
2. **Screenshot the whole DNS page** once you reach it. That is how you undo a
   mistake.
3. **Never edit `MX`, `TXT` or `NS` rows.** `info@hixsonregencyhouse.com` runs
   on this domain — breaking those takes the facility's email down with the site.

### Reach the DNS page
4. Top right → your name → **My Products**.
5. Under **Domains**, find `hixsonregencyhouse.com`.
6. Three dots → **Manage DNS** (or click the domain, then the **DNS** tab).

### The `www` record
7. Find the row where **Type = CNAME** and **Name = www**.
8. Edit it. Set **Value** to `mechuz.github.io`.
9. TTL can stay as-is, or 600 seconds for faster propagation. Save.

If no `www` CNAME exists: **Add New Record** → CNAME / `www` / `mechuz.github.io`.

### The apex `A` records
10. Find **Type = A**, **Name = @**. Edit it to `185.199.108.153`. Save.
11. **Add New Record** three more times, each Type `A`, Name `@`:

| Type | Name | Value |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |

All four share the name `@`. That is correct — these are GitHub's published
Pages addresses. Delete any other `@` A record pointing elsewhere.

### Forwarding — the step people miss
12. On the domain's main page, check **Forwarding**. If a forward is active
    (the old `/lander` may be served this way), **turn it off.** Forwarding
    overrides DNS and the site will not appear while it is on.

### Back on GitHub
13. **Settings → Pages.** The Custom domain field should already read
    `www.hixsonregencyhouse.com` — `build.py` writes a `CNAME` file into
    `public/`, and Pages reads it.
14. Wait for the certificate, then tick **Enforce HTTPS**. Minutes to an hour.
    Greyed out means DNS has not propagated yet.

### Verify
15. After ~15 minutes open `https://www.hixsonregencyhouse.com`.
16. Check `https://hixsonregencyhouse.com` too — it should redirect to www.
17. **Email yourself at `info@hixsonregencyhouse.com` and confirm it arrives.**
    Do not skip this.

Propagation is usually minutes, occasionally hours. If the old page still
shows, try a private window before assuming something is wrong.
