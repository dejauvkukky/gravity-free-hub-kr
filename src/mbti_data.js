export const questions = [
    // E vs I (3 questions)
    { id: 1, type: "EI", t: "오랜만에 찾아온 휴일, 당신의 선택은?", a: "친구들과 만나 밖에서 신나게 논다", b: "집에서 넷플릭스 보며 뒹굴거린다" },
    { id: 2, type: "EI", t: "새로운 모임에 나갔을 때 나는?", a: "먼저 다가가서 인사하고 대화를 주도한다", b: "누가 말을 걸어줄 때까지 조용히 있는다" },
    { id: 3, type: "EI", t: "친구가 갑자기 파티에 초대한다면?", a: "완전 좋아! 당장 갈게!", b: "음... (기가 빨릴 것 같아서) 고민해본다" },

    // S vs N (3 questions)
    { id: 4, type: "SN", t: "멍 때릴 때 주로 하는 생각은?", a: "오늘 저녁 뭐 먹지? (현실적)", b: "좀비가 나타나면 어디로 도망가지? (공상적)" },
    { id: 5, type: "SN", t: "여행 계획을 짤 때 나는?", a: "맛집, 숙소, 교통편 꼼꼼히 리뷰 확인", b: "대략적인 분위기와 느낌이 중요" },
    { id: 6, type: "SN", t: "노래를 들을 때 더 중요하게 생각하는 건?", a: "멜로디와 비트", b: "가사의 숨겨진 의미와 감성" },

    // T vs F (3 questions)
    { id: 7, type: "TF", t: "친구가 힘든 일을 털어놓을 때 나의 반응은?", a: "그래서 어떻게 할 생각이야? (해결책)", b: "헐... 진짜 힘들었겠다 ㅠㅠ (공감)" },
    { id: 8, type: "TF", t: "내가 실수를 했을 때 듣고 싶은 말은?", a: "다음엔 이렇게 하면 돼. (명확한 피드백)", b: "괜찮아, 그럴 수도 있지. (따뜻한 위로)" },
    { id: 9, type: "TF", t: "의사결정을 내릴 때 나는?", a: "논리와 사실에 근거하여 판단", b: "나와 타인의 감정을 고려하여 판단" },

    // J vs P (3 questions)
    { id: 10, type: "JP", t: "할 일이 쌓였을 때 나는?", a: "우선순위를 정해서 하나씩 처리한다", b: "일단 손에 잡히는 대로 하거나 마감 직전에 닥쳐서 한다" },
    { id: 11, type: "JP", t: "여행 짐을 쌀 때?", a: "며칠 전부터 리스트를 작성해 준비", b: "출발 직전에 부랴부랴 챙겨 넣는다" },
    { id: 12, type: "JP", t: "예상치 못한 스케줄 변경이 생기면?", a: "스트레스 받는다. 계획이 틀어졌어!", b: "오히려 좋아! 새로운 모험이다!" }
];

