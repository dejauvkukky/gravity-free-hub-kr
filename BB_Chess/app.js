// ============================================================================
// 『쁘니토체스 (BB Chess)』 - 메인 앱 컨트롤러, 3D 피규어 로더, 사운드 합성 & 인터랙션
// (사진 업로드 완전 제거 · 이모지 제로 · 커스텀 SVG 문장 및 3D 스탠딩 피규어 UI)
// ============================================================================

// ----------------------------------------------------------------------------
// 1. Tone.js 실시간 사운드 합성 엔진 (+ 오프라인 Web Audio 폴백)
// ----------------------------------------------------------------------------
const SoundEngine = {
  ready: false,
  poly: null,
  membrane: null,
  audioCtx: null,

  async unlock() {
    if (!AppState.soundEnabled || this.ready) return;
    try {
      if (typeof Tone !== 'undefined') {
        await Tone.start();
        this.poly = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.01, decay: 0.14, sustain: 0.05, release: 0.25 }
        }).toDestination();
        this.poly.volume.value = -9;

        this.membrane = new Tone.MembraneSynth({
          pitchDecay: 0.03,
          octaves: 3,
          envelope: { attack: 0.002, decay: 0.12, sustain: 0, release: 0.08 }
        }).toDestination();
        this.membrane.volume.value = -11;
        this.ready = true;
        return;
      }
    } catch (_) {}

    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) {
        this.audioCtx = new Ctx();
        this.ready = true;
      }
    } catch (_) {}
  },

  beepFallback(freq = 440, dur = 0.09, type = 'triangle', vol = 0.08) {
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + dur);
    } catch (_) {}
  },

  play(event, detail = 1) {
    if (!AppState.soundEnabled || !this.ready) return;
    try {
      if (this.poly) {
        const now = Tone.now();
        switch (event) {
          case 'buy':
            this.poly.triggerAttackRelease(['C5', 'E5'], '16n', now);
            break;
          case 'reroll':
            this.poly.triggerAttackRelease('G4', '32n', now);
            this.poly.triggerAttackRelease('B4', '32n', now + 0.05);
            break;
          case 'xp':
            this.poly.triggerAttackRelease('D5', '16n', now);
            this.poly.triggerAttackRelease('A5', '16n', now + 0.07);
            break;
          case 'merge2':
            this.poly.triggerAttackRelease(['C5', 'E5', 'G5'], '8n', now);
            break;
          case 'merge3':
            this.poly.triggerAttackRelease('C5', '16n', now);
            this.poly.triggerAttackRelease('E5', '16n', now + 0.08);
            this.poly.triggerAttackRelease('G5', '16n', now + 0.16);
            this.poly.triggerAttackRelease(['C6', 'E6'], '4n', now + 0.24);
            break;
          case 'hitMelee':
            if (this.membrane) this.membrane.triggerAttackRelease('C2', '32n', now);
            break;
          case 'shoot':
            this.poly.triggerAttackRelease('A5', '64n', now);
            break;
          case 'skill': {
            const notes = ['E5', 'G5', 'A5', 'C6', 'E6'];
            const pick = notes[Math.min(4, Math.max(0, (detail || 1) - 1))];
            this.poly.triggerAttackRelease([pick, 'G5'], '16n', now);
            break;
          }
          case 'coin':
            this.poly.triggerAttackRelease('B5', '32n', now);
            this.poly.triggerAttackRelease('E6', '16n', now + 0.06);
            break;
          case 'combatStart':
            this.poly.triggerAttackRelease(['D4', 'A4', 'D5'], '8n', now);
            break;
          case 'overtime':
            this.poly.triggerAttackRelease(['F5', 'B5'], '8n', now);
            break;
          case 'victory':
            this.poly.triggerAttackRelease('C5', '16n', now);
            this.poly.triggerAttackRelease('E5', '16n', now + 0.09);
            this.poly.triggerAttackRelease('G5', '16n', now + 0.18);
            this.poly.triggerAttackRelease('C6', '8n', now + 0.27);
            break;
          case 'defeat':
            this.poly.triggerAttackRelease('E4', '8n', now);
            this.poly.triggerAttackRelease('C4', '4n', now + 0.14);
            break;
        }
        return;
      }
    } catch (_) {}

    const freqMap = {
      buy: 587, reroll: 440, xp: 660, merge2: 784, merge3: 1046,
      hitMelee: 150, shoot: 680, skill: 880, coin: 1174, victory: 880, defeat: 240
    };
    this.beepFallback(freqMap[event] || 520, 0.08);
  }
};

