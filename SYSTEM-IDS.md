# System IDs — Regency House Hixson marketing (no secrets here)

Business: Regency House Assisted Living, 2062 Hamill Road, Hixson, TN 37343.
Phone (423) 870-0050 (only number). Email info@hixsonregencyhouse.com.
Site https://www.hixsonregencyhouse.com (GitHub Pages, repo mechuz/Regency-House-Hixson-Website).
Old domain regencyhouse-hixson.com (GoDaddy): to be 301-forwarded to the site.
Rules: private pay, PACE participants welcome (Ascension Living Alexian PACE in Hamilton
County); never imply Medicaid, TennCare, Medicare, VA or insurance billing; no memory care
or skilled nursing; no prices, specials, deposits, availability feeds or merch; no licence
number; never name ownership, staff or residents. Time zone America/New_York.

Pages beyond the originals: /activities-calendar/ (content/calendar.json), /reserve/,
/paying-for-senior-living/, /visit/ (noindex), /team/ (noindex, encrypted staff page),
respite booking form on /respite-care/, Share an article on /news/, Ask-us chat on every
public page. Every form posts to the lead hook below through main.js (field rh_src).

build.py constants (empty = link not rendered): RESIDENT_PORTAL_URL = "" and
STAFF_LOGIN_URL = "" (UKG Ready). Ownership supplies both URLs.

| System | ID |
|---|---|
| Cloud environment | Regency House Hixson marketing (env_017W5cVnTzAqJUdC41QqTHtS) |
| Airtable base | applGKPSaitAuNQfZ (Regency House Hixson — Content Engine) |
| Content Topics | tbloItRRgsodfBCnE |
| Content Items | tblSFfvC2sMyfpjKR |
| News Items | tbl7fndFitE6ObJ4L |
| GBP Post Photos | tbl2kgdwv5SgogY5v |
| GBP Post Log | tbln5K0mM6tDld2IB |
| GBP Review Log | tblhctNHJxNXyPXOd |
| GBP Review Actions | tbl3HLZG39Aa61fIH |
| Manual Post Queue | tblRPDLBg8zvZTEsW |
| Lead hook (Zapier durable workflow) | 01a1c623-9709-788e-b8ed-cfe0a9c64e3e |
| Lead hook catch URL | https://hooks.zapier.com/hooks/catch/27563206/RAc4ZhMQP7nwB023/ |
| Lead "source" values the hook receives | NEW LEAD — hixsonregencyhouse.com contact form; Respite booking request; Reserve a suite; Book a visit; Chat callback request; Share an article |
| Team Login (/team/) | four logins: `kelli` (executive director), `frontdesk` (shared reception login), `owner` and `anatoliy` (ownership); passwords held by ownership, never in this repo; rebuild with scripts/team-gate.mjs from private files outside the repo (re-running signs everyone out) |
| Resident Portal URL | not supplied yet (RESIDENT_PORTAL_URL in build.py) |
| Staff Login UKG Ready URL | not supplied yet (STAFF_LOGIN_URL in build.py) |
| FormSubmit fallback | formsubmit.co/51b2551f2845c13f18729befdff08eb7 (activated for this domain) |
| Google Business Profile | Maps CID 12980515714540227546; claim pending (ownership) |
| GA4 property | not created yet |
| Google Ads customer | not created yet (own account, never Kirby's) |
| Search Console | not set up yet |
| Facebook page | https://www.facebook.com/regencyhouse2062/ (admin needed for Zapier) |
| Yelp | no listing yet |

Scheduled routines (bound to the CMO session):
- Hixson News Curator (daily 7:13 AM ET)
- Hixson Blog Writer (Sun/Mon/Wed/Fri 8:37 AM ET)
- Hixson Content Editor (daily 9:17 AM ET)
- Hixson Monday Report (Mon 7:47 AM ET)
- GitHub Actions publisher: publish-blog.yml daily 15:30 UTC (needs repo secret AIRTABLE_TOKEN)

## Lead tracker (Airtable base applGKPSaitAuNQfZ), built 2026-11-11

| Item | ID / URL |
|---|---|
| Leads table | tblRvLZylX70CZIFO (call fields: What happened on the call? fldHCfOCpSoBxl2sg, What's next? fldHQY9PwOS1S3tre, Call back on fldCVyjUtaDqqwfeY, Notes (optional) fldqqNDYsfdDwvauq, Last Touch Date fldXi7hlViDGinymJ, Touch Count fldq5Ik0fyCk82ugl, Last call result fld0bVLCWO0w7D1kk, call_priority fldaoLo0kDRd3XqLP; formulas Open? fldtnWZNZrPXGlWnU, Who to call fldpSfRVxV9vszVD1, Heads up flddl9BGDuZ9I8aIr, Reminder fldNrhqt28vyAtEWq, Call order fldcnMuLIFNSWizQV, Today order fldaDILdtARvBW9u9) |
| Referral Sources table | tblQF0Vb1VeuUZXWS |
| Automation: Website lead -> Leads row | wfliXbPKvMb95IjqV (webhook from the Zapier lead hook; must be switched ON by a person) |
| Automation: after a call is logged | wflg4OnzCsYd3gqCo (must be tested and switched ON by a person) |
| Interface "Regency House Calls" (staff) | pbdVTws5ZukL2Hth2: My Calls Today paggNRU7GLeYTtMEQ, Find a Family pagRFEkCx9ojEGRd2, Referral Partners pag72HHRUda4xUwMI, Call a Family pagSWeYJF5AFyeUxH, Partner Detail pagWduE7REAV96jBd |
| Interface "Regency House Lead Tracker" (managers) | pbdTarEFEhgjSkUTI: All Leads pag51za11xzBT8XH3, Tours & Applications page6MOdixjZjbHc2, Closed & Moved In pagv3JTNmDVrSPJJM, Results pagySlD2PONqad6Jc |
| Routines (this session) | Hixson Lead Intake every 2 h (trig_01ECWnFnkjcEDEZvZmpWGDrJ); Hixson Daily Call List weekdays 7:43 ET (trig_01JHJU6JWhpjKsqmq6dNTzRN) |
| Zapier lead hook | workflow 01a1c623-9709-788e-b8ed-cfe0a9c64e3e, version published 2026-11-11 with the Airtable tracker step |

Page links are https://airtable.com/applGKPSaitAuNQfZ/<pageId>. Staff are invited to the Calls interface only (Editor for the caller, Read only for overseers); never to the base.
