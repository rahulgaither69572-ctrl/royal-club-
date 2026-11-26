// 3 Patti (Teen Patti) Game Logic & Hand Evaluator
class TeenPattiGame {
    constructor() {
        this.pot = 0;
        this.boot = 50;
        this.currentBet = 50;
        this.players = [];
        this.turnIndex = 0;
        this.roundState = 'IDLE'; // 'BETTING', 'SHOW'
        this.isProcessingTurn = false;
    }

    setBoot(val) {
        if (this.roundState === 'BETTING') {
            window.showToast("Boot will apply on next round!", "info");
        }
        this.boot = val;
        this.currentBet = val;
    }

    createDeck() {
        const suits = ['♠', '♥', '♣', '♦'];
        const values = [
            { name: '2', rank: 2 }, { name: '3', rank: 3 }, { name: '4', rank: 4 },
            { name: '5', rank: 5 }, { name: '6', rank: 6 }, { name: '7', rank: 7 },
            { name: '8', rank: 8 }, { name: '9', rank: 9 }, { name: '10', rank: 10 },
            { name: 'J', rank: 11 }, { name: 'Q', rank: 12 }, { name: 'K', rank: 13 },
            { name: 'A', rank: 14 }
        ];
        let deck = [];
        suits.forEach(s => values.forEach(v => deck.push({ suit: s, val: v })));
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    evaluateHand(cards) {
        // Sort cards by rank ascending
        let c = [...cards].sort((a, b) => a.val.rank - b.val.rank);
        const r1 = c[0].val.rank, r2 = c[1].val.rank, r3 = c[2].val.rank;
        const s1 = c[0].suit, s2 = c[1].suit, s3 = c[2].suit;

        const isFlush = (s1 === s2 && s2 === s3);
        const isTrio = (r1 === r2 && r2 === r3);
        
        // Sequence check (including A-2-3 special straight which is 2nd highest in Teen Patti)
        let isSeq = false;
        let seqRank = r3;
        if (r1 + 1 === r2 && r2 + 1 === r3) {
            isSeq = true;
            seqRank = r3;
        }
        if (r1 === 2 && r2 === 3 && r3 === 14) {
            isSeq = true;
            seqRank = 13.5; // A-2-3 is 2nd highest straight, right below A-K-Q (14)
        }

        const isPureSeq = isSeq && isFlush;
        const isPair = (r1 === r2 || r2 === r3 || r1 === r3);

        // Score formulation: Category weight * 1000000 + ranks
        if (isTrio) return { type: 'Trail (Trio)', score: 6000000 + r3 * 1000 };
        if (isPureSeq) return { type: 'Pure Sequence', score: 5000000 + seqRank * 1000 };
        if (isSeq) return { type: 'Sequence', score: 4000000 + seqRank * 1000 };
        if (isFlush) return { type: 'Color (Flush)', score: 3000000 + r3 * 1000 + r2 * 50 + r1 };
        if (isPair) {
            let pairRank = (r1 === r2) ? r1 : ((r2 === r3) ? r2 : r1);
            let kicker = (r1 === r2) ? r3 : ((r2 === r3) ? r1 : r2);
            return { type: 'Pair', score: 2000000 + pairRank * 1000 + kicker };
        }
        return { type: 'High Card', score: 1000000 + r3 * 1000 + r2 * 50 + r1 };
    }

    init() {
        this.startNewTable();
    }

    startNewTable() {
        if (window.appState.wallet < this.boot) {
            window.showToast("Insufficient Balance for Boot! Recharge chips.", "error");
            return;
        }

        const deck = this.createDeck();
        this.pot = this.boot * 3;
        window.appState.deductWallet(this.boot);

        this.players = [
            { id: 0, name: 'You', isBot: false, cards: [deck.pop(), deck.pop(), deck.pop()], seen: false, packed: false },
            { id: 1, name: 'Rohan', isBot: true, cards: [deck.pop(), deck.pop(), deck.pop()], seen: false, packed: false },
            { id: 2, name: 'Vikram', isBot: true, cards: [deck.pop(), deck.pop(), deck.pop()], seen: false, packed: false }
        ];

        this.currentBet = this.boot;
        this.roundState = 'BETTING';
        this.turnIndex = 0; // Player starts
        this.isProcessingTurn = false;

        window.soundSystem.cardFlip();
        this.renderTable();
        this.updateButtons();
        window.showToast(`New Teen Patti Round Started! Boot ₹${this.boot}`, "info");
    }

    seeCards() {
        const player = this.players[0];
        if (!player || player.seen) return;
        player.seen = true;
        window.soundSystem.cardFlip();
        this.renderTable();
        this.updateButtons();
        const hand = this.evaluateHand(player.cards);
        window.showToast(`Your hand: ${hand.type}`, 'info');
    }

    chaal() {
        if (this.isProcessingTurn || this.roundState !== 'BETTING') return;
        const player = this.players[0];
        if (!player || player.packed) return;

        const cost = player.seen ? this.currentBet * 2 : this.currentBet;
        if (window.appState.wallet < cost) {
            window.showToast("Insufficient Balance for Chaal!", "error");
            return;
        }

        this.isProcessingTurn = true;
        window.appState.deductWallet(cost);
        this.pot += cost;
        window.soundSystem.chip();
        this.renderTable();
        this.updateButtons();

        this.nextTurn();
    }

    pack() {
        if (this.isProcessingTurn || this.roundState !== 'BETTING') return;
        const player = this.players[0];
        if (!player || player.packed) return;

        player.packed = true;
        window.soundSystem.lose();
        window.showToast("You packed (folded)!", "warning");
        this.renderTable();
        
        if (!this.checkOnlyOneLeft()) {
            this.isProcessingTurn = true;
            this.nextTurn();
        }
    }

    showdown() {
        if (this.isProcessingTurn || this.roundState !== 'BETTING') return;
        this.roundState = 'SHOW';
        this.isProcessingTurn = false;
        window.soundSystem.cardFlip();

        // Reveal bot cards
        this.players.forEach(p => p.seen = true);
        this.renderTable();

        const activePlayers = this.players.filter(p => !p.packed);
        let bestScore = -1;
        let winner = null;

        activePlayers.forEach(p => {
            const res = this.evaluateHand(p.cards);
            p.handResult = res;
            if (res.score > bestScore) {
                bestScore = res.score;
                winner = p;
            }
        });

        if (winner && winner.id === 0) {
            window.appState.addWallet(this.pot);
            window.soundSystem.win();
            window.showToast(`🎉 You Won the Pot of ₹${this.pot.toLocaleString()} with ${winner.handResult.type}!`, 'success');
        } else if (winner) {
            window.soundSystem.lose();
            window.showToast(`${winner.name} Won with ${winner.handResult.type}!`, 'info');
        }

        this.updateButtons();
    }

    checkOnlyOneLeft() {
        const active = this.players.filter(p => !p.packed);
        if (active.length === 1) {
            const winner = active[0];
            if (winner.id === 0) {
                window.appState.addWallet(this.pot);
                window.soundSystem.win();
                window.showToast(`🎉 All opponents packed! You won ₹${this.pot.toLocaleString()}!`, 'success');
            } else {
                window.soundSystem.lose();
                window.showToast(`${winner.name} won as everyone else packed.`, 'info');
            }
            this.roundState = 'SHOW';
            this.isProcessingTurn = false;
            this.updateButtons();
            return true;
        }
        return false;
    }

    nextTurn() {
        if (this.checkOnlyOneLeft()) return;

        // Bot 1 Turn
        setTimeout(() => {
            if (this.roundState !== 'BETTING') return;
            this.botTurn(1);
            if (this.checkOnlyOneLeft()) return;

            // Bot 2 Turn
            setTimeout(() => {
                if (this.roundState !== 'BETTING') return;
                this.botTurn(2);
                this.checkOnlyOneLeft();
                this.isProcessingTurn = false;
                this.updateButtons();
            }, 800);
        }, 800);
    }

    botTurn(botIndex) {
        const bot = this.players[botIndex];
        if (!bot || bot.packed) return;

        bot.seen = true;
        const evalHand = this.evaluateHand(bot.cards);

        // If High Card with low rank, bot might fold
        if (evalHand.type === 'High Card' && evalHand.score < 1010000 && Math.random() > 0.4) {
            bot.packed = true;
            window.showToast(`${bot.name} packed.`, 'info');
        } else {
            // Chaal
            const cost = this.currentBet * 2;
            this.pot += cost;
            window.soundSystem.chip();
            window.showToast(`${bot.name} placed Chaal ₹${cost}.`, 'info');
        }
        this.renderTable();
    }

    renderCardHTML(card, isRevealed) {
        if (!isRevealed) {
            return `<div class="tp-card-view card-back"><div class="card-pattern">♠</div></div>`;
        }
        const isRed = card.suit === '♥' || card.suit === '♦';
        return `
            <div class="tp-card-view card-front ${isRed ? 'card-red' : 'card-black'} card-flipped">
                <div class="card-corner top-left"><span>${card.val.name}</span><span>${card.suit}</span></div>
                <div class="card-center">${card.suit}</div>
                <div class="card-corner bottom-right"><span>${card.val.name}</span><span>${card.suit}</span></div>
            </div>
        `;
    }

    renderTable() {
        const potEl = document.getElementById('tp-pot-amount');
        if (potEl) potEl.textContent = '₹' + this.pot.toLocaleString();

        // Render Bot 1
        const b1 = this.players[1];
        const b1Cards = document.getElementById('tp-bot1-cards');
        const b1Status = document.getElementById('tp-bot1-status');
        if (b1Cards && b1) {
            b1Cards.innerHTML = b1.cards.map(c => this.renderCardHTML(c, this.roundState === 'SHOW')).join('');
        }
        if (b1Status && b1) {
            b1Status.textContent = b1.packed ? 'PACKED' : (b1.seen ? 'SEEN' : 'BLIND');
            b1Status.className = b1.packed ? 'player-tag packed' : 'player-tag';
        }

        // Render Bot 2
        const b2 = this.players[2];
        const b2Cards = document.getElementById('tp-bot2-cards');
        const b2Status = document.getElementById('tp-bot2-status');
        if (b2Cards && b2) {
            b2Cards.innerHTML = b2.cards.map(c => this.renderCardHTML(c, this.roundState === 'SHOW')).join('');
        }
        if (b2Status && b2) {
            b2Status.textContent = b2.packed ? 'PACKED' : (b2.seen ? 'SEEN' : 'BLIND');
            b2Status.className = b2.packed ? 'player-tag packed' : 'player-tag';
        }

        // Render Player (User)
        const p = this.players[0];
        const pCards = document.getElementById('tp-player-cards');
        const pStatus = document.getElementById('tp-player-status');
        if (pCards && p) {
            pCards.innerHTML = p.cards.map(c => this.renderCardHTML(c, p.seen)).join('');
        }
        if (pStatus && p) {
            pStatus.textContent = p.packed ? 'PACKED' : (p.seen ? 'SEEN' : 'BLIND');
            pStatus.className = p.packed ? 'player-tag packed' : 'player-tag';
        }
    }

    updateButtons() {
        const seeBtn = document.getElementById('tp-see-btn');
        const chaalBtn = document.getElementById('tp-chaal-btn');
        const packBtn = document.getElementById('tp-pack-btn');
        const showBtn = document.getElementById('tp-show-btn');
        const restartBtn = document.getElementById('tp-restart-btn');

        const p = this.players[0];
        const activeCount = this.players.filter(pl => !pl.packed).length;

        if (this.roundState === 'SHOW') {
            if (seeBtn) seeBtn.style.display = 'none';
            if (chaalBtn) chaalBtn.style.display = 'none';
            if (packBtn) packBtn.style.display = 'none';
            if (showBtn) showBtn.style.display = 'none';
            if (restartBtn) restartBtn.style.display = 'inline-block';
            return;
        }

        if (restartBtn) restartBtn.style.display = 'none';

        if (this.isProcessingTurn) {
            if (chaalBtn) { chaalBtn.disabled = true; chaalBtn.style.opacity = '0.5'; }
            if (packBtn) { packBtn.disabled = true; packBtn.style.opacity = '0.5'; }
            if (showBtn) { showBtn.disabled = true; showBtn.style.opacity = '0.5'; }
            return;
        } else {
            if (chaalBtn) { chaalBtn.disabled = false; chaalBtn.style.opacity = '1'; }
            if (packBtn) { packBtn.disabled = false; packBtn.style.opacity = '1'; }
            if (showBtn) { showBtn.disabled = false; showBtn.style.opacity = '1'; }
        }

        if (seeBtn) {
            seeBtn.style.display = p && !p.seen && !p.packed ? 'inline-block' : 'none';
        }
        if (chaalBtn) {
            chaalBtn.style.display = p && !p.packed ? 'inline-block' : 'none';
            const cost = p && p.seen ? this.currentBet * 2 : this.currentBet;
            chaalBtn.textContent = `Chaal (₹${cost})`;
        }
        if (packBtn) {
            packBtn.style.display = p && !p.packed ? 'inline-block' : 'none';
        }
        if (showBtn) {
            showBtn.style.display = (p && !p.packed && activeCount === 2) ? 'inline-block' : 'none';
        }
    }

    destroy() {
        this.isProcessingTurn = false;
    }
}

window.TeenPattiGame = TeenPattiGame;
