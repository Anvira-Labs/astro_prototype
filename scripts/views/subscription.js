// Zodiac Bee — Daily reading (subscription) view.
import { icon, showToast, wireModal, escapeHtml } from "../utils.js";
import { store, subscribeToReading, editSubscription, toggleSubscriptionPause, cancelSubscription } from "../store.js";

const PLANS = [
  { id: "Monthly plan", label: "Monthly", detail: "Billed every month", price: "$4.99/mo" },
  { id: "Quarterly plan", label: "Quarterly", detail: "Billed every 3 months · save ~13%", price: "$12.99/qtr" },
  { id: "Half-yearly plan", label: "Half-yearly", detail: "Billed every 6 months · save ~23%", price: "$22.99/6mo" }
];
const CHANNELS = [
  { id: "Push", label: "Push", detail: "To this device", icon: icon.push },
  { id: "WhatsApp", label: "WhatsApp", detail: "Opt in from Settings", icon: icon.whatsapp },
  { id: "Email", label: "Email", detail: "Opt in from Settings", icon: icon.email }
];

function previewLine() {
  const sign = store.state.profile.sunSign;
  return sign
    ? `<strong>Preview —</strong> "${escapeHtml(sign)}, today favors a conversation you've been putting off. Say the honest version."`
    : `<strong>Preview —</strong> "Today favors a conversation you've been putting off. Say the honest version."`;
}

