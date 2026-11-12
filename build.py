#!/usr/bin/env python3
"""Static site builder for hixsonregencyhouse.com (Regency House Assisted Living).

Same engine as the kirbygateliving.com site, so fixes port between the two.

Wraps each content/*.html body in templates/base.html and writes the
result into public/. Page metadata lives in an HTML comment block at the
top of each content file:

    <!--meta
    title: Page Title
    description: Meta description.
    path: /some-page/
    nav: about        (which nav item gets aria-current)
    body_attr:  data-page="thank-you"   (optional)
    sitemap: yes|no   (default yes)
    robots: noindex, follow   (optional robots meta)
    analytics: no   (optional: drop the Google tag and lock scripts to this site)
    -->

The blog ("Family Resources", content/blog/) and the Senior Care News page
(content/news/) are built by build_blog() and build_news() below.

Usage: python3 build.py
"""
import datetime
import email.utils
import hashlib
import html as _html
import json
import pathlib
import re
import sys
import urllib.parse

ROOT = pathlib.Path(__file__).parent
TEMPLATE = (ROOT / "templates" / "base.html").read_text()
CONTENT = ROOT / "content"
PUBLIC = ROOT / "public"

SITE = "https://www.hixsonregencyhouse.com"
SITE_NAME = "Regency House Assisted Living"
PHONE_FMT = "(423) 870-0050"
PHONE_TEL = "4238700050"

# Utility links in the header and footer. Ownership supplies the URLs; while a
# constant is an empty string that link is not rendered anywhere on the site.
RESIDENT_PORTAL_URL = ""   # e.g. the resident / family billing portal sign-in page
STAFF_LOGIN_URL = ""       # the UKG Ready time clock sign-in page ("Staff Login (UKG Ready)")

NAV_KEYS = ["home", "about", "al", "respite", "amenities", "gallery", "rates", "reviews", "contact",
            "blog", "news", "cal", "reserve", "paying", "team"]


def utility_tokens():
    """Header/footer links that exist only when their URL constant is set, plus the
    header button: "Reserve a Suite" while content/reserve.html exists, otherwise
    "Schedule a Tour" (the Call button beside it is always there)."""
    portal = _html.escape(RESIDENT_PORTAL_URL, quote=True)
    staff = _html.escape(STAFF_LOGIN_URL, quote=True)
    tok = {
        "resident_portal_nav": (f'<li><a href="{portal}" target="_blank" rel="noopener" class="nav-portal" '
                                'data-track="resident-portal">Resident Portal</a></li>\n        ') if portal else "",
        "resident_portal_footer": (f'<li><a href="{portal}" target="_blank" rel="noopener">Resident Portal</a></li>\n        ') if portal else "",
        "staff_login_nav": (f'<li><a href="{staff}" target="_blank" rel="noopener" data-track="staff_login">'
                            'Time Clock (UKG Ready)</a></li>') if staff else "",
        "staff_login_footer": (f'<li><a href="{staff}" target="_blank" rel="noopener" data-track="staff_login">'
                               'Staff Login (UKG Ready)</a></li>\n        ') if staff else "",
    }
    if (CONTENT / "reserve.html").exists():
        tok["header_primary"] = '<a href="/reserve/" class="btn btn-primary header-tour" data-track="reserve-header">Reserve a Suite</a>'
        tok["nav_action_primary"] = '<a href="/reserve/" class="btn btn-primary" data-track="reserve-menu">Reserve a Suite</a>'
    else:
        tok["header_primary"] = '<a href="/contact-us/" class="btn btn-primary header-tour">Schedule a Tour</a>'
        tok["nav_action_primary"] = '<a href="/contact-us/" class="btn btn-primary">Schedule a Tour</a>'
    return tok

ICONS = {
 "dining":   '<path d="M5 3v7a3 3 0 0 0 6 0V3"/><path d="M8 3v18"/><path d="M18 3c-2.2 0-3.5 2.8-3.5 6v4H18v8"/>',
 "home":     '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
 "clock":    '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 "sparkle":  '<path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z"/>',
 "calendar": '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
 "pill":     '<path d="M10.5 3.5l10 10a4.95 4.95 0 0 1-7 7l-10-10a4.95 4.95 0 0 1 7-7z"/><path d="M8.5 8.5l7 7"/>',
 "tree":     '<path d="M12 2l6 9h-4l5 7H5l5-7H6z"/><path d="M12 18v4"/>',
 "car":      '<path d="M5 17h14M3 12l2-5h14l2 5v5H3z"/><circle cx="7.5" cy="17" r="1.5"/><circle cx="16.5" cy="17" r="1.5"/>',
 "heart":    '<path d="M12 21s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z"/>',
 "shield":   '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
 "users":    '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15 20a5 5 0 0 1 6-4"/>',
 "bed":      '<path d="M3 18v-8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8M3 14h18M7 8V6"/>',
 "phone":    '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
 "map":      '<path d="M12 21s6-5.5 6-11a6 6 0 0 0-12 0c0 5.5 6 11 6 11z"/><circle cx="12" cy="10" r="2.5"/>',
 "music":    '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
 "scissors": '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12"/>',
 "book":     '<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z"/>',
 "flame":    '<path d="M12 3c1 3 4 5 4 9a4 4 0 0 1-8 0c0-1.5.5-2.5 1-3.5.5 1.5 1.5 2 2 2 0-3-1-5 1-7.5z"/>',
 "dumbbell": '<path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12"/>',
 "eho":      '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 13h6M9 16h6"/>',
 "access":   '<circle cx="12" cy="4" r="1.6"/><path d="M10 8h5l1 5h4M10 8v5h5"/><path d="M8.5 13a4.5 4.5 0 1 0 6 5"/>',
 "brain":    '<path d="M9 4a3 3 0 0 0-3 3v1a3 3 0 0 0-2 5 3 3 0 0 0 2 5v1a3 3 0 0 0 6 0V7a3 3 0 0 0-3-3zM15 4a3 3 0 0 1 3 3v1a3 3 0 0 1 2 5 3 3 0 0 1-2 5v1a3 3 0 0 1-6 0V7a3 3 0 0 1 3-3z"/>',
}
def icon(name):
    body = ICONS[name]
    return ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" '
            'stroke-linecap="round" stroke-linejoin="round" width="26" height="26">' + body + '</svg>')

