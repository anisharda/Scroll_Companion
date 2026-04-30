console.log("Scroll Companion loaded");

const TODAY = new Date().toISOString().split("T")[0];
const PLANT_IMGS = [1, 2, 3, 4].map(n => chrome.runtime.getURL(`assets/plant${n}.png`));

let currentMode = null;
let pageVisible = !document.hidden;

document.addEventListener("visibilitychange", () => {
  pageVisible = !document.hidden;
  if (currentMode === "productivity") handlePomodoroVisibility();
});

// ===== BOOT =====
chrome.storage.local.get(["todayGoal"], (res) => {
  if (res.todayGoal?.date === TODAY) {
    currentMode = res.todayGoal.mode;
    injectPlant();
    startMode(currentMode);
  } else {
    setTimeout(showGoalPicker, 900);
  }
});

// ===== GOAL PICKER =====
function showGoalPicker() {
  if (document.getElementById("sc-picker")) return;

  const el = document.createElement("div");
  el.id = "sc-picker";
  el.className = "sc-overlay";
  el.innerHTML = `
    <div class="sc-modal">
      <img src="${PLANT_IMGS[0]}" class="sc-plant-hero">
      <h2>Choose your goal for today!</h2>
      <p class="sc-subtitle">Your plant companion will guide you through it.</p>
      <div class="sc-goal-grid">
        <button data-mode="education" class="sc-goal-btn">📚<br>Education</button>
        <button data-mode="health" class="sc-goal-btn">🏃<br>Health</button>
        <button data-mode="productivity" class="sc-goal-btn">⏱<br>Productivity</button>
        <button data-mode="reduce" class="sc-goal-btn">📉<br>Reduce Usage</button>
        <button data-mode="mindfulness" class="sc-goal-btn">🧘<br>Mindfulness</button>
      </div>
    </div>
  `;
  document.body.appendChild(el);

  el.querySelectorAll("[data-mode]").forEach(btn => {
    btn.onclick = () => {
      const mode = btn.dataset.mode;
      chrome.storage.local.set({ todayGoal: { date: TODAY, mode } });
      currentMode = mode;
      el.remove();
      injectPlant();
      startMode(mode);
    };
  });
}

// ===== PLANT PET (bottom-right) =====
function injectPlant() {
  if (document.getElementById("sc-pet")) return;
  const wrap = document.createElement("div");
  wrap.id = "sc-pet";
  wrap.innerHTML = `
    <img id="sc-pet-img" src="${PLANT_IMGS[0]}">
    <div id="sc-pet-label"></div>
  `;
  document.body.appendChild(wrap);
}

function setPlant(stage, label = "") {
  const img = document.getElementById("sc-pet-img");
  const lbl = document.getElementById("sc-pet-label");
  if (img) img.src = PLANT_IMGS[Math.max(0, Math.min(3, stage - 1))];
  if (lbl) lbl.textContent = label;
}

