// Main Application Controller & State
class AppState {
    constructor() {
        this.wallet = parseInt(localStorage.getItem('gp_wallet')) || 10000;
        this.username = localStorage.getItem('gp_user') || 'VIP_Player_' + Math.floor(Math.random() * 8999 + 1000);
        this.currentView = 'dashboard';
        this.activeGame = null;
        this.activeGameType = null;
    }

    save() {
        localStorage.setItem('gp_wallet', this.wallet);
        localStorage.setItem('gp_user', this.username);
        this.updateHeaderUI();
    }

    addWallet(amount) {
        this.wallet += Math.floor(amount);
        this.save();
        this.animateBalanceChange('+₹' + Math.floor(amount), 'positive');
    }

    deductWallet(amount) {
        this.wallet = Math.max(0, this.wallet - Math.floor(amount));
        this.save();
        this.animateBalanceChange('-₹' + Math.floor(amount), 'negative');
    }

    animateBalanceChange(text, type) {
        const floatEl = document.createElement('div');
        floatEl.className = `floating-balance-indicator ${type}`;
        floatEl.textContent = text;
        const target = document.getElementById('user-balance-wrap');
        if (target) {
            target.appendChild(floatEl);
            setTimeout(() => floatEl.remove(), 1200);
        }
    }

    updateHeaderUI() {
        const balEl = document.getElementById('user-wallet-balance');
        if (balEl) balEl.textContent = '₹' + this.wallet.toLocaleString();
        const userEl = document.getElementById('header-username');
        if (userEl) userEl.textContent = this.username;
    }
}

window.appState = new AppState();

// Toast notification helper
window.showToast = function(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `app-toast toast-${type}`;
    let icon = 'ℹ️';
    if (type === 'success') icon = '🎉';
    if (type === 'error') icon = '⚠️';
    if (type === 'warning') icon = '🔔';

    toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-text">${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 400);
    }, 2800);
};

// Navigation controller
function switchView(viewName) {
    window.soundSystem.click();

    // Destroy active game if exiting
    if (window.appState.activeGame && window.appState.activeGame.destroy) {
        window.appState.activeGame.destroy();
        window.appState.activeGame = null;
        window.appState.activeGameType = null;
    }

    // Hide all view screens
    document.querySelectorAll('.view-screen').forEach(el => el.classList.remove('active-view'));

    if (viewName === 'dashboard') {
        const dash = document.getElementById('view-dashboard');
        if (dash) dash.classList.add('active-view');
        window.appState.currentView = 'dashboard';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    // Game views
    const gameScreen = document.getElementById(`view-${viewName}`);
    if (gameScreen) {
        gameScreen.classList.add('active-view');
        window.appState.currentView = viewName;
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Instantiate corresponding game
        if (viewName === 'game-dragon-tiger') {
            window.dragonTigerGame = new window.DragonTigerGame();
            window.dragonTigerGame.init();
            window.appState.activeGame = window.dragonTigerGame;
        } else if (viewName === 'game-color') {
            window.colorGame = new window.ColorPredictionGame();
            window.colorGame.init();
            window.appState.activeGame = window.colorGame;
        } else if (viewName === 'game-andar-bahar') {
            window.andarBaharGame = new window.AndarBaharGame();
            window.andarBaharGame.init();
            window.appState.activeGame = window.andarBaharGame;
        } else if (viewName === 'game-teen-patti') {
            window.teenPattiGame = new window.TeenPattiGame();
            window.teenPattiGame.init();
            window.appState.activeGame = window.teenPattiGame;
        } else if (viewName === 'game-rummy') {
            window.rummyGame = new window.RummyGame();
            window.rummyGame.init();
            window.appState.activeGame = window.rummyGame;
        }
    }
}

// Chip Selector Helper
function setupChipButtons(gamePrefix, callback) {
    const chips = [10, 50, 100, 500, 1000, 5000];
    const container = document.getElementById(`${gamePrefix}-chips`);
    if (!container) return;

    container.innerHTML = chips.map(c => `
        <button class="chip-btn ${c === 50 ? 'active' : ''}" data-val="${c}">
            <div class="chip-inner">₹${c}</div>
        </button>
    `).join('');

    container.querySelectorAll('.chip-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            window.soundSystem.chip();
            container.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const val = parseInt(btn.getAttribute('data-val'));
            callback(val);
        });
    });
}

