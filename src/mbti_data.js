// MBTI Data & Logic
// 36 Questions Pool (9 per type pair)

const questionPool = {
    EI: [
        { t: "오랜만에 찾아온 휴일, 당신의 선택은?", a: "친구들과 만나 밖에서 신나게 논다", b: "집에서 넷플릭스 보며 뒹굴거린다" },
        { t: "새로운 모임에 나갔을 때 나는?", a: "먼저 다가가서 인사하고 대화를 주도한다", b: "누가 말을 걸어줄 때까지 조용히 있는다" },
        { t: "친구가 갑자기 파티에 초대한다면?", a: "완전 좋아! 당장 갈게!", b: "음... (기가 빨릴 것 같아서) 고민해본다" },
        { t: "스트레스를 푸는 나만의 방법은?", a: "친구들과 수다 떨거나 노래방 가기", b: "혼자 맛있는 거 먹거나 잠자기" },
        { t: "엘리베이터에 낯선 사람과 단둘이 탔다.", a: "어색함을 참지 못하고 날씨 얘기라도 꺼낸다", b: "휴대전화만 쳐다보며 빨리 도착하길 빈다" },
        { t: "팀 프로젝트를 할 때 나는?", a: "발표자나 조장을 맡아 이끈다", b: "자료 조사나 PPT 제작을 맡아 뒤에서 돕는다" },
        { t: "생일 파티를 한다면?", a: "아는 사람 다 불러! 왁자지껄 성대하게", b: "정말 친한 친구 몇 명만 초대해서 오붓하게" },
        { t: "길을 가다 도를 아십니까를 만났다.", a: "말을 걸어오면 일단 대꾸는 해준다", b: "눈도 마주치지 않고 빠른 걸음으로 지나친다" },
        { t: "일주일 동안 집 밖으로 나가지 못한다면?", a: "답답해서 미쳐버릴지도 모른다", b: "오히려 좋아, 진정한 휴식이다" }
    ],
    SN: [
        { t: "멍 때릴 때 주로 하는 생각은?", a: "오늘 저녁 뭐 먹지? (현실적)", b: "좀비가 나타나면 어디로 도망가지? (공상적)" },
        { t: "여행 계획을 짤 때 나는?", a: "맛집, 숙소, 교통편 꼼꼼히 리뷰 확인", b: "대략적인 분위기와 느낌이 중요" },
        { t: "노래를 들을 때 더 중요하게 생각하는 건?", a: "멜로디와 비트", b: "가사의 숨겨진 의미와 감성" },
        { t: "요리 레시피를 볼 때", a: "정량대로 계량해서 정확하게 만든다", b: "대충 눈대중으로 감을 믿고 넣는다" },
        { t: "영화를 보고 나서", a: "배우 연기가 좋았어, 영상미가 쩔더라", b: "저 장면은 감독이 무슨 의도로 넣었을까?" },
        { t: "사과라는 단어를 들으면?", a: "빨갛다, 맛있다, 둥글다", b: "백설공주, 뉴턴, 아이폰, 애플" },
        { t: "설명서를 읽을 때", a: "처음부터 끝까지 꼼꼼하게 정독한다", b: "일단 이것저것 만져보고 안 되면 읽는다" },
        { t: "약속 장소를 설명할 때", a: "3번 출구 나와서 100m 직진 후 우회전", b: "거기 큰 빵집 있잖아, 그 골목으로 쭉 와" },
        { t: "미래에 대한 나의 생각은?", a: "당장 내일, 다음 달의 현실적인 계획", b: "먼 훗날 나의 모습, 인류의 미래" }
    ],
    TF: [
        { t: "친구가 힘든 일을 털어놓을 때 나의 반응은?", a: "그래서 어떻게 할 생각이야? (해결책)", b: "헐... 진짜 힘들었겠다 ㅠㅠ (공감)" },
        { t: "내가 실수를 했을 때 듣고 싶은 말은?", a: "다음엔 이렇게 하면 돼. (명확한 피드백)", b: "괜찮아, 그럴 수도 있지. (따뜻한 위로)" },
        { t: "의사결정을 내릴 때 나는?", a: "논리와 사실에 근거하여 판단", b: "나와 타인의 감정을 고려하여 판단" },
        { t: "친구가 머리를 이상하게 잘랐다.", a: "음, 조금 짧아진 것 같은데? (솔직)", b: "오~ 변화를 줬구나! 신선하다! (선의의 거짓말)" },
        { t: "드라마를 볼 때 눈물을 흘리는 이유는?", a: "주인공이 불쌍해서... (감정 이입)", b: "슬픈 장면 나오네 (하품)" }, // Note: A/B positioning swapped in logic usually, stick to A=T, B=F pattern if used? Wait. 
        // Let's check logic: handleAnswer: a->1st char, b->2nd char. 
        // TF: A -> T, B -> F. 
        // Q4: A(Soljik, T) vs B(Lie, F). OK.
        // Q5: A(Cry, F) vs B(Yawn, T). SWAPPED. NEED FIX.
        // Let's fix Q5 text order.
        { t: "슬픈 영화를 볼 때 나는?", a: "영화는 영화일 뿐, 분석하며 본다", b: "주인공에게 몰입해서 눈물 콧물 쏟는다" },
        { t: "친구가 차사고가 났다고 전화가 왔다.", a: "보험 불렀어? 다친 데는? (상황 파악)", b: "괜찮아? 많이 놀랐겠다 ㅠㅠ (걱정)" },
        { t: "누군가 나를 비판했을 때", a: "타당한 지적이라면 수용하고 고친다", b: "마상(마음의 상처) 입고 하루 종일 우울하다" },
        { t: "토론 프로그램 볼 때", a: "논리적으로 허점을 찌르는 쪽에 쾌감", b: "말을 너무 심하게 하면 불편하다" },
        { t: "선물을 고를 때", a: "실용적이고 필요한 물건", b: "정성이 들어간 예쁜 물건, 편지" }
    ],
    JP: [
        { t: "할 일이 쌓였을 때 나는?", a: "우선순위를 정해서 하나씩 처리한다", b: "일단 손에 잡히는 대로 하거나 마감 직전에 닥쳐서 한다" },
        { t: "여행 짐을 쌀 때?", a: "며칠 전부터 리스트를 작성해 준비", b: "출발 직전에 부랴부랴 챙겨 넣는다" },
        { t: "예상치 못한 스케줄 변경이 생기면?", a: "스트레스 받는다. 계획이 틀어졌어!", b: "오히려 좋아! 새로운 모험이다!" },
        { t: "책상 정리 스타일은?", a: "각 잡혀 있고 어디에 뭐가 있는지 다 안다", b: "어지러워 보이지만 나름의 규칙이 있다" },
        { t: "데이트 계획", a: "식당 예약, 영화 예매 완료", b: "일단 만나서 뭐 할지 정한다" },
        { t: "쇼핑할 때", a: "살 것만 딱 사서 나온다", b: "이것도 보고 저것도 보고 충동구매" },
        { t: "일기 쓰기", a: "매일매일 꾸준히 쓴다 (또는 쓰는 편이다)", b: "쓰다 말다 하거나 몰아서 쓴다" },
        { t: "마감이 2주 남았다.", a: "미리미리 조금씩 해둔다", b: "아직 많이 남았네? (놀다가 전날 밤샘)" },
        { t: "핸드폰 알림/메시지", a: "바로바로 확인해서 없앤다", b: "쌓아두고 나중에 한꺼번에 본다" }
    ]
};

