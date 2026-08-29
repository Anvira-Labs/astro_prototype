// Ephemeris prototype — Wallet screen interaction
(function () {
  var balance = 82;
  var heroBalance = document.getElementById("heroBalance");
  var heroSub = document.getElementById("heroSub");
  var topBalance = document.getElementById("topBalance");
  var packGrid = document.getElementById("packGrid");
  var recSummary = document.getElementById("recSummary");
  var recBtn = document.getElementById("recBtn");
  var ledgerList = document.getElementById("ledgerList");
  var toast = document.getElementById("toast");
  var autoSwitch = document.getElementById("autoRechargeSwitch");
  var autoExplainer = document.getElementById("autoRechargeExplainer");
  var changeCardBtn = document.getElementById("changeCardBtn");
  var defaultCardLabel = document.getElementById("defaultCardLabel");
  var cardModalScrim = document.getElementById("cardModalScrim");
  var paymethodPicker = document.getElementById("paymethodPicker");
  var addCardBtn = document.getElementById("addCardBtn");
  var cardModalCancel = document.getElementById("cardModalCancel");
  var cardModalConfirm = document.getElementById("cardModalConfirm");

  var selectedPack = { tokens: 150, price: "12.99" };
  var defaultCard = "Visa •••• 4242";
  var pendingCard = defaultCard;

  var AUTO_ON_TEXT = "When a scheduled subscription send would take your balance negative, we top up your account with your default pack from your " + "%CARD% first, then send — so delivery never fails for lack of tokens.";
  var AUTO_OFF_TEXT = "Off — if your balance runs out before a scheduled daily send, delivery pauses and we'll notify you instead of charging your card automatically.";

  function autoOnText() {
    return AUTO_ON_TEXT.replace("%CARD%", defaultCard);
  }

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2600);
  }

  function renderBalance() {
    heroBalance.textContent = balance;
    topBalance.textContent = balance;
    heroSub.textContent = "≈ " + balance + " chat messages remaining";
  }

  packGrid.addEventListener("click", function (e) {
    var card = e.target.closest(".pack-card");
    if (!card) return;
    Array.prototype.forEach.call(packGrid.querySelectorAll(".pack-card"), function (c) {
      c.setAttribute("aria-checked", "false");
    });
    card.setAttribute("aria-checked", "true");
    selectedPack = {
      tokens: card.getAttribute("data-tokens"),
      price: card.getAttribute("data-price")
    };
    recSummary.innerHTML = "You'll get <strong>" + selectedPack.tokens + " tokens</strong> for <strong>$" + selectedPack.price + "</strong>";
  });

  recBtn.addEventListener("click", function () {
    recBtn.textContent = "Confirming…";
    recBtn.setAttribute("disabled", "disabled");
    window.setTimeout(function () {
      balance += parseInt(selectedPack.tokens, 10);
      renderBalance();
      var row = document.createElement("li");
      row.className = "ledger-row";
      row.innerHTML =
        '<span class="ledger-icon credit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v13"/><path d="M6 13l6 6 6-6"/></svg></span>' +
        '<span class="ledger-text"><strong>Recharge · ' + selectedPack.tokens + ' pack</strong><span class="fine">Just now</span></span>' +
        '<span class="ledger-amount mono-stat credit">+' + selectedPack.tokens + '</span>';
      ledgerList.insertBefore(row, ledgerList.firstChild);
      showToast("Charged via secure checkout — " + selectedPack.tokens + " tokens added");
      recBtn.textContent = "Recharge now";
      recBtn.removeAttribute("disabled");
    }, 900);
  });

  autoSwitch.addEventListener("click", function () {
    var on = autoSwitch.getAttribute("aria-checked") === "true";
    autoSwitch.setAttribute("aria-checked", on ? "false" : "true");
    autoExplainer.textContent = on ? AUTO_OFF_TEXT : autoOnText();
  });

  // ---- Change payment method modal ----
  function openCardModal() {
    pendingCard = defaultCard;
    Array.prototype.forEach.call(paymethodPicker.querySelectorAll(".paymethod-option"), function (opt) {
      opt.setAttribute("aria-checked", opt.getAttribute("data-card") === defaultCard ? "true" : "false");
    });
    cardModalScrim.classList.add("is-open");
    document.addEventListener("keydown", onModalKeydown);
  }

  function closeCardModal() {
    cardModalScrim.classList.remove("is-open");
    document.removeEventListener("keydown", onModalKeydown);
  }

  function onModalKeydown(e) {
    if (e.key === "Escape") closeCardModal();
  }

  changeCardBtn.addEventListener("click", openCardModal);
  cardModalCancel.addEventListener("click", closeCardModal);
  cardModalScrim.addEventListener("click", function (e) {
    if (e.target === cardModalScrim) closeCardModal();
  });

  paymethodPicker.addEventListener("click", function (e) {
    var opt = e.target.closest(".paymethod-option");
    if (!opt) return;
    Array.prototype.forEach.call(paymethodPicker.querySelectorAll(".paymethod-option"), function (o) {
      o.setAttribute("aria-checked", "false");
    });
    opt.setAttribute("aria-checked", "true");
    pendingCard = opt.getAttribute("data-card");
  });

  addCardBtn.addEventListener("click", function () {
    showToast("Adding a card opens Stripe-hosted checkout in the real product — mocked here for the prototype.");
  });

  cardModalConfirm.addEventListener("click", function () {
    defaultCard = pendingCard;
    defaultCardLabel.textContent = defaultCard;
    if (autoSwitch.getAttribute("aria-checked") === "true") {
      autoExplainer.textContent = autoOnText();
    }
    closeCardModal();
    showToast(defaultCard + " set as default payment method");
  });

  renderBalance();
})();
