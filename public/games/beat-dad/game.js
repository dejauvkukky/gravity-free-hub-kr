/**
 * 아빠를 이겨라 (Beat Dad) - Stack Tower Game
 */

// Firebase Configuration (Directly in file to avoid import issues)
const firebaseConfig = {
    apiKey: "AIzaSyANrUXwBGvmbDeVF2eqTeCb8oXPNaBIIAk",
    authDomain: "familly-fun-service.firebaseapp.com",
    projectId: "familly-fun-service",
    storageBucket: "familly-fun-service.firebasestorage.app",
    messagingSenderId: "257202552832",
    appId: "1:257202552832:web:add8b7eb7672889dbdd8e5"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Game Constants & Configuration ---
const CONFIG = {
    baseSpeed: 3, // Base pixel movement per frame
    blockHeight: 30, // Initial block height
    initialWidth: 200, // Initial block width
    colors: [
        '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
        '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef'
    ],
    perfectBonus: 1, // Bonus score for perfect placement
    consecutiveBonus: 3, // Bonus for 3 consecutive perfects
    dadBaseMin: 25,
    dadBaseMax: 30
};

// --- Level System ---
const LEVELS = [
    { maxFloor: 10, speedMult: 1.0, widthMult: 1.0 },
    { maxFloor: 20, speedMult: 1.2, widthMult: 0.95 },
    { maxFloor: 30, speedMult: 1.4, widthMult: 0.90 },
    { maxFloor: 40, speedMult: 1.6, widthMult: 0.85 },
    { maxFloor: 50, speedMult: 1.8, widthMult: 0.80 },
    { maxFloor: 9999, speedMult: 2.0, widthMult: 0.75 }
];

// --- State ---
let state = {
    isPlaying: false,
    floors: [], // Array of block objects { x, y, width, height, color }
    currentBlock: null, // The moving block { x, y, width, height, color, direction, speed }
    score: 0, // Current Floor count
    bonusScore: 0, // Extra points from perfects
    perfectStreak: 0,
    cameraY: 0,
    dadScore: 0,
    dadFace: "😎",
    lastTime: 0
};

// --- Dad AI Logic ---
const DadAI = {
    generateScore: () => {
        return Math.floor(Math.random() * (CONFIG.dadBaseMax - CONFIG.dadBaseMin + 1)) + CONFIG.dadBaseMin;
    },
    updateFace: (myScore, dadScore) => {
        const diff = dadScore - myScore;
        const totalScore = myScore + state.bonusScore;

        // Logic based on User Request:
        // P < D - 5 : 😎
        // D - 5 <= P <= D : 😮
        // P > D : 😱
        // P >> D (e.g. +10) : 😭

        const gap = dadScore - totalScore;

        if (gap > 5) return "😎"; // Easy
        if (gap >= 0) return "😮"; // Tension
        if (gap > -10) return "😱"; // Shock
        return "😭"; // Despair
    }
};

// --- Initialization ---
function initGame() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Bind UI
    document.getElementById('btn-start').onclick = startGame;
    document.getElementById('btn-restart').onclick = startGame;

    // Input
    ['mousedown', 'touchstart'].forEach(evt =>
        canvas.addEventListener(evt, handleInput, { passive: false })
    );

    // Start Screen Ranking logic
    loadStartScreenRanking();
}

// Ensure loadStartScreenRanking handles "All 4 users"
async function loadStartScreenRanking() {
    // 1. Calculate Date (M월 W주)
    const now = new Date();
    const month = now.getMonth() + 1;
    // Simple week calculation: ceil(date / 7)
    const week = Math.ceil(now.getDate() / 7);

    document.getElementById('week-title').innerText = `📅 ${month}월 ${week}주 주간랭킹`;

    // 2. Init list with skeleton or empty
    const listEl = document.getElementById('start-ranking-list');
    listEl.innerHTML = '<li style="padding:10px; color:#94a3b8; text-align:center;">불러오는 중...</li>';

    // 3. Fetch from Firestore
    try {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        // Note: Ideally use a compound query with date filter, but for low traffic we fetch recent records.
        // We'll fetch last 100 records ordered by timestamp descending.
        const snapshot = await db.collection('beat_dad_records')
            .orderBy('createdAt', 'desc')
            .limit(100)
            .get();

        const weeklyData = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Client-side date filter (safety)
            if (data.createdAt && data.createdAt.toDate() > oneWeekAgo) {
                weeklyData.push(data);
            }
        });

        // 4. Process for Targets
        const targets = ['kukky', 'soony', 'joowon', 'raim'];
        const displayData = targets.map(user => {
            const userRecords = weeklyData.filter(r => r.nickname === user);
            const bestScore = userRecords.length > 0 ? Math.max(...userRecords.map(r => r.score)) : 0;
            return {
                nickname: user,
                score: bestScore
            };
        });

        // Sort by Score Descending
        displayData.sort((a, b) => b.score - a.score);

        // Render
        listEl.innerHTML = '';
        displayData.forEach((item) => {
            const li = document.createElement('li');
            li.style.cssText = "display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px solid #f1f5f9; color:#334155; font-size:0.95rem;";

            const isZero = item.score === 0;
            const scoreColor = isZero ? '#cbd5e1' : '#2563eb';
            const scoreText = item.score + '층';

            // Crown for highest score (if > 0)
            // Since displayData is sorted, the first one is the winner if scores are mixed. 
            // But we need to check if there is a score.
            let crown = '';
            // Checking if this item is the MAX score of the group (first item) and score > 0
            if (displayData[0].score > 0 && item.score === displayData[0].score) {
                crown = '👑 ';
            }

            li.innerHTML = `<span>${crown}${item.nickname}</span> <span style="font-weight:bold; color:${scoreColor}">${scoreText}</span>`;
            listEl.appendChild(li);
        });

    } catch (e) {
        console.error("Error loading ranking:", e);
        listEl.innerHTML = '<li style="padding:10px; color:#ef4444; text-align:center;">랭킹 로드 실패</li>';
    }
}


