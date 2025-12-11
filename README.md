# 가족 Fun Service - 1차 개발 완료

## 프로젝트 개요
가족 구성원들을 위한 웹 기반 통합 서비스 플랫폼

## 주요 기능

### 1. 인증 시스템
- 간편 닉네임 기반 로그인
- Session Storage 활용
- Firebase Authentication 연동

### 2. 대시보드
- 반응형 카드 기반 UI
- 각 서비스로의 간편한 접근

### 3. 오늘의 운세 🍀
- 서양 12궁 + 동양 12지 통합 운세
- 전문가 톤의 3단계 구조화된 운세 메시지
- 럭키 아이템 및 조언
- 포춘쿠키 스크래치 이벤트

### 4. 가족 일정 📅
- 가족 구성원별 일정 등록
- Firebase Firestore 연동
- 월별 일정 관리

### 5. Secret MBTI 🧩
- MBTI 자가진단 테스트
- 결과 저장 및 가족 구성원 비교
- Firebase 데이터 연동

### 6. Sound Garden 🎵
- YouTube 음악 공유 플랫폼
- Featured 영상 관리
- 댓글 및 이모지 반응 기능
- Firebase 실시간 동기화

### 7. 아빠를 이겨라 🏗️
- 스택 쌓기 미니게임
- 아빠 AI와 경쟁
- 주간 랭킹 시스템
- Firebase 기록 저장

## 기술 스택

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- 반응형 웹 디자인
- Google Fonts (Jua, Noto Sans KR)

### Backend & Database
- Firebase Authentication
- Firebase Firestore
- Session Storage

### 배포
- GitHub Pages 호환 구조

## 파일 구조
```
public/
├── index.html          # 랜딩 페이지
├── login.html          # 로그인 페이지
├── dashboard.html      # 메인 대시보드
├── calendar/           # 가족 일정
├── fortune/            # 오늘의 운세
├── mbti/              # MBTI 테스트
├── sound-garden/      # 음악 공유
└── games/
    └── beat-dad/      # 스택 쌓기 게임

src/
├── auth.js            # 인증 로직
├── firebase.js        # Firebase 설정
├── fortune_engine.js  # 운세 생성 엔진
└── users.js           # 사용자 데이터
```

## 개발 완료 사항
- ✅ 기본 인증 시스템
- ✅ 반응형 대시보드
- ✅ 운세 엔진 고도화 (3.0)
- ✅ 가족 일정 관리
- ✅ MBTI 테스트
- ✅ Sound Garden 음악 플랫폼
- ✅ Beat Dad 미니게임

## 향후 개발 예정
- [ ] 취향 분석기
- [ ] 추가 미니게임
- [ ] 모바일 앱 통합

## 라이선스
Private - Family Use Only

---
**Crafted by kukky**
