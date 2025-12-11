
// Fortune Engine
// 🚀 근거 기반 자동 생성형 운세 엔진
// Pure Logic, No API Costs.

// --- 1. Static Data (Basic Properties) ---
const ZODIAC_DATA = {
    "양자리": { element: "fire", traits: ["도전적", "열정적", "직설적"] },
    "황소자리": { element: "earth", traits: ["신중함", "현실적", "끈기"] },
    "쌍둥이자리": { element: "air", traits: ["호기심", "재치", "변화무쌍"] },
    "게자리": { element: "water", traits: ["감성적", "보호본능", "공감"] },
    "사자자리": { element: "fire", traits: ["자신감", "리더십", "화려함"] },
    "처녀자리": { element: "earth", traits: ["분석적", "섬세함", "실용적"] },
    "천칭자리": { element: "air", traits: ["조화", "사교적", "우아함"] },
    "전갈자리": { element: "water", traits: ["통찰력", "집중력", "신비로움"] },
    "사수자리": { element: "fire", traits: ["자유로움", "긍정적", "모험"] },
    "염소자리": { element: "earth", traits: ["성실함", "책임감", "목표지향"] },
    "물병자리": { element: "air", traits: ["독창적", "이성적", "독립적"] },
    "물고기자리": { element: "water", traits: ["상상력", "예술적", "다정함"] }
};

const ZODIAC_CHINESE_DATA = {
    "쥐띠": { element: "water", traits: ["지혜", "적응력"] },
    "소띠": { element: "earth", traits: ["성실", "우직함"] },
    "호랑이띠": { element: "wood", traits: ["용기", "리더십"] },
    "토끼띠": { element: "wood", traits: ["신중", "평화"] },
    "용띠": { element: "earth", traits: ["강인함", "이상"] },
    "뱀띠": { element: "fire", traits: ["지적", "차분함"] },
    "말띠": { element: "fire", traits: ["자유", "열정"] },
    "양띠": { element: "earth", traits: ["온화", "이해심"] },
    "원숭이띠": { element: "metal", traits: ["재주", "임기응변"] },
    "닭띠": { element: "metal", traits: ["정확", "부지런함"] },
    "개띠": { element: "earth", traits: ["충직", "정직"] },
    "돼지띠": { element: "water", traits: ["여유", "솔직"] }
};

// 상생(Good), 상극(Bad) Logic
// Fire <-> Water (Bad), Air <-> Earth (Bad)
// Wood -> Fire -> Earth -> Metal -> Water -> Wood (Good Cycle)
// Wood x Earth x Water x Fire x Metal x Wood (Bad Cycle/Control)

const ELEMENT_RELATIONS = {
    // 4 Elements (Western)
    western: {
        "fire": { good: ["air", "fire"], bad: ["water"], neutral: ["earth"] },
        "water": { good: ["earth", "water"], bad: ["fire"], neutral: ["air"] },
        "air": { good: ["fire", "air"], bad: ["earth"], neutral: ["water"] },
        "earth": { good: ["water", "earth"], bad: ["air"], neutral: ["fire"] }
    },
    // 5 Elements (Eastern)
    eastern: {
        "wood": { good: ["water", "fire"], bad: ["metal", "earth"] },
        "fire": { good: ["wood", "earth"], bad: ["water", "metal"] },
        "earth": { good: ["fire", "metal"], bad: ["wood", "water"] },
        "metal": { good: ["earth", "water"], bad: ["fire", "wood"] },
        "water": { good: ["metal", "wood"], bad: ["earth", "fire"] }
    }
};


