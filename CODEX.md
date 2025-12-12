# Secret Garden - CODEX

이 문서는 프로젝트 개발, 유지보수, 배포를 위한 핵심 가이드라인입니다.

---

## 1. 프로젝트 개요

**Secret Garden**은 가족 구성원들을 위한 웹 기반 통합 서비스 플랫폼입니다.

- **저장소**: [https://github.com/dejauvkukky/gravity-free-hub-kr](https://github.com/dejauvkukky/gravity-free-hub-kr)
- **배포**: GitHub Pages

### 기술 스택
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Firebase Authentication, Firebase Firestore
- **Fonts**: Google Fonts (Jua, Noto Sans KR)

---

## 2. 주요 기능

| 기능 | 설명 |
|------|------|
| 🍀 오늘의 운세 | 서양 12궁 + 동양 12지 통합 운세, 포춘쿠키 스크래치 |
| 📅 가족 일정 | 가족 구성원별 일정 등록, 월별 관리 |
| 🧩 Secret MBTI | MBTI 자가진단, 가족 구성원 비교 |
| 🎵 Sound Garden | YouTube 음악 공유, 댓글 및 이모지 반응 |
| 🏗️ 아빠를 이겨라 | 스택 쌓기 게임, 아빠 AI 경쟁, 주간 랭킹 |
| 📢 공지사항 | 팝업 공지, kukky 전용 관리 기능 |

---

## 3. 파일 구조

```
root/
├── public/                 # 웹 페이지 정적 파일
│   ├── index.html          # 랜딩 페이지
│   ├── login.html          # 로그인 페이지
│   ├── dashboard.html      # 메인 대시보드
│   ├── calendar/           # 가족 일정
│   ├── fortune/            # 오늘의 운세
│   ├── mbti/               # MBTI 테스트
│   ├── sound-garden/       # 음악 공유

│   └── games/
│       ├── beat-dad/       # 스택 쌓기 게임
│       └── beat-dad-2048/  # 2048 퍼즐 게임 (New)
├── src/                    # JavaScript 로직
│   ├── firebase.js         # Firebase 초기화
│   ├── auth.js             # 인증 관련 로직
│   ├── users.js            # 가족 생년월일 데이터
│   ├── fortune_engine.js   # 운세 생성 엔진
│   └── mbti_data.js        # MBTI 질문/결과 데이터
└── assets/
    └── css/                # 스타일시트
        └── style.css
```

---

## 4. 배포 가이드

### 📦 버전 관리 (Cache Busting) - 중요!

> 브라우저는 CSS/JS 파일을 캐시합니다. 수정 후에도 변경이 반영되지 않을 수 있습니다.

**🔖 현재 버전: v=202512121630** (YYYYMMDDHHmm 형식 사용 권장)

**배포 전 필수 작업:**

1. 수정된 CSS/JS 파일을 로드하는 HTML 파일을 열어 `?v=` 값을 **현재 시간(년월일시분)**으로 변경합니다.
   - 예: `style.css?v=202512121000`
   - 이렇게 하면 매번 이전 버전을 확인할 필요 없이 항상 최신 버전이 적용됩니다.


```html
<!-- 변경 전 -->
<link rel="stylesheet" href="style.css?v=6">
<script src="script.js?v=6"></script>

<!-- 변경 후 -->
<link rel="stylesheet" href="style.css?v=7">
<script src="script.js?v=7"></script>
```

2. 주요 파일별 현재 버전 확인:
   - `assets/css/style.css` → login.html, dashboard.html 등에서 확인
   - `src/auth.js`, `src/firebase.js` 등 → 각 HTML에서 확인

3. **주요 수정 시 모든 파일의 버전을 통일**하는 것이 관리에 용이합니다.

---

## 5. Git 가이드

### 기본 배포 명령어
```bash
git add .
git commit -m "커밋 메시지"
git push
```

### 🚀 트러블슈팅

**Q. `error: failed to push some refs to ...` 오류**
```bash
git pull --rebase
# 충돌 시: 파일 수정 후 git add . → git rebase --continue
git push
```

**Q. 파일이 잠겨서 수정/삭제 안 됨**
- Live Server 등 로컬 서버가 파일을 점유 중일 수 있음 → 서버 종료 후 재시도

---

## 6. 개발 환경 설정

### 한글 깨짐 방지

1. **HTML 파일 인코딩**
   ```html
   <meta charset="UTF-8">
   ```
   - 파일 저장 시 **UTF-8 (without BOM)** 형식 사용

2. **PowerShell 인코딩 설정**
   ```powershell
   $OutputEncoding = [Console]::InputEncoding = [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding
   ```
   또는 `chcp 65001`

---


## 8. UI/UX 구현 규칙

### 🔔 팝업 메시지 (Alert/Confirm)
- **브라우저 기본 API(`alert`, `confirm`) 사용 금지**
  - 이유: 상단에 `github.io` 등의 출처 텍스트가 강제 표시되어 미관을 해침.
- **Custom Modal 사용 필수 (`src/ui-utils.js`)**
  - **사용법**: `import { customAlert, customConfirm } from '../src/ui-utils.js?v=...'`
  - **기능**: Promise 기반 비동기 처리 (`await customConfirm(...)`).
  - **디자인**: "Secret Garden 내용 :" 제목의 통일된 모달 자동 주입.

---

## 7. 개발 현황

### ✅ 완료
- 기본 인증 시스템
- 반응형 대시보드
- 운세 엔진 고도화 (3.0)
- 가족 일정 관리
- MBTI 테스트
- Sound Garden 음악 플랫폼
- Beat Dad 미니게임
- 공지사항 팝업 시스템

### 📋 향후 예정
- [ ] 취향 분석기
- [ ] 추가 미니게임
- [ ] 모바일 앱 통합

---

## 라이선스
Private - Family Use Only

---
**Crafted by kukky**