export function renderSubscription(main) {
  let selectedPlan = store.state.subscription.plan || PLANS[0].id;
  let selectedChannels = new Set(store.state.subscription.channels.length ? store.state.subscription.channels : ["Push"]);

  main.innerHTML = `
    <div class="section">
      <div id="manageView" hidden>
        <div class="stack">
          <div class="page-head">
            <h1 class="h1">Your daily reading</h1>
            <p class="lede">A short, personalized horoscope delivered every morning based on your chart.</p>
          </div>
          <div class="sub-status-card">
            <div class="sub-status-top">
              <div>
                <span class="status-pill" id="statusPill">Active</span>
                <h3 class="h3" style="margin-top:.6rem" id="planLabel"></h3>
              </div>
              <button class="btn-text" id="editBtn">Change plan or channels</button>
            </div>
            <div class="next-send" id="nextSend"></div>
            <div class="delivery-preview">${icon.moon}<span id="previewLine">${previewLine()}</span></div>
            <div class="sub-actions">
              <button class="btn btn-ghost" id="pauseBtn">Pause deliveries</button>
              <button class="btn-danger-text" id="cancelBtn">Cancel subscription</button>
            </div>
          </div>
        </div>
      </div>

      <div id="pickerView">
        <div class="stack">
          <div class="page-head">
            <h1 class="h1">Get a daily reading</h1>
            <p class="lede">Pick a plan and where you'd like it delivered. You can change either anytime.</p>
          </div>

          <div class="stack">
            <h2 class="h2" style="font-size:1.15rem">Plan</h2>
            <div class="plan-grid" id="planGrid">
              ${PLANS.map(
                (p) => `
                <button class="radio-card" data-plan="${p.id}" aria-checked="${p.id === selectedPlan}">
                  <span class="radio-card-main">
                    <span class="dot"></span>
                    <span class="radio-card-text"><strong>${p.label}</strong><span class="small">${p.detail}</span></span>
                  </span>
                  <span class="radio-card-price mono-stat">${p.price}</span>
                </button>`
              ).join("")}
            </div>
            <p class="fine">Illustrative pricing — no payment processor is connected.</p>
          </div>

          <div class="stack">
            <h2 class="h2" style="font-size:1.15rem">Delivery channels</h2>
            <p class="small">Choose one or more. Each send uses 1 credit regardless of how many channels you pick.</p>
            <div class="channel-grid" id="channelGrid">
              ${CHANNELS.map(
                (c) => `
                <button class="channel-card" data-channel="${c.id}" aria-checked="${selectedChannels.has(c.id)}">
                  ${c.icon}
                  <span class="channel-card-text"><strong>${c.label}</strong><span class="fine">${c.detail}</span></span>
                  <span class="check-box">${icon.check}</span>
                </button>`
              ).join("")}
            </div>
          </div>

          <button class="btn btn-primary btn-block" id="subscribeBtn">Subscribe</button>
        </div>
      </div>
    </div>

    <div class="modal-scrim" id="cancelScrim">
      <div class="modal">
        <h3 class="h3">Cancel your daily reading?</h3>
        <p class="small">You'll keep receiving readings until the end of your current billing period. No partial refund is issued for time remaining.</p>
        <div class="modal-actions">
          <button class="btn btn-ghost" data-close>Keep subscription</button>
          <button class="btn btn-primary" id="cancelConfirm" style="background:var(--warning)">Cancel subscription</button>
        </div>
      </div>
    </div>
  `;

  const pickerView = main.querySelector("#pickerView");
  const manageView = main.querySelector("#manageView");
  const planGrid = main.querySelector("#planGrid");
  const channelGrid = main.querySelector("#channelGrid");
  const subscribeBtn = main.querySelector("#subscribeBtn");
  const editBtn = main.querySelector("#editBtn");
  const pauseBtn = main.querySelector("#pauseBtn");
  const cancelBtn = main.querySelector("#cancelBtn");
  const statusPill = main.querySelector("#statusPill");
  const planLabel = main.querySelector("#planLabel");
  const nextSend = main.querySelector("#nextSend");
  const cancelScrim = main.querySelector("#cancelScrim");
  const cancelConfirm = main.querySelector("#cancelConfirm");

  const cancelModal = wireModal(cancelScrim);

  function nextSendHtml(text) {
    return icon.clock + "<span>" + text + "</span>";
  }

  function renderManage() {
    const sub = store.state.subscription;
    pickerView.hidden = sub.subscribed;
    manageView.hidden = !sub.subscribed;
    if (!sub.subscribed) return;

    const planMeta = PLANS.find((p) => p.id === sub.plan);
    planLabel.textContent = planMeta ? planMeta.label : sub.plan;
    pauseBtn.hidden = sub.cancelled;
    cancelBtn.hidden = sub.cancelled;

    if (sub.cancelled) {
      statusPill.textContent = "Cancels " + sub.cancelEndLabel;
      statusPill.classList.add("is-paused");
      nextSend.innerHTML = nextSendHtml("You'll keep receiving readings through " + sub.cancelEndLabel + ", then delivery stops.");
    } else if (sub.paused) {
      statusPill.textContent = "Paused";
      statusPill.classList.add("is-paused");
      pauseBtn.textContent = "Resume deliveries";
      nextSend.innerHTML = nextSendHtml("Paused — resume anytime before your next billing date.");
    } else {
      statusPill.textContent = "Active";
      statusPill.classList.remove("is-paused");
      pauseBtn.textContent = "Pause deliveries";
      nextSend.innerHTML = nextSendHtml("Next reading tomorrow at 7:00 AM via <strong>" + sub.channels.join(" + ") + "</strong>");
    }
  }

  planGrid.addEventListener("click", (e) => {
    const card = e.target.closest(".radio-card");
    if (!card) return;
    planGrid.querySelectorAll(".radio-card").forEach((c) => c.setAttribute("aria-checked", "false"));
    card.setAttribute("aria-checked", "true");
    selectedPlan = card.getAttribute("data-plan");
  });

  channelGrid.addEventListener("click", (e) => {
    const card = e.target.closest(".channel-card");
    if (!card) return;
    const id = card.getAttribute("data-channel");
    const checked = selectedChannels.has(id);
    if (checked && selectedChannels.size === 1) {
      showToast("Choose at least one delivery channel.");
      return;
    }
    if (checked) selectedChannels.delete(id);
    else selectedChannels.add(id);
    card.setAttribute("aria-checked", String(!checked));
  });

  subscribeBtn.addEventListener("click", () => {
    subscribeToReading(selectedPlan, Array.from(selectedChannels));
    showToast("Subscribed — your first reading arrives tomorrow at 7:00 AM.");
  });

  editBtn.addEventListener("click", editSubscription);

  pauseBtn.addEventListener("click", () => {
    toggleSubscriptionPause();
    showToast(store.state.subscription.paused ? "Deliveries paused." : "Deliveries resumed.");
  });

  cancelBtn.addEventListener("click", cancelModal.open);
  cancelConfirm.addEventListener("click", () => {
    cancelModal.close();
    const end = new Date();
    end.setMonth(end.getMonth() + 1);
    const endLabel = end.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    cancelSubscription(endLabel);
    showToast("Subscription cancelled — active through the end of this billing period.");
  });

  renderManage();
  return store.subscribe(renderManage);
}
