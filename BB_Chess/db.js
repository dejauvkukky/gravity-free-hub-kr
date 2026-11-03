// ============================================================================
// 『쁘니토체스 (BB Chess)』 - 30종 3D 피규어 마스터 DB, 13종 시너지, 확률표 & 15웨이브
// (이모지 무사용 · 순수 게임 데이터 및 상태 스키마)
// ============================================================================

function generateUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'uid_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now().toString(36);
}

// 코스트별 메탈릭 테마 컬러 및 공유 기물 풀 총 수량 (FR-02)
const COST_META = {
  1: {
    name: '1코스트',
    border: '#94a3b8',
    pedestalRim: '#64748b',
    pedestalTop: '#cbd5e1',
    cardBg: 'radial-gradient(circle at 50% 38%, #f8fafc 0%, #cbd5e1 100%)',
    badge: '#475569',
    poolSize: 18
  },
  2: {
    name: '2코스트',
    border: '#22c55e',
    pedestalRim: '#15803d',
    pedestalTop: '#86efac',
    cardBg: 'radial-gradient(circle at 50% 38%, #ecfdf5 0%, #86efac 100%)',
    badge: '#15803d',
    poolSize: 15
  },
  3: {
    name: '3코스트',
    border: '#3b82f6',
    pedestalRim: '#1d4ed8',
    pedestalTop: '#93c5fd',
    cardBg: 'radial-gradient(circle at 50% 38%, #eff6ff 0%, #93c5fd 100%)',
    badge: '#1d4ed8',
    poolSize: 12
  },
  4: {
    name: '4코스트',
    border: '#a855f7',
    pedestalRim: '#7e22ce',
    pedestalTop: '#d8b4fe',
    cardBg: 'radial-gradient(circle at 50% 38%, #faf5ff 0%, #d8b4fe 100%)',
    badge: '#7e22ce',
    poolSize: 10
  },
  5: {
    name: '5코스트',
    border: '#f59e0b',
    pedestalRim: '#b45309',
    pedestalTop: '#fde047',
    cardBg: 'radial-gradient(circle at 50% 38%, #fffbeb 0%, #fcd34d 100%)',
    badge: '#b45309',
    poolSize: 8
  }
};

// 레벨별 필요 경험치 및 상점 코스트 등장 확률(%) 테이블
const LEVEL_TABLE = {
  3: { xpToNext: 4,  odds: [75, 25, 0,  0,  0 ] },
  4: { xpToNext: 8,  odds: [55, 30, 15, 0,  0 ] },
  5: { xpToNext: 12, odds: [45, 33, 20, 2,  0 ] },
  6: { xpToNext: 20, odds: [30, 40, 25, 5,  0 ] },
  7: { xpToNext: 32, odds: [19, 30, 35, 15, 1 ] },
  8: { xpToNext: 48, odds: [15, 20, 35, 25, 5 ] },
  9: { xpToNext: 0,  odds: [10, 15, 30, 30, 15] }
};

