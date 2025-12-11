
// Fortune Engine 3.0 (Grand Master Edition)
// 🌌 Western: Planetary Transits & Aspects (Astrology)
// 📜 Eastern: Daily Stem/Branch Iljin & Five Elements (Saju)
// ✨ Lucky Prescription: Color, Item, Number, Direction

// =============================================================================
// SECTION 1: WESTERN ASTROLOGY DATA (PLANETS & ZODIAC)
// =============================================================================

const ZODIAC_SIGNS = {
    "양자리": { element: "fire", ruler: "mars", traits: ["개척", "용기", "직관"] },
    "황소자리": { element: "earth", ruler: "venus", traits: ["안정", "감각", "끈기"] },
    "쌍둥이자리": { element: "air", ruler: "mercury", traits: ["소통", "호기심", "재치"] },
    "게자리": { element: "water", ruler: "moon", traits: ["감성", "보호", "공감"] },
    "사자자리": { element: "fire", ruler: "sun", traits: ["표현", "자존감", "열정"] },
    "처녀자리": { element: "earth", ruler: "mercury", traits: ["분석", "봉사", "디테일"] },
    "천칭자리": { element: "air", ruler: "venus", traits: ["조화", "관계", "미학"] },
    "전갈자리": { element: "water", ruler: "pluto", traits: ["통찰", "집중", "비밀"] },
    "사수자리": { element: "fire", ruler: "jupiter", traits: ["모험", "철학", "낙관"] },
    "염소자리": { element: "earth", ruler: "saturn", traits: ["구조", "책임", "야망"] },
    "물병자리": { element: "air", ruler: "uranus", traits: ["혁신", "이성", "독창"] },
    "물고기자리": { element: "water", ruler: "neptune", traits: ["꿈", "영감", "희생"] }
};

const PLANETARY_ASPECTS = [
    { name: "수성 역행 (Mercury Retrograde)", type: "challenge", desc: "소통의 오해와 전자기기 오류를 조심해야 하는 시기" },
    { name: "금성의 미소 (Venus Trine)", type: "harmony", desc: "사랑과 예술, 금전적인 흐름이 부드러워지는 시기" },
    { name: "화성의 질주 (Mars Conjunct)", type: "energy", desc: "행동력이 폭발하고 추진력이 강해지는 시기" },
    { name: "목성의 축복 (Jupiter Expansion)", type: "luck", desc: "작은 노력이 크게 확장되어 돌아오는 행운의 시기" },
    { name: "토성의 교훈 (Saturn Return)", type: "serious", desc: "현실을 직시하고 내실을 다져야 하는 성숙의 시기" },
    { name: "달의 차오름 (Full Moon Energy)", type: "emotion", desc: "내면의 감정이 고조되고 무의식이 깨어나는 시기" },
    { name: "태양의 입궁 (Solar Return)", type: "vitality", desc: "자신감이 넘치고 존재감이 드러나는 빛의 시기" }
];

// =============================================================================
// SECTION 2: EASTERN SAJU DATA (ILJIN & 5 ELEMENTS)
// =============================================================================

const FIVE_ELEMENTS = {
    "wood": { name: "목(木)", quality: "성장/시작", color: "청색" },
    "fire": { name: "화(火)", quality: "확산/열정", color: "적색" },
    "earth": { name: "토(土)", quality: "중재/변화", color: "황색" },
    "metal": { name: "금(金)", quality: "결실/냉철", color: "백색" },
    "water": { name: "수(水)", quality: "지혜/휴식", color: "흑색" }
};

const ORIENTAL_ZODIAC = {
    "쥐띠": "water", "소띠": "earth", "호랑이띠": "wood", "토끼띠": "wood",
    "용띠": "earth", "뱀띠": "fire", "말띠": "fire", "양띠": "earth",
    "원숭이띠": "metal", "닭띠": "metal", "개띠": "earth", "돼지띠": "water"
};

// =============================================================================
// SECTION 3: MASSIVE TEMPLATES (5X EXPANSION)
// =============================================================================

