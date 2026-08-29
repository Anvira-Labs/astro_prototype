// Zodiac Bee prototype — Chat screen interaction
(function () {
  var state = { balance: 3 };

  var thread = document.getElementById("thread");
  var balanceChip = document.getElementById("balanceChip");
  var balanceValue = document.getElementById("balanceValue");
  var tokensLeftHint = document.getElementById("tokensLeftHint");
  var composer = document.getElementById("composer");
  var composerInput = document.getElementById("composerInput");
  var sendBtn = document.getElementById("sendBtn");
  var rechargeBanner = document.getElementById("rechargeBanner");
  var suggestions = document.getElementById("suggestions");
  var toast = document.getElementById("toast");

  var replies = [
    "Worth sitting with rather than deciding tonight — your 10th house activity peaks over the next three weeks, so the picture gets clearer, not murkier.",
    "This transit tends to reward people who ask for the resources they need up front, instead of proving themselves first and asking later.",
    "Nothing in the chart points to a deadline pressure that isn't already visible to you. Trust the timeline you were given.",
    "Your natal Mercury suggests you'll want this in writing before you commit — that instinct is worth honoring here.",
    "This is a stabilizing few weeks, not a turbulent one. The weight you're feeling is responsibility, not risk."
  ];
  var replyIndex = 0;

  function scrollToEnd() {
    thread.scrollTop = thread.scrollHeight;
  }

  function nowLabel() {
    var d = new Date();
    var h = d.getHours();
    var m = d.getMinutes();
    var ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return h + ":" + (m < 10 ? "0" : "") + m + " " + ampm;
  }

  function addMessage(text, who) {
    var msg = document.createElement("div");
    msg.className = "msg msg-" + who;
    var bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = text;
    var meta = document.createElement("div");
    meta.className = "msg-meta";
    meta.textContent = (who === "user" ? "You" : "Zodiac Bee") + " · " + nowLabel();
    msg.appendChild(bubble);
    msg.appendChild(meta);
    thread.appendChild(msg);
    scrollToEnd();
    return msg;
  }

  function showTyping() {
    var msg = document.createElement("div");
    msg.className = "msg msg-ai";
    msg.id = "typingMsg";
    var bubble = document.createElement("div");
    bubble.className = "bubble typing-dots";
    bubble.innerHTML = "<span></span><span></span><span></span>";
    msg.appendChild(bubble);
    thread.appendChild(msg);
    scrollToEnd();
  }

  function removeTyping() {
    var el = document.getElementById("typingMsg");
    if (el) el.remove();
  }

  function renderBalance() {
    balanceValue.textContent = state.balance;
    tokensLeftHint.textContent = state.balance + (state.balance === 1 ? " token left" : " tokens left");

    if (state.balance <= 0) {
      balanceChip.classList.add("is-zero");
      composer.classList.add("is-disabled");
      composerInput.setAttribute("placeholder", "You're out of chat tokens");
      composerInput.setAttribute("disabled", "disabled");
      sendBtn.setAttribute("disabled", "disabled");
      rechargeBanner.hidden = false;
      suggestions.hidden = true;
      tokensLeftHint.textContent = "0 tokens left";
    } else {
      balanceChip.classList.remove("is-zero");
      composer.classList.remove("is-disabled");
      composerInput.setAttribute("placeholder", "Ask about your chart, a transit, a decision…");
      composerInput.removeAttribute("disabled");
      sendBtn.removeAttribute("disabled");
      rechargeBanner.hidden = true;
      suggestions.hidden = false;
    }
  }

  function sendMessage(text) {
    text = (text || "").trim();
    if (!text || state.balance <= 0) return;

    addMessage(text, "user");
    composerInput.value = "";
    autosize();
    state.balance -= 1;
    renderBalance();

    showTyping();
    window.setTimeout(function () {
      removeTyping();
      var reply = replies[replyIndex % replies.length];
      replyIndex += 1;
      addMessage(reply, "ai");
    }, 900);
  }

  function autosize() {
    composerInput.style.height = "auto";
    composerInput.style.height = Math.min(composerInput.scrollHeight, 96) + "px";
  }

  sendBtn.addEventListener("click", function () {
    sendMessage(composerInput.value);
  });

  composerInput.addEventListener("input", autosize);
  composerInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(composerInput.value);
    }
  });

  suggestions.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-prompt]");
    if (!btn) return;
    sendMessage(btn.getAttribute("data-prompt"));
  });

  // Prototype-only quick state switches
  var protoFunded = document.getElementById("protoFunded");
  var protoZero = document.getElementById("protoZero");
  function setProtoState(funded) {
    protoFunded.setAttribute("aria-pressed", funded ? "true" : "false");
    protoZero.setAttribute("aria-pressed", funded ? "false" : "true");
    state.balance = funded ? 3 : 0;
    renderBalance();
  }
  protoFunded.addEventListener("click", function () { setProtoState(true); });
  protoZero.addEventListener("click", function () { setProtoState(false); });

  renderBalance();
  scrollToEnd();
})();