function resizeCanvas() {
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;
    if (!state.isPlaying) render(); // Redraw static if needed
}

function startGame() {
    // Reset State
    state.isPlaying = true;
    state.score = 0;
    state.bonusScore = 0;
    state.perfectStreak = 0;
    state.floors = [];
    state.cameraY = 0;

    // Setup Base Block
    const initialBlock = {
        x: (canvas.width - CONFIG.initialWidth) / 2,
        y: canvas.height - CONFIG.blockHeight, // Bottom
        width: CONFIG.initialWidth,
        height: CONFIG.blockHeight,
        color: CONFIG.colors[0]
    };
    state.floors.push(initialBlock);

    // Setup First Moving Block
    spawnBlock(1);

    // Setup Dad
    state.dadScore = DadAI.generateScore();
    state.dadFace = "😎";

    // UI Update
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('result-screen').classList.add('hidden');
    document.getElementById('dad-score-display').innerText = `${state.dadScore}층`;
    updateHUD();

    // Loop
    state.lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function spawnBlock(levelIndex) {
    const prevBlock = state.floors[state.floors.length - 1];
    const floorNum = state.score + 1; // Next floor

    // Determine Level Params
    const lvlConfig = LEVELS.find(l => floorNum <= l.maxFloor) || LEVELS[LEVELS.length - 1];

    const speed = CONFIG.baseSpeed * lvlConfig.speedMult;

    state.currentBlock = {
        x: -prevBlock.width, // Start off screen
        y: prevBlock.y - CONFIG.blockHeight,
        width: prevBlock.width,
        height: CONFIG.blockHeight,
        color: CONFIG.colors[floorNum % CONFIG.colors.length],
        direction: 1, // 1: right, -1: left
        speed: speed,
        range: canvas.width
    };

    // Randomize start side
    if (Math.random() > 0.5) {
        state.currentBlock.x = canvas.width;
        state.currentBlock.direction = -1;
    }
}

// --- Game Loop ---
function gameLoop(timestamp) {
    if (!state.isPlaying) return;

    const dt = (timestamp - state.lastTime) / 16.67; // Normalize to ~60fps
    state.lastTime = timestamp;

    update(dt);
    render();

    if (state.isPlaying) {
        requestAnimationFrame(gameLoop);
    }
}

function update(dt) {
    if (!state.currentBlock) return;

    // Move Block
    const blk = state.currentBlock;
    blk.x += blk.speed * blk.direction * dt;

    // Bounce Logic
    const limit = 50;
    if (blk.x > canvas.width - limit && blk.direction > 0) {
        blk.direction = -1;
    } else if (blk.x < -blk.width + limit && blk.direction < 0) {
        blk.direction = 1;
    }

    // Camera Follow
    const stackTopY = canvas.height - (state.floors.length * CONFIG.blockHeight);
    const desiredY = canvas.height * 0.6;

    if (stackTopY < desiredY) {
        state.cameraY += (desiredY - stackTopY - state.cameraY) * 0.1; // Smooth lerp
    }
}

function handleInput(e) {
    if (e.type === 'touchstart') e.preventDefault(); // Prevent scroll
    if (!state.isPlaying) return;

    placeBlock();
}

function placeBlock() {
    const curr = state.currentBlock;
    const prev = state.floors[state.floors.length - 1];

    if (!curr || !prev) return;

    // Calculate Overlap
    const diff = curr.x - prev.x;
    const absDiff = Math.abs(diff);

    // Check Perfect
    if (absDiff < 2) {
        // Perfect!
        curr.x = prev.x; // Snap
        state.perfectStreak++;
        state.bonusScore += CONFIG.perfectBonus;
        showCombo();

        if (state.perfectStreak >= 3) {
            state.bonusScore += CONFIG.consecutiveBonus;
        }
    } else {
        // Not Perfect
        state.perfectStreak = 0;
        curr.width -= absDiff;

        if (diff > 0) {
            curr.x = curr.x; // implied
        } else {
            curr.x = prev.x; // Snap left edge to prev left edge
        }
    }

    // Check Loss
    if (curr.width <= 0) {
        endGame();
        return;
    }

    // Success Place
    state.floors.push(curr);
    state.score++; // Floor count + 1

    // Update Dad Face
    const totalScore = state.score + state.bonusScore;
    state.dadFace = DadAI.updateFace(totalScore, state.dadScore);
    updateHUD();

    // Spawn Next
    spawnBlock();
}

function showCombo() {
    const el = document.getElementById('combo-display');
    el.classList.remove('hidden');
    el.innerText = `Perfect! +${CONFIG.perfectBonus}`;

    // Re-trigger animation
    el.style.animation = 'none';
    el.offsetHeight; /* trigger reflow */
    el.style.animation = 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

    setTimeout(() => {
        el.classList.add('hidden');
    }, 800);
}

function updateHUD() {
    const totalScore = state.score + state.bonusScore;
    document.getElementById('my-score-display').innerText = `${totalScore}층`;
    document.getElementById('dad-score-display').innerText = `${state.dadScore}층`;
    document.getElementById('dad-face').innerText = state.dadFace;
}

// Updated endGame to Async for Firestore
async function endGame() {
    state.isPlaying = false;

    const finalScore = state.score + state.bonusScore;
    const dadScore = state.dadScore;
    const won = finalScore > dadScore;

    // Show Result Modal immediately with loading state for ranking
    document.getElementById('final-score').innerText = `${finalScore}층`;
    document.getElementById('final-dad-score').innerText = `${dadScore}층`;

    const msgBox = document.getElementById('win-lose-msg');
    if (won) {
        msgBox.innerText = "🎉 아빠를 이겼어요! 대단해요!";
        msgBox.className = "msg-box win";
    } else {
        msgBox.innerText = "😢 아쉽네요... 다시 도전해보세요!";
        msgBox.className = "msg-box lose";
    }

    document.getElementById('result-screen').classList.remove('hidden');

    // Save Record & Load Ranking
    await saveRecord(finalScore);
    // After save, reload ranking
    loadResultRanking();
}

// --- Rendering ---
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    // Apply Camera
    ctx.translate(0, state.cameraY);

    // Draw Floors
    state.floors.forEach(b => {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.width, b.height);

        // Optional border
        ctx.strokeStyle = "rgba(0,0,0,0.1)";
        ctx.lineWidth = 1;
        ctx.strokeRect(b.x, b.y, b.width, b.height);
    });

    // Draw Current
    if (state.currentBlock) {
        const b = state.currentBlock;
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.width, b.height);
    }

    ctx.restore();
}

