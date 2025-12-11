/**
 * 아빠를 살려라 (Save Dad) - Vampire Survivors Lite
 */

// Firebase Configuration
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

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Game Constants ---
const CONFIG = {
    playerSpeed: 3,
    playerMaxHp: 100,
    playerAttackDamage: 10,
    playerAttackSpeed: 1,
    playerAttackRange: 100,

    enemySpawnInterval: 2000, // ms
    enemySpeedBase: 1.5,

    expOrbSpeed: 4,
    expOrbValue: 10,

    projectileSpeed: 8,
    projectileLifetime: 1000, // ms
};

// --- Skill Definitions ---
const SKILLS = [
    {
        id: 'boomerang',
        name: '부메랑',
        desc: '회전하는 부메랑 발사',
        type: 'active',
        effect: (player) => { player.skills.boomerang = (player.skills.boomerang || 0) + 1; }
    },
    {
        id: 'lightning',
        name: '번개',
        desc: '랜덤 적에게 강타',
        type: 'active',
        effect: (player) => { player.skills.lightning = (player.skills.lightning || 0) + 1; }
    },
    {
        id: 'shield',
        name: '보호막',
        desc: '임시 보호막 생성',
        type: 'active',
        effect: (player) => { player.skills.shield = (player.skills.shield || 0) + 1; }
    },
    {
        id: 'heal',
        name: '회복',
        desc: 'HP +20 회복',
        type: 'instant',
        effect: (player) => { player.hp = Math.min(player.maxHp, player.hp + 20); }
    },
    {
        id: 'speed',
        name: '속도 증가',
        desc: '이동속도 +1',
        type: 'passive',
        effect: (player) => { player.speed += 1; }
    },
    {
        id: 'damage',
        name: '공격력 증가',
        desc: '공격력 +5',
        type: 'passive',
        effect: (player) => { player.attackDamage += 5; }
    },
    {
        id: 'attackSpeed',
        name: '공격속도 증가',
        desc: '공격속도 +0.3',
        type: 'passive',
        effect: (player) => { player.attackSpeed += 0.3; }
    }
];

// --- Game State ---
let state = {
    isPlaying: false,
    isPaused: false,
    survivalTime: 0,
    kills: 0,

    player: {
        x: 0,
        y: 0,
        hp: CONFIG.playerMaxHp,
        maxHp: CONFIG.playerMaxHp,
        speed: CONFIG.playerSpeed,
        attackDamage: CONFIG.playerAttackDamage,
        attackSpeed: CONFIG.playerAttackSpeed,
        attackRange: CONFIG.playerAttackRange,
        exp: 0,
        level: 1,
        skills: {},
        lastAttackTime: 0,
        lastBoomerangTime: 0,
        lastLightningTime: 0,
        lastShieldTime: 0,
        shieldActive: false
    },

    enemies: [],
    projectiles: [],
    boomerangs: [],
    expOrbs: [],

    joystick: { active: false, dx: 0, dy: 0 },

    lastTime: 0,
    lastSpawnTime: 0
};

// --- Enemy Types ---
const ENEMY_TYPES = {
    zombie: { hp: 20, speed: 1, damage: 10, exp: 10, color: '#4ade80' },
    runner: { hp: 15, speed: 2.5, damage: 15, exp: 15, color: '#f59e0b' },
    shooter: { hp: 25, speed: 0.8, damage: 5, exp: 20, color: '#ef4444' },
    elite: { hp: 100, speed: 2, damage: 25, exp: 50, color: '#8b5cf6' }
};

// --- Initialization ---
function initGame() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Touch for mobile (PC keyboard removed)
    setupJoystick();

    // UI Bindings
    document.getElementById('btn-start').onclick = startGame;
    document.getElementById('btn-restart').onclick = startGame;
    document.getElementById('pause-btn').onclick = togglePause;

    // Load ranking
    loadStartScreenRanking();

    // Always show joystick
    document.getElementById('joystick-container').classList.remove('hidden');
}

