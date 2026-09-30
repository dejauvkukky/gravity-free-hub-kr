/**
 * 히라가나 학습 데이터베이스 (글자 정보, 발음, 팁, 기초 단어)
 */

// 1. 기본 청음 (50음도)
const SEION_DATA = [
  // あ행 (모음 기본)
  { char: 'あ', romaji: 'a', kana: '아', row: 'a', step: 1, strokes: 3, tip: '모자 쓴 사람 모양 (아침 햇살)', example: { word: 'あさ', romaji: 'asa', meaning: '아침' } },
  { char: 'い', romaji: 'i', kana: '이', row: 'a', step: 1, strokes: 2, tip: '숫자 11과 비슷한 두 줄 (이빨)', example: { word: 'いぬ', romaji: 'inu', meaning: '개 (강아지)' } },
  { char: 'う', romaji: 'u', kana: '우', row: 'a', step: 1, strokes: 2, tip: '등이 굽은 사람이 우는 모습', example: { word: 'うみ', romaji: 'umi', meaning: '바다' } },
  { char: 'え', romaji: 'e', kana: '에', row: 'a', step: 1, strokes: 2, tip: '획이 꺾인 에스(S)자 계단', example: { word: 'えき', romaji: 'eki', meaning: '역 (기차역)' } },
  { char: 'お', romaji: 'o', kana: '오', row: 'a', step: 1, strokes: 3, tip: 'あ와 비슷하지만 오른쪽에 점이 있음', example: { word: 'おちゃ', romaji: 'ocha', meaning: '차 (녹차)' } },

  // か행 (k)
  { char: 'か', romaji: 'ka', kana: '카', row: 'ka', step: 1, strokes: 3, tip: '칼 모양(力) 옆에 물방울 점', example: { word: 'かさ', romaji: 'kasa', meaning: '우산' } },
  { char: 'き', romaji: 'ki', kana: '키', row: 'ka', step: 1, strokes: 4, tip: '열쇠(Key) 구멍과 손잡이 모양', example: { word: 'き', romaji: 'ki', meaning: '나무' } },
  { char: 'く', romaji: 'ku', kana: '쿠', row: 'ka', step: 1, strokes: 1, tip: '새의 부리 모양 (뻐꾹뻐꾹)', example: { word: 'くるま', romaji: 'kuruma', meaning: '자동차' } },
  { char: 'け', romaji: 'ke', kana: '케', row: 'ka', step: 1, strokes: 3, tip: '케이블 기둥과 전선 모양', example: { word: 'けさ', romaji: 'kesa', meaning: '오늘 아침' } },
  { char: 'こ', romaji: 'ko', kana: '코', row: 'ka', step: 1, strokes: 2, tip: '위아래 두 줄 (코스프레 모자)', example: { word: 'こども', romaji: 'kodomo', meaning: '어린이' } },

  // さ행 (s)
  { char: 'さ', romaji: 'sa', kana: '사', row: 'sa', step: 1, strokes: 3, tip: 'き와 비슷하지만 가로선이 1개뿐', example: { word: 'さくら', romaji: 'sakura', meaning: '벚꽃' } },
  { char: 'し', romaji: 'shi', kana: '시', row: 'sa', step: 1, strokes: 1, tip: '낚싯바늘 모양', example: { word: 'しろ', romaji: 'shiro', meaning: '흰색 / 성' } },
  { char: 'す', romaji: 'su', kana: '스', row: 'sa', step: 1, strokes: 2, tip: '꼬리가 둥글게 말린 그네/수영', example: { word: 'すし', romaji: 'sushi', meaning: '초밥' } },
  { char: 'せ', romaji: 'se', kana: '세', row: 'sa', step: 1, strokes: 3, tip: '세계(世)의 한자에서 유래', example: { word: 'せんせい', romaji: 'sensei', meaning: '선생님' } },
  { char: 'そ', romaji: 'so', kana: '소', row: 'sa', step: 1, strokes: 1, tip: '지그재그 Z자 아래 C 곡선', example: { word: 'そら', romaji: 'sora', meaning: '하늘' } },

  // た행 (t)
  { char: 'た', romaji: 'ta', kana: '타', row: 'ta', step: 1, strokes: 4, tip: '영어 ta 글자와 비슷', example: { word: 'たまご', romaji: 'tamago', meaning: '달걀' } },
  { char: 'ち', romaji: 'chi', kana: '치', row: 'ta', step: 1, strokes: 2, tip: '치어리더의 5자 모양 (さ의 반대방향 곡선)', example: { word: 'ちず', romaji: 'chizu', meaning: '지도' } },
  { char: 'つ', romaji: 'tsu', kana: '츠', row: 'ta', step: 1, strokes: 1, tip: '츠나미(해일) 파도 모양', example: { word: 'つき', romaji: 'tsuki', meaning: '달' } },
  { char: 'て', romaji: 'te', kana: '테', row: 'ta', step: 1, strokes: 1, tip: '테니스 라켓 손잡이 곡선', example: { word: 'て', romaji: 'te', meaning: '손' } },
  { char: 'と', romaji: 'to', kana: '토', row: 'ta', step: 1, strokes: 2, tip: '발가락(Toe)에 가시 박힌 모양', example: { word: 'ともだち', romaji: 'tomodachi', meaning: '친구' } },

  // な행 (n)
  { char: 'な', romaji: 'na', kana: '나', row: 'na', step: 1, strokes: 4, tip: '십자가 옆에 매듭 (나비 모양)', example: { word: 'なつ', romaji: 'natsu', meaning: '여름' } },
  { char: 'に', romaji: 'ni', kana: '니', row: 'na', step: 1, strokes: 3, tip: '세로선 옆에 두 이(二) (바늘과 실)', example: { word: 'にく', romaji: 'niku', meaning: '고기' } },
  { char: 'ぬ', romaji: 'nu', kana: '누', row: 'na', step: 1, strokes: 2, tip: '국수(Noodle) 젓가락 끝 매듭', example: { word: 'いぬ', romaji: 'inu', meaning: '개' } },
  { char: 'ね', romaji: 'ne', kana: '네', row: 'na', step: 1, strokes: 2, tip: '고양이(Neko) 꼬리 말린 모양', example: { word: 'ねこ', romaji: 'neko', meaning: '고양이' } },
  { char: 'の', romaji: 'no', kana: '노', row: 'na', step: 1, strokes: 1, tip: '금지(No) 표지판 동그라미', example: { word: 'のみもの', romaji: 'nomimono', meaning: '음료수' } },

  // は행 (h)
  { char: 'は', romaji: 'ha', kana: '하', row: 'ha', step: 1, strokes: 3, tip: '하프(Harp) 모양 악기', example: { word: 'はな', romaji: 'hana', meaning: '꽃 / 코' } },
  { char: 'ひ', romaji: 'hi', kana: '히', row: 'ha', step: 1, strokes: 1, tip: '히죽히죽 웃는 입 모양', example: { word: 'ひと', romaji: 'hito', meaning: '사람' } },
  { char: 'ふ', romaji: 'fu', kana: '후', row: 'ha', step: 1, strokes: 4, tip: '후지산(Fuji) 모양과 구름', example: { word: 'ふゆ', romaji: 'fuyu', meaning: '겨울' } },
  { char: 'へ', romaji: 'he', kana: '헤', row: 'ha', step: 1, strokes: 1, tip: '헤엄치는 산등성이 (지붕)', example: { word: 'へや', romaji: 'heya', meaning: '방' } },
  { char: 'ほ', romaji: 'ho', kana: '호', row: 'ha', step: 1, strokes: 4, tip: '모자 쓴 하프 (は와 달리 위에 모자선 돌출 안 됨)', example: { word: 'ほし', romaji: 'hoshi', meaning: '별' } },

  // ま행 (m)
  { char: 'ま', romaji: 'ma', kana: '마', row: 'ma', step: 1, strokes: 3, tip: '마스크 쓴 얼굴 (가로 두 줄)', example: { word: 'まち', romaji: 'machi', meaning: '마을 / 도시' } },
  { char: 'み', romaji: 'mi', kana: '미', row: 'ma', step: 1, strokes: 2, tip: '숫자 21 또는 音표(음악)', example: { word: 'みず', romaji: 'mizu', meaning: '물' } },
  { char: 'む', romaji: 'mu', kana: '무', row: 'ma', step: 1, strokes: 3, tip: '음메~ 소(Cow) 머리와 꼬리', example: { word: 'むし', romaji: 'mushi', meaning: '벌레' } },
  { char: 'め', romaji: 'me', kana: '메', row: 'ma', step: 1, strokes: 2, tip: '눈(目/Me) 모양 (ぬ와 달리 꼬리 매듭 없음)', example: { word: 'め', romaji: 'me', meaning: '눈(Eye)' } },
  { char: 'も', romaji: 'mo', kana: '모', row: 'ma', step: 1, strokes: 3, tip: '낚싯바늘에 지렁이 두 마리', example: { word: 'もり', romaji: 'mori', meaning: '숲' } },

  // や행 (y)
  { char: 'や', romaji: 'ya', kana: '야', row: 'ya', step: 1, strokes: 3, tip: '야크(Yak)의 뿔 모양', example: { word: 'やま', romaji: 'yama', meaning: '산' } },
  { char: 'ゆ', romaji: 'yu', kana: '유', row: 'ya', step: 1, strokes: 2, tip: '물고기가 유영하는 모습', example: { word: 'ゆき', romaji: 'yuki', meaning: '눈(Snow)' } },
  { char: 'よ', romaji: 'yo', kana: '요', row: 'ya', step: 1, strokes: 2, tip: '요요(Yo-yo)를 잡은 손가락', example: { word: 'よる', romaji: 'yoru', meaning: '밤' } },

  // ら행 (r)
  { char: 'ら', romaji: 'ra', kana: '라', row: 'ra', step: 1, strokes: 2, tip: '라디오 안테나와 스피커', example: { word: 'らいおん', romaji: 'raion', meaning: '사자' } },
  { char: 'り', romaji: 'ri', kana: '리', row: 'ra', step: 1, strokes: 2, tip: '강물(River)이 두 갈래로 흐름', example: { word: 'りんご', romaji: 'ringo', meaning: '사과' } },
  { char: 'る', romaji: 'ru', kana: '루', row: 'ra', step: 1, strokes: 1, tip: '루비 보석을 품은 꼬리 매듭', example: { word: 'くるま', romaji: 'kuruma', meaning: '자동차' } },
  { char: 'れ', romaji: 're', kana: '레', row: 'ra', step: 1, strokes: 2, tip: '바깥으로 삐친 레슬러의 발', example: { word: 'れいぞうこ', romaji: 'reizouko', meaning: '냉장고' } },
  { char: 'ろ', romaji: 'ro', kana: '로', row: 'ra', step: 1, strokes: 1, tip: '길(Road)의 숫자 3 모양 (매듭 없음)', example: { word: 'ろうそく', romaji: 'rousoku', meaning: '양초' } },

  // わ/を/ん (w, n)
  { char: 'わ', romaji: 'wa', kana: '와', row: 'wa', step: 1, strokes: 2, tip: '둥근 와인잔 곡선', example: { word: 'わたし', romaji: 'watashi', meaning: '나 / 저' } },
  { char: 'を', romaji: 'wo/o', kana: '오(조사)', row: 'wa', step: 1, strokes: 3, tip: '목적격 조사 "~을/를"로만 쓰임', example: { word: 'ほんをよむ', romaji: 'hon o yomu', meaning: '책을 읽다' } },
  { char: 'ん', romaji: 'n', kana: '응/받침', row: 'wa', step: 1, strokes: 1, tip: '알파벳 n을 흘려 쓴 모양 (단독 시작 불가)', example: { word: 'ほん', romaji: 'hon', meaning: '책' } }
];