FAQ_RE = re.compile(
    r'<details class="faq-item">\s*<summary>(.*?)</summary>\s*'
    r'<div class="faq-a">(.*?)</div>\s*</details>', re.S)


def faq_schema(body: str) -> str:
    """Build FAQPage JSON-LD from the FAQs actually rendered on the page.

    Google requires FAQ structured data to match visible page content, so the
    schema is derived from the markup rather than maintained alongside it —
    edit a question in content/ and the schema follows automatically.
    """
    items = FAQ_RE.findall(body)
    if not items:
        return ""

    def plain(t):
        t = re.sub(r"<[^>]+>", " ", t)
        return " ".join(_html.unescape(t).split())

    data = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": plain(q),
             "acceptedAnswer": {"@type": "Answer", "text": plain(a)}}
            for q, a in items
        ],
    }
    return ('  <script type="application/ld+json">\n  '
            + json.dumps(data, indent=2, ensure_ascii=False).replace("</", "<\\/").replace("\n", "\n  ")
            + "\n  </script>\n")


PHOTO_RE = re.compile(r"\{\{photo:([a-z0-9-]+)\|([^}]*)\}\}")


def photo(m):
    """{{photo:name|alt text}} -> <img> when assets/img/name.(webp|jpg|png)
    exists, otherwise the dashed placeholder. Lets a photo be dropped into the
    folder and appear on the next build, with no risk of a broken image on the
    live site in the meantime."""
    name, alt = m.group(1), m.group(2)
    for ext in ("webp", "jpg", "png"):
        if (PUBLIC / "assets" / "img" / f"{name}.{ext}").exists():
            return (f'<img src="/assets/img/{name}.{ext}" alt="{alt}" '
                    f'width="1200" height="900" loading="lazy">')
    return ('<div class="photo-placeholder"><span><strong>Photo: ' + name +
            '</strong>Save <code>' + name + '.webp</code> into assets/img and rebuild</span></div>')


def parse(src: str, name="content file"):
    m = re.match(r"\s*<!--meta\s*(.*?)-->\s*", src, re.S)
    if not m:
        sys.exit(f"BUILD FAILED — {name} is missing its <!--meta --> block")
    meta = {}
    for line in m.group(1).strip().splitlines():
        k, _, v = line.partition(":")
        meta[k.strip()] = v.strip()
    return meta, src[m.end():]

def fhash(path):
    return hashlib.md5(path.read_bytes()).hexdigest()[:8]

def check_unique_images():
    """No photo may appear more than once across the whole site (visual slots only)."""
    import collections
    counts = collections.Counter()
    pat = re.compile(r"/assets/img/([A-Za-z0-9_-]+)\.webp")
    skip_prefixes = ("logo", "favicon", "floorplan")
    for f in CONTENT.glob("*.html"):
        if f.stem.endswith(".head"):
            continue
        txt = f.read_text()
        for name in pat.findall(txt) + [m.group(1) for m in PHOTO_RE.finditer(txt)]:
            if name.startswith(skip_prefixes):
                continue
            counts[name] += 1
    dups = {k: v for k, v in counts.items() if v > 1}
    if dups:
        sys.exit(f"BUILD FAILED — image(s) used more than once: {dups}")


# ---------------------------------------------------------------------------
# Activities calendar: {{calendar}} on /activities-calendar/ from content/calendar.json
#   {"month": "November", "year": 2026, "note": "...",
#    "special": {"26": "Thanksgiving"},
#    "days": {"1": ["10:00 Devotional", "2:00 Bingo"], ...}}
# An empty "days" object renders the front-desk notice instead of the grid.
# ---------------------------------------------------------------------------
def render_calendar():
    import calendar as _cal
    f = CONTENT / "calendar.json"
    if not f.exists():
        return ""
    d = json.loads(f.read_text())
    month_num = list(_cal.month_name).index(d["month"])
    days = d.get("days") or {}
    out = [f'<div class="center"><p class="eyebrow">Updated Monthly</p>'
           f'<h2>{_html.escape(d["month"])} {int(d["year"])} at Regency House</h2></div>']
    note = d.get("note")
    if not days:
        out.append('<div class="cal-empty"><h3>This month&rsquo;s calendar is at the front desk</h3>'
                   '<p>Our activity team posts the printed calendar in the community and keeps a copy at the front desk. '
                   f'Call <a href="tel:{PHONE_TEL}" data-track="phone">{PHONE_FMT}</a> and we will tell you what is on this week, '
                   'or plan your visit around an activity.</p>'
                   f'<a href="tel:{PHONE_TEL}" class="btn btn-primary" data-track="phone">Call {PHONE_FMT}</a></div>')
        if note:
            out.append(f'<p class="form-note center" style="margin-top:1.5rem">{note}</p>')
        return "\n".join(out)
    first_wd = _cal.weekday(d["year"], month_num, 1)      # Mon=0..Sun=6
    lead = (first_wd + 1) % 7                              # Sun-first grid
    ndays = _cal.monthrange(d["year"], month_num)[1]
    out.append('<div class="cal-wrap"><div class="cal-grid">')
    for w in ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]:
        out.append(f'<div class="cal-wd">{w}</div>')
    for _ in range(lead):
        out.append('<div class="cal-cell cal-blank"></div>')
    for day in range(1, ndays + 1):
        key = str(day)
        special = d.get("special", {}).get(key)
        badge = f'<span class="cal-badge">{_html.escape(special)}</span>' if special else ""
        evs = "".join(
            f'<li><strong>{_html.escape(e.split(" ", 1)[0])}</strong> {_html.escape(e.split(" ", 1)[1])}</li>'
            if " " in e and e.split(" ", 1)[0][0].isdigit() else f"<li>{_html.escape(e)}</li>"
            for e in days.get(key, []))
        wd_name = _cal.day_name[_cal.weekday(d["year"], month_num, day)]
        out.append(f'<div class="cal-cell"><div class="cal-day"><span class="cal-num">{day}</span>'
                   f'<span class="cal-wd-sm">{wd_name[:3]}</span>{badge}</div><ul>{evs}</ul></div>')
    out.append("</div></div>")
    if note:
        out.append(f'<p class="form-note center" style="margin-top:1.5rem">{note}</p>')
    return "\n".join(out)


