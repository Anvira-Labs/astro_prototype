// Zodiac Bee — ambient starfield/nebula drift for hero backgrounds (Home,
// Onboarding). Canvas rather than a pile of absolutely-positioned DOM
// elements: a few dozen "stars" as individually-animated nodes would be a
// lot of layout/paint surface for something that's meant to sit quietly
// behind real content, where a single canvas repaints itself cheaply
// (transform/opacity-equivalent work only — no layout is ever touched).
//
// Respects `prefers-reduced-motion: reduce`: the canvas still renders (an
// empty hero looks like a bug, not a design choice), but as one static frame
// instead of a running animation loop — no rAF, no drift, no twinkle.

/**
 * Mount a starfield onto `canvas` (a bare <canvas>, sized by its CSS layout —
 * this reads its rendered size, not attributes). Returns a `destroy()`
 * cleanup function; callers should invoke it when the view that owns the
 * canvas is torn down (e.g. return it from a router-registered handler), so
 * navigating away doesn't leave a requestAnimationFrame loop running behind
 * a screen nobody can see.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {{ density?: number, nebula?: boolean }} [options]
 *   density — a rough "stars per 90×90 CSS-pixel tile" figure; tune per hero
 *   size rather than an absolute star count so a small hero doesn't get
 *   crowded and a large one doesn't look sparse.
 *   nebula — whether to also paint the two soft radial-gradient washes
 *   ("nebula drift" — they very slightly breathe in opacity, not position).
 */
export function mountStarfield(canvas, { density = 90, nebula = true } = {}) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {}; // canvas unsupported/unavailable — no-op cleanup, nothing to tear down

  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let width = 0;
  let height = 0;
  let stars = [];
  let rafId = null;
  let destroyed = false;

  function seedStars() {
    // Scale the star count to the canvas's own area so a wide hero (desktop
    // nav-rail layout) doesn't look sparse and a short one doesn't look
    // crowded, rather than a single fixed count for every screen size.
    const tileArea = 90 * 90;
    const count = Math.round((width * height) / tileArea) * (density / 90);
    stars = Array.from({ length: Math.max(20, Math.round(count)) }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.3 + 0.35,
      baseAlpha: Math.random() * 0.5 + 0.35,
      twinkleSpeed: Math.random() * 0.0012 + 0.0005,
      phase: Math.random() * Math.PI * 2,
      // Drift is deliberately tiny (a fraction of a pixel per frame) — this
      // is meant to read as "the sky is alive," not as moving stars.
      driftX: (Math.random() - 0.5) * 0.012,
      driftY: (Math.random() - 0.5) * 0.009
    }));
  }

  function paintNebula(t) {
    // Two soft, off-palette washes (violet + gold) that very slowly breathe
    // in opacity — "nebula drift" without literally repositioning anything,
    // which keeps this cheap enough to run behind real UI.
    const breathe = reduceMotion ? 0 : Math.sin(t * 0.00025) * 0.4 + 0.6;
    const g1 = ctx.createRadialGradient(width * 0.18, height * 0.12, 0, width * 0.18, height * 0.12, Math.max(width, height) * 0.7);
    g1.addColorStop(0, `rgba(168, 130, 250, ${0.14 * breathe})`);
    g1.addColorStop(1, "rgba(168, 130, 250, 0)");
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, width, height);

    const g2 = ctx.createRadialGradient(width * 0.86, height * 0.2, 0, width * 0.86, height * 0.2, Math.max(width, height) * 0.55);
    g2.addColorStop(0, `rgba(233, 196, 106, ${0.11 * breathe})`);
    g2.addColorStop(1, "rgba(233, 196, 106, 0)");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, width, height);
  }

  function drawFrame(t) {
    ctx.clearRect(0, 0, width, height);
    if (nebula) paintNebula(t);
    stars.forEach((s) => {
      const twinkle = reduceMotion ? 1 : Math.sin(t * s.twinkleSpeed + s.phase) * 0.5 + 0.5;
      ctx.globalAlpha = s.baseAlpha * (0.5 + twinkle * 0.5);
      ctx.fillStyle = "#f6efff";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      if (!reduceMotion) {
        s.x += s.driftX;
        s.y += s.driftY;
        if (s.x < 0) s.x = width;
        else if (s.x > width) s.x = 0;
        if (s.y < 0) s.y = height;
        else if (s.y > height) s.y = 0;
      }
    });
    ctx.globalAlpha = 1;
  }

  function loop(t) {
    if (destroyed) return;
    drawFrame(t);
    rafId = window.requestAnimationFrame(loop);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap DPR — a crisper starfield isn't worth 3x the fill-rate on a high-DPI phone
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seedStars();
    drawFrame(0);
  }

  // ResizeObserver rather than a window "resize" listener: the hero's own
  // box can change (font load reflow, orientation change, the nav-rail
  // breakpoint) without the outer window ever firing "resize".
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();
  if (!reduceMotion) rafId = window.requestAnimationFrame(loop);

  return function destroy() {
    destroyed = true;
    if (rafId) window.cancelAnimationFrame(rafId);
    resizeObserver.disconnect();
  };
}
