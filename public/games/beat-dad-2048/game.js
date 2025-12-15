// Firebase direct init to avoid module path issues
const firebaseConfig = {
    apiKey: "AIzaSyANrUXwBGvmbDeVF2eqTeCb8oXPNaBIIAk",
    authDomain: "familly-fun-service.firebaseapp.com",
    projectId: "familly-fun-service",
    storageBucket: "familly-fun-service.firebasestorage.app",
    messagingSenderId: "257202552832",
    appId: "1:257202552832:web:add8b7eb7672889dbdd8e5"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

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

        this.init(); // note: this is async
    }

    async init() {
        this.score = 0;
        this.grid = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(null));
        this.isGameOver = false;
        if (this.tileContainer) this.tileContainer.innerHTML = '';
        this.updateScore(0);

        // Spawn first, then load data background
        this.spawnTile();
        this.spawnTile();
        this.draw();
        this.setupInput();

        // Load data in background (non-blocking)
        this.loadData();
    }

    async loadData() {
        // Fetch Dad's score (Weekly Highest of 'Admin' or fixed logic? Using highest play score for now or mock)
        // For consistency with Stack Tower, we might want a 'Dad' user or just the highest score of the week.
        // User guide says "Dad Best Score". Let's assume we fetch the Global Max Score of the week, or a specific "Dad" score if stored.
        // Simplified: Fetch Weekly Top 1. If it's Dad, that's Dad. If not, maybe use a fixed baseline if DB empty.

        // In Stack Tower, Dad was often just the top score or specific AI logic. 
        // Here we'll treat the Weekly Best as "Dad's Record" to beat.

        const db = firebase.firestore();
        const collection = db.collection('game_2048_records'); // Corrected collection name

        // Revert to simple Dad AI Score
        this.dadScore = 2048; // Fixed target or random could be implemented

        // Mock loading delay if needed, or just set immediately
        if (document.getElementById('dad-score-display'))
            document.getElementById('dad-score-display').innerText = this.dadScore + "점";
        document.getElementById('start-dad-score').innerText = this.dadScore + "점";

        this.updateDadFace();

        // Fetch Personal Best only
        try {
            // Logic for personal best can remain or be simplified
        } catch (e) { }

        if (document.getElementById('dad-score-display'))
            document.getElementById('dad-score-display').innerText = this.dadScore + "점";
        document.getElementById('start-dad-score').innerText = this.dadScore + "점";

        // Update Dad Face based on new Dad Score
        this.updateDadFace();

        // 2. Personal Best
        // Fetch my best

        getWeekId() {
            const d = new Date();
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(d.setDate(diff));

            const year = monday.getFullYear();
            const month = String(monday.getMonth() + 1).padStart(2, '0');
            const date = String(monday.getDate()).padStart(2, '0');

            return `${year}-${month}-${date}`;
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
            let state = JSON.parse(JSON.stringify(this.grid)); // Deep copy state for comparison

            // Transformation: Orient grid so we always Slide Left
            // Use slice() to prevent in-place mutation of original grid rows
            if (dir === 'right') {
                this.grid = this.grid.map(row => row.slice().reverse());
            } else if (dir === 'up') {
                this.grid = this.transpose(this.grid);
            } else if (dir === 'down') {
                this.grid = this.transpose(this.grid);
                this.grid = this.grid.map(row => row.slice().reverse());
            }

            // Process LEFT (Standard Merge)
            let scoreAdd = 0;

            this.grid = this.grid.map(row => {
                let nonNull = row.filter(c => c !== null);
                let newRow = [];

                for (let i = 0; i < nonNull.length; i++) {
                    if (i < nonNull.length - 1 && nonNull[i].value === nonNull[i + 1].value) {
                        // Merge
                        let val = nonNull[i].value * 2;
                        scoreAdd += val;
                        // Create new merged tile object
                        newRow.push({
                            value: val,
                            id: nonNull[i].id, // Keep ID? Or new? 
                            merged: true,
                            isNew: false
                        });
                        i++; // Skip next
                    } else {
                        newRow.push({
                            ...nonNull[i],
                            isNew: false,
                            merged: false
                        });
                    }
                }
                // Pad
                while (newRow.length < 4) newRow.push(null);
                return newRow;
            });

            // Restore Orientation
            if (dir === 'right') {
                this.grid = this.grid.map(row => row.slice().reverse());
            } else if (dir === 'up') {
                this.grid = this.transpose(this.grid);
            } else if (dir === 'down') {
                this.grid = this.grid.map(row => row.slice().reverse());
                this.grid = this.transpose(this.grid);
            }

            // Check Change
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

            // CSS Grid Layout Logic:
            // Container: 10px Gap, 10px Padding.
            // CellPos(i) = 10px + i * (CellSize + 10px)
            // Check calculation: CellSize% approx (100% - 20 - 30)/4 = ~21%
            // Formula: 10px + i * (25% - 2.5px) matches perfectly.

            for (let r = 0; r < 4; r++) {
                for (let c = 0; c < 4; c++) {
                    let tile = this.grid[r][c];
                    if (tile) {
                        const el = document.createElement('div');
                        el.className = `tile tile-${tile.value}`;
                        if (tile.isNew) el.classList.add('tile-new');
                        if (tile.merged) el.classList.add('tile-merged');

                        el.innerText = tile.value;

                        // Fixed Alignment Formula
                        el.style.width = 'calc(25% - 12.5px)'; // (320-20-30)/4 = 67.5.  320/4 = 80. 80 - 12.5 = 67.5. Exact.
                        el.style.height = 'calc(25% - 12.5px)';

                        // Positions
                        // 10px + c * (Cell + Gap)
                        // 10px + c * ( (25% - 12.5px) + 10px )
                        // 10px + c * (25% - 2.5px)
                        el.style.left = `calc(10px + ${c} * (25% - 2.5px))`;
                        el.style.top = `calc(10px + ${r} * (25% - 2.5px))`;

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
                msg.innerText = "🏆 아빠 AI를 이겼다!";
                msg.className = "msg-box win";
            } else {
                msg.innerText = "🤪 아빠 AI의 승리!";
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

            // Query for 'All' (limit 100 safe for performance)
            // Index fix: Query by week only, sort in memory
            const q = db.collection('game_2048_records')
                .where('weekId', '==', weekId);

            const snap = await q.get();
            ul.innerHTML = '';
            if (snap.empty) {
                ul.innerHTML = '<li class="empty-rank">기록 없음</li>';
                return;
            }

            let docs = [];
            snap.forEach(doc => docs.push(doc.data()));
            docs.sort((a, b) => b.score - a.score);

            let rank = 1;
            docs.forEach(data => {
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

    // Fix Exit Button
    const exitBtn = document.getElementById('btn-exit');
    if (exitBtn) {
        exitBtn.onclick = () => {
            location.href = '../../dashboard.html';
        };
    }


    // Load Start Screen Ranking Preview
    loadStartRanking();
});

// Helper for Week ID (Monday based)
function getWeekId() {
    const d = new Date();
    // Adjust to Monday
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(d.setDate(diff));

    // Format YYYY-MM-DD
    const year = monday.getFullYear();
    const month = String(monday.getMonth() + 1).padStart(2, '0');
    const date = String(monday.getDate()).padStart(2, '0');

    return `${year}-${month}-${date}`;
}

async function loadStartRanking() {
    const ul = document.getElementById('start-ranking-list');
    const weekTitle = document.getElementById('week-title');

    // 1. Set Week Title (Month + Week of Month)
    const d = new Date();
    const month = d.getMonth() + 1;
    const weekOfMonth = Math.ceil(d.getDate() / 7);
    weekTitle.innerText = `📅 ${month}월 ${weekOfMonth}주 주간랭킹`;

    if (!ul) return;
    ul.innerHTML = '<li style="color:#94a3b8; text-align:center;">로딩중...</li>';

    try {
        const db = firebase.firestore();
        const weekId = getWeekId();

        // Query by weekId
        const q = db.collection('game_2048_records').where('weekId', '==', weekId);
        const snap = await q.get();

        // Extract Data
        let records = [];
        snap.forEach(doc => records.push(doc.data()));

        // Target Users (Family)
        const targets = ['kukky', 'soony', 'joowon', 'raim'];

        // Map Targets to Best Score
        const displayData = targets.map(target => {
            const userRecs = records.filter(r => {
                const name = r.email ? r.email.split('@')[0] : '';
                return name.toLowerCase().includes(target.toLowerCase());
            });

            const best = userRecs.length > 0 ? Math.max(...userRecs.map(r => r.score)) : 0;
            return { name: target, score: best };
        });

        // Sort by Score Desc
        displayData.sort((a, b) => b.score - a.score);

        // Render
        ul.innerHTML = '';

        displayData.forEach((item, index) => {
            const li = document.createElement('li');
            li.style.cssText = "display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px solid #f1f5f9; color:#334155; font-size:0.95rem;";

            let crown = '';
            // Crown for 1st place only (if score > 0)
            if (index === 0 && item.score > 0) crown = '👑 ';

            const scoreColor = item.score > 0 ? '#2563eb' : '#cbd5e1';

            // Name Display: Lowercase
            const dispName = item.name.toLowerCase();

            li.innerHTML = `<span>${crown}${dispName}</span> <span style="font-weight:bold; color:${scoreColor}">${item.score}점</span>`;
            ul.appendChild(li);
        });

    } catch (e) {
        console.error("Rank Load Error", e);
        ul.innerHTML = '<li style="color:red;">랭킹 로드 실패</li>';
    }
}
