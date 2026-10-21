# Photos

The site ships with light-blue **placeholder blocks** where photos belong, and a
hero that is designed to work without a photograph at all. So it is safe to
publish before the shoot — but photos are the biggest single conversion lever on
a senior living site. Get them done in week one.

## Photos — in place

Nine photographs of the residence are in use (21 Oct 2026). Each slot below is a
`{{photo:name|alt}}` macro in `content/`, so replacing a photo is just saving a
new file under the same name and rebuilding.

| File | Where | Note |
|---|---|---|
| `hero-exterior.webp` | Home — landing hero | Cropped from a wider shot to exclude the lawn sign |
| `entry.webp` | Home — welcome | Front entry with the monogram wreath |
| `dining.webp` | Home — daily life | Dining room |
| `exterior-front.webp` | About | Cropped to exclude the wall sign |
| `apartment.webp` | Assisted Living | Apartment sitting room |
| `respite-suite.webp` | Respite | Second apartment |
| `lounge.webp` | Amenities | Sitting room, Chattanooga prints |
| `bedroom.webp` | Residences & Rates | Bedroom |
| `kitchenette.webp` | Residences & Rates | Kitchenette |

**Why the two exteriors are cropped.** The source photographs carried signs with
invented lettering — a New York address and a wrong phone number on one, and
"Assisted Living & Memory Care" with a Virginia number on the other. Regency
House is not licensed for memory care. Those originals must not be used
anywhere — not on the site, the Google Business Profile, or in ad images. The
crops keep the building and lose the signs.

## Gallery photos — in place

Twelve resident and event photographs (supplied 21 Oct 2026) live in
`gallery/` as `<slug>.webp` (1400px long edge, opened in the lightbox) and
`<slug>-thumb.webp` (720px, shown in the grid). They appear on `/gallery/` and
in the four-photo strip on the home page. To add one: save both sizes under a
new slug, add a `<li class="gallery-item">` to `content/gallery.html`, rebuild.

**Consent.** Every resident in these photographs is identifiable. Keep a signed
photo release for each one on file at the facility, and remove the photo from
`content/gallery.html` (and the home strip in `content/index.html`) if a
resident or family withdraws permission. The footer states that residents
appear with their permission.

Still wanted when convenient: a courtyard or outdoor seating photo, and an
activity-room shot with people in it (with written consent for any identifiable
face).

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
