# SUNSHINE — Full Aero foundation

**Parts 1–5 implemented**

- Review sheet: [`aero-moodboard.html`](aero-moodboard.html)
- Tokens: [`../css/aero-tokens.css`](../css/aero-tokens.css)
- Live theme: [`../css/aero.css`](../css/aero.css)
- Assets and attribution: [`../images/aero/SOURCES.md`](../images/aero/SOURCES.md)

## Direction

A sunlit, late-2000s desktop atmosphere rebuilt as a personal portfolio. The design
uses aqua glass, sky and water photography, lime hills and one warm SUNSHINE orange.
It should feel optimistic and tactile without reproducing Microsoft logos, icons or
default wallpapers.

**Working phrase:** *Sunshine in the clear.*

## Design decisions

### Colour

| Token | Value | Use |
| --- | --- | --- |
| Sky | `#2FA9E2` | atmosphere, links, large fields |
| Aqua | `#1ED3D1` | water, active glints, accents |
| Lime | `#85D923` | growth, positive status |
| SUNSHINE | `#FFA31F` | primary action, warmth |
| Ink | `#0B324E` | body copy and grounding |
| Cloud | `#F3FCFF` | glass and breathing room |

Deep-sky and ink surfaces carry white text. Orange never carries small white text:
primary buttons use `#4A2600` ink on the orange fill.

### Typography

- Native target: **Segoe UI** / **Segoe UI Light**.
- Cross-platform fallback: **Source Sans 3** (humanist sans, loaded as a webfont).
- One family, four roles: light display, 600 headings, 400 body, 600 wide labels.
- Thai copy (`lang="th"`) uses **Sarabun** 400/600 so the recipient name and Thai
  labels keep their proportions. Segoe UI font files are never redistributed.
- Display tracking: `-0.035em` to `-0.058em`; body copy never below 16px on desktop.
- Reference: Frutiger Aero Archive, *How to nail the Web 2.0 Gloss look on your
  website* (20 September 2025).

### Glass recipe

Each glass surface combines:

1. A translucent fill (clear 48%, frost 72%, deep 82%).
2. A small `backdrop-filter` budget: header **12px**, footer **10px**, buttons
   **9px**, back-to-top **8px**, small chips and badges **5–7px**. Large reading
   panels stay opaque; there is no large blurred surface over the moving sky.
3. A 1px white border and inset top highlight.
4. A soft blue-black outer shadow.
5. An opaque fallback if backdrop-filter is unavailable.

### Shape and motion

- Window radius: up to 32px; controls: pill or 10–14px.
- Hover changes are 120–220ms. No bounce on content panels.
- Cloud, bubble and scene drift are slow and decorative only.
- `prefers-reduced-motion` stops all non-essential animation.

## Asset roles

1. **bg-sky-hills** — fixed page atmosphere.
2. **hero-water-sun** — moodboard and glass-lab sample only; not used on the live page.
3. **fg-cloud** — low-opacity cloud pass.
4. **fg-hills** — bottom ground anchor.
5. **fg-bubbles** — floating ambient detail.
6. **fg-splash** — water flourish between sections or in the footer.
7. **fg-leaves** — optional edge framing, kept subtle.

The moodboard uses all seven. Part 2 should use only what supports the shell and keep
below-the-fold images lazy-loaded.

## Guardrails

- Keep all four tabs: **Home / My Certificate / About Me / Info Me**.
- Keep SUNSHINE branding and every existing profile link.
- No Microsoft logos, Windows flag, default OS wallpapers or trademarked artwork.
- Archive images are **personal / non-commercial only**. Replace or licence them
  before any commercial use.
- Preserve the existing reveal fallback: content must remain visible if motion or
  JavaScript fails.
- Total archive imagery: 1.2 MB. Prefer CSS for bubbles, light and reflections where
  it performs better than another raster layer.

## Part 2 handoff

1. Import `css/aero-tokens.css` into the live page.
2. Replace the dark canvas with the fixed sky/hills scene and optional cloud/bubble
   layers.
3. Rebuild the header as a floating glass shell; restyle the SUNSHINE logo without
   adding an operating-system mark.
4. Apply the four-tab nav with an active deep-sky state.
5. Test header readability at 320, 768, 1024 and 1440px before moving to Part 3.

### Performance note

The review sheet deliberately uses `backdrop-filter` on several large panels so the
glass recipe can be judged at full size. Do not carry that density into the live
shell: limit blur to the fixed header, the tab bar and small controls, and avoid
animating a fixed background image behind large blurred surfaces. Keep decorative
cloud/bubble drift on cheap transforms and pause it for `prefers-reduced-motion`.

## Part 1 verification

- Lighthouse (review sheet, local): **Accessibility 100 / Best Practices 100 / SEO 100**.
- Responsive checks at 320, 390, 600, 704, 768, 840, 1024, 1280, 1440 and 1920px
  show no unintended horizontal overflow.
- All seven WebP assets load; the four decorative layers keep their natural aspect
  ratio at every tested width.
