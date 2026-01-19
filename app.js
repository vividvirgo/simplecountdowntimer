// SimpleCountdownTimer — vanilla JS
// Runs entirely in the browser. No tracking, no network calls.

const $ = (id) => document.getElementById(id);

const els = {
  mins: $("mins"),
  secs: $("secs"),
  alarm: $("alarm"),
  timeDisplay: $("timeDisplay"),
  statusText: $("statusText"),
  startBtn: $("startBtn"),
  pauseBtn: $("pauseBtn"),
  resetBtn: $("resetBtn"),
  fullscreenBtn: $("fullscreenBtn"),
  presentBtn: $("presentBtn"),
  timerCard: $("timerCard"),
  copyLinkBtn: $("copyLinkBtn"),
  toggleSoundBtn: $("toggleSoundBtn"),
  toast: $("toast"),
  year: $("year"),
  presets: document.querySelectorAll(".preset"),
};


els.year.textContent = new Date().getFullYear();

let totalSeconds = 0;
let remainingSeconds = 0;
let timerId = null;
let running = false;

let soundEnabled = true;

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${pad2(m)}:${pad2(s)}`;
}

function setStatus(text) {
  els.statusText.textContent = text;
}

function updateDisplay() {
  els.timeDisplay.textContent = formatTime(remainingSeconds);
  document.title = `${formatTime(remainingSeconds)} — Simple Countdown Timer`;
}

function readInputsToSeconds() {
  const m = clamp(parseInt(els.mins.value || "0", 10), 0, 999);
  const s = clamp(parseInt(els.secs.value || "0", 10), 0, 59);
  return (m * 60) + s;
}

function writeSecondsToInputs(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  els.mins.value = m;
  els.secs.value = s;
}

function stopTimer() {
  if (timerId) clearInterval(timerId);
  timerId = null;
  running = false;
  els.startBtn.disabled = false;
  els.pauseBtn.disabled = true;
}

function startTimer() {
  if (running) return;

  // If remaining is 0, read from inputs
  if (remainingSeconds <= 0) {
    totalSeconds = readInputsToSeconds();
    remainingSeconds = totalSeconds;
  }

  if (remainingSeconds <= 0) {
    setStatus("Set a time first");
    return;
  }

  running = true;
  els.startBtn.disabled = true;
  els.pauseBtn.disabled = false;
  setStatus("Running…");

  const startedAt = Date.now();
  let lastTick = startedAt;

  timerId = setInterval(() => {
    const now = Date.now();
    const elapsed = Math.floor((now - lastTick) / 1000);

    if (elapsed >= 1) {
      lastTick = now;
      remainingSeconds = Math.max(0, remainingSeconds - elapsed);
      updateDisplay();

      if (remainingSeconds <= 0) {
        finishTimer();
      }
    }
  }, 250);
}

function pauseTimer() {
  if (!running) return;
  stopTimer();
  setStatus("Paused");
}

function resetTimer() {
  stopTimer();
  totalSeconds = readInputsToSeconds();
  remainingSeconds = totalSeconds;
  updateDisplay();
  setStatus("Ready");
}

function finishTimer() {
  stopTimer();
  remainingSeconds = 0;
  updateDisplay();
  setStatus("Time’s up!");

  if (soundEnabled) playAlarm();
  vibrateIfPossible();
}

function vibrateIfPossible() {
  try {
    if (navigator.vibrate) navigator.vibrate([200, 80, 200, 80, 300]);
  } catch (_) {}
}

function playAlarm() {
  const type = els.alarm.value;
  if (type === "none") return;

  // Use Web Audio (no external files)
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  const ctx = new AudioCtx();
  const o = ctx.createOscillator();
  const g = ctx.createGain();

  o.type = "sine";
  o.frequency.value = type === "beep" ? 880 : 660;

  g.gain.value = 0.0001;
  o.connect(g);
  g.connect(ctx.destination);

  o.start();

  // quick envelope
  const now = ctx.currentTime;
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, now + (type === "beep" ? 0.6 : 1.0));

  setTimeout(() => {
    o.stop();
    ctx.close();
  }, type === "beep" ? 650 : 1050);
}

function showToast(msg="Copied!") {
  els.toast.textContent = msg;
  els.toast.style.display = "block";
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    els.toast.style.display = "none";
  }, 1200);
}

async function copyPresetLink() {
  // Use remaining if set, else input
  const secs = remainingSeconds > 0 ? remainingSeconds : readInputsToSeconds();
  const mm = Math.floor(secs / 60);
  const ss = secs % 60;

  const url = new URL(window.location.href);
  url.searchParams.set("t", `${mm}:${pad2(ss)}`);

  try {
    await navigator.clipboard.writeText(url.toString());
    showToast("Link copied!");
  } catch (e) {
    // fallback
    const tmp = document.createElement("textarea");
    tmp.value = url.toString();
    document.body.appendChild(tmp);
    tmp.select();
    document.execCommand("copy");
    tmp.remove();
    showToast("Link copied!");
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  els.toggleSoundBtn.setAttribute("aria-pressed", String(soundEnabled));
  els.toggleSoundBtn.textContent = `Sound: ${soundEnabled ? "On" : "Off"}`;
}

async function toggleFullscreen() {
  const el = document.documentElement;
  try {
    if (!document.fullscreenElement) {
      await el.requestFullscreen();
      els.fullscreenBtn.textContent = "Exit Fullscreen";
    } else {
      await document.exitFullscreen();
      els.fullscreenBtn.textContent = "Fullscreen";
    }
  } catch (_) {}
}

function isPresentFromUrl() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("present") === "1") return true;
  if (window.location.hash && window.location.hash.toLowerCase().includes("present")) return true;
  return false;
}

function enterPresentationMode() {
  document.body.classList.add("present-mode");
  els.presentBtn.textContent = "Exit Presentation";
  // Optional: auto fullscreen for maximum effect (comment out if you prefer manual)
  // if (!document.fullscreenElement) toggleFullscreen();
}

function exitPresentationMode() {
  document.body.classList.remove("present-mode");
  els.presentBtn.textContent = "Presentation Mode";
}

function togglePresentationMode() {
  const on = document.body.classList.contains("present-mode");
  if (on) exitPresentationMode();
  else enterPresentationMode();
}


function applyQueryPreset() {
  const params = new URLSearchParams(window.location.search);

  // ?m=25 (minutes)
  if (params.has("m")) {
    const m = clamp(parseInt(params.get("m") || "0", 10), 0, 999);
    writeSecondsToInputs(m * 60);
    resetTimer();
    return;
  }

  // ?t=15:00 or ?t=900
  if (params.has("t")) {
    const t = params.get("t") || "";
    if (/^\d+:\d{1,2}$/.test(t)) {
      const [m, s] = t.split(":");
      const mm = clamp(parseInt(m, 10), 0, 999);
      const ss = clamp(parseInt(s, 10), 0, 59);
      writeSecondsToInputs((mm * 60) + ss);
      resetTimer();
      return;
    }
    if (/^\d+$/.test(t)) {
      const secs = clamp(parseInt(t, 10), 0, 59940);
      writeSecondsToInputs(secs);
      resetTimer();
      return;
    }
  }

  resetTimer();
}

/* Events */
els.startBtn.addEventListener("click", startTimer);
els.pauseBtn.addEventListener("click", pauseTimer);
els.resetBtn.addEventListener("click", resetTimer);
els.fullscreenBtn.addEventListener("click", toggleFullscreen);
els.copyLinkBtn.addEventListener("click", copyPresetLink);
els.toggleSoundBtn.addEventListener("click", toggleSound);
els.presentBtn.addEventListener("click", togglePresentationMode);


els.presets.forEach(btn => {
  btn.addEventListener("click", () => {
    const m = clamp(parseInt(btn.dataset.min || "0", 10), 0, 999);
    writeSecondsToInputs(m * 60);
    resetTimer();
  });
});

// If user edits inputs while running, do nothing.
// If user edits while stopped, update preview
["input", "change"].forEach(evt => {
  els.mins.addEventListener(evt, () => { if (!running) resetTimer(); });
  els.secs.addEventListener(evt, () => { if (!running) resetTimer(); });
});

// Keyboard shortcuts (ignore when typing in inputs)
document.addEventListener("keydown", (e) => {
  const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : "";
  const typing = tag === "input" || tag === "textarea" || e.target.isContentEditable;

  if (typing) return;

  // ESC exits presentation mode
  if (e.key === "Escape") {
    if (document.body.classList.contains("present-mode")) {
      e.preventDefault();
      exitPresentationMode();
    }
    return;
  }

  if (e.code === "Space") {
    e.preventDefault();
    running ? pauseTimer() : startTimer();
  }
  if (e.key.toLowerCase() === "r") {
    e.preventDefault();
    resetTimer();
  }
  if (e.key.toLowerCase() === "f") {
    e.preventDefault();
    toggleFullscreen();
  }
});


// Update fullscreen button label if user exits via ESC
document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement) {
    els.fullscreenBtn.textContent = "Fullscreen";
  } else {
    els.fullscreenBtn.textContent = "Exit Fullscreen";
  }
});

/* Init */
applyQueryPreset();
updateDisplay();

if (isPresentFromUrl()) {
  enterPresentationMode();
}