# ---------------------------------------------------------------------------
# Shared rendering
# ---------------------------------------------------------------------------
def _ld(data):
    """A JSON-LD <script> block. "</" is escaped inside the JSON so that text from
    a content file or Airtable can never close the tag early."""
    return ('<script type="application/ld+json">'
            + json.dumps(data, ensure_ascii=False).replace("</", "<\\/") + "</script>\n")


def render_html(meta, body, head_extra=""):
    """Wrap a body in templates/base.html. Placeholders inside the body
    ({{phone_fmt}}, {{phone_tel}}, {{icon:...}}, {{photo:...}}) are resolved too."""
    html = TEMPLATE
    if meta.get("analytics", "yes").strip() == "no":
        # Staff/private pages: no Google tag, and only our own scripts may run.
        html = re.sub(r"\s*<!--analytics-->.*?<!--/analytics-->", "", html, flags=re.S)
        html = re.sub(r"script-src [^;]*;", "script-src 'self';", html, count=1)
        html = re.sub(r"connect-src [^;]*;", "connect-src 'self';", html, count=1)
        html = re.sub(r"frame-src [^;]*;", "frame-src 'none';", html, count=1)
        html = re.sub(r"form-action [^;]*;", "form-action 'none';", html, count=1)
    html = html.replace("{{content}}", body)
    robots = (('<meta name="robots" content="%s">\n  ' % _html.escape(meta["robots"].strip(), quote=True))
              if meta.get("robots") else "")
    repl = {
        "phone_tel": PHONE_TEL,
        "phone_fmt": PHONE_FMT,
        "title": _html.escape(meta["title"], quote=False),
        "description": _html.escape(meta.get("description", ""), quote=True),
        "path": meta["path"],
        "year": str(datetime.date.today().year),
        "css_v": fhash(PUBLIC / "assets" / "css" / "main.css"),
        "js_v": fhash(PUBLIC / "assets" / "js" / "main.js"),
        "head_extra": robots + meta.get("head_extra", "") + head_extra,
        "body_attr": (" " + meta["body_attr"]) if meta.get("body_attr") else "",
    }
    repl.update(utility_tokens())
    for key in NAV_KEYS:
        repl[f"active_{key}"] = 'aria-current="page"' if meta.get("nav") == key else ""
    for k, v in repl.items():
        html = html.replace("{{%s}}" % k, v)
    html = re.sub(r"\{\{icon:([a-z]+)\}\}", lambda m: icon(m.group(1)), html)
    html = PHOTO_RE.sub(photo, html)
    return html


def _fmt_date(iso):
    d = datetime.date.fromisoformat(iso)
    return f"{d.strftime('%B')} {d.day}, {d.year}"


def _rfc822(iso):
    d = datetime.date.fromisoformat(iso)
    dt = datetime.datetime(d.year, d.month, d.day, 12, 0, tzinfo=datetime.timezone.utc)
    return email.utils.format_datetime(dt)


# ---------------------------------------------------------------------------
# Blog ("Family Resources")
#
# One file per post in content/blog/<slug>.html, same <!--meta --> block as a
# page plus: date (YYYY-MM-DD, required), headline, excerpt, image, image_alt,
# author, tags (comma separated), keyword, updated (YYYY-MM-DD), status
# (published|draft; drafts are skipped). An optional content/blog/<slug>.head.html
# is injected into <head> (schema, extra meta). The build writes
# /blog/<slug>/index.html, /blog/index.html, /feed.xml and sitemap entries.
# ---------------------------------------------------------------------------
BLOG = CONTENT / "blog"
BLOG_TITLE = "Family Resources"
BLOG_DEFAULT_CARD_IMAGE = "/assets/img/exterior-front.webp"
ORG = {"@type": "Organization", "name": SITE_NAME, "url": SITE,
       "logo": {"@type": "ImageObject", "url": SITE + "/assets/img/logo.svg"}}


# The tour call to action under every blog post and news page ({{phone_*}} is resolved by render_html).
TOUR_CTA = """<div class="post-cta">
      <h2>Questions about assisted living in Hixson?</h2>
      <p>Our team answers questions like these every day, with no pressure. Call {{phone_fmt}} or schedule a private tour of Regency House on Hamill Road.</p>
      <p class="cta-actions"><a href="/contact-us/" class="btn btn-primary">Schedule a Tour</a> <a href="tel:{{phone_tel}}" class="btn btn-secondary" data-track="phone">Call {{phone_fmt}}</a></p>
    </div>"""


# Headlines from other publishers' feeds, collected by scripts/fetch_news_feeds.py
# (GitHub Actions, every few hours) into content/news_feeds.json.
NEWS_FEEDS = CONTENT / "news_feeds.json"


def load_feed_headlines():
    if not NEWS_FEEDS.exists():
        return [], ""
    try:
        data = json.loads(NEWS_FEEDS.read_text())
    except ValueError:
        print("news feeds: content/news_feeds.json is not valid JSON; skipped")
        return [], ""
    items = [i for i in data.get("items", []) if str(i.get("link", "")).startswith(("https://", "http://"))]
    return items, data.get("fetched_at", "")


def _headline_li(i):
    day = i["published"][:10]
    return (f'<li><a href="{_html.escape(i["link"])}" target="_blank" rel="noopener">{_html.escape(i["title"])}</a>'
            f'<span class="headline-meta">{_html.escape(i["source"])} &middot; <time datetime="{day}">{_fmt_date(day)}</time></span></li>')


def render_feed_headlines(items, fetched_at, limit=30):
    if not items:
        return ""
    updated = f' <span class="headlines-updated">Updated {_fmt_date(fetched_at[:10])}</span>' if fetched_at else ""
    sources = sorted({i["source"] for i in items})
    return (f'<section class="headlines" aria-labelledby="headlines-h"><h2 id="headlines-h">Headlines from across senior care{updated}</h2>'
            f'<p class="headlines-intro">The latest stories from {len(sources)} senior living, aging and benefits publishers. Each headline opens the original article.</p>'
            '<ol class="headline-list">' + "".join(_headline_li(i) for i in items[:limit]) + "</ol></section>")


