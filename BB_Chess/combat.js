// ============================================================================
// 『쁘니토체스 (BB Chess)』 - 2.5D/3D 스탠딩 피규어 전투 엔진 & 디오라마 Canvas 렌더러
// (이모지 완전 배제 · 입체 받침대 · 발 기준 탄성 물리 · 카메라 쉐이크 · 커스텀 VFX)
// ============================================================================

const BOARD_COLS = 5;
const BOARD_ROWS = 6;
const TILE_SIZE = 66;
const BOARD_PAD_X = 13;
const BOARD_PAD_TOP = 22;
const BOARD_PAD_BOTTOM = 10;
const CANVAS_W = BOARD_COLS * TILE_SIZE + BOARD_PAD_X * 2; // 356
const CANVAS_H = BOARD_ROWS * TILE_SIZE + BOARD_PAD_TOP + BOARD_PAD_BOTTOM; // 428

const CombatSystem = {
  canvas: null,
  ctx: null,
  arenaBgImg: null,

  units: [],
  projectiles: [],
  effects: [],
  floatingTexts: [],
  tickTimer: null,
  rafId: null,
  lastFrameTime: 0,
  elapsedSec: 0,
  overtimeActive: false,
  plunderedThisCombat: 0,
  combatEnding: false,

  // 카메라 임팩트 미세 진동
  shakeTimer: 0,
  shakeIntensity: 0,

  // 준비 페이즈 미리보기 & 드래그 인터랙션
  previewEnemies: [],
  hoverTile: null,
  dragGhost: null,
  isDraggingUnit: false,

  onCombatEndCallback: null,
  onSoundCallback: null,

  init(canvasEl) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.setupHiDPI();

    const bg = new Image();
    bg.onload = () => { this.arenaBgImg = bg; };
    bg.src = './assets/arena_bg.jpg';

    this.buildStagePreview();
    this.startRenderLoop();
  },

  setupHiDPI() {
    if (!this.canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.canvas.width = CANVAS_W * dpr;
    this.canvas.height = CANVAS_H * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  },

  playSfx(type, detail) {
    if (typeof this.onSoundCallback === 'function') {
      this.onSoundCallback(type, detail);
    }
  },

  triggerShake(intensity = 4, duration = 0.22) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeTimer = Math.max(this.shakeTimer, duration);
  },

  // 타일 중심에서 피규어 받침대(발 위치) 좌표 반환
  tileToCenter(row, col) {
    return {
      x: BOARD_PAD_X + col * TILE_SIZE + TILE_SIZE * 0.5,
      y: BOARD_PAD_TOP + row * TILE_SIZE + TILE_SIZE * 0.66
    };
  },

  pixelToTile(px, py) {
    const col = Math.floor((px - BOARD_PAD_X) / TILE_SIZE);
    const row = Math.floor((py - BOARD_PAD_TOP) / TILE_SIZE);
    if (row < 0 || row >= BOARD_ROWS || col < 0 || col >= BOARD_COLS) return null;
    return { row, col };
  },

  chebyshev(r1, c1, r2, c2) {
    return Math.max(Math.abs(r1 - r2), Math.abs(c1 - c2));
  },

  buildStagePreview() {
    const wave = STAGE_WAVES[Math.min(AppState.stage - 1, STAGE_WAVES.length - 1)];
    this.previewEnemies = [];
    if (!wave) return;
    for (const item of wave.units) {
      const spec = PUNI_MAP[item.id];
      if (!spec) continue;
      const cu = new CombatUnit(spec, item.star, true, item.row, item.col);
      const pos = this.tileToCenter(item.row, item.col);
      cu.renderX = pos.x;
      cu.renderY = pos.y;
      cu.groundY = pos.y;
      this.previewEnemies.push(cu);
    }
  },

  spawnCombineCelebration(row, col, star) {
    const pos = this.tileToCenter(row, col);
    this.triggerShake(star === 3 ? 5.5 : 3.0, 0.28);
    this.effects.push({
      type: 'ring',
      x: pos.x,
      y: pos.y - 6,
      maxR: star === 3 ? 72 : 48,
      color: star === 3 ? '#f59e0b' : '#38bdf8',
      life: 0,
      maxLife: 0.68
    });
    for (let i = 0; i < (star === 3 ? 20 : 12); i++) {
      const ang = (Math.PI * 2 * i) / (star === 3 ? 20 : 12);
      const spd = 50 + Math.random() * 65;
      this.effects.push({
        type: 'spark',
        x: pos.x,
        y: pos.y - 24,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 28,
        color: star === 3 ? '#fde047' : '#bae6fd',
        size: star === 3 ? 4.8 : 3.4,
        life: 0,
        maxLife: 0.62
      });
    }
    this.addFloatingText(pos.x, pos.y - 58, star === 3 ? '3성 피규어 완성!' : '2성 승급!', '#fde047', 14);
  },

  addFloatingText(x, y, text, color = '#ffffff', size = 12) {
    this.floatingTexts.push({
      x: x + (Math.random() - 0.5) * 12,
      y,
      text,
      color,
      size,
      life: 0,
      maxLife: 0.85
    });
  },

  startJump(unit, targetX, targetY, arcHeight = 20, duration = 0.18) {
    unit.jumpStartX = unit.renderX;
    unit.jumpStartY = unit.groundY || unit.renderY;
    unit.jumpTargetX = targetX;
    unit.jumpTargetY = targetY;
    unit.jumpProgress = 0;
    unit.jumpDuration = duration;
    unit.jumpArcHeight = arcHeight;
    unit.scaleX = 0.86;
    unit.scaleY = 1.18;
    unit.tiltAngle = targetX > unit.renderX ? 0.08 : (targetX < unit.renderX ? -0.08 : 0);
  },

  // ==========================================================================
  // 전투 개시 초기화 & 시너지 버프 · 잠입자 후열 점프
  // ==========================================================================
  startCombat() {
    if (AppState.phase === 'COMBAT') return false;

    this.units = [];
    this.projectiles = [];
    this.effects = [];
    this.floatingTexts = [];
    this.elapsedSec = 0;
    this.overtimeActive = false;
    this.plunderedThisCombat = 0;
    this.combatEnding = false;
    AppState.selectedSlot = null;

    const deployFromBoard = () => {
      for (let r = 3; r < 6; r++) {
        for (let c = 0; c < 5; c++) {
          const owned = AppState.board[r][c];
          if (!owned) continue;
          const spec = PUNI_MAP[owned.id];
          const cu = new CombatUnit(spec, owned.star, false, r, c);
          const pos = this.tileToCenter(r, c);
          cu.renderX = pos.x;
          cu.renderY = pos.y;
          cu.groundY = pos.y;
          this.units.push(cu);
        }
      }
    };

    deployFromBoard();

    if (this.units.filter(u => !u.isEnemy).length === 0) {
      const benchIdx = AppState.bench.findIndex(b => b !== null);
      if (benchIdx !== -1) {
        ShopSystem.autoDeployUnit(benchIdx);
        deployFromBoard();
      }
    }

    const wave = STAGE_WAVES[Math.min(AppState.stage - 1, STAGE_WAVES.length - 1)];
    for (const item of wave.units) {
      const spec = PUNI_MAP[item.id];
      const cu = new CombatUnit(spec, item.star, true, item.row, item.col);
      if (AppState.stage === 1) {
        cu.maxHp = Math.round(cu.maxHp * 0.85);
        cu.hp = cu.maxHp;
      }
      const pos = this.tileToCenter(item.row, item.col);
      cu.renderX = pos.x;
      cu.renderY = pos.y;
      cu.groundY = pos.y;
      this.units.push(cu);
    }

    AppState.phase = 'COMBAT';

    this.applyTeamSynergies(false);
    this.applyTeamSynergies(true);
    this.executeInfiltratorLeaps();

    this.playSfx('combatStart');

    if (this.tickTimer) clearInterval(this.tickTimer);
    this.tickTimer = setInterval(() => this.combatTick(), 100);
    return true;
  },

  applyTeamSynergies(isEnemyTeam) {
    const team = this.units.filter(u => u.isEnemy === isEnemyTeam && u.alive);
    const synMap = ShopSystem.computeSynergiesFromUnits(team.map(u => u.id));
    if (!isEnemyTeam) {
      AppState.activeSynergies = synMap;
    }

    const getTier = (name) => (synMap[name] ? synMap[name].activeTier : 0);

    const farmTier = getTier('동물농장');
    if (farmTier > 0) {
      const bonus = SYNERGY_DB['동물농장'].values[farmTier - 1];
      for (const u of team) {
        if (u.origin === '동물농장') {
          u.maxHp = Math.round(u.maxHp * (1 + bonus));
          u.hp = u.maxHp;
        }
      }
    }

    const sweetTier = getTier('스위트파티');
    if (sweetTier > 0) {
      const cfg = SYNERGY_DB['스위트파티'].values[sweetTier - 1];
      for (const u of team) {
        u.shield += cfg.shield;
        if (u.origin === '스위트파티') u.atkSpeed += cfg.aspd;
      }
    }

    const lovelyTier = getTier('러블리스타');
    if (lovelyTier > 0) {
      const spBonus = SYNERGY_DB['러블리스타'].values[lovelyTier - 1];
      for (const u of team) {
        u.skillPowerMult += spBonus;
        u.skillCrit = true;
      }
    }

    const elemTier = getTier('원소판타지');
    if (elemTier > 0) {
      for (const u of team) {
        if (u.origin === '원소판타지') u.elementalTier = elemTier;
      }
    }

    const kingdomTier = getTier('왕국전사');
    if (kingdomTier > 0) {
      const atkBonus = SYNERGY_DB['왕국전사'].values[kingdomTier - 1];
      for (const u of team) {
        if (u.origin === '왕국전사') {
          u.atk = Math.round(u.atk * (1 + atkBonus));
          u.baseAtk = u.atk;
          u.armorPen = Math.max(u.armorPen, 0.30);
        }
      }
    }

    const vanguardTier = getTier('선봉대');
    if (vanguardTier > 0) {
      const defBonus = SYNERGY_DB['선봉대'].values[vanguardTier - 1];
      for (const u of team) {
        if (u.job === '선봉대') u.def += defBonus;
      }
    }

    const strikerTier = getTier('타격대');
    if (strikerTier > 0) {
      const aspdBonus = SYNERGY_DB['타격대'].values[strikerTier - 1];
      for (const u of team) {
        if (u.job === '타격대') {
          u.atkSpeed += aspdBonus;
          u.omnivamp += 0.20;
        }
      }
    }

    const infilTier = getTier('잠입자');
    if (infilTier > 0) {
      const critBonus = SYNERGY_DB['잠입자'].values[infilTier - 1];
      for (const u of team) {
        if (u.job === '잠입자') u.critChance += critBonus;
      }
    }

    const bombTier = getTier('포격수');
    for (const u of team) {
      if (u.job === '포격수') {
        u.splashRatio = bombTier > 0 ? SYNERGY_DB['포격수'].values[bombTier - 1] : 0.15;
      }
    }

    const arcaneTier = getTier('비전술사');
    if (arcaneTier > 0) {
      const mpBonus = SYNERGY_DB['비전술사'].values[arcaneTier - 1];
      for (const u of team) {
        if (u.job === '비전술사') u.bonusManaOnHit += mpBonus;
      }
    }

    const mysticTier = getTier('신비술사');
    if (mysticTier > 0) {
      const resBonus = SYNERGY_DB['신비술사'].values[mysticTier - 1];
      for (const u of team) {
        u.def += resBonus;
      }
    }

    if (isEnemyTeam) this.enemySynergies = synMap;
    else this.allySynergies = synMap;
  },

  executeInfiltratorLeaps() {
    const occupied = Array.from({ length: BOARD_ROWS }, () => new Array(BOARD_COLS).fill(false));
    for (const u of this.units) {
      if (u.alive) occupied[u.row][u.col] = true;
    }

    for (const u of this.units) {
      if (!u.alive || u.job !== '잠입자') continue;
      const targetRows = u.isEnemy ? [5, 4, 3] : [0, 1, 2];
      const colPref = [u.col, u.col - 1, u.col + 1, u.col - 2, u.col + 2, 0, 1, 2, 3, 4]
        .filter((c, idx, arr) => c >= 0 && c < BOARD_COLS && arr.indexOf(c) === idx);

      let dest = null;
      for (const r of targetRows) {
        for (const c of colPref) {
          if (!occupied[r][c]) {
            dest = { row: r, col: c };
            break;
          }
        }
        if (dest) break;
      }

      if (dest) {
        occupied[u.row][u.col] = false;
        u.row = dest.row;
        u.col = dest.col;
        occupied[u.row][u.col] = true;
        const pos = this.tileToCenter(dest.row, dest.col);
        this.startJump(u, pos.x, pos.y, 58, 0.44);
        u.atkCooldown = 0.45;
      }
    }
  },

  // ==========================================================================
  // 100ms 논리 틱 시뮬레이션
  // ==========================================================================
  combatTick() {
    if (AppState.phase !== 'COMBAT' || this.combatEnding) return;

    const dt = 0.1;
    this.elapsedSec = Math.round((this.elapsedSec + dt) * 10) / 10;

    if (this.elapsedSec >= 30 && !this.overtimeActive) {
      this.overtimeActive = true;
      this.triggerShake(4.0, 0.3);
      this.addFloatingText(CANVAS_W / 2, CANVAS_H / 2, '시간 가속 발동!', '#fb7185', 15);
      this.playSfx('overtime');
    }

    const livingAllies = this.units.filter(u => !u.isEnemy && u.alive);
    const livingEnemies = this.units.filter(u => u.isEnemy && u.alive);
    if (livingAllies.length === 0 || livingEnemies.length === 0) {
      this.finishCombat(livingAllies.length > 0, livingEnemies);
      return;
    }

    const tickCount = Math.round(this.elapsedSec * 10);
    if (tickCount > 0 && tickCount % 10 === 0) {
      this.triggerPeriodicHealing(false, 1);
      this.triggerPeriodicHealing(true, 1);
    }
    if (tickCount > 0 && tickCount % 30 === 0) {
      this.triggerPeriodicHealing(false, 3);
      this.triggerPeriodicHealing(true, 3);
    }

    const occupied = Array.from({ length: BOARD_ROWS }, () => new Array(BOARD_COLS).fill(null));
    for (const u of this.units) {
      if (u.alive) occupied[u.row][u.col] = u;
    }

    for (const u of this.units) {
      if (!u.alive) continue;

      if (u.stunTimer > 0) u.stunTimer = Math.max(0, u.stunTimer - dt);
      if (u.chillTimer > 0) u.chillTimer = Math.max(0, u.chillTimer - dt);
      if (u.shockTimer > 0) u.shockTimer = Math.max(0, u.shockTimer - dt);
      if (u.sleepHealTimer > 0) u.sleepHealTimer = Math.max(0, u.sleepHealTimer - dt);
      if (u.stealthTimer > 0) u.stealthTimer = Math.max(0, u.stealthTimer - dt);
      if (u.dmgReduceTimer > 0) u.dmgReduceTimer = Math.max(0, u.dmgReduceTimer - dt);
      if (u.aspdBuffTimer > 0) u.aspdBuffTimer = Math.max(0, u.aspdBuffTimer - dt);
      if (u.aspdDebuffTimer > 0) u.aspdDebuffTimer = Math.max(0, u.aspdDebuffTimer - dt);
      if (u.atkBuffTimer > 0) u.atkBuffTimer = Math.max(0, u.atkBuffTimer - dt);
      if (u.frenzyTimer > 0) u.frenzyTimer = Math.max(0, u.frenzyTimer - dt);
      if (u.airborneTimer > 0) u.airborneTimer = Math.max(0, u.airborneTimer - dt);

      if (u.regenTimer > 0) {
        u.regenTimer = Math.max(0, u.regenTimer - dt);
        if (tickCount % 5 === 0) {
          this.healUnit(u, u.regenPerSec * 0.5, false);
        }
      }

      if (u.stunTimer > 0 || u.sleepHealTimer > 0) continue;
      if (u.jumpProgress < 1) continue;

      const target = this.findNearestEnemy(u);
      if (!target) continue;

      const dist = this.chebyshev(u.row, u.col, target.row, target.col);

      if (dist > u.range) {
        const nextTile = this.findBestStep(u, target, occupied);
        if (nextTile) {
          occupied[u.row][u.col] = null;
          u.row = nextTile.row;
          u.col = nextTile.col;
          occupied[u.row][u.col] = u;
          const pos = this.tileToCenter(u.row, u.col);
          const moveDur = u.chillTimer > 0 ? 0.26 : 0.17;
          this.startJump(u, pos.x, pos.y, 18, moveDur);
        }
        continue;
      }

      if (u.mp >= u.maxMp) {
        u.mp = 0;
        u.castPulse = 1.0;
        u.scaleX = 1.26;
        u.scaleY = 0.78;
        this.castUltimate(u, target, occupied);
        continue;
      }

      let effAspd = u.atkSpeed;
      if (u.aspdBuffTimer > 0) effAspd += u.aspdBuffVal;
      if (u.frenzyTimer > 0) effAspd *= 2.0;
      if (u.chillTimer > 0) effAspd *= 0.6;
      if (u.aspdDebuffTimer > 0) effAspd *= 0.65;
      if (this.overtimeActive) effAspd *= 2.2;
      effAspd = Math.max(0.35, Math.min(4.5, effAspd));

      u.atkCooldown -= dt * effAspd;
      if (u.atkCooldown <= 0) {
        u.atkCooldown = 1.0;
        this.performBasicAttack(u, target);
      }
    }
  },

  triggerPeriodicHealing(isEnemyTeam, periodSec) {
    const synMap = isEnemyTeam ? this.enemySynergies : this.allySynergies;
    if (!synMap) return;
    const team = this.units.filter(u => u.isEnemy === isEnemyTeam && u.alive);

    if (periodSec === 1 && synMap['일상힐링'] && synMap['일상힐링'].activeTier > 0) {
      const ratio = SYNERGY_DB['일상힐링'].values[synMap['일상힐링'].activeTier - 1];
      for (const u of team) {
        if (u.hp < u.maxHp) this.healUnit(u, Math.round(u.maxHp * ratio), false);
      }
    }

    if (periodSec === 3 && synMap['신비술사'] && synMap['신비술사'].activeTier > 0) {
      for (const u of team) {
        if (u.hp < u.maxHp) this.healUnit(u, 150, true);
      }
    }
  },

  findNearestEnemy(unit) {
    let candidates = this.units.filter(e => e.isEnemy !== unit.isEnemy && e.alive && e.stealthTimer <= 0);
    if (candidates.length === 0) {
      candidates = this.units.filter(e => e.isEnemy !== unit.isEnemy && e.alive);
    }
    if (candidates.length === 0) return null;

    let best = null;
    let bestCheb = Infinity;
    let bestEuclid = Infinity;
    for (const e of candidates) {
      const cDist = this.chebyshev(unit.row, unit.col, e.row, e.col);
      const eDist = Math.hypot(unit.row - e.row, unit.col - e.col);
      if (cDist < bestCheb || (cDist === bestCheb && eDist < bestEuclid)) {
        bestCheb = cDist;
        bestEuclid = eDist;
        best = e;
      }
    }
    return best;
  },

  findBestStep(unit, target, occupied) {
    const dirs = [
      [-1, 0], [1, 0], [0, -1], [0, 1],
      [-1, -1], [-1, 1], [1, -1], [1, 1]
    ];
    let bestTile = null;
    let bestCheb = this.chebyshev(unit.row, unit.col, target.row, target.col);
    let bestEuclid = Math.hypot(unit.row - target.row, unit.col - target.col);

    for (const [dr, dc] of dirs) {
      const nr = unit.row + dr;
      const nc = unit.col + dc;
      if (nr < 0 || nr >= BOARD_ROWS || nc < 0 || nc >= BOARD_COLS) continue;
      if (occupied[nr][nc]) continue;

      const cDist = this.chebyshev(nr, nc, target.row, target.col);
      const eDist = Math.hypot(nr - target.row, nc - target.col);
      if (cDist < bestCheb || (cDist === bestCheb && eDist < bestEuclid - 0.05)) {
        bestCheb = cDist;
        bestEuclid = eDist;
        bestTile = { row: nr, col: nc };
      }
    }
    return bestTile;
  },

  getEffectiveAtk(unit) {
    let atk = unit.atk;
    if (unit.atkBuffTimer > 0) atk *= 1.25;
    if (this.overtimeActive) atk *= 1.5;
    return atk;
  },

  performBasicAttack(attacker, target) {
    const rawAtk = this.getEffectiveAtk(attacker);
    attacker.mp = Math.min(attacker.maxMp, attacker.mp + 10 + attacker.bonusManaOnHit);
    attacker.scaleX = 1.18;
    attacker.scaleY = 0.85;
    attacker.tiltAngle = target.renderX >= attacker.renderX ? 0.12 : -0.12;

    if (attacker.range <= 1) {
      const dx = (target.renderX - attacker.renderX) * 0.24;
      const dy = (target.renderY - attacker.renderY) * 0.24;
      attacker.renderX += dx;
      attacker.renderY += dy;

      this.playSfx('hitMelee');
      this.applyBasicDamageAndSplash(attacker, target, rawAtk);
    } else {
      const spec = PUNI_MAP[attacker.id];
      this.playSfx('shoot');
      this.projectiles.push({
        x: attacker.renderX,
        y: attacker.renderY - 26,
        target,
        attacker,
        speed: 400,
        kind: 'orb',
        color: spec ? spec.accent : '#f59e0b',
        radius: attacker.job === '포격수' ? 6.5 : 4.8,
        onArrive: () => {
          if (target.alive) this.applyBasicDamageAndSplash(attacker, target, rawAtk);
        }
      });
    }
  },

  applyBasicDamageAndSplash(attacker, target, rawAtk) {
    const isCrit = attacker.nextCritGuaranteed || Math.random() < attacker.critChance;
    attacker.nextCritGuaranteed = false;
    const dmg = isCrit ? rawAtk * 1.55 : rawAtk;
    this.dealDamage(attacker, target, dmg, { isCrit, isSkill: false });

    if (attacker.splashRatio > 0) {
      const pos = this.tileToCenter(target.row, target.col);
      this.effects.push({
        type: 'ring',
        x: pos.x,
        y: pos.y - 8,
        maxR: 50,
        color: '#fb923c',
        life: 0,
        maxLife: 0.26
      });
      const splashDmg = rawAtk * attacker.splashRatio;
      for (const e of this.units) {
        if (e.isEnemy !== attacker.isEnemy && e.alive && e.uid !== target.uid) {
          if (this.chebyshev(target.row, target.col, e.row, e.col) <= 1) {
            this.dealDamage(attacker, e, splashDmg, { isCrit: false, isSkill: false, silentText: true });
          }
        }
      }
    }
  },

  dealDamage(attacker, target, rawAmount, opts = {}) {
    if (!target || !target.alive) return { dealt: 0, killed: false };

    let amount = rawAmount;
    let isCrit = !!opts.isCrit;

    if (opts.isSkill && attacker) {
      amount *= attacker.skillPowerMult;
      if (!isCrit && attacker.skillCrit && Math.random() < 0.25) {
        isCrit = true;
        amount *= 1.45;
      }
    }

    let effDef = opts.ignoreDef ? 0 : target.def;
    if (attacker && attacker.armorPen > 0) effDef *= (1 - attacker.armorPen);
    if (target.shockTimer > 0) {
      effDef *= 0.80;
      amount *= 1.12;
    }
    effDef = Math.max(0, effDef);

    let finalDmg = amount * (100 / (100 + effDef));
    if (target.dmgReduceTimer > 0) finalDmg *= 0.5;
    if (target.sleepHealTimer > 0) finalDmg *= 0.75;
    finalDmg = Math.max(1, Math.round(finalDmg));

    let hpDmg = finalDmg;
    if (target.shield > 0) {
      if (target.shield >= hpDmg) {
        target.shield -= hpDmg;
        hpDmg = 0;
      } else {
        hpDmg -= target.shield;
        target.shield = 0;
      }
    }

    target.hp = Math.max(0, target.hp - hpDmg);
    target.hitFlash = 1.0;
    target.scaleX = 1.22;
    target.scaleY = 0.80;

    if (target.alive && target.hp > 0) {
      target.mp = Math.min(target.maxMp, target.mp + 5);
    }

    if (opts.isSkill && attacker && attacker.elementalTier > 0 && target.hp > 0) {
      target.shockTimer = Math.max(target.shockTimer, 2.0);
      if (attacker.elementalTier >= 2) {
        for (const near of this.units) {
          if (near.isEnemy === target.isEnemy && near.alive &&
              this.chebyshev(target.row, target.col, near.row, near.col) <= 1) {
            near.chillTimer = Math.max(near.chillTimer, 2.0);
          }
        }
      }
    }

    if (attacker && attacker.alive && finalDmg > 0) {
      const vamp = attacker.omnivamp + (attacker.frenzyTimer > 0 ? 0.35 : 0);
      if (vamp > 0) this.healUnit(attacker, Math.round(finalDmg * vamp), false);
    }

    if (!opts.silentText) {
      const color = isCrit ? '#fde047' : (opts.isSkill ? '#f9a8d4' : '#ffffff');
      const suffix = isCrit ? '!' : '';
      this.addFloatingText(
        target.renderX,
        target.renderY - 46,
        `${finalDmg}${suffix}`,
        color,
        isCrit ? 14.5 : (opts.isSkill ? 13 : 11.5)
      );
    }

    for (let i = 0; i < 5; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 30 + Math.random() * 50;
      this.effects.push({
        type: 'spark',
        x: target.renderX,
        y: target.renderY - 26,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        color: isCrit ? '#facc15' : '#ffffff',
        size: 2.6,
        life: 0,
        maxLife: 0.26
      });
    }

    let killed = false;
    if (target.hp <= 0 && target.alive) {
      target.alive = false;
      killed = true;
      this.spawnDeathBurst(target);
    }

    return { dealt: finalDmg, killed };
  },

  healUnit(unit, amount, showText = true) {
    if (!unit || !unit.alive || amount <= 0) return;
    const val = Math.max(1, Math.round(amount * (this.overtimeActive ? 0.6 : 1.0)));
    const prev = unit.hp;
    unit.hp = Math.min(unit.maxHp, unit.hp + val);
    const actual = unit.hp - prev;
    if (actual > 0 && showText) {
      this.addFloatingText(unit.renderX, unit.renderY - 48, `+${actual}`, '#4ade80', 12);
    }
  },

  spawnDeathBurst(unit) {
    const spec = PUNI_MAP[unit.id];
    for (let i = 0; i < 14; i++) {
      const a = (Math.PI * 2 * i) / 14;
      const spd = 45 + Math.random() * 55;
      this.effects.push({
        type: 'spark',
        x: unit.renderX,
        y: unit.renderY - 24,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        color: spec ? spec.color : '#fda4af',
        size: 3.8,
        life: 0,
        maxLife: 0.42
      });
    }
  },

  // ==========================================================================
  // 30종 고유 궁극기 연출 (이모지 완전 배제 · 커스텀 캔버스 발사체/광선/충격파)
  // ==========================================================================
  castUltimate(u, target, occupied) {
    const spec = PUNI_MAP[u.id];
    const mult = Math.pow(1.8, u.star - 1);
    const atk = this.getEffectiveAtk(u);
    const allies = this.units.filter(a => a.isEnemy === u.isEnemy && a.alive);
    const enemies = this.units.filter(e => e.isEnemy !== u.isEnemy && e.alive);

    this.playSfx('skill', u.cost);
    if (u.cost >= 4) this.triggerShake(u.cost === 5 ? 5.0 : 3.2, 0.24);
    this.addFloatingText(u.renderX, u.renderY - 56, spec.skillName, '#fde047', 11.5);

    const spawnRing = (x, y, maxR, color, maxLife = 0.45) => {
      this.effects.push({ type: 'ring', x, y: y - 6, maxR, color, life: 0, maxLife });
    };
    const spawnBeam = (x1, y1, x2, y2, color, width = 10) => {
      this.effects.push({ type: 'beam', x1, y1: y1 - 24, x2, y2: y2 - 24, color, width, life: 0, maxLife: 0.38 });
    };

    switch (u.id) {
      case 'P01': {
        spawnRing(target.renderX, target.renderY, 38, '#f59e0b');
        this.dealDamage(u, target, atk * 1.45, { isSkill: true });
        if (target.alive) this.dealDamage(u, target, atk * 1.45, { isSkill: true });
        break;
      }
      case 'P02': {
        u.sleepHealTimer = 2.0;
        this.healUnit(u, 350 * mult * u.skillPowerMult, true);
        spawnRing(u.renderX, u.renderY, 44, '#a78bfa');
        break;
      }
      case 'P03': {
        this.projectiles.push({
          x: u.renderX, y: u.renderY - 26, target, attacker: u, speed: 330, kind: 'cookie',
          onArrive: () => {
            spawnRing(target.renderX, target.renderY, 68, '#fb923c');
            for (const e of this.units.filter(x => x.isEnemy !== u.isEnemy && x.alive)) {
              if (this.chebyshev(target.row, target.col, e.row, e.col) <= 1) {
                this.dealDamage(u, e, atk * 1.75, { isSkill: true });
              }
            }
          }
        });
        break;
      }
      case 'P04': {
        const lowestAlly = allies.slice().sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0] || u;
        const shieldAmt = Math.round(320 * mult * u.skillPowerMult);
        lowestAlly.shield += shieldAmt;
        spawnBeam(u.renderX, u.renderY, lowestAlly.renderX, lowestAlly.renderY, '#fb923c', 6);
        spawnRing(lowestAlly.renderX, lowestAlly.renderY, 44, '#f97316');
        this.addFloatingText(lowestAlly.renderX, lowestAlly.renderY - 46, `보호막 +${shieldAmt}`, '#fdba74', 11);
        break;
      }
      case 'P05': {
        u.stealthTimer = 1.5;
        spawnRing(u.renderX, u.renderY, 42, '#e2e8f0');
        this.dealDamage(u, target, atk * 2.4, { isSkill: true, isCrit: true });
        break;
      }
      case 'P06': {
        spawnRing(u.renderX, u.renderY, 76, '#4ade80', 0.55);
        const perSec = 90 * mult * u.skillPowerMult;
        for (const a of allies) {
          if (this.chebyshev(u.row, u.col, a.row, a.col) <= 1) {
            a.regenTimer = 3.0;
            a.regenPerSec = perSec;
            this.healUnit(a, perSec * 0.5, true);
          }
        }
        break;
      }
      case 'P07': {
        target.def = Math.max(0, Math.round(target.def * 0.8));
        spawnBeam(u.renderX, u.renderY, target.renderX, target.renderY, '#ef4444', 10);
        this.dealDamage(u, target, atk * 2.15, { isSkill: true });
        this.addFloatingText(target.renderX, target.renderY - 30, '방어 파쇄', '#fca5a5', 10.5);
        break;
      }
      case 'P08': {
        const topAllies = allies.slice().sort((a, b) => b.atk - a.atk).slice(0, 2);
        for (const a of topAllies) {
          a.aspdBuffTimer = 4.0;
          a.aspdBuffVal = 0.30 * u.skillPowerMult;
          spawnRing(a.renderX, a.renderY, 40, '#34d399');
          this.addFloatingText(a.renderX, a.renderY - 44, '공속 가속', '#6ee7b7', 10.5);
        }
        break;
      }
      case 'P09': {
        u.shield += Math.round(300 * mult * u.skillPowerMult);
        target.stunTimer = Math.max(target.stunTimer, 1.5);
        spawnRing(u.renderX, u.renderY, 45, '#38bdf8');
        spawnRing(target.renderX, target.renderY, 42, '#facc15');
        this.dealDamage(u, target, atk * 1.85, { isSkill: true });
        break;
      }
      case 'P10': {
        spawnRing(u.renderX, u.renderY, 78, '#f472b6', 0.45);
        const slamDmg = u.maxHp * 0.22 + atk * 1.2;
        for (const e of enemies) {
          if (this.chebyshev(u.row, u.col, e.row, e.col) <= 1) {
            this.dealDamage(u, e, slamDmg, { isSkill: true });
          }
        }
        break;
      }
      case 'P11': {
        for (const e of enemies.slice(0, 2)) {
          this.projectiles.push({
            x: u.renderX, y: u.renderY - 26, target: e, attacker: u, speed: 340, kind: 'heart',
            onArrive: () => {
              if (!e.alive) return;
              e.aspdDebuffTimer = 3.5;
              e.stunTimer = Math.max(e.stunTimer, 1.1);
              spawnRing(e.renderX, e.renderY, 38, '#f472b6');
              this.dealDamage(u, e, atk * 1.65, { isSkill: true });
            }
          });
        }
        break;
      }
      case 'P12': {
        target.stunTimer = Math.max(target.stunTimer, 1.5);
        this.triggerShake(2.8, 0.16);
        spawnRing(target.renderX, target.renderY, 56, '#facc15');
        this.dealDamage(u, target, atk * 2.35, { isSkill: true });
        break;
      }
      case 'P13': {
        spawnBeam(u.renderX, u.renderY, target.renderX, target.renderY, '#fbbf24', 8);
        this.dealDamage(u, target, atk * 2.35, { isSkill: true, ignoreDef: true, isCrit: true });
        break;
      }
      case 'P14': {
        u.dmgReduceTimer = 3.0;
        u.shield += Math.round(220 * mult * u.skillPowerMult);
        spawnRing(u.renderX, u.renderY, 64, '#3b82f6', 0.5);
        for (const e of enemies) {
          if (this.chebyshev(u.row, u.col, e.row, e.col) <= 1) {
            this.dealDamage(u, e, atk * 1.35, { isSkill: true });
          }
        }
        break;
      }
      case 'P15': {
        const targets3 = enemies.slice()
          .sort((a, b) => this.chebyshev(u.row, u.col, a.row, a.col) - this.chebyshev(u.row, u.col, b.row, b.col))
          .slice(0, 3);
        for (const e of targets3) {
          this.projectiles.push({
            x: u.renderX, y: u.renderY - 26, target: e, attacker: u, speed: 360, kind: 'citrus',
            onArrive: () => {
              if (!e.alive) return;
              spawnRing(e.renderX, e.renderY, 34, '#fde047');
              this.dealDamage(u, e, atk * 1.85, { isSkill: true });
            }
          });
        }
        break;
      }
      case 'P16': {
        const low3 = allies.slice().sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp)).slice(0, 3);
        const healVal = 280 * mult * u.skillPowerMult;
        for (const a of low3) {
          this.healUnit(a, healVal, true);
          a.atkBuffTimer = 4.0;
          spawnRing(a.renderX, a.renderY, 42, '#fb7185');
        }
        break;
      }
      case 'P17': {
        spawnRing(u.renderX, u.renderY, 82, '#ef4444', 0.5);
        spawnRing(u.renderX, u.renderY, 56, '#f97316', 0.35);
        for (const e of enemies) {
          if (this.chebyshev(u.row, u.col, e.row, e.col) <= 1) {
            this.dealDamage(u, e, atk * 2.45, { isSkill: true });
          }
        }
        break;
      }
      case 'P18': {
        const dx = target.renderX - u.renderX;
        const dy = target.renderY - u.renderY;
        const len = Math.hypot(dx, dy) || 1;
        const endX = u.renderX + (dx / len) * 440;
        const endY = u.renderY + (dy / len) * 440;
        spawnBeam(u.renderX, u.renderY, endX, endY, '#2dd4bf', 16);

        for (const e of enemies) {
          const distToLine = Math.abs(dy * e.renderX - dx * e.renderY + endX * u.renderY - endY * u.renderX) / Math.hypot(endX - u.renderX, endY - u.renderY);
          const dot = (e.renderX - u.renderX) * dx + (e.renderY - u.renderY) * dy;
          if (distToLine <= 36 && dot >= -10) {
            this.dealDamage(u, e, atk * 2.6, { isSkill: true });
          }
        }
        break;
      }
      case 'P19': {
        const healAll = 260 * mult * u.skillPowerMult;
        for (const a of allies) {
          a.stunTimer = 0;
          a.chillTimer = 0;
          a.shockTimer = 0;
          a.aspdDebuffTimer = 0;
          this.healUnit(a, healAll, true);
          spawnRing(a.renderX, a.renderY, 40, '#f472b6');
        }
        break;
      }
      case 'P20': {
        spawnRing(target.renderX, target.renderY, 80, '#38bdf8', 0.55);
        for (const e of enemies) {
          if (this.chebyshev(target.row, target.col, e.row, e.col) <= 1) {
            e.chillTimer = Math.max(e.chillTimer, 2.5);
            e.stunTimer = Math.max(e.stunTimer, 1.2);
            this.dealDamage(u, e, atk * 2.15, { isSkill: true });
          }
        }
        break;
      }
      case 'P21': {
        spawnBeam(u.renderX, u.renderY, target.renderX, target.renderY, '#f59e0b', 11);
        const res = this.dealDamage(u, target, atk * 2.85, { isSkill: true });
        if (res.killed && !u.isEnemy && Math.random() < 0.50) {
          AppState.gold += 1;
          AppState.stats.goldPlundered += 1;
          this.plunderedThisCombat += 1;
          this.addFloatingText(target.renderX, target.renderY - 58, '+1G 약탈!', '#fde047', 14);
          this.playSfx('coin');
        }
        break;
      }
      case 'P22': {
        let bestCenter = target;
        let maxCount = 0;
        for (const cand of enemies) {
          const cnt = enemies.filter(o => this.chebyshev(cand.row, cand.col, o.row, o.col) <= 1).length;
          if (cnt > maxCount) {
            maxCount = cnt;
            bestCenter = cand;
          }
        }
        spawnRing(bestCenter.renderX, bestCenter.renderY, 92, '#ec4899', 0.6);
        for (const e of enemies) {
          if (this.chebyshev(bestCenter.row, bestCenter.col, e.row, e.col) <= 1) {
            this.dealDamage(u, e, atk * 2.9, { isSkill: true });
          }
        }
        break;
      }
      case 'P23': {
        u.frenzyTimer = 4.0;
        spawnRing(u.renderX, u.renderY, 68, '#f43f5e', 0.5);
        this.dealDamage(u, target, atk * 2.1, { isSkill: true });
        break;
      }
      case 'P24': {
        const chainTargets = enemies.slice()
          .sort((a, b) => this.chebyshev(u.row, u.col, a.row, a.col) - this.chebyshev(u.row, u.col, b.row, b.col))
          .slice(0, 4);
        let prevX = u.renderX, prevY = u.renderY;
        for (const e of chainTargets) {
          spawnBeam(prevX, prevY, e.renderX, e.renderY, '#facc15', 7);
          prevX = e.renderX;
          prevY = e.renderY;
          e.mp = Math.max(0, e.mp - 25);
          this.dealDamage(u, e, atk * 2.5, { isSkill: true });
        }
        break;
      }
      case 'P25': {
        spawnRing(u.renderX, u.renderY, 260, '#06b6d4', 0.65);
        for (const e of enemies) this.dealDamage(u, e, atk * 1.85, { isSkill: true });
        for (const a of allies) {
          a.aspdBuffTimer = 3.5;
          a.aspdBuffVal = 0.35 * u.skillPowerMult;
        }
        break;
      }
      case 'P26': {
        const prey = enemies.slice().sort((a, b) => a.hp - b.hp)[0] || target;
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
        for (const [dr, dc] of dirs) {
          const nr = prey.row + dr, nc = prey.col + dc;
          if (nr >= 0 && nr < BOARD_ROWS && nc >= 0 && nc < BOARD_COLS && !occupied[nr][nc]) {
            occupied[u.row][u.col] = null;
            u.row = nr;
            u.col = nc;
            occupied[nr][nc] = u;
            const pos = this.tileToCenter(nr, nc);
            this.startJump(u, pos.x, pos.y, 32, 0.14);
            break;
          }
        }
        spawnBeam(u.renderX, u.renderY, prey.renderX, prey.renderY, '#94a3b8', 9);
        this.dealDamage(u, prey, atk * 3.4, { isSkill: true, isCrit: true });
        break;
      }
      case 'P27': {
        spawnRing(CANVAS_W / 2, CANVAS_H / 2, 280, '#f59e0b', 0.75);
        for (const e of enemies) {
          spawnRing(e.renderX, e.renderY, 48, '#fde047', 0.45);
          this.dealDamage(u, e, atk * 2.65, { isSkill: true });
        }
        for (const a of allies) {
          if (a.uid !== u.uid) {
            a.mp = Math.min(a.maxMp, a.mp + 30);
            this.addFloatingText(a.renderX, a.renderY - 40, '+30 MP', '#7dd3fc', 10);
          }
        }
        break;
      }
      case 'P28': {
        const goldCount = u.isEnemy ? 20 : AppState.gold;
        const goldBoost = 1 + Math.min(1.5, goldCount * 0.03);
        spawnRing(target.renderX, target.renderY, 108, '#facc15', 0.65);
        this.addFloatingText(u.renderX, u.renderY - 42, `골드화력 x${goldBoost.toFixed(2)}`, '#fde047', 11.5);
        for (const e of enemies) {
          if (this.chebyshev(target.row, target.col, e.row, e.col) <= 2) {
            this.dealDamage(u, e, atk * 2.25 * goldBoost, { isSkill: true });
          }
        }
        break;
      }
      case 'P29': {
        u.shield += Math.round(550 * mult * u.skillPowerMult);
        spawnRing(u.renderX, u.renderY, 132, '#38bdf8', 0.65);
        for (const e of enemies) {
          if (this.chebyshev(u.row, u.col, e.row, e.col) <= 2) {
            e.stunTimer = Math.max(e.stunTimer, 1.8);
            e.airborneTimer = 1.4;
            this.dealDamage(u, e, atk * 2.4, { isSkill: true });
          }
        }
        break;
      }
      case 'P30': {
        this.projectiles.push({
          x: u.renderX, y: u.renderY - 28, target, attacker: u, speed: 300, kind: 'bomb',
          onArrive: () => {
            this.triggerShake(6.5, 0.30);
            spawnRing(target.renderX, target.renderY, 130, '#ef4444', 0.65);
            spawnRing(target.renderX, target.renderY, 86, '#facc15', 0.45);
            for (const e of this.units.filter(x => x.isEnemy !== u.isEnemy && x.alive)) {
              if (this.chebyshev(target.row, target.col, e.row, e.col) <= 2) {
                this.dealDamage(u, e, atk * 3.3, { isSkill: true });
              }
            }
          }
        });
        break;
      }
    }
  },

  finishCombat(isWin, survivingEnemies) {
    if (this.combatEnding) return;
    this.combatEnding = true;

    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }

    let hpDamage = 0;
    if (!isWin) {
      hpDamage = 2;
      for (const e of survivingEnemies) {
        hpDamage += e.star + Math.ceil(e.cost * 0.6);
      }
      AppState.playerHp = Math.max(0, AppState.playerHp - hpDamage);
    }

    this.playSfx(isWin ? 'victory' : 'defeat');

    setTimeout(() => {
      if (typeof this.onCombatEndCallback === 'function') {
        this.onCombatEndCallback({
          isWin,
          hpDamage,
          survivingCount: survivingEnemies.length,
          plunderedGold: this.plunderedThisCombat
        });
      }
    }, 650);
  },

  // ==========================================================================
  // 60FPS 2.5D 디오라마 전장 & 3D 스탠딩 피규어 렌더러
  // ==========================================================================
  startRenderLoop() {
    this.lastFrameTime = performance.now();
    const step = (now) => {
      const dt = Math.min(0.05, (now - this.lastFrameTime) / 1000);
      this.lastFrameTime = now;
      this.updateVisuals(dt, now / 1000);
      this.render(now / 1000);
      this.rafId = requestAnimationFrame(step);
    };
    this.rafId = requestAnimationFrame(step);
  },

  updateVisuals(dt, timeSec) {
    if (this.shakeTimer > 0) {
      this.shakeTimer = Math.max(0, this.shakeTimer - dt);
    }

    for (const u of this.units) {
      if (!u.alive) continue;

      if (u.jumpProgress < 1) {
        u.jumpProgress = Math.min(1, u.jumpProgress + dt / Math.max(0.08, u.jumpDuration));
        const t = u.jumpProgress;
        u.renderX = u.jumpStartX + (u.jumpTargetX - u.jumpStartX) * t;
        u.groundY = u.jumpStartY + (u.jumpTargetY - u.jumpStartY) * t;
        u.jumpHeight = Math.sin(t * Math.PI) * u.jumpArcHeight;
        u.renderY = u.groundY - u.jumpHeight;
        if (u.jumpProgress >= 1) {
          u.jumpHeight = 0;
          u.scaleX = 1.18;
          u.scaleY = 0.83;
          u.tiltAngle = 0;
        }
      } else {
        const center = this.tileToCenter(u.row, u.col);
        u.renderX += (center.x - u.renderX) * Math.min(1, dt * 12);
        u.groundY += (center.y - u.groundY) * Math.min(1, dt * 12);
        const airHover = u.airborneTimer > 0 ? (16 + Math.sin(timeSec * 10) * 5) : 0;
        u.jumpHeight = airHover;
        u.renderY = u.groundY - airHover;
      }

      u.scaleX += (1 - u.scaleX) * Math.min(1, dt * 11);
      u.scaleY += (1 - u.scaleY) * Math.min(1, dt * 11);
      u.tiltAngle += (0 - u.tiltAngle) * Math.min(1, dt * 10);
      if (u.hitFlash > 0) u.hitFlash = Math.max(0, u.hitFlash - dt * 5);
      if (u.castPulse > 0) u.castPulse = Math.max(0, u.castPulse - dt * 3);
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const tx = p.target ? p.target.renderX : p.x;
      const ty = p.target ? (p.target.renderY - 24) : p.y;
      const dx = tx - p.x;
      const dy = ty - p.y;
      const dist = Math.hypot(dx, dy);
      const stepDist = p.speed * dt;
      if (dist <= stepDist + 6) {
        if (typeof p.onArrive === 'function') p.onArrive();
        this.projectiles.splice(i, 1);
      } else {
        p.x += (dx / dist) * stepDist;
        p.y += (dy / dist) * stepDist;
      }
    }

    for (let i = this.effects.length - 1; i >= 0; i--) {
      const ef = this.effects[i];
      ef.life += dt;
      if (ef.type === 'spark') {
        ef.x += ef.vx * dt;
        ef.y += ef.vy * dt;
        ef.vy += 110 * dt;
      }
      if (ef.life >= ef.maxLife) this.effects.splice(i, 1);
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life += dt;
      ft.y -= 28 * dt;
      if (ft.life >= ft.maxLife) this.floatingTexts.splice(i, 1);
    }
  },

  render(timeSec) {
    const ctx = this.ctx;
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.save();

    // 카메라 쉐이크 오프셋
    if (this.shakeTimer > 0) {
      const mag = this.shakeIntensity * (this.shakeTimer / 0.28);
      ctx.translate((Math.random() - 0.5) * mag * 2, (Math.random() - 0.5) * mag * 2);
    }

    // 1. 디오라마 배경 및 체스판 아레나 테이블 프레임
    if (this.arenaBgImg) {
      ctx.drawImage(this.arenaBgImg, 0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = 'rgba(28, 18, 12, 0.18)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    } else {
      ctx.fillStyle = '#4a2c1b';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }

    // 마스터크래프트 다크 월넛 체스 보드 베젤 & 황금 인레이 프레임
    const boardLeft = BOARD_PAD_X - 5;
    const boardTop = BOARD_PAD_TOP - 5;
    const boardW = BOARD_COLS * TILE_SIZE + 10;
    const boardH = BOARD_ROWS * TILE_SIZE + 10;

    ctx.save();
    // 외곽 깊은 그림자
    ctx.shadowColor = 'rgba(0, 0, 0, 0.58)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = 'rgba(30, 17, 10, 0.82)';
    this.roundRect(ctx, boardLeft - 2, boardTop - 2, boardW + 4, boardH + 4, 12);
    ctx.fill();
    ctx.restore();

    ctx.save();
    // 외부 브라스 골드 테두리
    ctx.strokeStyle = 'rgba(245, 198, 118, 0.72)';
    ctx.lineWidth = 1.8;
    this.roundRect(ctx, boardLeft, boardTop, boardW, boardH, 10);
    ctx.stroke();

    // 4방향 브라스 코너 장식
    const cornerR = 3.5;
    ctx.fillStyle = '#f5c676';
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1;
    for (const [cx, cy] of [
      [boardLeft + 5, boardTop + 5],
      [boardLeft + boardW - 5, boardTop + 5],
      [boardLeft + 5, boardTop + boardH - 5],
      [boardLeft + boardW - 5, boardTop + boardH - 5]
    ]) {
      ctx.beginPath();
      ctx.arc(cx, cy, cornerR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // 체스 보드 랭크 & 파일 좌표 마킹 (A~E, 1~6)
    ctx.font = '700 8px serif';
    ctx.fillStyle = 'rgba(245, 198, 118, 0.65)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const files = ['A', 'B', 'C', 'D', 'E'];
    for (let c = 0; c < BOARD_COLS; c++) {
      const fx = BOARD_PAD_X + c * TILE_SIZE + TILE_SIZE * 0.5;
      ctx.fillText(files[c], fx, boardTop + boardH - 2.5);
    }
    for (let r = 0; r < BOARD_ROWS; r++) {
      const ry = BOARD_PAD_TOP + r * TILE_SIZE + TILE_SIZE * 0.5;
      ctx.fillText(String(6 - r), boardLeft + 2.5, ry);
    }
    ctx.restore();

    // 2. 클래식 체스판 인레이드 타일 5x6 렌더링
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const x = BOARD_PAD_X + c * TILE_SIZE;
        const y = BOARD_PAD_TOP + r * TILE_SIZE;
        const isEnemyZone = r < 3;
        const isLight = (r + c) % 2 === 0;

        ctx.save();
        if (isEnemyZone) {
          // 적군 진영: 앤틱 로즈우드 & 크림 메이플
          ctx.fillStyle = isLight
            ? 'rgba(248, 238, 225, 0.92)'
            : 'rgba(128, 56, 44, 0.88)';
        } else {
          // 아군 진영: 리치 다크 월넛 & 클래식 아이보리 메이플
          ctx.fillStyle = isLight
            ? 'rgba(250, 244, 232, 0.94)'
            : 'rgba(102, 64, 38, 0.88)';
        }

        const isHovered = AppState.phase === 'PREP' && !isEnemyZone &&
          this.hoverTile && this.hoverTile.row === r && this.hoverTile.col === c;
        const isSelectedTile = AppState.phase === 'PREP' &&
          AppState.selectedSlot && AppState.selectedSlot.zone === 'board' &&
          AppState.selectedSlot.row === r && AppState.selectedSlot.col === c;

        if (isHovered) ctx.fillStyle = 'rgba(56, 189, 248, 0.88)';
        else if (isSelectedTile) ctx.fillStyle = 'rgba(250, 204, 21, 0.88)';

        // 체스 타일 두께감 입체 그림자
        ctx.save();
        ctx.fillStyle = 'rgba(38, 20, 10, 0.45)';
        this.roundRect(ctx, x + 2, y + 3.5, TILE_SIZE - 4, TILE_SIZE - 4, 7);
        ctx.fill();
        ctx.restore();

        // 체스 타일 상판
        this.roundRect(ctx, x + 2, y + 1.5, TILE_SIZE - 4, TILE_SIZE - 5, 7);
        ctx.fill();

        // 정밀 목공 인레이 베벨 하이라이트
        if (isHovered) {
          ctx.strokeStyle = 'rgba(14, 165, 233, 0.95)';
          ctx.lineWidth = 1.8;
        } else if (isSelectedTile) {
          ctx.strokeStyle = 'rgba(253, 224, 71, 0.95)';
          ctx.lineWidth = 1.8;
        } else {
          ctx.strokeStyle = isLight
            ? 'rgba(255, 255, 255, 0.75)'
            : 'rgba(245, 198, 118, 0.45)';
          ctx.lineWidth = 1.0;
        }
        ctx.stroke();

        // 어두운 타일 표면 미세 우드그레인 광택 라인
        if (!isLight && !isHovered && !isSelectedTile) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + 8, y + 8);
          ctx.lineTo(x + TILE_SIZE - 8, y + 8);
          ctx.stroke();
        }

        ctx.restore();
      }
    }

    // 중앙 전선 브라스 메탈 디바이더
    const midY = BOARD_PAD_TOP + 3 * TILE_SIZE;
    ctx.save();
    const divGrad = ctx.createLinearGradient(BOARD_PAD_X, midY, CANVAS_W - BOARD_PAD_X, midY);
    divGrad.addColorStop(0, 'rgba(180, 83, 9, 0.2)');
    divGrad.addColorStop(0.5, 'rgba(251, 191, 36, 0.92)');
    divGrad.addColorStop(1, 'rgba(180, 83, 9, 0.2)');
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(BOARD_PAD_X + 2, midY);
    ctx.lineTo(CANVAS_W - BOARD_PAD_X - 2, midY);
    ctx.stroke();

    // 중앙 다이아몬드 장식 징
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(CANVAS_W / 2, midY - 4.5);
    ctx.lineTo(CANVAS_W / 2 + 5.5, midY);
    ctx.lineTo(CANVAS_W / 2, midY + 4.5);
    ctx.lineTo(CANVAS_W / 2 - 5.5, midY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 3. 바닥 충격파 링 (피규어 아래 레이어)
    for (const ef of this.effects) {
      if (ef.type === 'ring') {
        const p = ef.life / ef.maxLife;
        ctx.save();
        ctx.strokeStyle = ef.color;
        ctx.globalAlpha = Math.max(0, 1 - p);
        ctx.lineWidth = 3.6 * (1 - p * 0.45);
        ctx.beginPath();
        ctx.ellipse(ef.x, ef.y, ef.maxR * p, ef.maxR * p * 0.58, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 4. 2.5D Y-정렬 스탠딩 3D 피규어 렌더링
    const renderQueue = [];
    if (AppState.phase !== 'COMBAT') {
      for (const enemy of this.previewEnemies) {
        renderQueue.push({
          id: enemy.id,
          star: enemy.star,
          isEnemy: true,
          x: enemy.renderX,
          groundY: enemy.groundY,
          jumpHeight: 0,
          scaleX: 1,
          scaleY: 1 + Math.sin(timeSec * 2.5 + enemy.col) * 0.02,
          tiltAngle: 0,
          hpRatio: 1,
          mpRatio: 0,
          shieldRatio: 0,
          isPreview: true,
          isSelected: false
        });
      }

      for (let r = 3; r < 6; r++) {
        for (let c = 0; c < 5; c++) {
          const owned = AppState.board[r][c];
          if (!owned) continue;
          const pos = this.tileToCenter(r, c);
          const isSel = AppState.selectedSlot &&
            AppState.selectedSlot.zone === 'board' &&
            AppState.selectedSlot.row === r && AppState.selectedSlot.col === c;
          renderQueue.push({
            id: owned.id,
            star: owned.star,
            isEnemy: false,
            x: pos.x,
            groundY: pos.y,
            jumpHeight: isSel ? 4 + Math.sin(timeSec * 6) * 2 : 0,
            scaleX: 1 - Math.sin(timeSec * 3.0 + r + c) * 0.015,
            scaleY: 1 + Math.sin(timeSec * 3.0 + r + c) * 0.022,
            tiltAngle: 0,
            hpRatio: 1,
            mpRatio: 0,
            shieldRatio: 0,
            isPreview: false,
            isSelected: !!isSel
          });
        }
      }
    } else {
      for (const u of this.units) {
        if (!u.alive) continue;
        renderQueue.push({
          id: u.id,
          star: u.star,
          isEnemy: u.isEnemy,
          x: u.renderX,
          groundY: u.groundY,
          jumpHeight: u.jumpHeight || 0,
          scaleX: u.scaleX,
          scaleY: u.scaleY,
          tiltAngle: u.tiltAngle || 0,
          hpRatio: u.hp / u.maxHp,
          mpRatio: u.mp / u.maxMp,
          shieldRatio: Math.min(1, u.shield / u.maxHp),
          hitFlash: u.hitFlash,
          stealth: u.stealthTimer > 0,
          stunned: u.stunTimer > 0,
          chilled: u.chillTimer > 0,
          sleeping: u.sleepHealTimer > 0,
          frenzy: u.frenzyTimer > 0,
          shielded: u.shield > 0 || u.dmgReduceTimer > 0
        });
      }
    }

    // 원근감을 위해 뒤쪽 행(groundY 작은 순)부터 앞쪽 행 순서로 정렬 렌더링
    renderQueue.sort((a, b) => a.groundY - b.groundY);
    for (const item of renderQueue) {
      this.drawFigurine3D(ctx, item, timeSec);
    }

    // 5. 레이저 광선 · 스파크 · 커스텀 투사체 렌더링
    for (const ef of this.effects) {
      if (ef.type === 'beam') {
        const alpha = Math.max(0, 1 - ef.life / ef.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = ef.color;
        ctx.lineWidth = ef.width * alpha;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ef.x1, ef.y1);
        ctx.lineTo(ef.x2, ef.y2);
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(2, ef.width * 0.36 * alpha);
        ctx.stroke();
        ctx.restore();
      } else if (ef.type === 'spark') {
        const alpha = Math.max(0, 1 - ef.life / ef.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = ef.color;
        ctx.beginPath();
        ctx.arc(ef.x, ef.y, ef.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    for (const p of this.projectiles) {
      CanvasArt.drawProjectile(ctx, p, timeSec);
    }

    // 6. 드래그 고스트 스탠딩 피규어 미리보기
    if (this.dragGhost && this.dragGhost.unit) {
      ctx.save();
      ctx.globalAlpha = 0.9;
      this.drawFigurine3D(ctx, {
        id: this.dragGhost.unit.id,
        star: this.dragGhost.unit.star,
        isEnemy: false,
        x: this.dragGhost.x,
        groundY: this.dragGhost.y + 10,
        jumpHeight: 10,
        scaleX: 1.06,
        scaleY: 1.06,
        tiltAngle: 0,
        hpRatio: 1,
        mpRatio: 0,
        shieldRatio: 0,
        isSelected: true
      }, timeSec);
      ctx.restore();
    }

    // 7. 플로팅 전투 텍스트
    for (const ft of this.floatingTexts) {
      const alpha = Math.max(0, 1 - Math.pow(ft.life / ft.maxLife, 1.6));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `900 ${ft.size}px "Pretendard", "Malgun Gothic", sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 3.2;
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    ctx.restore();
  },

  // 3D 원통형 받침대 위에 전신 입체 피규어를 세워서 렌더링하는 핵심 함수
  drawFigurine3D(ctx, info, timeSec) {
    const spec = PUNI_MAP[info.id];
    if (!spec) return;
    const costMeta = COST_META[spec.cost];

    const starScale = info.star === 3 ? 1.16 : (info.star === 2 ? 1.07 : 1.0);
    const figW = Math.round(54 * starScale);
    const figH = Math.round(66 * starScale);
    const pedRx = Math.round(21 * starScale);
    const pedRy = Math.round(7.6 * starScale);
    const pedDepth = info.star === 3 ? 6 : 4.8;

    const gx = info.x;
    const gy = info.groundY;
    const jumpH = info.jumpHeight || 0;
    const bodyFootY = gy - jumpH;

    ctx.save();
    if (info.stealth) ctx.globalAlpha *= 0.48;
    if (info.isPreview) ctx.globalAlpha *= 0.92;

    // 점프 높이에 비례해 작아지는 지면 그림자 (점프 중일 때 바닥에 별도 잔류)
    if (jumpH > 2) {
      const shScale = Math.max(0.45, 1 - jumpH * 0.01);
      ctx.fillStyle = 'rgba(24, 14, 8, 0.28)';
      ctx.beginPath();
      ctx.ellipse(gx, gy + 3, pedRx * shScale, pedRy * shScale, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 1) 3D 원통형 미니어처 받침대 렌더링 (아군=코스트 메탈릭, 적군=크림슨 옵시디언)
    const rimCol = info.isEnemy ? '#be123c' : costMeta.pedestalRim;
    const topCol = info.isEnemy ? '#fda4af' : costMeta.pedestalTop;
    CanvasArt.drawPedestal(ctx, gx, bodyFootY, pedRx, pedRy, pedDepth, rimCol, topCol, info.isSelected);

    // 3성 황금 오라 또는 폭주 오라
    if (info.star === 3 || info.frenzy) {
      ctx.save();
      ctx.strokeStyle = info.frenzy ? 'rgba(244, 63, 94, 0.8)' : 'rgba(250, 204, 21, 0.85)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(gx, bodyFootY, pedRx + 4, pedRy + 2.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 2) 발끝(bodyFootY) 기준 Squash & Stretch + 기울기 적용 전신 3D 피규어 본체
    ctx.save();
    ctx.translate(gx, bodyFootY + 2);
    if (info.tiltAngle) ctx.rotate(info.tiltAngle);
    ctx.scale(info.scaleX || 1, info.scaleY || 1);

    // 피규어 입체 드롭 섀도우 & 피격/빙결 필터
    ctx.shadowColor = 'rgba(15, 23, 42, 0.38)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 2;

    if (info.hitFlash > 0.15) {
      ctx.filter = `brightness(${(1 + info.hitFlash * 0.85).toFixed(2)})`;
    } else if (info.chilled) {
      ctx.filter = 'saturate(0.75) brightness(1.12) hue-rotate(155deg)';
    }

    const sprite = AppState.spriteCache[spec.id];
    if (sprite) {
      // 260x320 스프라이트에서 발끝이 하단 y=308 부근에 정렬되어 있으므로 받침대 중앙에 정확히 착지
      ctx.drawImage(sprite, -figW * 0.5, -figH + 3, figW, figH);
    }

    ctx.filter = 'none';
    ctx.shadowColor = 'transparent';

    // 보호막 반구형 크리스탈 돔 연출
    if (info.shielded) {
      const domeGrad = ctx.createRadialGradient(-6, -figH * 0.55, 4, 0, -figH * 0.45, figW * 0.56);
      domeGrad.addColorStop(0, 'rgba(224, 242, 254, 0.08)');
      domeGrad.addColorStop(0.75, 'rgba(56, 189, 248, 0.22)');
      domeGrad.addColorStop(1, 'rgba(125, 211, 252, 0.65)');
      ctx.fillStyle = domeGrad;
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.85)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(0, -figH * 0.44, figW * 0.52, figH * 0.50, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();

    // 3) 머리 위 코스트 배지 · 성급 별 / 3성 왕관 & 상태이상 인디케이터
    const headTopY = bodyFootY - figH * (info.scaleY || 1) + 2;

    // 코스트 배지 (좌측 상단 미니 캡슐)
    if (!info.isEnemy) {
      ctx.save();
      const costBadgeX = gx - 17;
      const costBadgeY = headTopY - 7;
      ctx.fillStyle = costMeta.badge || '#334155';
      this.roundRect(ctx, costBadgeX - 8, costBadgeY, 16, 9, 3);
      ctx.fill();
      ctx.strokeStyle = costMeta.border || '#94a3b8';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.font = '900 7px "Pretendard", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${spec.cost}G`, costBadgeX, costBadgeY + 4.8);
      ctx.restore();
    }

    // 중앙 성급 배지
    const starBadgeX = info.isEnemy ? gx : gx + 5;
    CanvasArt.drawStarBadge(ctx, starBadgeX, headTopY - 3, info.star);

    if (info.stunned || info.sleeping) {
      CanvasArt.drawStatusIndicator(ctx, gx, headTopY - 6, info.stunned, info.sleeping, timeSec);
    }

    // 4) 받침대 전면부 게이지 및 시너지 전술 태그
    if (AppState.phase === 'COMBAT') {
      const barW = 42;
      const barH = 4.2;
      const barX = gx - barW * 0.5;
      const barY = bodyFootY + pedDepth - 0.5;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      this.roundRect(ctx, barX - 1.2, barY - 1.2, barW + 2.4, barH + 4.8, 2.5);
      ctx.fill();

      ctx.fillStyle = info.isEnemy ? '#fb7185' : '#4ade80';
      ctx.fillRect(barX, barY, barW * Math.max(0, Math.min(1, info.hpRatio)), barH);

      if (info.shieldRatio > 0) {
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(barX, barY, barW * Math.min(1, info.shieldRatio), 2);
      }

      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(barX, barY + barH + 0.6, barW * Math.max(0, Math.min(1, info.mpRatio)), 2.2);
    } else {
      // 준비 페이즈: 기물명 + 계열/직업 시너지 태그를 한눈에 보이도록 통합 렌더링
      const shortName = spec.name.replace('쁘니', '');
      const origShort = spec.origin.slice(0, 2);
      const jobShort = spec.job.slice(0, 2);

      const pillY = bodyFootY + pedDepth - 1;
      const totalW = 56;
      const pillH = 20.5;

      ctx.save();
      // 배경 카드 캡슐
      ctx.fillStyle = info.isEnemy ? 'rgba(56, 12, 18, 0.92)' : 'rgba(15, 23, 42, 0.92)';
      this.roundRect(ctx, gx - totalW * 0.5, pillY, totalW, pillH, 5);
      ctx.fill();
      ctx.strokeStyle = info.isEnemy ? 'rgba(244, 63, 94, 0.65)' : (costMeta.border || 'rgba(148, 163, 184, 0.65)');
      ctx.lineWidth = 1.1;
      ctx.stroke();

      // 상단 기물명
      ctx.font = '900 8.5px "Pretendard", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = info.isEnemy ? '#fecdd3' : '#f8fafc';
      ctx.fillText(shortName, gx, pillY + 8);

      // 하단 2개 시너지 배지 (계열 · 직업)
      const synY = pillY + 11.5;
      const tagW = 23;
      const tagH = 7.5;

      // 1) 계열 배지 (좌)
      const origX = gx - tagW - 1.5;
      ctx.fillStyle = 'rgba(51, 65, 85, 0.95)';
      this.roundRect(ctx, origX, synY, tagW, tagH, 2.5);
      ctx.fill();
      ctx.font = '800 6.5px "Pretendard", sans-serif';
      ctx.fillStyle = '#fde68a';
      ctx.textAlign = 'center';
      ctx.fillText(origShort, origX + tagW * 0.5, synY + 5.5);

      // 2) 직업 배지 (우)
      const jobX = gx + 1.5;
      ctx.fillStyle = 'rgba(30, 41, 59, 0.95)';
      this.roundRect(ctx, jobX, synY, tagW, tagH, 2.5);
      ctx.fill();
      ctx.font = '800 6.5px "Pretendard", sans-serif';
      ctx.fillStyle = '#7dd3fc';
      ctx.textAlign = 'center';
      ctx.fillText(jobShort, jobX + tagW * 0.5, synY + 5.5);

      ctx.restore();
    }

    ctx.restore();
  },

  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
};
