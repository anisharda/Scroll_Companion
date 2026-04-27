const goalMinutesDefault = 20;

// ===== INIT =====
document.addEventListener("DOMContentLoaded", async () => {
  initStorage();
  loadProgress();
  loadActiveReading();

  document.getElementById("search").onclick = searchCatalog;
});

// ===== STORAGE INIT =====
function initStorage() {
  chrome.storage.local.get(["settings"], (res) => {
    if (!res.settings) {
      chrome.storage.local.set({
        settings: {
          goalMinutesPerDay: goalMinutesDefault
        }
      });
    }
  });
}

// ===== LOAD PROGRESS =====
function loadProgress() {
  chrome.storage.local.get(["daily", "settings"], (res) => {
    const today = new Date().toISOString().split("T")[0];

    const minutes = res.daily?.minutesRead || 0;
    const goal = res.settings?.goalMinutesPerDay || goalMinutesDefault;

    document.getElementById("progress-text").innerText =
      `${minutes} / ${goal} min`;

    renderStreak(res.daily?.streak || []);
  });
}

// ===== STREAK =====
function renderStreak(streak) {
  const grid = document.getElementById("streak-grid");
  grid.innerHTML = "";

  for (let i = 0; i < 28; i++) {
    const cell = document.createElement("div");
    cell.className = "day";

    if (streak.includes(i)) {
      cell.classList.add("active");
    }

    grid.appendChild(cell);
  }
}

// ===== SEARCH =====
async function searchCatalog() {
  const title = document.getElementById("title").value.toLowerCase();
  const author = document.getElementById("author").value.toLowerCase();
  const subject = document.getElementById("subject").value.toLowerCase();

  const url = chrome.runtime.getURL("gutenberg_catalog.json");
  const res = await fetch(url);
  const catalog = await res.json();

  const results = catalog.filter(work => {
    return (
      (!title || work.title.toLowerCase().includes(title)) &&
      (!author || work.author.toLowerCase().includes(author)) &&
      (!subject || work.subjects.join(" ").toLowerCase().includes(subject))
    );
  });

  renderResults(results);
}

// ===== RENDER RESULTS =====
function renderResults(results) {
  const container = document.getElementById("results");
  container.innerHTML = "";

  results.slice(0, 10).forEach(work => {
    const div = document.createElement("div");
    div.className = "result";

    div.innerText = `${work.title} — ${work.author}`;

    div.onclick = () => selectReading(work);

    container.appendChild(div);
  });
}

// ===== SELECT READING =====
function selectReading(work) {
  const today = new Date().toISOString().split("T")[0];

  const activeReading = {
    id: work.id,
    title: work.title,
    author: work.author,
    text: work.text,
    activeDateISO: today
  };

  chrome.storage.local.set({ activeReading }, () => {
    loadActiveReading();
  });
}

// ===== LOAD ACTIVE =====
function loadActiveReading() {
  chrome.storage.local.get(["activeReading"], (res) => {
    const el = document.getElementById("active-reading");

    if (!res.activeReading) {
      el.innerText = "None selected";
      return;
    }

    el.innerText =
      `${res.activeReading.title} — ${res.activeReading.author}`;
  });
}