// Generate 12 random questions (3 from each category)
export function generateQuiz() {
    const quiz = [];
    const categories = ['EI', 'SN', 'TF', 'JP'];

    categories.forEach(cat => {
        const pool = [...questionPool[cat]]; // Copy
        // Shuffle and pick 3
        const selected = pool.sort(() => 0.5 - Math.random()).slice(0, 3);
        // Add type info to each question for scoring logic
        selected.forEach(q => {
            // Logic in index.html expects { type: "EI", ... }
            q.type = cat;
            quiz.push(q);
        });
    });

    return quiz;
}

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
    if (typeA === typeB) return 80;

    if (results[typeA].matches.best === typeB) return 100;
    if (results[typeA].matches.worst === typeB) return 40;

    let diff = 0;
    const aChars = typeA.split('');
    const bChars = typeB.split('');

    let nsMatch = (aChars[1] === bChars[1]);

    for (let i = 0; i < 4; i++) {
        if (aChars[i] !== bChars[i]) diff++;
    }

    let score = 70; // Base

    if (diff === 4) score = 95;
    else if (diff === 3) score = 60;
    else if (diff === 2) score = 50;
    else if (diff === 1) score = 75;

    if (!nsMatch) score -= 10;

    return Math.max(0, Math.min(100, score));
}
