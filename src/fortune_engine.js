
// Fortune Engine 2.0 (Expert Edition)
// 🚀 Dual-Engine: Horoscope & Oriental
// Expert Tone & Logic-Based

// --- 1. Static Data & Expert Knowledge ---
const ZODIAC_DATA = {
    "양자리": { element: "fire", traits: ["개척하는 불꽃", "꺼지지 않는 열정", "직관적인 행동"] },
    "황소자리": { element: "earth", traits: ["비옥한 대지", "흔들리지 않는 평온", "감각적인 안목"] },
    "쌍둥이자리": { element: "air", traits: ["자유로운 바람", "반짝이는 지성", "유연한 적응력"] },
    "게자리": { element: "water", traits: ["포근한 파도", "섬세한 감수성", "깊은 공감 능력"] },
    "사자자리": { element: "fire", traits: ["태양의 중심", "당당한 리더십", "화려한 오라"] },
    "처녀자리": { element: "earth", traits: ["정갈한 숲", "완벽을 향한 눈", "실용적인 지혜"] },
    "천칭자리": { element: "air", traits: ["조화로운 산들바람", "우아한 균형 감각", "사교적인 매력"] },
    "전갈자리": { element: "water", traits: ["심해의 고요", "꿰뚫어 보는 통찰", "강렬한 집중력"] },
    "사수자리": { element: "fire", traits: ["멀리 쏘아 올린 화살", "낙관적인 철학", "자유로운 영혼"] },
    "염소자리": { element: "earth", traits: ["견고한 바위", "성실한 야망", "책임감 있는 태도"] },
    "물병자리": { element: "air", traits: ["차가운 지성", "독창적인 혁명", "인류애적 시선"] },
    "물고기자리": { element: "water", traits: ["꿈꾸는 바다", "예술적인 영감", "무한한 상상력"] }
};

const ORIENTAL_ZODIAC_DATA = {
    "쥐띠": { element: "water", traits: ["지혜로운 물", "기민한 생존력"] },
    "소띠": { element: "earth", traits: ["묵묵한 흙", "우직한 인내심"] },
    "호랑이띠": { element: "wood", traits: ["거대한 나무", "용맹한 기백"] },
    "토끼띠": { element: "wood", traits: ["우거진 풀", "다정한 평화주의"] },
    "용띠": { element: "earth", traits: ["신비로운 산", "비범한 이상"] },
    "뱀띠": { element: "fire", traits: ["지성적인 불", "차분한 치밀함"] },
    "말띠": { element: "fire", traits: ["활활 타는 불꽃", "앞만 보는 열정"] },
    "양띠": { element: "earth", traits: ["따뜻한 흙", "온화한 배려심"] },
    "원숭이띠": { element: "metal", traits: ["날카로운 금속", "재치 있는 임기응변"] },
    "닭띠": { element: "metal", traits: ["정교한 보석", "깔끔한 완벽주의"] },
    "개띠": { element: "earth", traits: ["충직한 성벽", "정직한 신뢰"] },
    "돼지띠": { element: "water", traits: ["넓은 호수", "낙천적인 여유"] }
};

// Relation Logic
const ELEMENT_RELATIONS = {
    western: {
        "fire": { good: ["air", "fire"], bad: ["water", "earth"] },
        "earth": { good: ["water", "earth"], bad: ["fire", "air"] },
        "air": { good: ["fire", "air"], bad: ["water", "earth"] },
        "water": { good: ["earth", "water"], bad: ["fire", "air"] }
    },
    eastern: {
        // 상생: 수생목, 목생화, 화생토, 토생금, 금생수
        // 상극: 수극화, 화극금, 금극목, 목극토, 토극수
        "wood": { good: ["water", "fire", "wood"], bad: ["metal", "earth"] },
        "fire": { good: ["wood", "earth", "fire"], bad: ["water", "metal"] },
        "earth": { good: ["fire", "metal", "earth"], bad: ["wood", "water"] },
        "metal": { good: ["earth", "water", "metal"], bad: ["fire", "wood"] },
        "water": { good: ["metal", "wood", "water"], bad: ["earth", "fire"] }
    }
};