// --- 2. Rich Templates (Massive Pool) ---
// Using string replacement: {trait}, {element}, {lucky_item}, {color}
const TEMPLATES = {
    high: [ // Good compatibility
        "[최고의 날] 오늘은 {element}의 기운이 당신의 {trait} 성향을 환하게 비춰줍니다. 망설이지 말고 리드해보세요!",
        "[행운 가득] 우주가 당신을 돕고 있어요. 평소 생각만 했던 일에 도전하면 기대 이상의 성과가 따릅니다.",
        "[자신감 상승] 에너지가 넘치는 하루입니다. 당신의 장점인 {trait} 면모가 빛을 발하여 주변의 인정을 받게 됩니다.",
        "[순풍] 하는 일마다 순조롭게 풀리는 기분 좋은 날입니다. 귀인의 도움이 있을 수 있으니 주변을 잘 살펴보세요.",
        "[쾌청] 마음이 맑고 평온합니다. 오늘은 당신의 직관이 정확하니 믿고 따라가도 좋습니다.",
        "[성취의 날] 노력한 만큼, 아니 그 이상의 보상이 따르는 날입니다. 작은 성공들이 모여 큰 기쁨이 됩니다.",
        "[활력 충전] 신체 리듬이 최상입니다. 미뤄왔던 운동이나 활동적인 취미를 즐기기에 완벽합니다.",
        "[인기 폭발] 대인관계 운이 아주 좋습니다. 당신의 {trait} 매력에 사람들이 자연스럽게 모여듭니다.",
        "[금전운 상승] 뜻밖의 이득이나 기분 좋은 선물이 들어올 수 있습니다. 지갑을 열어도 기분이 좋은 날입니다.",
        "[사랑의 기운] 애정운이 따스합니다. 소중한 사람과 깊은 대화를 나누면 관계가 한층 돈독해집니다.",
        "[막힘 없음] 마치 고속도로를 달리는 듯합니다. 장애물이 스스로 비켜가는 신기한 하루를 경험해보세요.",
        "[창의력 발휘] 아이디어가 샘솟는 날입니다. 메모하는 습관이 뜻밖의 행운을 가져다줄 것입니다.",
        "[힐링 데이] 가만히 있어도 에너지가 차오릅니다. 자신을 위한 작은 사치를 부려도 좋은 날입니다.",
        "[긍정의 힘] 긍정적인 말 한마디가 천 냥 빚을 갚습니다. 오늘은 당신이 행운의 전달자입니다.",
        "[리더십] 무리를 이끄는 힘이 생깁니다. 중요한 결정을 내려야 한다면 오늘이 적기입니다."
    ],
    mid: [ // Neutral
        "[평온한 하루] 특별한 사건 없이 물 흐르듯 편안한 하루입니다. 일상의 소소한 행복을 찾아보세요.",
        "[안정감] 큰 변화보다는 현재를 유지하는 것이 좋습니다. {trait} 성향을 살려 차분하게 하루를 정리해보세요.",
        "[균형] 일과 휴식의 밸런스가 중요한 날입니다. 무리하지 말고 자기만의 속도를 유지하세요.",
        "[관망] 서두르지 않는 것이 이득입니다. 한 발짝 물러서서 상황을 지켜보면 더 좋은 길이 보입니다.",
        "[소소한 행복] 거창한 계획보다는 맛있는 식사나 따뜻한 차 한 잔이 큰 위로가 되는 날입니다.",
        "[정리 정돈] 마음이나 주변을 정리하기 좋은 날입니다. 불필요한 것을 비우면 새로운 운이 들어옵니다.",
        "[준비] 도약을 위한 도움닫기 시기입니다. 결과를 재촉하지 말고 과정을 즐겨보세요.",
        "[협력] 독단적인 결정보다는 주변의 의견을 경청하는 것이 좋습니다. 함께하면 더 쉽습니다.",
        "[유연함] 계획대로 되지 않아도 괜찮습니다. 유연하게 대처하면 오히려 전화위복이 됩니다.",
        "[건강 관리] 오늘은 내 몸의 소리에 귀 기울여 보세요. 가벼운 스트레칭이 활력을 되찾아줍니다.",
        "[배움] 새로운 지식이나 정보를 얻기에 무난한 날입니다. 책을 읽거나 다큐멘터리를 보는 건 어떨까요?",
        "[겸손] 자신을 낮추면 오히려 존중받는 날입니다. 듣는 자세가 행운을 부릅니다.",
        "[신중] 돌다리도 두들겨 보고 건너세요. 익숙한 일이라도 한 번 더 확인하면 실수를 막습니다.",
        "[중용] 지나치지도 모자라지도 않은 상태를 유지하세요. 평범함이 비범함이 되는 날입니다.",
        "[휴식] 잠시 쉬어가는 쉼표 같은 하루입니다. 재충전의 시간을 가지세요."
    ],
    low: [ // Bad/Caution
        "[신중 필요] 오늘은 {element}의 기운이 강해 감정 기복이 있을 수 있습니다. 심호흡하고 차분해지세요.",
        "[주의] 예상치 못한 변수가 생길 수 있습니다. 당신의 {trait} 성향을 잠시 내려놓고 유연하게 대처하세요.",
        "[충돌 주의] 사소한 오해가 다툼으로 번질 수 있습니다. 오늘은 말조심이 최고의 부적입니다.",
        "[휴식 권장] 컨디션이 다소 저조할 수 있습니다. 무리한 약속은 잡지 말고 일찍 귀가하여 쉬는 게 좋습니다.",
        "[스트레스] 생각보다 일이 더디게 진행될 수 있습니다. 조급해하지 말고 '그럴 수도 있지'라고 넘겨보세요.",
        "[지출 관리] 충동적인 지출 욕구가 생길 수 있습니다. 지갑을 열기 전에 세 번만 더 생각해보세요.",
        "[건강 유의] 면역력이 떨어질 수 있으니 옷차림에 신경 쓰고 따뜻한 물을 자주 마시세요.",
        "[고집 금물] 내 생각만 옳다고 주장하면 고립될 수 있습니다. 오늘은 져주는 게 이기는 것입니다.",
        "[판단 보류] 중요한 계약이나 결정은 내일로 미루는 것이 현명합니다. 오늘은 안개가 낀 상태입니다.",
        "[겸손] 벼는 익을수록 고개를 숙입니다. 자존심을 조금만 내려놓으면 화를 면할 수 있습니다.",
        "[안전 제일] 활동적인 일보다는 정적인 활동이 유리합니다. 다치지 않도록 조심하세요.",
        "[멘탈 관리] 주변의 소음에 흔들리지 마세요. 명상이나 조용한 음악으로 마음의 중심을 잡으세요.",
        "[오해] 의도와 다르게 말이 전달될 수 있습니다. 문자로 남기기보단 직접 얼굴 보고 대화하세요.",
        "[인내심] 참을 인(忍) 자 세 번이면 살인도 면한다고 했습니다. 오늘은 인내심이 당신을 구합니다.",
        "[비움] 억지로 잡으려 할수록 빠져나갑니다. 흐름에 몸을 맡기고 순리대로 따르세요."
    ]
};

