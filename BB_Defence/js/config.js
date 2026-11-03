(function () {
  'use strict';

  const BB = (window.BB = window.BB || {});

  // 깔끔하고 세련된 MZ 감성 타이포그래피 스택 (영문/숫자 Outfit + 한글 SUITE 수트체 + Pretendard)
  BB.FONT_FAMILY = '"Outfit", "SUITE", "Pretendard Variable", "Pretendard", "IBM Plex Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
  BB.font = function (weight, sizePx) {
    return (weight || 700) + ' ' + Math.round(sizePx) + 'px ' + BB.FONT_FAMILY;
  };

  BB.CONST = {
    WIDTH: 1920,
    HEIGHT: 1080,

    // 5행 x 9열 전술 그리드 (배경 플레이매트 영역 내부 정렬)
    GRID_ROWS: 5,
    GRID_COLS: 9,
    CELL_W: 136,
    CELL_H: 128,
    GRID_X: 344, // 344 ~ 1568
    GRID_Y: 232, // 232 ~ 872

    DEFENSE_LINE_X: 318,
    SPAWN_X: 1845,

    INITIAL_DREAM: 100,
    PASSIVE_DREAM_AMOUNT: 15,
    PASSIVE_DREAM_INTERVAL: 4.5,
    MAX_DREAM: 9990,
    INITIAL_LIVES: 3,

    LAYER: {
      ALLY: 1,
      ENEMY: 2,
      ALLY_PROJ: 4,
      ENEMY_PROJ: 8
    },

    TILE: {
      EMPTY: 'EMPTY',
      BLOCK: 'BLOCK',             // 배치 불가 장애물 소품 (주사위/지우개/크리스탈)
      POWER_PAD: 'POWER_PAD',     // 별빛 증폭 패드 (배치 가능, 공속·생산속도 +35%!)
      SPEED_BELT: 'SPEED_BELT',   // 미끄럼 가속 테이프 (배치 불가, 적군 이속 1.65배)
      SPRING_TRAP: 'SPRING_TRAP', // 통통 스프링 발판 (배치 불가, 적군 공중 넉백 + 피해)
      GIFT_BOX: 'GIFT_BOX',       // 꿈방울 선물상자 (파괴 가능 중립 상자 -> +75 꿈방울 드롭 후 빈 칸 개방)
      PORTAL_IN: 'PORTAL_IN',     // 차원 거울 입구 포탈 (배치 불가, 적군을 출구 포탈로 워프)
      PORTAL_OUT: 'PORTAL_OUT',   // 차원 거울 출구 포탈 (배치 불가)
      MUSIC_BOX: 'MUSIC_BOX'      // 태엽 별빛 오르골 (클릭형 액티브 장치 -> 전체 피해 + 5초 둔화)
    }
  };

  // =========================================================================
  // 난이도 모드 정의
  // - 노말(normal): 상향 재정의된 표준 난이도 (구 어려움 수준 스탯 & 증원 웨이브 기본 적용)
  // - 어려움(hard): 노말 대비 적 HP +32%, 공격력 +30%, 이속 +12%, 정예 협공·자원 긴축·보스 4라인 탄막!
  // =========================================================================
  BB.DIFFICULTY_ORDER = ['normal', 'hard'];

  BB.DIFFICULTIES = {
    normal: {
      id: 'normal',
      name: '노말',
      badge: '🌱 노말',
      shortInfo: '표준 전술 난이도 · 정예 증원 웨이브 포함',
      detailInfo: '표준 전술 난이도 (강화된 기본 스탯 · 중후반 증원 웨이브 포함)',
      color: '#10b981',
      darkColor: '#047857',
      enemyHpMult: 1.0,
      enemyAtkMult: 1.0,
      enemySpeedMult: 1.0,
      enemyAttackRateMult: 1.0,
      bufferAuraBonus: 0,
      spawnTimeScale: 0.90,
      prepTimeScale: 0.88,
      bossCdScale: 1.0,
      bossMultiLanes: 3,
      bossSummonCount: 2,
      passiveDreamAmount: 15,
      waveClearBonus: 25,
      waveTier: 1
    },
    hard: {
      id: 'hard',
      name: '어려움',
      badge: '🔥 어려움',
      shortInfo: '노말 대비 적 HP+32% · 공+30% · 정예 협공 & 자원 긴축!',
      detailInfo: '극한 챌린지 (적 HP +32% · 공 +30% · 이속 +12% · 정예 협공 · 보스 4라인 탄막)',
      color: '#e11d48',
      darkColor: '#9f1239',
      enemyHpMult: 1.32,
      enemyAtkMult: 1.30,
      enemySpeedMult: 1.12,
      enemyAttackRateMult: 1.15,
      bufferAuraBonus: 0.10,
      spawnTimeScale: 0.82,
      prepTimeScale: 0.80,
      bossCdScale: 0.85,
      bossMultiLanes: 4,
      bossSummonCount: 3,
      passiveDreamAmount: 12,
      waveClearBonus: 15,
      waveTier: 2
    }
  };

  BB.GIMMICK_META = {
    POWER_PAD:   { icon: '⭐', name: '별빛 증폭 패드', color: '#fbbf24', shortDesc: '배치 아군 공격·생산 속도 +35% 가속!', desc: '위에 배치한 아군 피규어의 공격 속도 및 꿈방울 생산 속도가 35% 빨라집니다.' },
    BLOCK:       { icon: '🎲', name: '배치불가 소품', color: '#94a3b8', shortDesc: '아군 배치 불가 타일 (탄환은 통과)', desc: '주사위·지우개·크리스탈 소품이 놓여 아군 배치가 불가능하지만 탄환과 광선은 통과합니다.' },
    SPEED_BELT:  { icon: '⏩', name: '가속 테이프 레일', color: '#fb7185', shortDesc: '배치 불가 · 적군 이동속도 1.65배 증가!', desc: '배치가 불가능하며 위를 지나는 적군의 이동속도가 1.65배 빨라집니다. 레일 앞쪽에 탱커를 세우세요!' },
    SPRING_TRAP: { icon: '🌀', name: '통통 스프링 발판', color: '#38bdf8', shortDesc: '밟은 적을 뒤로 2칸 튕겨내며 피해!', desc: '밟은 적군을 공중으로 크게 튕겨 뒤로 밀어내며 충격 피해를 줍니다. (7.5초 재충전)' },
    GIFT_BOX:    { icon: '🎁', name: '꿈방울 선물상자', color: '#f472b6', shortDesc: '공격해 부수면 💧+75 획득 & 타일 개방!', desc: '아군의 쿠키·프라이팬·광선·폭탄으로 부수면 꿈방울(+75)이 쏟아지고 빈 타일로 열립니다!' },
    PORTAL_IN:   { icon: '🔮', name: '차원 거울 포탈', color: '#a855f7', shortDesc: '입구에 닿은 적을 출구 행으로 순간이동!', desc: '입구 포탈에 진입한 적군이 연결된 출구 포탈 라인으로 즉시 워프합니다. 출구 행 화력을 보강하세요!' },
    MUSIC_BOX:   { icon: '🎵', name: '태엽 별빛 오르골', color: '#34d399', shortDesc: '완충 시 터치하면 전체 적 피해 + 5초 둔화!', desc: '충전이 완료되었을 때 오르골이나 상단/하단 🎵 버튼을 누르면 맵 전체 적에게 90 피해와 5초 둔화를 줍니다!' }
  };

  BB.GIMMICK_ORDER = ['POWER_PAD', 'BLOCK', 'SPEED_BELT', 'SPRING_TRAP', 'GIFT_BOX', 'PORTAL_IN', 'MUSIC_BOX'];

  BB.ASSETS = {
    bg: 'assets/bg_stage_1.png',
    stageBgs: {
      1: 'assets/bg_stage_1.png',
      2: 'assets/bg_stage_2.png',
      3: 'assets/bg_stage_3.png',
      4: 'assets/bg_stage_4.png',
      5: 'assets/bg_stage_5.png'
    },
    units: {
      jammanbo: 'assets/units/ally_jammanbo.png',
      dandan: 'assets/units/ally_dandan.png',
      nyamnyam: 'assets/units/ally_nyamnyam.png',
      yori: 'assets/units/ally_yori.png',
      ttolttol: 'assets/units/ally_ttolttol.png',
      malang: 'assets/units/ally_malang.png',
      dog: 'assets/units/enemy_dog.png',
      pig: 'assets/units/enemy_pig.png',
      makeup: 'assets/units/enemy_makeup.png',
      love: 'assets/units/enemy_love.png',
      cutie: 'assets/units/enemy_cutie.png',
      secret: 'assets/units/enemy_secret.png'
    }
  };

  BB.ALLY_ORDER = ['jammanbo', 'dandan', 'nyamnyam', 'yori', 'ttolttol', 'malang'];
  BB.ENEMY_ORDER = ['dog', 'pig', 'makeup', 'love', 'cutie', 'secret'];

  BB.ALLY_DB = {
    jammanbo: {
      id: 'jammanbo',
      hotkey: '1',
      name: '잠만보쁘니',
      role: '자원 생산',
      cost: 50,
      deckCd: 4.0,
      hp: 320,
      atk: 0,
      range: 0,
      actionCd: 8.5,
      firstActionDelay: 4.0,
      produceAmount: 25,
      type: 'resource',
      accent: '#9ad8ff',
      badgeBg: '#3b82c4',
      shortDesc: '8.5초마다 꿈방울(💧+25)을 생산합니다.',
      desc: '포근한 베개 위에서 8.5초마다 꿈방울(+25)을 만들어냅니다. 초반 후열(1~2열)에 우선 배치하세요!'
    },
    dandan: {
      id: 'dandan',
      hotkey: '2',
      name: '단단쁘니',
      role: '메인 탱커',
      cost: 50,
      deckCd: 8.5,
      hp: 2000,
      atk: 12,
      range: 88,
      actionCd: 1.7,
      type: 'tank',
      accent: '#ffe39f',
      badgeBg: '#c98a2c',
      shortDesc: '체력 2000 든든한 탱커! 근접 정권 잽 공격.',
      desc: '압도적인 체력(2000)으로 전열을 굳건히 지키며 코앞의 적에게 태권도 정권 잽을 날립니다.'
    },
    nyamnyam: {
      id: 'nyamnyam',
      hotkey: '3',
      name: '냠냠쁘니',
      role: '원거리 딜러',
      cost: 100,
      deckCd: 4.0,
      hp: 320,
      atk: 28,
      range: 1600,
      actionCd: 1.3,
      projSpeed: 500,
      type: 'ranged',
      accent: '#ffb37b',
      badgeBg: '#d96b27',
      shortDesc: '직선 초코칩 쿠키 투척! 적·선물상자 타격.',
      desc: '같은 줄의 적이나 선물상자를 향해 바삭한 초코칩 쿠키를 연속으로 던져 안정적인 피해를 줍니다.'
    },
    yori: {
      id: 'yori',
      hotkey: '4',
      name: '요리쁘니',
      role: '근거리 광역',
      cost: 150,
      deckCd: 6.5,
      hp: 600,
      atk: 52,
      range: 220,
      actionCd: 1.65,
      type: 'melee_aoe',
      accent: '#ff8e8e',
      badgeBg: '#cf3e4e',
      shortDesc: '전방 광역 프라이팬 스윙 + 넉백 밀치기!',
      desc: '전방 1.6칸 내의 모든 적과 상자를 프라이팬으로 동시에 강타하고 뒤로 살짝 밀쳐냅니다.'
    },
    ttolttol: {
      id: 'ttolttol',
      hotkey: '5',
      name: '똘똘쁘니',
      role: '직선 관통',
      cost: 200,
      deckCd: 8.0,
      hp: 340,
      atk: 42,
      range: 1600,
      actionCd: 2.1,
      type: 'pierce',
      accent: '#8ef0b8',
      badgeBg: '#2e9e68',
      shortDesc: '줄 끝까지 모든 적·상자를 꿰뚫는 관통 광선!',
      desc: '지식의 마법책을 펼쳐 해당 라인 끝까지 모든 적과 선물상자를 동시에 꿰뚫는 관통 광선을 쏩니다.'
    },
    malang: {
      id: 'malang',
      hotkey: '6',
      name: '말랑쁘니',
      role: '3×3 광역폭탄',
      cost: 150,
      deckCd: 16.0,
      hp: 9999,
      atk: 650,
      range: 230,
      fuseTime: 1.0,
      type: 'bomb',
      accent: '#ff9be2',
      badgeBg: '#c93ba2',
      shortDesc: '배치 1초 후 주변 3×3 칸에 650 대폭발 피해!',
      desc: '배치 1초 후 꽃무늬 에너지를 폭발시켜 주변 3×3 칸의 모든 적과 상자에 650의 폭발 피해를 줍니다.'
    }
  };

  BB.ENEMY_DB = {
    dog: {
      id: 'dog',
      name: '강아지쁘니',
      role: '고속 돌격형',
      hp: 150,
      atk: 17,
      speed: 74,
      scale: 0.96,
      dropDream: 5,
      type: 'rush',
      accent: '#ffd27d',
      desc: '체력은 낮지만 통통 튀는 빠른 발걸음으로 빈 라인을 매섭게 파고듭니다.'
    },
    pig: {
      id: 'pig',
      name: '돼지쁘니',
      role: '중장갑 탱커',
      hp: 1080,
      atk: 36,
      speed: 40,
      scale: 1.05,
      dropDream: 10,
      type: 'tank',
      accent: '#ffa8c5',
      desc: '두꺼운 체력으로 쿠키 세례를 버티며 전선을 묵직하게 압박합니다.'
    },
    makeup: {
      id: 'makeup',
      name: '화장쁘니',
      role: '원거리 견제',
      hp: 250,
      atk: 32,
      attackCd: 1.5,
      range: 390,
      projSpeed: 380,
      speed: 60,
      scale: 0.98,
      dropDream: 5,
      type: 'ranged',
      accent: '#ff6ba9',
      desc: '멀리서 걸음을 멈추고 매서운 핑크 퍼프 하트를 날려 방어 진영을 무너뜨립니다.'
    },
    love: {
      id: 'love',
      name: '사랑쁘니',
      role: '광역 버퍼',
      hp: 340,
      atk: 24,
      speed: 55,
      auraRadius: 230,
      speedMult: 1.35,
      scale: 1.0,
      dropDream: 10,
      type: 'buffer',
      accent: '#ff5277',
      desc: '주변 침공 쁘니들에게 응원 하트 오라를 둘러 이동·공격 속도를 크게 높여줍니다.'
    },
    cutie: {
      id: 'cutie',
      name: '큐티쁘니',
      role: '중간 보스',
      hp: 2400,
      atk: 102,
      speed: 35,
      scale: 1.2,
      dropDream: 25,
      isMiniBoss: true,
      type: 'miniboss',
      accent: '#ffe680',
      desc: '리본 오라를 두른 중간 보스! 강력한 근접 타격으로 단단쁘니의 방어를 부숩니다.'
    },
    secret: {
      id: 'secret',
      name: '시크릿쁘니',
      role: '최종 보스',
      hp: 5200,
      atk: 118,
      skillDmg: 50,
      skillCd: 3.8,
      summonCd: 7.8,
      speed: 24,
      scale: 1.34,
      dropDream: 50,
      isBoss: true,
      type: 'boss',
      accent: '#e3b0ff',
      desc: '요정 왕관을 쓴 최종 보스! 다중 라인 별빛 탄막과 정예 호위병 소환 마법을 구사합니다.'
    }
  };

  // =========================================================================
  // 5단계 스테이지 캠페인 정의 (각 스테이지 고유 기믹 & 맞춤 웨이브)
  // =========================================================================
  BB.STAGES = [
    // -----------------------------------------------------------------------
    // STAGE 1: 햇살 원목 책상 (기본 입문 + 별빛 증폭 패드)
    // -----------------------------------------------------------------------
    {
      id: 1,
      bgKey: 1,
      shortName: '햇살 원목 책상',
      name: '1단계 · 햇살 원목 책상',
      subtitle: '따스한 햇살 매트! 별빛 증폭 패드(⭐) 위에 주력 딜러를 배치해 보세요.',
      badgeColor: '#f59e0b',
      tintColor: '',
      borderAccent: 'rgba(251, 191, 36, 0.55)',
      gimmickTags: ['POWER_PAD'],
      initialDream: 100,
      tiles: [
        { r: 1, c: 3, type: 'POWER_PAD' },
        { r: 2, c: 2, type: 'POWER_PAD' },
        { r: 3, c: 3, type: 'POWER_PAD' }
      ],
      waves: [
        {
          wave: 1,
          title: 'STAGE 1 - WAVE 1 · 첫 만남',
          subtitle: '잠만보쁘니로 꿈방울을 모으고 별빛 패드(⭐)를 활용해 보세요!',
          prepTime: 7.0,
          spawns: [
            { t: 4.5, unit: 'dog', row: 2 },
            { t: 15.0, unit: 'dog', row: 1 },
            { t: 25.0, unit: 'dog', row: 3 },
            { t: 34.0, unit: 'dog', row: 0 },
            { t: 42.0, unit: 'dog', row: 4 },
            { t: 49.0, unit: 'pig', row: 2 }
          ]
        },
        {
          wave: 2,
          title: 'STAGE 1 - WAVE 2 · 꾸벅꾸벅 행진',
          subtitle: '튼튼한 돼지쁘니 앞에는 단단쁘니를 세워 주세요!',
          prepTime: 4.5,
          spawns: [
            { t: 2.0, unit: 'dog', row: 1 },
            { t: 5.5, unit: 'pig', row: 2 },
            { t: 9.0, unit: 'dog', row: 3 },
            { t: 13.0, unit: 'makeup', row: 1 },
            { t: 16.5, unit: 'dog', row: 0 },
            { t: 20.0, unit: 'pig', row: 3 },
            { t: 23.0, unit: 'dog', row: 4 }
          ]
        },
        {
          wave: 3,
          title: 'STAGE 1 - WAVE 3 · 핑크빛 소동',
          subtitle: '원거리에서 퍼프를 던지는 화장쁘니는 관통·광역 딜러로 제압하세요!',
          prepTime: 4.5,
          spawns: [
            { t: 2.0, unit: 'pig', row: 1 },
            { t: 4.0, unit: 'makeup', row: 1 },
            { t: 7.5, unit: 'dog', row: 0 },
            { t: 9.0, unit: 'dog', row: 4 },
            { t: 13.0, unit: 'pig', row: 3 },
            { t: 15.0, unit: 'makeup', row: 3 },
            { t: 19.0, unit: 'dog', row: 2 },
            { t: 21.0, unit: 'dog', row: 2 }
          ]
        },
        {
          wave: 4,
          title: 'STAGE 1 - FINAL WAVE · 큐티쁘니의 등장!',
          subtitle: '1단계 보스 큐티쁘니를 막아내면 스테이지 클리어!',
          prepTime: 5.0,
          spawns: [
            { t: 1.5, unit: 'pig', row: 2 },
            { t: 4.5, unit: 'cutie', row: 2 },
            { t: 7.5, unit: 'makeup', row: 1 },
            { t: 9.0, unit: 'makeup', row: 3 },
            { t: 13.0, unit: 'dog', row: 0 },
            { t: 14.5, unit: 'dog', row: 4 },
            { t: 18.0, unit: 'pig', row: 1 },
            { t: 20.0, unit: 'dog', row: 3 }
          ]
        }
      ]
    },

    // -----------------------------------------------------------------------
    // STAGE 2: 알록달록 문구점 매트 (배치불가 블록 + 가속 테이프 레일)
    // -----------------------------------------------------------------------
    {
      id: 2,
      bgKey: 2,
      shortName: '알록달록 문구점 매트',
      name: '2단계 · 알록달록 문구점 매트',
      subtitle: '주사위 소품(🎲)은 배치가 불가능하며, 상·하단 가속 레일(⏩)에서 적이 빨라집니다!',
      badgeColor: '#fb7185',
      tintColor: '',
      borderAccent: 'rgba(251, 113, 133, 0.6)',
      gimmickTags: ['BLOCK', 'SPEED_BELT', 'POWER_PAD'],
      initialDream: 115,
      tiles: [
        // 배치불가 문구 블록 5개
        { r: 0, c: 2, type: 'BLOCK', variant: 'dice' },
        { r: 1, c: 4, type: 'BLOCK', variant: 'eraser' },
        { r: 2, c: 3, type: 'BLOCK', variant: 'dice' },
        { r: 3, c: 4, type: 'BLOCK', variant: 'eraser' },
        { r: 4, c: 2, type: 'BLOCK', variant: 'dice' },
        // 외곽 급행 가속 테이프 레일
        { r: 0, c: 5, type: 'SPEED_BELT' },
        { r: 0, c: 6, type: 'SPEED_BELT' },
        { r: 0, c: 7, type: 'SPEED_BELT' },
        { r: 4, c: 5, type: 'SPEED_BELT' },
        { r: 4, c: 6, type: 'SPEED_BELT' },
        { r: 4, c: 7, type: 'SPEED_BELT' },
        // 가속 레일 방어용 별빛 패드
        { r: 0, c: 3, type: 'POWER_PAD' },
        { r: 4, c: 3, type: 'POWER_PAD' }
      ],
      waves: [
        {
          wave: 1,
          title: 'STAGE 2 - WAVE 1 · 미끄럼 주의보!',
          subtitle: '1행과 5행 가속 테이프를 타고 달려오는 강아지쁘니를 먼저 막으세요!',
          prepTime: 7.0,
          spawns: [
            { t: 4.5, unit: 'dog', row: 0 },
            { t: 14.5, unit: 'dog', row: 4 },
            { t: 24.0, unit: 'dog', row: 2 },
            { t: 33.0, unit: 'dog', row: 1 },
            { t: 41.0, unit: 'dog', row: 3 },
            { t: 48.0, unit: 'pig', row: 0 }
          ]
        },
        {
          wave: 2,
          title: 'STAGE 2 - WAVE 2 · 급행 돼지 열차',
          subtitle: '가속 레일 끝자락(4열)에 단단쁘니를 세워 돌진을 멈추세요!',
          prepTime: 4.5,
          spawns: [
            { t: 2.0, unit: 'pig', row: 4 },
            { t: 5.5, unit: 'dog', row: 0 },
            { t: 8.5, unit: 'makeup', row: 2 },
            { t: 12.0, unit: 'pig', row: 1 },
            { t: 15.0, unit: 'dog', row: 4 },
            { t: 18.0, unit: 'makeup', row: 3 },
            { t: 21.5, unit: 'dog', row: 0 },
            { t: 23.0, unit: 'dog', row: 2 }
          ]
        },
        {
          wave: 3,
          title: 'STAGE 2 - WAVE 3 · 응원단 합류',
          subtitle: '사랑쁘니의 버프와 가속 레일이 겹치기 전에 관통 광선으로 끊어내세요!',
          prepTime: 5.0,
          spawns: [
            { t: 2.0, unit: 'pig', row: 0 },
            { t: 3.5, unit: 'love', row: 0 },
            { t: 7.5, unit: 'dog', row: 2 },
            { t: 9.5, unit: 'makeup', row: 1 },
            { t: 13.0, unit: 'pig', row: 4 },
            { t: 14.5, unit: 'love', row: 4 },
            { t: 18.0, unit: 'dog', row: 3 },
            { t: 20.5, unit: 'makeup', row: 2 },
            { t: 23.0, unit: 'dog', row: 0 }
          ]
        },
        {
          wave: 4,
          title: 'STAGE 2 - FINAL WAVE · 양날개 돌파전!',
          subtitle: '상·하단 더블 큐티쁘니의 협공을 막아내세요!',
          prepTime: 5.0,
          spawns: [
            { t: 2.0, unit: 'cutie', row: 0 },
            { t: 5.0, unit: 'makeup', row: 0 },
            { t: 8.5, unit: 'pig', row: 2 },
            { t: 10.0, unit: 'love', row: 2 },
            { t: 13.5, unit: 'cutie', row: 4 },
            { t: 16.0, unit: 'makeup', row: 4 },
            { t: 19.0, unit: 'dog', row: 1 },
            { t: 20.0, unit: 'dog', row: 3 },
            { t: 22.5, unit: 'dog', row: 2 }
          ]
        }
      ]
    },

    // -----------------------------------------------------------------------
    // STAGE 3: 통통 태엽 공방 (스프링 발판 + 파괴형 꿈방울 선물상자)
    // -----------------------------------------------------------------------
    {
      id: 3,
      bgKey: 3,
      shortName: '통통 태엽 공방',
      name: '3단계 · 통통 태엽 공방',
      subtitle: '스프링 발판(🌀)이 적을 튕겨내고, 선물상자(🎁)를 부수면 꿈방울(+75)이 쏟아집니다!',
      badgeColor: '#10b981',
      tintColor: '',
      borderAccent: 'rgba(52, 211, 153, 0.6)',
      gimmickTags: ['SPRING_TRAP', 'GIFT_BOX', 'BLOCK'],
      initialDream: 115,
      tiles: [
        // 통통 스프링 트랩 3개
        { r: 0, c: 4, type: 'SPRING_TRAP' },
        { r: 2, c: 5, type: 'SPRING_TRAP' },
        { r: 4, c: 4, type: 'SPRING_TRAP' },
        // 파괴 시 +75 꿈방울을 주는 선물상자 3개
        { r: 1, c: 5, type: 'GIFT_BOX', hp: 280, reward: 75 },
        { r: 2, c: 3, type: 'GIFT_BOX', hp: 260, reward: 75 },
        { r: 3, c: 5, type: 'GIFT_BOX', hp: 280, reward: 75 },
        // 배치불가 공방 블록 2개
        { r: 1, c: 2, type: 'BLOCK', variant: 'dice' },
        { r: 3, c: 2, type: 'BLOCK', variant: 'dice' }
      ],
      waves: [
        {
          wave: 1,
          title: 'STAGE 3 - WAVE 1 · 선물상자 사냥!',
          subtitle: '2·3·4행에 딜러를 배치해 선물상자(🎁)를 깨고 보너스 꿈방울을 챙기세요!',
          prepTime: 7.0,
          spawns: [
            { t: 5.0, unit: 'dog', row: 0 },
            { t: 15.0, unit: 'dog', row: 4 },
            { t: 24.5, unit: 'dog', row: 2 },
            { t: 33.0, unit: 'dog', row: 1 },
            { t: 41.0, unit: 'dog', row: 3 },
            { t: 47.0, unit: 'pig', row: 2 }
          ]
        },
        {
          wave: 2,
          title: 'STAGE 3 - WAVE 2 · 보잉보잉 스프링!',
          subtitle: '스프링에 튕겨 뭉친 적들에게 요리쁘니의 광역 스윙이 효과적입니다!',
          prepTime: 4.5,
          spawns: [
            { t: 2.0, unit: 'pig', row: 0 },
            { t: 4.5, unit: 'dog', row: 0 },
            { t: 8.5, unit: 'pig', row: 4 },
            { t: 11.0, unit: 'dog', row: 4 },
            { t: 15.0, unit: 'makeup', row: 1 },
            { t: 17.5, unit: 'makeup', row: 3 },
            { t: 21.0, unit: 'dog', row: 2 },
            { t: 23.0, unit: 'pig', row: 2 }
          ]
        },
        {
          wave: 3,
          title: 'STAGE 3 - WAVE 3 · 전열 압박',
          subtitle: '풍부해진 꿈방울로 똘똘쁘니를 여럿 배치해 화력을 끌어올리세요!',
          prepTime: 4.5,
          spawns: [
            { t: 2.0, unit: 'pig', row: 1 },
            { t: 3.5, unit: 'love', row: 1 },
            { t: 7.0, unit: 'makeup', row: 2 },
            { t: 9.5, unit: 'dog', row: 0 },
            { t: 11.0, unit: 'dog', row: 4 },
            { t: 14.5, unit: 'pig', row: 3 },
            { t: 16.0, unit: 'love', row: 3 },
            { t: 19.5, unit: 'cutie', row: 2 },
            { t: 22.5, unit: 'dog', row: 1 },
            { t: 23.5, unit: 'dog', row: 3 }
          ]
        },
        {
          wave: 4,
          title: 'STAGE 3 - WAVE 4 · 대혼전 공방',
          subtitle: '말랑쁘니 3×3 폭탄으로 뭉친 적들을 한 번에 날려버리세요!',
          prepTime: 5.0,
          spawns: [
            { t: 1.5, unit: 'pig', row: 0 },
            { t: 2.5, unit: 'pig', row: 4 },
            { t: 5.5, unit: 'makeup', row: 0 },
            { t: 6.5, unit: 'makeup', row: 4 },
            { t: 10.0, unit: 'cutie', row: 1 },
            { t: 12.5, unit: 'love', row: 2 },
            { t: 15.5, unit: 'cutie', row: 3 },
            { t: 18.5, unit: 'dog', row: 2 },
            { t: 19.5, unit: 'dog', row: 0 },
            { t: 20.5, unit: 'dog', row: 4 }
          ]
        },
        {
          wave: 5,
          title: 'STAGE 3 - FINAL WAVE · 트리플 리본 군단!',
          subtitle: '큐티쁘니 3기의 총공세를 막아내면 3단계 승리!',
          prepTime: 5.0,
          spawns: [
            { t: 2.0, unit: 'cutie', row: 0 },
            { t: 4.5, unit: 'love', row: 1 },
            { t: 7.5, unit: 'cutie', row: 2 },
            { t: 10.0, unit: 'makeup', row: 2 },
            { t: 13.0, unit: 'cutie', row: 4 },
            { t: 15.0, unit: 'love', row: 3 },
            { t: 18.0, unit: 'pig', row: 1 },
            { t: 19.0, unit: 'pig', row: 3 },
            { t: 22.0, unit: 'dog', row: 0 },
            { t: 22.5, unit: 'dog', row: 2 },
            { t: 23.0, unit: 'dog', row: 4 }
          ]
        }
      ]
    },

    // -----------------------------------------------------------------------
    // STAGE 4: 요술 거울의 밤 (차원 워프 포탈 + 클릭형 태엽 오르골)
    // -----------------------------------------------------------------------
    {
      id: 4,
      bgKey: 4,
      shortName: '요술 거울의 밤',
      name: '4단계 · 요술 거울의 밤',
      subtitle: '1·5행의 적이 거울 포탈(🔮)을 타고 2·4행으로 워프합니다! 오르골(🎵)도 발동해 보세요!',
      badgeColor: '#8b5cf6',
      tintColor: '',
      borderAccent: 'rgba(196, 181, 253, 0.7)',
      gimmickTags: ['PORTAL_IN', 'MUSIC_BOX', 'BLOCK', 'POWER_PAD'],
      initialDream: 125,
      tiles: [
        // 1행(row 0, col 6) -> 2행(row 1, col 5) 워프 포탈 쌍 #1
        { r: 0, c: 6, type: 'PORTAL_IN', pairId: 'P1', outRow: 1, outCol: 5, portalColor: '#c084fc' },
        { r: 1, c: 5, type: 'PORTAL_OUT', pairId: 'P1', portalColor: '#c084fc' },
        // 5행(row 4, col 6) -> 4행(row 3, col 5) 워프 포탈 쌍 #2
        { r: 4, c: 6, type: 'PORTAL_IN', pairId: 'P2', outRow: 3, outCol: 5, portalColor: '#38bdf8' },
        { r: 3, c: 5, type: 'PORTAL_OUT', pairId: 'P2', portalColor: '#38bdf8' },
        // 액티브 장치: 태엽 별빛 오르골 (클릭 시 전체 슬로우 & 데미지!)
        { r: 2, c: 1, type: 'MUSIC_BOX' },
        // 중앙 2·3·4행 화력 집중용 증폭 패드
        { r: 1, c: 2, type: 'POWER_PAD' },
        { r: 3, c: 2, type: 'POWER_PAD' },
        // 배치불가 밤하늘 크리스탈 블록
        { r: 0, c: 3, type: 'BLOCK', variant: 'crystal' },
        { r: 2, c: 4, type: 'BLOCK', variant: 'crystal' },
        { r: 4, c: 3, type: 'BLOCK', variant: 'crystal' }
      ],
      waves: [
        {
          wave: 1,
          title: 'STAGE 4 - WAVE 1 · 요술 거울의 비밀',
          subtitle: '1·5행 적들이 포탈을 타고 2·4행으로 모입니다! 중앙 2·3·4행 방어에 집중하세요!',
          prepTime: 7.0,
          spawns: [
            { t: 4.5, unit: 'dog', row: 0 },
            { t: 13.5, unit: 'dog', row: 4 },
            { t: 22.0, unit: 'dog', row: 2 },
            { t: 30.0, unit: 'dog', row: 1 },
            { t: 37.5, unit: 'dog', row: 3 },
            { t: 44.0, unit: 'pig', row: 0 }
          ]
        },
        {
          wave: 2,
          title: 'STAGE 4 - WAVE 2 · 차원 합류',
          subtitle: '충전된 태엽 오르골(🎵)을 클릭하면 모든 적이 느려집니다!',
          prepTime: 4.5,
          spawns: [
            { t: 2.0, unit: 'pig', row: 4 },
            { t: 5.0, unit: 'makeup', row: 0 },
            { t: 8.5, unit: 'dog', row: 2 },
            { t: 12.0, unit: 'pig', row: 1 },
            { t: 15.0, unit: 'makeup', row: 4 },
            { t: 18.5, unit: 'dog', row: 0 },
            { t: 20.5, unit: 'dog', row: 3 },
            { t: 23.0, unit: 'pig', row: 2 }
          ]
        },
        {
          wave: 3,
          title: 'STAGE 4 - WAVE 3 · 집중 포화 구간',
          subtitle: '2행과 4행에 모이는 적들을 요리쁘니·똘똘쁘니로 일망타진하세요!',
          prepTime: 4.5,
          spawns: [
            { t: 1.5, unit: 'pig', row: 0 },
            { t: 3.0, unit: 'love', row: 0 },
            { t: 6.5, unit: 'dog', row: 1 },
            { t: 8.0, unit: 'makeup', row: 2 },
            { t: 11.5, unit: 'pig', row: 4 },
            { t: 13.0, unit: 'love', row: 4 },
            { t: 16.5, unit: 'cutie', row: 0 },
            { t: 20.0, unit: 'dog', row: 2 },
            { t: 21.5, unit: 'dog', row: 3 }
          ]
        },
        {
          wave: 4,
          title: 'STAGE 4 - WAVE 4 · 거울 미궁 대공세',
          subtitle: '포탈 출구 앞 단단쁘니의 체력을 주의 깊게 살피세요!',
          prepTime: 5.0,
          spawns: [
            { t: 1.5, unit: 'cutie', row: 4 },
            { t: 4.0, unit: 'makeup', row: 1 },
            { t: 6.0, unit: 'makeup', row: 3 },
            { t: 9.5, unit: 'love', row: 2 },
            { t: 11.5, unit: 'pig', row: 2 },
            { t: 14.5, unit: 'cutie', row: 0 },
            { t: 17.5, unit: 'dog', row: 0 },
            { t: 18.5, unit: 'dog', row: 4 },
            { t: 20.0, unit: 'dog', row: 2 }
          ]
        },
        {
          wave: 5,
          title: 'STAGE 4 - FINAL WAVE · 밤의 그림자 여단!',
          subtitle: '시크릿쁘니의 친위대가 몰려옵니다! 오르골과 말랑 폭탄을 적시에 발동하세요!',
          prepTime: 5.5,
          spawns: [
            { t: 2.0, unit: 'pig', row: 1 },
            { t: 2.5, unit: 'pig', row: 3 },
            { t: 5.5, unit: 'cutie', row: 2 },
            { t: 8.0, unit: 'love', row: 0 },
            { t: 9.0, unit: 'love', row: 4 },
            { t: 12.5, unit: 'cutie', row: 0 },
            { t: 14.0, unit: 'cutie', row: 4 },
            { t: 17.5, unit: 'makeup', row: 1 },
            { t: 18.5, unit: 'makeup', row: 3 },
            { t: 21.0, unit: 'dog', row: 0 },
            { t: 21.5, unit: 'dog', row: 2 },
            { t: 22.0, unit: 'dog', row: 4 }
          ]
        }
      ]
    },

    // -----------------------------------------------------------------------
    // STAGE 5: 요정 여왕의 황혼 성소 (올스타 복합 기믹 + 최종보스 시크릿쁘니)
    // -----------------------------------------------------------------------
    {
      id: 5,
      bgKey: 5,
      shortName: '요정 여왕의 황혼 성소',
      name: '5단계 · 요정 여왕의 황혼 성소',
      subtitle: '모든 기믹이 총집결한 최종 결전장! 요정 여왕 시크릿쁘니를 물리치세요!',
      badgeColor: '#ec4899',
      tintColor: '',
      borderAccent: 'rgba(244, 114, 182, 0.7)',
      gimmickTags: ['BLOCK', 'SPEED_BELT', 'SPRING_TRAP', 'GIFT_BOX', 'MUSIC_BOX', 'POWER_PAD'],
      initialDream: 125,
      tiles: [
        // 크리스탈 장애물 기둥 4개
        { r: 0, c: 4, type: 'BLOCK', variant: 'crystal' },
        { r: 1, c: 3, type: 'BLOCK', variant: 'crystal' },
        { r: 3, c: 3, type: 'BLOCK', variant: 'crystal' },
        { r: 4, c: 4, type: 'BLOCK', variant: 'crystal' },
        // 급행 가속 레일
        { r: 1, c: 6, type: 'SPEED_BELT' },
        { r: 1, c: 7, type: 'SPEED_BELT' },
        { r: 3, c: 6, type: 'SPEED_BELT' },
        { r: 3, c: 7, type: 'SPEED_BELT' },
        // 통통 스프링 발판
        { r: 1, c: 5, type: 'SPRING_TRAP' },
        { r: 3, c: 5, type: 'SPRING_TRAP' },
        // 초반 자원 부스트 선물상자
        { r: 0, c: 6, type: 'GIFT_BOX', hp: 280, reward: 75 },
        { r: 4, c: 6, type: 'GIFT_BOX', hp: 280, reward: 75 },
        // 별빛 증폭 패드 명당
        { r: 0, c: 2, type: 'POWER_PAD' },
        { r: 2, c: 2, type: 'POWER_PAD' },
        { r: 4, c: 2, type: 'POWER_PAD' },
        // 후열 중앙 오르골
        { r: 2, c: 0, type: 'MUSIC_BOX' }
      ],
      waves: [
        {
          wave: 1,
          title: 'STAGE 5 - WAVE 1 · 황혼의 전조',
          subtitle: '1·5행 선물상자를 부숴 꿈방울을 확보하고 전 라인 방어망을 구축하세요!',
          prepTime: 7.0,
          spawns: [
            { t: 4.5, unit: 'dog', row: 2 },
            { t: 14.0, unit: 'dog', row: 1 },
            { t: 23.5, unit: 'dog', row: 3 },
            { t: 32.0, unit: 'dog', row: 0 },
            { t: 39.5, unit: 'dog', row: 4 },
            { t: 46.5, unit: 'pig', row: 2 },
            { t: 51.0, unit: 'dog', row: 1 }
          ]
        },
        {
          wave: 2,
          title: 'STAGE 5 - WAVE 2 · 성소 수비전',
          subtitle: '2·4행 가속 레일과 스프링 발판 앞쪽에 광역 화력을 배치하세요!',
          prepTime: 4.5,
          spawns: [
            { t: 2.0, unit: 'dog', row: 0 },
            { t: 4.5, unit: 'pig', row: 2 },
            { t: 7.5, unit: 'dog', row: 4 },
            { t: 11.0, unit: 'makeup', row: 2 },
            { t: 14.0, unit: 'pig', row: 1 },
            { t: 16.5, unit: 'dog', row: 3 },
            { t: 19.5, unit: 'makeup', row: 1 },
            { t: 22.5, unit: 'dog', row: 0 },
            { t: 24.0, unit: 'pig', row: 3 }
          ]
        },
        {
          wave: 3,
          title: 'STAGE 5 - WAVE 3 · 요정 근위대 진격',
          subtitle: '사랑쁘니의 하트 버프와 큐티쁘니의 돌파를 오르골(🎵)로 늦추세요!',
          prepTime: 5.0,
          spawns: [
            { t: 2.0, unit: 'pig', row: 1 },
            { t: 3.5, unit: 'love', row: 1 },
            { t: 6.5, unit: 'dog', row: 0 },
            { t: 7.5, unit: 'dog', row: 2 },
            { t: 11.0, unit: 'pig', row: 3 },
            { t: 12.5, unit: 'makeup', row: 3 },
            { t: 15.5, unit: 'love', row: 2 },
            { t: 17.0, unit: 'dog', row: 4 },
            { t: 20.0, unit: 'cutie', row: 2 },
            { t: 22.5, unit: 'makeup', row: 0 },
            { t: 24.5, unit: 'dog', row: 4 }
          ]
        },
        {
          wave: 4,
          title: 'STAGE 5 - WAVE 4 · 폭풍 전야',
          subtitle: '곧 시크릿쁘니가 강림합니다! 모든 행에 관통 딜러와 탱커를 완비하세요!',
          prepTime: 5.0,
          spawns: [
            { t: 1.5, unit: 'pig', row: 0 },
            { t: 2.5, unit: 'pig', row: 4 },
            { t: 4.5, unit: 'makeup', row: 0 },
            { t: 5.5, unit: 'makeup', row: 4 },
            { t: 8.5, unit: 'love', row: 2 },
            { t: 9.5, unit: 'dog', row: 1 },
            { t: 10.0, unit: 'dog', row: 3 },
            { t: 13.5, unit: 'cutie', row: 1 },
            { t: 15.5, unit: 'cutie', row: 3 },
            { t: 18.5, unit: 'love', row: 1 },
            { t: 20.0, unit: 'makeup', row: 2 },
            { t: 22.0, unit: 'dog', row: 0 },
            { t: 22.5, unit: 'dog', row: 4 }
          ]
        },
        {
          wave: 5,
          title: 'FINAL BOSS · 요정 여왕 시크릿쁘니 강림!',
          subtitle: '3라인 별빛 탄막과 호위병 소환을 버텨내고 최후의 승리를 쟁취하세요!',
          prepTime: 6.0,
          spawns: [
            { t: 1.5, unit: 'pig', row: 1 },
            { t: 2.0, unit: 'pig', row: 3 },
            { t: 4.0, unit: 'secret', row: 2 },
            { t: 6.5, unit: 'love', row: 2 },
            { t: 9.0, unit: 'makeup', row: 1 },
            { t: 10.0, unit: 'makeup', row: 3 },
            { t: 13.5, unit: 'dog', row: 0 },
            { t: 14.0, unit: 'dog', row: 4 },
            { t: 17.5, unit: 'cutie', row: 0 },
            { t: 19.5, unit: 'pig', row: 4 },
            { t: 21.0, unit: 'love', row: 3 },
            { t: 24.0, unit: 'makeup', row: 4 },
            { t: 26.0, unit: 'dog', row: 1 },
            { t: 26.5, unit: 'dog', row: 2 },
            { t: 27.0, unit: 'dog', row: 3 }
          ]
        }
      ]
    }
  ];

  // 하위 호환용 기본 웨이브 참조
  BB.WAVES = BB.STAGES[4].waves;
})();
