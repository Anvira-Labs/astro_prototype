# Celestial Noir

A dark-mode-first, high-luxury visual direction for Zodiac Bee: a deep
space-navy/aubergine ground, an antique-gold signature accent used
sparingly, and a violet/magenta/teal jewel trio reserved for gradients and
glow. Built for a client comparing two competing directions in a ~$1M
pitch — the goal was execution that reads as a boutique jewelry brand met
an observatory, not a template reskin.

## Rationale

Most astrology apps default to either pastel "wellness app" territory or
garish "fortune-teller" neon; Celestial Noir sits deliberately between —
opulent and calm rather than loud. Making dark the *primary* theme (not a
media-query afterthought) is what makes the premium framing believable: the
ground gradient, the gold accent, and the glass-morphic panels are all
tuned first for a near-black stage, with light theme demoted to a secondary,
equally-considered but clearly-not-the-hero experience. Motion throughout is
slow and ambient (a drifting starfield, a 140-second wheel rotation, a
glowing nav underline) rather than flashy, because restraint is what reads
as expensive — a $200/month app doesn't need to prove itself with fast,
attention-grabbing animation. Every new surface (glass panels, the CTA
press-glow, the gold text tokens) was checked against WCAG AA contrast
rather than assumed, so the polish doesn't cost accessibility.

## Palette

**Dark theme (primary)**
| Swatch | Hex | Role |
|---|---|---|
| ██ | `#0d0a1a` | `--paper` — deep space-navy/plum ground |
| ██ | `#1a1330` | `--paper-raised` — card surfaces |
| ██ | `#070512` | `--paper-sunken` — recessed surfaces (inputs, composer) |
| ██ | `#f3ecfb` | `--ink` — primary text (warm ivory-lavender) |
| ██ | `#e9c46a` | `--brass` — signature antique-gold accent (fills) |
| ██ | `#f4c430` | `--brass-strong` — vivid gold (hover/emphasis fills) |
| ██ | `#f4c430` | `--brass-text` — AA-safe gold for standalone text (same as brass-strong here; the two verify differently against a dark ground) |
| ██ | `#a98bfa` | `--accent-violet` — jewel accent (gradients, glow, ghost-button ink) |
| ██ | `#ea63b3` | `--accent-magenta` — jewel accent |
| ██ | `#45e0c9` | `--accent-teal` — jewel accent |

**Light theme (secondary — OS preference or explicit toggle)**
| Swatch | Hex | Role |
|---|---|---|
| ██ | `#faf7fd` | `--paper` — soft-lavender ground |
| ██ | `#ffffff` | `--paper-raised` — card surfaces |
| ██ | `#2a1e42` | `--ink` — primary text (dark plum) |
| ██ | `#dda916` | `--brass` — gold accent (fills) |
| ██ | `#8a6800` | `--brass-text` — deliberately darker antique gold for standalone text (eyebrows, `.btn-text`, product categories, the active tab label) — `--brass`/`--brass-strong` are tuned as *fills* paired with dark `--on-brass` text on top and fail 4.5:1 as foreground text on a near-white page; `--brass-text` is the fix |

Glass-morphism and glow each get their own per-theme tokens
(`--glass-bg`, `--glass-border`, `--glass-border-violet`, `--glow-gold`) so
the blurred-panel and CTA-glow treatments read as "premium," not "washed
out," in both themes rather than sharing one value.

## Motion & interaction

- **Starfield / nebula drift** — `scripts/effects/starfield.js`, a small
  canvas module mounted behind the Home and Onboarding heroes: soft
  twinkling stars with a barely-perceptible drift, plus two breathing
  violet/gold nebula washes. Fully skips its animation loop (one static
  frame instead) under `prefers-reduced-motion: reduce`.
- **Rotating zodiac wheel** — a signature inline-SVG ring (outer rim, 12
  tick marks, 12 house-point dots) behind the Home headline, spinning once
  every 140 seconds via a pure CSS `@keyframes` — slow enough to read as
  ambient, never distracting.
- **Gold press-glow on primary CTAs** — `.btn-primary` gets a scale + gold
  glow pulse on press (not on hover). Wired via a delegated `pointerdown`/
  `animationend` listener in `app.js` so a full pulse plays even on a fast
  tap, where CSS `:active` alone would get cut short.
  Every screen's primary button gets this for free.
- **Route transitions** — `router.js` now dispatches a `routechange` DOM
  event right after each route mounts; `app.js` listens and plays a fade +
  slight-upward-slide (`.route-enter`) on whichever container just
  repainted. The router itself stays ignorant of the app shell's DOM.
- **"Alive" nav active state** — the flat active-tab color swap is replaced
  with a glowing gold underline that slides in (CSS `@keyframes`, re-armed
  every navigation because `[aria-current]` is removed/re-set fresh each
  route) on both the desktop nav rail and the mobile tabbar.
- **Glass-morphic panels** — blurred, translucent surfaces with a fine gold
  or violet-glow border: the AI chat bubble (violet), the wallet balance
  hero (gold, kept mostly-opaque so its light text never fights a
  light-theme backdrop showing through), and the subscription status card
  (gold).
- Existing motion (the onboarding constellation, the chart-reveal sun-glyph
  orbit/glow, the wordmark's cosmic pulse) was kept and re-tuned to the new
  palette rather than replaced.

All animation favors `transform`/`opacity`/canvas draws over layout-affecting
properties, and the existing global `prefers-reduced-motion` rule (which
collapses every CSS animation/transition to ~0) still covers everything
above it.

## Files touched

- `styles/app.css` — full token overhaul (dark-first architecture: bare
  `:root` now holds the dark values, with light demoted to
  `@media (prefers-color-scheme: light)` + `[data-theme="light"]`); new
  `--ground-gradient`, `--glass-*`, `--glow-gold`, `--brass-text` tokens;
  glass-morphic component treatments; gold press-glow keyframes; nav
  underline keyframes; route-transition keyframes; zodiac-wheel/starfield
  layout rules.
- `scripts/effects/starfield.js` — new module, the starfield/nebula canvas.
- `scripts/router.js` — dispatches a `routechange` event after each mount.
- `scripts/app.js` — route-transition listener; CTA press-glow listener.
- `scripts/utils.js` — added `icon.zodiacWheel`.
- `scripts/views/home.js` — starfield canvas + zodiac wheel markup, returns
  the starfield's cleanup to the router.
- `scripts/views/onboarding.js` — starfield canvas behind the whole flow,
  returns its cleanup to the router.
- `index.html` — dark-first `theme-color` meta.
- `manifest.webmanifest` — dark `background_color`/`theme_color`.
- `sw.js` — precaches the new effects module; cache version bumped.
- `README.md` — one-line mention of the new effects module.