// 2. 탁음 (가/자/다/바 행) & 반탁음 (파 행)
const DAKUON_DATA = [
  // が행 (g)
  { char: 'が', romaji: 'ga', kana: '가', type: 'dakuon', step: 2, base: 'か', example: { word: 'がっこう', romaji: 'gakkou', meaning: '학교' } },
  { char: 'ぎ', romaji: 'gi', kana: '기', type: 'dakuon', step: 2, base: 'き', example: { word: 'ぎんこう', romaji: 'ginkou', meaning: '은행' } },
  { char: 'ぐ', romaji: 'gu', kana: '구', type: 'dakuon', step: 2, base: 'く', example: { word: 'ぐらい', romaji: 'gurai', meaning: '정도/쯤' } },
  { char: 'げ', romaji: 'ge', kana: '게', type: 'dakuon', step: 2, base: 'け', example: { word: 'げんき', romaji: 'genki', meaning: '건강/원기' } },
  { char: 'ご', romaji: 'go', kana: '고', type: 'dakuon', step: 2, base: 'こ', example: { word: 'ごはん', romaji: 'gohan', meaning: '밥/식사' } },

  // ざ행 (z/j)
  { char: 'ざ', romaji: 'za', kana: '자', type: 'dakuon', step: 2, base: 'さ', example: { word: 'ざっし', romaji: 'zasshi', meaning: '잡지' } },
  { char: 'じ', romaji: 'ji', kana: '지', type: 'dakuon', step: 2, base: 'し', example: { word: 'じかん', romaji: 'jikan', meaning: '시간' } },
  { char: 'ず', romaji: 'zu', kana: '즈', type: 'dakuon', step: 2, base: 'す', example: { word: 'ちず', romaji: 'chizu', meaning: '지도' } },
  { char: 'ぜ', romaji: 'ze', kana: '제', type: 'dakuon', step: 2, base: 'せ', example: { word: 'ぜんぶ', romaji: 'zenbu', meaning: '전부' } },
  { char: 'ぞ', romaji: 'zo', kana: '조', type: 'dakuon', step: 2, base: 'そ', example: { word: 'ぞう', romaji: 'zou', meaning: '코끼리' } },

  // だ행 (d)
  { char: 'だ', romaji: 'da', kana: '다', type: 'dakuon', step: 2, base: 'た', example: { word: 'だいがく', romaji: 'daigaku', meaning: '대학교' } },
  { char: 'ぢ', romaji: 'ji', kana: '지(ぢ)', type: 'dakuon', step: 2, base: 'ち', example: { word: 'はなぢ', romaji: 'hanaji', meaning: '코피' } },
  { char: 'づ', romaji: 'zu', kana: '즈(づ)', type: 'dakuon', step: 2, base: 'つ', example: { word: 'つづく', romaji: 'tsuzuku', meaning: '이어지다' } },
  { char: 'で', romaji: 'de', kana: '데', type: 'dakuon', step: 2, base: 'て', example: { word: 'でんしゃ', romaji: 'densha', meaning: '전철' } },
  { char: 'ど', romaji: 'do', kana: '도', type: 'dakuon', step: 2, base: 'と', example: { word: 'どこ', romaji: 'doko', meaning: '어디' } },

  // ば행 (b)
  { char: 'ば', romaji: 'ba', kana: '바', type: 'dakuon', step: 2, base: 'は', example: { word: 'ばんごう', romaji: 'bangou', meaning: '번호' } },
  { char: 'び', romaji: 'bi', kana: '비', type: 'dakuon', step: 2, base: 'ひ', example: { word: 'びょういん', romaji: 'byouin', meaning: '병원' } },
  { char: 'ぶ', romaji: 'bu', kana: '부', type: 'dakuon', step: 2, base: 'ふ', example: { word: 'ぶた', romaji: 'buta', meaning: '돼지' } },
  { char: 'べ', romaji: 'be', kana: '베', type: 'dakuon', step: 2, base: 'へ', example: { word: 'べんきょう', romaji: 'benkyou', meaning: '공부' } },
  { char: 'ぼ', romaji: 'bo', kana: '보', type: 'dakuon', step: 2, base: 'ほ', example: { word: 'ぼうし', romaji: 'boushi', meaning: '모자' } },

  // ぱ행 (반탁음 p)
  { char: 'ぱ', romaji: 'pa', kana: '파', type: 'handakuon', step: 2, base: 'は', example: { word: 'ぱん', romaji: 'pan', meaning: '빵' } },
  { char: 'ぴ', romaji: 'pi', kana: '피', type: 'handakuon', step: 2, base: 'ひ', example: { word: 'ぴあの', romaji: 'piano', meaning: '피아노' } },
  { char: 'ぷ', romaji: 'pu', kana: '푸', type: 'handakuon', step: 2, base: 'ふ', example: { word: 'ぷりん', romaji: 'purin', meaning: '푸딩' } },
  { char: 'ぺ', romaji: 'pe', kana: '페', type: 'handakuon', step: 2, base: 'へ', example: { word: 'ぺん', romaji: 'pen', meaning: '펜' } },
  { char: 'ぽ', romaji: 'po', kana: '포', type: 'handakuon', step: 2, base: 'ほ', example: { word: 'ぽすと', romaji: 'posuto', meaning: '우체통' } }
];