// Modals
function openModal(id) {
    window.soundSystem.click();
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
}

// Add Demo Cash function
function addDemoCash(amt) {
    window.appState.addWallet(amt);
    window.soundSystem.win();
    window.showToast(`₹${amt.toLocaleString()} Demo Chips added to your wallet!`, 'success');
    closeModal('modal-deposit');
}

// Daily Spin Wheel
let isSpinning = false;
function spinWheel() {
    if (isSpinning) return;
    const wheel = document.getElementById('spin-disc');
    if (!wheel) return;

    isSpinning = true;
    window.soundSystem.cardFlip();

    const rewards = [200, 500, 1000, 2000, 5000, 10000];
    const pickedIdx = Math.floor(Math.random() * rewards.length);
    const winAmt = rewards[pickedIdx];

    const deg = 360 * 5 + (pickedIdx * 60) + 30;
    wheel.style.transition = 'transform 3.5s cubic-bezier(0.15, 0.9, 0.2, 1)';
    wheel.style.transform = `rotate(${deg}deg)`;

    setTimeout(() => {
        isSpinning = false;
        window.appState.addWallet(winAmt);
        window.soundSystem.win();
        window.showToast(`🎉 Lucky Spin Won ₹${winAmt.toLocaleString()} Chips!`, 'success');
        wheel.style.transition = 'none';
        wheel.style.transform = `rotate(${deg % 360}deg)`;
    }, 3600);
}

// Category filter on dashboard - Fixed cross-browser event handling
function filterGames(category, eventRef) {
    window.soundSystem.click();
    document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
    
    // Safely resolve clicked element
    const clickedBtn = (eventRef && eventRef.currentTarget) || (window.event && window.event.currentTarget);
    if (clickedBtn) {
        clickedBtn.classList.add('active');
    }

    const cards = document.querySelectorAll('.game-card');
    cards.forEach(card => {
        const cat = card.getAttribute('data-category');
        if (category === 'all' || cat.includes(category)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

// Periodic live winner notification simulator
function startLiveWinnerFeed() {
    const games = ['Dragon vs Tiger', '3 Patti', 'Color Prediction', 'Andar Bahar', 'Rummy'];
    setInterval(() => {
        const userDigits = Math.floor(Math.random() * 89 + 10);
        const winGame = games[Math.floor(Math.random() * games.length)];
        const amount = Math.floor(Math.random() * 450 + 50) * 100;
        const bannerTicker = document.getElementById('live-ticker-text');
        if (bannerTicker) {
            bannerTicker.textContent = `🔥 User 98***${userDigits} just won ₹${amount.toLocaleString()} in ${winGame}! | 🏆 Mega Jackpot pool: ₹12,48,900 | ⚡ 100% Instant Play`;
        }
    }, 6000);
}

// Initialization on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    window.appState.updateHeaderUI();
    startLiveWinnerFeed();

    // Close modal when clicking outside on dark overlay
    document.querySelectorAll('.app-modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
            }
        });
    });

    // Resume AudioContext on first user interaction anywhere
    document.addEventListener('click', () => {
        if (window.soundSystem) window.soundSystem.init();
    }, { once: true });

    // Sound toggle
    const soundBtn = document.getElementById('btn-sound-toggle');
    if (soundBtn) {
        soundBtn.addEventListener('click', () => {
            const isMuted = window.soundSystem.toggleMute();
            soundBtn.textContent = isMuted ? '🔇' : '🔊';
            window.showToast(isMuted ? 'Sound Muted' : 'Sound Enabled', 'info');
        });
    }

    // Set up chip selectors for each game
    setupChipButtons('dt', val => { if (window.dragonTigerGame) window.dragonTigerGame.selectedChip = val; });
    setupChipButtons('color', val => { if (window.colorGame) window.colorGame.selectedChip = val; });
    setupChipButtons('ab', val => { if (window.andarBaharGame) window.andarBaharGame.selectedChip = val; });
    setupChipButtons('tp', val => { if (window.teenPattiGame) window.teenPattiGame.setBoot(val); });
});
