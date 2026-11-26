// Andar Bahar Game Logic
class AndarBaharGame {
    constructor() {
        this.state = 'BETTING'; // 'BETTING', 'DEALING', 'FINISHED'
        this.jokerCard = null;
        this.andarCards = [];
        this.baharCards = [];
        this.selectedChip = 50;
        this.myBets = { andar: 0, bahar: 0 };
        this.dealInterval = null;
        this.history = ['ANDAR', 'BAHAR', 'ANDAR', 'ANDAR', 'BAHAR'];
    }

    init() {
        this.renderHistory();
        this.newRound();
    }

    createDeck() {
        const suits = ['♠', '♥', '♣', '♦'];
        const values = [
            { name: 'A', rank: 1 }, { name: '2', rank: 2 }, { name: '3', rank: 3 },
            { name: '4', rank: 4 }, { name: '5', rank: 5 }, { name: '6', rank: 6 },
            { name: '7', rank: 7 }, { name: '8', rank: 8 }, { name: '9', rank: 9 },
            { name: '10', rank: 10 }, { name: 'J', rank: 11 }, { name: 'Q', rank: 12 },
            { name: 'K', rank: 13 }
        ];

        let deck = [];
        suits.forEach(s => {
            values.forEach(v => {
                deck.push({ suit: s, val: v });
            });
        });

        // Shuffle deck
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    newRound() {
        if (this.dealInterval) clearInterval(this.dealInterval);
        this.deck = this.createDeck();
        this.jokerCard = this.deck.pop();
        this.andarCards = [];
        this.baharCards = [];
        this.myBets = { andar: 0, bahar: 0 };
        this.state = 'BETTING';

        this.renderJoker();
        this.renderPiles();
        this.updateBetLabels();
        this.setStatus("Place your bets on ANDAR or BAHAR!");

        const dealBtn = document.getElementById('ab-deal-btn');
        if (dealBtn) {
            dealBtn.disabled = false;
            dealBtn.textContent = 'Deal Cards';
            dealBtn.onclick = () => this.startDealing();
        }
    }

    clearBets() {
        if (this.state !== 'BETTING') return;
        const totalRefund = this.myBets.andar + this.myBets.bahar;
        if (totalRefund > 0) {
            window.appState.addWallet(totalRefund);
            this.myBets = { andar: 0, bahar: 0 };
            this.updateBetLabels();
            window.showToast("Bets cleared and refunded!", "info");
        }
    }

    placeBet(side) {
        if (this.state !== 'BETTING') {
            window.showToast("Dealing already in progress!", "warning");
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
        window.showToast(`Placed ₹${this.selectedChip} on ${side.toUpperCase()}!`, 'success');
    }

    startDealing() {
        if (this.state !== 'BETTING') return;
        if (this.myBets.andar === 0 && this.myBets.bahar === 0) {
            window.showToast("Please place a bet on Andar or Bahar first!", "warning");
            return;
        }

        this.state = 'DEALING';
        const dealBtn = document.getElementById('ab-deal-btn');
        if (dealBtn) {
            dealBtn.disabled = true;
            dealBtn.textContent = 'Dealing...';
        }

        let nextSide = 'andar';
        this.setStatus("Cards dealing underway...");

        this.dealInterval = setInterval(() => {
            if (this.deck.length === 0) {
                clearInterval(this.dealInterval);
                return;
            }

            const card = this.deck.pop();
            window.soundSystem.cardFlip();

            if (nextSide === 'andar') {
                this.andarCards.push(card);
                this.renderPiles();
                if (card.val.rank === this.jokerCard.val.rank) {
                    this.endRound('ANDAR');
                    return;
                }
                nextSide = 'bahar';
            } else {
                this.baharCards.push(card);
                this.renderPiles();
                if (card.val.rank === this.jokerCard.val.rank) {
                    this.endRound('BAHAR');
                    return;
                }
                nextSide = 'andar';
            }
        }, 500);
    }

    endRound(winner) {
        clearInterval(this.dealInterval);
        this.state = 'FINISHED';
        this.history.push(winner);
        if (this.history.length > 15) this.history.shift();
        this.renderHistory();

        let winAmount = 0;
        if (winner === 'ANDAR' && this.myBets.andar > 0) {
            winAmount = Math.floor(this.myBets.andar * 1.95);
        } else if (winner === 'BAHAR' && this.myBets.bahar > 0) {
            winAmount = Math.floor(this.myBets.bahar * 2.0);
        }

        if (winAmount > 0) {
            window.appState.addWallet(winAmount);
            window.soundSystem.win();
            this.setStatus(`🎉 MATCH FOUND! ${winner} WINS! You won ₹${winAmount.toLocaleString()}`);
            window.showToast(`🎉 You Won ₹${winAmount.toLocaleString()} on ${winner}!`, 'success');
        } else {
            window.soundSystem.lose();
            this.setStatus(`MATCH FOUND! ${winner} WINS.`);
            window.showToast(`${winner} won this round.`, 'info');
        }

        const dealBtn = document.getElementById('ab-deal-btn');
        if (dealBtn) {
            dealBtn.disabled = false;
            dealBtn.textContent = 'Play Next Round';
            dealBtn.onclick = () => this.newRound();
        }
    }

    renderCardHTML(card, isHighlight = false) {
        const isRed = card.suit === '♥' || card.suit === '♦';
        return `
            <div class="mini-card ${isRed ? 'card-red' : 'card-black'} ${isHighlight ? 'match-glow' : ''}">
                <span class="mini-val">${card.val.name}</span>
                <span class="mini-suit">${card.suit}</span>
            </div>
        `;
    }

    renderJoker() {
        const jokerEl = document.getElementById('ab-joker-card');
        if (!jokerEl || !this.jokerCard) return;
        const isRed = this.jokerCard.suit === '♥' || this.jokerCard.suit === '♦';
        jokerEl.className = `game-card-view card-front ${isRed ? 'card-red' : 'card-black'}`;
        jokerEl.innerHTML = `
            <div class="card-corner top-left"><span>${this.jokerCard.val.name}</span><span>${this.jokerCard.suit}</span></div>
            <div class="card-center">${this.jokerCard.suit}</div>
            <div class="card-corner bottom-right"><span>${this.jokerCard.val.name}</span><span>${this.jokerCard.suit}</span></div>
        `;
    }

    renderPiles() {
        const andarPile = document.getElementById('ab-andar-cards');
        const baharPile = document.getElementById('ab-bahar-cards');
        if (andarPile) {
            andarPile.innerHTML = this.andarCards.map(c => 
                this.renderCardHTML(c, c.val.rank === this.jokerCard.val.rank)
            ).join('');
            andarPile.scrollLeft = andarPile.scrollWidth;
        }
        if (baharPile) {
            baharPile.innerHTML = this.baharCards.map(c => 
                this.renderCardHTML(c, c.val.rank === this.jokerCard.val.rank)
            ).join('');
            baharPile.scrollLeft = baharPile.scrollWidth;
        }
    }

    updateBetLabels() {
        const aBet = document.getElementById('ab-mybet-andar');
        const bBet = document.getElementById('ab-mybet-bahar');
        if (aBet) aBet.textContent = '₹' + this.myBets.andar;
        if (bBet) bBet.textContent = '₹' + this.myBets.bahar;
    }

    setStatus(msg) {
        const el = document.getElementById('ab-status-text');
        if (el) el.textContent = msg;
    }

    renderHistory() {
        const el = document.getElementById('ab-history');
        if (!el) return;
        el.innerHTML = this.history.map(item => {
            const cls = item === 'ANDAR' ? 'badge-andar' : 'badge-bahar';
            return `<span class="hist-badge ${cls}">${item[0]}</span>`;
        }).join('');
    }

    destroy() {
        if (this.dealInterval) clearInterval(this.dealInterval);
    }
}

window.AndarBaharGame = AndarBaharGame;