// 3. 요음 (이 단 + 작은 ゃ/ゅ/ょ)
const YOON_DATA = [
  { char: 'きゃ', romaji: 'kya', kana: '캬', step: 3, example: { word: 'きゃく', romaji: 'kyaku', meaning: '손님' } },
  { char: 'きゅ', romaji: 'kyu', kana: '큐', step: 3, example: { word: 'きゅうり', romaji: 'kyuuri', meaning: '오이' } },
  { char: 'きょ', romaji: 'kyo', kana: '쿄', step: 3, example: { word: 'きょう', romaji: 'kyou', meaning: '오늘' } },

  { char: 'しゃ', romaji: 'sha', kana: '샤', step: 3, example: { word: 'しゃしん', romaji: 'shashin', meaning: '사진' } },
  { char: 'しゅ', romaji: 'shu', kana: '슈', step: 3, example: { word: 'しゅみ', romaji: 'shumi', meaning: '취미' } },
  { char: 'しょ', romaji: 'sho', kana: '쇼', step: 3, example: { word: 'しょくどう', romaji: 'shokudou', meaning: '식당' } },

  { char: 'ちゃ', romaji: 'cha', kana: '차', step: 3, example: { word: 'おちゃ', romaji: 'ocha', meaning: '차(Tea)' } },
  { char: 'ちゅ', romaji: 'chu', kana: '추', step: 3, example: { word: 'ちゅうごく', romaji: 'chuugoku', meaning: '중국' } },
  { char: 'ちょ', romaji: 'cho', kana: '초', step: 3, example: { word: 'ちょっと', romaji: 'chotto', meaning: '조금/잠깐' } },

  { char: 'にゃ', romaji: 'nya', kana: '냐', step: 3, example: { word: 'にゃんこ', romaji: 'nyanko', meaning: '야옹이' } },
  { char: 'にゅ', romaji: 'nyu', kana: '뉴', step: 3, example: { word: 'ぎゅうにゅう', romaji: 'gyuunyuu', meaning: '우유' } },
  { char: 'にょ', romaji: 'nyo', kana: '뇨', step: 3, example: { word: 'にょうぼう', romaji: 'nyoubou', meaning: '아내' } },

  { char: 'ひゃ', romaji: 'hya', kana: '햐', step: 3, example: { word: 'ひゃく', romaji: 'hyaku', meaning: '백(100)' } },
  { char: 'ひゅ', romaji: 'hyu', kana: '휴', step: 3, example: { word: 'ひゅうが', romaji: 'hyuuga', meaning: '휴가' } },
  { char: 'ひょ', romaji: 'hyo', kana: '효', step: 3, example: { word: 'ひょう', romaji: 'hyou', meaning: '표/표범' } },

  { char: 'みゃ', romaji: 'mya', kana: '먀', step: 3, example: { word: 'みゃく', romaji: 'myaku', meaning: '맥박' } },
  { char: 'みゅ', romaji: 'myu', kana: '뮤', step: 3, example: { word: 'みゅーじっく', romaji: 'myuujikku', meaning: '음악' } },
  { char: 'みょ', romaji: 'myo', kana: '묘', step: 3, example: { word: 'みょうじ', romaji: 'myouji', meaning: '성씨' } },

  { char: 'りゃ', romaji: 'rya', kana: '랴', step: 3, example: { word: 'りゃく', romaji: 'ryaku', meaning: '생략' } },
  { char: 'りゅ', romaji: 'ryu', kana: '류', step: 3, example: { word: 'りゅうがく', romaji: 'ryuugaku', meaning: '유학' } },
  { char: 'りょ', romaji: 'ryo', kana: '료', step: 3, example: { word: 'りょこう', romaji: 'ryokou', meaning: '여행' } },

  { char: 'ぎゃ', romaji: 'gya', kana: '갸', step: 3, example: { word: 'ぎゃく', romaji: 'gyaku', meaning: '반대/역' } },
  { char: 'ぎゅ', romaji: 'gyu', kana: '규', step: 3, example: { word: 'ぎゅうにく', romaji: 'gyuuniku', meaning: '소고기' } },
  { char: 'ぎょ', romaji: 'gyo', kana: '교', step: 3, example: { word: 'ぎょぎょう', romaji: 'gyogyou', meaning: '어업' } },

  { char: 'じゃ', romaji: 'ja', kana: '자', step: 3, example: { word: 'じゃあ', romaji: 'jaa', meaning: '그럼' } },
  { char: 'じゅ', romaji: 'ju', kana: '주', step: 3, example: { word: 'じゅぎょう', romaji: 'jugyou', meaning: '수업' } },
  { char: 'じょ', romaji: 'jo', kana: '조', step: 3, example: { word: 'じょせい', romaji: 'josei', meaning: '여성' } },

  { char: 'びゃ', romaji: 'bya', kana: '뱌', step: 3, example: { word: 'びゃくだん', romaji: 'byakudan', meaning: '백단' } },
  { char: 'びゅ', romaji: 'byu', kana: '뷰', step: 3, example: { word: 'びゅーてぃー', romaji: 'byuutii', meaning: '뷰티' } },
  { char: 'びょ', romaji: 'byo', kana: '뵤', step: 3, example: { word: 'びょういん', romaji: 'byouin', meaning: '병원' } },

  { char: 'ぴゃ', romaji: 'pya', kana: '퍄', step: 3, example: { word: 'ろっぴゃく', romaji: 'roppyaku', meaning: '육백(600)' } },
  { char: 'ぴゅ', romaji: 'pyu', kana: '퓨', step: 3, example: { word: 'ぴゅあ', romaji: 'pyua', meaning: '퓨어' } },
  { char: 'ぴょ', romaji: 'pyo', kana: '표', step: 3, example: { word: 'はっぴょう', romaji: 'happyou', meaning: '발표' } }
];