def render_home_headlines(items, limit=4):
    """The {{news_headlines}} token on a page: the newest publisher headlines."""
    if not items:
        return ""
    return ('<section class="section section-alt home-news"><div class="container"><p class="eyebrow">Senior Care News</p>'
            '<h2>What families are reading this week</h2><ol class="headline-list headline-cards">'
            + "".join(_headline_li(i) for i in items[:limit])
            + '</ol><p class="center"><a href="/news/" class="btn btn-secondary btn-arrow">All senior care news</a></p></div></section>')


def load_posts():
    posts = []
    if not BLOG.exists():
        return posts
    for f in sorted(BLOG.glob("*.html")):
        if f.stem.endswith(".head"):
            continue
        meta, body = parse(f.read_text(), f.name)
        if meta.get("status", "published").strip().lower() == "draft":
            continue
        slug = meta.get("slug", f.stem).strip()
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug):
            sys.exit(f"BUILD FAILED — blog slug {slug!r} must be lowercase letters, digits and hyphens")
        if "date" not in meta:
            sys.exit(f"BUILD FAILED — blog post {f.name} has no date")
        datetime.date.fromisoformat(meta["date"])
        if meta.get("updated"):
            datetime.date.fromisoformat(meta["updated"])
        meta["path"] = f"/blog/{slug}/"
        meta.setdefault("nav", "blog")
        headline = meta.get("headline") or meta["title"].split(" | ")[0]
        words = len(re.sub(r"<[^>]+>", " ", body).split())
        head_file = BLOG / (f.stem + ".head.html")
        posts.append({
            "meta": meta, "body": body, "slug": slug, "path": meta["path"], "headline": headline,
            "excerpt": meta.get("excerpt") or meta.get("description", ""),
            "image": meta.get("image", ""), "image_alt": meta.get("image_alt", headline),
            "author": meta.get("author", SITE_NAME),
            "tags": [t.strip() for t in meta.get("tags", "").split(",") if t.strip()],
            "minutes": max(1, round(words / 200)),
            "head_extra": head_file.read_text() if head_file.exists() else "",
        })
    posts.sort(key=lambda p: (p["meta"]["date"], p["slug"]), reverse=True)
    return posts


def _post_card(p):
    img = p["image"] or BLOG_DEFAULT_CARD_IMAGE
    return (
        f'<article class="card post-card">'
        f'<a href="{p["path"]}" tabindex="-1" aria-hidden="true"><img src="{img}" alt="" loading="lazy"></a>'
        f'<div class="card-body">'
        f'<p class="post-meta"><time datetime="{p["meta"]["date"]}">{_fmt_date(p["meta"]["date"])}</time> &middot; {p["minutes"]} min read</p>'
        f'<h2 class="post-card-title"><a href="{p["path"]}">{_html.escape(p["headline"])}</a></h2>'
        f'<p>{_html.escape(p["excerpt"])}</p>'
        f'<a href="{p["path"]}" class="btn btn-secondary">Read the article</a>'
        f'</div></article>'
    )


def render_post(p, posts):
    m = p["meta"]
    hero_cls = ' hero-photo' if p["image"] else ""
    hero_style = f' style="background-image:url(\'{p["image"]}\')"' if p["image"] else ""
    tags = "".join(f'<li>{_html.escape(t)}</li>' for t in p["tags"])
    tags_html = f'<ul class="post-tags" aria-label="Topics">{tags}</ul>' if tags else ""
    related = [q for q in posts if q["slug"] != p["slug"]][:3]
    related_html = ""
    if related:
        related_html = (
            '<section class="section section-alt"><div class="container">'
            '<p class="eyebrow">Keep reading</p><h2>More family resources</h2>'
            f'<div class="card-grid post-list">{"".join(_post_card(q) for q in related)}</div>'
            '<p class="post-all"><a href="/blog/">All articles</a></p></div></section>'
        )
    body = f"""<section class="hero hero-page hero-post{hero_cls}"{hero_style}>
  <div class="container">
    <p class="eyebrow">{BLOG_TITLE}</p>
    <h1>{_html.escape(p["headline"])}</h1>
    <p class="tagline">{_html.escape(p["excerpt"])}</p>
  </div>
</section>
<section class="section">
  <article class="container narrow post">
    <p class="post-meta"><time datetime="{m["date"]}">{_fmt_date(m["date"])}</time> &middot; {_html.escape(p["author"])} &middot; {p["minutes"]} min read</p>
    <div class="post-body">
{p["body"]}
    </div>
    {tags_html}
    {TOUR_CTA}
    <p class="post-all"><a href="/blog/">All articles</a></p>
  </article>
</section>
{related_html}"""
    abs_url = SITE + p["path"]
    article = {
        "@context": "https://schema.org", "@type": "Article",
        "headline": p["headline"], "description": m.get("description", ""),
        "datePublished": m["date"], "dateModified": m.get("updated", m["date"]),
        "author": {"@type": "Organization", "name": SITE_NAME, "url": SITE},
        "publisher": ORG,
        "mainEntityOfPage": {"@type": "WebPage", "@id": abs_url},
    }
    if p["image"]:
        article["image"] = [SITE + p["image"]]
    if p["tags"]:
        article["keywords"] = ", ".join(p["tags"])
    crumbs = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
        {"@type": "ListItem", "position": 2, "name": BLOG_TITLE, "item": SITE + "/blog/"},
        {"@type": "ListItem", "position": 3, "name": p["headline"], "item": abs_url},
    ]}
    head = (
        _ld(article) + _ld(crumbs)
        + f'<meta property="article:published_time" content="{m["date"]}">\n'
        + (f'<meta property="og:image" content="{SITE}{p["image"]}">\n' if p["image"] else "")
        + p["head_extra"] + faq_schema(p["body"])
    )
    return render_html(m, body, head)


