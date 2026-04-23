console.log("Scroll Companion loaded");

// ===== STATE =====
let timeSpent = 0;
let lastTick = Date.now();
let active = true;
let lastActivity = Date.now();

// ===== TRACK ACTIVE TAB =====
document.addEventListener("visibilitychange", () => {
  active = !document.hidden;
});

["mousemove", "scroll", "keydown", "click"].forEach(event => {
  document.addEventListener(event, () => {
    lastActivity = Date.now();
  });
});

// ===== INJECT UI =====
function injectCharacter() {
  if (document.getElementById("scroll-companion")) return;

  const container = document.createElement("div");
  container.id = "scroll-companion-container";

  const character = document.createElement("div");
  character.id = "scroll-companion";

  const bubble = document.createElement("div");
  bubble.id = "scroll-bubble";
  bubble.innerText = "0:00";

  container.appendChild(character);
  container.appendChild(bubble);
  document.body.appendChild(container);
}

setTimeout(() => {
  injectCharacter();
}, 1000);

// ===== TIMER =====
function updateTime() {
  console.log("updating...");
  const now = Date.now();

  const onInstagram = window.location.hostname.includes("instagram.com");
  const isActiveUser = now - lastActivity < 10000; // 10 seconds

  if (active && onInstagram && isActiveUser) {
    timeSpent += now - lastTick;
  }

  if (!isActiveUser) {
    bubble.innerText = "Idle...";
  }

  lastTick = now;

  const bubble = document.getElementById("scroll-bubble");
  if (bubble) {
    bubble.innerText = formatTime(timeSpent);
  }

  const character = document.getElementById("scroll-companion");
  if (character && timeSpent > 300000) {
    character.style.backgroundColor = "red";
  }
}

setInterval(updateTime, 1000);

// ===== RANDOM INTERVENTION =====
function getRandomInterval(min, max) {
  return Math.random() * (max - min) + min;
}

function scheduleIntervention() {
  const delay = getRandomInterval(180000, 600000); // 3–10 min
  setTimeout(() => {
    showPopup();
    scheduleIntervention();
  }, delay);
}

scheduleIntervention();

// ===== FORMAT TIME =====
function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// ===== POPUP =====
function showPopup() {
  if (document.getElementById("intervention-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "intervention-overlay";

  overlay.innerHTML = `
    <div class="modal">
      <p>You've been scrolling for a while...</p>
      <button id="continue">Continue</button>
      <button id="leave">Leave</button>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById("continue").onclick = () => {
    overlay.remove();
  };

  document.getElementById("leave").onclick = () => {
    window.location.href = "https://www.google.com";
  };
}