// ----------------------------------------------------------------------------
// 2. 메인 앱 컨트롤러
// ----------------------------------------------------------------------------
const AppController = {
  dragState: null,
  lastTapInfo: { time: 0, key: '' },
  currentCodexFilter: 'ALL',
  codexViewMode: 'CARD', // 'CARD' (1종씩 보기) | 'GRID' (모아보기)
  currentCodexIndex: 0,
  currentCodexSynIndex: 0,
  codexStarPreview: 1, // 1 | 2 | 3성 미리보기

  async init() {
    this.fitViewport();
    window.addEventListener('resize', () => this.fitViewport());

    // 정적 커스텀 SVG 아이콘 주입
    this.mountStaticIcons();

    ShopSystem.onToastCallback = (msg, type) => this.showToast(msg, type);
    ShopSystem.onSynthesizeCallback = (unitId, newStar, anchor) => {
      const spec = PUNI_MAP[unitId];
      SoundEngine.play(newStar === 3 ? 'merge3' : 'merge2');
      this.showToast(
        `${spec.name} ${newStar}성 피규어 승급 완료!`,
        'success'
      );
      if (anchor.zone === 'board') {
        CombatSystem.spawnCombineCelebration(anchor.row, anchor.col, newStar);
      } else {
        CombatSystem.spawnCombineCelebration(4, 2, newStar);
      }
    };

    CombatSystem.onSoundCallback = (type, detail) => SoundEngine.play(type, detail);
    CombatSystem.onCombatEndCallback = (result) => this.handleCombatEnd(result);

    const canvas = document.getElementById('battle-canvas');
    CombatSystem.init(canvas);

    // 30종 투명 배경 3D 피규어 에셋 프리로드
    await this.preloadFigurineSprites();

    this.startNewGame();
    this.bindEvents();
    this.renderAllUI();
  },

  fitViewport() {
    const wrapper = document.getElementById('device-wrapper');
    if (!wrapper) return;
    const isMobileDevice = window.innerWidth <= 640 || (window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches);
    if (isMobileDevice) {
      wrapper.style.transform = 'none';
      return;
    }
    const scaleX = (window.innerWidth - 24) / 390;
    const scaleY = (window.innerHeight - 24) / 844;
    const scale = Math.min(1, scaleX, scaleY);
    wrapper.style.transform = `scale(${scale.toFixed(4)})`;
  },

  mountStaticIcons() {
    document.getElementById('hud-heart-icon').innerHTML = GameIcons.svg('heart', 15);
    document.getElementById('hud-coin-icon').innerHTML = GameIcons.svg('coin', 16);
    document.getElementById('btn-open-codex').innerHTML = GameIcons.svg('book', 17);
    this.updateFullscreenUI();
    document.getElementById('btn-open-settings').innerHTML = GameIcons.svg('gear', 16);

    document.getElementById('btn-buy-xp').innerHTML = `${GameIcons.svg('xp', 15)}<span>XP</span><span class="text-amber-200">4G</span>`;
    document.getElementById('btn-reroll').innerHTML = `${GameIcons.svg('reroll', 15)}<span>리롤</span><span>2G</span>`;
    document.getElementById('sell-dropzone-icon').innerHTML = GameIcons.svg('sell', 20);
    document.getElementById('btn-inspect-selected').innerHTML = `${GameIcons.svg('inspect', 12)}<span>상세</span>`;

    // 상점 간판 아이콘
    const shopSignIcon = document.getElementById('shop-sign-icon');
    if (shopSignIcon) shopSignIcon.innerHTML = GameIcons.svg('store', 12);

    // 타이틀 스크린 아이콘
    const titleCrown = document.getElementById('title-crown-icon');
    if (titleCrown) titleCrown.innerHTML = GameIcons.svg('crown', 14);
    document.getElementById('title-guide-icon').innerHTML = GameIcons.svg('info', 14);
    document.getElementById('title-codex-icon').innerHTML = GameIcons.svg('book', 14);

    // 도감 뷰 모드 아이콘
    document.getElementById('codex-card-icon').innerHTML = GameIcons.svg('card', 12);
    document.getElementById('codex-grid-icon').innerHTML = GameIcons.svg('grid', 12);

    // 가이드 모달 아이콘
    document.getElementById('guide-modal-crown').innerHTML = GameIcons.svg('crown', 16);
    document.getElementById('guide-card-icon-1').innerHTML = GameIcons.svg('crown', 14);
    document.getElementById('guide-card-icon-2').innerHTML = GameIcons.svg('xp', 14);
    document.getElementById('guide-card-icon-3').innerHTML = GameIcons.svg('coin', 14);
    const g4 = document.getElementById('guide-card-icon-4');
    if (g4) g4.innerHTML = GameIcons.svg('inspect', 14);
    const fc1 = document.getElementById('guide-formula-crown-1');
    if (fc1) fc1.innerHTML = GameIcons.svg('crown', 12);
    const prevIcon = document.getElementById('guide-prev-icon');
    if (prevIcon) prevIcon.innerHTML = GameIcons.svg('leftArrow', 12);
    const nextIcon = document.getElementById('guide-next-icon');
    if (nextIcon) nextIcon.innerHTML = GameIcons.svg('rightArrow', 12);

    // 설정 모달 아이콘
    document.getElementById('settings-header-icon').innerHTML = GameIcons.svg('gear', 16);
    document.getElementById('settings-sound-icon').innerHTML = GameIcons.svg('soundOn', 15);
    document.getElementById('settings-guide-icon').innerHTML = GameIcons.svg('info', 15);
    document.getElementById('settings-restart-icon').innerHTML = GameIcons.svg('restart', 15);
    document.getElementById('settings-title-icon').innerHTML = GameIcons.svg('home', 15);
    const oddsIcon = document.getElementById('settings-odds-icon');
    if (oddsIcon) oddsIcon.innerHTML = GameIcons.svg('coin', 12);
  },

  getFigurineSrc(unitId) {
    return `./assets/figurines/${unitId}.png`;
  },

  async preloadFigurineSprites() {
    const statusEl = document.getElementById('sprite-load-status');
    let loaded = 0;

    await Promise.all(PUNI_LIST.map((u) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        AppState.spriteCache[u.id] = img;
        loaded++;
        resolve();
      };
      img.onerror = () => resolve();
      img.src = this.getFigurineSrc(u.id);
    })));

    if (statusEl) {
      statusEl.textContent = `3D 피규어 ${loaded}종 준비 완료`;
    }
  },

  startNewGame() {
    if (CombatSystem.tickTimer) {
      clearInterval(CombatSystem.tickTimer);
      CombatSystem.tickTimer = null;
    }

    AppState.stage = 1;
    AppState.phase = 'PREP';
    AppState.playerHp = 100;
    AppState.gold = 10;
    AppState.level = 3;
    AppState.xp = 0;
    AppState.streak = 0;
    AppState.shopLocked = false;
    AppState.shopSlots = [null, null, null, null, null];
    AppState.bench = new Array(7).fill(null);
    AppState.board = Array.from({ length: 6 }, () => new Array(5).fill(null));
    AppState.activeSynergies = {};
    AppState.selectedSlot = null;
    AppState.stats = { wins: 0, losses: 0, threeStars: 0, goldPlundered: 0 };

    ShopSystem.initPool();
    ShopSystem.refreshShop(true);
    ShopSystem.recalcSynergies();
    CombatSystem.buildStagePreview();

    document.getElementById('settle-modal').classList.add('hidden');
    this.renderAllUI();
  },

  // ==========================================================================
  // UI 렌더링 동기화
  // ==========================================================================
  renderAllUI() {
    this.renderHud();
    this.renderSynergyStrip();
    this.renderBench();
    this.renderShop();
  },

  renderHud() {
    const wave = STAGE_WAVES[Math.min(AppState.stage - 1, STAGE_WAVES.length - 1)];
    document.getElementById('stage-badge').textContent = `STAGE ${AppState.stage} / 15`;

    document.getElementById('hp-text').textContent = `${AppState.playerHp}`;
    document.getElementById('gold-text').textContent = `${AppState.gold}G`;

    const waveBanner = document.getElementById('wave-banner');
    if (wave) {
      waveBanner.textContent = wave.title;
      waveBanner.className = `pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-extrabold shadow backdrop-blur-sm whitespace-nowrap ${
        wave.boss
          ? 'bg-rose-950/90 text-amber-200 border border-amber-400/70'
          : 'bg-stone-950/78 text-amber-100 border border-amber-400/30'
      }`;
    }

    const boardCount = ShopSystem.getBoardUnitCount();
    document.getElementById('level-text').textContent = `Lv.${AppState.level}`;
    const capEl = document.getElementById('board-cap-text');
    capEl.textContent = `${boardCount}/${AppState.level}`;
    capEl.className = `text-[9.5px] font-black px-1.5 py-[1px] rounded ${
      boardCount >= AppState.level
        ? 'bg-emerald-500/25 text-emerald-300'
        : 'bg-amber-400 text-stone-950 animate-pulse'
    }`;

    const reqXp = LEVEL_TABLE[AppState.level].xpToNext;
    if (AppState.level >= 9 || reqXp === 0) {
      document.getElementById('xp-text').textContent = 'MAX';
      document.getElementById('xp-bar-fill').style.width = '100%';
    } else {
      document.getElementById('xp-text').textContent = `${AppState.xp}/${reqXp}`;
      document.getElementById('xp-bar-fill').style.width = `${Math.min(100, (AppState.xp / reqXp) * 100)}%`;
    }

    // 상점 확률표 갱신 (설정 모달 상태 영역 반영)
    const oddsBar = document.getElementById('odds-bar');
    if (oddsBar) {
      const odds = LEVEL_TABLE[AppState.level].odds;
      const oddsColors = ['#cbd5e1', '#4ade80', '#60a5fa', '#c084fc', '#fbbf24'];
      oddsBar.innerHTML = odds
        .map((pct, i) => `<span style="color:${oddsColors[i]}">${i + 1}코 ${pct}%</span>`)
        .join('<span class="text-stone-600">·</span>');
    }
    this.renderSettingsOdds();

    // 잠금 버튼
    const lockBtn = document.getElementById('btn-lock');
    lockBtn.innerHTML = `${GameIcons.svg(AppState.shopLocked ? 'lockClosed' : 'lockOpen', 14)}<span>${AppState.shopLocked ? '잠김' : '잠금'}</span>`;
    lockBtn.className = `btn-3d btn-3d-slate col-span-2 py-1.5 px-1 text-[10.5px] ${AppState.shopLocked ? 'locked' : ''}`;

    // 전투 시작 버튼
    const startBtn = document.getElementById('btn-start-combat');
    if (AppState.phase === 'COMBAT') {
      startBtn.disabled = true;
      startBtn.innerHTML = `${GameIcons.svg('swords', 15)}<span>교전 중</span>`;
      startBtn.classList.add('opacity-60');
    } else {
      startBtn.disabled = false;
      startBtn.innerHTML = `${GameIcons.svg('swords', 15)}<span>전투 시작</span>`;
      startBtn.classList.remove('opacity-60');
    }

    // 선택된 기물 제어 바
    const selBar = document.getElementById('selected-unit-actions');
    const selUnit = this.getUnitAtLocation(AppState.selectedSlot);
    if (selUnit) {
      selBar.classList.remove('hidden');
      selBar.classList.add('flex');
      const refund = ShopSystem.getSellValue(selUnit);
      document.getElementById('btn-sell-selected').innerHTML = `${GameIcons.svg('sell', 12)}<span>판매 +${refund}G</span>`;
    } else {
      selBar.classList.add('hidden');
      selBar.classList.remove('flex');
    }

    // 골드 툴팁
    const interest = Math.min(5, Math.floor(AppState.gold / 10));
    const absS = Math.abs(AppState.streak);
    const sBonus = absS >= 5 ? 3 : (absS >= 4 ? 2 : (absS >= 2 ? 1 : 0));
    const vSyn = AppState.activeSynergies['모험항해'];
    const vBonus = (vSyn && vSyn.activeTier > 0) ? vSyn.meta.values[vSyn.activeTier - 1] : 0;

    document.getElementById('tooltip-interest').textContent = `+${interest}G`;
    document.getElementById('tooltip-streak').textContent = `+${sBonus}G`;
    document.getElementById('tooltip-voyage').textContent = `+${vBonus}G`;
    document.getElementById('tooltip-streak-badge').textContent =
      AppState.streak > 0 ? `${AppState.streak}연승 중` : (AppState.streak < 0 ? `${Math.abs(AppState.streak)}연패 중` : '연속 없음');

    const soundBtn = document.getElementById('btn-toggle-sound');
    if (soundBtn) {
      soundBtn.innerHTML = GameIcons.svg(AppState.soundEnabled ? 'soundOn' : 'soundOff', 17);
    }
  },

  renderSynergyStrip() {
    const strip = document.getElementById('synergy-strip');
    const countBadge = document.getElementById('synergy-all-count');
    const entries = Object.values(AppState.activeSynergies).sort((a, b) => {
      if ((b.activeTier > 0) !== (a.activeTier > 0)) return b.activeTier > 0 ? 1 : -1;
      if (b.activeTier !== a.activeTier) return b.activeTier - a.activeTier;
      return b.count - a.count;
    });

    const activeCount = entries.filter(s => s.activeTier > 0).length;
    if (countBadge) {
      countBadge.textContent = `${activeCount > 0 ? activeCount : entries.length}`;
      countBadge.className = `px-1.5 py-[0.5px] rounded-full font-black text-[9px] ${
        activeCount > 0 ? 'bg-amber-400 text-stone-950' : 'bg-stone-800 text-stone-400'
      }`;
    }

    if (entries.length === 0) {
      strip.innerHTML = `<span class="text-[10px] text-stone-600 font-bold whitespace-nowrap">전장에 피규어를 배치하세요</span>`;
      return;
    }

    strip.innerHTML = entries.map((syn) => {
      const isActive = syn.activeTier > 0;
      return `
        <button type="button" data-synergy="${syn.name}" class="synergy-pill ${isActive ? 'active' : 'inactive'}">
          ${GameIcons.synergySvg(syn.name, 13)}
          <span>${syn.name}</span>
          <span class="opacity-90 font-black">${syn.count}/${syn.nextThreshold}</span>
        </button>
      `;
    }).join('');
  },

  openAllSynergiesModal() {
    const entries = Object.values(AppState.activeSynergies).sort((a, b) => {
      if ((b.activeTier > 0) !== (a.activeTier > 0)) return b.activeTier > 0 ? 1 : -1;
      if (b.activeTier !== a.activeTier) return b.activeTier - a.activeTier;
      return b.count - a.count;
    });

    const activeList = entries.filter(s => s.activeTier > 0);
    const inProgressList = entries.filter(s => s.activeTier === 0);

    const modal = document.getElementById('detail-modal');
    const title = document.getElementById('detail-modal-title');
    const body = document.getElementById('detail-modal-body');

    title.innerHTML = `${GameIcons.svg('swords', 16)}<span>부대 시너지 현황 (${activeList.length}종 발동 중)</span>`;

    if (entries.length === 0) {
      body.innerHTML = `
        <div class="py-8 text-center text-stone-400 font-bold space-y-2">
          <div>현재 전장에 배치된 피규어가 없습니다.</div>
          <div class="text-[11px] text-stone-500">상점에서 피규어를 영입해 배치하면 시너지가 활성화됩니다.</div>
        </div>
      `;
      modal.classList.remove('hidden');
      return;
    }

    const renderSynCard = (syn) => {
      const meta = syn.meta;
      const isActive = syn.activeTier > 0;
      const tierDesc = isActive ? meta.tierText[syn.activeTier - 1] : `(${syn.nextThreshold}종 배치 시 발동)`;
      const members = PUNI_LIST.filter(u => u.origin === syn.name || u.job === syn.name);

      return `
        <div class="p-3 rounded-xl border ${isActive ? 'bg-amber-950/30 border-amber-500/70' : 'bg-stone-950 border-stone-800'} space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="flex items-center">${GameIcons.synergySvg(syn.name, 18)}</span>
              <div>
                <div class="font-black text-xs text-amber-200">${syn.name} (${meta.type})</div>
                <div class="text-[10px] text-stone-400 font-bold">${meta.desc}</div>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded-full font-black text-[10px] shrink-0 ${
              isActive ? 'bg-amber-400 text-stone-950' : 'bg-stone-800 text-stone-400'
            }">
              ${isActive ? `${syn.activeTier}단계 발동 (${syn.count}종)` : `발동 대기 (${syn.count}/${syn.nextThreshold})`}
            </span>
          </div>

          <div class="text-[11px] font-bold ${isActive ? 'text-amber-300' : 'text-stone-400'} bg-black/40 p-2 rounded-lg border border-stone-800">
            ${isActive ? `효과: ${tierDesc}` : `다음 단계 효과: ${tierDesc}`}
          </div>

          <div>
            <div class="text-[9.5px] text-stone-400 font-bold mb-1">소속 기물 (${members.length}종):</div>
            <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              ${members.map(u => {
                const isDeployed = AppState.board.some(row => row.some(tile => tile && tile.id === u.id));
                return `
                  <button type="button" data-open-unit="${u.id}" class="shrink-0 p-1 rounded-lg border flex items-center gap-1 text-[9.5px] font-bold ${
                    isDeployed ? 'border-amber-400/80 bg-amber-950/40 text-amber-200' : 'border-stone-800 bg-stone-900 text-stone-400'
                  }">
                    <img src="${this.getFigurineSrc(u.id)}" class="w-5 h-6 object-contain" />
                    <span>${u.name.replace('쁘니', '')}</span>
                  </button>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      `;
    };

    body.innerHTML = `
      ${activeList.length > 0 ? `
        <div class="space-y-2">
          <div class="font-black text-amber-300 text-xs flex items-center gap-1">
            <span>발동 중인 시너지 (${activeList.length})</span>
          </div>
          <div class="space-y-2">
            ${activeList.map(renderSynCard).join('')}
          </div>
        </div>
      ` : ''}

      ${inProgressList.length > 0 ? `
        <div class="space-y-2 pt-2">
          <div class="font-black text-stone-400 text-xs flex items-center gap-1">
            <span>발동 대기 중인 시너지 (${inProgressList.length})</span>
          </div>
          <div class="space-y-2">
            ${inProgressList.map(renderSynCard).join('')}
          </div>
        </div>
      ` : ''}
    `;

    modal.classList.remove('hidden');
    modal.querySelectorAll('[data-open-unit]').forEach(btn => {
      btn.onclick = () => this.openUnitDetailModal(btn.dataset.openUnit, 1);
    });
  },

  // 7칸 원목 피규어 진열대 렌더링 (코스트 · 성급 · 시너지 및 입체 3D 피규어 배치)
  renderBench() {
    const container = document.getElementById('bench-grid');
    container.innerHTML = AppState.bench.map((unit, idx) => {
      const isSelected = AppState.selectedSlot &&
        AppState.selectedSlot.zone === 'bench' &&
        AppState.selectedSlot.idx === idx;

      if (!unit) {
        return `<div class="bench-slot" data-bench-idx="${idx}">
          <span class="relative z-10 text-[9px] text-amber-200/35 font-extrabold my-auto">${idx + 1}</span>
        </div>`;
      }

      const spec = PUNI_MAP[unit.id];
      const costMeta = COST_META[spec.cost];
      const figSrc = this.getFigurineSrc(spec.id);
      const shortName = spec.name.replace('쁘니', '');

      return `
        <div class="bench-slot occupied ${isSelected ? 'selected' : ''}"
             style="border-color:${costMeta.border};"
             data-bench-idx="${idx}">
          <!-- 상단 일체형 정보 헤더: 성급 & 코스트 (얼굴 가림 없는 독립 바) -->
          <div class="bench-slot-header" style="background:${costMeta.badge};">
            <span class="flex items-center">${GameIcons.starsHtml(unit.star, 8)}</span>
            <span class="text-[8px] font-black text-white leading-none">${spec.cost}G</span>
          </div>

          <!-- 중앙 완전 개방 3D 피규어 무대 (머리부터 발끝까지 100% 노출) -->
          <div class="bench-stage-body">
            <div class="bench-pedestal" style="background: radial-gradient(circle at 40% 35%, ${costMeta.pedestalTop}, ${costMeta.pedestalRim});"></div>
            <img src="${figSrc}" alt="${spec.name}" class="bench-figurine-img" />
          </div>

          <!-- 하단 통합 명패: [계열아이콘 | 기물명 | 직업아이콘] -->
          <div class="bench-slot-footer">
            <span class="bench-syn-icon" title="${spec.origin}">${GameIcons.synergySvg(spec.origin, 9)}</span>
            <span class="bench-name-text">${shortName}</span>
            <span class="bench-syn-icon" title="${spec.job}">${GameIcons.synergySvg(spec.job, 9)}</span>
          </div>
        </div>
      `;
    }).join('');
  },

  countOwnedCopies(unitId) {
    let oneStar = 0;
    let total = 0;
    for (const b of AppState.bench) {
      if (b && b.id === unitId) {
        total++;
        if (b.star === 1) oneStar++;
      }
    }
    for (let r = 3; r < 6; r++) {
      for (let c = 0; c < 5; c++) {
        const u = AppState.board[r][c];
        if (u && u.id === unitId) {
          total++;
          if (u.star === 1) oneStar++;
        }
      }
    }
    return { oneStar, total };
  },

  // 5칸 컬렉터 블리스터 상점 카드 렌더링
  renderShop() {
    const container = document.getElementById('shop-cards');
    container.innerHTML = AppState.shopSlots.map((slot, idx) => {
      if (!slot || slot.purchased) {
        return `<div class="shop-card empty flex flex-col items-center justify-center p-1">
          <div class="w-8 h-2 rounded-full bg-stone-950/60 mb-1 border border-stone-800/80"></div>
          <span class="text-[9.5px] text-amber-200/50 font-extrabold">영입 완료</span>
          <span class="text-[7.5px] text-stone-500 font-bold">SOLD OUT</span>
        </div>`;
      }

      const spec = PUNI_MAP[slot.id];
      const costMeta = COST_META[spec.cost];
      const figSrc = this.getFigurineSrc(spec.id);
      const owned = this.countOwnedCopies(spec.id);
      const mergeReady = owned.oneStar >= 2;
      const canAfford = AppState.gold >= spec.cost;

      return `
        <div class="shop-card cost-${spec.cost} ${mergeReady ? 'merge-ready' : ''} ${!canAfford ? 'opacity-70' : ''}"
             data-shop-idx="${idx}">
          <!-- 상단 3D 피규어 스포트라이트 스테이지 -->
          <div class="shop-stage-box" style="background:${costMeta.cardBg}">
            <div class="shop-stage-disc"></div>
            <img src="${figSrc}" alt="${spec.name}" class="shop-figurine-img pointer-events-none" />

            <!-- 우측 상단 코스트 배지 -->
            <span class="absolute top-1 right-1 z-10 px-1.5 py-[1px] rounded-md text-[9.5px] font-black text-white shadow"
                  style="background:${costMeta.badge}">
              ${spec.cost}G
            </span>

            <!-- 좌측 상단 보유 / 합체 가능 알림 -->
            ${mergeReady
              ? `<span class="absolute top-1 left-1 z-10 px-1.5 py-[1px] rounded bg-amber-400 border border-yellow-100 text-stone-950 text-[8.5px] font-black shadow">합체</span>`
              : (owned.total > 0
                ? `<span class="absolute top-1 left-1 z-10 px-1.5 py-[1px] rounded bg-stone-950/85 text-amber-300 text-[8px] font-extrabold">보유</span>`
                : '')}
          </div>

          <!-- 하단 명패 및 시너지 문장 -->
          <div class="flex-1 px-1 py-1 bg-stone-900 text-stone-100 border-t border-stone-700/80 flex flex-col justify-between">
            <div class="font-black text-[10px] text-center truncate text-amber-100 leading-tight">${spec.name}</div>
            <div class="space-y-0.5 text-[8.5px] font-bold text-stone-300 leading-tight">
              <div class="flex items-center gap-1 bg-stone-800/90 rounded px-1 py-[1px] truncate">
                ${GameIcons.synergySvg(spec.origin, 11)}<span class="truncate">${spec.origin}</span>
              </div>
              <div class="flex items-center gap-1 bg-stone-800/90 rounded px-1 py-[1px] truncate">
                ${GameIcons.synergySvg(spec.job, 11)}<span class="truncate">${spec.job}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  getUnitAtLocation(loc) {
    if (!loc) return null;
    if (loc.zone === 'bench') return AppState.bench[loc.idx];
    if (loc.zone === 'board') return AppState.board[loc.row]?.[loc.col] || null;
    return null;
  },

  showToast(message, type = 'info') {
    const layer = document.getElementById('toast-layer');
    if (!layer) return;
    const div = document.createElement('div');
    const extraClass = type === 'warn' ? 'toast-warn' : (type === 'success' ? 'toast-success' : '');
    div.className = `toast-msg ${extraClass}`;
    div.textContent = message;
    layer.appendChild(div);
    setTimeout(() => div.remove(), 2200);
  },

  // ==========================================================================
  // 전투 정산 · 클리어 · 게임오버 모달
  // ==========================================================================
  handleCombatEnd(result) {
    document.getElementById('combat-timer-pill').classList.add('hidden');

    if (AppState.playerHp <= 0) {
      AppState.phase = 'GAMEOVER';
      this.openEndGameModal(false);
      return;
    }

    if (result.isWin && AppState.stage >= 15) {
      AppState.stats.wins += 1;
      AppState.phase = 'VICTORY';
      this.openEndGameModal(true);
      return;
    }

    AppState.phase = 'SETTLE';
    const econ = ShopSystem.settleRoundEconomy(result.isWin);
    this.openSettlementModal(result, econ);
    this.renderAllUI();
  },

  openSettlementModal(result, econ) {
    const modal = document.getElementById('settle-modal');
    const header = document.getElementById('settle-header');
    const body = document.getElementById('settle-body');
    const btn = document.getElementById('btn-next-round');

    header.className = `px-4 py-3 text-center text-white font-black text-base flex items-center justify-center gap-2 ${
      result.isWin ? 'bg-emerald-700' : 'bg-rose-800'
    }`;
    header.innerHTML = result.isWin
      ? `${GameIcons.svg('trophy', 18)}<span>STAGE ${AppState.stage} 승리</span>`
      : `${GameIcons.svg('heart', 17)}<span>STAGE ${AppState.stage} 패배 (-${result.hpDamage} HP)</span>`;

    const streakLabel = econ.streak > 0
      ? `${econ.streak}연승 보너스`
      : `${Math.abs(econ.streak)}연패 지원금`;

    body.innerHTML = `
      <div class="bg-stone-950/85 rounded-xl p-3.5 border border-stone-800 space-y-1.5 text-stone-200">
        <div class="flex justify-between font-bold">
          <span>기본 라운드 보수</span><span class="text-emerald-400">+${econ.baseGold}G</span>
        </div>
        <div class="flex justify-between font-bold">
          <span>보유 골드 이자</span><span class="text-amber-300">+${econ.interestGold}G</span>
        </div>
        <div class="flex justify-between font-bold">
          <span>${streakLabel}</span><span class="text-sky-300">+${econ.streakGold}G</span>
        </div>
        ${econ.voyageGold > 0 ? `
          <div class="flex justify-between font-extrabold text-cyan-300 items-center">
            <span class="inline-flex items-center gap-1">${GameIcons.svg('chest', 14)} 모험항해 보물상자</span>
            <span>+${econ.voyageGold}G</span>
          </div>` : ''}
        ${result.plunderedGold > 0 ? `
          <div class="flex justify-between font-extrabold text-amber-300 items-center">
            <span class="inline-flex items-center gap-1">${GameIcons.svg('coin', 14)} 해적쁘니 전투 약탈</span>
            <span>+${result.plunderedGold}G (지급됨)</span>
          </div>` : ''}
        <div class="border-t border-stone-700 pt-2 mt-1 flex justify-between text-sm font-black text-white">
          <span>라운드 정산 합계</span><span class="text-amber-300">+${econ.totalEarned}G (보유 ${AppState.gold}G)</span>
        </div>
      </div>
      <div class="text-center text-[11px] text-stone-400 font-bold">
        라운드 경험치 +2 XP 획득 ${econ.leveledUp ? '· 레벨 업 달성!' : ''}
      </div>
    `;

    btn.textContent = `STAGE ${AppState.stage + 1} 준비하기`;
    btn.onclick = () => this.advanceToNextStage();
    modal.classList.remove('hidden');
  },

  openEndGameModal(isVictory) {
    const modal = document.getElementById('settle-modal');
    const header = document.getElementById('settle-header');
    const body = document.getElementById('settle-body');
    const btn = document.getElementById('btn-next-round');

    header.className = `px-4 py-3.5 text-center text-white font-black text-base flex items-center justify-center gap-2 ${
      isVictory ? 'bg-gradient-to-r from-amber-600 to-rose-600' : 'bg-stone-800'
    }`;
    header.innerHTML = isVictory
      ? `${GameIcons.svg('crown', 20)}<span>15스테이지 완전 제패 달성!</span>`
      : `<span>게임 오버 · 도전 종료</span>`;

    body.innerHTML = `
      <div class="flex flex-col items-center text-center py-1 gap-2">
        <img src="${this.getFigurineSrc(isVictory ? 'P27' : 'P02')}" class="w-20 h-24 object-contain drop-shadow-xl" />
        <p class="font-bold text-stone-200 leading-relaxed">
          ${isVictory
            ? '여왕 시크릿의 별빛 왕좌를 정복하고 최고의 쁘니 마스터에 등극했습니다!'
            : `STAGE ${AppState.stage}에서 아쉽게 여정을 마쳤습니다.`}
        </p>
      </div>
      <div class="bg-stone-950 rounded-xl p-3 border border-stone-800 space-y-1.5 font-bold text-stone-300">
        <div class="flex justify-between"><span>도달 스테이지</span><span class="text-amber-300">STAGE ${AppState.stage} / 15</span></div>
        <div class="flex justify-between"><span>통산 전적</span><span>${AppState.stats.wins}승 ${AppState.stats.losses}패</span></div>
        <div class="flex justify-between"><span>완성한 3성 피규어</span><span class="text-amber-300">${AppState.stats.threeStars}기</span></div>
        <div class="flex justify-between"><span>해적 약탈 골드</span><span>${AppState.stats.goldPlundered}G</span></div>
      </div>
    `;

    btn.textContent = '새 게임 시작하기';
    btn.onclick = () => this.startNewGame();
    modal.classList.remove('hidden');
  },

  advanceToNextStage() {
    document.getElementById('settle-modal').classList.add('hidden');
    AppState.stage = Math.min(15, AppState.stage + 1);
    AppState.phase = 'PREP';

    ShopSystem.checkAutoCombine();

    if (!AppState.shopLocked) {
      ShopSystem.refreshShop(true);
    } else {
      AppState.shopLocked = false;
      this.showToast('잠긴 상점 목록이 유지되었습니다.', 'info');
    }

    ShopSystem.recalcSynergies();
    CombatSystem.buildStagePreview();
    this.renderAllUI();
  },

  // ==========================================================================
  // 피규어 상세 & 시너지 상세 & 30종 컬렉션 도감 모달
  // ==========================================================================
  openUnitDetailModal(unitId, star = 1, location = null) {
    const spec = PUNI_MAP[unitId];
    if (!spec) return;
    const modal = document.getElementById('detail-modal');
    const title = document.getElementById('detail-modal-title');
    const body = document.getElementById('detail-modal-body');

    const mult = Math.pow(1.8, star - 1);
    const hp = Math.round(spec.hp * mult);
    const atk = Math.round(spec.atk * mult);
    const def = spec.cost * 10;
    const costMeta = COST_META[spec.cost];
    const remainPool = AppState.pool[spec.id] ?? costMeta.poolSize;

    title.innerHTML = `<span>${spec.name}</span><span class="ml-1 flex items-center">${GameIcons.starsHtml(star, 12)}</span>`;
    body.innerHTML = `
      <div class="flex items-center gap-3.5">
        <div class="relative w-24 h-28 rounded-2xl flex items-end justify-center p-1.5 border-2 shadow-inner shrink-0"
             style="background:${costMeta.cardBg}; border-color:${costMeta.border}">
          <div class="shop-stage-disc"></div>
          <img src="${this.getFigurineSrc(spec.id)}" alt="${spec.name}" class="relative z-10 w-20 h-24 object-contain drop-shadow-lg" />
        </div>

        <div class="flex-1 space-y-1.5">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="px-2 py-0.5 rounded-md text-white font-black text-[10.5px]" style="background:${costMeta.badge}">${spec.cost}코스트</span>
            <span class="px-2 py-0.5 rounded-md bg-stone-800 border border-stone-700 font-bold text-[10.5px] inline-flex items-center gap-1">
              ${GameIcons.synergySvg(spec.origin, 13)} ${spec.origin}
            </span>
            <span class="px-2 py-0.5 rounded-md bg-stone-800 border border-stone-700 font-bold text-[10.5px] inline-flex items-center gap-1">
              ${GameIcons.synergySvg(spec.job, 13)} ${spec.job}
            </span>
          </div>

          <div class="text-[11px] text-stone-400 font-bold">
            공유 풀 잔여 수량: <b class="text-amber-300">${remainPool}</b> / ${costMeta.poolSize}기
          </div>

          <div class="grid grid-cols-4 gap-1 pt-0.5 text-center">
            <div class="bg-stone-950 rounded-lg p-1.5 border border-stone-800"><div class="text-[9px] text-stone-400">체력</div><div class="font-black text-rose-400">${hp}</div></div>
            <div class="bg-stone-950 rounded-lg p-1.5 border border-stone-800"><div class="text-[9px] text-stone-400">공격력</div><div class="font-black text-amber-300">${atk}</div></div>
            <div class="bg-stone-950 rounded-lg p-1.5 border border-stone-800"><div class="text-[9px] text-stone-400">방어력</div><div class="font-black text-sky-300">${def}</div></div>
            <div class="bg-stone-950 rounded-lg p-1.5 border border-stone-800"><div class="text-[9px] text-stone-400">사거리</div><div class="font-black text-purple-300">${spec.range}칸</div></div>
          </div>
        </div>
      </div>

      <div class="bg-stone-950 rounded-xl p-3 border border-amber-500/35">
        <div class="font-black text-amber-300 mb-1">고유 궁극기 · ${spec.skillName} (마나 100)</div>
        <p class="text-stone-300 leading-relaxed">${spec.skillDesc}</p>
      </div>

      <div class="text-[10.5px] text-stone-400 bg-stone-950/60 rounded-xl p-2.5 border border-stone-800">
        <b class="text-stone-200">성급 배율(1.8x):</b>
        1성(${spec.hp}/${spec.atk}) → 2성(${Math.round(spec.hp * 1.8)}/${Math.round(spec.atk * 1.8)}) → 3성(${Math.round(spec.hp * 3.24)}/${Math.round(spec.atk * 3.24)})
      </div>

      ${location && AppState.phase === 'PREP' ? `
        <div class="flex gap-2 pt-1">
          ${location.zone === 'bench' ? `
            <button id="modal-btn-deploy" type="button" class="btn-3d btn-3d-blue flex-1 py-2 text-xs">전장 자동 배치</button>
          ` : ''}
          <button id="modal-btn-sell" type="button" class="btn-3d btn-3d-battle flex-1 py-2 text-xs">
            피규어 판매 (+${ShopSystem.getSellValue({ id: unitId, star })}G)
          </button>
        </div>
      ` : ''}
    `;

    modal.classList.remove('hidden');

    const deployBtn = document.getElementById('modal-btn-deploy');
    if (deployBtn && location) {
      deployBtn.onclick = () => {
        if (ShopSystem.autoDeployUnit(location.idx)) {
          SoundEngine.play('buy');
          modal.classList.add('hidden');
          this.renderAllUI();
        }
      };
    }

    const sellBtn = document.getElementById('modal-btn-sell');
    if (sellBtn && location) {
      sellBtn.onclick = () => {
        if (ShopSystem.sellUnitFrom(location)) {
          SoundEngine.play('coin');
          modal.classList.add('hidden');
          this.renderAllUI();
        }
      };
    }
  },

  openSynergyDetailModal(synName) {
    const meta = SYNERGY_DB[synName];
    if (!meta) return;
    const activeInfo = AppState.activeSynergies[synName];
    const currentCount = activeInfo ? activeInfo.count : 0;
    const activeTier = activeInfo ? activeInfo.activeTier : 0;

    const members = PUNI_LIST.filter(u => u.origin === synName || u.job === synName);
    const modal = document.getElementById('detail-modal');
    document.getElementById('detail-modal-title').innerHTML =
      `${GameIcons.synergySvg(synName, 18)}<span>${meta.name} (${meta.type} 시너지)</span>`;

    document.getElementById('detail-modal-body').innerHTML = `
      <p class="text-stone-200 font-medium leading-relaxed bg-stone-950 p-3 rounded-xl border border-stone-800">
        ${meta.desc}
      </p>

      <div class="space-y-1.5">
        <div class="font-extrabold text-amber-200">시너지 발동 단계 (현재 배치: ${currentCount}종)</div>
        ${meta.thresholds.map((th, idx) => {
          const on = activeTier === idx + 1;
          return `
            <div class="px-3 py-2 rounded-xl border font-bold flex items-center justify-between ${
              on ? 'bg-amber-400/20 border-amber-400 text-amber-200' : 'bg-stone-950 border-stone-800 text-stone-400'
            }">
              <span>(${th}) 단계</span>
              <span>${meta.tierText[idx]}</span>
            </div>
          `;
        }).join('')}
      </div>

      <div>
        <div class="font-extrabold text-amber-200 mb-1.5">소속 3D 피규어 (${members.length}종)</div>
        <div class="grid grid-cols-3 gap-1.5">
          ${members.map(u => `
            <button type="button" data-open-unit="${u.id}" class="p-1.5 rounded-xl border border-stone-700 bg-stone-950 hover:border-amber-400 flex items-center gap-1.5 text-left">
              <img src="${this.getFigurineSrc(u.id)}" class="w-9 h-10 object-contain shrink-0 drop-shadow" />
              <div class="min-w-0">
                <div class="font-black text-[10.5px] text-stone-100 truncate">${u.name}</div>
                <div class="text-[9.5px] font-extrabold" style="color:${COST_META[u.cost].border}">${u.cost}G</div>
              </div>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    modal.querySelectorAll('[data-open-unit]').forEach(btn => {
      btn.onclick = () => this.openUnitDetailModal(btn.dataset.openUnit, 1);
    });
  },

  openCodexModal(filter = 'ALL') {
    this.currentCodexFilter = filter;
    if (filter === 'SYN') {
      this.currentCodexIndex = 0;
    }
    const modal = document.getElementById('codex-modal');
    modal.classList.remove('hidden');
    this.renderCodex();
  },

  renderCodex() {
    const filter = this.currentCodexFilter;
    const body = document.getElementById('codex-body');
    const btnCardView = document.getElementById('btn-codex-card-view');
    const btnGridView = document.getElementById('btn-codex-grid-view');

    // 탭 하이라이트 동기화
    document.querySelectorAll('.codex-tab').forEach(tab => {
      const active = tab.dataset.filter === filter;
      tab.className = `codex-tab px-2.5 py-1 rounded-lg ${
        active ? 'bg-amber-400 text-stone-950 font-black' : 'bg-stone-800 text-stone-300'
      }`;
    });

    // 뷰 모드 토글 버튼 하이라이트 동기화
    if (this.codexViewMode === 'CARD') {
      btnCardView.className = 'px-2 py-1 rounded text-[10px] font-black flex items-center gap-1 bg-amber-400 text-stone-950 shadow';
      btnGridView.className = 'px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 text-stone-300 hover:text-white';
    } else {
      btnCardView.className = 'px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 text-stone-300 hover:text-white';
      btnGridView.className = 'px-2 py-1 rounded text-[10px] font-black flex items-center gap-1 bg-amber-400 text-stone-950 shadow';
    }

    if (filter === 'SYN') {
      const synList = Object.values(SYNERGY_DB);
      this.currentCodexSynIndex = Math.max(0, Math.min(synList.length - 1, this.currentCodexSynIndex));

      if (this.codexViewMode === 'CARD') {
        // ================= 1. 시너지 단일 카드 넘기기 뷰 =================
        const syn = synList[this.currentCodexSynIndex];
        const members = PUNI_LIST.filter(u => u.origin === syn.name || u.job === syn.name);
        const activeInfo = AppState.activeSynergies[syn.name];
        const currentCount = activeInfo ? activeInfo.count : 0;
        const activeTier = activeInfo ? activeInfo.activeTier : 0;

        body.innerHTML = `
          <div class="flex flex-col gap-2.5 h-full">
            <!-- 상단 시너지 좌우 넘기기 인디케이터 바 -->
            <div class="flex items-center justify-between bg-stone-950/80 px-3 py-1.5 rounded-xl border border-stone-800">
              <button id="btn-codex-syn-prev" type="button" class="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 flex items-center gap-1 font-black text-xs active:scale-95 transition-all">
                ${GameIcons.svg('leftArrow', 13)}
                <span>이전</span>
              </button>
              <div class="text-center">
                <span class="text-stone-400 text-[10px] font-bold">시너지</span>
                <span class="text-amber-300 font-black text-xs ml-1">${this.currentCodexSynIndex + 1} / ${synList.length}</span>
              </div>
              <button id="btn-codex-syn-next" type="button" class="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 flex items-center gap-1 font-black text-xs active:scale-95 transition-all">
                <span>다음</span>
                ${GameIcons.svg('rightArrow', 13)}
              </button>
            </div>

            <!-- 메인 시너지 엠블럼 쇼케이스 카드 -->
            <div class="relative rounded-2xl p-4 border-2 shadow-2xl flex flex-col items-center codex-stage-glow"
                 style="background: radial-gradient(circle at 50% 35%, rgba(45, 30, 20, 0.95) 0%, rgba(18, 12, 10, 0.98) 100%); border-color: ${syn.color || '#f59e0b'};">
              <span class="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-black text-stone-950 bg-amber-400 shadow">
                ${syn.type} 특성
              </span>
              <span class="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-extrabold text-amber-200 bg-stone-900 border border-stone-700">
                발동: ${syn.thresholds.join(' / ')}기
              </span>

              <div class="w-16 h-16 rounded-2xl p-2.5 bg-stone-950/80 border border-amber-400/50 flex items-center justify-center my-1.5 shadow-inner">
                ${GameIcons.synergySvg(syn.name, 42)}
              </div>

              <div class="font-black text-lg text-amber-200 tracking-wide text-center">
                ${syn.name}
              </div>
              <p class="text-stone-300 text-center text-xs mt-1 leading-relaxed max-w-xs">
                ${syn.desc}
              </p>
            </div>

            <!-- 단계별 발동 효과 테이블 -->
            <div class="bg-stone-950 rounded-xl p-2.5 border border-stone-800 space-y-1.5">
              <div class="font-extrabold text-[11px] text-amber-300 flex items-center justify-between">
                <span>단계별 발동 효과</span>
                <span class="text-[9.5px] text-stone-400">현재 전장 배치: ${currentCount}종</span>
              </div>
              ${syn.thresholds.map((th, idx) => `
                <div class="px-2.5 py-1.5 rounded-lg border flex items-center justify-between text-xs ${
                  activeTier === idx + 1
                    ? 'bg-amber-400/20 border-amber-400 text-amber-200 font-black'
                    : 'bg-stone-900/80 border-stone-800 text-stone-300 font-bold'
                }">
                  <span class="text-amber-400 font-black">(${th}) 단계</span>
                  <span class="text-right text-[11px]">${syn.tierText[idx]}</span>
                </div>
              `).join('')}
            </div>

            <!-- 소속 3D 피규어 컬렉션 (터치 시 해당 피규어 도감 카드로 즉시 이동) -->
            <div class="bg-stone-950 rounded-xl p-2.5 border border-stone-800 space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="font-extrabold text-[11px] text-amber-300">소속 3D 피규어 (${members.length}종)</span>
                <span class="text-[9px] text-stone-400 font-bold">터치하여 피규어 상세 보기</span>
              </div>
              <div class="grid grid-cols-3 gap-1.5">
                ${members.map(u => {
                  const costMeta = COST_META[u.cost];
                  return `
                    <button type="button" data-jump-to-unit="${u.id}"
                            class="p-1.5 rounded-xl border bg-stone-900 hover:border-amber-400 flex flex-col items-center text-center transition-all active:scale-95 shadow"
                            style="border-color:${costMeta.border}">
                      <img src="${this.getFigurineSrc(u.id)}" class="w-10 h-12 object-contain drop-shadow" />
                      <span class="font-black text-[10px] text-stone-100 truncate w-full mt-0.5">${u.name}</span>
                      <span class="text-[9px] font-extrabold" style="color:${costMeta.pedestalTop}">${u.cost}G</span>
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        `;

        document.getElementById('btn-codex-syn-prev').onclick = () => {
          this.currentCodexSynIndex = (this.currentCodexSynIndex - 1 + synList.length) % synList.length;
          SoundEngine.play('shoot');
          this.renderCodex();
        };
        document.getElementById('btn-codex-syn-next').onclick = () => {
          this.currentCodexSynIndex = (this.currentCodexSynIndex + 1) % synList.length;
          SoundEngine.play('shoot');
          this.renderCodex();
        };

        body.querySelectorAll('[data-jump-to-unit]').forEach(btn => {
          btn.onclick = () => {
            const uid = btn.dataset.jumpToUnit;
            const targetIdx = PUNI_LIST.findIndex(p => p.id === uid);
            if (targetIdx !== -1) {
              this.currentCodexFilter = 'ALL';
              this.currentCodexIndex = targetIdx;
              this.codexViewMode = 'CARD';
              SoundEngine.play('buy');
              this.renderCodex();
            }
          };
        });

      } else {
        // ================= 2. 시너지 모아보기 뷰 =================
        body.innerHTML = `
          <div class="space-y-1.5">
            ${synList.map((syn, i) => `
              <div class="p-2.5 rounded-xl border border-stone-800 bg-stone-950 space-y-1 cursor-pointer hover:border-amber-400/70 transition-all active:scale-95"
                   data-codex-syn-jump="${i}">
                <div class="flex items-center justify-between">
                  <span class="font-black text-amber-200 inline-flex items-center gap-1.5">
                    ${GameIcons.synergySvg(syn.name, 16)} ${syn.name}
                    <span class="text-[9.5px] px-1.5 py-[0.5px] rounded bg-stone-900 border border-stone-700 text-stone-400">${syn.type}</span>
                  </span>
                  <span class="text-[9.5px] font-extrabold px-2 py-0.5 rounded-full bg-stone-800 text-amber-300">발동: ${syn.thresholds.join(' / ')}</span>
                </div>
                <p class="text-[10.5px] text-stone-300">${syn.desc}</p>
              </div>
            `).join('')}
          </div>
        `;

        body.querySelectorAll('[data-codex-syn-jump]').forEach(el => {
          el.onclick = () => {
            this.currentCodexSynIndex = Number(el.dataset.codexSynJump);
            this.codexViewMode = 'CARD';
            SoundEngine.play('shoot');
            this.renderCodex();
          };
        });
      }
      return;
    }

    const list = filter === 'ALL' ? PUNI_LIST : PUNI_LIST.filter(u => String(u.cost) === filter);
    if (list.length === 0) {
      body.innerHTML = `<div class="text-center py-10 text-stone-400 font-bold">해당 조건의 기물이 없습니다.</div>`;
      return;
    }

    this.currentCodexIndex = Math.max(0, Math.min(list.length - 1, this.currentCodexIndex));

    if (this.codexViewMode === 'CARD') {
      // ================= 1. 단일 카드 넘기기 뷰 (시안성 극대화) =================
      const u = list[this.currentCodexIndex];
      const star = this.codexStarPreview || 1;
      const mult = Math.pow(1.8, star - 1);
      const hp = Math.round(u.hp * mult);
      const atk = Math.round(u.atk * mult);
      const def = u.cost * 10;
      const costMeta = COST_META[u.cost];
      const rem = AppState.pool[u.id] ?? costMeta.poolSize;

      body.innerHTML = `
        <div class="flex flex-col gap-2.5 h-full">
          <!-- 상단 좌우 넘기기 인디케이터 바 -->
          <div class="flex items-center justify-between bg-stone-950/80 px-3 py-1.5 rounded-xl border border-stone-800">
            <button id="btn-codex-prev" type="button" class="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 flex items-center gap-1 font-black text-xs active:scale-95 transition-all">
              ${GameIcons.svg('leftArrow', 13)}
              <span>이전</span>
            </button>
            <div class="text-center">
              <span class="text-stone-400 text-[10px] font-bold">컬렉션</span>
              <span class="text-amber-300 font-black text-xs ml-1">${this.currentCodexIndex + 1} / ${list.length}</span>
            </div>
            <button id="btn-codex-next" type="button" class="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 flex items-center gap-1 font-black text-xs active:scale-95 transition-all">
              <span>다음</span>
              ${GameIcons.svg('rightArrow', 13)}
            </button>
          </div>

          <!-- 메인 피규어 쇼케이스 스테이지 카드 -->
          <div class="relative rounded-2xl p-3 border-2 shadow-2xl flex flex-col items-center codex-stage-glow"
               style="background:${costMeta.cardBg}; border-color:${costMeta.border};">
            <!-- 좌측 상단 성급 스위처 버튼 -->
            <div class="absolute top-2 left-2 z-20 flex items-center gap-1 bg-stone-950/85 p-1 rounded-lg border border-stone-800">
              <button data-star="1" class="codex-star-btn px-1.5 py-0.5 rounded text-[9.5px] font-black ${star === 1 ? 'bg-amber-400 text-stone-950' : 'text-stone-400'}">1성</button>
              <button data-star="2" class="codex-star-btn px-1.5 py-0.5 rounded text-[9.5px] font-black ${star === 2 ? 'bg-amber-400 text-stone-950' : 'text-stone-400'}">2성</button>
              <button data-star="3" class="codex-star-btn px-1.5 py-0.5 rounded text-[9.5px] font-black ${star === 3 ? 'bg-amber-400 text-stone-950' : 'text-stone-400'}">3성</button>
            </div>

            <!-- 우측 상단 코스트 & 공유 풀 배지 -->
            <div class="absolute top-2 right-2 z-20 flex flex-col items-end gap-1">
              <span class="px-2 py-0.5 rounded-md text-[10.5px] font-black text-white shadow" style="background:${costMeta.badge}">
                ${u.cost}코스트
              </span>
              <span class="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-stone-950/80 text-amber-300 border border-stone-800">
                잔여 ${rem}/${costMeta.poolSize}기
              </span>
            </div>

            <!-- 3D 피규어 본체 & 받침대 -->
            <div class="relative w-40 h-44 flex flex-col items-center justify-end my-1">
              <div class="absolute top-2 z-20">
                ${GameIcons.starsHtml(star, star === 3 ? 15 : 12)}
              </div>
              <img src="${this.getFigurineSrc(u.id)}" alt="${u.name}" class="relative z-10 w-32 h-36 object-contain drop-shadow-2xl" />
              <div class="w-28 h-6 rounded-full border border-white/60 shadow-lg"
                   style="background: radial-gradient(circle at 40% 35%, ${costMeta.pedestalTop}, ${costMeta.pedestalRim}); margin-top: -12px;"></div>
            </div>

            <div class="font-black text-base text-stone-950 tracking-wide text-center mt-1 drop-shadow-sm">
              ${u.name}
            </div>
          </div>

          <!-- 소속 시너지 2종 배지 -->
          <div class="grid grid-cols-2 gap-2">
            <div class="bg-stone-950 rounded-xl p-2.5 border border-stone-800 flex items-center gap-2">
              <span class="shrink-0">${GameIcons.synergySvg(u.origin, 22)}</span>
              <div class="min-w-0">
                <div class="text-[9.5px] text-amber-300 font-extrabold">계열 특성</div>
                <div class="text-xs font-black text-white truncate">${u.origin}</div>
              </div>
            </div>
            <div class="bg-stone-950 rounded-xl p-2.5 border border-stone-800 flex items-center gap-2">
              <span class="shrink-0">${GameIcons.synergySvg(u.job, 22)}</span>
              <div class="min-w-0">
                <div class="text-[9.5px] text-sky-300 font-extrabold">직업 특성</div>
                <div class="text-xs font-black text-white truncate">${u.job}</div>
              </div>
            </div>
          </div>

          <!-- 스탯 게이지 (체력 / 공격력 / 방어력 / 사거리) -->
          <div class="bg-stone-950 rounded-xl p-2.5 border border-stone-800 space-y-1.5">
            <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
              <div>
                <div class="flex justify-between font-bold mb-0.5">
                  <span class="text-rose-400">체력 (${star}성)</span>
                  <span class="font-black text-white">${hp}</span>
                </div>
                <div class="stat-bar-track"><div class="stat-bar-fill bg-rose-500" style="width: ${Math.min(100, (hp / 2800) * 100)}%;"></div></div>
              </div>
              <div>
                <div class="flex justify-between font-bold mb-0.5">
                  <span class="text-amber-400">공격력 (${star}성)</span>
                  <span class="font-black text-white">${atk}</span>
                </div>
                <div class="stat-bar-track"><div class="stat-bar-fill bg-amber-400" style="width: ${Math.min(100, (atk / 220) * 100)}%;"></div></div>
              </div>
              <div>
                <div class="flex justify-between font-bold mb-0.5">
                  <span class="text-sky-400">방어력</span>
                  <span class="font-black text-white">${def}</span>
                </div>
                <div class="stat-bar-track"><div class="stat-bar-fill bg-sky-400" style="width: ${Math.min(100, (def / 50) * 100)}%;"></div></div>
              </div>
              <div>
                <div class="flex justify-between font-bold mb-0.5">
                  <span class="text-purple-400">사거리</span>
                  <span class="font-black text-white">${u.range}칸 (${u.range === 1 ? '근접' : '원거리'})</span>
                </div>
                <div class="stat-bar-track"><div class="stat-bar-fill bg-purple-400" style="width: ${(u.range / 4) * 100}%;"></div></div>
              </div>
            </div>
          </div>

          <!-- 고유 궁극기 안내 카드 -->
          <div class="bg-stone-950 rounded-xl p-2.5 border border-amber-500/40">
            <div class="font-black text-amber-300 text-xs mb-1 flex items-center justify-between">
              <span>스킬: ${u.skillName}</span>
              <span class="text-[9.5px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-600/40">마나 100 소모</span>
            </div>
            <p class="text-stone-300 text-[11px] leading-relaxed">${u.skillDesc}</p>
          </div>
        </div>
      `;

      // 이전/다음 버튼 이벤트 바인딩
      document.getElementById('btn-codex-prev').onclick = () => {
        this.currentCodexIndex = (this.currentCodexIndex - 1 + list.length) % list.length;
        SoundEngine.play('shoot');
        this.renderCodex();
      };
      document.getElementById('btn-codex-next').onclick = () => {
        this.currentCodexIndex = (this.currentCodexIndex + 1) % list.length;
        SoundEngine.play('shoot');
        this.renderCodex();
      };

      // 성급 변경 버튼
      body.querySelectorAll('.codex-star-btn').forEach(btn => {
        btn.onclick = () => {
          this.codexStarPreview = Number(btn.dataset.star);
          SoundEngine.play('coin');
          this.renderCodex();
        };
      });

    } else {
      // ================= 2. 그리드 모아보기 뷰 =================
      body.innerHTML = `
        <div class="grid grid-cols-2 gap-2">
          ${list.map((u, i) => {
            const costMeta = COST_META[u.cost];
            const rem = AppState.pool[u.id] ?? costMeta.poolSize;
            return `
              <div data-codex-jump="${i}" class="p-2 rounded-xl border bg-stone-950 hover:border-amber-300 flex items-center gap-2 cursor-pointer active:scale-95 transition-all shadow"
                   style="border-color:${costMeta.border}">
                <div class="w-12 h-14 rounded-lg flex items-end justify-center shrink-0 p-0.5" style="background:${costMeta.cardBg}">
                  <img src="${this.getFigurineSrc(u.id)}" class="w-11 h-12 object-contain drop-shadow" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between">
                    <span class="font-black text-[11px] text-stone-100 truncate">${u.name}</span>
                    <span class="text-[9.5px] font-black px-1.5 rounded text-white" style="background:${costMeta.badge}">${u.cost}G</span>
                  </div>
                  <div class="flex items-center gap-1 mt-1">
                    <span class="px-1 py-[1px] rounded bg-stone-800 text-[8px] font-bold text-amber-200 border border-stone-700">${u.origin.slice(0, 2)}</span>
                    <span class="px-1 py-[1px] rounded bg-stone-800 text-[8px] font-bold text-sky-200 border border-stone-700">${u.job.slice(0, 2)}</span>
                  </div>
                  <div class="text-[9px] text-stone-400 font-bold mt-1">잔여 풀: ${rem}/${costMeta.poolSize}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;

      body.querySelectorAll('[data-codex-jump]').forEach(el => {
        el.onclick = () => {
          this.currentCodexIndex = Number(el.dataset.codexJump);
          this.codexViewMode = 'CARD';
          SoundEngine.play('buy');
          this.renderCodex();
        };
      });
    }
  },

  toggleSound() {
    AppState.soundEnabled = !AppState.soundEnabled;
    this.updateSoundUI();
    if (AppState.soundEnabled) {
      SoundEngine.unlock().then(() => {
        SoundEngine.play('shoot');
      }).catch(() => {});
    }
    this.renderHud();
  },

  updateSoundUI() {
    const isEn = AppState.soundEnabled;
    const statusEl = document.getElementById('settings-sound-status');
    if (statusEl) {
      statusEl.textContent = isEn ? '켜짐' : '꺼짐';
      statusEl.className = `sound-toggle-badge ${isEn ? 'is-on' : 'is-off'}`;
    }
    const iconEl = document.getElementById('settings-sound-icon');
    if (iconEl) {
      iconEl.innerHTML = GameIcons.svg(isEn ? 'soundOn' : 'soundOff', 15);
    }
    const hudBtn = document.getElementById('btn-toggle-sound');
    if (hudBtn) {
      hudBtn.innerHTML = GameIcons.svg(isEn ? 'soundOn' : 'soundOff', 15);
      hudBtn.style.color = isEn ? '#fef08a' : '#78716c';
    }
  },

  toggleFullscreen() {
    const doc = document;
    const docEl = document.documentElement;
    const isFs = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);

    if (!isFs) {
      const req = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
      if (req) {
        req.call(docEl).catch(() => {});
      }
    } else {
      const exit = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
      if (exit) {
        exit.call(doc).catch(() => {});
      }
    }
    setTimeout(() => this.updateFullscreenUI(), 100);
  },

  updateFullscreenUI() {
    const doc = document;
    const isFs = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
    const btn = document.getElementById('btn-fullscreen');
    if (btn) {
      btn.innerHTML = GameIcons.svg(isFs ? 'fullscreenExit' : 'fullscreen', 16);
      btn.title = isFs ? '전체화면 종료' : '전체화면으로 보기';
      btn.style.color = isFs ? '#38bdf8' : '#fde68a';
    }
  },

  renderSettingsOdds() {
    const oddsEl = document.getElementById('settings-odds-bar');
    const badgeEl = document.getElementById('settings-odds-level-badge');
    if (!oddsEl) return;
    if (badgeEl) badgeEl.textContent = `Lv.${AppState.level} 기준`;
    const odds = LEVEL_TABLE[AppState.level].odds;
    const oddsColors = ['#cbd5e1', '#4ade80', '#60a5fa', '#c084fc', '#fbbf24'];
    oddsEl.innerHTML = odds.map((pct, i) => `
      <div class="settings-odds-chip">
        <span class="text-[9.5px] font-black" style="color:${oddsColors[i]}">${i + 1}코</span>
        <span class="text-[11px] font-black text-white mt-0.5">${pct}%</span>
      </div>
    `).join('');
  },

  openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    document.getElementById('settings-stat-stage').textContent = `STAGE ${AppState.stage} / 15`;
    document.getElementById('settings-stat-hp').textContent = `${AppState.playerHp}`;
    document.getElementById('settings-stat-gold').textContent = `${AppState.gold}G`;
    document.getElementById('settings-stat-level').textContent = `Lv.${AppState.level}`;
    this.renderSettingsOdds();
    this.updateSoundUI();
    modal.classList.remove('hidden');
  },

  currentGuideSlide: 0,

  renderGuideSlide(index) {
    this.currentGuideSlide = Math.max(0, Math.min(3, index));
    const cur = this.currentGuideSlide;

    // 슬라이드 카드 표시 토글
    const slides = document.querySelectorAll('.guide-slide');
    slides.forEach((s, i) => {
      if (i === cur) {
        s.classList.remove('hidden');
        s.classList.add('active');
      } else {
        s.classList.add('hidden');
        s.classList.remove('active');
      }
    });

    // 상단 페이지 배지
    const badge = document.getElementById('guide-page-badge');
    if (badge) badge.textContent = `${cur + 1} / 4`;

    // 하단 도트 인디케이터
    const dots = document.querySelectorAll('.guide-dot');
    dots.forEach((dot, i) => {
      if (i === cur) {
        dot.className = 'guide-dot active w-5 h-2 rounded-full bg-amber-400 transition-all';
      } else {
        dot.className = 'guide-dot w-2 h-2 rounded-full bg-stone-700 hover:bg-stone-600 transition-all';
      }
    });

    // 이전 버튼 활성화 상태
    const prevBtn = document.getElementById('btn-guide-prev');
    if (prevBtn) {
      prevBtn.disabled = (cur === 0);
    }

    // 다음 버튼 텍스트 & 아이콘 동기화
    const nextBtn = document.getElementById('btn-guide-next');
    const nextText = document.getElementById('guide-next-text');
    const nextIcon = document.getElementById('guide-next-icon');
    if (nextBtn && nextText && nextIcon) {
      if (cur === 3) {
        nextText.textContent = '시작하기';
        nextIcon.innerHTML = GameIcons.svg('swords', 13);
        nextBtn.className = 'px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs flex items-center gap-1 transition-all active:scale-95 shadow ring-2 ring-amber-300';
      } else {
        nextText.textContent = '다음';
        nextIcon.innerHTML = GameIcons.svg('rightArrow', 12);
        nextBtn.className = 'px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs flex items-center gap-1 transition-all active:scale-95 shadow';
      }
    }
  },

  openGuideModal() {
    this.renderGuideSlide(0);
    document.getElementById('guide-modal').classList.remove('hidden');
  },

  // ==========================================================================
  // 이벤트 바인딩 & 포인터 드래그·탭 스왑 시스템
  // ==========================================================================
  bindEvents() {
    document.getElementById('btn-enter-game').onclick = async () => {
      await SoundEngine.unlock();
      SoundEngine.play('merge2');
      document.getElementById('title-screen').classList.add('hidden');
    };

    // 타이틀 스크린 서브 버튼
    document.getElementById('btn-open-guide').onclick = () => {
      this.openGuideModal();
    };
    const closeGuide = () => {
      document.getElementById('guide-modal').classList.add('hidden');
    };
    document.getElementById('btn-close-guide').onclick = closeGuide;
    const btnGuideConfirm = document.getElementById('btn-guide-confirm');
    if (btnGuideConfirm) btnGuideConfirm.onclick = closeGuide;

    // 슬라이드 내비게이션 버튼 바인딩
    const btnGuidePrev = document.getElementById('btn-guide-prev');
    if (btnGuidePrev) {
      btnGuidePrev.onclick = () => {
        if (this.currentGuideSlide > 0) {
          SoundEngine.play('shoot');
          this.renderGuideSlide(this.currentGuideSlide - 1);
        }
      };
    }

    const btnGuideNext = document.getElementById('btn-guide-next');
    if (btnGuideNext) {
      btnGuideNext.onclick = () => {
        if (this.currentGuideSlide < 3) {
          SoundEngine.play('shoot');
          this.renderGuideSlide(this.currentGuideSlide + 1);
        } else {
          SoundEngine.play('merge2');
          closeGuide();
        }
      };
    }

    // 도트 클릭 시 직접 슬라이드 이동
    document.querySelectorAll('.guide-dot').forEach(dot => {
      dot.onclick = () => {
        const target = parseInt(dot.dataset.dot, 10);
        if (!isNaN(target)) {
          SoundEngine.play('shoot');
          this.renderGuideSlide(target);
        }
      };
    });

    // 모바일 터치 좌우 스와이프 제스처
    const sliderBox = document.getElementById('guide-slider-container');
    if (sliderBox) {
      let touchStartX = 0;
      let touchStartY = 0;
      sliderBox.addEventListener('touchstart', (e) => {
        if (e.changedTouches && e.changedTouches[0]) {
          touchStartX = e.changedTouches[0].clientX;
          touchStartY = e.changedTouches[0].clientY;
        }
      }, { passive: true });

      sliderBox.addEventListener('touchend', (e) => {
        if (e.changedTouches && e.changedTouches[0]) {
          const diffX = e.changedTouches[0].clientX - touchStartX;
          const diffY = e.changedTouches[0].clientY - touchStartY;
          if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
            if (diffX < 0 && this.currentGuideSlide < 3) {
              SoundEngine.play('shoot');
              this.renderGuideSlide(this.currentGuideSlide + 1);
            } else if (diffX > 0 && this.currentGuideSlide > 0) {
              SoundEngine.play('shoot');
              this.renderGuideSlide(this.currentGuideSlide - 1);
            }
          }
        }
      }, { passive: true });
    }

    document.getElementById('btn-title-codex').onclick = () => {
      this.openCodexModal('ALL');
    };

    // 설정 모달 버튼 바인딩
    document.getElementById('btn-open-settings').onclick = () => {
      this.openSettingsModal();
    };
    document.getElementById('btn-close-settings').onclick = () => {
      document.getElementById('settings-modal').classList.add('hidden');
    };
    document.getElementById('btn-settings-resume').onclick = () => {
      document.getElementById('settings-modal').classList.add('hidden');
    };
    document.getElementById('btn-settings-sound').onclick = (e) => {
      e.stopPropagation();
      this.toggleSound();
    };
    document.getElementById('btn-settings-guide').onclick = () => {
      document.getElementById('settings-modal').classList.add('hidden');
      this.openGuideModal();
    };
    document.getElementById('btn-settings-restart').onclick = () => {
      document.getElementById('settings-modal').classList.add('hidden');
      this.startNewGame();
      this.showToast('새 원정 게임이 시작되었습니다!', 'info');
    };
    document.getElementById('btn-settings-title').onclick = () => {
      document.getElementById('settings-modal').classList.add('hidden');
      document.getElementById('title-screen').classList.remove('hidden');
      this.showToast('타이틀 화면으로 이동했습니다.', 'info');
    };

    // 도감 뷰 모드 전환 버튼
    document.getElementById('btn-codex-card-view').onclick = () => {
      this.codexViewMode = 'CARD';
      SoundEngine.play('shoot');
      this.renderCodex();
    };
    document.getElementById('btn-codex-grid-view').onclick = () => {
      this.codexViewMode = 'GRID';
      SoundEngine.play('shoot');
      this.renderCodex();
    };

    // 키보드 좌우 화살표로 도감 피규어 / 시너지 넘기기 지원
    window.addEventListener('keydown', (e) => {
      const codexModal = document.getElementById('codex-modal');
      if (codexModal && !codexModal.classList.contains('hidden') && this.codexViewMode === 'CARD') {
        if (this.currentCodexFilter === 'SYN') {
          const synList = Object.values(SYNERGY_DB);
          if (synList.length > 0) {
            if (e.key === 'ArrowLeft') {
              this.currentCodexSynIndex = (this.currentCodexSynIndex - 1 + synList.length) % synList.length;
              SoundEngine.play('shoot');
              this.renderCodex();
            } else if (e.key === 'ArrowRight') {
              this.currentCodexSynIndex = (this.currentCodexSynIndex + 1) % synList.length;
              SoundEngine.play('shoot');
              this.renderCodex();
            }
          }
        } else {
          const list = this.currentCodexFilter === 'ALL' ? PUNI_LIST : PUNI_LIST.filter(u => String(u.cost) === this.currentCodexFilter);
          if (list.length > 0) {
            if (e.key === 'ArrowLeft') {
              this.currentCodexIndex = (this.currentCodexIndex - 1 + list.length) % list.length;
              SoundEngine.play('shoot');
              this.renderCodex();
            } else if (e.key === 'ArrowRight') {
              this.currentCodexIndex = (this.currentCodexIndex + 1) % list.length;
              SoundEngine.play('shoot');
              this.renderCodex();
            }
          }
        }
      }
    });

    document.getElementById('gold-pill-btn').onclick = (e) => {
      e.stopPropagation();
      document.getElementById('gold-tooltip').classList.toggle('hidden');
    };
    document.addEventListener('click', () => {
      document.getElementById('gold-tooltip').classList.add('hidden');
    });

    document.getElementById('btn-open-codex').onclick = () => this.openCodexModal('ALL');
    document.getElementById('btn-close-codex').onclick = () => document.getElementById('codex-modal').classList.add('hidden');
    document.querySelectorAll('.codex-tab').forEach(tab => {
      tab.onclick = () => this.openCodexModal(tab.dataset.filter);
    });

    document.getElementById('btn-close-detail').onclick = () => {
      document.getElementById('detail-modal').classList.add('hidden');
    };

    const fsBtn = document.getElementById('btn-fullscreen');
    if (fsBtn) {
      fsBtn.onclick = () => {
        SoundEngine.play('shoot');
        this.toggleFullscreen();
      };
    }
    document.addEventListener('fullscreenchange', () => this.updateFullscreenUI());
    document.addEventListener('webkitfullscreenchange', () => this.updateFullscreenUI());

    document.getElementById('synergy-strip').addEventListener('click', (e) => {
      const pill = e.target.closest('[data-synergy]');
      if (pill) this.openSynergyDetailModal(pill.dataset.synergy);
    });

    const btnSynAll = document.getElementById('btn-synergy-all');
    if (btnSynAll) {
      btnSynAll.onclick = () => this.openAllSynergiesModal();
    }

    document.getElementById('btn-buy-xp').onclick = async () => {
      await SoundEngine.unlock();
      if (ShopSystem.buyXp()) {
        SoundEngine.play('xp');
        this.renderAllUI();
      }
    };

    document.getElementById('btn-reroll').onclick = async () => {
      await SoundEngine.unlock();
      if (ShopSystem.refreshShop(false)) {
        SoundEngine.play('reroll');
        this.renderAllUI();
      }
    };

    document.getElementById('btn-lock').onclick = async () => {
      await SoundEngine.unlock();
      ShopSystem.toggleLock();
      SoundEngine.play('shoot');
      this.renderHud();
    };

    document.getElementById('btn-start-combat').onclick = async () => {
      await SoundEngine.unlock();
      if (AppState.phase !== 'PREP') return;
      if (ShopSystem.getBoardUnitCount() === 0 && AppState.bench.every(b => b === null)) {
        this.showToast('먼저 상점에서 피규어를 영입해 배치해주세요!', 'warn');
        return;
      }
      if (CombatSystem.startCombat()) {
        this.renderAllUI();
        this.startCombatTimerUpdater();
      }
    };

    document.getElementById('btn-inspect-selected').onclick = () => {
      const u = this.getUnitAtLocation(AppState.selectedSlot);
      if (u) this.openUnitDetailModal(u.id, u.star, AppState.selectedSlot);
    };

    document.getElementById('btn-sell-selected').onclick = () => {
      if (AppState.selectedSlot && ShopSystem.sellUnitFrom(AppState.selectedSlot)) {
        SoundEngine.play('coin');
        this.renderAllUI();
      }
    };

    const shopContainer = document.getElementById('shop-cards');
    shopContainer.addEventListener('click', async (e) => {
      const card = e.target.closest('[data-shop-idx]');
      if (!card) return;
      await SoundEngine.unlock();
      const idx = Number(card.dataset.shopIdx);
      if (ShopSystem.buyUnit(idx)) {
        SoundEngine.play('buy');
        this.renderAllUI();
      }
    });
    shopContainer.addEventListener('contextmenu', (e) => {
      const card = e.target.closest('[data-shop-idx]');
      if (!card) return;
      e.preventDefault();
      const slot = AppState.shopSlots[Number(card.dataset.shopIdx)];
      if (slot) this.openUnitDetailModal(slot.id, 1);
    });

    this.bindDragAndTap();
  },

  startCombatTimerUpdater() {
    const pill = document.getElementById('combat-timer-pill');
    pill.classList.remove('hidden');
    const iv = setInterval(() => {
      if (AppState.phase !== 'COMBAT') {
        pill.classList.add('hidden');
        clearInterval(iv);
        return;
      }
      pill.textContent = CombatSystem.overtimeActive
        ? `가속 ${CombatSystem.elapsedSec.toFixed(1)}s`
        : `${CombatSystem.elapsedSec.toFixed(1)}s / 30s`;
      document.getElementById('gold-text').textContent = `${AppState.gold}G`;
    }, 100);
  },

  clientToCanvasCoords(clientX, clientY) {
    const canvas = document.getElementById('battle-canvas');
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * CANVAS_W;
    const y = ((clientY - rect.top) / rect.height) * CANVAS_H;
    return { x, y, inside: x >= 0 && x <= CANVAS_W && y >= 0 && y <= CANVAS_H };
  },

  bindDragAndTap() {
    const canvas = document.getElementById('battle-canvas');
    const benchGrid = document.getElementById('bench-grid');
    const sellZone = document.getElementById('sell-dropzone');
    const sellPrice = document.getElementById('sell-dropzone-price');

    const beginPointer = (fromLoc, unit, clientX, clientY) => {
      this.dragState = {
        from: fromLoc,
        unit,
        startX: clientX,
        startY: clientY,
        moved: false
      };
    };

    canvas.addEventListener('pointerdown', (e) => {
      const pt = this.clientToCanvasCoords(e.clientX, e.clientY);
      const tile = CombatSystem.pixelToTile(pt.x, pt.y);
      if (!tile) return;

      if (AppState.phase !== 'COMBAT' && tile.row < 3) {
        const enemy = CombatSystem.previewEnemies.find(en => en.row === tile.row && en.col === tile.col);
        if (enemy) {
          this.openUnitDetailModal(enemy.id, enemy.star);
          return;
        }
      }

      if (AppState.phase === 'PREP' && tile.row >= 3) {
        const unit = AppState.board[tile.row][tile.col];
        if (unit) {
          beginPointer({ zone: 'board', row: tile.row, col: tile.col }, unit, e.clientX, e.clientY);
        } else if (AppState.selectedSlot) {
          if (ShopSystem.moveOrSwap(AppState.selectedSlot, { zone: 'board', row: tile.row, col: tile.col })) {
            SoundEngine.play('buy');
            AppState.selectedSlot = null;
            this.renderAllUI();
          }
        }
      }
    });

    benchGrid.addEventListener('pointerdown', (e) => {
      const slotEl = e.target.closest('[data-bench-idx]');
      if (!slotEl) return;
      const idx = Number(slotEl.dataset.benchIdx);
      const unit = AppState.bench[idx];
      if (unit) {
        beginPointer({ zone: 'bench', idx }, unit, e.clientX, e.clientY);
      } else if (AppState.selectedSlot) {
        if (ShopSystem.moveOrSwap(AppState.selectedSlot, { zone: 'bench', idx })) {
          SoundEngine.play('buy');
          AppState.selectedSlot = null;
          this.renderAllUI();
        }
      }
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.dragState) return;
      const dist = Math.hypot(e.clientX - this.dragState.startX, e.clientY - this.dragState.startY);
      if (!this.dragState.moved && dist > 7) {
        this.dragState.moved = true;
        CombatSystem.isDraggingUnit = true;
        sellZone.classList.remove('hidden');
        sellPrice.textContent = `+${ShopSystem.getSellValue(this.dragState.unit)}G`;
      }

      if (!this.dragState.moved) return;

      const pt = this.clientToCanvasCoords(e.clientX, e.clientY);
      CombatSystem.dragGhost = { unit: this.dragState.unit, x: pt.x, y: pt.y };

      const tile = pt.inside ? CombatSystem.pixelToTile(pt.x, pt.y) : null;
      CombatSystem.hoverTile = (tile && tile.row >= 3) ? tile : null;

      document.querySelectorAll('.bench-slot').forEach(el => el.classList.remove('drop-hover'));
      const hoverEl = document.elementFromPoint(e.clientX, e.clientY);
      const benchTarget = hoverEl?.closest?.('[data-bench-idx]');
      if (benchTarget) benchTarget.classList.add('drop-hover');
    });

    window.addEventListener('pointerup', (e) => {
      if (!this.dragState) return;
      const st = this.dragState;
      this.dragState = null;

      CombatSystem.dragGhost = null;
      CombatSystem.hoverTile = null;
      CombatSystem.isDraggingUnit = false;
      sellZone.classList.add('hidden');
      document.querySelectorAll('.bench-slot').forEach(el => el.classList.remove('drop-hover'));

      if (!st.moved) {
        this.handleSlotTap(st.from, st.unit);
        return;
      }

      const dropTargetEl = document.elementFromPoint(e.clientX, e.clientY);

      if (dropTargetEl && (dropTargetEl.closest('#sell-dropzone') || dropTargetEl.closest('#shop-cards'))) {
        if (ShopSystem.sellUnitFrom(st.from)) {
          SoundEngine.play('coin');
          this.renderAllUI();
        }
        return;
      }

      const benchSlotEl = dropTargetEl?.closest?.('[data-bench-idx]');
      if (benchSlotEl) {
        const toIdx = Number(benchSlotEl.dataset.benchIdx);
        if (ShopSystem.moveOrSwap(st.from, { zone: 'bench', idx: toIdx })) {
          SoundEngine.play('buy');
          AppState.selectedSlot = null;
          this.renderAllUI();
        }
        return;
      }

      const pt = this.clientToCanvasCoords(e.clientX, e.clientY);
      if (pt.inside) {
        const tile = CombatSystem.pixelToTile(pt.x, pt.y);
        if (tile) {
          if (ShopSystem.moveOrSwap(st.from, { zone: 'board', row: tile.row, col: tile.col })) {
            SoundEngine.play('buy');
            AppState.selectedSlot = null;
            this.renderAllUI();
          }
        }
      }
    });

    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const pt = this.clientToCanvasCoords(e.clientX, e.clientY);
      const tile = CombatSystem.pixelToTile(pt.x, pt.y);
      if (!tile) return;
      if (tile.row >= 3 && AppState.board[tile.row][tile.col]) {
        const u = AppState.board[tile.row][tile.col];
        this.openUnitDetailModal(u.id, u.star, { zone: 'board', row: tile.row, col: tile.col });
      }
    });

    benchGrid.addEventListener('contextmenu', (e) => {
      const slotEl = e.target.closest('[data-bench-idx]');
      if (!slotEl) return;
      e.preventDefault();
      const idx = Number(slotEl.dataset.benchIdx);
      const u = AppState.bench[idx];
      if (u) this.openUnitDetailModal(u.id, u.star, { zone: 'bench', idx });
    });
  },

  handleSlotTap(loc, unit) {
    const now = performance.now();
    const locKey = loc.zone === 'bench' ? `B_${loc.idx}` : `G_${loc.row}_${loc.col}`;

    if (now - this.lastTapInfo.time < 320 && this.lastTapInfo.key === locKey) {
      this.lastTapInfo = { time: 0, key: '' };
      if (loc.zone === 'bench') {
        if (ShopSystem.autoDeployUnit(loc.idx)) {
          SoundEngine.play('buy');
          AppState.selectedSlot = null;
          this.renderAllUI();
        }
      } else if (loc.zone === 'board' && AppState.phase === 'PREP') {
        const emptyIdx = AppState.bench.findIndex(b => b === null);
        if (emptyIdx !== -1 && ShopSystem.moveOrSwap(loc, { zone: 'bench', idx: emptyIdx })) {
          SoundEngine.play('buy');
          AppState.selectedSlot = null;
          this.renderAllUI();
        }
      }
      return;
    }

    this.lastTapInfo = { time: now, key: locKey };

    if (AppState.selectedSlot) {
      const prev = AppState.selectedSlot;
      const isSame = prev.zone === loc.zone && prev.idx === loc.idx && prev.row === loc.row && prev.col === loc.col;
      if (isSame) {
        AppState.selectedSlot = null;
        this.renderAllUI();
        this.openUnitDetailModal(unit.id, unit.star, loc);
        return;
      }
      if (ShopSystem.moveOrSwap(prev, loc)) {
        SoundEngine.play('buy');
        AppState.selectedSlot = null;
        this.renderAllUI();
        return;
      }
    }

    AppState.selectedSlot = loc;
    this.renderAllUI();
  }
};

window.addEventListener('DOMContentLoaded', () => {
  AppController.init();
});