function resizeCanvas() {
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;
}

function startGame() {
    // Reset
    state.isPlaying = true;
    state.isPaused = false;
    state.survivalTime = 0;
    state.kills = 0;

    state.player = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        hp: CONFIG.playerMaxHp,
        maxHp: CONFIG.playerMaxHp,
        speed: CONFIG.playerSpeed,
        attackDamage: CONFIG.playerAttackDamage,
        attackSpeed: CONFIG.playerAttackSpeed,
        attackRange: CONFIG.playerAttackRange,
        exp: 0,
        level: 1,
        skills: {},
        lastAttackTime: 0,
        lastBoomerangTime: 0,
        lastLightningTime: 0,
        lastShieldTime: 0,
        shieldActive: false
    };

    state.enemies = [];
    state.projectiles = [];
    state.boomerangs = [];
    state.expOrbs = [];

    // Hide screens
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('result-screen').classList.add('hidden');
    document.getElementById('skill-screen').classList.add('hidden');

    // Show joystick (mobile only)
    document.getElementById('joystick-container').classList.remove('hidden');

    updateHUD();

    state.lastTime = performance.now();
    state.lastSpawnTime = state.lastTime;
    requestAnimationFrame(gameLoop);
}

function togglePause() {
    if (!state.isPlaying) return;
    state.isPaused = !state.isPaused;
    document.getElementById('pause-btn').innerText = state.isPaused ? '▶️' : '⏸️';
}

// --- Game Loop ---
function gameLoop(timestamp) {
    if (!state.isPlaying) return;

    const dt = (timestamp - state.lastTime) / 1000; // seconds
    state.lastTime = timestamp;

    if (!state.isPaused) {
        update(dt, timestamp);
        render();
    }

    requestAnimationFrame(gameLoop);
}

function update(dt, timestamp) {
    // Update survival time
    state.survivalTime += dt;

    // Player movement
    updatePlayerMovement(dt);

    // Auto attack
    updateAutoAttack(timestamp);

    // Active skills
    updateActiveSkills(timestamp);

    // Spawn enemies
    updateEnemySpawning(timestamp);

    // Update enemies
    updateEnemies(dt);

    // Update projectiles
    updateProjectiles(dt, timestamp);

    // Update boomerangs
    updateBoomerangs(dt, timestamp);

    // Update exp orbs
    updateExpOrbs(dt);

    // Check collisions
    checkCollisions();

    // Update UI
    updateHUD();

    // Check game over
    if (state.player.hp <= 0) {
        endGame();
    }
}

function updatePlayerMovement(dt) {
    const p = state.player;
    let dx = 0, dy = 0;

    // Joystick only (PC keyboard removed)
    if (state.joystick.active) {
        dx += state.joystick.dx;
        dy += state.joystick.dy;
    }

    // Normalize
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag > 0) {
        dx /= mag;
        dy /= mag;
    }

    p.x += dx * p.speed * dt * 60;
    p.y += dy * p.speed * dt * 60;

    // Bounds
    p.x = Math.max(20, Math.min(canvas.width - 20, p.x));
    p.y = Math.max(20, Math.min(canvas.height - 20, p.y));
}

function updateAutoAttack(timestamp) {
    const p = state.player;
    const attackInterval = 1000 / p.attackSpeed;

    if (timestamp - p.lastAttackTime < attackInterval) return;

    // Find closest enemy
    let closest = null;
    let minDist = Infinity;

    state.enemies.forEach(e => {
        const dist = Math.hypot(e.x - p.x, e.y - p.y);
        if (dist < minDist && dist <= p.attackRange) {
            minDist = dist;
            closest = e;
        }
    });

    if (closest) {
        fireProjectile(p.x, p.y, closest.x, closest.y, p.attackDamage);
        p.lastAttackTime = timestamp;
    }
}

