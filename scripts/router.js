// Zodiac Bee — hash router
//
// Hash-based (#/chat, not /chat) on purpose: the app is served as static
// files with no server-side routing, and a hash route always resolves to
// the same index.html on any static host (or the PWA's cached shell) with
// zero rewrite-rule configuration.
const routes = new Map();
let guardFn = null;
let defaultRoute = "home";
let current = null;
let cleanup = null; // optional teardown returned by the previous view (e.g. store.subscribe's unsubscribe)

function parseHash() {
  // "#/chat" -> "chat". A bare "#" or "#recharge" (in-page anchor, not a
  // route) both fall through to "" so callers can tell "no route" from "a
  // route named recharge" — see the guard in app.js.
  const match = location.hash.match(/^#\/([a-z-]*)/i);
  return match ? match[1] : "";
}

function render() {
  let name = parseHash() || defaultRoute;
  if (!routes.has(name)) name = defaultRoute;
  if (guardFn) {
    const redirect = guardFn(name);
    if (redirect && redirect !== name) {
      router.navigate(redirect, { replace: true });
      return; // the replace above fires hashchange, which re-enters render()
    }
  }
  if (typeof cleanup === "function") cleanup();
  current = name;
  cleanup = routes.get(name)() || null;
}

export const router = {
  register(name, handler) {
    routes.set(name, handler);
  },
  /** `guard(name)` returns a different route name to redirect to, or a falsy value to allow it. */
  start({ default: def, guard } = {}) {
    if (def) defaultRoute = def;
    if (guard) guardFn = guard;
    window.addEventListener("hashchange", render);
    render();
  },
  navigate(name, { replace = false } = {}) {
    const target = "#/" + name;
    if (location.hash === target) {
      render(); // same route requested again (e.g. tapping the active tab) — re-render it
      return;
    }
    if (replace) location.replace(target);
    else location.hash = target;
  },
  get current() {
    return current;
  }
};
