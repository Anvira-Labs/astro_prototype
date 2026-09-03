// Zodiac Bee — app bootstrap: wires the shell (topbar, nav, tabbar) that
// every non-onboarding route shares, registers routes with the router, and
// handles the cross-cutting stuff (theme, PWA install, service worker) that
// doesn't belong to any one screen.
import { router } from "./router.js";
import { store } from "./store.js";
import { renderHome } from "./views/home.js";
import { renderChat } from "./views/chat.js";
import { renderWallet } from "./views/wallet.js";
import { renderSubscription } from "./views/subscription.js";
import { renderProducts } from "./views/products.js";
import { renderOnboarding } from "./views/onboarding.js";

const appShell = document.getElementById("appShell");
const onboardShell = document.getElementById("onboardShell");
const appMain = document.getElementById("appMain");
const balanceValue = document.getElementById("balanceValue");
const balanceChips = document.querySelectorAll("[data-balance-chip]");

const TITLES = {
  home: "Home",
  chat: "Chat",
  wallet: "Wallet",
  subscription: "Daily Reading",
  products: "Picks",
  onboarding: "Get your reading"
};

function setActiveNav(name) {
  document.querySelectorAll("[data-nav]").forEach((el) => {
    if (el.getAttribute("data-nav") === name) el.setAttribute("aria-current", "page");
    else el.removeAttribute("aria-current");
  });
}

function mountAppScreen(name, render) {
  onboardShell.hidden = true;
  appShell.hidden = false;
  document.title = TITLES[name] + " · Zodiac Bee";
  setActiveNav(name);
  appMain.className = "app-main"; // reset any per-view scoping class (e.g. chat-scope) left by the previous screen
  window.scrollTo(0, 0);
  return render(appMain);
}

router.register("home", () => mountAppScreen("home", renderHome));
router.register("chat", () => mountAppScreen("chat", renderChat));
router.register("wallet", () => mountAppScreen("wallet", renderWallet));
router.register("subscription", () => mountAppScreen("subscription", renderSubscription));
router.register("products", () => mountAppScreen("products", renderProducts));
router.register("onboarding", () => {
  appShell.hidden = true;
  onboardShell.hidden = false;
  document.title = TITLES.onboarding + " · Zodiac Bee";
  window.scrollTo(0, 0);
  return renderOnboarding(onboardShell);
});

router.start({
  default: "home",
  guard(name) {
    if (name !== "onboarding" && !store.state.profile.onboarded) return "onboarding";
    return null;
  }
});

// ---- Shared topbar: balance chip -------------------------------------
function renderBalanceChips() {
  const balance = store.state.wallet.balance;
  if (balanceValue) balanceValue.textContent = balance;
  balanceChips.forEach((chip) => chip.classList.toggle("is-zero", balance <= 0));
}
renderBalanceChips();
store.subscribe(renderBalanceChips);

// ---- Theme toggle (light / dark / system) ----------------------------
// The actual light/dark class is applied by an inline script at the top of
// <head> (before first paint, to avoid a flash of the wrong theme) — this
// just wires the toggle button, wherever it appears (topbar or onboarding).
const THEME_KEY = "zodiac-bee-theme";
function systemPrefersDark() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}
document.addEventListener("click", (e) => {
  if (!e.target.closest("[data-theme-toggle]")) return;
  let stored = null;
  try {
    stored = localStorage.getItem(THEME_KEY);
  } catch (err) {
    /* private browsing, etc. — fall through to system */
  }
  const effectiveDark = stored ? stored === "dark" : systemPrefersDark();
  const next = effectiveDark ? "light" : "dark";
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch (err) {
    /* non-fatal — theme just won't persist across reloads */
  }
  document.documentElement.setAttribute("data-theme", next);
});

// ---- PWA: install prompt ----------------------------------------------
const installBtn = document.getElementById("installBtn");
let deferredInstallPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  if (installBtn) installBtn.hidden = false;
});
if (installBtn) {
  installBtn.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    installBtn.hidden = true;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
  });
}
window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  if (installBtn) installBtn.hidden = true;
});

// ---- PWA: service worker (offline app-shell caching) -------------------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((err) => {
      console.warn("Zodiac Bee: service worker registration failed.", err);
    });
  });
}
