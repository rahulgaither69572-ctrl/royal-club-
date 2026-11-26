// 13 Card Indian Rummy Game Logic
class RummyGame {
    constructor() {
        this.pointValue = 2; // ₹2 per point
        this.deck = [];
        this.discardPile = [];
        this.playerCards = [];
        this.botCards = [];
        this.hasPicked = false;
        this.selectedCardIndex = null;
        this.jokerCard = null;
        this.state = 'IDLE'; // 'PLAYING', 'FINISHED'
        this.isProcessingTurn = false;
    }

    createDeck() {
        const suits = ['♠', '♥', '♣', '♦'];
        const values = [
            { name: 'A', rank: 1, points: 10 },
            { name: '2', rank: 2, points: 2 },
            { name: '3', rank: 3, points: 3 },
            { name: '4', rank: 4, points: 4 },
            { name: '5', rank: 5, points: 5 },
            { name: '6', rank: 6, points: 6 },
            { name: '7', rank: 7, points: 7 },
            { name: '8', rank: 8, points: 8 },
            { name: '9', rank: 9, points: 9 },
            { name: '10', rank: 10, points: 10 },
            { name: 'J', rank: 11, points: 10 },
            { name: 'Q', rank: 12, points: 10 },
            { name: 'K', rank: 13, points: 10 }
        ];

        // 2 decks for Indian Rummy
        let deck = [];
        for (let d = 0; d < 2; d++) {
            suits.forEach(s => values.forEach(v => deck.push({ suit: s, val: v, id: `${d}-${s}-${v.name}` })));
        }
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    init() {
        this.startNewGame();
    }

    startNewGame() {
        this.deck = this.createDeck();
        this.jokerCard = this.deck.pop();
        this.discardPile = [this.deck.pop()];

        this.playerCards = [];
        this.botCards = [];
        for (let i = 0; i < 13; i++) {
            this.playerCards.push(this.deck.pop());
            this.botCards.push(this.deck.pop());
        }

        this.sortPlayerCards();
        this.hasPicked = false;
        this.selectedCardIndex = null;
        this.isProcessingTurn = false;
        this.state = 'PLAYING';

        this.renderTable();
        this.setStatus("Your Turn: Pick 1 card from Open Deck or Closed Deck.");
        window.soundSystem.cardFlip();
        window.showToast("New Rummy Game Started! Pick a card to begin.", "info");
    }

    sortPlayerCards() {
        const suitOrder = { '♠': 1, '♥': 2, '♣': 3, '♦': 4 };
        this.playerCards.sort((a, b) => {
            if (suitOrder[a.suit] !== suitOrder[b.suit]) {
                return suitOrder[a.suit] - suitOrder[b.suit];
            }
            return a.val.rank - b.val.rank;
        });
    }

    pickFromClosed() {
        if (this.state !== 'PLAYING' || this.isProcessingTurn) return;
        if (this.hasPicked) {
            window.showToast("You already picked a card! Now select a card and click 'Discard'.", "warning");
            return;
        }
        if (this.deck.length === 0) {
            window.showToast("Closed deck empty! Reshuffling discards...", "info");
            this.deck = this.discardPile.splice(0, this.discardPile.length - 1);
        }

        const card = this.deck.pop();
        this.playerCards.push(card);
        this.hasPicked = true;
        window.soundSystem.cardFlip();
        this.renderTable();
        this.setStatus("Card picked! Click a card in your hand and tap 'Discard Selected Card'.");
    }

    pickFromOpen() {
        if (this.state !== 'PLAYING' || this.isProcessingTurn) return;
        if (this.hasPicked) {
            window.showToast("You already picked a card! Now select a card and click 'Discard'.", "warning");
            return;
        }
        if (this.discardPile.length === 0) return;

        const card = this.discardPile.pop();
        this.playerCards.push(card);
        this.hasPicked = true;
        window.soundSystem.cardFlip();
        this.renderTable();
        this.setStatus("Card picked from Open deck! Click a card to discard.");
    }

    selectCard(idx) {
        if (this.state !== 'PLAYING') return;
        this.selectedCardIndex = idx;
        window.soundSystem.click();
        this.renderTable();
    }

    discardCard() {
        if (this.state !== 'PLAYING' || this.isProcessingTurn) return;
        if (!this.hasPicked) {
            window.showToast("Pick a card from Open or Closed Deck first!", "warning");
            return;
        }
        if (this.selectedCardIndex === null || this.selectedCardIndex >= this.playerCards.length) {
            window.showToast("Click a card from your hand first to select it for discard!", "warning");
            return;
        }

        const discarded = this.playerCards.splice(this.selectedCardIndex, 1)[0];
        this.discardPile.push(discarded);
        this.selectedCardIndex = null;
        this.hasPicked = false;
        this.isProcessingTurn = true;
        window.soundSystem.cardFlip();

        this.renderTable();
        this.setStatus("Opponent 'Arjun' is thinking & playing...");

        // Bot plays turn
        setTimeout(() => {
            if (this.state !== 'PLAYING') return;
            this.botPlayTurn();
        }, 1100);
    }

    botPlayTurn() {
        // Bot picks from closed deck
        if (this.deck.length > 0) {
            this.botCards.push(this.deck.pop());
        }
        // Bot discards a random card
        const discIdx = Math.floor(Math.random() * this.botCards.length);
        const botDisc = this.botCards.splice(discIdx, 1)[0];
        this.discardPile.push(botDisc);
        window.soundSystem.cardFlip();

        this.isProcessingTurn = false;
        this.renderTable();
        this.setStatus("Your Turn: Pick 1 card from Open Deck or Closed Deck.");
        window.showToast(`Opponent discarded ${botDisc.val.name}${botDisc.suit}`, "info");
    }

    declareShow() {
        if (this.state !== 'PLAYING') return;

        // If player has 14 cards and selected one, treat that as discard to finish slot
        if (this.playerCards.length === 14) {
            if (this.selectedCardIndex !== null && this.selectedCardIndex < this.playerCards.length) {
                const finishedCard = this.playerCards.splice(this.selectedCardIndex, 1)[0];
                this.discardPile.push(finishedCard);
                this.selectedCardIndex = null;
                this.hasPicked = false;
            } else {
                window.showToast("Select 1 card to discard to Finish slot before declaring!", "warning");
                return;
            }
        }

        if (this.playerCards.length !== 13) {
            window.showToast("You need 13 cards in hand to declare!", "warning");
            return;
        }

        const hasSequences = this.evaluateRummyDeclaration();
        if (hasSequences) {
            const winAmount = 80 * this.pointValue;
            this.state = 'FINISHED';
            window.appState.addWallet(winAmount);
            window.soundSystem.win();
            this.setStatus(`🎉 VALID DECLARATION! You Won ₹${winAmount.toLocaleString()}!`);
            window.showToast(`🎉 Valid Declaration! You Won ₹${winAmount.toLocaleString()}!`, "success");
        } else {
            const penalty = 80 * this.pointValue;
            window.appState.deductWallet(penalty);
            window.soundSystem.lose();
            this.setStatus(`WRONG DECLARATION! 80 Points Penalty (-₹${penalty}).`);
            window.showToast(`Wrong Declaration! Penalty of ₹${penalty} charged.`, "error");
        }
        this.renderTable();
    }

    evaluateRummyDeclaration() {
        const suits = {};
        this.playerCards.forEach(c => {
            if (!suits[c.suit]) suits[c.suit] = [];
            suits[c.suit].push(c.val.rank);
        });

        let foundSeq = false;
        for (let s in suits) {
            let ranks = Array.from(new Set(suits[s])).sort((a, b) => a - b);
            for (let i = 0; i <= ranks.length - 3; i++) {
                if (ranks[i] + 1 === ranks[i+1] && ranks[i+1] + 1 === ranks[i+2]) {
                    foundSeq = true;
                    break;
                }
            }
            // Check Q-K-A (12, 13, 1)
            if (ranks.includes(1) && ranks.includes(12) && ranks.includes(13)) {
                foundSeq = true;
            }
        }
        return foundSeq;
    }

    setStatus(text) {
        const el = document.getElementById('rummy-status-text');
        if (el) el.textContent = text;
    }

    renderCardHTML(card, isSelected = false) {
        const isRed = card.suit === '♥' || card.suit === '♦';
        return `
            <div class="rummy-card ${isRed ? 'card-red' : 'card-black'} ${isSelected ? 'selected-card' : ''}">
                <div class="rc-corner">${card.val.name}<span>${card.suit}</span></div>
                <div class="rc-center">${card.suit}</div>
                <div class="rc-corner bottom">${card.val.name}</div>
            </div>
        `;
    }

    renderTable() {
        // Joker
        const jokerEl = document.getElementById('rummy-joker-card');
        if (jokerEl && this.jokerCard) {
            const isRed = this.jokerCard.suit === '♥' || this.jokerCard.suit === '♦';
            jokerEl.className = `mini-card ${isRed ? 'card-red' : 'card-black'}`;
            jokerEl.innerHTML = `<span>${this.jokerCard.val.name}</span><span>${this.jokerCard.suit}</span>`;
        }

        // Closed deck count
        const closedCount = document.getElementById('rummy-closed-count');
        if (closedCount) closedCount.textContent = `${this.deck.length} cards`;

        // Open card top
        const openEl = document.getElementById('rummy-open-top');
        if (openEl) {
            if (this.discardPile.length > 0) {
                const top = this.discardPile[this.discardPile.length - 1];
                const isRed = top.suit === '♥' || top.suit === '♦';
                openEl.className = `mini-card ${isRed ? 'card-red' : 'card-black'}`;
                openEl.innerHTML = `<span>${top.val.name}</span><span>${top.suit}</span>`;
            } else {
                openEl.className = `mini-card`;
                openEl.innerHTML = `<span>Empty</span>`;
            }
        }

        // Player Cards
        const pCardsContainer = document.getElementById('rummy-player-cards');
        if (pCardsContainer) {
            pCardsContainer.innerHTML = this.playerCards.map((card, idx) => `
                <div class="rummy-card-wrapper" onclick="window.rummyGame.selectCard(${idx})">
                    ${this.renderCardHTML(card, this.selectedCardIndex === idx)}
                </div>
            `).join('');
        }
    }

    destroy() {
        this.isProcessingTurn = false;
    }
}

window.RummyGame = RummyGame;