const WESTERN_TEMPLATES = {
    // 1. Transit Intro (행성의 움직임)
    transits: [
        "하늘의 별들이 당신의 차트를 부드럽게 감싸고 있습니다.",
        "멀리서 행성의 에너지가 강렬하게 진동하는 날입니다.",
        "별들의 배치가 고요하여 내면을 들여다보기 좋은 밤입니다.",
        "우주의 리듬이 당신의 맥박과 공명하며 춤을 춥니다.",
        "행성들이 각을 이루며 새로운 기회의 문을 두드리고 있습니다.",
        "별빛이 희미하지만, 그만큼 당신의 내면의 빛이 중요한 날입니다.",
        "천체의 움직임이 분주하여 예상치 못한 소식이 올 수 있습니다.",
        "보이지 않는 중력이 당신을 올바른 궤도로 이끌어줍니다."
    ],
    // 2. Element Advice (4원소별 맞춤 조언 - 5개씩)
    advice: {
        fire: [ // 양자리, 사자자리, 사수자리
            "지금은 망설임보다는 불꽃같은 행동이 필요한 순간입니다.",
            "당신의 열정이 주변을 따뜻하게 데우는 등불이 되어줍니다.",
            "직관을 믿으세요. 논리보다 당신의 첫 느낌이 정답입니다.",
            "솔직하고 당당한 태도가 오히려 복잡한 문제를 단순하게 만듭니다.",
            "에너지가 넘칩니다. 운동이나 새로운 프로젝트로 발산하세요."
        ],
        earth: [ // 황소자리, 처녀자리, 염소자리
            "서두르지 마세요. 대지처럼 굳건하게 자리를 지키는 것이 이깁니다.",
            "현실적인 계획이 빛을 발합니다. 숫자를 꼼꼼히 확인하세요.",
            "눈에 보이는 결과물이 나오는 날입니다. 마지막까지 디테일을 챙기세요.",
            "자연과 가까이 하세요. 흙의 기운이 당신을 충전해줍니다.",
            "오래된 물건을 정리하거나 재정 상태를 점검하기 딱 좋은 날입니다."
        ],
        air: [ // 쌍둥이자리, 천칭자리, 물병자리
            "새로운 정보가 바람을 타고 옵니다. 귀를 열어두세요.",
            "대화가 해결책입니다. 혼자 고민하지 말고 주변에 물어보세요.",
            "객관적인 시선이 필요합니다. 한 발자국 물러서서 관망하세요.",
            "지적인 호기심이 왕성해집니다. 책을 읽거나 강의를 들어보세요.",
            "유연함이 무기입니다. 계획이 바뀌어도 당황하지 마세요."
        ],
        water: [ // 게자리, 전갈자리, 물고기자리
            "감정의 파도가 칠 수 있습니다. 오늘은 마음의 소리를 경청하세요.",
            "꿈자리가 선명하거나 예감이 적중할 수 있습니다.",
            "누군가를 위로할 때 당신의 마음도 함께 치유됩니다.",
            "예술적인 영감이 샘솟습니다. 그림을 그리거나 글을 써보세요.",
            "흐르는 물처럼 순리대로 맡기세요. 억지로 하려 하지 마세요."
        ]
    },
    // 3. Situational Closing (상황별 마무리)
    closings: [
        "오늘 하루는 자신에게 작은 선물을 해도 좋습니다.",
        "저녁에는 스마트폰을 멀리하고 명상의 시간을 가져보세요.",
        "오랜 친구에게 안부 문자를 보내면 뜻밖의 기쁨이 있습니다.",
        "중요한 결정은 내일 아침으로 미루는 것이 현명합니다.",
        "오늘 마시는 커피 한 잔이 유난히 달콤할 것입니다.",
        "집이나 책상 주변을 정리하면 머릿속도 맑아집니다.",
        "예상치 못한 칭찬을 듣게 될 수 있으니 미소를 준비하세요.",
        "오늘의 작은 실수는 더 큰 성공을 위한 밑거름입니다."
    ]
};