const LUCKY_ITEMS = [
    "텀블러", "이어폰", "손목시계", "선그라스", "향수", "물티슈", "초콜릿", "동전", "거울", "모자",
    "다이어리", "볼펜", "핸드크림", "우산", "스카프", "반지", "비타민", "책", "커피", "운동화"
];

const LUCKY_COLORS = [
    "빨강", "파랑", "노랑", "초록", "보라", "주황", "분홍", "하늘", "남색", "베이지",
    "민트", "라임", "차콜", "화이트", "블랙", "골드", "실버", "브라운", "와인", "코랄"
];

const LUCKY_ACTIONS = [
    "스트레칭하기", "물 한 잔 마시기", "하늘 쳐다보기", "부모님께 연락하기", "좋아하는 노래 듣기",
    "책상 정리하기", "산책하기", "심호흡 3번", "감사일기 쓰기", "과일 먹기", "사진 찍기",
    "칭찬 한마디", "뉴스 보기", "일찍 잠들기", "계단 이용하기", "웃는 연습", "명상하기"
];


// --- 3. Engine Logic (Deterministic) ---

// Seeded Random Helper
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

// Generate Today's Element/Energy based on Date
function getDailyEnergy(dateObj) {
    const dateStr = `${dateObj.getFullYear()}${dateObj.getMonth()}${dateObj.getDate()}`;
    const rand = getSeededRandom("DAILY_ENERGY_" + dateStr);

    const wList = ["fire", "water", "air", "earth"];
    const eList = ["wood", "fire", "earth", "metal", "water"];

    return {
        western: wList[Math.floor(rand * wList.length)],
        eastern: eList[Math.floor(rand * eList.length)],
        dateStr: dateStr
    };
}

// Main Function
export function getDailyFortune(memberName, birthDateStr) {
    if (!birthDateStr) return null;

    const today = new Date();
    const daily = getDailyEnergy(today);

    // 1. User Info
    const zodiacName = getZodiacName(birthDateStr);
    const zodiacInfo = ZODIAC_DATA[zodiacName] || ZODIAC_DATA["양자리"];

    // 2. Compatibility Check (Western mainly)
    const relation = ELEMENT_RELATIONS.western[zodiacInfo.element];
    let score = 50; // default mid
    let status = "mid";

    // Check relationship with today's element
    if (relation.good.includes(daily.western)) {
        score = 80; status = "high";
    } else if (relation.bad.includes(daily.western)) {
        score = 30; status = "low";
    }

    // 3. Template Selection (Deterministic Mix)
    // Seed: Date + Name + Status -> Ensures same user gets same text all day
    const seedStr = daily.dateStr + memberName + "FORTUNE";
    const rand = getSeededRandom(seedStr);

    // Select Template Array
    const targetTemplates = TEMPLATES[status];
    const templateIdx = Math.floor(rand * targetTemplates.length);
    let text = targetTemplates[templateIdx];

    // 4. Slot Filling
    // {trait}
    const traitIdx = Math.floor(getSeededRandom(seedStr + "trait") * zodiacInfo.traits.length);
    text = text.replace("{trait}", zodiacInfo.traits[traitIdx]);

    // {element} - Friendly Name
    const elementMap = { fire: "불꽃", water: "흐르는 물", air: "상쾌한 바람", earth: "단단한 대지" };
    text = text.replace("{element}", elementMap[daily.western]);

    // Lucky Items
    const itemIdx = Math.floor(getSeededRandom(seedStr + "item") * LUCKY_ITEMS.length);
    const colorIdx = Math.floor(getSeededRandom(seedStr + "color") * LUCKY_COLORS.length);
    const actionIdx = Math.floor(getSeededRandom(seedStr + "action") * LUCKY_ACTIONS.length);

    return {
        zodiac: zodiacName,
        element: daily.western,
        status: status, // high, mid, low
        score: score,  // Numeric feeling
        text: text,
        lucky: {
            item: LUCKY_ITEMS[itemIdx],
            color: LUCKY_COLORS[colorIdx],
            action: LUCKY_ACTIONS[actionIdx]
        }
    };
}

// Helpers
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
