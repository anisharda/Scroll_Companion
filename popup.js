document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split("T")[0];

  // Highlight active goal button and wire up switching
  chrome.storage.local.get(["todayGoal"], (res) => {
    if (res.todayGoal?.date === today) {
      const active = document.querySelector(`[data-mode="${res.todayGoal.mode}"]`);
      if (active) active.classList.add("switch-btn-active");
    }
  });

  document.querySelectorAll(".switch-btn").forEach(btn => {
    btn.onclick = () => {
      const mode = btn.dataset.mode;
      chrome.storage.local.set({ todayGoal: { date: today, mode } }, () => {
        document.querySelectorAll(".switch-btn").forEach(b => b.classList.remove("switch-btn-active"));
        btn.classList.add("switch-btn-active");

        // Reload the Instagram tab so the new mode initialises
        chrome.tabs.query({ url: "*://*.instagram.com/*" }, (tabs) => {
          const status = document.getElementById("switch-status");
          if (tabs.length > 0) {
            chrome.tabs.reload(tabs[0].id);
            status.textContent = "✓ Reloading Instagram…";
          } else {
            status.textContent = "✓ Saved — open Instagram to start";
          }
        });
      });
    };
  });

  chrome.storage.local.get(
    ["todayGoal", "pomodoroState", "reduceState", "healthState"],
    (res) => {
      const goal = res.todayGoal;
      const modeLabel = document.getElementById("mode-label");
      const modeStatus = document.getElementById("mode-status");
      const hint = document.getElementById("no-goal-hint");
      const plantImg = document.getElementById("plant-img");
      const card = document.getElementById("mode-card");

      if (!goal || goal.date !== today) {
        hint.style.display = "block";
        card.style.display = "none";
        return;
      }

      hint.style.display = "none";
      card.style.display = "block";

      const names = {
        education:    "📚 Education",
        health:       "🏃 Health",
        productivity: "⏱ Productivity",
        reduce:       "📉 Reduce Usage",
        mindfulness:  "🧘 Mindfulness",
      };

      modeLabel.textContent = `Today: ${names[goal.mode] || goal.mode}`;

      if (goal.mode === "productivity" && res.pomodoroState) {
        const s = res.pomodoroState;
        if (s.phase === "earning") {
          const extra = s.offStart ? Date.now() - s.offStart : 0;
          const done = (s.offAccumMs || 0) + extra;
          const rem = Math.max(0, 50 * 60 * 1000 - done);
          modeStatus.textContent = `Earning — ${Math.ceil(rem / 60000)} min remaining`;
          plantImg.src = "assets/plant2.png";
        } else {
          const rem = Math.max(0, 25 * 60 * 1000 - (s.onUsedMs || 0));
          modeStatus.textContent = `Active session — ${Math.ceil(rem / 60000)} min left`;
          plantImg.src = "assets/plant3.png";
        }
      } else if (goal.mode === "health" && res.healthState) {
        const s = res.healthState;
        const earned = Math.floor((s.steps || 0) / 10);
        modeStatus.textContent = `${s.steps || 0} steps · ${earned} min earned`;
        plantImg.src = earned > 30 ? "assets/plant3.png" : "assets/plant2.png";
      } else if (goal.mode === "reduce" && res.reduceState) {
        const usedMin = Math.floor((res.reduceState.usageMs || 0) / 60000);
        modeStatus.textContent = `${usedMin} min used this cycle`;
        plantImg.src = usedMin > 15 ? "assets/plant3.png" : "assets/plant1.png";
      } else if (goal.mode === "mindfulness") {
        modeStatus.textContent = "Check-ins every 15 min of usage";
        plantImg.src = "assets/plant2.png";
      } else if (goal.mode === "education") {
        modeStatus.textContent = "Learning tips every 15 min";
        plantImg.src = "assets/plant2.png";
      }
    }
  );
});
