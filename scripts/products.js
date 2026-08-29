// Ephemeris prototype — Product listing interaction
(function () {
  var filterRow = document.getElementById("filterRow");
  var viewToggle = document.getElementById("viewToggle");
  var productGrid = document.getElementById("productGrid");
  var cards = Array.prototype.slice.call(productGrid.querySelectorAll(".product-card"));
  var toast = document.getElementById("toast");

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(function () { toast.classList.remove("is-visible"); }, 2400);
  }

  filterRow.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-filter]");
    if (!btn) return;
    Array.prototype.forEach.call(filterRow.querySelectorAll("[data-filter]"), function (b) {
      b.setAttribute("aria-pressed", "false");
    });
    btn.setAttribute("aria-pressed", "true");
    var filter = btn.getAttribute("data-filter");
    cards.forEach(function (card) {
      var match = filter === "all" || card.getAttribute("data-category") === filter;
      card.style.display = match ? "" : "none";
    });
  });

  viewToggle.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-view]");
    if (!btn) return;
    Array.prototype.forEach.call(viewToggle.querySelectorAll("[data-view]"), function (b) {
      b.setAttribute("aria-pressed", "false");
    });
    btn.setAttribute("aria-pressed", "true");
    productGrid.classList.toggle("is-list", btn.getAttribute("data-view") === "list");
  });

  productGrid.addEventListener("click", function (e) {
    var link = e.target.closest(".product-link");
    if (!link) return;
    // Real outbound link (target="_blank" in the markup) — no preventDefault,
    // so this degrades correctly even if JS fails to bind. Toast just confirms.
    showToast("Opening " + link.getAttribute("data-retailer") + " in a new tab…");
  });
})();