// --- Part 1: Expert Horoscope Templates ---
const HORO_TEMPLATES = {
    // [오늘의 원소 평가]
    elements: {
        fire: ["타오르는 불의 기운이 지배하는 날입니다.", "열정과 에너지가 넘쳐흐르는 태양의 날입니다.", "행동력이 앞서는 강렬한 불꽃의 하루입니다."],
        earth: ["대지가 호흡하듯 차분하고 안정적인 날입니다.", "현실적인 감각이 깨어나는 흙의 기운이 강합니다.", "기반을 다지기에 더없이 좋은 단단한 날입니다."],
        air: ["상쾌한 바람처럼 소식과 정보가 오가는 날입니다.", "생각의 흐름이 자유로운 공기의 기운이 감돕니다.", "이성적인 판단이 빛을 발하는 맑은 하루입니다."],
        water: ["깊은 감수성이 밀려오는 물의 기운이 흐릅니다.", "직관과 무의식이 예민해지는 신비로운 날입니다.", "마음과 마음이 연결되는 촉촉한 하루입니다."]
    },
    // [성향 조언 - Good/Mid/Bad]
    advice: {
        good: [
            "당신이 가진 {trait} 성향이 우주의 기운과 공명하여 시너지를 냅니다.",
            "오늘은 당신의 {trait} 본능을 믿고 과감하게 나아가셔도 좋습니다.",
            "별들이 당신의 {trait} 매력을 비추고 있으니, 자연스럽게 주목받게 될 것입니다."
        ],
        mid: [
            "당신의 {trait} 특성을 차분하게 발휘하면 무난하고 평화로운 하루가 됩니다.",
            "{trait} 본연의 모습을 잃지 않으면서 주변 흐름에 유연하게 대처하세요.",
            "너무 튀지 않게, 당신의 {trait} 장점을 조용히 갈고닦는 시간이 필요합니다."
        ],
        bad: [
            "오늘은 기운이 충돌할 수 있으니, {trait} 성향을 조금 억누르는 지혜가 필요합니다.",
            "주변 상황이 당신의 {trait} 방식과는 다르게 흘러갈 수 있으니 주의하세요.",
            "잠시 멈춰서 심호흡하세요. {trait} 고집을 내려놓으면 오히려 길이 보입니다."
        ]
    },
    // [구체적 상황 예시 카테고리]
    situations: [
        "특히 **대인관계**에서 예상치 못한 기쁨이 기다리고 있습니다. 먼저 손을 내밀어 보세요.",
        "오늘은 **업무나 학업**에서 놀라운 집중력을 발휘할 수 있는 타이밍입니다.",
        "**금전적인 결정**에 있어서 직관보다는 데이터를 신뢰하는 것이 이롭습니다.",
        "오래된 **친구**에게서 반가운 연락이 올 수 있습니다. 마음을 열어두세요.",
        "**새로운 시작**을 하기에 적합합니다. 미뤄왔던 계획을 작게라도 실행해보세요."
    ]
};

// --- Part 2: Expert Oriental Templates ---
const ORIENTAL_TEMPLATES = {
    // [오행의 흐름]
    elements: {
        wood: ["생명이 싹트는 '목(나무)'의 기운이 강하게 뻗어 나가는 날입니다.", "새로운 시작과 성장을 알리는 푸른 기운이 감돕니다."],
        fire: ["열정이 타오르는 '화(불)'의 기운이 하늘을 수놓는 날입니다.", "모든 것이 명확하게 드러나는 밝은 기운이 가득합니다."],
        earth: ["만물을 포용하는 '토(흙)'의 기운이 중심을 잡는 날입니다.", "변화보다는 안정을 추구하는 묵직한 기운이 흐릅니다."],
        metal: ["결실을 맺는 '금(쇠)'의 기운이 냉철하게 작용하는 날입니다.", "가지치기를 하듯 맺고 끊음이 확실한 기운입니다."],
        water: ["지혜가 흐르는 '수(물)'의 기운이 유유히 흐르는 날입니다.", "겉보다 속이 깊어지는 차분한 침묵의 기운입니다."]
    },
    // [띠 반응 - Good/Mid/Bad]
    reaction: {
        good: [
            "당신 띠의 {trait} 기질이 오늘의 기운을 만나 물 만난 고기처럼 활력을 얻습니다.",
            "오행이 상생하니, 당신의 {trait} 장점이 십분 발휘되어 도처에 귀인이 따릅니다.",
            "하늘의 기운이 당신을 돕습니다. {trait} 태도로 임하면 큰 성과가 있을 것입니다."
        ],
        mid: [
            "큰 파도 없이 잔잔합니다. {trait} 성향대로 꾸준히 밀고 나가면 길합니다.",
            "좋음과 나쁨이 섞여 있으니, {trait} 지혜를 발휘하여 중심을 잡아야 합니다.",
            "무리하지 않는 것이 최선입니다. {trait} 미덕을 지키며 수성(守城)하세요."
        ],
        bad: [
            "오늘은 기운이 상충하니, {trait} 기질을 잠시 감추고 겸손하게 행동해야 합니다.",
            "역풍이 불 수 있습니다. {trait} 고집보다는 유연함이 위기를 기회로 바꿉니다.",
            "돌다리도 두들겨 보아야 합니다. {trait} 성급함을 경계하고 신중을 기하세요."
        ]
    },
    // [실천적 조언]
    action: [
        "오늘의 행운은 **동쪽**에서 불어옵니다. 아침 일찍 창문을 열어 환기하세요.",
        "대화보다는 **경청**이 복을 부릅니다. 상대방의 눈을 바라보며 이야기하세요.",
        "잠시 **자연**과 가까이하는 시간이 필요합니다. 짧은 산책이 막힌 기운을 뚫어줍니다.",
        "**따뜻한 차 한 잔**의 여유가 꼬인 실타래를 푸는 열쇠가 됩니다.",
        "중요한 약속은 **오후**로 잡는 것이 유리합니다. 오전에는 내실을 다지세요."
    ]
};

