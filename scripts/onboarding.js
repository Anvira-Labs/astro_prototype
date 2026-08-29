// Zodiac Bee prototype — Onboarding flow interaction
(function () {
  var panels = Array.prototype.slice.call(document.querySelectorAll(".step-panel"));
  var dots = Array.prototype.slice.call(document.querySelectorAll(".progress-dot"));
  var current = 1;
  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var tobInput = document.getElementById("fTob");
  var noTimeCheckbox = document.getElementById("fNoTime");
  var noTimeHint = document.getElementById("noTimeHint");
  if (noTimeCheckbox) {
    noTimeCheckbox.addEventListener("change", function () {
      var skipTime = noTimeCheckbox.checked;
      tobInput.disabled = skipTime;
      noTimeHint.hidden = !skipTime;
      if (skipTime) tobInput.value = "";
    });
  }

  var loadingLines = [
    "Mapping the sky at your first breath…",
    "Calculating your houses…",
    "Placing your planets…",
    "Almost there…"
  ];

  function showPanel(n) {
    current = n;
    panels.forEach(function (p) {
      p.classList.toggle("is-active", parseInt(p.getAttribute("data-panel"), 10) === n);
    });
    dots.forEach(function (d) {
      var step = parseInt(d.getAttribute("data-step"), 10);
      d.classList.toggle("is-done", step < n);
      d.classList.toggle("is-active", step === n);
    });
  }

  document.addEventListener("click", function (e) {
    var nextBtn = e.target.closest("[data-next]");
    var backBtn = e.target.closest("[data-back]");
    if (nextBtn) {
      if (current === 2) {
        showPanel(3);
        runLoading();
      } else if (current < 4) {
        showPanel(current + 1);
      }
    } else if (backBtn && current > 1) {
      showPanel(current - 1);
    }
  });

  function applyRevealCopy() {
    var headline = document.getElementById("revealHeadline");
    var body = document.getElementById("revealBody");
    if (noTimeCheckbox && noTimeCheckbox.checked) {
      headline.textContent = "Aries";
      body.textContent = "A quick-start, action-first temperament. Add your exact birth time later and we'll layer in your moon and rising sign for a fuller reading.";
    } else {
      headline.textContent = "Aries, with a Capricorn moon";
      body.textContent = "A quick-start temperament paired with a patient, long-game emotional core — you'll see both show up in your readings.";
    }
  }

  function runLoading() {
    var line = document.getElementById("loadingLine");
    var i = 0;
    line.textContent = loadingLines[0];
    // Real network/compute latency here is near-instant (a cached lookup once the
    // chart exists) — this delay is purely the reveal pacing, so honor reduced-motion
    // by collapsing it instead of forcing everyone through the same fixed wait.
    var stepMs = reducedMotion ? 0 : 450;
    var totalMs = reducedMotion ? 0 : 1900;
    var interval = window.setInterval(function () {
      i += 1;
      if (i < loadingLines.length) {
        line.textContent = loadingLines[i];
      }
    }, Math.max(stepMs, 1));
    window.setTimeout(function () {
      window.clearInterval(interval);
      applyRevealCopy();
      showPanel(4);
    }, totalMs);
  }
})();