// 헷갈리기 쉬운 글자 페어 (Confusing Pairs)
const CONFUSING_PAIRS = [
  { pair: ['あ', 'お'], desc: 'あ(a)는 왼쪽으로 말리고, お(o)는 오른쪽에 점이 있습니다.' },
  { pair: ['い', 'り'], desc: 'い(i)는 왼쪽이 길고, り(ri)는 오른쪽이 길게 내려옵니다.' },
  { pair: ['き', 'さ'], desc: 'き(ki)는 가로줄이 2개, さ(sa)는 가로줄이 1개입니다.' },
  { pair: ['さ', 'ち'], desc: 'さ(sa)는 오른쪽으로 둥글고, ち(chi)는 왼쪽으로 둥급니다 (서로 반대).' },
  { pair: ['ぬ', 'め'], desc: 'ぬ(nu)는 끝에 꼬리 매듭이 있고, め(me)는 매듭 없이 매끈합니다.' },
  { pair: ['ね', 'わ', 'れ'], desc: 'ね는 끝에 매듭, わ는 둥근 와인잔, れ는 밖으로 삐칩니다.' },
  { pair: ['る', 'ろ'], desc: 'る(ru)는 끝에 동그란 매듭, ろ(ro)는 매듭 없이 열려 있습니다.' },
  { pair: ['は', 'ほ'], desc: 'は(ha)는 위의 기둥이 뚫려있고, ほ(ho)는 가로 모자선에 막혀 있습니다.' },
  { pair: ['そ', 'て'], desc: 'そ(so)는 지그재그 Z자 연결, て(te)는 단순한 T자 곡선입니다.' }
];

