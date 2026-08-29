// Zodiac Bee prototype — shared theme toggle (light / dark / system)
// Persists an explicit choice in localStorage; falls back to the OS setting
// (prefers-color-scheme) when the visitor has never chosen one.
(function () {
  var STORAGE_KEY = "zodiac-bee-theme";

  function apply(theme) {
    if (theme === "light" || theme === "dark") {
      document.documentElement.setAttribute("data-theme", theme);
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }

  function current() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function systemPrefersDark() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  apply(current());

  function wireToggle() {
    var btn = document.querySelector("[data-theme-toggle]");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var stored = current();
      var effectiveDark = stored ? stored === "dark" : systemPrefersDark();
      var next = effectiveDark ? "light" : "dark";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch (e) {}
      apply(next);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireToggle);
  } else {
    wireToggle();
  }
})();