function fireProjectile(x, y, tx, ty, damage) {
    const angle = Math.atan2(ty - y, tx - x);
    state.projectiles.push({
        x, y,
        vx: Math.cos(angle) * CONFIG.projectileSpeed,
        vy: Math.sin(angle) * CONFIG.projectileSpeed,
        damage,
        spawnTime: performance.now()
    });
}

// Active Skills System
function updateActiveSkills(timestamp) {
    const p = state.player;

    // Boomerang
    if (p.skills.boomerang && timestamp - p.lastBoomerangTime > 3000) {
        spawnBoomerang();
        p.lastBoomerangTime = timestamp;
    }

    // Lightning
    if (p.skills.lightning && timestamp - p.lastLightningTime > 5000) {
        castLightning();
        p.lastLightningTime = timestamp;
    }

    // Shield
    if (p.skills.shield && timestamp - p.lastShieldTime > 10000) {
        activateShield();
        p.lastShieldTime = timestamp;
    }

    // Shield duration
    if (p.shieldActive && timestamp - p.lastShieldTime > 3000) {
        p.shieldActive = false;
    }
}

function spawnBoomerang() {
    state.boomerangs.push({
        x: state.player.x,
        y: state.player.y,
        angle: 0,
        radius: 50,
        speed: 0.1,
        damage: state.player.attackDamage * 2,
        spawnTime: performance.now()
    });
}

function castLightning() {
    if (state.enemies.length === 0) return;

    // Hit random 3 enemies
    const targets = [...state.enemies]
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

    targets.forEach(e => {
        e.hp -= state.player.attackDamage * 5;
    });
}

function activateShield() {
    state.player.shieldActive = true;
}

function updateBoomerangs(dt, timestamp) {
    state.boomerangs.forEach(b => {
        b.angle += b.speed;
        b.x = state.player.x + Math.cos(b.angle) * b.radius;
        b.y = state.player.y + Math.sin(b.angle) * b.radius;
    });

    // Remove old
    state.boomerangs = state.boomerangs.filter(b =>
        timestamp - b.spawnTime < 5000
    );
}

function updateEnemySpawning(timestamp) {
    const spawnRate = Math.max(500, CONFIG.enemySpawnInterval - state.survivalTime * 10);

    if (timestamp - state.lastSpawnTime < spawnRate) return;

    state.lastSpawnTime = timestamp;

    // Determine enemy type based on time
    let type = 'zombie';
    if (state.survivalTime > 120) type = Math.random() < 0.3 ? 'elite' : (Math.random() < 0.5 ? 'runner' : 'shooter');
    else if (state.survivalTime > 60) type = Math.random() < 0.5 ? 'runner' : 'shooter';
    else if (state.survivalTime > 30) type = Math.random() < 0.5 ? 'zombie' : 'runner';

    spawnEnemy(type);
}

function spawnEnemy(type) {
    const template = ENEMY_TYPES[type];
    const side = Math.floor(Math.random() * 4);
    let x, y;

    if (side === 0) { x = Math.random() * canvas.width; y = -20; }
    else if (side === 1) { x = canvas.width + 20; y = Math.random() * canvas.height; }
    else if (side === 2) { x = Math.random() * canvas.width; y = canvas.height + 20; }
    else { x = -20; y = Math.random() * canvas.height; }

    state.enemies.push({
        x, y,
        type,
        hp: template.hp,
        maxHp: template.hp,
        speed: template.speed,
        damage: template.damage,
        exp: template.exp,
        color: template.color
    });
}

function updateEnemies(dt) {
    state.enemies.forEach(e => {
        const dx = state.player.x - e.x;
        const dy = state.player.y - e.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
            e.x += (dx / dist) * e.speed * dt * 60;
            e.y += (dy / dist) * e.speed * dt * 60;
        }
    });

    // Remove dead
    state.enemies = state.enemies.filter(e => e.hp > 0);
}

