// Zodiac Bee prototype — Subscription screen interaction
(function () {
  var pickerView = document.getElementById("pickerView");
  var manageView = document.getElementById("manageView");
  var planGrid = document.getElementById("planGrid");
  var channelGrid = document.getElementById("channelGrid");
  var subscribeBtn = document.getElementById("subscribeBtn");
  var editBtn = document.getElementById("editBtn");
  var pauseBtn = document.getElementById("pauseBtn");
  var cancelBtn = document.getElementById("cancelBtn");
  var statusPill = document.getElementById("statusPill");
  var planLabel = document.getElementById("planLabel");
  var nextSend = document.getElementById("nextSend");
  var channelSummary = document.getElementById("channelSummary");
  var cancelScrim = document.getElementById("cancelScrim");
  var cancelDismiss = document.getElementById("cancelDismiss");
  var cancelConfirm = document.getElementById("cancelConfirm");
  var toast = document.getElementById("toast");

  var selectedPlan = "Monthly plan";
  var isPaused = false;

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(function () { toast.classList.remove("is-visible"); }, 2800);
  }

  planGrid.addEventListener("click", function (e) {
    var card = e.target.closest(".radio-card");
    if (!card) return;
    Array.prototype.forEach.call(planGrid.querySelectorAll(".radio-card"), function (c) {
      c.setAttribute("aria-checked", "false");
    });
    card.setAttribute("aria-checked", "true");
    selectedPlan = card.getAttribute("data-plan");
  });

  function selectedChannels() {
    return Array.prototype.map.call(
      channelGrid.querySelectorAll('.channel-card[aria-checked="true"]'),
      function (c) { return c.getAttribute("data-channel"); }
    );
  }

  channelGrid.addEventListener("click", function (e) {
    var card = e.target.closest(".channel-card");
    if (!card) return;
    var checked = card.getAttribute("aria-checked") === "true";
    var willUncheck = checked && selectedChannels().length === 1;
    if (willUncheck) {
      showToast("Choose at least one delivery channel.");
      return;
    }
    card.setAttribute("aria-checked", checked ? "false" : "true");
  });

  subscribeBtn.addEventListener("click", function () {
    var channels = selectedChannels();
    planLabel.textContent = selectedPlan;
    channelSummary.textContent = channels.join(" + ");
    statusPill.textContent = "Active";
    statusPill.classList.remove("is-paused");
    nextSend.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>' +
      '<span>Next reading tomorrow at 7:00 AM via <strong>' + channels.join(" + ") + '</strong></span>';
    pauseBtn.textContent = "Pause deliveries";
    isPaused = false;
    pickerView.hidden = true;
    manageView.hidden = false;
    showToast("Subscribed — your first reading arrives tomorrow at 7:00 AM.");
  });

  editBtn.addEventListener("click", function () {
    manageView.hidden = true;
    pickerView.hidden = false;
  });

  pauseBtn.addEventListener("click", function () {
    isPaused = !isPaused;
    if (isPaused) {
      statusPill.textContent = "Paused";
      statusPill.classList.add("is-paused");
      nextSend.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>' +
        '<span>Paused — resume anytime before your next billing date.</span>';
      pauseBtn.textContent = "Resume deliveries";
      showToast("Deliveries paused.");
    } else {
      statusPill.textContent = "Active";
      statusPill.classList.remove("is-paused");
      nextSend.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>' +
        '<span>Next reading tomorrow at 7:00 AM via <strong>' + channelSummary.textContent + '</strong></span>';
      pauseBtn.textContent = "Pause deliveries";
      showToast("Deliveries resumed.");
    }
  });

  cancelBtn.addEventListener("click", function () { cancelScrim.classList.add("is-open"); });
  cancelDismiss.addEventListener("click", function () { cancelScrim.classList.remove("is-open"); });
  cancelScrim.addEventListener("click", function (e) {
    if (e.target === cancelScrim) cancelScrim.classList.remove("is-open");
  });
  cancelConfirm.addEventListener("click", function () {
    cancelScrim.classList.remove("is-open");
    statusPill.textContent = "Cancels Sep 30";
    statusPill.classList.add("is-paused");
    nextSend.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>' +
      '<span>You\'ll keep receiving readings through Sep 30, then delivery stops.</span>';
    pauseBtn.hidden = true;
    cancelBtn.hidden = true;
    showToast("Subscription cancelled — active through the end of this billing period.");
  });
})();