// 30종 말랑쁘니 3D 피규어 마스터 데이터베이스
const PUNI_LIST = [
  // === 1코스트 (8종) ===
  {
    id: 'P01', name: '강아지쁘니', cost: 1, origin: '동물농장', job: '타격대',
    hp: 600, atk: 50, range: 1, color: '#93c5fd', accent: '#d97706',
    skillName: '멍멍 두번물기',
    skillDesc: '대상에게 재빠르게 2회 연속 달려들어 각각 공격력 145%의 물리 피해를 입힙니다.'
  },
  {
    id: 'P02', name: '잠만보쁘니', cost: 1, origin: '일상힐링', job: '선봉대',
    hp: 700, atk: 40, range: 1, color: '#c4b5fd', accent: '#6366f1',
    skillName: '쿨쿨 꿀잠회복',
    skillDesc: '2초간 폭신한 베개에서 잠들며 체력을 350(성급 비례) 회복하고 수면 중 받는 피해가 25% 감소합니다.'
  },
  {
    id: 'P03', name: '냠냠쁘니', cost: 1, origin: '스위트파티', job: '포격수',
    hp: 500, atk: 45, range: 3, color: '#fdba74', accent: '#ea580c',
    skillName: '초코칩 쿠키 투척',
    skillDesc: '거대 쿠키를 던져 대상과 주변 1칸 적들에게 공격력 175%의 폭발 피해를 입힙니다.'
  },
  {
    id: 'P04', name: '단짝쁘니', cost: 1, origin: '일상힐링', job: '신비술사',
    hp: 550, atk: 40, range: 3, color: '#fde047', accent: '#f97316',
    skillName: '단짝 하트 배리어',
    skillDesc: '가장 체력 비율이 낮은 아군에게 320(성급 비례)의 따뜻한 하트 보호막을 부여합니다.'
  },
  {
    id: 'P05', name: '유령쁘니', cost: 1, origin: '원소판타지', job: '잠입자',
    hp: 500, atk: 55, range: 1, color: '#e2e8f0', accent: '#64748b',
    skillName: '까꿍 유령 기습',
    skillDesc: '1.5초간 반투명해져 적의 타겟팅을 해제하고 공격력 240% 확정 치명타를 가합니다.'
  },
  {
    id: 'P06', name: '새싹쁘니', cost: 1, origin: '스위트파티', job: '선봉대',
    hp: 650, atk: 45, range: 1, color: '#86efac', accent: '#16a34a',
    skillName: '새싹 광합성 아우라',
    skillDesc: '자신과 주변 1칸 아군에게 3초간 총 270(성급 비례)의 생명력을 지속 재생시킵니다.'
  },
  {
    id: 'P07', name: '씩씩쁘니', cost: 1, origin: '왕국전사', job: '타격대',
    hp: 650, atk: 55, range: 1, color: '#fca5a5', accent: '#dc2626',
    skillName: '용기의 갑옷파쇄',
    skillDesc: '강력한 검격으로 공격력 215% 물리 피해를 입히고 대상의 방어력을 영구히 20% 파쇄합니다.'
  },
  {
    id: 'P08', name: '살랑쁘니', cost: 1, origin: '원소판타지', job: '신비술사',
    hp: 500, atk: 40, range: 4, color: '#6ee7b7', accent: '#059669',
    skillName: '산들바람 순풍',
    skillDesc: '공격력이 가장 높은 아군 2명에게 4초간 공격속도 +30% 가속 바람을 불어넣습니다.'
  },

  // === 2코스트 (7종) ===
  {
    id: 'P09', name: '단단쁘니', cost: 2, origin: '일상힐링', job: '선봉대',
    hp: 800, atk: 50, range: 1, color: '#f8fafc', accent: '#334155',
    skillName: '태권 정권찌르기',
    skillDesc: '300(성급 비례) 보호막을 얻고 전방 적에게 공격력 185% 피해와 함께 1.5초 기절시킵니다.'
  },
  {
    id: 'P10', name: '돼지쁘니', cost: 2, origin: '동물농장', job: '선봉대',
    hp: 850, atk: 45, range: 1, color: '#f9a8d4', accent: '#db2777',
    skillName: '꿀꿀 통통 박치기',
    skillDesc: '주변 1칸 적들에게 자신의 최대체력 22% + 공격력 120%의 묵직한 광역 피해를 입힙니다.'
  },
  {
    id: 'P11', name: '화장쁘니', cost: 2, origin: '러블리스타', job: '신비술사',
    hp: 600, atk: 50, range: 3, color: '#f472b6', accent: '#be185d',
    skillName: '블링블링 핑크 매혹',
    skillDesc: '적군 2명에게 하트 탄환을 날려 공격력 165% 피해를 입히고 1.1초 매혹 및 공속을 35% 감소시킵니다.'
  },
  {
    id: 'P12', name: '뚝딱쁘니', cost: 2, origin: '일상힐링', job: '포격수',
    hp: 700, atk: 60, range: 1, color: '#facc15', accent: '#ca8a04',
    skillName: '안전제일 망치 강타',
    skillDesc: '묵직한 망치로 대상을 내려찍어 공격력 235% 물리 피해를 입히고 1.5초간 기절시킵니다.'
  },
  {
    id: 'P13', name: '탐험쁘니', cost: 2, origin: '모험항해', job: '잠입자',
    hp: 600, atk: 65, range: 1, color: '#fcd34d', accent: '#b45309',
    skillName: '보물지도 급소 포착',
    skillDesc: '적의 약점을 간파하여 방어력을 100% 무시하는 공격력 235% 고정 물리 치명타를 가합니다.'
  },
  {
    id: 'P14', name: '철벽쁘니', cost: 2, origin: '동물농장', job: '선봉대',
    hp: 900, atk: 40, range: 1, color: '#93c5fd', accent: '#1d4ed8',
    skillName: '절대방어 왕국방패',
    skillDesc: '220(성급 비례) 보호막을 얻고 3초간 받는 모든 피해를 50% 감소시키며, 주변 1칸 적들에게 공격력 135%의 반격 물리 피해를 입힙니다.'
  },
  {
    id: 'P15', name: '새콤쁘니', cost: 2, origin: '스위트파티', job: '비전술사',
    hp: 600, atk: 50, range: 3, color: '#fde047', accent: '#ef4444',
    skillName: '비타민 과즙 3연사',
    skillDesc: '가장 가까운 적 최대 3명에게 상큼한 과즙 탄환을 발사해 각각 공격력 185% 마법 피해를 입힙니다.'
  },

  // === 3코스트 (6종) ===
  {
    id: 'P16', name: '사랑쁘니', cost: 3, origin: '러블리스타', job: '신비술사',
    hp: 700, atk: 55, range: 4, color: '#fda4af', accent: '#e11d48',
    skillName: '러브러브 응원단',
    skillDesc: '체력이 낮은 아군 3명을 280(성급 비례) 치유하고 4초간 공격력을 25% 증가시킵니다.'
  },
  {
    id: 'P17', name: '요리쁘니', cost: 3, origin: '스위트파티', job: '타격대',
    hp: 850, atk: 65, range: 1, color: '#fca5a5', accent: '#b91c1c',
    skillName: '특선 플람베 휠윈드',
    skillDesc: '뜨거운 프라이팬을 휘둘러 주변 1칸 모든 적에게 공격력 245% 화염 광역 피해를 입힙니다.'
  },
  {
    id: 'P18', name: '똘똘쁘니', cost: 3, origin: '일상힐링', job: '비전술사',
    hp: 650, atk: 60, range: 4, color: '#fde047', accent: '#0f766e',
    skillName: '만점 전공책 프리즘빔',
    skillDesc: '대상 방향 일직선을 관통하는 프리즘 레이저를 발사하여 경로상 적들에게 공격력 260% 피해를 입힙니다.'
  },
  {
    id: 'P19', name: '치유쁘니', cost: 3, origin: '러블리스타', job: '신비술사',
    hp: 700, atk: 50, range: 4, color: '#fbcfe8', accent: '#ec4899',
    skillName: '천사의 전체 회진',
    skillDesc: '전장의 아군 전체 체력을 260(성급 비례) 회복시키고 모든 해로운 상태이상을 즉시 정화합니다.'
  },
  {
    id: 'P20', name: '오싹쁘니', cost: 3, origin: '원소판타지', job: '비전술사',
    hp: 650, atk: 60, range: 3, color: '#bae6fd', accent: '#0284c7',
    skillName: '겨울왕국 눈보라',
    skillDesc: '대상과 주변 1칸에 매서운 눈보라를 일으켜 공격력 215% 마법 피해를 입히고 1.2초간 기절 및 2.5초간 한기(공격속도 감소)를 부여합니다.'
  },
  {
    id: 'P21', name: '해적쁘니', cost: 3, origin: '모험항해', job: '타격대',
    hp: 800, atk: 70, range: 1, color: '#fca5a5', accent: '#7c2d12',
    skillName: '커틀러스 약탈베기',
    skillDesc: '대상에게 공격력 285% 해적 검격을 가하며, 처치 시 50% 확률로 즉시 1골드를 약탈합니다.'
  },

  // === 4코스트 (5종) ===
  {
    id: 'P22', name: '큐티쁘니', cost: 4, origin: '러블리스타', job: '비전술사',
    hp: 800, atk: 70, range: 4, color: '#fef08a', accent: '#ec4899',
    skillName: '자이언트 리본 폭격',
    skillDesc: '적이 가장 밀집한 구역에 대형 리본 충격파를 낙하시켜 반경 1칸에 공격력 290% 마법 폭격을 가합니다.'
  },
  {
    id: 'P23', name: '말랑쁘니', cost: 4, origin: '일상힐링', job: '타격대',
    hp: 1000, atk: 80, range: 1, color: '#fbcfe8', accent: '#e11d48',
    skillName: '말랑 주인공 폭주',
    skillDesc: '대상에게 공격력 210% 강타를 가하며, 4초간 공격속도가 2배로 폭증하고 입힌 피해의 35%를 체력으로 흡수합니다.'
  },
  {
    id: 'P24', name: '짜릿쁘니', cost: 4, origin: '원소판타지', job: '비전술사',
    hp: 800, atk: 75, range: 3, color: '#fef08a', accent: '#7e22ce',
    skillName: '백만볼트 체인 라이트닝',
    skillDesc: '적 최대 4명에게 연쇄 번개를 퍼부어 각각 공격력 250% 피해를 입히고 마나를 25 소실시킵니다.'
  },
  {
    id: 'P25', name: '음표쁘니', cost: 4, origin: '러블리스타', job: '신비술사',
    hp: 850, atk: 65, range: 4, color: '#f9a8d4', accent: '#06b6d4',
    skillName: '콘서트 피날레 웨이브',
    skillDesc: '전장 전체 적에게 공격력 185% 음파 피해를 입히고, 모든 아군의 공격속도를 3.5초간 35% 가속합니다.'
  },
  {
    id: 'P26', name: '신속쁘니', cost: 4, origin: '왕국전사', job: '잠입자',
    hp: 850, atk: 85, range: 1, color: '#94a3b8', accent: '#1e293b',
    skillName: '그림자 배후 일섬',
    skillDesc: '가장 체력이 낮은 적의 배후 빈 타일로 도약하여 연속 베기로 총 공격력 340% 치명타 피해를 입힙니다.'
  },

  // === 5코스트 (4종) ===
  {
    id: 'P27', name: '시크릿쁘니', cost: 5, origin: '원소판타지', job: '비전술사',
    hp: 1000, atk: 90, range: 4, color: '#e9d5ff', accent: '#f59e0b',
    skillName: '스타라이트 은하수 강림',
    skillDesc: '전장 전체의 모든 적에게 별똥별 폭격(공격력 265%)을 내리고, 자신을 제외한 아군 전체 마나를 30 주유합니다.'
  },
  {
    id: 'P28', name: '부자쁘니', cost: 5, origin: '모험항해', job: '포격수',
    hp: 1100, atk: 85, range: 3, color: '#fde047', accent: '#dc2626',
    skillName: '황금주머니 대폭격',
    skillDesc: '적 중심 반경 2칸에 황금 폭격을 퍼부어 공격력 225% 광역 피해를 입힙니다. 보유 골드 1G당 피해량이 3%씩 증폭됩니다(최대 +150%).'
  },
  {
    id: 'P29', name: '우주쁘니', cost: 5, origin: '모험항해', job: '선봉대',
    hp: 1300, atk: 75, range: 1, color: '#e0f2fe', accent: '#2563eb',
    skillName: '제로그래비티 슈퍼노바',
    skillDesc: '550(성급 비례) 보호막을 얻고 반경 2칸 적들을 무중력으로 띄워 1.8초 에어본 및 공격력 240% 피해를 입힙니다.'
  },
  {
    id: 'P30', name: '팡팡쁘니', cost: 5, origin: '왕국전사', job: '포격수',
    hp: 1000, atk: 95, range: 3, color: '#d8b4fe', accent: '#ea580c',
    skillName: '특대형 메가 시한폭탄',
    skillDesc: '적 중심부에 특대형 폭탄을 투하해 반경 2칸을 초토화하며 공격력 330%의 폭발 물리 피해를 입힙니다.'
  }
];

