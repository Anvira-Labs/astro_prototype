# Zodiac Bee

Your AI astrologer — chat about your chart, get a daily reading, and manage
your tokens. A real, installable mobile web app: no backend, but every
interaction actually works and persists, not a clickable mockup.

## Run it locally

Any static file server works — there's no build step.

```sh
python3 -m http.server 8080
# then open http://localhost:8080/
```

## What's real vs. simulated

This is a frontend-only build (no server, no database, no third-party
accounts wired in). Within that constraint, everything is genuinely
functional:

- **Real:** routing, state persistence (localStorage — reload or close the
  tab and your chat history, token balance, and subscription state are all
  still there), form validation, and the onboarding sun-sign calculation
  (computed from the date you enter using standard tropical zodiac
  boundaries — not a canned answer).
- **Simulated, clearly labeled as such in the UI:** the AI chat reply (a
  small canned reply pool, since no LLM API is connected), card capture and
  charges (no Stripe/payment processor is connected — "cards" are a label
  you type, and recharges apply instantly), and moon/rising sign placements
  (need a real ephemeris lookup this build doesn't have — the onboarding
  reveal says so instead of inventing a placement).

## Architecture

Vanilla JS, hash-routed single-page app:

- `index.html` — the app shell (topbar, nav rail, tabbar) plus the
  onboarding shell; toggled by the router.
- `scripts/store.js` — the one source of truth for app state, persisted to
  `localStorage` under `zodiacbee:v1`. Every screen reads/writes through it,
  so balance, chat, and subscription state agree everywhere.
- `scripts/router.js` — a small hash router (`#/chat`, `#/wallet`, …).
- `scripts/app.js` — wires the shared shell: nav highlighting, the topbar
  balance chip, theme toggle, PWA install prompt, service worker
  registration.
- `scripts/views/*.js` — one module per screen (home, chat, wallet,
  subscription, products, onboarding).
- `scripts/effects/starfield.js` — the ambient starfield/nebula-drift canvas
  mounted behind the Home and Onboarding heroes; respects
  `prefers-reduced-motion`. See `DESIGN_NOTES.md` for the rest of the
  "Celestial Noir" visual direction (palette, motion, glass-morphism).
- `styles/app.css` — the ZodiacBee design system: tokens, typography, and
  every shared component (buttons, cards, chips, the switch, the modal).

## PWA

`manifest.webmanifest` + `sw.js` make it installable — "Install app" shows
up in the topbar once Chrome deems it eligible, and it can be added to a
phone's home screen from the browser's own share/menu on iOS/Android. The
service worker caches the app shell for offline use; your data itself lives
in `localStorage`, not in the cache.