def render_blog_index(posts):
    meta = {
        "title": "Family Resources | Regency House, Hixson TN",
        "description": "Plain-language guides for families considering assisted living or respite care in Hixson and the Chattanooga area: what to look for on a tour, how care is assessed, questions to ask, and daily life at Regency House.",
        "path": "/blog/", "nav": "blog",
    }
    cards = "".join(_post_card(p) for p in posts)
    listing = (f'<div class="card-grid post-list">{cards}</div>' if cards else
               '<div class="post-empty"><h2>Articles are on the way</h2>'
               '<p>We are writing our first guides for families now. In the meantime, our team is glad to answer '
               'questions by phone at <a href="tel:{{phone_tel}}" data-track="phone">{{phone_fmt}}</a>, '
               'or you can <a href="/contact-us/">schedule a tour</a>.</p></div>')
    body = f"""<section class="hero hero-page">
  <div class="container">
    <p class="eyebrow">{BLOG_TITLE}</p>
    <h1>Guidance for families, from people who do this every day</h1>
    <p class="tagline">Plain answers about assisted living, respite care, and daily life in our Hixson community.</p>
  </div>
</section>
<section class="section">
  <div class="container">
    {listing}
    <p class="post-subscribe">Get new articles by RSS: <a href="/feed.xml">feed.xml</a></p>
  </div>
</section>"""
    head = _ld({
        "@context": "https://schema.org", "@type": "CollectionPage", "name": meta["title"],
        "url": SITE + "/blog/", "description": meta["description"], "publisher": ORG})
    return render_html(meta, body, head)


def render_feed(posts):
    items = []
    for p in posts[:20]:
        url = SITE + p["path"]
        items.append(
            f"  <item>\n    <title>{_html.escape(p['headline'])}</title>\n    <link>{url}</link>\n"
            f"    <guid isPermaLink=\"true\">{url}</guid>\n    <pubDate>{_rfc822(p['meta']['date'])}</pubDate>\n"
            f"    <description>{_html.escape(p['excerpt'])}</description>\n  </item>"
        )
    last = _rfc822(posts[0]["meta"]["date"]) if posts else _rfc822(datetime.date.today().isoformat())
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n'
        f'  <title>{SITE_NAME}: {BLOG_TITLE}</title>\n  <link>{SITE}/blog/</link>\n'
        '  <description>Guides for families considering assisted living and respite care in Hixson, Tennessee.</description>\n'
        f'  <language>en-us</language>\n  <lastBuildDate>{last}</lastBuildDate>\n'
        f'  <atom:link href="{SITE}/feed.xml" rel="self" type="application/rss+xml"/>\n'
        + ("\n".join(items) + "\n" if items else "") + "</channel>\n</rss>\n"
    )


def build_blog():
    """Write the blog pages and feed. Returns [(path, lastmod)] for the sitemap."""
    posts = load_posts()
    entries = []
    for p in posts:
        out = PUBLIC / p["path"].strip("/") / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(render_post(p, posts))
        entries.append((p["path"], p["meta"].get("updated", p["meta"]["date"])))
        print(f"built {out.relative_to(ROOT)}")
    (PUBLIC / "blog").mkdir(parents=True, exist_ok=True)
    (PUBLIC / "blog" / "index.html").write_text(render_blog_index(posts))
    (PUBLIC / "feed.xml").write_text(render_feed(posts))
    today = datetime.date.today().isoformat()
    entries.append(("/blog/", posts[0]["meta"]["date"] if posts else today))
    print(f"built blog index + feed.xml ({len(posts)} posts)")
    return entries


# ---------------------------------------------------------------------------
# Senior Care News
#
# A curated page of short summaries that link out to other publishers'
# articles, plus our own updates. One file per item in content/news/<slug>.html
# (the file name is the slug) with a <!--meta --> block: title, source,
# source_url (http(s); the community category may use a site path such as
# /blog/), date (YYYY-MM-DD, the day we posted it), published (the article's
# own date, optional), category (a NEWS_CATEGORIES key) and status
# (published|draft; drafts are skipped), then a short HTML body made of p, a,
# strong, em, ul, ol and li only. The build writes /news/index.html (the newest
# NEWS_PAGE_SIZE items under month headings), /news/archive/<year>/ for anything
# older, /news/feed.xml and sitemap entries.
# ---------------------------------------------------------------------------
NEWS = CONTENT / "news"
NEWS_TITLE = "Senior Care News"
NEWS_INTRO = ("Senior housing, senior care and caregiving news from trusted publishers, gathered by our team "
              "for families in Hixson and the Chattanooga area. The summaries are ours; the full stories belong to their publishers.")
NEWS_DISCLAIMER = ("We share these links for information only. They are not medical, legal or financial "
                   "advice, and we are not responsible for the content of other websites.")
NEWS_CATEGORIES = {      # meta category -> label on the badge and the filter chip (the Airtable option names)
    "finance": "Paying for care",
    "health": "Health & research",
    "caregiving": "Caregiving & family",
    "policy": "Policy & benefits",
    "industry": "Senior housing",
    "local": "Chattanooga & Hixson",
    "community": "Community update",
}
NEWS_PAGE_SIZE = 60      # newest items on /news/; older ones move to /news/archive/<year>/
NEWS_FEED_SIZE = 20      # items in /news/feed.xml and in the ItemList schema
NEWS_TAGS = {"p", "a", "strong", "em", "ul", "ol", "li"}
NEWS_TAG_RE = re.compile(r"</?([a-zA-Z][a-zA-Z0-9]*)")
NEWS_UNSAFE_RE = re.compile(r"</?(script|iframe|style|object|embed|form)\b|\son[a-z]+\s*=|javascript\s*:", re.I)
# The topic filter. The chip row starts hidden, so without JavaScript every item is simply shown.
NEWS_SCRIPT = """<script>
(function () {
  var chips = document.querySelector(".news-chips");
  if (!chips) return;
  chips.hidden = false;
  chips.addEventListener("click", function (e) {
    var chip = e.target.closest("button");
    if (!chip) return;
    var cat = chip.dataset.category;
    chips.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", b === chip ? "true" : "false"); });
    document.querySelectorAll(".news-item").forEach(function (it) { it.hidden = !!cat && it.dataset.category !== cat; });
    document.querySelectorAll(".news-group").forEach(function (g) { g.hidden = !g.querySelector(".news-item:not([hidden])"); });
    var empty = document.querySelector(".news-empty");
    if (empty) empty.hidden = !!document.querySelector(".news-item:not([hidden])");
  });
})();
</script>"""


def _is_http_url(url):
    try:
        parts = urllib.parse.urlsplit(url)
    except ValueError:
        return False
    return parts.scheme in ("http", "https") and bool(parts.netloc)