const PUNI_MAP = {};
for (const u of PUNI_LIST) {
  PUNI_MAP[u.id] = u;
}

// 13종 시너지 마스터 테이블 (7 계열 + 6 직업)
const SYNERGY_DB = {
  '일상힐링': {
    name: '일상힐링', type: '계열', color: '#10b981',
    thresholds: [2, 4, 6],
    desc: '아군 전체가 매초 최대체력의 3% / 6% / 12%를 회복합니다.',
    tierText: ['초당 최대체력 3% 회복', '초당 최대체력 6% 회복', '초당 최대체력 12% 회복'],
    values: [0.03, 0.06, 0.12]
  },
  '스위트파티': {
    name: '스위트파티', type: '계열', color: '#f97316',
    thresholds: [2, 4],
    desc: '전투 시작 시 아군에게 보호막(250 / 600)을 부여하고 스위트파티 공격속도가 +20% 증가합니다.',
    tierText: ['보호막 250 · 공속 +20%', '보호막 600 · 공속 +20%'],
    values: [{ shield: 250, aspd: 0.20 }, { shield: 600, aspd: 0.20 }]
  },
  '동물농장': {
    name: '동물농장', type: '계열', color: '#ec4899',
    thresholds: [2, 3],
    desc: '동물농장 기물들의 최대체력이 +30% / +65% 증가합니다.',
    tierText: ['동물농장 최대체력 +30%', '동물농장 최대체력 +65%'],
    values: [0.30, 0.65]
  },
  '러블리스타': {
    name: '러블리스타', type: '계열', color: '#f43f5e',
    thresholds: [2, 4],
    desc: '아군 전체 스킬 위력이 +25% / +60% 증가하며 스킬 치명타가 활성화됩니다.',
    tierText: ['스킬 위력 +25% · 스킬 치명타', '스킬 위력 +60% · 스킬 치명타'],
    values: [0.25, 0.60]
  },
  '원소판타지': {
    name: '원소판타지', type: '계열', color: '#8b5cf6',
    thresholds: [2, 4],
    desc: '원소판타지 스킬 적중 시 2초간 감전 / 4단계 시 주변 광역 빙결(속도 -40%)을 부여합니다.',
    tierText: ['스킬 적중 시 2초 감전', '감전 + 광역 빙결(속도 -40%)'],
    values: [1, 2]
  },
  '모험항해': {
    name: '모험항해', type: '계열', color: '#0284c7',
    thresholds: [2, 4],
    desc: '전투 승리 시 보물상자에서 +1골드 / +3골드를 추가 획득합니다.',
    tierText: ['승리 시 +1골드 획득', '승리 시 +3골드 보물상자'],
    values: [1, 3]
  },
  '왕국전사': {
    name: '왕국전사', type: '계열', color: '#dc2626',
    thresholds: [2, 3],
    desc: '왕국전사 기물의 공격력이 +30% / +65% 증가하며 적 방어력을 30% 관통합니다.',
    tierText: ['공격력 +30% · 방어관통 30%', '공격력 +65% · 방어관통 30%'],
    values: [0.30, 0.65]
  },
  '선봉대': {
    name: '선봉대', type: '직업', color: '#2563eb',
    thresholds: [2, 4, 6],
    desc: '선봉대 기물의 물리·마법 방어력이 +35 / +80 / +160 증가합니다.',
    tierText: ['방어력 +35', '방어력 +80', '방어력 +160'],
    values: [35, 80, 160]
  },
  '타격대': {
    name: '타격대', type: '직업', color: '#b91c1c',
    thresholds: [2, 4],
    desc: '타격대 기물의 공격속도가 +30% / +70% 증가하고 모든 피해 흡혈 20%를 얻습니다.',
    tierText: ['공속 +30% · 흡혈 20%', '공속 +70% · 흡혈 20%'],
    values: [0.30, 0.70]
  },
  '잠입자': {
    name: '잠입자', type: '직업', color: '#475569',
    thresholds: [2, 3],
    desc: '전투 시작 시 적 최후열로 도약하며, 시너지 발동 시 치명타 확률이 +35% / +75% 증가합니다.',
    tierText: ['후열 도약 · 치명타 +35%', '후열 도약 · 치명타 +75%'],
    values: [0.35, 0.75]
  },
  '포격수': {
    name: '포격수', type: '직업', color: '#ea580c',
    thresholds: [2, 4],
    desc: '포격수의 기본 공격이 대상 주변 1칸에 공격력의 40% / 80% 광역 폭발 피해를 입힙니다.',
    tierText: ['평타 주변 40% 폭발', '평타 주변 80% 폭발'],
    values: [0.40, 0.80]
  },
  '비전술사': {
    name: '비전술사', type: '직업', color: '#9333ea',
    thresholds: [2, 4, 6],
    desc: '비전술사가 기본 공격 시 마나를 +5 / +10 / +18 추가 회복합니다.',
    tierText: ['평타 마나 +5', '평타 마나 +10', '평타 마나 +18'],
    values: [5, 10, 18]
  },
  '신비술사': {
    name: '신비술사', type: '직업', color: '#0d9488',
    thresholds: [2, 4],
    desc: '아군 전체 방어력이 +40 / +90 증가하고 3초마다 아군 체력을 150 치유합니다.',
    tierText: ['저항력 +40 · 3초마다 150 치유', '저항력 +90 · 3초마다 150 치유'],
    values: [40, 90]
  }
};