// 4. 테마별 기초 단어 (초급 읽기 완성용 100+ 단어)
const VOCABULARY_DATA = [
  // 1. 인사 & 기본 표현 (Greetings)
  { word: 'おはよう', reading: '오하요-', romaji: 'ohayou', meaning: '좋은 아침 (인사)', category: 'greetings', level: 1 },
  { word: 'こんにちは', reading: '곤니치와', romaji: 'konnichiwa', meaning: '안녕하세요 (낮 인사)', category: 'greetings', level: 1 },
  { word: 'こんばんは', reading: '곤방와', romaji: 'konbanwa', meaning: '안녕하세요 (저녁 인사)', category: 'greetings', level: 1 },
  { word: 'ありがとう', reading: '아리가토-', romaji: 'arigatou', meaning: '고맙습니다', category: 'greetings', level: 1 },
  { word: 'すみません', reading: '스미마센', romaji: 'sumimasen', meaning: '죄송합니다 / 저기요', category: 'greetings', level: 1 },
  { word: 'さようなら', reading: '사요-나라', romaji: 'sayounara', meaning: '안녕히 계세요', category: 'greetings', level: 1 },
  { word: 'はい', reading: '하이', romaji: 'hai', meaning: '네', category: 'greetings', level: 1 },
  { word: 'いいえ', reading: '이이에', romaji: 'iie', meaning: '아니오', category: 'greetings', level: 1 },
  { word: 'どうぞ', reading: '도-조', romaji: 'douzo', meaning: '부디 / 어서요', category: 'greetings', level: 2 },
  { word: 'ごちそうさま', reading: '고치소-사마', romaji: 'gochisousama', meaning: '잘 먹었습니다', category: 'greetings', level: 2 },

  // 2. 숫자 (Numbers)
  { word: 'いち', reading: '이치', romaji: 'ichi', meaning: '일 (1)', category: 'numbers', level: 1 },
  { word: 'に', reading: '니', romaji: 'ni', meaning: '이 (2)', category: 'numbers', level: 1 },
  { word: 'さん', reading: '산', romaji: 'san', meaning: '삼 (3)', category: 'numbers', level: 1 },
  { word: 'よん', reading: '욘', romaji: 'yon', meaning: '사 (4)', category: 'numbers', level: 1 },
  { word: 'ご', reading: '고', romaji: 'go', meaning: '오 (5)', category: 'numbers', level: 1 },
  { word: 'ろく', reading: '로쿠', romaji: 'roku', meaning: '육 (6)', category: 'numbers', level: 1 },
  { word: 'なな', reading: '나나', romaji: 'nana', meaning: '칠 (7)', category: 'numbers', level: 1 },
  { word: 'はち', reading: '하치', romaji: 'hachi', meaning: '팔 (8)', category: 'numbers', level: 1 },
  { word: 'きゅう', reading: '큐-', romaji: 'kyuu', meaning: '구 (9)', category: 'numbers', level: 2 },
  { word: 'じゅう', reading: '쥬-', romaji: 'juu', meaning: '십 (10)', category: 'numbers', level: 2 },
  { word: 'ひゃく', reading: '햐쿠', romaji: 'hyaku', meaning: '백 (100)', category: 'numbers', level: 3 },
  { word: 'せん', reading: '센', romaji: 'sen', meaning: '천 (1000)', category: 'numbers', level: 2 },

  // 3. 일상 사물 & 장소 (Daily & Places)
  { word: 'ほん', reading: '혼', romaji: 'hon', meaning: '책', category: 'daily', level: 1 },
  { word: 'かさ', reading: '카사', romaji: 'kasa', meaning: '우산', category: 'daily', level: 1 },
  { word: 'くつ', reading: '쿠츠', romaji: 'kutsu', meaning: '신발', category: 'daily', level: 1 },
  { word: 'くるま', reading: '쿠루마', romaji: 'kuruma', meaning: '자동차', category: 'daily', level: 1 },
  { word: 'えき', reading: '에키', romaji: 'eki', meaning: '역 (기차역)', category: 'daily', level: 1 },
  { word: 'いえ', reading: '이에', romaji: 'ie', meaning: '집', category: 'daily', level: 1 },
  { word: 'へや', reading: '헤야', romaji: 'heya', meaning: '방', category: 'daily', level: 1 },
  { word: 'つくえ', reading: '츠쿠에', romaji: 'tsukue', meaning: '책상', category: 'daily', level: 1 },
  { word: 'いす', reading: '이스', romaji: 'isu', meaning: '의자', category: 'daily', level: 1 },
  { word: 'とけい', reading: '토케이', romaji: 'tokei', meaning: '시계', category: 'daily', level: 1 },
  { word: 'でんしゃ', reading: '덴샤', romaji: 'densha', meaning: '전철', category: 'daily', level: 3 },
  { word: 'ひこうき', reading: '히코-키', romaji: 'hikouki', meaning: '비행기', category: 'daily', level: 2 },
  { word: 'がっこう', reading: '갓코-', romaji: 'gakkou', meaning: '학교', category: 'daily', level: 2 },
  { word: 'びょういん', reading: '뵤-인', romaji: 'byouin', meaning: '병원', category: 'daily', level: 3 },
  { word: 'ぎんこう', reading: '긴코-', romaji: 'ginkou', meaning: '은행', category: 'daily', level: 2 },

  // 4. 음식 & 음료 (Food & Drink)
  { word: 'みず', reading: '미즈', romaji: 'mizu', meaning: '물', category: 'food', level: 2 },
  { word: 'おちゃ', reading: '오차', romaji: 'ocha', meaning: '차 (녹차)', category: 'food', level: 3 },
  { word: 'ごはん', reading: '고한', romaji: 'gohan', meaning: '밥 / 식사', category: 'food', level: 2 },
  { word: 'すし', reading: '스시', romaji: 'sushi', meaning: '초밥', category: 'food', level: 1 },
  { word: 'にく', reading: '니쿠', romaji: 'niku', meaning: '고기', category: 'food', level: 1 },
  { word: 'さかな', reading: '사카나', romaji: 'sakana', meaning: '생선', category: 'food', level: 1 },
  { word: 'たまご', reading: '타마고', romaji: 'tamago', meaning: '달걀', category: 'food', level: 1 },
  { word: 'りんご', reading: '린고', romaji: 'ringo', meaning: '사과', category: 'food', level: 2 },
  { word: 'みかん', reading: '미칸', romaji: 'mikan', meaning: '귤', category: 'food', level: 1 },
  { word: 'らーめん', reading: '라-멘', romaji: 'raamen', meaning: '라면', category: 'food', level: 2 },
  { word: 'ぎゅうにゅう', reading: '규-뉴-', romaji: 'gyuunyuu', meaning: '우유', category: 'food', level: 3 },
  { word: 'やさい', reading: '야사이', romaji: 'yasai', meaning: '야채/채소', category: 'food', level: 1 },

  // 5. 동물 & 자연 (Animals & Nature)
  { word: 'いぬ', reading: '이누', romaji: 'inu', meaning: '개 (강아지)', category: 'nature', level: 1 },
  { word: 'ねこ', reading: '네코', romaji: 'neko', meaning: '고양이', category: 'nature', level: 1 },
  { word: 'とり', reading: '토리', romaji: 'tori', meaning: '새', category: 'nature', level: 1 },
  { word: 'さる', reading: '사루', romaji: 'saru', meaning: '원숭이', category: 'nature', level: 1 },
  { word: 'くま', reading: '쿠마', romaji: 'kuma', meaning: '곰', category: 'nature', level: 1 },
  { word: 'うさぎ', reading: '우사기', romaji: 'usagi', meaning: '토끼', category: 'nature', level: 2 },
  { word: 'ぞう', reading: '조-', romaji: 'zou', meaning: '코끼리', category: 'nature', level: 2 },
  { word: 'やま', reading: '야마', romaji: 'yama', meaning: '산', category: 'nature', level: 1 },
  { word: 'うみ', reading: '우미', romaji: 'umi', meaning: '바다', category: 'nature', level: 1 },
  { word: 'そら', reading: '소라', romaji: 'sora', meaning: '하늘', category: 'nature', level: 1 },
  { word: 'あめ', reading: '아메', romaji: 'ame', meaning: '비 / 사탕', category: 'nature', level: 1 },
  { word: 'ゆき', reading: '유키', romaji: 'yuki', meaning: '눈(Snow)', category: 'nature', level: 1 },
  { word: 'さくら', reading: '사쿠라', romaji: 'sakura', meaning: '벚꽃', category: 'nature', level: 1 },
  { word: 'はな', reading: '하나', romaji: 'hana', meaning: '꽃', category: 'nature', level: 1 },
  { word: 'つき', reading: '츠키', romaji: 'tsuki', meaning: '달(Moon)', category: 'nature', level: 1 },

  // 6. 사람 & 신체 (People & Body)
  { word: 'ひと', reading: '히토', romaji: 'hito', meaning: '사람', category: 'people', level: 1 },
  { word: 'わたし', reading: '와타시', romaji: 'watashi', meaning: '나 / 저', category: 'people', level: 1 },
  { word: 'ともだち', reading: '토모다치', romaji: 'tomodachi', meaning: '친구', category: 'people', level: 1 },
  { word: 'せんせい', reading: '센세-', romaji: 'sensei', meaning: '선생님', category: 'people', level: 1 },
  { word: 'おんなのひと', reading: '온나노히토', romaji: 'onnanohito', meaning: '여자', category: 'people', level: 2 },
  { word: 'おとこのひと', reading: '오토코노히토', romaji: 'otokonohito', meaning: '남자', category: 'people', level: 2 },
  { word: 'め', reading: '메', romaji: 'me', meaning: '눈(Eye)', category: 'people', level: 1 },
  { word: 'みみ', reading: '미미', romaji: 'mimi', meaning: '귀', category: 'people', level: 1 },
  { word: 'くち', reading: '쿠치', romaji: 'kuchi', meaning: '입', category: 'people', level: 1 },
  { word: 'て', reading: '테', romaji: 'te', meaning: '손', category: 'people', level: 1 },
  { word: 'あし', reading: '아시', romaji: 'ashi', meaning: '발 / 다리', category: 'people', level: 1 },
  { word: 'あたま', reading: '아타마', romaji: 'atama', meaning: '머리', category: 'people', level: 1 }
];
