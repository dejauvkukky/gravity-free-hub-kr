# Secret Garden - CODEX

이 문서는 프로젝트 개발 및 유지보수를 위한 핵심 가이드라인과 트러블슈팅 매뉴얼입니다.

## 1. 프로젝트 개요
**Secret Garden**은 가족의 화합과 재미를 위한 웹 애플리케이션입니다.
- **주요 기능**: MBTI 성격 유형 검사 및 궁합 분석, 가족 바이오리듬 및 운세 확인
- **기술 스택**: HTML5, CSS3, JavaScript (Vanilla), Firebase (Auth/Firestore), Chart.js
- **저장소**: [https://github.com/dejauvkukky/gravity-free-hub-kr](https://github.com/dejauvkukky/gravity-free-hub-kr)

---

## 2. 개발 환경 설정 및 한글 이슈 해결
Windows 환경(PowerShell)에서 개발 시 한글 인코딩 문제가 발생할 수 있습니다.

### 📝 한글 깨짐 방지 가이드
1. **HTML 파일 인코딩**
   - 모든 HTML 파일의 `<head>` 태그 내에 반드시 다음을 포함해야 합니다.
   ```html
   <meta charset="UTF-8">
   ```
   - 에디터(VS Code 등)에서 파일 저장 시 **UTF-8 (without BOM)** 형식을 사용하세요.

2. **PowerShell 인코딩 설정**
   - 터미널에서 한글 출력이 깨질 경우, 다음 명령어를 실행하여 세션 인코딩을 변경합니다.
   ```powershell
   $OutputEncoding = [Console]::InputEncoding = [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding
   ```
   - 또는 간단하게 `chcp 65001`을 입력합니다.

---

## 3. Git & 배포 가이드

### 🚀 Git 트러블슈팅
**Q. `error: failed to push some refs to ...` 오류가 발생해요.**
- **원인**: 원격 저장소(GitHub)에 로컬보다 최신 커밋이 존재할 때 발생합니다. (누군가 먼저 push했거나, GitHub 웹에서 수정했을 때)
- **해결**:
  ```bash
  git pull --rebase
  # 충돌(Conflict) 발생 시 파일 수정 후 git add . -> git rebase --continue
  git push
  ```

**Q. 파일이 잠겨서 수정/삭제가 안 돼요.**
- 로컬 서버(Live Server 등)가 파일을 점유 중일 수 있습니다. 서버를 잠시 끄거나 프로세스를 종료 후 다시 시도하세요.

### 📦 배포 시 버전 관리 (Cache Busting)
브라우저는 성능 최적화를 위해 CSS나 JS 파일을 캐시(저장)해둡니다. 코드를 수정해서 배포해도 사용자의 브라우저에는 이전 버전이 남아있어 변경 사항이 즉시 반영되지 않을 수 있습니다.

이를 해결하기 위해 **쿼리 스트링으로 버전을 명시**합니다.

**적용 방법:**
배포 전, 수정된 CSS/JS 파일을 로드하는 모든 HTML 파일(`index.html`, `dashboard.html` 등)을 열어 `v=` 값을 올려줍니다.

```html
<!-- 변경 전 (v=6) -->
<link rel="stylesheet" href="style.css?v=6">
<script src="script.js?v=6"></script>

<!-- 변경 후 (v=7) -->
<link rel="stylesheet" href="style.css?v=7">
<script src="script.js?v=7"></script>
```

> **Note**: 주요 수정이 있을 때마다 모든 파일의 버전을 +1 하여 통일하는 것이 관리에 용이합니다.

---

## 4. 파일 및 폴더 구조
```
root/
├── public/                 # 웹 페이지 정적 파일
│   ├── dashboard.html      # 메인 대시보드
│   ├── login.html          # 로그인 페이지
│   ├── mbti/               # MBTI 기능
│   │   └── index.html
│   └── fortune/            # 운세/바이오리듬 기능
│       └── index.html
├── src/                    # JavaScript 로직
│   ├── firebase.js         # Firebase 초기화
│   ├── auth.js             # 인증 관련 로직
│   ├── users.js            # 가족 생년월일 데이터
│   └── mbti_data.js        # MBTI 질문 및 결과 데이터
└── assets/
    └── css/                # 스타일시트
        └── style.css
```