def _iso_date(value, what):
    """Normalise a YYYY-MM-DD string, or stop the build with a clear message."""
    try:
        return datetime.date.fromisoformat(value).isoformat()
    except ValueError:
        sys.exit(f"BUILD FAILED — {what} must be a YYYY-MM-DD date, not {value!r}")


def _plain_text(markup):
    """Tags stripped, entities resolved, whitespace collapsed (feed descriptions)."""
    text = re.sub(r"</?(?:a|strong|em)\b[^>]*>", "", markup)         # inline tags vanish...
    return " ".join(_html.unescape(re.sub(r"<[^>]+>", " ", text)).split())  # ...block tags become spaces


def load_news_items():
    items = []
    if not NEWS.exists():
        return items
    for f in sorted(NEWS.glob("*.html")):
        meta, body = parse(f.read_text(), f.name)
        if meta.get("status", "published").strip().lower() == "draft":
            continue
        slug = f.stem
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug):
            sys.exit(f"BUILD FAILED — news file name {f.name!r} must be lowercase letters, digits and hyphens")
        for key in ("title", "source_url", "date", "category"):
            if not meta.get(key, "").strip():
                sys.exit(f"BUILD FAILED — news item {f.name} has no {key}")
        category = meta["category"].strip().lower()
        if category not in NEWS_CATEGORIES:
            sys.exit(f"BUILD FAILED — news item {f.name} has unknown category {meta['category']!r} "
                     f"(use one of: {', '.join(NEWS_CATEGORIES)})")
        url = meta["source_url"].strip()
        external = _is_http_url(url)
        site_path = category == "community" and re.fullmatch(r"/(?!/)[^\s<>\"'\\]*", url) is not None
        if not (external or site_path):
            sys.exit(f"BUILD FAILED — news item {f.name} source_url must start with http:// or https://"
                     + (" (or / for a page on this site)" if category == "community" else ""))
        if NEWS_UNSAFE_RE.search(body):
            sys.exit(f"BUILD FAILED — news item {f.name} body contains script, iframe, style, object, embed, "
                     "form or an on* attribute")
        bad_tags = {t.lower() for t in NEWS_TAG_RE.findall(body)} - NEWS_TAGS
        if bad_tags:
            sys.exit(f"BUILD FAILED — news item {f.name} body may only use {', '.join(sorted(NEWS_TAGS))} tags, "
                     f"not {', '.join(sorted(bad_tags))}")
        published = meta.get("published", "").strip()
        source = meta.get("source", "").strip()
        if not source:
            source = (urllib.parse.urlsplit(url).hostname or url) if external else SITE_NAME
        items.append({
            "meta": meta, "body": body.strip(), "slug": slug, "title": meta["title"].strip(),
            "source": source, "url": url, "external": external,
            "date": _iso_date(meta["date"].strip(), f"news item {f.name} date"),
            "published": _iso_date(published, f"news item {f.name} published") if published else "",
            "category": category, "label": NEWS_CATEGORIES[category], "text": _plain_text(body),
        })
    items.sort(key=lambda i: (i["date"], i["slug"]), reverse=True)
    return items


def _news_abs(i):
    """The item's link as an absolute URL (community items may point at this site)."""
    return i["url"] if i["external"] else SITE + i["url"]


def _news_item(i):
    href = _html.escape(i["url"])
    target = ' target="_blank" rel="noopener"' if i["external"] else ""
    when = _html.escape(i["source"])
    if i["published"]:
        when += f' &middot; Published <time datetime="{i["published"]}">{_fmt_date(i["published"])}</time>'
    when += f' &middot; Shared <time datetime="{i["date"]}">{_fmt_date(i["date"])}</time>'
    more = f'Read the full story at {_html.escape(i["source"])}' if i["external"] else "Read more on our site"
    return (
        f'<article class="news-item news-{i["category"]}" id="{i["slug"]}" data-category="{i["category"]}">'
        f'<p class="news-badge">{_html.escape(i["label"])}</p>'
        f'<h3 class="news-title"><a href="{href}"{target}>{_html.escape(i["title"])}</a></h3>'
        f'<p class="news-meta">{when}</p>'
        f'<div class="news-body">{i["body"]}</div>'
        f'<p class="news-more"><a href="{href}"{target}>{more}</a></p>'
        f'</article>'
    )


def _news_groups(items):
    """Items (already newest first) grouped under month headings: [("October 2026", [...]), ...]."""
    groups = []
    for i in items:
        d = datetime.date.fromisoformat(i["date"])
        month = f"{d.strftime('%B')} {d.year}"
        if not groups or groups[-1][0] != month:
            groups.append((month, []))
        groups[-1][1].append(i)
    return groups


NEWS_INLINE_CTA = ('<aside class="news-cta"><p class="news-cta-title">Looking at assisted living for a parent?</p>'
                   '<p>See our apartments and common areas, or come for a visit and meet the team on Hamill Road.</p>'
                   '<p class="cta-actions"><a href="/contact-us/" class="btn btn-primary" data-track="news-tour">Schedule a Tour</a> '
                   '<a href="/rates-floor-plans/" class="btn btn-secondary" data-track="news-residences">Explore Residences</a></p></aside>')
NEWS_INLINE_AFTER = 3    # the inline tour card follows this many items on /news/
# "Share an article": readers suggest a story for the page. Goes through the site's one
# lead sender (main.js) to the lead hook with source "Share an article", article_url and
# article_note; the hook routes it to the content calendar. The URL field is allowed to
# contain a link (data-rh-allow-link), everything else is screened as usual.
NEWS_SHARE_FORM = """<aside class="news-share" id="share" aria-labelledby="news-share-h">
      <h2 id="news-share-h">Share an article</h2>
      <p>Read something families in Hixson should see? Send us the link and our team will consider it for this page.</p>
      <noscript><p class="form-note">This form needs JavaScript. Email the link to <a href="mailto:info@hixsonregencyhouse.com">info@hixsonregencyhouse.com</a>.</p></noscript>
      <form class="contact-form" action="/thank-you/" data-lead-form method="POST">
        <input type="hidden" name="_cc" value="info@hixsonregencyhouse.com">
        <input type="hidden" name="_template" value="table">
        <input type="hidden" name="_subject" value="Share an article">
        <input type="hidden" name="_next" value="https://www.hixsonregencyhouse.com/thank-you/">
        <input type="hidden" name="_captcha" value="false">
        <input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off" aria-hidden="true" aria-label="Leave this field empty">
        <div class="form-row"><label for="share-url">Link to the article *</label><input type="url" id="share-url" name="article_url" required placeholder="https://" data-rh-allow-link inputmode="url"></div>
        <div class="form-row"><label for="share-note">Why it matters (optional)</label><textarea id="share-note" name="article_note" rows="2" maxlength="500"></textarea></div>
        <div class="form-row"><label for="share-name">Your name *</label><input type="text" id="share-name" name="name" required autocomplete="name"></div>
        <div class="form-row"><label for="share-phone">Phone *</label><input type="tel" id="share-phone" name="phone" required autocomplete="tel"></div>
        <button type="submit" class="btn btn-secondary">Send the link</button>
        <p class="form-note">We read every suggestion; we cannot reply to each one. Your details are used only to follow up about the article and are never sold.</p>
      </form>
    </aside>"""


