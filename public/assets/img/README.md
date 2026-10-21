# Photos

The site ships with light-blue **placeholder blocks** where photos belong, and a
hero that is designed to work without a photograph at all. So it is safe to
publish before the shoot — but photos are the biggest single conversion lever on
a senior living site. Get them done in week one.

## Photos — five are ready to download, one needs a camera

Five representative images were generated in the practice's Canva account on
21 Oct 2026. They are **not photographs of Regency House**; the site's legal
footer already discloses "representative stock images", which covers them.
The sixth slot — the building itself — must be a real photograph, and the
About page deliberately shows a placeholder until one exists.

| Save as (exact) | Canva media ID | Appears on |
|---|---|---|
| `courtyard.webp` | `MAHYqwOzaf4` — two residents on a bench | Home (welcome) |
| `dining.webp` | `MAHYq107-bg` — resident laughing at lunch | Home (daily life) |
| `apartment.webp` | `MAHYq6gZeS4` — furnished studio | Assisted Living |
| `caregiver.webp` | `MAHYq-TkQOg` — caregiver with a resident | Respite |
| `activity.webp` | `MAHYq7GcHa8` — cards and coffee in the common room | Amenities |
| `exterior-front.webp` | **take this one** — the real front entrance | About |

### Getting the five Canva files onto the site (two minutes)
1. Open each link: `https://www.canva.com/M/<media ID>` (e.g.
   `https://www.canva.com/M/MAHYq107-bg`). Download at full size.
2. Rename to the filename in the table. WebP is preferred; JPG also works.
3. Drop them into this folder (`public/assets/img/`), run `python3 build.py`,
   commit, push. Each slot switches from placeholder to photo on its own —
   the page markup uses `{{photo:name|alt}}`, which only renders an `<img>`
   when the file exists.

Keep each under ~400KB: `sips -s format jpeg -s formatOptions 70
--resampleWidth 1600 in.jpg --out out.jpg` on a Mac, or any image optimiser.

### Shooting notes
- Morning or late afternoon. Midday sun blows out exteriors.
- Phone held **horizontally**, camera at chest height.
- **Get written photo consent** from any resident whose face is identifiable.
  This is not optional — an ALF publishing a resident's face without consent is
  a real liability. Shots from behind, or of hands and tables, need no consent
  and still work well.
- Avoid empty rooms. An empty dining room reads as a vacant building.

### Replacing a placeholder
Find the block in the relevant `content/*.html`:

```html
<div class="photo-placeholder">
  <span><strong>Photo: front entrance</strong>…</span>
</div>
```

Replace the whole `<div>` with:

```html
<img src="/assets/img/exterior-front.webp"
     alt="The front entrance of Regency House Assisted Living in Hixson, Tennessee"
     width="1200" height="900" loading="lazy">
```

Then run `python3 build.py`, commit and push.

**The build enforces that no photo is used twice** across the site — if you
reuse one, the build fails with the filename. That is deliberate: repeated
stock photos are the clearest tell of a thrown-together site.

### Using a photo in a hero
Heroes are light blue with dark text by default. If you put a photograph behind
one, add the `hero-photo` class so the dark scrim and white text apply:

```html
<section class="hero hero-photo" style="background-image:url('/assets/img/exterior-front.webp')">
```

## Logo
`favicon.svg` is a simple "RH" monogram standing in for a real logo. If Regency
House has one, add it here and swap the `.brand-text` block in
`templates/base.html` for an `<img>`. A 1:1 PNG is also needed for the Google
Ads business logo asset.