const EASTERN_TEMPLATES = {
    // 1. Iljin Intro (일진/기운 묘사)
    iljin: [
        "오늘은 기상(氣像)이 맑고 청명하여 만물이 소생하는 날입니다.",
        "안개가 낀 듯 흐릿하나 곧 걷히고 해가 뜰 형상입니다.",
        "강한 바람이 불어오니 중심을 잡고 버텨야 하는 날입니다.",
        "비 온 뒤 땅이 굳어지듯, 시련 뒤에 결실이 맺히는 형국입니다.",
        "잔잔한 호수에 돌을 던진 듯 파문이 일어나는 변화의 날입니다.",
        "오래된 나무가 깊게 뿌리를 내리듯 안정을 찾아가는 날입니다.",
        "불길이 맹렬하게 타오르듯 의욕이 넘치나 조절이 필요합니다.",
        "차가운 금속처럼 이성적이고 냉철한 판단이 서는 날입니다."
    ],
    // 2. Compatibility Logic (상생/상극에 따른 풀이 - 5개씩)
    harmony: [ // 상생 (Good)
        "귀인이 동쪽에서 찾아오니 막힌 일이 술술 풀립니다.",
        "물 들어올 때 노 젓는 격이라, 하는 일마다 성과가 따릅니다.",
        "주변 사람들과의 합(合)이 좋아 협업하기에 최적의 날입니다.",
        "생각지도 못한 재물이나 먹을 복이 따르는 운수입니다.",
        "당신의 기운이 상승 기류를 탔으니 자신감을 가져도 좋습니다."
    ],
    conflict: [ // 상극 (Bad/Caution)
        "오늘은 돌다리도 두들겨 보고 건너야 하는 신중함이 필요합니다.",
        "의욕이 앞서 실수를 할 수 있으니 한 템포 쉬어가세요.",
        "가까운 사람과의 사소한 언쟁이 커질 수 있으니 말을 아끼세요.",
        "무리한 투자는 금물이며, 지금 가진 것을 지키는 것이 이익입니다.",
        "예상치 못한 변수가 생길 수 있으니 플랜 B를 준비하세요."
    ],
    neutral: [ // 평이 (Mid)
        "크게 좋지도 나쁘지도 않은 평온한 하루가 예상됩니다.",
        "흐르는 물처럼 무리하지 않고 순리대로 행하면 길합니다.",
        "소소한 행복에 감사하면 복이 절로 굴러들어옵니다.",
        "새로운 일보다는 하던 일을 꾸준히 마무리하는 것이 좋습니다.",
        "중용(中庸)의 미덕을 지키면 저녁에 마음이 편안할 것입니다."
    ],
    // 3. Action Suggestion (실천 조언)
    actions: [
        "오늘은 붉은색 계열의 옷이나 소품이 기운을 북돋아 줍니다.",
        "동쪽 방향으로 잠시 산책을 다녀오면 좋은 기운을 받습니다.",
        "따뜻한 차를 마시며 마음을 안정시키는 시간이 필요합니다.",
        "약속 시간보다 10분 일찍 도착하면 행운이 따릅니다.",
        "지갑을 정리하거나 영수증을 버리면 금전운이 트입니다.",
        "부모님이나 웃어른께 안부 전화를 드리면 좋습니다.",
        "오늘 점심은 면 요리나 길쭉한 음식이 길합니다.",
        "잠들기 전 오늘 감사한 일 3가지를 떠올려보세요."
    ]
};

const LUCKY_ITEMS = {
    colors: ["로열 블루", "포레스트 그린", "크림 베이지", "미드나잇 블랙", "버건디 레드", "머스타드 옐로우", "퓨어 화이트", "차콜 그레이"],
    items: ["손목시계", "은반지", "다이어리", "향수", "텀블러", "이어폰", "안경/선글라스", "스카프/목도리"],
    foods: ["파스타", "비빔밥", "샌드위치", "초밥", "샐러드", "된장찌개", "과일 주스", "초콜릿"],
    directions: ["동쪽", "서쪽", "남쪽", "북쪽", "남동쪽", "북서쪽"],
    numbers: ["1", "3", "7", "8", "9", "11", "24"]
};

// =============================================================================
// SECTION 4: ENGINE LOGIC
// =============================================================================

