# hixsonregencyhouse.com — Regency House Assisted Living

Static website for **Regency House Assisted Living** (assisted living & respite
care, 2062 Hamill Road, Hixson, TN 37343).

Built on the same system as `kirbygateliving.com`, so fixes port between the
two sites.

## How it works

- `content/*.html` — one file per page (body only, with a `<!--meta -->` block)
- `content/blog/*.html` — one file per Guides & Resources article (see *Blog* below)
- `content/news/*.html` — one file per Senior Care News item (see *Senior Care News* below)
- `content/calendar.json` — this month's activities for `/activities-calendar/` (see *Activities calendar* below)
- `templates/base.html` — shared header, nav, CTA band, footer, Google tag
- `build.py` — assembles `public/` from the above; also writes `sitemap.xml`,
  `robots.txt`, `CNAME`, the legacy redirect stubs, the FAQ structured data,
  the activities calendar, the blog and news pages and both RSS feeds
- `scripts/` — the Airtable publisher, the headline collector and the Team Login builder (see below)
- `public/assets/js/` — `main.js` (nav, the one lead sender, respite calendar, reserve flow),
  `chat.js` (Ask-us assistant), `visit.js` (Book Your Visit), `team-gate.js` (Team Login)
- `public/` — the deployable site (**never edit by hand**; edit `content/` and rebuild)

```bash
python3 build.py                           # build
cd public && python3 -m http.server 8741   # preview at localhost:8741
```

Push to `main` and GitHub Actions rebuilds and redeploys automatically (~30s).

## Pages

`/` · `/about-us/` · `/assisted-living/` · `/respite-care/` (with the booking request form) ·
`/amenities/` · `/gallery/` · `/rates-floor-plans/` · `/reviews/` · `/activities-calendar/` ·
`/reserve/` · `/paying-for-senior-living/` · `/blog/` · `/news/` · `/contact-us/` ·
`/visit/` (noindex, out of the sitemap) · `/team/` (noindex, no Google tag, out of the sitemap) ·
`/thank-you/` · `/privacy-policy/` · `/terms-of-service/` · `/ada-compliance/` · `/nondiscrimination/` · `404`

### Utility links (Resident Portal, Staff Login)

Two constants at the top of `build.py` drive the Resident Portal link (nav + footer) and the
Staff Login (UKG Ready) link (Team Login dropdown + footer):

```python
RESIDENT_PORTAL_URL = ""
STAFF_LOGIN_URL = ""
```

While a constant is an empty string that link is not rendered anywhere. Paste the URL ownership
supplies, rebuild, commit. The `/team/` Team Portal link is always shown. The header button reads
"Reserve a Suite" while `content/reserve.html` exists, otherwise "Schedule a Tour".

### Payer rule

Regency House is private pay and **welcomes participants enrolled in PACE** (Program of
All-Inclusive Care for the Elderly; in Hamilton County, Ascension Living Alexian PACE). Those are
the only two payer mentions allowed. Never state or imply that Medicaid, TennCare CHOICES,
Medicare, VA benefits or long-term care insurance are accepted or billed; general explanations
with "confirm with a benefits counselor" are fine (see `/paying-for-senior-living/`).

## Lead forms

Every form on the site carries `data-lead-form` and goes through one sender in
`public/assets/js/main.js`: the contact form, the respite booking request, the Reserve a Suite
request, Book Your Visit, the chat callback and Share an article. The sender screens the
submission (honeypots, a 3-second minimum, `window.rhSpam` link/word/script rules, job-seeker and
vendor redirection to the main line, a 10-digit phone check), then POSTs to the Zapier lead hook
(`LEAD_HOOK`, field `rh_src=hixsonregencyhouse`); if the hook does not answer in 10 seconds it
falls back to the FormSubmit AJAX alias from `content/contact-us.html`, and if both fail the
visitor is shown the main line. Successful sends land on `/thank-you/`, which counts one GA4
`generate_lead` per browser session.

