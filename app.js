// app.js
document.addEventListener('DOMContentLoaded', () => {
    const timerDisplay = document.getElementById('timer');
    const minutesInput = document.getElementById('minutes');
    const secondsInput = document.getElementById('seconds');
    const setBtn = document.getElementById('set-btn');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resumeBtn = document.getElementById('resume-btn');
    const resetBtn = document.getElementById('reset-btn');
    const soundSelect = document.getElementById('sound');
    const presetBtns = document.querySelectorAll('.preset-btn');

    let countdownInterval;
    let remainingTime = 0; // in seconds
    let isPaused = false;
    let audioContext;
    let soundEnabled = true;

    // Initialize AudioContext for beep sound
    function initAudio() {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    function playBeep() {
        if (!soundEnabled || !audioContext) return;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.value = 440; // A4 note
        gainNode.gain.value = 0.5;

        oscillator.start();
        setTimeout(() => {
            oscillator.stop();
        }, 1000); // 1 second beep
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    function updateDisplay() {
        timerDisplay.textContent = formatTime(remainingTime);
    }

    function startCountdown() {
        if (countdownInterval) clearInterval(countdownInterval);

        countdownInterval = setInterval(() => {
            if (remainingTime > 0) {
                remainingTime--;
                updateDisplay();
            } else {
                clearInterval(countdownInterval);
                playBeep();
                resetControls();
            }
        }, 1000);

        startBtn.disabled = true;
        pauseBtn.disabled = false;
        resumeBtn.disabled = true;
        resetBtn.disabled = false;
    }

    function pauseCountdown() {
        clearInterval(countdownInterval);
        isPaused = true;
        pauseBtn.disabled = true;
        resumeBtn.disabled = false;
    }

    function resumeCountdown() {
        startCountdown();
        isPaused = false;
        pauseBtn.disabled = false;
        resumeBtn.disabled = true;
    }

    function resetCountdown() {
        clearInterval(countdownInterval);
        remainingTime = 0;
        updateDisplay();
        resetControls();
    }

    function resetControls() {
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        resumeBtn.disabled = true;
        resetBtn.disabled = true;
    }

    // Event listeners
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const minutes = parseInt(btn.dataset.minutes);
            remainingTime = minutes * 60;
            updateDisplay();
            minutesInput.value = minutes;
            secondsInput.value = 0;
        });
    });

    setBtn.addEventListener('click', () => {
        const minutes = parseInt(minutesInput.value) || 0;
        const seconds = parseInt(secondsInput.value) || 0;
        remainingTime = minutes * 60 + seconds;
        updateDisplay();
    });

    startBtn.addEventListener('click', () => {
        if (remainingTime > 0) {
            initAudio(); // Initialize audio on user interaction
            startCountdown();
        }
    });

    pauseBtn.addEventListener('click', pauseCountdown);

    resumeBtn.addEventListener('click', resumeCountdown);

    resetBtn.addEventListener('click', resetCountdown);

    soundSelect.addEventListener('change', () => {
        soundEnabled = soundSelect.value === 'on';
    });

    // Initial setup
    updateDisplay();
    resetControls();
});