function updateProjectiles(dt, timestamp) {
    state.projectiles.forEach(p => {
        p.x += p.vx * dt * 60;
        p.y += p.vy * dt * 60;
    });

    // Remove old
    state.projectiles = state.projectiles.filter(p =>
        timestamp - p.spawnTime < CONFIG.projectileLifetime &&
        p.x > -50 && p.x < canvas.width + 50 &&
        p.y > -50 && p.y < canvas.height + 50
    );
}

function updateExpOrbs(dt) {
    state.expOrbs.forEach(orb => {
        const dx = state.player.x - orb.x;
        const dy = state.player.y - orb.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 60) {
            orb.x += (dx / dist) * CONFIG.expOrbSpeed * dt * 60;
            orb.y += (dy / dist) * CONFIG.expOrbSpeed * dt * 60;
        }
    });
}

function checkCollisions() {
    const p = state.player;

    // Projectile vs Enemy
    state.projectiles.forEach(proj => {
        state.enemies.forEach(e => {
            const dist = Math.hypot(proj.x - e.x, proj.y - e.y);
            if (dist < 15 && proj.damage > 0) {
                e.hp -= proj.damage;
                proj.damage = 0; // Mark for removal

                if (e.hp <= 0) {
                    state.kills++;
                    dropExpOrb(e.x, e.y, e.exp);
                }
            }
        });
    });
    state.projectiles = state.projectiles.filter(p => p.damage > 0);

    // Boomerang vs Enemy
    state.boomerangs.forEach(boom => {
        state.enemies.forEach(e => {
            const dist = Math.hypot(boom.x - e.x, boom.y - e.y);
            if (dist < 20 && boom.damage > 0) {
                e.hp -= boom.damage;
                boom.damage = 0;

                if (e.hp <= 0) {
                    state.kills++;
                    dropExpOrb(e.x, e.y, e.exp);
                }
            }
        });
    });
    state.boomerangs = state.boomerangs.filter(b => b.damage > 0);

    // Player vs Enemy (with shield check)
    if (!p.shieldActive) {
        state.enemies.forEach(e => {
            const dist = Math.hypot(e.x - p.x, e.y - p.y);
            if (dist < 25) {
                p.hp -= e.damage * 0.016; // Damage over time
            }
        });
    }

    // Player vs Exp Orb
    state.expOrbs.forEach((orb, i) => {
        const dist = Math.hypot(orb.x - p.x, orb.y - p.y);
        if (dist < 20) {
            p.exp += orb.value;
            state.expOrbs.splice(i, 1);
            checkLevelUp();
        }
    });
}

function dropExpOrb(x, y, value) {
    state.expOrbs.push({ x, y, value });
}

function checkLevelUp() {
    const required = state.player.level * 10;
    if (state.player.exp >= required) {
        state.player.exp -= required;
        state.player.level++;
        showSkillSelection();
    }
}

function showSkillSelection() {
    state.isPaused = true;

    // Random 3 skills
    const available = [...SKILLS];
    const selected = [];
    for (let i = 0; i < 3 && available.length > 0; i++) {
        const idx = Math.floor(Math.random() * available.length);
        selected.push(available.splice(idx, 1)[0]);
    }

    const container = document.getElementById('skill-options');
    container.innerHTML = '';

    selected.forEach(skill => {
        const btn = document.createElement('button');
        btn.className = 'skill-btn';
        btn.innerHTML = `<div class="skill-name">${skill.name}</div><div class="skill-desc">${skill.desc}</div>`;
        btn.onclick = () => selectSkill(skill);
        container.appendChild(btn);
    });

    document.getElementById('skill-screen').classList.remove('hidden');
}

function selectSkill(skill) {
    skill.effect(state.player);
    document.getElementById('skill-screen').classList.add('hidden');
    state.isPaused = false;
}

