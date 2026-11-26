// Red Green Violet Color Prediction Game
class ColorPredictionGame {
    constructor() {
        this.timer = 30;
        this.period = 20261122045;
        this.selectedChip = 50;
        this.currentBets = []; // { type: 'color'|'number', value: 'green'|'red'|'violet'|number, amount: 50 }
        this.interval = null;
        this.history = [
            { period: 20261122044, number: 7, colors: ['green'], size: 'Big' },
            { period: 20261122043, number: 2, colors: ['red'], size: 'Small' },
            { period: 20261122042, number: 0, colors: ['red', 'violet'], size: 'Small' },
            { period: 20261122041, number: 8, colors: ['red'], size: 'Big' },
            { period: 20261122040, number: 5, colors: ['green', 'violet'], size: 'Big' },
            { period: 20261122039, number: 3, colors: ['green'], size: 'Small' },
            { period: 20261122038, number: 6, colors: ['red'], size: 'Big' },
            { period: 20261122037, number: 1, colors: ['green'], size: 'Small' },
        ];
    }

    init() {
        this.renderHistory();
        this.renderBetHistory();
        this.startLoop();
    }

    startLoop() {
        if (this.interval) clearInterval(this.interval);
        this.timer = 30;
        this.updateHeader();

        this.interval = setInterval(() => {
            this.timer--;
            const timerEl = document.getElementById('color-timer');
            if (timerEl) {
                const mins = String(Math.floor(this.timer / 60)).padStart(2, '0');
                const secs = String(this.timer % 60).padStart(2, '0');
                timerEl.textContent = `${mins}:${secs}`;

                if (this.timer <= 5 && this.timer > 0) {
                    window.soundSystem.tick();
                    timerEl.style.color = '#ff4d4f';
                } else {
                    timerEl.style.color = '#00ffcc';
                }
            }

            if (this.timer <= 0) {
                this.resolveRound();
            }
        }, 1000);
    }

    updateHeader() {
        const periodEl = document.getElementById('color-period');
        if (periodEl) periodEl.textContent = this.period;
    }

    placeBet(type, value) {
        if (this.timer <= 5) {
            window.showToast("Betting closed for this round! Wait for next round.", "warning");
            return;
        }
        if (window.appState.wallet < this.selectedChip) {
            window.showToast("Insufficient Balance! Recharge chips.", "error");
            return;
        }

        window.appState.deductWallet(this.selectedChip);
        window.soundSystem.chip();

        this.currentBets.push({
            type,
            value,
            amount: this.selectedChip,
            period: this.period
        });

        window.showToast(`Bet ₹${this.selectedChip} placed on ${value.toString().toUpperCase()}!`, 'success');
        this.renderBetHistory();
    }

    resolveRound() {
        // Draw result number 0-9
        const resultNum = Math.floor(Math.random() * 10);
        let colors = [];
        if (resultNum === 0) colors = ['red', 'violet'];
        else if (resultNum === 5) colors = ['green', 'violet'];
        else if ([1, 3, 7, 9].includes(resultNum)) colors = ['green'];
        else colors = ['red'];

        const size = resultNum >= 5 ? 'Big' : 'Small';

        const roundResult = {
            period: this.period,
            number: resultNum,
            colors: colors,
            size: size
        };

        this.history.unshift(roundResult);
        if (this.history.length > 20) this.history.pop();

        // Calculate payout for current user bets
        let totalWin = 0;
        this.currentBets.forEach(bet => {
            if (bet.type === 'color') {
                if (bet.value === 'violet' && colors.includes('violet')) {
                    totalWin += bet.amount * 4.5;
                } else if (bet.value === 'green' && colors.includes('green')) {
                    totalWin += resultNum === 5 ? bet.amount * 1.5 : bet.amount * 2;
                } else if (bet.value === 'red' && colors.includes('red')) {
                    totalWin += resultNum === 0 ? bet.amount * 1.5 : bet.amount * 2;
                }
            } else if (bet.type === 'number') {
                if (bet.value === resultNum) {
                    totalWin += bet.amount * 9;
                }
            }
        });

        // Show Dialog/Popup with animation
        this.showRoundResultModal(roundResult, totalWin);

        if (totalWin > 0) {
            window.appState.addWallet(totalWin);
            window.soundSystem.win();
        } else if (this.currentBets.length > 0) {
            window.soundSystem.lose();
        }

        // Advance Period
        this.period++;
        this.currentBets = [];
        this.renderHistory();
        this.renderBetHistory();
        this.startLoop();
    }

    showRoundResultModal(res, win) {
        const modal = document.getElementById('color-result-modal');
        if (!modal) return;
        
        const numEl = document.getElementById('crm-number');
        const colorEl = document.getElementById('crm-colors');
        const winEl = document.getElementById('crm-payout');

        if (numEl) numEl.textContent = res.number;
        if (colorEl) {
            colorEl.innerHTML = res.colors.map(c => `<span class="tag-color tag-${c}">${c.toUpperCase()}</span>`).join(' + ');
        }
        if (winEl) {
            if (win > 0) {
                winEl.innerHTML = `<span style="color:#00ff88; font-weight:bold;">🎉 Congratulations! Won: ₹${win.toLocaleString()}</span>`;
            } else {
                winEl.innerHTML = `<span style="color:#aaa;">Next time good luck!</span>`;
            }
        }

        modal.classList.add('active');
        setTimeout(() => modal.classList.remove('active'), 3500);
    }

    renderHistory() {
        const tableBody = document.getElementById('color-history-body');
        if (!tableBody) return;
        tableBody.innerHTML = this.history.slice(0, 10).map(row => {
            const colorBadges = row.colors.map(c => `<span class="color-dot dot-${c}"></span>`).join(' ');
            return `
                <tr>
                    <td>${row.period}</td>
                    <td><strong class="number-badge val-${row.number}">${row.number}</strong></td>
                    <td>${row.size}</td>
                    <td><div class="dot-wrap">${colorBadges}</div></td>
                </tr>
            `;
        }).join('');
    }

    renderBetHistory() {
        const container = document.getElementById('color-mybets-list');
        if (!container) return;
        if (this.currentBets.length === 0) {
            container.innerHTML = `<div class="empty-bet-hint">No bets placed in this round yet.</div>`;
            return;
        }
        container.innerHTML = this.currentBets.map((b, i) => `
            <div class="bet-chip-row">
                <span class="bet-label-badge bg-${b.value}">${b.value.toString().toUpperCase()}</span>
                <span class="bet-amt">₹${b.amount}</span>
            </div>
        `).join('');
    }

    destroy() {
        if (this.interval) clearInterval(this.interval);
    }
}

window.ColorPredictionGame = ColorPredictionGame;
