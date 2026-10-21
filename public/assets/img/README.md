# Photos

The site ships with light-blue **placeholder blocks** where photos belong, and a
hero that is designed to work without a photograph at all. So it is safe to
publish before the shoot — but photos are the biggest single conversion lever on
a senior living site. Get them done in week one.

## Shot list

| Save as | What it shows | Appears on |
|---|---|---|
| `exterior-front.webp` | Front entrance from the parking lot, straight on | Home, About |
| `apartment.webp` | A furnished resident apartment, lights on, curtains open | Assisted Living |
| `dining.webp` | The dining room **with residents and staff in it**, mid-meal | Home |
| `activity.webp` | An activity or common room, people mid-activity | Amenities |
| `caregiver.webp` | A staff member with a resident, warm and candid | Respite Care |
| `courtyard.webp` | The courtyard on a good day | Home (map slot alternative) |

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
