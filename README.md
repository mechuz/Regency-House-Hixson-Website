# hixsonregencyhouse.com — Regency House Assisted Living

Static website for **Regency House Assisted Living** (assisted living & respite
care, 2062 Hamill Road, Hixson, TN 37343).

Built on the same system as `kirbygateliving.com`, so fixes port between the
two sites.

## How it works

- `content/*.html` — one file per page (body only, with a `<!--meta -->` block)
- `content/blog/*.html` — one file per Family Resources article (see *Blog* below)
- `content/news/*.html` — one file per Senior Care News item (see *Senior Care News* below)
- `templates/base.html` — shared header, nav, CTA band, footer, Google tag
- `build.py` — assembles `public/` from the above; also writes `sitemap.xml`,
  `robots.txt`, `CNAME`, the legacy redirect stubs, the FAQ structured data,
  the blog and news pages and both RSS feeds
- `scripts/` — the Airtable publisher and the headline collector (see *Automated publishing* below)
- `public/` — the deployable site (**never edit by hand**; edit `content/` and rebuild)

```bash
python3 build.py                           # build
cd public && python3 -m http.server 8741   # preview at localhost:8741
```

Push to `main` and GitHub Actions rebuilds and redeploys automatically (~30s).

## Pages

`/` · `/about-us/` · `/assisted-living/` · `/respite-care/` · `/amenities/` ·
`/gallery/` · `/rates-floor-plans/` · `/reviews/` · `/blog/` · `/news/` ·
`/contact-us/` · `/thank-you/` · `/privacy-policy/` · `/terms-of-service/` ·
`/ada-compliance/` · `/nondiscrimination/` · `404`

**No memory care page.** The community's licence carries no Alzheimer's or
dementia unit designation, so memory care is absent by design — not an
omission. The same rule applies to every article and news item: Regency House
offers assisted living and respite care, private pay only. Never publish
prices, specials, the licence number, or the names of staff or residents, and
never imply that Medicaid, TennCare, VA benefits or insurance are accepted.

## Blog (Family Resources)

- One file per post in `content/blog/<slug>.html`. Same `<!--meta -->` block as a page, plus `date` (YYYY-MM-DD, required), `headline`, `excerpt`, `image` (a `/assets/img/...` path), `image_alt`, `author`, `tags` (comma separated), `keyword`, `updated`, and `status` (`published` or `draft`; drafts are skipped).
- The body is HTML (paragraphs, `h2`/`h3`, lists). `{{phone_fmt}}` and `{{phone_tel}}` work inside posts and resolve to `(423) 870-0050` and `tel:4238700050`. A sibling `content/blog/<slug>.head.html` is injected into `<head>` (extra schema, etc.); FAQ accordions in a post get FAQPage schema automatically, like the pages.
- The build writes `/blog/<slug>/`, the `/blog/` index, `/feed.xml` (RSS) and sitemap entries, with Article and BreadcrumbList schema on every post and CollectionPage schema on the index. Every post ends with the tour call to action (Schedule a Tour → `/contact-us/`, call (423) 870-0050). With no posts yet the index still builds, with a short "articles are on the way" message.
- To publish by hand: add the file, `python3 build.py`, commit, push. Post images go in `public/assets/img/blog/` (under ~300KB, 1600px wide).

## Senior Care News

- `/news/` is a curated page of short summaries that link out to other publishers' articles (paying for care, health research, caregiving, policy, Chattanooga-area news) plus our own community updates. One file per item in `content/news/<slug>.html`; the file name is the slug (lowercase letters, digits and hyphens) and the item's anchor on the page (`/news/#<slug>`).
- Each file is a `<!--meta -->` block followed by a short HTML body:

  ```
  <!--meta
  title: Headline, plain text
  source: Publisher name
  source_url: https://... (for category community, a path on this site such as /blog/ also works)
  date: 2026-11-10       (the day we posted it; items are listed newest first)
  published: 2026-11-01  (the article's own date, optional)
  category: finance | health | caregiving | policy | industry | local | community
  status: published      (optional; draft files are skipped)
  -->
  <p>Two or three sentence summary in our own words.</p>
  <p class="why">Why it matters: one line for families (optional).</p>
  ```