function mmss(ms) {
  const m = Math.floor(Math.max(0, ms) / 60000);
  const s = Math.floor((Math.max(0, ms) % 60000) / 1000);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ===== MODE ROUTER =====
function startMode(mode) {
  if (mode === "education")    initEducation();
  if (mode === "health")       initHealth();
  if (mode === "productivity") initProductivity();
  if (mode === "reduce")       initReduce();
  if (mode === "mindfulness")  initMindfulness();
}

// ===================================================================
// EDUCATION MODE — tips every 15 min to nudge toward learning
// ===================================================================
const EDU_TIPS = [
  "Reading just 20 min/day can expose you to over 1.8 million words a year.",
  "Challenge: before scrolling more, name 3 things you want to learn this week.",
  "Learning a new word: Sonder — the realization that each passerby has a life as vivid as your own.",
  "Your brain consolidates memories during rest. Maybe now is a good time to step away?",
  "Try replacing this scroll session with a 5-minute Wikipedia deep dive on something you're curious about.",
];

function initEducation() {
  let usageMs = 0;
  let lastTick = Date.now();
  let tipCount = 0;
  const TIP_MS = 15 * 60 * 1000;

  setPlant(1, `📚 ${mmss(TIP_MS)}`);

  setInterval(() => {
    const now = Date.now();
    if (!pageVisible) { lastTick = now; return; }
    usageMs += now - lastTick;
    lastTick = now;

    const timeToNext = TIP_MS - (usageMs % TIP_MS);
    setPlant(Math.min(4, 1 + Math.floor(usageMs / (5 * 60000))), `📚 ${mmss(timeToNext)}`);

    if (usageMs >= (tipCount + 1) * TIP_MS) {
      showEduTip(EDU_TIPS[tipCount % EDU_TIPS.length]);
      tipCount++;
    }
  }, 1000);
}

function showEduTip(tip) {
  const el = makeOverlay(`
    <div class="sc-modal">
      <img src="${PLANT_IMGS[1]}" class="sc-plant-hero">
      <h2>Learning Moment 📚</h2>
      <p>${tip}</p>
      <button id="sc-edu-ok">Keep scrolling</button>
    </div>
  `);
  document.body.appendChild(el);
  el.querySelector("#sc-edu-ok").onclick = () => el.remove();
}

// ===================================================================
// HEALTH MODE — demo: every 10 steps = 1 min usage
// Real Apple Health connection not available in browser extensions;
// uses a simulated step counter for the demo.
// ===================================================================
function initHealth() {
  let steps = 0;
  let allowedMs = 0;
  let usedMs = 0;
  let lastTick = Date.now();
  let blocked = false;

  chrome.storage.local.get(["healthState"], (res) => {
    if (res.healthState?.date === TODAY) {
      steps = res.healthState.steps || 0;
      allowedMs = Math.floor(steps / 10) * 60000;
    }
    renderHealthBanner(steps, allowedMs, usedMs);
  });

  setPlant(1, "Steps: 0");

  const banner = document.createElement("div");
  banner.id = "sc-health-banner";
  banner.innerHTML = `
    <div id="sc-step-count">👟 0 steps · 0 min earned · 0 min used</div>
    <button id="sc-add-steps">+ 100 steps (demo)</button>
    <div class="sc-small" style="margin-top:4px">Apple Health API not available in browsers —<br>this simulates step input for the demo.</div>
  `;
  document.body.appendChild(banner);

  banner.querySelector("#sc-add-steps").onclick = () => {
    steps += 100;
    allowedMs = Math.floor(steps / 10) * 60000;
    blocked = false;
    chrome.storage.local.set({ healthState: { date: TODAY, steps } });
    renderHealthBanner(steps, allowedMs, usedMs);
    setPlant(Math.min(4, 1 + Math.floor(steps / 300)), `${steps} steps`);
    document.getElementById("sc-health-block")?.remove();
  };

  setInterval(() => {
    const now = Date.now();
    if (!pageVisible) { lastTick = now; return; }
    const delta = now - lastTick;
    lastTick = now;

    if (usedMs < allowedMs) {
      usedMs += delta;
      renderHealthBanner(steps, allowedMs, usedMs);
      setPlant(Math.min(4, 1 + Math.floor(steps / 300)), `🏃 ${mmss(allowedMs - usedMs)}`);
    } else if (allowedMs > 0 && !blocked) {
      blocked = true;
      showHealthBlock();
    } else if (allowedMs === 0 && steps === 0) {
      setPlant(1, "Walk first!");
    }
  }, 1000);
}

function renderHealthBanner(steps, allowedMs, usedMs) {
  const el = document.getElementById("sc-step-count");
  if (!el) return;
  const earned = Math.floor(allowedMs / 60000);
  const used = Math.floor(usedMs / 60000);
  el.textContent = `👟 ${steps} steps · ${earned} min earned · ${used} min used`;
}

function showHealthBlock() {
  if (document.getElementById("sc-health-block")) return;
  const el = makeOverlay(`
    <div class="sc-modal">
      <img src="${PLANT_IMGS[3]}" class="sc-plant-hero">
      <h2>Time's Up! 🏃</h2>
      <p>You've used all your earned screen time.</p>
      <p>Walk more steps to unlock more Instagram time!</p>
      <p class="sc-small">Add more steps with the banner button to continue.</p>
      <button id="sc-health-dismiss">Got it</button>
    </div>
  `);
  el.id = "sc-health-block";
  document.body.appendChild(el);
  setPlant(4, "Walk more!");
  el.querySelector("#sc-health-dismiss").onclick = () => el.remove();
}

// ===================================================================
// PRODUCTIVITY MODE — Pomodoro
// Must be off Instagram 50 min to earn 25 min of usage
// ===================================================================
function initProductivity() {
  chrome.storage.local.get(["pomodoroState"], (res) => {
    let s = res.pomodoroState;
    if (!s || s.date !== TODAY) {
      s = { date: TODAY, phase: "earning", offStart: Date.now(), offAccumMs: 0, onUsedMs: 0 };
      chrome.storage.local.set({ pomodoroState: s });
    }
    evaluatePomodoro(s);
  });
}

function handlePomodoroVisibility() {
  chrome.storage.local.get(["pomodoroState"], (res) => {
    let s = res.pomodoroState;
    if (!s) return;

    if (document.hidden) {
      s.offStart = Date.now();
      chrome.storage.local.set({ pomodoroState: s });
      document.getElementById("sc-pomo-banner")?.remove();
    } else {
      evaluatePomodoro(s);
    }
  });
}

function evaluatePomodoro(s) {
  const EARN_MS = 50 * 60 * 1000;
  const USE_MS = 25 * 60 * 1000;

  const extraOff = s.offStart ? Date.now() - s.offStart : 0;
  const totalOff = (s.offAccumMs || 0) + extraOff;

  if (s.phase === "earning") {
    if (totalOff >= EARN_MS) {
      s.phase = "using";
      s.onUsedMs = 0;
      s.offAccumMs = 0;
      s.offStart = null;
      chrome.storage.local.set({ pomodoroState: s });
      document.getElementById("sc-pomo-earning")?.remove();
      startPomodoroUsage(s);
    } else {
      showPomodoroEarning(totalOff, EARN_MS);
    }
  } else if (s.phase === "using") {
    if ((s.onUsedMs || 0) >= USE_MS) {
      s.phase = "earning";
      s.offAccumMs = 0;
      s.offStart = Date.now();
      chrome.storage.local.set({ pomodoroState: s });
      showPomodoroExhausted();
    } else {
      startPomodoroUsage(s);
    }
  }
}

function showPomodoroEarning(doneMs, totalMs) {
  if (document.getElementById("sc-pomo-earning")) return;

  const pct = Math.round((doneMs / totalMs) * 100);

  const el = makeOverlay(`
    <div class="sc-modal">
      <img src="${PLANT_IMGS[1]}" class="sc-plant-hero">
      <h2>Pomodoro Mode 🍅</h2>
      <p>Stay off Instagram for <strong id="sc-pomo-countdown">${mmss(totalMs - doneMs)}</strong> to earn 25 min of usage.</p>
      <div class="sc-progress-bar"><div class="sc-progress-fill" id="sc-pomo-fill" style="width:${pct}%"></div></div>
      <p class="sc-small" id="sc-pomo-pct">Focus time: ${pct}% complete</p>
    </div>
  `);
  el.id = "sc-pomo-earning";
  document.body.appendChild(el);
  setPlant(Math.max(1, Math.ceil(pct / 25)), `⏱ ${mmss(totalMs - doneMs)}`);

  const poll = setInterval(() => {
    chrome.storage.local.get(["pomodoroState"], (res) => {
      const s = res.pomodoroState;
      if (!s || s.phase !== "earning") { clearInterval(poll); return; }

      const extra = s.offStart ? Date.now() - s.offStart : 0;
      const done = (s.offAccumMs || 0) + extra;
      const rem = Math.max(0, totalMs - done);
      const p = Math.round((done / totalMs) * 100);

      const cdEl  = document.getElementById("sc-pomo-countdown");
      const fillEl = document.getElementById("sc-pomo-fill");
      const pctEl  = document.getElementById("sc-pomo-pct");
      if (cdEl)   cdEl.textContent  = mmss(rem);
      if (fillEl) fillEl.style.width = `${p}%`;
      if (pctEl)  pctEl.textContent  = `Focus time: ${p}% complete`;
      setPlant(Math.max(1, Math.ceil(p / 25)), `⏱ ${mmss(rem)}`);

      if (rem <= 0) {
        clearInterval(poll);
        el.remove();
        s.phase = "using";
        s.onUsedMs = 0;
        s.offAccumMs = 0;
        s.offStart = null;
        chrome.storage.local.set({ pomodoroState: s });
        startPomodoroUsage(s);
      }
    });
  }, 1000);
}

function startPomodoroUsage(s) {
  if (document.getElementById("sc-pomo-banner")) return;

  const USE_MS = 25 * 60 * 1000;
  const banner = document.createElement("div");
  banner.id = "sc-pomo-banner";
  banner.className = "sc-top-banner";
  document.body.appendChild(banner);

  const startedUsedMs = s.onUsedMs || 0;
  const sessionStart = Date.now();

  setPlant(3, "25 min!");

  const tick = setInterval(() => {
    if (!pageVisible) return;
    const elapsed = startedUsedMs + (Date.now() - sessionStart);
    const remaining = Math.max(0, USE_MS - elapsed);

    chrome.storage.local.get(["pomodoroState"], (res) => {
      const cur = res.pomodoroState || {};
      cur.onUsedMs = elapsed;
      chrome.storage.local.set({ pomodoroState: cur });
    });

    banner.textContent = `🍅 Instagram time: ${mmss(remaining)} remaining`;
    setPlant(Math.max(1, 4 - Math.floor(elapsed / (USE_MS / 3))), `⏱ ${mmss(remaining)}`);

    if (remaining <= 0) {
      clearInterval(tick);
      banner.remove();
      chrome.storage.local.get(["pomodoroState"], (res) => {
        const cur = res.pomodoroState || {};
        cur.phase = "earning";
        cur.onUsedMs = USE_MS;
        cur.offAccumMs = 0;
        cur.offStart = Date.now();
        chrome.storage.local.set({ pomodoroState: cur });
      });
      showPomodoroExhausted();
    }
  }, 1000);
}

function showPomodoroExhausted() {
  if (document.getElementById("sc-pomo-done")) return;
  const el = makeOverlay(`
    <div class="sc-modal">
      <img src="${PLANT_IMGS[3]}" class="sc-plant-hero">
      <h2>Session Complete! 🍅</h2>
      <p>You've used your 25 minutes of Instagram time.</p>
      <p>Stay off for <strong>50 minutes</strong> to earn your next session.</p>
      <button id="sc-pomo-ok">Got it — I'll take a break</button>
    </div>
  `);
  el.id = "sc-pomo-done";
  document.body.appendChild(el);
  setPlant(4, "Break time!");

  el.querySelector("#sc-pomo-ok").onclick = () => {
    el.remove();
    chrome.storage.local.get(["pomodoroState"], (res) => {
      const s = res.pomodoroState || {};
      s.offStart = Date.now();
      s.offAccumMs = 0;
      chrome.storage.local.set({ pomodoroState: s });
    });
    showPomodoroEarning(0, 50 * 60 * 1000);
  };
}

// ===================================================================
// REDUCE USAGE MODE
// After 15 min: page starts lagging. Increases every 2 min. Resets every 3h.
// ===================================================================
let reduceStyleEl = null;
let reduceLagLevel = 0;

function initReduce() {
  chrome.storage.local.get(["reduceState"], (res) => {
    let s = res.reduceState;
    const now = Date.now();

    if (!s || (now - (s.cycleStart || 0)) >= 3 * 60 * 60 * 1000) {
      s = { cycleStart: now, usageMs: 0 };
      chrome.storage.local.set({ reduceState: s });
    }

    runReduceTimer(s.usageMs || 0, s.cycleStart);
  });
}

function runReduceTimer(startUsageMs, cycleStart) {
  const GRACE_MS = 15 * 60 * 1000;
  const STEP_MS = 2 * 60 * 1000;
  const CYCLE_MS = 3 * 60 * 60 * 1000;

  let usageMs = startUsageMs;
  let lastTick = Date.now();

  setPlant(1, "15m free");

  setInterval(() => {
    const now = Date.now();
    if (!pageVisible) { lastTick = now; return; }
    usageMs += now - lastTick;
    lastTick = now;

    // 3-hour cycle reset
    if ((now - cycleStart) >= CYCLE_MS) {
      cycleStart = now;
      usageMs = 0;
      reduceLagLevel = 0;
      removeLag();
      chrome.storage.local.set({ reduceState: { cycleStart, usageMs: 0 } });
      setPlant(1, "Reset!");
      showToast("🔄 3-hour cycle reset — 15 free minutes restored!", 4000);
      return;
    }

    chrome.storage.local.set({ reduceState: { cycleStart, usageMs } });

    if (usageMs <= GRACE_MS) {
      setPlant(1, `📉 ${mmss(GRACE_MS - usageMs)}`);
      return;
    }

    const overMs = usageMs - GRACE_MS;
    const newLevel = 1 + Math.floor(overMs / STEP_MS);

    // Update plant label every second even between lag-level changes
    setPlant(Math.min(4, 1 + Math.ceil(reduceLagLevel / 2)), `🐌 Lv.${newLevel}`);

    if (newLevel !== reduceLagLevel) {
      reduceLagLevel = newLevel;
      applyLag(reduceLagLevel);
      setPlant(Math.min(4, 1 + Math.ceil(reduceLagLevel / 2)), `🐌 Lv.${reduceLagLevel}`);

      if (reduceLagLevel === 1) {
        showToast("⚠️ You've been scrolling for 15 minutes…", 4000);
      } else if (reduceLagLevel % 2 === 0) {
        showToast(`🐌 Getting slower... (level ${reduceLagLevel})`, 3000);
      }
    }
  }, 1000);
}

function applyLag(level) {
  if (!reduceStyleEl) {
    reduceStyleEl = document.createElement("style");
    document.head.appendChild(reduceStyleEl);
  }
  const transitionSec = Math.min(level * 0.5, 5).toFixed(1);
  const blur = Math.min(level * 0.2, 3).toFixed(1);
  const shake = Math.min(level * 1.5, 8).toFixed(0);
  const shakeDur = Math.max(0.4, 2.5 - level * 0.15).toFixed(2);

  reduceStyleEl.textContent = `
    body > *:not(#sc-pet):not(#sc-health-banner) {
      transition: all ${transitionSec}s ease !important;
      filter: blur(${blur}px) !important;
    }
    @keyframes sc-shake {
      0%,100% { transform: translateX(0); }
      20%,60% { transform: translateX(${shake}px); }
      40%,80% { transform: translateX(-${shake}px); }
    }
    body { animation: sc-shake ${shakeDur}s ease-in-out infinite; }
  `;
}

function removeLag() {
  if (reduceStyleEl) reduceStyleEl.textContent = "";
  reduceLagLevel = 0;
}

// ===================================================================
// MINDFULNESS MODE
// Every 15 min: ask if they can move → yoga pose or breathing/journaling
// ===================================================================
const YOGA_POSES = [
  { name: "Mountain Pose", emoji: "🧍", desc: "Stand tall, feet together, arms at your sides. Close your eyes and take 5 slow deep breaths." },
  { name: "Child's Pose", emoji: "🙇", desc: "Kneel and fold forward, arms extended on the floor. Rest and breathe for 30 seconds." },
  { name: "Cat-Cow Stretch", emoji: "🐱", desc: "On hands and knees, alternate arching up (cat) and dipping down (cow). Do 10 slow reps." },
  { name: "Seated Spinal Twist", emoji: "🔄", desc: "Sit cross-legged. Place right hand on left knee and twist left. Hold 20s, then switch sides." },
  { name: "Standing Forward Fold", emoji: "🙆", desc: "Stand and slowly fold forward, letting your head hang heavy. Bend your knees softly. Hold 30s." },
];

const BREATHING = [
  { name: "Box Breathing", desc: "Inhale for 4 counts → Hold for 4 → Exhale for 4 → Hold for 4. Repeat 4 rounds." },
  { name: "4-7-8 Breathing", desc: "Inhale for 4 counts → Hold for 7 → Exhale slowly for 8. Repeat 3 times." },
  { name: "Belly Breathing", desc: "Place one hand on your belly. Inhale deeply so your belly rises. Exhale fully. 10 breaths." },
];

const JOURNAL_PROMPTS = [
  "What's one thing you're genuinely grateful for right now?",
  "What would make today feel truly worthwhile?",
  "What's something you've been meaning to say to someone?",
  "What's one small thing you could do today that future-you would thank you for?",
  "Describe a moment this week where you felt most like yourself.",
];

function initMindfulness() {
  let usageMs = 0;
  let lastTick = Date.now();
  let checkCount = 0;
  const CHECK_MS = 15 * 60 * 1000;

  setPlant(1, "🌿 15:00");

  setInterval(() => {
    const now = Date.now();
    if (!pageVisible) { lastTick = now; return; }
    usageMs += now - lastTick;
    lastTick = now;

    // Countdown to next check-in so the label visibly ticks every second
    const timeToNext = CHECK_MS - (usageMs % CHECK_MS);
    const m = Math.floor(timeToNext / 60000);
    const s = Math.floor((timeToNext % 60000) / 1000);
    const stage = Math.min(4, 1 + Math.floor(usageMs / (5 * 60000)));
    setPlant(stage, `🌿 ${m}:${s.toString().padStart(2, "0")}`);

    if (usageMs >= (checkCount + 1) * CHECK_MS) {
      checkCount++;
      showMindfulnessCheck();
    }
  }, 1000);
}

function showMindfulnessCheck() {
  if (document.getElementById("sc-mindful-check")) return;

  const el = makeOverlay(`
    <div class="sc-modal">
      <img src="${PLANT_IMGS[2]}" class="sc-plant-hero">
      <h2>🌿 Mindfulness Check-in</h2>
      <p>You've been scrolling for 15 minutes.<br><strong>Do you have space to move right now?</strong></p>
      <div class="sc-btn-row">
        <button id="sc-mindful-yes" class="sc-btn-yes">Yes, I can move 🧘</button>
        <button id="sc-mindful-no" class="sc-btn-no">Not right now 💭</button>
      </div>
    </div>
  `);
  el.id = "sc-mindful-check";
  document.body.appendChild(el);

  el.querySelector("#sc-mindful-yes").onclick = () => { el.remove(); showYogaPose(); };
  el.querySelector("#sc-mindful-no").onclick = () => { el.remove(); showMindfulAlt(); };
}

function showYogaPose() {
  const pose = YOGA_POSES[Math.floor(Math.random() * YOGA_POSES.length)];
  const el = makeOverlay(`
    <div class="sc-modal">
      <div class="sc-pose-emoji">${pose.emoji}</div>
      <h2>${pose.name}</h2>
      <p>${pose.desc}</p>
      <button id="sc-pose-done">Done! 🌱</button>
    </div>
  `);
  document.body.appendChild(el);
  setPlant(2, "Yoga! 🧘");
  el.querySelector("#sc-pose-done").onclick = () => { el.remove(); setPlant(1, "Mindful 🌿"); };
}

function showMindfulAlt() {
  const useBreathe = Math.random() < 0.5;

  let inner;
  if (useBreathe) {
    const b = BREATHING[Math.floor(Math.random() * BREATHING.length)];
    inner = `
      <div class="sc-modal">
        <div class="sc-pose-emoji">🌬️</div>
        <h2>${b.name}</h2>
        <p>${b.desc}</p>
        <div class="sc-breathe-circle"></div>
        <button id="sc-alt-done">Done 🌱</button>
      </div>
    `;
  } else {
    const prompt = JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)];
    inner = `
      <div class="sc-modal">
        <div class="sc-pose-emoji">📓</div>
        <h2>Journal Prompt</h2>
        <p class="sc-journal-prompt">"${prompt}"</p>
        <textarea id="sc-journal-entry" placeholder="Write your thoughts here..."></textarea>
        <button id="sc-alt-done">Done 🌱</button>
      </div>
    `;
  }

  const el = makeOverlay(inner);
  document.body.appendChild(el);
  setPlant(2, "Reflecting...");
  el.querySelector("#sc-alt-done").onclick = () => { el.remove(); setPlant(1, "Mindful 🌿"); };
}

// ===================================================================
// HELPERS
// ===================================================================
function makeOverlay(innerHTML) {
  const el = document.createElement("div");
  el.className = "sc-overlay";
  el.innerHTML = innerHTML;
  return el;
}

function showToast(msg, duration = 3000) {
  const toast = document.createElement("div");
  toast.className = "sc-toast";
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("sc-toast-show"), 50);
  setTimeout(() => {
    toast.classList.remove("sc-toast-show");
    setTimeout(() => toast.remove(), 400);
  }, duration);
}