function updateHUD() {
    const p = state.player;

    // Time
    const mins = Math.floor(state.survivalTime / 60);
    const secs = Math.floor(state.survivalTime % 60);
    document.getElementById('time-display').innerText =
        `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    // HP
    const hpPercent = (p.hp / p.maxHp) * 100;
    document.getElementById('hp-bar').style.width = hpPercent + '%';
    document.getElementById('hp-text').innerText = `${Math.max(0, Math.floor(p.hp))}/${p.maxHp}`;

    // Exp
    const required = p.level * 10;
    const expPercent = (p.exp / required) * 100;
    document.getElementById('exp-bar').style.width = expPercent + '%';

    // Level
    document.getElementById('level-display').innerText = p.level;

    // Face
    let face = '😊';
    if (hpPercent <= 40) face = '😱';
    else if (hpPercent <= 70) face = '😰';
    document.getElementById('dad-face').innerText = face;
}

async function endGame() {
    state.isPlaying = false;

    // Hide joystick
    document.getElementById('joystick-container').classList.add('hidden');

    // Show result
    const mins = Math.floor(state.survivalTime / 60);
    const secs = Math.floor(state.survivalTime % 60);
    document.getElementById('final-time').innerText =
        `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    document.getElementById('final-kills').innerText = `${state.kills}마리`;
    document.getElementById('final-level').innerText = `Lv.${state.player.level}`;

    const msg = document.getElementById('result-msg');
    if (state.survivalTime >= 150) {
        msg.innerText = "🎉 대단해요! 아빠를 지켰어요!";
        msg.className = "msg-box win";
    } else {
        msg.innerText = "😢 아빠가 쓰러졌어요... 다시 도전해보세요!";
        msg.className = "msg-box lose";
    }

    document.getElementById('result-screen').classList.remove('hidden');

    // Save & load ranking
    await saveRecord(Math.floor(state.survivalTime), state.kills, state.player.level);
    loadResultRanking();
}

// --- Rendering ---
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Exp Orbs
    state.expOrbs.forEach(orb => {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, 6, 0, Math.PI * 2);
        ctx.fill();
    });

    // Projectiles
    state.projectiles.forEach(p => {
        ctx.fillStyle = '#60a5fa';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
    });

    // Boomerangs
    state.boomerangs.forEach(b => {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 8, 0, Math.PI * 2);
        ctx.fill();
    });

    // Enemies
    state.enemies.forEach(e => {
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(e.x, e.y, 15, 0, Math.PI * 2);
        ctx.fill();

        // HP bar
        if (e.hp < e.maxHp) {
            const barWidth = 30;
            const barHeight = 4;
            ctx.fillStyle = '#333';
            ctx.fillRect(e.x - barWidth / 2, e.y - 25, barWidth, barHeight);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(e.x - barWidth / 2, e.y - 25, barWidth * (e.hp / e.maxHp), barHeight);
        }
    });

    // Player
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, 20, 0, Math.PI * 2);
    ctx.fill();

    // Shield effect
    if (state.player.shieldActive) {
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(state.player.x, state.player.y, 30, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Player face
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const face = state.player.hp / state.player.maxHp > 0.7 ? '😊' :
        state.player.hp / state.player.maxHp > 0.4 ? '😰' : '😱';
    ctx.fillText(face, state.player.x, state.player.y);
}

// --- Input Handlers (Keyboard removed, mobile only) ---

function setupJoystick() {
    const base = document.getElementById('joystick-base');
    const stick = document.getElementById('joystick-stick');

    let startX = 0, startY = 0;

    base.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const rect = base.getBoundingClientRect();
        startX = rect.left + rect.width / 2;
        startY = rect.top + rect.height / 2;
        state.joystick.active = true;
    });

    base.addEventListener('touchmove', (e) => {
        if (!state.joystick.active) return;
        e.preventDefault();

        const touch = e.touches[0];
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;
        const dist = Math.hypot(dx, dy);
        const maxDist = 40;

        if (dist > maxDist) {
            state.joystick.dx = (dx / dist);
            state.joystick.dy = (dy / dist);
            stick.style.transform = `translate(${(dx / dist) * maxDist}px, ${(dy / dist) * maxDist}px)`;
        } else {
            state.joystick.dx = dx / maxDist;
            state.joystick.dy = dy / maxDist;
            stick.style.transform = `translate(${dx}px, ${dy}px)`;
        }
    });

    base.addEventListener('touchend', () => {
        state.joystick.active = false;
        state.joystick.dx = 0;
        state.joystick.dy = 0;
        stick.style.transform = 'translate(0, 0)';
    });
}