function getSeededRandom(seedString) {
    let h = 0x811c9dc5;
    for (let i = 0; i < seedString.length; i++) {
        h ^= seedString.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    h >>>= 0;
    const load = (h / 4294967296);
    return load; // 0.0 ~ 1.0
}

function pick(array, seed) {
    const idx = Math.floor(getSeededRandom(seed) * array.length);
    return array[idx];
}

// ----------------------------------------------------
// Public Export 1: Western Horoscope
// ----------------------------------------------------
export function getDailyHoroscope(name, birthdate) {
    if (!birthdate) return null;

    const today = new Date();
    const dateStr = `${today.getFullYear()}${today.getMonth()}${today.getDate()}`;
    // Base Seed
    const seed = `${dateStr}-${name}-WESTERN`;

    // 1. Identify Sign & Element
    const signName = getZodiacName(birthdate);
    const zInfo = ZODIAC_SIGNS[signName];

    // 2. Simulate Planetary Aspect (Randomly select one for the day/user combo)
    const aspect = pick(PLANETARY_ASPECTS, seed + "aspect");

    // 3. Build Sentence Parts
    const transitText = pick(WESTERN_TEMPLATES.transits, seed + "transit");
    const adviceText = pick(WESTERN_TEMPLATES.advice[zInfo.element], seed + "advice");
    const closingText = pick(WESTERN_TEMPLATES.closings, seed + "closing");

    // 4. Construct Full Text
    // Structure: [Transit Intro] + [Aspect Effect] + [Element Advice] + [Closing]
    // Clean, expert tone.
    let fullText = `${transitText} `;
    fullText += `오늘은 **${aspect.name}**의 영향으로 ${aspect.desc}입니다. `;
    fullText += `${adviceText} `;
    fullText += `${closingText}`;

    return {
        sign: signName,
        ruler: zInfo.ruler,
        element: zInfo.element,
        aspect: aspect.name,
        text: fullText
    };
}

// ----------------------------------------------------
// Public Export 2: Oriental Fortune
// ----------------------------------------------------
export function getDailyOrientalFortune(name, birthdate) {
    if (!birthdate) return null;

    const today = new Date();
    const dateStr = `${today.getFullYear()}${today.getMonth()}${today.getDate()}`;
    const seed = `${dateStr}-${name}-EASTERN`;

    // 1. Identify Zodiac & Element
    const zodiacName = getChineseZodiacName(birthdate);
    const myElementKey = ORIENTAL_ZODIAC[zodiacName]; // e.g., 'water'

    // 2. Simulate Daily Iljin (Day Element)
    const elementKeys = Object.keys(FIVE_ELEMENTS);
    const dailyElementKey = pick(elementKeys, "DAILY_ILJIN_" + dateStr);
    const dailyElement = FIVE_ELEMENTS[dailyElementKey];

    // 3. Determine Relational Status (Simple Harmony Logic)
    // Wood->Fire->Earth->Metal->Water->Wood
    const supportMap = { "wood": "fire", "fire": "earth", "earth": "metal", "metal": "water", "water": "wood" };
    const conflictMap = { "wood": "earth", "fire": "metal", "earth": "water", "metal": "wood", "water": "fire" };

    let status = "neutral";
    if (supportMap[myElementKey] === dailyElementKey || supportMap[dailyElementKey] === myElementKey) {
        status = "harmony";
    } else if (conflictMap[myElementKey] === dailyElementKey || conflictMap[dailyElementKey] === myElementKey) {
        status = "conflict";
    }

    // 4. Build Sentence Parts
    const introText = pick(EASTERN_TEMPLATES.iljin, seed + "iljin");
    // Pick specific advice based on harmony status
    let statusText = "";
    if (status === "harmony") statusText = pick(EASTERN_TEMPLATES.harmony, seed + "status");
    else if (status === "conflict") statusText = pick(EASTERN_TEMPLATES.conflict, seed + "status");
    else statusText = pick(EASTERN_TEMPLATES.neutral, seed + "status");

    const actionText = pick(EASTERN_TEMPLATES.actions, seed + "action");

    // 5. Construct Full Text
    // Structure: [Intro] + [So, status analysis] + [Action]
    let fullText = `${introText} `;
    fullText += `오늘의 일진인 **${dailyElement.name}** 기운이 당신과 만나 ${statusText} `;
    fullText += `${actionText}`;

    return {
        sign: zodiacName,
        element: myElementKey,
        dailyElement: dailyElement.name, // e.g. "화(火)"
        status: status,
        text: fullText
    };
}

// ----------------------------------------------------
// Public Export 3: Lucky Prescription
// ----------------------------------------------------
export function getLuckyPrescription(name, birthdate) {
    const today = new Date();
    const dateStr = `${today.getFullYear()}${today.getMonth()}${today.getDate()}`;
    const seed = `${dateStr}-${name}-LUCKY`;

    return {
        color: pick(LUCKY_ITEMS.colors, seed + "col"),
        item: pick(LUCKY_ITEMS.items, seed + "item"),
        food: pick(LUCKY_ITEMS.foods, seed + "food"),
        direction: pick(LUCKY_ITEMS.directions, seed + "dir"),
        number: pick(LUCKY_ITEMS.numbers, seed + "num")
    };
}

// ----------------------------------------------------
// Helpers
// ----------------------------------------------------
function getZodiacName(dateStr) {
    const date = new Date(dateStr);
    const m = date.getMonth() + 1;
    const d = date.getDate();

    if ((m == 3 && d >= 21) || (m == 4 && d <= 19)) return "양자리";
    if ((m == 4 && d >= 20) || (m == 5 && d <= 20)) return "황소자리";
    if ((m == 5 && d >= 21) || (m == 6 && d <= 21)) return "쌍둥이자리";
    if ((m == 6 && d >= 22) || (m == 7 && d <= 22)) return "게자리";
    if ((m == 7 && d >= 23) || (m == 8 && d <= 22)) return "사자자리";
    if ((m == 8 && d >= 23) || (m == 9 && d <= 22)) return "처녀자리";
    if ((m == 9 && d >= 23) || (m == 10 && d <= 22)) return "천칭자리";
    if ((m == 10 && d >= 23) || (m == 11 && d <= 22)) return "전갈자리";
    if ((m == 11 && d >= 23) || (m == 12 && d <= 21)) return "사수자리";
    if ((m == 12 && d >= 22) || (m == 1 && d <= 19)) return "염소자리";
    if ((m == 1 && d >= 20) || (m == 2 && d <= 18)) return "물병자리";
    return "물고기자리";
}

function getChineseZodiacName(dateStr) {
    const year = new Date(dateStr).getFullYear();
    const animals = ["원숭이띠", "닭띠", "개띠", "돼지띠", "쥐띠", "소띠", "호랑이띠", "토끼띠", "용띠", "뱀띠", "말띠", "양띠"];
    return animals[year % 12];
}