// --- Ranking & Data (Firestore) ---
async function saveRecord(score) {
    const user = sessionStorage.getItem('user_name') || '익명';
    // Firestore Add
    try {
        await db.collection('beat_dad_records').add({
            nickname: user,
            score: score,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log("Record saved to Firestore");
    } catch (e) {
        console.error("Error saving record:", e);
    }
}

// Load Ranking for Result Screen (Top 5)
// Note: This logic seems redundant with loadStartScreenRanking but slightly different filtering.
// Let's implement Top 5 logic.
async function loadResultRanking() {
    const list = document.getElementById('ranking-list');
    list.innerHTML = '<li style="padding:10px; color:#94a3b8; text-align:center;">순위 집계 중...</li>';

    try {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const snapshot = await db.collection('beat_dad_records')
            .orderBy('score', 'desc') // We want top scores
            .limit(50) // Fetch top 50 to filter by date
            .get();

        const weeklyData = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Client Filter for Date (as we ordered by Score)
            // Note: Efficient way needs Composite Index (score DESC, createdAt DESC)
            if (data.createdAt && data.createdAt.toDate() > oneWeekAgo) {
                weeklyData.push(data);
            }
        });

        // Sort again just in case (client side sort is fast for 50 items)
        weeklyData.sort((a, b) => b.score - a.score);

        const top5 = weeklyData.slice(0, 5);

        list.innerHTML = '';
        if (top5.length === 0) {
            list.innerHTML = '<li class="empty-rank">기록 없음</li>';
        } else {
            top5.forEach((r, i) => {
                const li = document.createElement('li');
                const rank = i + 1;
                let crown = '';
                if (rank === 1) crown = '👑 ';

                li.innerHTML = `<span class="rank-num">${rank}</span> <span>${crown}${r.nickname}</span> <span>${r.score}층</span>`;
                list.appendChild(li);
            });
        }

        // Update Weekly Best (my best or global best? "이번 주 최고 기록" usually means Global or My Best.
        // Let's show Global Best of the week.
        const globalBest = top5.length > 0 ? top5[0].score : 0;
        document.getElementById('weekly-best').innerText = globalBest;

    } catch (e) {
        console.error("Result ranking load failed", e);
        list.innerHTML = '<li style="color:red">랭킹 로드 오류</li>';
    }
}

// Run Init
initGame();