// --- Firebase & Ranking ---
async function saveRecord(survivalTime, kills, level) {
    const user = sessionStorage.getItem('user_name') || '익명';
    try {
        await db.collection('save_dad_records').add({
            nickname: user,
            survivalTime,
            killCount: kills,
            finalLevel: level,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (e) {
        console.error("Save error:", e);
    }
}

async function loadStartScreenRanking() {
    const listEl = document.getElementById('start-ranking-list');
    listEl.innerHTML = '<li style="padding:10px; color:#94a3b8; text-align:center;">불러오는 중...</li>';

    try {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const snapshot = await db.collection('save_dad_records')
            .orderBy('createdAt', 'desc')
            .limit(100)
            .get();

        const weeklyData = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.createdAt && data.createdAt.toDate() > oneWeekAgo) {
                weeklyData.push(data);
            }
        });

        const targets = ['kukky', 'soony', 'joowon', 'raim'];
        const displayData = targets.map(user => {
            const userRecords = weeklyData.filter(r => r.nickname === user);
            const bestTime = userRecords.length > 0 ? Math.max(...userRecords.map(r => r.survivalTime)) : 0;
            return { nickname: user, survivalTime: bestTime };
        });

        displayData.sort((a, b) => b.survivalTime - a.survivalTime);

        listEl.innerHTML = '';
        displayData.forEach(item => {
            const li = document.createElement('li');
            li.style.cssText = "display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px solid #f1f5f9; color:#334155; font-size:0.95rem;";

            const isZero = item.survivalTime === 0;
            const scoreColor = isZero ? '#cbd5e1' : '#2563eb';
            const scoreText = item.survivalTime + '초';

            let crown = '';
            if (displayData[0].survivalTime > 0 && item.survivalTime === displayData[0].survivalTime) {
                crown = '👑 ';
            }

            li.innerHTML = `<span>${crown}${item.nickname}</span> <span style="font-weight:bold; color:${scoreColor}">${scoreText}</span>`;
            listEl.appendChild(li);
        });
    } catch (e) {
        console.error("Ranking load error:", e);
        listEl.innerHTML = '<li style="padding:10px; color:#ef4444; text-align:center;">랭킹 로드 실패</li>';
    }
}

async function loadResultRanking() {
    const list = document.getElementById('ranking-list');
    list.innerHTML = '<li style="padding:10px; color:#94a3b8; text-align:center;">순위 집계 중...</li>';

    try {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const snapshot = await db.collection('save_dad_records')
            .orderBy('survivalTime', 'desc')
            .limit(50)
            .get();

        const weeklyData = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.createdAt && data.createdAt.toDate() > oneWeekAgo) {
                weeklyData.push(data);
            }
        });

        weeklyData.sort((a, b) => b.survivalTime - a.survivalTime);
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

                li.innerHTML = `<span class="rank-num">${rank}</span> <span>${crown}${r.nickname}</span> <span>${r.survivalTime}초</span>`;
                list.appendChild(li);
            });
        }

        const globalBest = top5.length > 0 ? top5[0].survivalTime : 0;
        document.getElementById('weekly-best').innerText = globalBest;
    } catch (e) {
        console.error("Result ranking error:", e);
        list.innerHTML = '<li style="color:red">랭킹 로드 오류</li>';
    }
}

// Init
initGame();
