// SimpleCountdownTimer — app.js (MVP)

const $ = (id) => document.getElementById(id);

const timeOut = $("timeOut");
const statusOut = $("statusOut");
const minsIn = $("mins");
const secsIn = $("secs");

const btnSet = $("btnSet");
const btnStart = $("btnStart");
const btnPause = $("btnPause");
const btnReset = $("btnReset");
const btnShare = $("btnShare");
const btnSound = $("btnSound");

const toast = $("toast");
const beep = $("beep");

let totalSeconds = 300;      // default 5:00
let remaining = totalSeconds;
let intervalId = null;
let running = false;
let soundOn = true;

function showToast(msg){
  if(!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(()=>toast.classList.remove("show"), 1400);
}

function clamp(n, min, max){
  return Math.min(max, Math.max(min, n));
}

function formatTime(sec){
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const hh = h > 0 ? String(h).padStart(2,"0") + ":" : "";
  return `${hh}${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function render(){
  timeOut.textContent = formatTime(remaining);
  document.title = `${formatTime(remaining)} — SimpleCountdownTimer`;
}

function setButtons(){
  btnPause.disabled = !running;
  btnReset.disabled = (remaining === totalSeconds && !running);
  btnStart.disabled = running || remaining <= 0;
}

function stopTimer(){
  if(intervalId) clearInterval(intervalId);
  intervalId = null;
  running = false;
  setButtons();
}

function tick(){
  if(remaining <= 0){
    remaining = 0;
    render();
    stopTimer();
    statusOut.textContent = "Time’s up!";
    if(soundOn){
      // beep with a safe fallback
      try { beep.currentTime = 0; beep.play(); } catch(e) {}
    }
    return;
  }
  remaining -= 1;
  render();
}

function startTimer(){
  if(running || remaining <= 0) return;
  running = true;
  statusOut.textContent = "Running…";
  setButtons();
  intervalId = setInterval(tick, 1000);
}

function pauseTimer(){
  if(!running) return;
  stopTimer();
  statusOut.textContent = "Paused.";
}

function resetTimer(){
  stopTimer();
  remaining = totalSeconds;
  render();
  statusOut.textContent = "Ready.";
  setButtons();
}

function setFromInputs(){
  const mRaw = parseInt(minsIn.value || "0", 10);
  const sRaw = parseInt(secsIn.value || "0", 10);

  const m = isNaN(mRaw) ? 0 : clamp(mRaw, 0, 999);
  const s = isNaN(sRaw) ? 0 : clamp(sRaw, 0, 59);

  const newTotal = (m * 60) + s;
  if(newTotal <= 0){
    showToast("Enter a time above 0");
    return;
  }

  stopTimer();
  totalSeconds = newTotal;
  remaining = totalSeconds;
  render();
  statusOut.textContent = "Ready.";
  setButtons();

  // update URL for shareability
  setQueryFromSeconds(totalSeconds);
}

function setPreset(seconds){
  seconds = clamp(seconds, 1, 60 * 60 * 24); // up to 24h for sanity
  stopTimer();
  totalSeconds = seconds;
  remaining = totalSeconds;
  render();
  statusOut.textContent = "Ready.";
  setButtons();
  setQueryFromSeconds(totalSeconds);
}

function setQueryFromSeconds(seconds){
  const url = new URL(window.location.href);
  url.searchParams.set("t", String(seconds));
  window.history.replaceState({}, "", url.toString());
}

async function copyLink(){
  const url = new URL(window.location.href);
  url.searchParams.set("t", String(totalSeconds));
  try{
    await navigator.clipboard.writeText(url.toString());
    showToast("Link copied");
  } catch(e){
    // fallback
    const ta = document.createElement("textarea");
    ta.value = url.toString();
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    try { document.execCommand("copy"); showToast("Link copied"); }
    catch(err){ showToast("Copy failed"); }
    document.body.removeChild(ta);
  }
}

function toggleSound(){
  soundOn = !soundOn;
  btnSound.textContent = soundOn ? "Sound: On" : "Sound: Off";
  showToast(soundOn ? "Sound enabled" : "Sound muted");
}

// Wire up preset chips
document.querySelectorAll("[data-preset]").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const sec = parseInt(btn.getAttribute("data-preset"), 10);
    if(!isNaN(sec)) setPreset(sec);
  });
});

// Buttons
btnSet.addEventListener("click", setFromInputs);
btnStart.addEventListener("click", startTimer);
btnPause.addEventListener("click", pauseTimer);
btnReset.addEventListener("click", resetTimer);
btnShare.addEventListener("click", copyLink);
btnSound.addEventListener("click", toggleSound);

// Enter key in inputs triggers Set
[minsIn, secsIn].forEach(inp=>{
  inp.addEventListener("keydown", (e)=>{
    if(e.key === "Enter") setFromInputs();
  });
});

// Load from URL (?t=300)
(function init(){
  const url = new URL(window.location.href);
  const t = parseInt(url.searchParams.get("t") || "", 10);
  if(!isNaN(t) && t > 0){
    totalSeconds = clamp(t, 1, 60 * 60 * 24);
    remaining = totalSeconds;
  } else {
    // default 5 minutes
    totalSeconds = 300;
    remaining = totalSeconds;
    setQueryFromSeconds(totalSeconds);
  }

  $("year").textContent = new Date().getFullYear();
  render();
  statusOut.textContent = "Ready.";
  setButtons();
})();
document.addEventListener("keydown", (e) => {
  const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : "";
  const isTyping =
    tag === "input" || tag === "textarea" || tag === "select" || e.target.isContentEditable;

  if (isTyping) return; // don't hijack keys while user types

  // Space toggles start/pause
  if (e.code === "Space") {
    e.preventDefault(); // prevents page scrolling
    toggleStartPause(); // you will implement or connect this function below
  }

  // R resets
  if (e.key.toLowerCase() === "r") {
    e.preventDefault();
    resetTimer();
  }
});