def _news_list(items, inline_cta=False):
    out, n = [], 0
    for month, group in _news_groups(items):
        parts = []
        for i in group:
            parts.append(_news_item(i))
            n += 1
            if inline_cta and n == NEWS_INLINE_AFTER:
                parts.append(NEWS_INLINE_CTA)
        out.append(f'<div class="news-group"><h2 class="news-month">{month}</h2>\n' + "\n".join(parts) + "\n</div>")
    return "\n".join(out)


def _news_chips():
    chips = ['<button type="button" data-category="" aria-pressed="true">All</button>'] + [
        f'<button type="button" data-category="{key}" aria-pressed="false">{_html.escape(label)}</button>'
        for key, label in NEWS_CATEGORIES.items()]
    return '<div class="news-chips" role="group" aria-label="Show one topic" hidden>' + "".join(chips) + "</div>"


def _news_crumbs(*extra):
    """BreadcrumbList for /news/ and the pages below it; extra = (name, path) pairs."""
    crumbs = [("Home", "/"), (NEWS_TITLE, "/news/"), *extra]
    return {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": n, "name": name, "item": SITE + path}
        for n, (name, path) in enumerate(crumbs, 1)]}


def render_news_index(items, archive_years):
    meta = {
        "title": "Senior Care News | Regency House, Hixson TN",
        "description": "Senior housing and senior care news for families: assisted living trends, paying for care, health research, caregiving, benefits and the Chattanooga area, summarized by Regency House Assisted Living in Hixson, Tennessee.",
        "path": "/news/", "nav": "news",
    }
    listing = _news_list(items, inline_cta=True)
    if listing:
        picks = (f'<h2 class="news-picks-h">Our picks, summarized by our team</h2>\n    {_news_chips()}\n'
                 '    <p class="news-empty" hidden>Nothing in this topic yet. Check back soon.</p>\n'
                 f'    {listing}')
    else:
        picks = ('<div class="post-empty"><h2>Our first picks are on the way</h2>'
                 '<p>Our team is gathering senior care news worth a family’s time. Check back soon, or call '
                 '<a href="tel:{{phone_tel}}" data-track="phone">{{phone_fmt}}</a> with any question about assisted living in Hixson.</p></div>')
    archive = ""
    if archive_years:
        links = " &middot; ".join(f'<a href="/news/archive/{y}/">{y}</a>' for y in archive_years)
        archive = f'<p class="news-archive">Older items: {links}</p>'
    body = f"""<section class="hero hero-page">
  <div class="container">
    <p class="eyebrow">For Families</p>
    <h1>{NEWS_TITLE}</h1>
    <p class="tagline">{NEWS_INTRO}</p>
  </div>
</section>
<section class="section">
  <div class="container narrow news">
    {render_feed_headlines(*load_feed_headlines())}
    {picks}
    {archive}
    {NEWS_SHARE_FORM}
    {TOUR_CTA}
    <p class="post-subscribe">Get new items by RSS: <a href="/news/feed.xml">news/feed.xml</a></p>
    <p class="news-disclaimer">{NEWS_DISCLAIMER}</p>
  </div>
</section>
{NEWS_SCRIPT}"""
    head = _ld({
        "@context": "https://schema.org", "@type": "CollectionPage", "name": meta["title"],
        "url": SITE + "/news/", "description": meta["description"], "publisher": ORG,
    }) + _ld({
        "@context": "https://schema.org", "@type": "ItemList", "name": NEWS_TITLE,
        "itemListOrder": "https://schema.org/ItemListOrderDescending",
        "numberOfItems": len(items[:NEWS_FEED_SIZE]),
        "itemListElement": [{"@type": "ListItem", "position": n, "name": i["title"], "url": _news_abs(i)}
                            for n, i in enumerate(items[:NEWS_FEED_SIZE], 1)],
    }) + _ld(_news_crumbs())
    return render_html(meta, body, head)


def render_news_archive(year, items, archive_years):
    meta = {
        "title": f"Senior Care News {year} | Regency House",
        "description": f"Older Senior Care News items from {year}: short summaries of articles about senior housing, paying for care, health research, caregiving and benefits, gathered for families by Regency House Assisted Living in Hixson, Tennessee.",
        "path": f"/news/archive/{year}/", "nav": "news",
    }
    others = " &middot; ".join(f"<strong>{y}</strong>" if y == year else f'<a href="/news/archive/{y}/">{y}</a>'
                               for y in archive_years)
    body = f"""<section class="hero hero-page">
  <div class="container">
    <p class="eyebrow">{NEWS_TITLE}</p>
    <h1>News archive: {year}</h1>
    <p class="tagline">{NEWS_INTRO}</p>
  </div>
</section>
<section class="section">
  <div class="container narrow news">
    <p class="news-archive"><a href="/news/">Latest news</a> &middot; Archive: {others}</p>
    {_news_chips()}
    <p class="news-empty" hidden>Nothing in this topic for {year}.</p>
    {_news_list(items)}
    <p class="news-disclaimer">{NEWS_DISCLAIMER}</p>
    <p class="post-all"><a href="/news/">Back to the latest news</a></p>
  </div>
</section>
{NEWS_SCRIPT}"""
    head = _ld({
        "@context": "https://schema.org", "@type": "CollectionPage", "name": meta["title"],
        "url": SITE + meta["path"], "description": meta["description"], "publisher": ORG,
    }) + _ld(_news_crumbs((f"{year} archive", meta["path"])))
    return render_html(meta, body, head)