Every lead carries `source` (the form's `_subject`: "NEW LEAD — hixsonregencyhouse.com contact
form", "Respite booking request", "Reserve a suite", "Book a visit", "Chat callback request",
"Share an article"), `page`, `reason=primary`, `rh_src`, `hp`, `el` (ms since page load),
`lead_source` (`google_ads`, `utm source / medium`, `referral: host` or `direct`) and the raw
first-touch keys when present (`gclid`, `gbraid`, `wbraid`, `utm_*`, `referrer`, `landing_page`,
remembered per browser session in `sessionStorage.rh_attr`). Form-specific fields: respite
`check_in`, `check_out`, `nights`, `stay_type`, `suite_preference`, `notes`,
`agreed_to_booking_rules`; reserve `stay_type`, `apartment_preference`, `timing`, `notes`,
`inquiry_from`; visit `visit_day`, `visit_time`, `lead_id`; chat `chat_question`, `interest`,
`inquiry_from`; share `article_url`, `article_note`. Fields whose name starts with `_` are
FormSubmit instructions and never reach the hook.

To test without posting anything real: serve `public/` locally and intercept the hook with
Playwright (`page.route`), as the headless suite used before each release does.

## Ask-us chat (`public/assets/js/chat.js`)

A keyword knowledge base, no AI service. Answers come only from facts published on this site:
one inclusive rate quoted by phone (never a number), private pay plus PACE, Medicare does not
pay room and board, availability by phone, respite, no memory care (families needing a secure
setting are pointed to a licensed one), dining, apartments, pets ("ask us when you call"),
location, hours, jobs (call the main line). Edit the `KB` array to change an answer. The callback
form is an ordinary lead form (source "Chat callback request", `chat_question` carries the
visitor's questions). The chat does not load on `/team/`.

## Activities calendar

`/activities-calendar/` renders `content/calendar.json` through `render_calendar()` in
`build.py`. While `days` is empty the page shows "This month's calendar is at the front desk;
call (423) 870-0050". To publish a month, fill it in and rebuild:

```json
{
 "month": "December",
 "year": 2026,
 "note": "All activities are subject to change. Families are always welcome to join. Call (423) 870-0050 to plan a visit around an event.",
 "special": { "25": "Christmas Day", "31": "New Year's Eve" },
 "days": {
  "1": ["10:00 Seated exercise", "2:00 Bingo", "6:30 Movie night"],
  "2": ["10:30 Devotional", "2:00 Crafts: holiday wreaths"],
  "25": ["12:00 Christmas dinner with families"]
 }
}
```

Keys in `days` and `special` are the day of the month as a string; each event is "time title"
(a leading time is shown in bold) or plain text. No names of residents or staff.

## Team Login (`/team/`)

A staff page encrypted in the browser (AES-256-GCM; PBKDF2 per user) built by
`scripts/team-gate.mjs`. The readable page and the passwords are **never committed**; they live
in two private files outside the repo:

```bash
node scripts/team-gate.mjs /path/outside/repo/content.html /path/outside/repo/users.json
python3 build.py && git add content/team.html && git commit -m "Team Login: update"
```

`content.html` is the HTML shown after sign-in (it must contain a Sign out button with
`id="rh-signout"`); `users.json` is `[{"username": "...", "password": "..."}]` with 12+ random
characters from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` per password (passwords ignore case, spaces
and dashes). The script refuses input paths inside the repo. Re-running rotates the page key and
signs everyone out everywhere; to remove a person, re-run without them. `/team/` is noindex,
carries no Google tag, and its CSP allows only this site's scripts. Current page: links to the
Staff Login (UKG Ready) and Resident Portal placeholders, the lead tracker placeholder and the
facility phone. Credentials are held by ownership, not in this repo.

**No memory care page.** The community's licence carries no Alzheimer's or
dementia unit designation, so memory care is absent by design — not an
omission. The same rule applies to every article and news item: Regency House
offers assisted living and respite care, private pay (PACE participants welcome).
Never publish prices, specials, deposits, availability counts, the licence
number, or the names of ownership, staff or residents, and never imply that
Medicaid, TennCare, VA benefits or insurance are accepted. No merch, no
online checkout or deposits.

## Blog (Guides & Resources)

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
