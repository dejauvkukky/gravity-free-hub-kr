# Secret Garden - Antigravity 개발 가이드

> 이 문서는 Secret Garden 프로젝트의 개발 업무 지시 및 작업 일관성 유지를 위한 표준 가이드입니다.  
> 새로운 대화창에서 작업을 이어갈 때도 이 가이드를 참조하여 반복적인 지시를 줄이고, 프로젝트의 일관성을 유지하시기 바랍니다.

---

## 📋 목차

1. [핵심 개발 원칙](#핵심-개발-원칙)
2. [프로젝트 이해하기](#프로젝트-이해하기)
3. [작업 프로세스](#작업-프로세스)
4. [코드 작성 규칙](#코드-작성-규칙)
5. [Git 워크플로우](#git-워크플로우)
6. [문서화 규칙](#문서화-규칙)
7. [체크리스트](#체크리스트)

---

## 🎯 핵심 개발 원칙

### 1️⃣ 한글 우선 정책

**모든 사용자 대면 문서는 한글로 작성합니다.**

다음 항목들은 **반드시 한글**로 제공해야 합니다:

- ✅ 일반 대화 및 답변
- ✅ 개발 관련 작업 계획서 (Implementation Plan)
- ✅ 실행 과정 설명 (Task Summary, Task Status)
- ✅ 완료 보고서 (Walkthrough)
- ✅ 사용자 검토용 모든 문서 및 메시지

**예외 사항:**
- 소스 코드 내 변수명, 함수명, 주석 (영어 사용 가능)
- Git 커밋 메시지 (영어 또는 한글)
- 기술 문서 링크 및 URL

---

### 2️⃣ CODEX.md 필수 확인

**작업 시작 전 반드시 `CODEX.md`를 확인하세요.**

#### CODEX.md의 역할
- 프로젝트 개요, 기술 스택, 주요 기능 설명
- 파일 구조 및 디렉토리 구성
- 배포 가이드 (버전 관리, 캐시 버스팅)
- UI/UX 구현 규칙 (커스텀 모달, 알림 등)
- 개발 환경 설정 (인코딩, Git 설정 등)
- 현재 개발 현황 및 향후 계획

#### 확인 방법
```bash
# CODEX.md 파일 확인
cat CODEX.md  # 또는 에디터로 열기
```

#### 주요 확인 사항
1. **현재 버전 정보** (`?v=` 캐시 버스팅 값)
2. **기술 스택** (Firebase, Vanilla JS 등)
3. **파일 구조** (작업할 파일 위치 파악)
4. **UI/UX 규칙** (커스텀 모달 사용 등)

---

### 3️⃣ GitHub 푸시 필수

**작업 완료 후 반드시 GitHub에 푸시하세요.**

#### 기본 푸시 절차
```bash
# 1. 변경 사항 스테이징
git add .

# 2. 커밋 (의미 있는 메시지 작성)
git commit -m "feat: 새로운 기능 추가"

# 3. 원격 저장소에 푸시
git push
```

#### 푸시 전 체크리스트
- [ ] 변경된 파일 확인 (`git status`)
- [ ] 캐시 버스팅 버전 업데이트 (`?v=...`)
- [ ] 로컬 테스트 완료
- [ ] 커밋 메시지 작성 완료

---

### 4️⃣ CODEX.md 업데이트

**주요 변경점이나 중요 이슈 발생 시 CODEX.md를 업데이트하세요.**

#### 업데이트가 필요한 경우

##### 즉시 업데이트 필수 🔴
- 새로운 기능 추가 또는 기존 기능 제거
- 파일 구조 변경 (새 디렉토리 추가, 파일 이동 등)
- 배포 프로세스 변경 (버전 관리 방식 수정 등)
- 기술 스택 변경 (라이브러리 추가/제거, 프레임워크 변경 등)
- 새로운 개발 규칙 추가

##### 업데이트 권장 🟡
- 중요한 버그 수정 및 해결 방법
- 성능 최적화 팁
- 자주 발생하는 트러블슈팅 사례

##### 업데이트 불필요 ⚪
- 단순 텍스트 수정
- 스타일 미세 조정
- 버그 수정 (구조적 변경 없음)

#### 업데이트 예시

```markdown
## 2. 주요 기능

| 기능 | 설명 |
|------|------|
| 🎮 새로운 게임 | 퍼즐 게임 추가 (2025-12-17) |

---

## 6. 개발 환경 설정

### 새로운 라이브러리 설치
```bash
npm install new-library
```

#### 업데이트 형식
- **날짜 표기**: 주요 변경 시 날짜 추가 (YYYY-MM-DD)
- **섹션 구분**: 관련 섹션에 추가 또는 새 섹션 생성
- **명확한 설명**: 무엇이, 왜, 어떻게 변경되었는지 설명

---

## 🔍 프로젝트 이해하기

### 프로젝트 정보

- **프로젝트명**: Secret Garden
- **저장소**: [https://github.com/dejauvkukky/gravity-free-hub-kr](https://github.com/dejauvkukky/gravity-free-hub-kr)
- **배포**: GitHub Pages
- **목적**: 가족 구성원들을 위한 웹 기반 통합 서비스 플랫폼

### 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Firebase Authentication, Firebase Firestore
- **Fonts**: Google Fonts (Jua, Noto Sans KR)
- **Version Control**: Git

### 주요 기능

| 기능 | 설명 | 경로 |
|------|------|------|
| 🍀 오늘의 운세 | 서양 12궁 + 동양 12지 통합 운세 | `public/fortune/` |
| 📅 가족 일정 | 가족 구성원별 일정 관리 | `public/calendar/` |
| 🧩 Secret MBTI | MBTI 자가진단 및 비교 | `public/mbti/` |
| 🎵 Sound Garden | YouTube 음악 공유 | `public/sound-garden/` |
| 🏗️ 아빠를 이겨라 | 스택 쌓기 게임 | `public/games/beat-dad/` |
| 🎒 챙겨줘요 | 위시리스트 & 준비물 메모 | `public/wishlist/` |
| 🏆 시크릿 월드컵 | 이상형 월드컵 | `public/worldcup/` |

#### 🚀 독립 실행 서브 플랫폼 & 웹소설 (INDEPENDENT APPS & FICTION)
메인 대시보드 하단에 별도의 시각적 선명한 섹션(`INDEPENDENT APPS & FICTION`)으로 구분하여 연결된 독립 실행 웹 애플리케이션 및 콘텐츠입니다:

| 기능 | 설명 | 경로 |
|------|------|------|
| 📆 인생 달력 | 주 단위로 나의 삶을 기록 및 시각화하는 캘린더 웹 앱 | `Life_Calendar/index.html` |
| ⏱️ 뽀모도로 타이머 | 집중과 휴식을 돕는 냥이 뽀모도로 타이머 웹 앱 | `P_Timer/index.html` |
| 📖 웹소설 #1 (나에겐 너) | 프리미엄 웹소설 작품 #1 | `web_fiction/ToMe_ItsU.html` |
| 🏛️ 웹소설 #2 (경계의 기록자) | 판타지 아키비스트 웹소설 작품 #2 | `web_fiction/Archivist.html` |

---

## 🛠️ 작업 프로세스

### 신규 기능 개발

```
1. 요구사항 분석
   ↓
2. CODEX.md 확인 (프로젝트 구조, 규칙 파악)
   ↓
3. 작업 계획 수립 (Implementation Plan 작성)
   ↓
4. 코드 구현
   ↓
5. 로컬 테스트
   ↓
6. 캐시 버스팅 버전 업데이트
   ↓
7. Git 커밋 & 푸시
   ↓
8. CODEX.md 업데이트 (필요 시)
   ↓
9. Walkthrough 작성 (완료 보고)
```

### 버그 수정

```
1. 문제 재현 및 원인 파악
   ↓
2. CODEX.md 확인 (관련 규칙 검토)
   ↓
3. 수정 계획 수립
   ↓
4. 코드 수정
   ↓
5. 테스트 (버그 재발 방지 확인)
   ↓
6. 캐시 버스팅 버전 업데이트
   ↓
7. Git 커밋 & 푸시
   ↓
8. CODEX.md 업데이트 (중요한 버그인 경우)
```

### UI/UX 개선

```
1. 개선 사항 확인
   ↓
2. CODEX.md 확인 (UI/UX 구현 규칙)
   ↓
3. 디자인 시안 (필요 시)
   ↓
4. CSS/JS 수정
   ↓
5. 브라우저 테스트 (캐시 클리어 후)
   ↓
6. 캐시 버스팅 버전 업데이트 (중요!)
   ↓
7. Git 커밋 & 푸시
```

---

## 📝 코드 작성 규칙

### 1. 파일 인코딩

**모든 파일은 UTF-8 (without BOM) 형식으로 저장하세요.**

```html
<!-- HTML 파일의 필수 메타 태그 -->
<meta charset="UTF-8">
```

### 2. 캐시 버스팅 (Cache Busting)

**CSS/JS 파일 수정 시 반드시 버전을 업데이트하세요.**

#### 현재 버전 확인
`CODEX.md`에서 최신 버전 확인: `v=202512161721` 형식

#### 버전 업데이트 방법
```html
<!-- 변경 전 -->
<link rel="stylesheet" href="../assets/css/style.css?v=202512161721">
<script src="../src/auth.js?v=202512161721"></script>

<!-- 변경 후 (YYYYMMDDHHmm 형식 권장) -->
<link rel="stylesheet" href="../assets/css/style.css?v=202512171000">
<script src="../src/auth.js?v=202512171000"></script>
```

#### 버전 업데이트 팁
- 시간 기반 버전 사용 시 배포 시점의 날짜와 시간 사용
- 여러 파일을 동시에 수정했다면 동일한 버전 번호 사용
- `CODEX.md`에 최신 버전 기록

### 3. UI/UX 구현 규칙

#### 커스텀 모달 사용 필수

**브라우저 기본 `alert`, `confirm` 사용 금지**

❌ **사용 금지:**
```javascript
alert('메시지');
confirm('확인하시겠습니까?');
```

✅ **올바른 사용:**
```javascript
import { customAlert, customConfirm } from '../src/ui-utils.js?v=...';

await customAlert('메시지');
const result = await customConfirm('확인하시겠습니까?');
```

#### 이유
- 브라우저 기본 API는 상단에 `github.io` 등 출처 표시 → 미관 저해
- 커스텀 모달은 통일된 디자인 제공

### 4. 반응형 디자인

- 모바일 우선 (Mobile First) 접근
- 미디어 쿼리 활용
- 표준 너비: 600px (데스크톱 중심 레이아웃)

### 5. 코드 스타일

```javascript
// 함수명: camelCase
function getUserData() { }

// 상수: UPPER_SNAKE_CASE
const API_KEY = 'xxx';

// 클래스명: PascalCase
class UserProfile { }

// 주석: 한글 또는 영어
// 사용자 데이터를 가져옵니다
// Fetches user data
```

---

## 🚀 Git 워크플로우

### 기본 명령어

```bash
# 1. 변경 사항 확인
git status

# 2. 변경 파일 스테이징
git add .

# 3. 커밋
git commit -m "커밋 메시지"

# 4. 푸시
git push
```

### 커밋 메시지 규칙

**형식**: `<타입>: <설명>`

#### 타입 분류
- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `style`: UI/UX 스타일 변경
- `refactor`: 코드 리팩토링
- `docs`: 문서 수정
- `chore`: 기타 작업 (빌드, 설정 등)

#### 예시
```bash
git commit -m "feat: 위시리스트 D-Day 기능 추가"
git commit -m "fix: 로그인 페이지 한글 깨짐 수정"
git commit -m "style: 대시보드 헤더 색상 변경"
git commit -m "docs: CODEX.md 버전 정보 업데이트"
```

### 트러블슈팅

#### 푸시 실패 오류
```bash
# 오류: error: failed to push some refs to ...

# 해결 방법
git pull --rebase
# 충돌 시: 파일 수정 후
git add .
git rebase --continue
git push
```

#### 파일 잠김 오류
- Live Server 등 로컬 서버 종료 후 재시도
- VSCode 또는 에디터 재시작

---

## 📚 문서화 규칙

### 작업 계획서 (Implementation Plan)

**작성 시기**: 신규 기능 개발 시작 전

**포함 내용**:
- 목표 설명
- 사용자 검토 필요 사항
- 변경 예정 파일 목록
- 검증 계획

**형식**:
```markdown
# [기능명] 구현 계획

## 목표
...

## 주요 변경 사항
- `파일명`: 변경 내용

## 검증 방법
- 테스트 항목 1
- 테스트 항목 2
```

### 완료 보고서 (Walkthrough)

**작성 시기**: 작업 완료 후

**포함 내용**:
- 수행한 작업 요약
- 테스트 결과
- 스크린샷 (UI 변경 시)

**형식**:
```markdown
# [기능명] 완료 보고

## 구현 내용
- 항목 1
- 항목 2

## 테스트 결과
- ✅ 테스트 1: 통과
- ✅ 테스트 2: 통과

## 스크린샷
![설명](경로)
```

---

## ✅ 체크리스트

### 작업 시작 전
- [ ] `CODEX.md` 확인 완료
- [ ] 작업 범위 명확히 파악
- [ ] 필요한 파일 위치 확인
- [ ] Git 상태 확인 (`git status`)

### 코드 작성 중
- [ ] 파일 인코딩 UTF-8 확인
- [ ] 커스텀 모달 사용 (alert/confirm 금지)
- [ ] 코드 스타일 준수
- [ ] 주석 작성 (복잡한 로직)

### 작업 완료 전
- [ ] 로컬 테스트 완료
- [ ] 캐시 버스팅 버전 업데이트
- [ ] Git add/commit 완료
- [ ] Git push 완료

### 작업 완료 후
- [ ] CODEX.md 업데이트 (필요 시)
- [ ] Walkthrough 작성
- [ ] 배포 확인 (GitHub Pages)

---

## 🔗 참고 링크

- **프로젝트 저장소**: [https://github.com/dejauvkukky/gravity-free-hub-kr](https://github.com/dejauvkukky/gravity-free-hub-kr)
- **CODEX.md**: [CODEX.md](./CODEX.md)
- **Firebase Console**: Firebase 프로젝트 관리

---

## 📞 문의 및 지원

이 가이드는 **Secret Garden** 프로젝트의 일관된 개발 및 유지보수를 위해 작성되었습니다.  
새로운 대화창에서 작업을 이어갈 때도 이 문서를 참조하여 효율적으로 작업하시기 바랍니다.

**Crafted by kukky**  
**Last Updated**: 2026-08-27
