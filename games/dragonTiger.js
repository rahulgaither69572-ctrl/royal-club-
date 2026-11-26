// Dragon vs Tiger Game Logic
class DragonTigerGame {
    constructor() {
        this.timer = 12;
        this.state = 'BETTING'; // 'BETTING', 'DEALING', 'RESULT'
        this.selectedChip = 50;
        this.myBets = { dragon: 0, tie: 0, tiger: 0 };
        this.botBets = { dragon: 24500, tie: 1200, tiger: 26800 };
        this.history = ['D', 'T', 'D', 'D', 'T', 'TIE', 'T', 'D', 'T', 'D'];
        this.interval = null;
        this.dragonCard = null;
        this.tigerCard = null;
    }

    init() {
        this.renderHistory();
        this.startLoop();
    }

    startLoop() {
        if (this.interval) clearInterval(this.interval);
        this.timer = 12;
        this.state = 'BETTING';
        this.myBets = { dragon: 0, tie: 0, tiger: 0 };
        this.updateUI();

        this.interval = setInterval(() => {
            this.timer--;
            const timerEl = document.getElementById('dt-timer');
            if (timerEl) {
                timerEl.textContent = this.timer + 's';
                if (this.timer <= 3 && this.timer > 0) {
                    window.soundSystem.tick();
                    timerEl.style.color = '#ff4d4f';
                } else {
                    timerEl.style.color = '#ffd700';
                }
            }

            // Simulate live other players betting
            if (this.state === 'BETTING' && this.timer > 2) {
                this.botBets.dragon += Math.floor(Math.random() * 800 + 200);
                this.botBets.tiger += Math.floor(Math.random() * 800 + 200);
                if (Math.random() > 0.6) this.botBets.tie += Math.floor(Math.random() * 200 + 50);
                this.updateBetLabels();
            }

            if (this.timer <= 0) {
                if (this.state === 'BETTING') {
                    this.resolveRound();
                } else if (this.state === 'RESULT') {
                    this.startLoop();
                }
            }
        }, 1000);
    }

    placeBet(side) {
        if (this.state !== 'BETTING') {
            window.showToast("Wait for next round to bet!", "warning");
            return;
        }
        if (this.timer <= 2) {
            window.showToast("Betting closed for this round!", "warning");
            return;
        }
        if (window.appState.wallet < this.selectedChip) {
            window.showToast("Insufficient Balance! Recharge chips.", "error");
            return;
        }

        window.appState.deductWallet(this.selectedChip);
        this.myBets[side] += this.selectedChip;
        window.soundSystem.chip();
        this.updateBetLabels();

        // Animate flying chip onto target area
        this.animateChipToArea(side);
    }

    animateChipToArea(side) {
        const area = document.getElementById(`dt-area-${side}`);
        if (!area) return;
        const chip = document.createElement('div');
        chip.className = 'floating-chip';
        chip.textContent = '₹' + this.selectedChip;
        area.appendChild(chip);
        setTimeout(() => chip.remove(), 1200);
    }

