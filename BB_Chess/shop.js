// ============================================================================
// 『쁘니토체스 (BB Chess)』 - Phase 2: 공유 기물 풀, 상점, 이자 경제 및 3성 자동 합성
// ============================================================================

const ShopSystem = {
  onSynthesizeCallback: null,
  onToastCallback: null,

  // 공유 기물 풀 초기화 (1코 18장, 2코 15장, 3코 12장, 4코 10장, 5코 8장)
  initPool() {
    AppState.pool = {};
    for (const unit of PUNI_LIST) {
      AppState.pool[unit.id] = COST_META[unit.cost].poolSize;
    }
  },

  emitToast(msg, type = 'info') {
    if (typeof this.onToastCallback === 'function') {
      this.onToastCallback(msg, type);
    }
  },

  // 현재 상점에 노출되어 아직 구매되지 않은 기물을 공유 풀로 반환
  returnUnboughtShopToPool() {
    for (let i = 0; i < AppState.shopSlots.length; i++) {
      const slot = AppState.shopSlots[i];
      if (slot && !slot.purchased) {
        const spec = PUNI_MAP[slot.id];
        if (spec) {
          const maxCap = COST_META[spec.cost].poolSize;
          AppState.pool[slot.id] = Math.min(maxCap, (AppState.pool[slot.id] || 0) + 1);
        }
      }
      AppState.shopSlots[i] = null;
    }
  },

  // 레벨 확률에 따라 코스트 1개 추첨
  rollCostByLevel(level) {
    const cfg = LEVEL_TABLE[level] || LEVEL_TABLE[9];
    const roll = Math.random() * 100;
    let acc = 0;
    for (let i = 0; i < cfg.odds.length; i++) {
      acc += cfg.odds[i];
      if (roll < acc) return i + 1;
    }
    return 1;
  },

  // 특정 코스트의 공유 풀에서 남은 장수 가중치로 기물 1장 추출
  drawUnitFromPool(targetCost) {
    const tryCosts = [targetCost, 1, 2, 3, 4, 5];
    for (const cost of tryCosts) {
      const candidates = PUNI_LIST.filter(u => u.cost === cost && (AppState.pool[u.id] || 0) > 0);
      if (candidates.length === 0) continue;
      const totalCopies = candidates.reduce((sum, u) => sum + AppState.pool[u.id], 0);
      let pick = Math.random() * totalCopies;
      for (const u of candidates) {
        pick -= AppState.pool[u.id];
        if (pick <= 0) {
          AppState.pool[u.id] -= 1;
          return u.id;
        }
      }
      const fallback = candidates[candidates.length - 1];
      AppState.pool[fallback.id] -= 1;
      return fallback.id;
    }
    return null;
  },

  // 상점 5슬롯 새로고침 (무료 라운드 리롤 또는 유료 2G 리롤)
  refreshShop(isFree = false) {
    if (!isFree) {
      if (AppState.gold < 2) {
        this.emitToast('골드가 부족합니다! (리롤 비용: 2G)', 'warn');
        return false;
      }
      AppState.gold -= 2;
      if (AppState.shopLocked) {
        AppState.shopLocked = false;
      }
    }

    this.returnUnboughtShopToPool();
    for (let i = 0; i < 5; i++) {
      const cost = this.rollCostByLevel(AppState.level);
      const unitId = this.drawUnitFromPool(cost);
      AppState.shopSlots[i] = unitId ? { id: unitId, purchased: false } : null;
    }
    return true;
  },

  // 상점 잠금 토글
  toggleLock() {
    AppState.shopLocked = !AppState.shopLocked;
    return AppState.shopLocked;
  },

  // 경험치 구매 (4골드 소모 -> 4 XP 획득)
  buyXp() {
    if (AppState.level >= 9) {
      this.emitToast('이미 최고 레벨(Lv.9)에 도달했습니다!', 'info');
      return false;
    }
    if (AppState.gold < 4) {
      this.emitToast('골드가 부족합니다! (경험치 구매: 4G)', 'warn');
      return false;
    }
    AppState.gold -= 4;
    this.gainXp(4);
    return true;
  },

  gainXp(amount) {
    if (AppState.level >= 9) {
      AppState.xp = 0;
      return false;
    }
    AppState.xp += amount;
    let leveledUp = false;
    while (AppState.level < 9) {
      const req = LEVEL_TABLE[AppState.level].xpToNext;
      if (req > 0 && AppState.xp >= req) {
        AppState.xp -= req;
        AppState.level += 1;
        leveledUp = true;
      } else {
        break;
      }
    }
    if (AppState.level >= 9) {
      AppState.xp = 0;
    }
    if (leveledUp) {
      this.emitToast(`레벨 업! Lv.${AppState.level} 달성 (최대 ${AppState.level}기 배치)`, 'success');
    }
    return leveledUp;
  },

  // 판매 환급액 계산 (1성: 원가 전액, 2~3성: 합성 원가 - 1G)
  getSellValue(unit) {
    if (!unit) return 0;
    const spec = PUNI_MAP[unit.id];
    if (!spec) return 0;
    if (unit.star === 1) return spec.cost;
    const copies = Math.pow(3, unit.star - 1);
    return Math.max(1, spec.cost * copies - 1);
  },

  // 대기석이 가득 찼을 때 즉시 합성 가능한지 검사
  canInstantMergeFromShop(unitId) {
    const includeBoard = AppState.phase === 'PREP';
    let count = 0;
    for (let i = 0; i < 7; i++) {
      const u = AppState.bench[i];
      if (u && u.id === unitId && u.star === 1) count++;
    }
    if (includeBoard) {
      for (let r = 3; r < 6; r++) {
        for (let c = 0; c < 5; c++) {
          const u = AppState.board[r][c];
          if (u && u.id === unitId && u.star === 1) count++;
        }
      }
    }
    return count >= 2;
  },

  // 상점 슬롯에서 기물 구매
  buyUnit(slotIndex) {
    const slot = AppState.shopSlots[slotIndex];
    if (!slot || slot.purchased) return false;

    const spec = PUNI_MAP[slot.id];
    if (!spec) return false;

    if (AppState.gold < spec.cost) {
      this.emitToast(`골드가 부족합니다! (${spec.cost}G 필요)`, 'warn');
      return false;
    }

    const emptyBenchIdx = AppState.bench.findIndex(b => b === null);
    const canInstantMerge = emptyBenchIdx === -1 && this.canInstantMergeFromShop(spec.id);

    if (emptyBenchIdx === -1 && !canInstantMerge) {
      this.emitToast('대기석(7칸)이 가득 찼습니다! 기물을 배치하거나 판매하세요.', 'warn');
      return false;
    }

    AppState.gold -= spec.cost;
    slot.purchased = true;
    AppState.shopSlots[slotIndex] = null;

    const newUnit = createOwnedUnit(spec.id, 1);
    if (emptyBenchIdx !== -1) {
      AppState.bench[emptyBenchIdx] = newUnit;
    }

    // 3성 자동 합성 판정 (즉시 합성의 경우 임시 풀로 전달)
    this.checkAutoCombine(canInstantMerge ? newUnit : null);
    this.recalcSynergies();
    return true;
  },

  // 대기석 또는 전장의 기물 판매
  sellUnitFrom(location) {
    if (!location) return false;
    let unit = null;
    if (location.zone === 'bench') {
      unit = AppState.bench[location.idx];
      if (!unit) return false;
      AppState.bench[location.idx] = null;
    } else if (location.zone === 'board') {
      if (AppState.phase === 'COMBAT') {
        this.emitToast('전투 중에는 전장 기물을 판매할 수 없습니다!', 'warn');
        return false;
      }
      unit = AppState.board[location.row][location.col];
      if (!unit) return false;
      AppState.board[location.row][location.col] = null;
    }

    if (!unit) return false;
    const refund = this.getSellValue(unit);
    AppState.gold += refund;

    // 공유 풀로 1성 환산 매수 반환
    const spec = PUNI_MAP[unit.id];
    const copies = Math.pow(3, unit.star - 1);
    const maxCap = COST_META[spec.cost].poolSize;
    AppState.pool[unit.id] = Math.min(maxCap, (AppState.pool[unit.id] || 0) + copies);

    if (AppState.selectedSlot &&
        AppState.selectedSlot.zone === location.zone &&
        AppState.selectedSlot.idx === location.idx &&
        AppState.selectedSlot.row === location.row &&
        AppState.selectedSlot.col === location.col) {
      AppState.selectedSlot = null;
    }

    this.recalcSynergies();
    this.emitToast(`${spec.name} (${unit.star}성) 판매 완료 (+${refund}G)`, 'info');
    return true;
  },

  // 3성 자동 합성 루프 (대기석 + 준비 페이즈 시 아군 전장 합산)
  checkAutoCombine(overflowUnit = null) {
    const includeBoard = AppState.phase === 'PREP';
    let extraUnit = overflowUnit;
    let anyMerged = false;

    while (true) {
      const entries = [];
      // 전장 기물을 먼저 수집하여 합체 시 전장 위치가 우선 유지되도록 처리
      if (includeBoard) {
        for (let r = 3; r < 6; r++) {
          for (let c = 0; c < 5; c++) {
            const u = AppState.board[r][c];
            if (u && u.star < 3) {
              entries.push({ unit: u, zone: 'board', row: r, col: c });
            }
          }
        }
      }
      for (let i = 0; i < 7; i++) {
        const u = AppState.bench[i];
        if (u && u.star < 3) {
          entries.push({ unit: u, zone: 'bench', idx: i });
        }
      }
      if (extraUnit && extraUnit.star < 3) {
        entries.push({ unit: extraUnit, zone: 'overflow' });
      }

      // (id + star) 기준 그룹화
      const groups = {};
      for (const entry of entries) {
        const key = `${entry.unit.id}_${entry.unit.star}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(entry);
      }

      let mergedThisPass = false;
      for (const key of Object.keys(groups)) {
        const list = groups[key];
        if (list.length >= 3) {
          const trio = list.slice(0, 3);
          const anchor = trio[0]; // 전장 우선, 그다음 좌측 대기석
          const newStar = anchor.unit.star + 1;
          const unitId = anchor.unit.id;

          // 나머지 2개 제거 (overflow 포함)
          for (let k = 1; k < 3; k++) {
            const rem = trio[k];
            if (rem.zone === 'board') {
              AppState.board[rem.row][rem.col] = null;
            } else if (rem.zone === 'bench') {
              AppState.bench[rem.idx] = null;
            } else if (rem.zone === 'overflow') {
              extraUnit = null;
            }
          }

          // 기준 기물 성급 업그레이드
          anchor.unit.star = newStar;
          if (newStar === 3) {
            AppState.stats.threeStars += 1;
          }

          if (typeof this.onSynthesizeCallback === 'function') {
            this.onSynthesizeCallback(unitId, newStar, anchor);
          }

          mergedThisPass = true;
          anyMerged = true;
          break;
        }
      }

      if (!mergedThisPass) break;
    }

    return anyMerged;
  },

  // 현재 아군 전장(Row 3~5)에 배치된 기물 수 반환
  getBoardUnitCount() {
    let count = 0;
    for (let r = 3; r < 6; r++) {
      for (let c = 0; c < 5; c++) {
        if (AppState.board[r][c]) count++;
      }
    }
    return count;
  },

  // 기물 이동 및 스왑 배치 (FR-01: 레벨 제한 검사 & 위치 맞바꾸기)
  moveOrSwap(from, to) {
    if (!from || !to) return false;
    if (from.zone === to.zone && from.idx === to.idx && from.row === to.row && from.col === to.col) {
      return false;
    }

    // 전투 중에는 대기석 내부 스왑만 허용, 전장 조작 불가
    if (AppState.phase === 'COMBAT' && (from.zone === 'board' || to.zone === 'board')) {
      this.emitToast('전투 진행 중에는 전장 배치를 변경할 수 없습니다!', 'warn');
      return false;
    }

    // 적군 구역(Row 0~2) 배치 불가
    if (to.zone === 'board' && (to.row < 3 || to.row > 5 || to.col < 0 || to.col > 4)) {
      this.emitToast('하단 아군 구역(3~5행)에만 배치할 수 있습니다!', 'warn');
      return false;
    }

    const srcUnit = from.zone === 'bench'
      ? AppState.bench[from.idx]
      : AppState.board[from.row][from.col];
    if (!srcUnit) return false;

    const dstUnit = to.zone === 'bench'
      ? AppState.bench[to.idx]
      : AppState.board[to.row][to.col];

    // 대기석 -> 빈 전장 타일 이동 시 최대 기물 수(레벨) 체크
    if (from.zone === 'bench' && to.zone === 'board' && !dstUnit) {
      const currentCount = this.getBoardUnitCount();
      if (currentCount >= AppState.level) {
        this.emitToast(`배치 한도 초과! 현재 Lv.${AppState.level} (최대 ${AppState.level}기)`, 'warn');
        return false;
      }
    }

    // 스왑 또는 이동 실행
    if (from.zone === 'bench') {
      AppState.bench[from.idx] = dstUnit || null;
    } else {
      AppState.board[from.row][from.col] = dstUnit || null;
    }

    if (to.zone === 'bench') {
      AppState.bench[to.idx] = srcUnit;
    } else {
      AppState.board[to.row][to.col] = srcUnit;
    }

    this.recalcSynergies();
    return true;
  },

  // 빈 전장 슬롯으로 빠른 자동 배치 (더블탭/빠른배치 편의 기능)
  autoDeployUnit(benchIdx) {
    if (AppState.phase !== 'PREP') return false;
    const unit = AppState.bench[benchIdx];
    if (!unit) return false;
    if (this.getBoardUnitCount() >= AppState.level) {
      this.emitToast(`배치 한도 초과! (최대 ${AppState.level}기)`, 'warn');
      return false;
    }
    const spec = PUNI_MAP[unit.id];
    // 근접(사거리 1)은 앞줄(Row 3) 우선, 원거리는 뒷줄(Row 5) 우선 배치
    const rowOrder = spec.range <= 1 ? [3, 4, 5] : [5, 4, 3];
    const colOrder = [2, 1, 3, 0, 4];
    for (const r of rowOrder) {
      for (const c of colOrder) {
        if (!AppState.board[r][c]) {
          return this.moveOrSwap({ zone: 'bench', idx: benchIdx }, { zone: 'board', row: r, col: c });
        }
      }
    }
    return false;
  },

  // 고유 기물 기준 13종 시너지 계산 (중복 ID 제외)
  computeSynergiesFromUnits(unitIds) {
    const uniqueIds = Array.from(new Set(unitIds));
    const counts = {};
    for (const id of uniqueIds) {
      const spec = PUNI_MAP[id];
      if (!spec) continue;
      counts[spec.origin] = (counts[spec.origin] || 0) + 1;
      counts[spec.job] = (counts[spec.job] || 0) + 1;
    }

    const result = {};
    for (const [synName, count] of Object.entries(counts)) {
      const meta = SYNERGY_DB[synName];
      if (!meta) continue;
      let activeTier = 0; // 0 = 미발동, 1 = 1단계, 2 = 2단계, 3 = 3단계
      let activeThreshold = 0;
      let nextThreshold = meta.thresholds[0];

      for (let i = 0; i < meta.thresholds.length; i++) {
        if (count >= meta.thresholds[i]) {
          activeTier = i + 1;
          activeThreshold = meta.thresholds[i];
          nextThreshold = meta.thresholds[i + 1] || meta.thresholds[i];
        }
      }

      result[synName] = {
        name: synName,
        count,
        activeTier,
        activeThreshold,
        nextThreshold,
        meta
      };
    }
    return result;
  },

  recalcSynergies() {
    const ids = [];
    for (let r = 3; r < 6; r++) {
      for (let c = 0; c < 5; c++) {
        const u = AppState.board[r][c];
        if (u) ids.push(u.id);
      }
    }
    AppState.activeSynergies = this.computeSynergiesFromUnits(ids);
    return AppState.activeSynergies;
  },

  // 라운드 종료 시 수입 정산 계산 및 반영 (FR-03 + 모험항해 시너지)
  settleRoundEconomy(isWin) {
    // 연승/연패 갱신
    if (isWin) {
      AppState.streak = AppState.streak > 0 ? AppState.streak + 1 : 1;
      AppState.stats.wins += 1;
    } else {
      AppState.streak = AppState.streak < 0 ? AppState.streak - 1 : -1;
      AppState.stats.losses += 1;
    }

    const baseGold = 5;
    const interestGold = Math.min(5, Math.floor(AppState.gold / 10));
    const absStreak = Math.abs(AppState.streak);
    let streakGold = 0;
    if (absStreak >= 5) streakGold = 3;
    else if (absStreak >= 4) streakGold = 2;
    else if (absStreak >= 2) streakGold = 1;

    // 모험항해 승리 보너스 확인
    let voyageGold = 0;
    const voyageSyn = AppState.activeSynergies['모험항해'];
    if (isWin && voyageSyn && voyageSyn.activeTier > 0) {
      voyageGold = voyageSyn.meta.values[voyageSyn.activeTier - 1] || 0;
    }

    const totalEarned = baseGold + interestGold + streakGold + voyageGold;
    AppState.gold += totalEarned;

    // 라운드 자연 경험치 +2 XP 지급
    const leveledUp = this.gainXp(2);

    return {
      baseGold,
      interestGold,
      streakGold,
      voyageGold,
      totalEarned,
      streak: AppState.streak,
      leveledUp
    };
  }
};

