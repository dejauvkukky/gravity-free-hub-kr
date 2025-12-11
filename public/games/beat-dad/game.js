/**
 * 아빠를 이겨라 (Beat Dad) - Stack Tower Game
 */

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
    dadBaseMax: 35
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
        const totalScore = myScore + state.bonusScore; // Use displayed total for feeling? Or just floor? Using total.

        // Logic based on User Request:
        // P < D - 5 : 😎
        // D - 5 <= P <= D : 😮
        // P > D : 😱
        // P >> D (e.g. +10) : 😭

        // Let's compare "Total Score" (shown to user) vs Dad Score (Floor count equivalent? Or Dad also has bonus?)
        // To keep it simple, Dad Score is just a target number. We compare User's TOTAL score.

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

function loadStartScreenRanking() {
    // 1. Calculate Date (M월 W주)
    const now = new Date();
    const month = now.getMonth() + 1;
    // Simple week calculation: ceil(date / 7)
    const week = Math.ceil(now.getDate() / 7);

    document.getElementById('week-title').innerText = `📅 ${month}월 ${week}주 주간랭킹`;

    // 2. Get Data
    let history = JSON.parse(localStorage.getItem('beatDad_weekly_scores') || '[]');
    // Filter last 7 days roughly
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklyData = history.filter(r => new Date(r.date) > oneWeekAgo);

    // 3. Target Users
    const targets = ['kukky', 'soony', 'joowon', 'raim'];
    const listEl = document.getElementById('start-ranking-list');
    listEl.innerHTML = '';

    targets.forEach((user, idx) => {
        // Find Best Score for this user
        const userRecords = weeklyData.filter(r => r.nickname === user);
        let bestScore = '-';
        if (userRecords.length > 0) {
            bestScore = Math.max(...userRecords.map(r => r.score)) + '층';
        }

        const li = document.createElement('li');
        li.style.cssText = "display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px solid #f1f5f9; color:#334155; font-size:0.95rem;";

        // Medal for Top 3 (visual only, list is fixed order but we can highlight score?)
        // Actually request is just to SHOW them.
        // Let's simple format:
        li.innerHTML = `<span>${user}</span> <span style="font-weight:bold; color:${bestScore === '-' ? '#cbd5e1' : '#2563eb'}">${bestScore}</span>`;
        listEl.appendChild(li);
    });
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

    // Width is based on previous block, potentially reduced by level mod (optional design choice, usually stack game keeps prev width)
    // Design says "Block Width... Lv1 100%, Lv2 95%". This might mean *Target* width scales? 
    // Or does it mean the *Initial* width was smaller?
    // Standard Stack: Width only shrinks when you miss. 
    // Let's apply speed multiplier. Width multiplier might apply to the 'cut' severity or just initial spawn width if we reset.
    // Since we continue, width is determined by prev block. Let's just use Speed.

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

    // Bounce Logic (or wrap? Stack usually bounces)
    // Actually standard stack is "Ping Pong". 
    // Optimization: If it goes too far, just reverse.
    const limit = 50;
    if (blk.x > canvas.width - limit && blk.direction > 0) {
        blk.direction = -1;
    } else if (blk.x < -blk.width + limit && blk.direction < 0) {
        blk.direction = 1;
    }

    // Camera Follow
    // Target Y is to keep the top block around 2/3 of screen
    const targetY = state.floors.length * CONFIG.blockHeight;
    const screenCenter = canvas.height / 2;
    // We render blocks relative to Bottom, but camera moves 'Up'.
    // Actually easier to just shift world Y.
    // Total Stack Height = floors.length * blockHeight.
    // If Stack Height > Canvas Height * 0.5, pan down.

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
            // Optional: Grow block slightly? Or just points.
            // Let's just do points as requested.
        }
    } else {
        // Not Perfect
        state.perfectStreak = 0;
        curr.width -= absDiff;

        if (diff > 0) {
            // Over to the right, cut right
            // x remains, width shrinks
        } else {
            // Over to the left, cut left
            // x increases, width shrinks
            curr.x = prev.x;
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

function endGame() {
    state.isPlaying = false;

    const finalScore = state.score + state.bonusScore;
    const dadScore = state.dadScore;
    const won = finalScore > dadScore;

    // Save Record
    saveRecord(finalScore);

    // Populate Modal
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

    // Weekly Best
    const best = getWeeklyBest();
    document.getElementById('weekly-best').innerText = best;

    // Show Result
    document.getElementById('result-screen').classList.remove('hidden');
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
        // Simple 3D or Bevel effect? Flat for now as per minimal description
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

// --- Ranking & Data ---
function saveRecord(score) {
    const record = {
        score: score,
        date: new Date().toISOString(),
        nickname: sessionStorage.getItem('user_name') || '익명'
    };

    let history = JSON.parse(localStorage.getItem('beatDad_weekly_scores') || '[]');
    history.push(record);
    localStorage.setItem('beatDad_weekly_scores', JSON.stringify(history));

    loadRanking(); // Update list
}

function loadRanking() {
    const list = document.getElementById('ranking-list');
    let history = JSON.parse(localStorage.getItem('beatDad_weekly_scores') || '[]');

    // Filter this week (checking ISO week logic is complex, simplify to last 7 days for MVP)
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const weeklyData = history.filter(r => new Date(r.date) > oneWeekAgo);

    // Sort
    weeklyData.sort((a, b) => b.score - a.score);

    // Top 5
    const top5 = weeklyData.slice(0, 5);

    list.innerHTML = '';
    if (top5.length === 0) {
        list.innerHTML = '<li class="empty-rank">기록 없음</li>';
    } else {
        top5.forEach((r, i) => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="rank-num">${i + 1}</span> <span>${r.nickname}</span> <span>${r.score}층</span>`;
            list.appendChild(li);
        });
    }
}

function getWeeklyBest() {
    let history = JSON.parse(localStorage.getItem('beatDad_weekly_scores') || '[]');
    if (history.length === 0) return 0;
    return Math.max(...history.map(r => r.score));
}

// Run Init
initGame();