    resolveRound() {
        this.state = 'DEALING';
        const timerEl = document.getElementById('dt-timer');
        if (timerEl) timerEl.textContent = 'DEALING...';

        const suits = ['♠', '♥', '♣', '♦'];
        const values = [
            { name: 'A', rank: 1 }, { name: '2', rank: 2 }, { name: '3', rank: 3 },
            { name: '4', rank: 4 }, { name: '5', rank: 5 }, { name: '6', rank: 6 },
            { name: '7', rank: 7 }, { name: '8', rank: 8 }, { name: '9', rank: 9 },
            { name: '10', rank: 10 }, { name: 'J', rank: 11 }, { name: 'Q', rank: 12 },
            { name: 'K', rank: 13 }
        ];

        const dCard = {
            suit: suits[Math.floor(Math.random() * suits.length)],
            val: values[Math.floor(Math.random() * values.length)]
        };
        const tCard = {
            suit: suits[Math.floor(Math.random() * suits.length)],
            val: values[Math.floor(Math.random() * values.length)]
        };

        this.dragonCard = dCard;
        this.tigerCard = tCard;

        const dCardEl = document.getElementById('dt-card-dragon');
        const tCardEl = document.getElementById('dt-card-tiger');

        if (dCardEl) dCardEl.className = 'game-card-view card-back dealing-anim';
        if (tCardEl) tCardEl.className = 'game-card-view card-back dealing-anim';

        setTimeout(() => {
            window.soundSystem.cardFlip();
            this.renderCard('dt-card-dragon', dCard);

            setTimeout(() => {
                window.soundSystem.cardFlip();
                this.renderCard('dt-card-tiger', tCard);

                // Decide Winner
                let winner = '';
                if (dCard.val.rank > tCard.val.rank) {
                    winner = 'dragon';
                    this.history.push('D');
                } else if (tCard.val.rank > dCard.val.rank) {
                    winner = 'tiger';
                    this.history.push('T');
                } else {
                    winner = 'tie';
                    this.history.push('TIE');
                }

                if (this.history.length > 20) this.history.shift();
                this.renderHistory();

                // Payout
                let winAmount = 0;
                if (winner === 'dragon' && this.myBets.dragon > 0) {
                    winAmount = this.myBets.dragon * 2;
                } else if (winner === 'tiger' && this.myBets.tiger > 0) {
                    winAmount = this.myBets.tiger * 2;
                } else if (winner === 'tie' && this.myBets.tie > 0) {
                    winAmount = this.myBets.tie * 9;
                }

                this.highlightWinner(winner);

                if (winAmount > 0) {
                    window.appState.addWallet(winAmount);
                    window.soundSystem.win();
                    window.showToast(`🎉 You Won ₹${winAmount.toLocaleString()} in Dragon vs Tiger!`, 'success');
                } else if (this.myBets.dragon > 0 || this.myBets.tiger > 0 || this.myBets.tie > 0) {
                    window.soundSystem.lose();
                    window.showToast(`Round finished. Winner: ${winner.toUpperCase()}`, 'info');
                }

                this.state = 'RESULT';
                this.timer = 5; // Result pause before restart
            }, 800);
        }, 600);
    }

    renderCard(elemId, card) {
        const el = document.getElementById(elemId);
        if (!el) return;
        const isRed = card.suit === '♥' || card.suit === '♦';
        el.className = `game-card-view card-front ${isRed ? 'card-red' : 'card-black'} card-flipped`;
        el.innerHTML = `
            <div class="card-corner top-left"><span>${card.val.name}</span><span>${card.suit}</span></div>
            <div class="card-center">${card.suit}</div>
            <div class="card-corner bottom-right"><span>${card.val.name}</span><span>${card.suit}</span></div>
        `;
    }

    highlightWinner(winner) {
        ['dragon', 'tie', 'tiger'].forEach(w => {
            const area = document.getElementById(`dt-area-${w}`);
            if (area) {
                if (w === winner) area.classList.add('winner-glow');
                else area.classList.remove('winner-glow');
            }
        });
    }

    renderHistory() {
        const container = document.getElementById('dt-history');
        if (!container) return;
        container.innerHTML = this.history.slice(-12).map(item => {
            let cls = item === 'D' ? 'badge-dragon' : (item === 'T' ? 'badge-tiger' : 'badge-tie');
            return `<span class="hist-badge ${cls}">${item}</span>`;
        }).join('');
    }

    updateBetLabels() {
        ['dragon', 'tie', 'tiger'].forEach(side => {
            const myEl = document.getElementById(`dt-mybet-${side}`);
            const totalEl = document.getElementById(`dt-totalbet-${side}`);
            if (myEl) myEl.textContent = 'My: ₹' + this.myBets[side];
            if (totalEl) totalEl.textContent = 'Total: ₹' + (this.botBets[side] + this.myBets[side]).toLocaleString();
        });
    }

    updateUI() {
        const dCardEl = document.getElementById('dt-card-dragon');
        const tCardEl = document.getElementById('dt-card-tiger');
        if (dCardEl) {
            dCardEl.className = 'game-card-view card-back';
            dCardEl.innerHTML = '<div class="card-pattern">🐉</div>';
        }
        if (tCardEl) {
            tCardEl.className = 'game-card-view card-back';
            tCardEl.innerHTML = '<div class="card-pattern">🐅</div>';
        }

        ['dragon', 'tie', 'tiger'].forEach(w => {
            const area = document.getElementById(`dt-area-${w}`);
            if (area) area.classList.remove('winner-glow');
        });

        this.updateBetLabels();
    }

    destroy() {
        if (this.interval) clearInterval(this.interval);
    }
}

window.DragonTigerGame = DragonTigerGame;
