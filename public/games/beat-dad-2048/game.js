
import { auth } from '../../src/firebase.js?v=202512121515';

// --- Game Logic ---
class Game2048 {
    constructor() {
        this.boardSize = 4;
        this.grid = [];
        this.score = 0;
        this.isGameOver = false;

        // Dad logic
        this.dadScore = 0; // Will fetch from DB
        this.myBest = 0;

        // Elements
        this.tileContainer = document.getElementById('tile-container');
        this.scoreDisplay = document.getElementById('my-score-display');
        this.dadReaction = document.getElementById('dad-reaction');

        // Input
        this.touchStartX = 0;
        this.touchStartY = 0;

        this.init();
    }

    async init() {
        this.score = 0;
        this.grid = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(null));
        this.isGameOver = false;
        this.tileContainer.innerHTML = '';
        this.updateScore(0);

        await this.loadData();

        this.spawnTile();
        this.spawnTile();
        this.draw();

        this.setupInput();
        this.updateDadFace();
    }

    async loadData() {
        // Fetch Dad's score (Weekly Highest of 'Admin' or fixed logic? Using highest play score for now or mock)
        // For consistency with Stack Tower, we might want a 'Dad' user or just the highest score of the week.
        // User guide says "Dad Best Score". Let's assume we fetch the Global Max Score of the week, or a specific "Dad" score if stored.
        // Simplified: Fetch Weekly Top 1. If it's Dad, that's Dad. If not, maybe use a fixed baseline if DB empty.

        // In Stack Tower, Dad was often just the top score or specific AI logic. 
        // Here we'll treat the Weekly Best as "Dad's Record" to beat.

        const db = firebase.firestore();
        const collection = db.collection('game_2048_scores'); // New collection

        // 1. Get Weekly Best (Dad)
        // Logic: Get max score of current week.
        const weekId = this.getWeekId();

        // Mock Dad Score for initial gameplay if no DB data
        this.dadScore = 2048; // Baseline goal

        try {
            const q = collection.where('weekId', '==', weekId).orderBy('score', 'desc').limit(1);
            const snapshot = await q.get();
            if (!snapshot.empty) {
                const top = snapshot.docs[0].data();
                if (top.score > this.dadScore) this.dadScore = top.score;
            }
        } catch (e) { console.error("Data load err", e); }

        document.getElementById('dad-score-display').innerText = this.dadScore + "점";
        document.getElementById('start-dad-score').innerText = this.dadScore + "점";

        // 2. Personal Best
        // Fetch my best
    }

    getWeekId() {
        const d = new Date();
        const year = d.getFullYear();
        const onejan = new Date(d.getFullYear(), 0, 1);
        const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
        return `${year}-W${week}`;
    }

    setupInput() {
        window.addEventListener('keydown', this.handleKey.bind(this));

        const gameArea = document.getElementById('game-container');
        gameArea.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
            e.preventDefault(); // Prevent scroll
        }, { passive: false });

        gameArea.addEventListener('touchend', (e) => {
            if (this.isGameOver) return;
            const dx = e.changedTouches[0].clientX - this.touchStartX;
            const dy = e.changedTouches[0].clientY - this.touchStartY;
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);

            if (Math.max(absDx, absDy) > 30) { // Threshold
                if (absDx > absDy) {
                    if (dx > 0) this.move('right');
                    else this.move('left');
                } else {
                    if (dy > 0) this.move('down');
                    else this.move('up');
                }
            }
        });
    }

    handleKey(e) {
        if (this.isGameOver) return;
        switch (e.key) {
            case 'ArrowUp': this.move('up'); break;
            case 'ArrowDown': this.move('down'); break;
            case 'ArrowLeft': this.move('left'); break;
            case 'ArrowRight': this.move('right'); break;
            default: return; // Allow other keys
        }
        e.preventDefault();
    }

    spawnTile() {
        const emptyCells = [];
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (!this.grid[r][c]) emptyCells.push({ r, c });
            }
        }
        if (emptyCells.length === 0) return;

        const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        // 90% chance 2, 10% chance 4
        const val = Math.random() < 0.9 ? 2 : 4;

        // Difficulty increase: if score > 5000, 4 appears 15%
        // Not implemented simpler logic for now.

        this.grid[r][c] = {
            value: val,
            id: Date.now() + Math.random(), // Unique ID for DOM mapping (animation)
            isNew: true
        };
    }

    move(dir) {
        /* 
           Move Logic:
           1. Rotate grid so we always process 'Slide Left' logic, then rotate back?
           Or write specific loops. Rotating is cleaner code-wise.
        */

        let rotated = this.grid;
        if (dir === 'right') rotated = this.rotate(rotated, 2); // Rotate 180? No right needs mirror or unique logic.
        // Let's use vectors.

        let vector = { r: 0, c: 0 };
        if (dir === 'up') vector = { r: -1, c: 0 };
        if (dir === 'down') vector = { r: 1, c: 0 };
        if (dir === 'left') vector = { r: 0, c: -1 };
        if (dir === 'right') vector = { r: 0, c: 1 };

        let moved = false;
        let scoreAdd = 0;

        // Basic 2048 logic without rotation for performance/simplicity in JS
        // We traverse in the direction ensuring we process merge correctly.

        // Simplification: Extract rows/cols, process list, put back.

        const processList = (list) => {
            // list ex: [2, null, 2, 4] -> [4, 4, null, null]
            // 1. remove nulls
            let filtered = list.filter(t => t !== null);
            let merged = [];
            let skipSignal = false; // To prevent double merge 2+2=4+4=8 in one move

            while (filtered.length > 0) {
                let head = filtered.shift();
                if (filtered.length > 0 && filtered[0].value === head.value && !head.mergedFrom) {
                    // Merge
                    let next = filtered.shift();
                    let newVal = head.value * 2;
                    scoreAdd += newVal;
                    merged.push({ value: newVal, id: head.id, mergedFrom: [head, next], isNew: false });
                    // ID logic tricky for animation. usually keep one ID.
                } else {
                    merged.push(head);
                }
            }
            // Pad with nulls
            while (merged.length < 4) merged.push(null);
            return merged;
        };

        // This requires careful mapping of current grid to lists.
        // Because of the complexity of 2048 logic from scratch, I'll use a established approach:
        // Traverse 'traversals' vector.

        // ... Actually, simple rotation approach is best for 'process left' reusability.
        // Right = Reverse rows, Process Left, Reverse back.
        // Up = Transpose, Process Left, Transpose back.
        // Down = Transpose, Reverse rows, Process Left, Reverse rows, Transpose back.

        let state = JSON.parse(JSON.stringify(this.grid)); // Deep copy to check change

        if (dir === 'right') this.grid = this.grid.map(row => row.reverse());
        else if (dir === 'up') this.grid = this.transpose(this.grid);
        else if (dir === 'down') { this.grid = this.transpose(this.grid); this.grid = this.grid.map(row => row.reverse()); }

        // Process LEFT for all rows
        this.grid = this.grid.map(row => {
            // 1. Filter nulls
            let nonNull = row.filter(c => c !== null);
            let newRow = [];
            for (let i = 0; i < nonNull.length; i++) {
                if (i < nonNull.length - 1 && nonNull[i].value === nonNull[i + 1].value) {
                    // Merge
                    let val = nonNull[i].value * 2;
                    scoreAdd += val;
                    newRow.push({ value: val, id: nonNull[i].id, merged: true }); // New ID?
                    i++; // Skip next
                } else {
                    newRow.push(nonNull[i]);
                }
                if (nonNull[i]) nonNull[i].isNew = false; // logic reset
            }
            while (newRow.length < 4) newRow.push(null);
            return newRow;
        });

        // Restore
        if (dir === 'right') this.grid = this.grid.map(row => row.reverse());
        else if (dir === 'up') this.grid = this.transpose(this.grid);
        else if (dir === 'down') { this.grid = this.grid.map(row => row.reverse()); this.grid = this.transpose(this.grid); } // Inverse order

        // Check if changed
        // Simple JSON stringify comparison works for small grid
        let changed = JSON.stringify(state) !== JSON.stringify(this.grid);

        if (changed) {
            if (scoreAdd > 0) this.updateScore(this.score + scoreAdd);
            this.spawnTile();
            this.draw();

            if (!this.canMove()) {
                this.gameOver();
            }
        }
    }

    transpose(matrix) {
        return matrix[0].map((col, i) => matrix.map(row => row[i]));
    }

    canMove() {
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (this.grid[r][c] === null) return true;
                if (c < 3 && this.grid[r][c + 1] && this.grid[r][c].value === this.grid[r][c + 1].value) return true;
                if (r < 3 && this.grid[r + 1][c] && this.grid[r][c].value === this.grid[r + 1][c].value) return true;
            }
        }
        return false;
    }

    draw() {
        this.tileContainer.innerHTML = '';
        const cellWidth = this.tileContainer.clientWidth / 4; // Approx calc valid if responsive
        // Better: rely on CSS classes .tile-pos-r-c

        // Due to CSS variable/calc complexity, let's just use inline style with %
        // 4x4 Grid, Gap 10px. 
        // We know structure.

        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                let tile = this.grid[r][c];
                if (tile) {
                    const el = document.createElement('div');
                    el.className = `tile tile-${tile.value}`;
                    if (tile.isNew) el.classList.add('tile-new');
                    if (tile.merged) el.classList.add('tile-merged');

                    el.innerText = tile.value;

                    // Position
                    // 10px padding + (r * (width + gap))
                    // Let's use CSS grid-area? No, simple absolute.
                    // gap=10px, padding=10px.
                    // Size is tricky if dynamic. 
                    // Let's use simple Grid coordinates via CSS classes?
                    // Or calc(10px + c * (25% - 2.5px) ?)

                    // Actually, let's use the .grid-container layout.
                    // Easier: 
                    const gap = 10;
                    const padding = 10;
                    // We need to know container size? No, keep it % based.
                    // 4 cells (X) + 5 gaps (10px*5 = 50px).
                    // If sticky to px, UI breaks on resize.

                    // Use CSS transform translate.
                    // X = c * 100% + c * gap?
                    // Pct approach: 
                    // width: calc(25% - 12.5px) (from CSS)
                    // left: calc(10px + c * (width + 10px)) ?

                    // Just use exact style from CSS approach.
                    // left: calc(10px + c * (67.5px + 10px)) for 320px. 
                    // Responsive is hard with absolute.

                    // Alternative: use transform with %?
                    // left = 25% * c + padding adjustment?

                    // Let's rely on standard 2048 CSS logic.
                    // tile-position-1-1 { top: 10px; left: 10px; }
                    // tile-position-1-2 { top: 10px; left: 87px; } (10+67.5+10)

                    // I will just inject style directly for simplicity, assuming 320px board or relative %
                    // width: 21.25% (approx (100-50px)/4 ?)

                    // Let's use standard % logic.
                    // gap 10px is fixed. 320px width.
                    // (320 - 50) / 4 = 67.5px.
                    // 67.5 / 320 = 21.09%
                    // gap = 3.125%

                    // To be safe and responsive:
                    // I'll calculate standard positions based on index (0-3).
                    // This assumes css 'grid-cell' matches.

                    // We'll just define classes in JS here for positions.
                    const step = 25; // %
                    el.style.left = `calc(${c * 25}% + 5px)`; // Approximation?
                    el.style.top = `calc(${r * 25}% + 5px)`;

                    // Wait, grid-container has padding 10px.
                    // gap 10px.
                    // Just trust me:
                    // We will set class `tile-pos-${r}-${c}` and add styles to CSS?
                    // No, too lengthy.

                    // Let's use inline style that matches the grid layout.
                    // We need to know the tile size.
                    // Let's assume the CSS handles `.tile` sizes perfectly.
                    // We just set transform.

                    // Actually, simple way:
                    // left: (c * (100% + 10px) / 4)? No.

                    // Let's try this:
                    // tile size is roughly 22%. gap 3%.
                    // left: 2.5% + c * 24.5% ?

                    // Let's GO WITH PIXELS for MVP stability (since container is max 320/280).
                    // If container is 320px:
                    // Pos 0: 10px
                    // Pos 1: 10 + 67.5 + 10 = 87.5px
                    // Pos 2: 87.5 + 77.5 = 165px

                    // To support responsive, I'll read clientWidth of container ONCE or on resize.
                    // But for now, let's use % formula.
                    // 4 cols. Gap is small.
                    // left = (100% / 4) * c + adjustment

                    el.style.width = 'calc(25% - 13px)';
                    el.style.height = 'calc(25% - 13px)';
                    el.style.left = `calc(${c * 25}% + 10px)`;
                    el.style.top = `calc(${r * 25}% + 10px)`;
                    // 10px is padding + partial gap logic. Visual check needed.
                    // Actually, 2048 CSS usually uses classes.

                    this.tileContainer.appendChild(el);
                }
            }
        }
    }

    updateScore(newScore) {
        this.score = newScore;
        this.scoreDisplay.innerText = this.score + "점";
        this.updateDadFace();
    }

    updateDadFace() {
        const face = document.getElementById('dad-face');
        const bubble = this.dadReaction;

        let mood = '😎';
        let msg = '';

        if (this.score < this.dadScore * 0.5) {
            mood = '😎'; // Confident
            msg = '아직 멀었구나~';
        } else if (this.score < this.dadScore) {
            mood = '😰'; // Nervous
            msg = '어? 좀 하는데?';
        } else {
            mood = '😱'; // Shocked
            msg = '말도 안돼!!!';
        }

        face.innerText = mood;

        // Show bubble only on change? No, simple logic.
        // bubble.innerText = msg;
        // bubble.classList.remove('hidden');
    }

    async gameOver() {
        this.isGameOver = true;

        // Save Score
        await this.saveRecord();

        // Show Result
        document.getElementById('final-score').innerText = this.score + "점";
        document.getElementById('final-dad-score').innerText = this.dadScore + "점";

        const msg = document.getElementById('win-lose-msg');
        if (this.score > this.dadScore) {
            msg.innerText = "🏆 아빠를 이겼다!";
            msg.className = "msg-box win";
        } else {
            msg.innerText = "🤪 아빠의 승리!";
            msg.className = "msg-box lose";
        }

        document.getElementById('result-screen').classList.remove('hidden');
        this.loadRanking();
    }

    async saveRecord() {
        const user = firebase.auth().currentUser;
        if (!user) return; // Guest?

        const db = firebase.firestore();
        const scoreRef = db.collection('game_2048_records');

        const weekId = this.getWeekId();

        // Add Record
        await scoreRef.add({
            uid: user.uid,
            email: user.email,
            score: this.score,
            weekId: weekId,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Update Personal Best? optional
    }

    async loadRanking() {
        const ul = document.getElementById('ranking-list');
        ul.innerHTML = '<li>로딩중...</li>';

        const db = firebase.firestore();
        const weekId = this.getWeekId();

        // Simple Top 5 Query
        const q = db.collection('game_2048_records')
            .where('weekId', '==', weekId)
            .orderBy('score', 'desc')
            .limit(5);

        const snap = await q.get();
        ul.innerHTML = '';
        if (snap.empty) {
            ul.innerHTML = '<li class="empty-rank">기록 없음</li>';
            return;
        }

        let rank = 1;
        snap.forEach(doc => {
            const data = doc.data();
            const li = document.createElement('li');
            li.innerHTML = `<span class="rank-num">${rank}</span> <span>${data.email ? data.email.split('@')[0] : '익명'}</span> <span>${data.score}점</span>`;
            ul.appendChild(li);
            rank++;
        });
    }
}

// Start
document.addEventListener('DOMContentLoaded', () => {
    // Buttons
    document.getElementById('btn-start').onclick = () => {
        document.getElementById('start-screen').classList.add('hidden');
        window.game = new Game2048();
    };

    document.getElementById('btn-restart').onclick = () => {
        document.getElementById('result-screen').classList.add('hidden');
        window.game.init();
    };

    // Load Start Screen Ranking Preview
    loadStartRanking();
});

async function loadStartRanking() {
    // ... similar to loadRanking but for start screen
}