export const results = {
    "ISTJ": {
        name: "청렴결백한 논리주의자",
        desc: "책임감이 강하고 현실적이며 매사에 철저합니다.",
        tips: "변화를 두려워 말아요. 가족의 감정도 챙겨주세요!",
        img: "https://api.dicebear.com/7.x/adventurer/svg?seed=ISTJ",
        matches: { best: "ESFP", worst: "ENFJ" }
    },
    "ISFJ": {
        name: "용감한 수호자",
        desc: "차분하고 헌신적이며 침착하게 주변 사람을 챙깁니다.",
        tips: "남만 챙기지 말고 본인도 챙기세요. 거절하는 법을 배워봐요.",
        img: "https://api.dicebear.com/7.x/adventurer/svg?seed=ISFJ",
        matches: { best: "ESFP", worst: "ENTP" }
    },
    "INFJ": {
        name: "통찰력 있는 선지자",
        desc: "사람에 대한 통찰력이 뛰어나고 깊은 영감을 줍니다.",
        tips: "속마음을 가족에게 조금만 더 표현해보세요.",
        img: "https://api.dicebear.com/7.x/adventurer/svg?seed=INFJ",
        matches: { best: "ENFP", worst: "ESTJ" }
    },
    "INTJ": {
        name: "용의주도한 전략가",
        desc: "상상력이 풍부하며 철두철미한 계획을 세웁니다.",
        tips: "가족의 사소한 실수에도 너그러워질 필요가 있어요.",
        img: "https://api.dicebear.com/7.x/adventurer/svg?seed=INTJ",
        matches: { best: "ENFP", worst: "ESFJ" }
    },
    "ISTP": {
        name: "만능 재주꾼",
        desc: "과묵하지만 호기심이 많고 도구 사용에 능숙합니다.",
        tips: "가족 행사나 모임에 조금 더 적극적으로 참여해봐요.",
        img: "https://api.dicebear.com/7.x/adventurer/svg?seed=ISTP",
        matches: { best: "ESFJ", worst: "ENFJ" }
    },
    "ISFP": {
        name: "호기심 많은 예술가",
        desc: "온화하고 겸손하며 삶의 여유를 즐길 줄 압니다.",
        tips: "갈등을 피하지만 말고, 가끔은 내 의견을 확실히 말해보세요.",
        img: "https://api.dicebear.com/7.x/adventurer/svg?seed=ISFP",
        matches: { best: "ESTJ", worst: "ENTJ" }
    },
    "INFP": {
        name: "열정적인 중재자",
        desc: "상냥하고 이타적이며 낭만적인 이상을 추구합니다.",
        tips: "너무 깊은 생각에 빠져 우울해지지 않도록 주의해요.",
        img: "https://api.dicebear.com/7.x/adventurer/svg?seed=INFP",
        matches: { best: "ENFJ", worst: "ESTJ" }
    },
    "INTP": {
        name: "논리적인 사색가",
        desc: "지적 호기심이 높고 잠재력과 가능성을 중요시합니다.",
        tips: "가족과의 대화에서 너무 논리만 따지지 맙시다!",
        img: "https://api.dicebear.com/7.x/adventurer/svg?seed=INTP",
        matches: { best: "ENTJ", worst: "ESFJ" }
    },
    "ESTP": {
        name: "모험을 즐기는 사업가",
        desc: "에너지가 넘치고 직관적이며 스릴을 즐깁니다.",
        tips: "충동적인 결정 전에 가족과 한 번 상의해보세요.",
        img: "https://api.dicebear.com/7.x/adventurer/svg?seed=ESTP",
        matches: { best: "ISFJ", worst: "INFJ" }
    },
    "ESFP": {
        name: "자유로운 영혼의 연예인",
        desc: "사교적이고 활동적이며 분위기 메이커 역할을 합니다.",
        tips: "진지한 대화가 필요할 땐 집중해주세요.",
        img: "https://api.dicebear.com/7.x/adventurer/svg?seed=ESFP",
        matches: { best: "ISTJ", worst: "INTJ" }
    },
    "ENFP": {
        name: "재기발랄한 활동가",
        desc: "창의적이고 열정적이며 사람들과 어울리기를 좋아합니다.",
        tips: "시작한 일을 끝까지 마무리하는 모습을 가족에게 보여주세요.",
        img: "https://api.dicebear.com/7.x/adventurer/svg?seed=ENFP",
        matches: { best: "INFJ", worst: "ISTJ" }
    },
    "ENTP": {
        name: "뜨거운 논쟁을 즐기는 변론가",
        desc: "지적인 도전을 즐기고 똑똑한 호기심으로 가득 찹니다.",
        tips: "논쟁보다는 공감이 필요할 때가 있답니다.",
        img: "https://api.dicebear.com/7.x/adventurer/svg?seed=ENTP",
        matches: { best: "INFJ", worst: "ISFJ" }
    },
    "ESTJ": {
        name: "엄격한 관리자",
        desc: "사물과 사람을 관리하는 데 뛰어난 능력을 가졌습니다.",
        tips: "가족들에게 너무 통제하려 들지 말고 부드럽게 대해보세요.",
        img: "https://api.dicebear.com/7.x/adventurer/svg?seed=ESTJ",
        matches: { best: "ISFP", worst: "INFP" }
    },
    "ESFJ": {
        name: "사교적인 외교관",
        desc: "타인을 돕는 데 열성적이고 세심하며 인기가 많습니다.",
        tips: "비판을 너무 개인적으로 받아들이지 마세요.",
        img: "https://api.dicebear.com/7.x/adventurer/svg?seed=ESFJ",
        matches: { best: "ISFP", worst: "INTP" }
    },
    "ENFJ": {
        name: "정의로운 사회운동가",
        desc: "카리스마와 충만한 열정을 지닌 타고난 리더입니다.",
        tips: "모든 사람을 만족시킬 수는 없어요. 본인을 너무 희생하지 마세요.",
        img: "https://api.dicebear.com/7.x/adventurer/svg?seed=ENFJ",
        matches: { best: "INFP", worst: "ISTP" }
    },
    "ENTJ": {
        name: "대담한 통솔자",
        desc: "대담하고 상상력이 풍부하며 강한 의지의 지도자입니다.",
        tips: "가족 구성원의 감정을 조금 더 배려하고 존중해주세요.",
        img: "https://api.dicebear.com/7.x/adventurer/svg?seed=ENTJ",
        matches: { best: "INTP", worst: "ISFP" }
    }
};

// Simple compatibility score calculation
export function getCompatibility(typeA, typeB) {
    if (typeA === typeB) return 80; // Same type: Good but maybe clash

    // Check Best/Worst map first
    if (results[typeA].matches.best === typeB) return 100;
    if (results[typeA].matches.worst === typeB) return 40;

    // Basic Logic: Iterate chars
    let diff = 0;
    const aChars = typeA.split('');
    const bChars = typeB.split('');

    // Different logic for fun
    // N/S difference is often biggest clash source
    let nsMatch = (aChars[1] === bChars[1]);

    // Just simple diff count
    for (let i = 0; i < 4; i++) {
        if (aChars[i] !== bChars[i]) diff++;
    }

    // 4 diff (Dual): 90 (Opposites attract)
    // 0 diff: 80
    // NS diff: -20 penalty

    let score = 70; // Base

    if (diff === 4) score = 95;
    else if (diff === 3) score = 60;
    else if (diff === 2) score = 50;
    else if (diff === 1) score = 75;

    if (!nsMatch) score -= 10;

    return Math.max(0, Math.min(100, score));
}