// --- 3. Engine Logic ---

function getSeededRandom(seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    const x = Math.sin(hash) * 10000;
    return x - Math.floor(x);
}

function getDailyEnergies(dateObj) {
    const dateStr = `${dateObj.getFullYear()}${dateObj.getMonth()}${dateObj.getDate()}`;
    const rand = getSeededRandom("DAILY_MASTER_" + dateStr);

    // Western Element
    const wElements = ["fire", "earth", "air", "water"];
    const wEl = wElements[Math.floor(rand * wElements.length)];

    // Eastern Five Elements
    const eElements = ["wood", "fire", "earth", "metal", "water"];
    // Offset rand slightly for eastern to avoid obvious correlation
    const eRand = getSeededRandom("EASTERN_" + dateStr + rand);
    const eEl = eElements[Math.floor(eRand * eElements.length)];

    return { wEl, eEl, dateStr };
}

// Helper: Trait Select
function pickTrait(list, seed) {
    const idx = Math.floor(getSeededRandom(seed) * list.length);
    return list[idx];
}

// ----------------------------------------------------
// Export 1: Western Horoscope
// ----------------------------------------------------
export function getDailyHoroscope(memberName, birthDateStr) {
    if (!birthDateStr) return null;

    const today = new Date();
    const { wEl, dateStr } = getDailyEnergies(today);

    const zodiacName = getZodiacName(birthDateStr);
    const zData = ZODIAC_DATA[zodiacName];

    // Compatibility
    const relation = ELEMENT_RELATIONS.western[zData.element];
    let status = "mid";

    // Logic: Same element is Good too in this engine? Or Neutral?
    // Let's follow relation map.
    if (relation.good.includes(wEl)) status = "good";
    else if (relation.bad.includes(wEl)) status = "bad";
    // Else mid (neutral)

    // Build Sentence
    const seed = dateStr + memberName + "WEST";

    // 1. Element Intro
    const introList = HORO_TEMPLATES.elements[wEl];
    const intro = introList[Math.floor(getSeededRandom(seed + "intro") * introList.length)];

    // 2. Trait Advice
    const trait = pickTrait(zData.traits, seed + "trait");
    const adviceList = HORO_TEMPLATES.advice[status];
    let advice = adviceList[Math.floor(getSeededRandom(seed + "adv") * adviceList.length)];
    advice = advice.replace("{trait}", trait);

    // 3. Situation
    const sitList = HORO_TEMPLATES.situations;
    const sit = sitList[Math.floor(getSeededRandom(seed + "sit") * sitList.length)];

    return {
        type: "western",
        sign: zodiacName,
        element: wEl,
        status: status,
        text: `${intro} ${advice} ${sit}`
    };
}

// ----------------------------------------------------
// Export 2: Oriental Fortune (Zodiac)
// ----------------------------------------------------
export function getDailyOrientalFortune(memberName, birthDateStr) {
    if (!birthDateStr) return null;

    const today = new Date();
    const { eEl, dateStr } = getDailyEnergies(today);

    const zodiacName = getChineseZodiacName(birthDateStr);
    const zData = ORIENTAL_ZODIAC_DATA[zodiacName];

    // Compatibility
    const relation = ELEMENT_RELATIONS.eastern[zData.element.split(" ")[1] || "earth"];
    // Data has "water" etc as key directly in ORIENTAL_ZODIAC_DATA? 
    // Wait, defined as "쥐띠": { element: "water" ... } 

    // Logic check: zData.element is "water"
    let status = "mid";
    const myEl = zData.element;
    const relData = ELEMENT_RELATIONS.eastern[myEl];

    if (relData.good.includes(eEl)) status = "good";
    else if (relData.bad.includes(eEl)) status = "bad";

    // Build Sentence
    const seed = dateStr + memberName + "EAST";

    // 1. Element Intro
    const introList = ORIENTAL_TEMPLATES.elements[eEl];
    const intro = introList[Math.floor(getSeededRandom(seed + "intro") * introList.length)];

    // 2. Reaction
    const trait = pickTrait(zData.traits, seed + "trait");
    const reactList = ORIENTAL_TEMPLATES.reaction[status];
    let react = reactList[Math.floor(getSeededRandom(seed + "react") * reactList.length)];
    react = react.replace("{trait}", trait);

    // 3. Action
    const actList = ORIENTAL_TEMPLATES.action;
    const act = actList[Math.floor(getSeededRandom(seed + "act") * actList.length)];

    return {
        type: "eastern",
        sign: zodiacName,
        element: eEl,
        status: status,
        text: `${intro} ${react} ${act}`
    };
}


// --- Helpers ---
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