- Anchor links land below the sticky toolbar (`scroll-margin-top`: 7rem).

## Parts 2–5 implementation

The live page is now `index.html`, built on the Part 1 tokens.

- **Shell** — fixed `bg-sky-hills` atmosphere with a CSS sun glow, two cloud passes,
  a bubble layer and a light veil. The page opens directly on the active tab; the
  former startup overlay has been removed.
- **Chrome** — floating glass header, original SUNSHINE mark, four-tab navigation,
  compact stacked header at ≤760px, back-to-top control and a glass footer.
- **Home** — single-column hero with focus chips and three project cards.
  Project media carries a top scrim so the decorative card numbers stay legible.
- **Certificate / About / Info** — nearly opaque reading panels. The certificate and
  avatar load lazily. All original facts, copy and profile links are retained.
- **Navigation** — `switchTab()` updates `aria-current`, the URL hash and history.
  Deep links and Back/Forward open the matching tab. Non-tab anchors are ignored so
  the skip link does not change views.
- **Motion** — staggered reveals, heading decode and pointer parallax. All decorative
  motion is disabled under `prefers-reduced-motion`; the reveal fallback remains in
  place for environments that skip animations.
- **Glass budget** — blur is limited to the header, tab bar, small controls and
  footer. Large reading surfaces stay nearly opaque. No large blurred surface sits
  over an animated fixed image.
- **Assets** — four of the seven archive WebPs are used in the live page: the
  background is eager, the cloud and bubble layers are lazy, and the project art is
  set in CSS. Archive imagery totals 1.2 MB. No Microsoft marks, Windows flag or
  default wallpapers.
- **Caching** — local CSS, JS and favicon links use `?v=6`; bump the version after
  changing those assets.

## Subtle Web 2.0 gloss pass

A restrained polish pass, inspired by the Frutiger Aero Archive article, adds
material depth without bringing back the removed decorative chrome.

- **Glossy controls** — primary and glass buttons, the active tab and the
  back-to-top control get a `::before` top-highlight layer. The white gradient ends
  in a crisp stop at 50–55% on the orange and blue fills, with a softer falloff on
  clear glass. The layer sits at `z-index: -1` inside `isolation: isolate`, so labels
  stay above it.
- **Less frost** — blur was reduced across the shell (values above) so the sky reads
  through the glass instead of turning into opaque frosting.
- **One reflection** — the certificate image is mirrored under its frame via
  `.cert-frame::after`: 20% opacity, a 0.4px blur and a top-to-bottom fade. Space is
  reserved with `margin-bottom`; the reflection and that space are removed at
  ≤680px.
- **Stable layout** — `scrollbar-gutter: stable` prevents the 6px horizontal jump
  when moving from a tall tab to a shorter one. The fixed atmosphere layer is
  `100vw` wide so the reserved gutter is filled by the sky, not a flat colour strip.
- **Back-to-top** — the control now appears after 240px of scroll. The previous
  480px threshold was unreachable on desktop after the intro removal.
- **No revival** — no intro overlay, hero window, window dots, orange logo orbs,
  sun orb, profile numbers or footer copyright line.

## Parts 2–5 verification

- Responsive sweep at 320, 390, 430, 600, 704, 768, 840, 1024, 1280, 1440 and
  1920px: no unintended horizontal overflow. The header stacks at ≤760px; the
  reading panels stack at ≤900px.
- Mobile visual QA at 320 and 390px for Home, Certificate, About, Info and the footer.
- Startup overlay removed: no `#print-intro` markup, styles or `is-printing` state
  remains. Home and deep links open immediately.
- Decorative chrome removed: the hero scene window, header/footer orange marks,
  panel window dots, Info Me sun orb and profile-number labels are gone.
- Gloss pass checked at 320, 390, 840 and 1440px: button, active-tab and
  back-to-top highlights render; labels stay above the gloss; the certificate
  reflection is visible above 680px and absent at 390 and 320px; Thai copy uses
  Sarabun.
- Layout stability checked on direct `#about` / `#info` links: the scrollbar gutter
  is reserved and the atmosphere fills it, removing the former 6px sideways jump.
- Back-to-top verified at 1440px: it appears after 240px of scroll, is clickable and
  hides again at the top.
- Tabs, `aria-current`, URL hashes, direct deep links, Back/Forward, lazy
  certificate/avatar loading and the reveal fallback all verified.
- Keyboard skip link keeps the active tab selected, ignores the `#main-content` hash
  in tab routing and focuses `MAIN#main-content`.
- Reduced motion verified in headless Chrome at 320 and 390px: animations `none`,
  reveals visible, tab images loaded, no overflow.
- Lighthouse on Home, Certificate, About and Info: **Accessibility 100 / Best
  Practices 100 / SEO 100**, zero failures. CLS is 0 on Home/Certificate and
  0.032 on the shorter About/Info tabs.
- All local asset references return HTTP 200; the archive WebP total is
  1,199,456 bytes. No console errors.
