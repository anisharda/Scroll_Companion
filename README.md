# Scroll Companion

A Chrome extension that intercepts Instagram and nudges you toward intentional usage. Each day you pick one goal, and your plant companion tracks your progress in the bottom-right corner.

---

## Installation

1. Open **`chrome://extensions/`**
2. Enable **Developer mode** (toggle, top-right).
3. Click **Load unpacked** and select this project folder.
4. Navigate to **`https://www.instagram.com/`**.

After any code change, click the refresh icon next to the extension in `chrome://extensions/` to reload it.

---

## How it works

On your first visit to Instagram each day, a modal asks you to **choose your goal**. The plant pet in the bottom-right corner shows a live countdown or status for whichever mode is active.

You can switch your goal at any time by clicking the extension icon in the Chrome toolbar — it reloads the Instagram tab automatically.

---

## Modes

### 📚 Education
Tracks time on Instagram and surfaces a learning nudge every 15 minutes. The plant label counts down to the next tip (MM:SS). Prompts encourage curiosity and reflection rather than mindless scrolling.

### 🏃 Health *(demo)*
Earn Instagram time by walking — every 10 steps unlocks 1 minute of usage. A banner in the bottom-right shows your step count and minutes remaining. Use the **+ 100 steps** button to simulate steps for the demo.

> Real Apple Health integration is not possible in browser extensions. A native iOS/Android companion app would be required to read HealthKit step data.

### ⏱ Productivity — Pomodoro
Enforces a Pomodoro-style usage pattern:
- You must be **off Instagram for 50 minutes** to earn a **25-minute session**.
- While earning, a blocking modal shows a live MM:SS countdown and a progress bar.
- While using, a green top banner counts down your session time.
- State persists across tab opens and browser restarts via `chrome.storage`.

### 📉 Reduce Usage
Gives you a free 15-minute grace period (MM:SS countdown on the plant), then gradually degrades the Instagram experience:
- CSS transition delays make every interaction feel sluggish.
- Blur and a shake animation increase every 2 minutes.
- Everything resets automatically after 3 hours.

### 🧘 Mindfulness
Every 15 minutes of usage a check-in modal appears asking if you have space to move.

- **Yes → Yoga pose** — a random pose with instructions.
- **No → Breathing or journaling** — randomly picks a guided breathing exercise (with an animated breathing circle) or a journal prompt you can write into.

The plant label counts down to the next check-in (MM:SS).

---

## Plant companion

The plant in the bottom-right is always visible regardless of mode. It:
- Floats gently to signal it's alive
- Changes between 4 growth stages based on your progress
- Shows a live MM:SS label specific to each mode
- Is never covered by mode overlays