// 15스테이지 적군 웨이브 데이터
const STAGE_WAVES = [
  { stage: 1,  title: '1라운드 · 꼬마 들판 정찰대', boss: false, units: [{ id: 'P01', star: 1, row: 2, col: 1 }, { id: 'P02', star: 1, row: 2, col: 3 }] },
  { stage: 2,  title: '2라운드 · 달콤 쿠키 소풍단', boss: false, units: [{ id: 'P06', star: 1, row: 2, col: 2 }, { id: 'P03', star: 1, row: 0, col: 1 }, { id: 'P04', star: 1, row: 0, col: 3 }] },
  { stage: 3,  title: '3라운드 · 왕국 훈련소 동기들', boss: false, units: [{ id: 'P07', star: 1, row: 2, col: 1 }, { id: 'P09', star: 1, row: 2, col: 3 }, { id: 'P08', star: 1, row: 0, col: 2 }] },
  { stage: 4,  title: '4라운드 · 동물농장 수비대', boss: false, units: [{ id: 'P10', star: 1, row: 2, col: 1 }, { id: 'P14', star: 1, row: 2, col: 3 }, { id: 'P01', star: 2, row: 2, col: 2 }, { id: 'P05', star: 1, row: 1, col: 0 }] },
  { stage: 5,  title: '5라운드 [보스] · 특급 베이커리 셰프단', boss: true, units: [{ id: 'P17', star: 2, row: 2, col: 2 }, { id: 'P06', star: 2, row: 2, col: 1 }, { id: 'P03', star: 1, row: 0, col: 1 }, { id: 'P15', star: 1, row: 0, col: 3 }] },
  { stage: 6,  title: '6라운드 · 도서관 우등생 위원회', boss: false, units: [{ id: 'P09', star: 2, row: 2, col: 1 }, { id: 'P12', star: 2, row: 2, col: 3 }, { id: 'P18', star: 1, row: 0, col: 2 }, { id: 'P04', star: 2, row: 0, col: 4 }] },
  { stage: 7,  title: '7라운드 · 출항 해적쁘니 선단', boss: false, units: [{ id: 'P21', star: 2, row: 2, col: 2 }, { id: 'P14', star: 2, row: 2, col: 1 }, { id: 'P13', star: 2, row: 1, col: 0 }, { id: 'P05', star: 2, row: 1, col: 4 }, { id: 'P16', star: 1, row: 0, col: 2 }] },
  { stage: 8,  title: '8라운드 · 얼음과 번개의 탑', boss: false, units: [{ id: 'P10', star: 2, row: 2, col: 1 }, { id: 'P14', star: 2, row: 2, col: 3 }, { id: 'P20', star: 2, row: 1, col: 2 }, { id: 'P24', star: 1, row: 0, col: 1 }, { id: 'P08', star: 2, row: 0, col: 3 }] },
  { stage: 9,  title: '9라운드 · 러블리스타 드림 콘서트', boss: false, units: [{ id: 'P09', star: 2, row: 2, col: 2 }, { id: 'P11', star: 2, row: 1, col: 1 }, { id: 'P16', star: 2, row: 0, col: 0 }, { id: 'P19', star: 2, row: 0, col: 4 }, { id: 'P22', star: 1, row: 0, col: 2 }, { id: 'P25', star: 1, row: 0, col: 3 }] },
  { stage: 10, title: '10라운드 [보스] · 말랑쁘니 에이스 원정대', boss: true, units: [{ id: 'P23', star: 2, row: 2, col: 2 }, { id: 'P09', star: 2, row: 2, col: 1 }, { id: 'P12', star: 2, row: 2, col: 3 }, { id: 'P26', star: 2, row: 1, col: 4 }, { id: 'P18', star: 2, row: 0, col: 1 }, { id: 'P19', star: 2, row: 0, col: 3 }] },
  { stage: 11, title: '11라운드 · 왕국 포병대와 그림자 검', boss: false, units: [{ id: 'P07', star: 3, row: 2, col: 2 }, { id: 'P14', star: 2, row: 2, col: 1 }, { id: 'P29', star: 1, row: 2, col: 3 }, { id: 'P26', star: 2, row: 1, col: 0 }, { id: 'P30', star: 1, row: 0, col: 2 }, { id: 'P03', star: 2, row: 0, col: 4 }] },
  { stage: 12, title: '12라운드 · 우주해적 황금선단', boss: false, units: [{ id: 'P29', star: 2, row: 2, col: 2 }, { id: 'P21', star: 2, row: 2, col: 1 }, { id: 'P17', star: 2, row: 2, col: 3 }, { id: 'P13', star: 3, row: 1, col: 4 }, { id: 'P28', star: 2, row: 0, col: 2 }, { id: 'P19', star: 2, row: 0, col: 0 }, { id: 'P25', star: 2, row: 0, col: 3 }] },
  { stage: 13, title: '13라운드 · 6비전 대마도사 평의회', boss: false, units: [{ id: 'P29', star: 2, row: 2, col: 2 }, { id: 'P15', star: 2, row: 1, col: 0 }, { id: 'P20', star: 2, row: 1, col: 4 }, { id: 'P18', star: 2, row: 0, col: 1 }, { id: 'P22', star: 2, row: 0, col: 3 }, { id: 'P24', star: 2, row: 0, col: 2 }, { id: 'P27', star: 1, row: 0, col: 4 }] },
  { stage: 14, title: '14라운드 · 왕실 근위 친위대', boss: false, units: [{ id: 'P23', star: 2, row: 2, col: 1 }, { id: 'P29', star: 2, row: 2, col: 2 }, { id: 'P14', star: 3, row: 2, col: 3 }, { id: 'P26', star: 2, row: 1, col: 0 }, { id: 'P30', star: 2, row: 0, col: 1 }, { id: 'P28', star: 2, row: 0, col: 3 }, { id: 'P25', star: 2, row: 0, col: 2 }, { id: 'P19', star: 2, row: 0, col: 4 }] },
  { stage: 15, title: '15라운드 [최종보스] · 여왕 시크릿의 별빛 왕좌', boss: true, units: [{ id: 'P29', star: 2, row: 2, col: 2 }, { id: 'P23', star: 3, row: 2, col: 1 }, { id: 'P10', star: 3, row: 2, col: 3 }, { id: 'P26', star: 2, row: 1, col: 4 }, { id: 'P30', star: 2, row: 0, col: 0 }, { id: 'P22', star: 2, row: 0, col: 1 }, { id: 'P27', star: 2, row: 0, col: 2 }, { id: 'P28', star: 2, row: 0, col: 3 }, { id: 'P25', star: 2, row: 0, col: 4 }] }
];

