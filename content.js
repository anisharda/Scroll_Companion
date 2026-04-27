console.log("Scroll Companion loaded");

// ===== DEFAULT SETTINGS =====
const DEFAULT_LIMIT_MS = 5 * 1000; // 5 minutes
const IDLE_THRESHOLD = 10000; // 10s inactivity

// ===== STATE =====
let settings = {
  scrollLimitMs: DEFAULT_LIMIT_MS
};

let session = {
  remainingMs: DEFAULT_LIMIT_MS,
  lastTick: Date.now()
};

let active = true;
let lastActivity = Date.now();
let isBlocked = false;

// ===== STORAGE INIT =====
function initStorage() {
  chrome.storage.local.get(["settings"], (res) => {
    if (res.settings) {
      settings = { ...settings, ...res.settings };
    }

    session.remainingMs = settings.scrollLimitMs;
  });
}

initStorage();

// ===== ACTIVITY TRACKING =====
document.addEventListener("visibilitychange", () => {
  active = !document.hidden;
});

["mousemove", "scroll", "keydown", "click"].forEach(event => {
  document.addEventListener(event, () => {
    lastActivity = Date.now();
  });
});

// ===== UI INJECTION =====
function injectUI() {
  if (document.getElementById("sc-root")) return;

  const root = document.createElement("div");
  root.id = "sc-root";

  // TOP BAR
  const bar = document.createElement("div");
  bar.id = "sc-bar";

  const fill = document.createElement("div");
  fill.id = "sc-bar-fill";

  bar.appendChild(fill);

  // PLANT
  const plant = document.createElement("img");
  plant.id = "sc-plant";
  plant.src = chrome.runtime.getURL("assets/plant1.png");

  root.appendChild(bar);
  root.appendChild(plant);
  document.body.appendChild(root);
}

setTimeout(injectUI, 1000);

// ===== TIMER =====
function tick() {
  const now = Date.now();

  const onInstagram = window.location.hostname.includes("instagram.com");
  const isActiveUser = now - lastActivity < IDLE_THRESHOLD;

  if (active && onInstagram && isActiveUser && !isBlocked) {
    const delta = now - session.lastTick;
    session.remainingMs -= delta;

    if (session.remainingMs < 0) session.remainingMs = 0;
  }

  session.lastTick = now;

  updateUI();

  if (session.remainingMs === 0 && !isBlocked) {
    triggerLimit();
  }
}

setInterval(tick, 1000);

// ===== UI UPDATE =====
function updateUI() {
  const fill = document.getElementById("sc-bar-fill");
  const plant = document.getElementById("sc-plant");

  if (!fill || !plant) return;

  const ratio = session.remainingMs / settings.scrollLimitMs;

  // BAR SHRINK
  fill.style.width = `${ratio * 100}%`;

  // PLANT STAGES (quartiles)
  let stage = 1;
  if (ratio <= 0.75) stage = 2;
  if (ratio <= 0.5) stage = 3;
  if (ratio <= 0.25) stage = 4;

  plant.src = chrome.runtime.getURL(`assets/plant${stage}.png`);
}

// ===== LIMIT REACHED =====
function triggerLimit() {
  isBlocked = true;

  if (document.getElementById("sc-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "sc-overlay";

  overlay.innerHTML = `
    <div class="sc-modal">
      <h1>Time Limit Reached</h1>
      <img src="${chrome.runtime.getURL("assets/plant4.png")}" />
      <p>You’ve been scrolling for a while. Let’s take a break.</p>
      <button id="sc-next">Next</button>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById("sc-next").onclick = () => {
    // Phase 0 stub: reset immediately
    overlay.remove();
    resetSession();
  };
}

// ===== RESET POLICY =====
function resetSession() {
  session.remainingMs = settings.scrollLimitMs;
  isBlocked = false;
}