- Categories and their labels (the same names as the Category options in Airtable): `finance` = Paying for care, `health` = Health & research, `caregiving` = Caregiving & family, `policy` = Policy & benefits, `industry` = Senior housing, `local` = Chattanooga & Hixson, `community` = Community update.
- The body may only use `p`, `a`, `strong`, `em`, `ul`, `ol` and `li`. The build stops with a clear message on a bad slug; a missing title, source_url, date or category; an unknown category; a source_url that is not http(s); or a body containing script, iframe, style, object, embed, form or `on*` attributes. Everything from the meta block is HTML-escaped on output.
- The build writes `/news/` (the newest 60 items under month headings, with topic filter chips), `/news/archive/<year>/` for anything older, `/news/feed.xml` (RSS, newest 20) and sitemap entries, with CollectionPage, ItemList and BreadcrumbList schema. External links open in a new tab. Write summaries in our own words and keep any quotation to a few words. With no items yet the page still builds, with a short "first picks are on the way" message.
- Above our picks, `/news/` lists the latest headlines from reputable national senior living, aging and benefits publishers, collected by `scripts/fetch_news_feeds.py` into `content/news_feeds.json` (`.github/workflows/refresh-news-feeds.yml` daily, and the deploy workflow every 30 minutes without committing). Only the headline, publisher, date and link are kept; each headline opens the original article. A feed that fails is skipped. Test: `python3 scripts/tests/test_news_feeds.py`.

## Automated publishing from Airtable

`.github/workflows/publish-blog.yml` runs daily at 15:30 UTC and on demand from the Actions tab ("Publish approved blog posts and news", Run workflow). It calls `scripts/publish_from_airtable.py prepare`, which reads two tables of the Regency House Airtable base (`applGKPSaitAuNQfZ`):

- **Content Items** (Channel = Blog, Status = Approved, Compliance Check ticked, Publish Date in the past): each article is written as `content/blog/<slug>.html` and its linked approved photo (GBP Post Photos, Status = Approved) is downloaded into `public/assets/img/blog/`. Articles need at least 300 words; the linked Content Topic's name and the Primary Keyword become the post's tags.
- **News Items** (Status = Approved, Compliance Check ticked, Post Date blank or not in the future, America/New_York): each item is written as `content/news/<slug>.html` for the Senior Care News page, oldest Post Date first. A row needs a title (160 characters max), a source (unless the category is Community update), an `http(s)://` link (a site path such as `/amenities/` is allowed for community updates), a category and a 20-160-word summary; HTML is stripped from the text (the summary and the why line are then HTML-escaped into the file's body, since `build.py` renders that body as HTML) and anything containing scripts, iframes, forms or event handlers is refused. The slug is the row's Slug when valid, otherwise `YYYY-MM-DD-<title>`, and the Published URL written back is `https://www.hixsonregencyhouse.com/news/#<slug>`.

After each file is written it runs `build.py` to make sure the site still builds. The workflow then commits those files to `main` as "Regency House Marketing Agent" <info@hixsonregencyhouse.com>, marks the rows Published in Airtable (`finalize`: Published URL, Published At and a Publish Log that ends with the commit hash; the linked Content Topic is set to Published too) and starts the deploy workflow. Columns are addressed by field id, so renaming a column in Airtable does not break publishing.

**Requirements: a repository secret named `AIRTABLE_TOKEN`** (Settings → Secrets and variables → Actions) holding an Airtable personal access token with `data.records:read` and `data.records:write` on the base above. **Ownership must add this secret; until then the workflow exits quietly and publishes nothing.** Rows that cannot be published are set to Failed with the reason in Publish Log. A row whose file is already committed on `main` (a previous run pushed it but could not reach Airtable afterwards) is only marked Published. A slug can only be used once: when another row already took it earlier in the same run, or its file exists without being committed, the row is set to Failed with the reason, so two rows never silently share one `/news/#<slug>` (two news rows with the same title and Post Date and no Slug fall back to the same `YYYY-MM-DD-<title>` slug, so give one of them a Slug). At most two articles (`MAX_POSTS`) and five news items (`MAX_NEWS`) are published per run.

Tests: `bash scripts/tests/run.sh` copies the repository to a temporary directory, starts a fake Airtable API (`scripts/tests/mock_airtable.py`, standard library only, no network) on a free port with a handful of fixture rows, runs `prepare` and `finalize` against it, checks the files written, the `GITHUB_OUTPUT` values and the updates sent back to Airtable, and prints PASS or FAIL.

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
