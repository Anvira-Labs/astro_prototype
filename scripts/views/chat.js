// Zodiac Bee — Chat view. Token balance and message history are both real
// (persisted in the store), so a reload — or leaving for Wallet and coming
// back — doesn't lose either. The AI side is a canned reply pool cycled
// client-side (see the scoping note in README.md); everything around it —
// the deduction, the zero-balance lockout, the persistence — is real.
import { icon, showToast, nowLabel } from "../utils.js";
import { store, sendChatMessage } from "../store.js";

const REPLIES = [
  "Worth sitting with rather than deciding tonight — your 10th house activity peaks over the next three weeks, so the picture gets clearer, not murkier.",
  "This transit tends to reward people who ask for the resources they need up front, instead of proving themselves first and asking later.",
  "Nothing in the chart points to a deadline pressure that isn't already visible to you. Trust the timeline you were given.",
  "Your natal Mercury suggests you'll want this in writing before you commit — that instinct is worth honoring here.",
  "This is a stabilizing few weeks, not a turbulent one. The weight you're feeling is responsibility, not risk."
];
let replyIndex = 0;

function welcomeMessage() {
  const { sunSign } = store.state.profile;
  const article = /^[aeiou]/i.test(sunSign) ? "an" : "a";
  const text = sunSign
    ? `Good to see you. As ${article} ${sunSign}, you tend to move first and ask questions later — what's on your mind today?`
    : "Good to see you. What's on your mind today — a decision, a relationship, or just how the week is shaping up?";
  return { id: "welcome", who: "ai", text, ts: Date.now() };
}

export function renderChat(main) {
  main.classList.add("chat-scope");
  main.innerHTML = `
    <div class="disclaimer-row">
      ${icon.disclaimer}
      For reflection, not medical, legal or financial advice.
    </div>

    <div class="thread" id="thread"></div>

    <div id="composerArea">
      <div class="suggestions" id="suggestions">
        <button class="chip" data-prompt="Should I take the role?">Should I take the role?</button>
        <button class="chip" data-prompt="What does this mean for my finances?">What does this mean for my finances?</button>
        <button class="chip" data-prompt="How long does this transit last?">How long does this transit last?</button>
      </div>

      <div id="rechargeBanner" class="recharge-banner" hidden>
        ${icon.warning}
        <div class="recharge-banner-text">
          <strong>You're out of tokens</strong>
          <span>Recharge to keep this conversation going — your chart and history are saved.</span>
        </div>
        <a class="btn btn-primary btn-sm" href="#/wallet">Recharge</a>
      </div>

      <div class="composer-wrap">
        <div class="composer" id="composer">
          <textarea id="composerInput" rows="1" placeholder="Ask about your chart, a transit, a decision…"></textarea>
          <button class="send-btn" id="sendBtn" aria-label="Send message">${icon.send}</button>
        </div>
        <div class="cost-hint">
          <span>1 token per message</span>
          <span id="tokensLeftHint"></span>
        </div>
      </div>
    </div>
  `;

  const thread = main.querySelector("#thread");
  const composer = main.querySelector("#composer");
  const composerInput = main.querySelector("#composerInput");
  const sendBtn = main.querySelector("#sendBtn");
  const rechargeBanner = main.querySelector("#rechargeBanner");
  const suggestions = main.querySelector("#suggestions");
  const tokensLeftHint = main.querySelector("#tokensLeftHint");

  if (store.state.chat.messages.length === 0) {
    store.set((s) => s.chat.messages.push(welcomeMessage()));
  }

  function scrollToEnd() {
    thread.scrollTop = thread.scrollHeight;
  }

  function messageNode(msg) {
    const el = document.createElement("div");
    el.className = "msg msg-" + msg.who;
    el.innerHTML =
      '<div class="bubble"></div><div class="msg-meta">' + (msg.who === "user" ? "You" : "Zodiac Bee") + " · " + nowLabel() + "</div>";
    el.querySelector(".bubble").textContent = msg.text;
    return el;
  }

  function renderThread() {
    thread.innerHTML = "";
    store.state.chat.messages.forEach((msg) => thread.appendChild(messageNode(msg)));
    scrollToEnd();
  }

  function showTyping() {
    const el = document.createElement("div");
    el.className = "msg msg-ai";
    el.id = "typingMsg";
    el.innerHTML = '<div class="bubble typing-dots"><span></span><span></span><span></span></div>';
    thread.appendChild(el);
    scrollToEnd();
  }

  function removeTyping() {
    const el = thread.querySelector("#typingMsg");
    if (el) el.remove();
  }

  function renderComposerState() {
    const balance = store.state.wallet.balance;
    tokensLeftHint.textContent = balance + (balance === 1 ? " token left" : " tokens left");
    const isZero = balance <= 0;
    composer.classList.toggle("is-disabled", isZero);
    composerInput.placeholder = isZero ? "You're out of chat tokens" : "Ask about your chart, a transit, a decision…";
    composerInput.disabled = isZero;
    sendBtn.disabled = isZero;
    rechargeBanner.hidden = !isZero;
    suggestions.hidden = isZero;
  }

  function autosize() {
    composerInput.style.height = "auto";
    composerInput.style.height = Math.min(composerInput.scrollHeight, 96) + "px";
  }

  function send(text) {
    text = (text || "").trim();
    if (!text || store.state.wallet.balance <= 0) return;

    thread.appendChild(messageNode({ who: "user", text }));
    composerInput.value = "";
    autosize();
    scrollToEnd();
    showTyping();

    window.setTimeout(() => {
      const reply = REPLIES[replyIndex % REPLIES.length];
      replyIndex += 1;
      sendChatMessage(text, reply); // persists both messages + deducts the token
      removeTyping();
      thread.appendChild(messageNode({ who: "ai", text: reply }));
      scrollToEnd();
      renderComposerState();
    }, 900);
  }

  sendBtn.addEventListener("click", () => send(composerInput.value));
  composerInput.addEventListener("input", autosize);
  composerInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(composerInput.value);
    }
  });
  suggestions.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-prompt]");
    if (btn) send(btn.getAttribute("data-prompt"));
  });

  renderThread();
  renderComposerState();

  // Balance can change from elsewhere (a recharge on Wallet, a subscription
  // auto-send) even while this view stays mounted in a future multi-tab
  // sense; cheap to keep the composer state in sync regardless.
  return store.subscribe(renderComposerState);
}