def render_news_feed(items):
    out = []
    for i in items[:NEWS_FEED_SIZE]:
        out.append(
            f"  <item>\n    <title>{_html.escape(i['title'])}</title>\n    <link>{_html.escape(_news_abs(i))}</link>\n"
            f"    <guid isPermaLink=\"false\">{SITE}/news/#{i['slug']}</guid>\n    <pubDate>{_rfc822(i['date'])}</pubDate>\n"
            f"    <category>{_html.escape(i['label'])}</category>\n    <description>{_html.escape(i['text'])}</description>\n  </item>"
        )
    last = _rfc822(items[0]["date"]) if items else _rfc822(datetime.date.today().isoformat())
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n'
        f'  <title>{SITE_NAME}: {NEWS_TITLE}</title>\n  <link>{SITE}/news/</link>\n'
        f'  <description>{_html.escape(NEWS_INTRO)}</description>\n'
        f'  <language>en-us</language>\n  <lastBuildDate>{last}</lastBuildDate>\n'
        f'  <atom:link href="{SITE}/news/feed.xml" rel="self" type="application/rss+xml"/>\n'
        + ("\n".join(out) + "\n" if out else "") + "</channel>\n</rss>\n"
    )


def build_news():
    """Write the news page, its archive pages and feed. Returns [(path, lastmod)] for the sitemap."""
    items = load_news_items()
    by_year = {}
    for i in items[NEWS_PAGE_SIZE:]:
        by_year.setdefault(i["date"][:4], []).append(i)
    archive_years = sorted(by_year, reverse=True)
    (PUBLIC / "news").mkdir(parents=True, exist_ok=True)
    (PUBLIC / "news" / "index.html").write_text(render_news_index(items[:NEWS_PAGE_SIZE], archive_years))
    (PUBLIC / "news" / "feed.xml").write_text(render_news_feed(items))
    today = datetime.date.today().isoformat()
    entries = [("/news/", items[0]["date"] if items else today)]
    for year in archive_years:
        out = PUBLIC / "news" / "archive" / year / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(render_news_archive(year, by_year[year], archive_years))
        entries.append((f"/news/archive/{year}/", by_year[year][0]["date"]))
        print(f"built {out.relative_to(ROOT)}")
    print(f"built news index + news/feed.xml ({len(items)} items)")
    return entries


# ---------------------------------------------------------------------------
# Pages
# ---------------------------------------------------------------------------
def build():
    check_unique_images()
    sitemap_paths = []
    for f in sorted(CONTENT.glob("*.html")):
        if f.stem.endswith(".head"):
            continue
        meta, body = parse(f.read_text(), f.name)
        body = re.sub(r"\{\{icon:([a-z]+)\}\}", lambda m: icon(m.group(1)), body)
        body = PHOTO_RE.sub(photo, body)
        if "{{news_headlines}}" in body:
            body = body.replace("{{news_headlines}}", render_home_headlines(load_feed_headlines()[0]))
        if "{{calendar}}" in body:
            body = body.replace("{{calendar}}", render_calendar())
        # Per-page head extras stored in a sibling file, plus the FAQ schema derived from the markup
        extra_file = CONTENT / (f.stem + ".head.html")
        head_extra = (extra_file.read_text() + "\n" if extra_file.exists() else "") + faq_schema(body)
        html = render_html(meta, body, head_extra)
        path = meta["path"]
        out = PUBLIC / path.strip("/") / "index.html" if path != "/" else PUBLIC / "index.html"
        if f.stem == "404":
            out = PUBLIC / "404.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(html)
        if meta.get("sitemap", "yes") != "no" and f.stem != "404":
            sitemap_paths.append(path)
        print(f"built {out.relative_to(ROOT)}")

    blog_entries = build_blog()
    news_entries = build_news()
    today = datetime.date.today().isoformat()
    urls = "\n".join(
        [f"  <url><loc>{SITE}{p}</loc><lastmod>{today}</lastmod></url>" for p in sitemap_paths]
        + [f"  <url><loc>{SITE}{p}</loc><lastmod>{lm}</lastmod></url>" for p, lm in blog_entries + news_entries]
    )
    (PUBLIC / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"{urls}\n</urlset>\n"
    )
    (PUBLIC / "robots.txt").write_text(
        f"User-agent: *\nAllow: /\nSitemap: {SITE}/sitemap.xml\n"
    )
    # GitHub Pages custom domain
    (PUBLIC / "CNAME").write_text("www.hixsonregencyhouse.com\n")
    build_redirects()
    print(f"built sitemap.xml ({len(sitemap_paths) + len(blog_entries) + len(news_entries)} urls) + robots.txt")

def build_redirects():
    """GitHub Pages ignores public/_redirects (a Netlify/Cloudflare convention),
    so emit a meta-refresh stub for each legacy URL listed there. The stub is
    noindex + canonical to the target so search engines consolidate on the new URL."""
    rfile = PUBLIC / "_redirects"
    if not rfile.exists():
        return
    n = 0
    for line in rfile.read_text().splitlines():
        parts = line.split()
        if len(parts) < 2 or parts[0].startswith("#"):
            continue
        src, dst = parts[0], parts[1]
        target = dst if dst.startswith("http") else SITE + dst
        out = PUBLIC / src.strip("/") / "index.html"
        if out.exists() and "<!-- redirect stub -->" not in out.read_text():
            sys.exit(f"BUILD FAILED — redirect {src} collides with a real page")
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(
            "<!doctype html><!-- redirect stub --><html lang=\"en\"><head><meta charset=\"utf-8\">"
            f"<title>Redirecting…</title><meta name=\"robots\" content=\"noindex\">"
            f"<link rel=\"canonical\" href=\"{target}\">"
            f"<meta http-equiv=\"refresh\" content=\"0; url={target}\">"
            f"<script>location.replace(\"{target}\")</script></head>"
            f"<body><p>This page has moved to <a href=\"{target}\">{target}</a>.</p></body></html>\n"
        )
        n += 1
    print(f"built {n} redirect stubs from _redirects")

if __name__ == "__main__":
    build()