// 전역 게임 상태 스키마
const AppState = {
  stage: 1,
  phase: 'PREP',
  playerHp: 100,
  gold: 10,
  level: 3,
  xp: 0,
  streak: 0,
  shopLocked: false,
  shopSlots: [null, null, null, null, null],
  bench: new Array(7).fill(null),
  board: Array.from({ length: 6 }, () => new Array(5).fill(null)),
  activeSynergies: {},
  spriteCache: {},        // P01 ~ P30 투명 배경 3D 피규어 Image 객체
  soundEnabled: true,
  pool: {},
  selectedSlot: null,
  stats: {
    wins: 0,
    losses: 0,
    threeStars: 0,
    goldPlundered: 0
  }
};

function createOwnedUnit(unitId, star = 1) {
  const spec = PUNI_MAP[unitId];
  return {
    uid: generateUID(),
    id: spec.id,
    star: star
  };
}

class CombatUnit {
  constructor(spec, star, isEnemy, row, col) {
    this.uid = generateUID();
    this.id = spec.id;
    this.name = spec.name;
    this.cost = spec.cost;
    this.origin = spec.origin;
    this.job = spec.job;
    this.star = star;
    this.isEnemy = isEnemy;
    this.row = row;
    this.col = col;
    this.x = 0;
    this.y = 0;

    const mult = Math.pow(1.8, star - 1);
    this.maxHp = Math.round(spec.hp * mult);
    this.hp = this.maxHp;
    this.atk = Math.round(spec.atk * mult);
    this.baseAtk = this.atk;
    this.def = spec.cost * 10;
    this.range = spec.range;
    this.mp = 0;
    this.maxMp = 100;
    this.atkSpeed = 1.0;

    this.chillTimer = 0;
    this.stunTimer = 0;
    this.shockTimer = 0;
    this.sleepHealTimer = 0;
    this.stealthTimer = 0;
    this.dmgReduceTimer = 0;
    this.aspdBuffTimer = 0;
    this.aspdBuffVal = 0;
    this.aspdDebuffTimer = 0;
    this.atkBuffTimer = 0;
    this.frenzyTimer = 0;
    this.regenTimer = 0;
    this.regenPerSec = 0;
    this.shield = 0;
    this.airborneTimer = 0;

    this.critChance = 0.05;
    this.omnivamp = 0;
    this.armorPen = 0;
    this.splashRatio = 0;
    this.bonusManaOnHit = 0;
    this.skillPowerMult = 1.0;
    this.skillCrit = false;
    this.elementalTier = 0;
    this.nextCritGuaranteed = false;

    this.atkCooldown = 0.4;

    // 2.5D/3D 피규어 물리 & 애니메이션 보간 상태
    this.renderX = 0;
    this.renderY = 0;
    this.groundY = 0;
    this.jumpHeight = 0;
    this.tiltAngle = 0;
    this.jumpStartX = 0;
    this.jumpStartY = 0;
    this.jumpTargetX = 0;
    this.jumpTargetY = 0;
    this.jumpProgress = 1;
    this.jumpDuration = 0.18;
    this.jumpArcHeight = 20;
    this.scaleX = 1;
    this.scaleY = 1;
    this.hitFlash = 0;
    this.castPulse = 0;
    this.alive = true;
  }
}
