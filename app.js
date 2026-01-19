// Timer State
let countdownInterval = null;
let totalSeconds = 300; // Default 5 minutes
let remainingSeconds = 300;
let isRunning = false;
let isPaused = false;
let soundEnabled = true;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateDisplay();
    checkForSharedTimer();
});

// Set timer from preset buttons
function setTimer(minutes, seconds) {
    if (isRunning && !isPaused) {
        if (!confirm('Timer is running. Do you want to reset it?')) {
            return;
        }
    }
    
    resetTimer();
    totalSeconds = (minutes * 60) + seconds;
    remainingSeconds = totalSeconds;
    
    // Update input fields
    document.getElementById('minutesInput').value = minutes;
    document.getElementById('secondsInput').value = seconds;
    
    updateDisplay();
    updateStatus('Ready.');
}

// Set custom timer from input fields
function setCustomTimer() {
    if (isRunning && !isPaused) {
        if (!confirm('Timer is running. Do you want to reset it?')) {
            return;
        }
    }
    
    const minutes = parseInt(document.getElementById('minutesInput').value) || 0;
    const seconds = parseInt(document.getElementById('secondsInput').value) || 0;
    
    if (minutes === 0 && seconds === 0) {
        alert('Please enter a time greater than 0.');
        return;
    }
    
    resetTimer();
    totalSeconds = (minutes * 60) + seconds;
    remainingSeconds = totalSeconds;
    
    updateDisplay();
    updateStatus('Ready.');
}

// Validate input fields
function validateInput(input) {
    let value = parseInt(input.value) || 0;
    
    if (input.id === 'minutesInput') {
        if (value < 0) value = 0;
        if (value > 999) value = 999;
    } else if (input.id === 'secondsInput') {
        if (value < 0) value = 0;
        if (value > 59) value = 59;
    }
    
    input.value = value;
}

// Start timer
function startTimer() {
    if (isRunning) return;
    
    if (remainingSeconds <= 0) {
        alert('Please set a time first.');
        return;
    }
    
    isRunning = true;
    isPaused = false;
    
    document.getElementById('startBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;
    document.getElementById('timerDisplay').classList.add('running');
    
    updateStatus('Running...');
    
    countdownInterval = setInterval(() => {
        remainingSeconds--;
        updateDisplay();
        
        if (remainingSeconds <= 0) {
            timerComplete();
        }
    }, 1000);
}

// Pause timer
function pauseTimer() {
    if (!isRunning) return;
    
    isPaused = true;
    isRunning = false;
    clearInterval(countdownInterval);
    
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    document.getElementById('timerDisplay').classList.remove('running');
    
    updateStatus('Paused.');
}

// Reset timer
function resetTimer() {
    clearInterval(countdownInterval);
    isRunning = false;
    isPaused = false;
    remainingSeconds = totalSeconds;
    
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    document.getElementById('timerDisplay').classList.remove('running');
    
    updateDisplay();
    updateStatus('Ready.');
}

// Timer complete
function timerComplete() {
    clearInterval(countdownInterval);
    isRunning = false;
    remainingSeconds = 0;
    
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    document.getElementById('timerDisplay').classList.remove('running');
    
    updateDisplay();
    updateStatus('Time\'s up! 🎉');
    
    // Play sound
    if (soundEnabled) {
        playAlarmSound();
    }
    
    // Show notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Timer Complete!', {
            body: 'Your countdown has finished.',
            icon: '⏱️'
        });
    }
}

// Update display
function updateDisplay() {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    
    document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
}

// Update status message
function updateStatus(message) {
    document.getElementById('timerStatus').textContent = message;
}

// Toggle sound
function toggleSound() {
    soundEnabled = !soundEnabled;
    
    const btn = document.getElementById('soundBtn');
    const icon = document.getElementById('soundIcon');
    const status = document.getElementById('soundStatus');
    
    if (soundEnabled) {
        btn.classList.remove('muted');
        icon.textContent = '🔊';
        status.textContent = 'On';
    } else {
        btn.classList.add('muted');
        icon.textContent = '🔇';
        status.textContent = 'Off';
    }
}

// Play alarm sound using Web Audio API
function playAlarmSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create a simple beep pattern
    const beepCount = 3;
    const beepDuration = 0.2;
    const beepGap = 0.3;
    
    for (let i = 0; i < beepCount; i++) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        const startTime = audioContext.currentTime + (i * (beepDuration + beepGap));
        const endTime = startTime + beepDuration;
        
        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, endTime);
        
        oscillator.start(startTime);
        oscillator.stop(endTime);
    }
}

// Request notification permission on first interaction
document.addEventListener('click', () => {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}, { once: true });

// Generate shareable link
function generateLink() {
    const minutes = parseInt(document.getElementById('minutesInput').value) || 0;
    const seconds = parseInt(document.getElementById('secondsInput').value) || 0;
    const totalSecs = (minutes * 60) + seconds;
    
    if (totalSecs === 0) {
        alert('Please set a time first.');
        return;
    }
    
    const url = `${window.location.origin}${window.location.pathname}?t=${totalSecs}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(url).then(() => {
        alert('Link copied to clipboard! Share it with anyone.');
    }).catch(() => {
        prompt('Copy this link:', url);
    });
}

// Check URL for shared timer
function checkForSharedTimer() {
    const params = new URLSearchParams(window.location.search);
    const time = params.get('t');
    
    if (time) {
        const totalSecs = parseInt(time);
        if (totalSecs > 0 && totalSecs < 86400) { // Max 24 hours
            const mins = Math.floor(totalSecs / 60);
            const secs = totalSecs % 60;
            setTimer(mins, secs);
            
            // Show cancel link button
            document.getElementById('cancelBtn').style.display = 'block';
        }
    }
}

// Cancel shared link
function cancelLink() {
    window.history.replaceState({}, document.title, window.location.pathname);
    document.getElementById('cancelBtn').style.display = 'none';
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Space bar to start/pause
    if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        if (isRunning) {
            pauseTimer();
        } else {
            startTimer();
        }
    }
    
    // R key to reset
    if (e.code === 'KeyR' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        resetTimer();
    }
    
    // S key to toggle sound
    if (e.code === 'KeyS' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        toggleSound();
    }
});

// Handle visibility change (pause when tab is hidden to prevent drift)
document.addEventListener('visibilitychange', () => {
    if (document.hidden && isRunning) {
        // Store the exact time when tab was hidden
        window.timerHiddenTime = Date.now();
        window.timerRemainingAtHide = remainingSeconds;
    } else if (!document.hidden && window.timerHiddenTime && isRunning) {
        // Calculate elapsed time while hidden
        const elapsedSeconds = Math.floor((Date.now() - window.timerHiddenTime) / 1000);
        remainingSeconds = window.timerRemainingAtHide - elapsedSeconds;
        
        if (remainingSeconds <= 0) {
            timerComplete();
        } else {
            updateDisplay();
        }
        
        window.timerHiddenTime = null;
    }
});
