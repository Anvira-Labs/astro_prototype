// Zodiac Bee — persisted app state (single source of truth)
//
// Every screen used to keep its own local `state` var, so the same person
// could show 82 tokens on Wallet and 3 on Chat depending on which screen you
// opened — fine for a clickable prototype where each screen loads alone, not
// for a real app. This module is the one place state lives: it loads from
// localStorage on boot, every mutation goes through `store.set()`, and every
// mutation re-persists and notifies subscribers (the topbar balance chip,
// whichever view is mounted, etc).
const STORAGE_KEY = "zodiacbee:v1";

const DEFAULT_STATE = {
  profile: {
    onboarded: false,
    name: "",
    contact: "",
    dob: "",
    tob: "",
    noTime: false,
    pob: "",
    sunSign: "",
    sunSignHeadline: "",
    sunSignBody: ""
  },
  wallet: {
    balance: 0,
    ledger: [], // { id, label, detail, amount, kind: 'credit' | 'debit' }
    savedCards: [], // { id, label, detail }
    defaultCardId: null,
    autoRecharge: true
  },
  chat: {
    messages: [] // { id, who: 'ai' | 'user', text, ts }
  },
  subscription: {
    subscribed: false,
    plan: "Monthly plan",
    channels: ["Push"],
    paused: false,
    cancelled: false,
    cancelEndLabel: ""
  }
  // Theme (light/dark/system) is intentionally not in here — it's read and
  // applied inline in <head>, before this module (or anything else) loads,
  // to avoid a flash of the wrong theme. See index.html and app.js.
};

function clone(value) {
  return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function load() {
  let saved = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) saved = JSON.parse(raw);
  } catch (e) {
    console.warn("Zodiac Bee: couldn't read saved state, starting fresh.", e);
  }
  if (!saved) return clone(DEFAULT_STATE);
  // Merge one level deep so a state saved by an older version of the app
  // (missing a newly-added field) doesn't crash the views that read it.
  const merged = clone(DEFAULT_STATE);
  for (const key of Object.keys(merged)) {
    if (saved[key] && typeof saved[key] === "object" && !Array.isArray(saved[key])) {
      Object.assign(merged[key], saved[key]);
    } else if (saved[key] !== undefined) {
      merged[key] = saved[key];
    }
  }
  return merged;
}

let state = load();
const listeners = new Set();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Zodiac Bee: couldn't save state — private browsing or full storage?", e);
  }
}

function notify() {
  listeners.forEach((fn) => fn(state));
}

let idCounter = 0;
export function nextId(prefix) {
  idCounter += 1;
  return prefix + "-" + Date.now().toString(36) + "-" + idCounter;
}

export const store = {
  get state() {
    return state;
  },
  /** Call `fn(draftState)` and mutate it directly; persists + notifies after. */
  set(fn) {
    fn(state);
    persist();
    notify();
  },
  /** Returns an unsubscribe function. */
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }
};

// ---- Actions -----------------------------------------------------------
// Small, named mutations so views read like "what happened" rather than
// reaching into `state.wallet.ledger` directly everywhere.

export function completeOnboarding({ name, contact, dob, tob, noTime, pob, sunSign, sunSignHeadline, sunSignBody }) {
  store.set((s) => {
    Object.assign(s.profile, { onboarded: true, name, contact, dob, tob, noTime, pob, sunSign, sunSignHeadline, sunSignBody });
    if (s.wallet.ledger.length === 0 && s.wallet.balance === 0) {
      s.wallet.balance = 10;
      s.wallet.ledger.unshift({ id: nextId("ledger"), label: "Free signup credit", detail: "Just now", amount: 10, kind: "credit" });
    }
  });
}

/** "Already have an account? Log in" — skips the birth-chart flow entirely. */
export function logInWithoutOnboarding() {
  store.set((s) => {
    s.profile.onboarded = true;
  });
}

export function sendChatMessage(text, replyText) {
  store.set((s) => {
    s.chat.messages.push({ id: nextId("msg"), who: "user", text, ts: Date.now() });
    s.wallet.balance = Math.max(0, s.wallet.balance - 1);
    s.wallet.ledger.unshift({ id: nextId("ledger"), label: "Chat message", detail: "Just now", amount: 1, kind: "debit" });
  });
  // The AI reply lands as its own action so the caller can delay it (typing
  // indicator) without holding the token deduction back.
  store.set((s) => {
    s.chat.messages.push({ id: nextId("msg"), who: "ai", text: replyText, ts: Date.now() });
  });
}

export function purchasePack(tokens, price) {
  store.set((s) => {
    s.wallet.balance += tokens;
    s.wallet.ledger.unshift({ id: nextId("ledger"), label: "Recharge · " + tokens + " tokens", detail: "Just now · $" + price, amount: tokens, kind: "credit" });
  });
}

export function addCard(label) {
  const card = { id: nextId("card"), label };
  store.set((s) => {
    s.wallet.savedCards.push(card);
    if (!s.wallet.defaultCardId) s.wallet.defaultCardId = card.id;
  });
  return card;
}

export function setDefaultCard(cardId) {
  store.set((s) => {
    s.wallet.defaultCardId = cardId;
  });
}

export function setAutoRecharge(on) {
  store.set((s) => {
    s.wallet.autoRecharge = on;
  });
}

export function subscribeToReading(plan, channels) {
  store.set((s) => {
    Object.assign(s.subscription, { subscribed: true, plan, channels, paused: false, cancelled: false, cancelEndLabel: "" });
  });
}

export function editSubscription() {
  store.set((s) => {
    s.subscription.subscribed = false;
  });
}

export function toggleSubscriptionPause() {
  store.set((s) => {
    s.subscription.paused = !s.subscription.paused;
  });
}

export function cancelSubscription(endLabel) {
  store.set((s) => {
    s.subscription.cancelled = true;
    s.subscription.cancelEndLabel = endLabel;
  });
}
