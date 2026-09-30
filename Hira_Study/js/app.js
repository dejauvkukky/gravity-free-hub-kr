/**
 * Hiragana Master - Main Application Logic
 */

class HiraganaApp {
  constructor() {
    this.currentTab = 'chart';
    this.chartFilter = 'seion';
    
    // 로컬 스토리지 데이터
    try {
      this.learned = new Set(JSON.parse(localStorage.getItem('hira_learned') || '[]'));
      this.starred = new Set(JSON.parse(localStorage.getItem('hira_starred') || '[]'));
    } catch (e) {
      this.learned = new Set();
      this.starred = new Set();
    }
    
    // 플래시카드 상태
    this.flashcards = [];
    this.fcIndex = 0;
    this.fcIsFlipped = false;
    this.fcMode = 'char-first'; // 'char-first' | 'sound-first'
    this.fcFilter = 'all';

    // 퀴즈 상태
    this.quizQuestions = [];
    this.quizIndex = 0;
    this.quizScore = 0;
    this.quizType = 'charToRomaji'; // 'charToRomaji' | 'audioToChar' | 'wordToMeaning'
    this.quizTotal = 10;

    // 매칭 게임 상태
    this.matchTiles = [];
    this.firstSelectedTile = null;
    this.matchedPairsCount = 0;
    this.matchTimer = null;
    this.matchSeconds = 0;

    // 캔버스 상태
    this.isDrawing = false;
    this.canvasChar = 'あ';

    this.initElements();
    this.bindEvents();
    this.loadTheme();
    this.renderCurrentView();
  }

  initElements() {
    // 탭 버튼들
    this.tabButtons = document.querySelectorAll('.tab-btn');
    this.viewSections = document.querySelectorAll('.view-section');

    // 테마 & 사운드 토글
    this.themeToggleBtn = document.getElementById('themeToggleBtn');
    this.soundToggleBtn = document.getElementById('soundToggleBtn');

    // 50음도표 컨테이너
    this.chartContainer = document.getElementById('chartGrid');
    this.chartFilterBtns = document.querySelectorAll('.chart-filter-btn');

    // 플래시카드 요소들
    this.flashcardInner = document.getElementById('flashcardInner');
    this.fcProgressText = document.getElementById('fcProgressText');
    this.fcFilterSelect = document.getElementById('fcFilterSelect');
    this.fcModeSelect = document.getElementById('fcModeSelect');

    // 퀴즈 요소들
    this.quizCard = document.getElementById('quizCard');
    this.quizResultBox = document.getElementById('quizResultBox');
    this.quizProgressFill = document.getElementById('quizProgressFill');
    this.quizPrompt = document.getElementById('quizPrompt');
    this.quizTarget = document.getElementById('quizTarget');
    this.quizAudioBtn = document.getElementById('quizAudioBtn');
    this.quizOptions = document.getElementById('quizOptions');
    this.quizFeedback = document.getElementById('quizFeedback');

    // 매칭 게임 요소들
    this.matchGrid = document.getElementById('matchGrid');
    this.matchTimerDisplay = document.getElementById('matchTimerDisplay');

    // 단어 학습 요소들
    this.wordGrid = document.getElementById('wordCardsGrid');
    this.wordCategorySelect = document.getElementById('wordCategorySelect');

    // 캔버스 요소들
    this.drawCanvas = document.getElementById('drawCanvas');
    if (this.drawCanvas) {
      this.ctx = this.drawCanvas.getContext('2d');
    }
    this.canvasGuideChar = document.getElementById('canvasGuideChar');
    this.canvasCharSelect = document.getElementById('canvasCharSelect');

    // 모달 요소들
    this.detailModal = document.getElementById('detailModal');
    this.modalChar = document.getElementById('modalChar');
    this.modalRomaji = document.getElementById('modalRomaji');
    this.modalHangul = document.getElementById('modalHangul');
    this.modalTip = document.getElementById('modalTip');
    this.modalExample = document.getElementById('modalExample');
    this.modalSoundBtn = document.getElementById('modalSoundBtn');
    this.modalLearnBtn = document.getElementById('modalLearnBtn');
  }

  bindEvents() {
    // 탭 전환
    this.tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });

    // 다크 모드 토글
    if (this.themeToggleBtn) {
      this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
    }

    // 사운드 토글
    if (this.soundToggleBtn) {
      this.soundToggleBtn.addEventListener('click', () => {
        audioManager.soundEnabled = !audioManager.soundEnabled;
        this.soundToggleBtn.innerHTML = audioManager.soundEnabled ? '🔊' : '🔇';
      });
    }

    // 50음도표 필터
    this.chartFilterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.chartFilterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.chartFilter = btn.dataset.filter;
        this.renderChart();
      });
    });

    // 플래시카드 이벤트
    const fcContainer = document.getElementById('flashcardContainer');
    if (fcContainer) {
      fcContainer.addEventListener('click', () => this.flipFlashcard());
    }

    document.getElementById('fcPrevBtn')?.addEventListener('click', () => this.prevFlashcard());
    document.getElementById('fcNextBtn')?.addEventListener('click', () => this.nextFlashcard());
    document.getElementById('fcKnowBtn')?.addEventListener('click', () => this.markFlashcard(true));
    document.getElementById('fcUnsureBtn')?.addEventListener('click', () => this.markFlashcard(false));
    document.getElementById('fcSpeakBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const current = this.flashcards[this.fcIndex];
      if (current) audioManager.speak(current.char);
    });

    if (this.fcFilterSelect) {
      this.fcFilterSelect.addEventListener('change', (e) => {
        this.fcFilter = e.target.value;
        this.initFlashcards();
      });
    }

    if (this.fcModeSelect) {
      this.fcModeSelect.addEventListener('change', (e) => {
        this.fcMode = e.target.value;
        this.renderFlashcard();
      });
    }

    document.getElementById('fcShuffleBtn')?.addEventListener('click', () => {
      this.flashcards.sort(() => Math.random() - 0.5);
      this.fcIndex = 0;
      this.renderFlashcard();
    });

    // 퀴즈 이벤트
    document.getElementById('quizTypeSelect')?.addEventListener('change', (e) => {
      this.quizType = e.target.value;
      this.startQuiz();
    });
    document.getElementById('quizRestartBtn')?.addEventListener('click', () => this.startQuiz());
    document.getElementById('quizResultRestartBtn')?.addEventListener('click', () => this.startQuiz());
    this.quizAudioBtn?.addEventListener('click', () => {
      const q = this.quizQuestions[this.quizIndex];
      if (q) audioManager.speak(q.target.char || q.target.word);
    });

    // 매칭 게임 이벤트
    document.getElementById('matchRestartBtn')?.addEventListener('click', () => this.startMatchGame());

    // 단어 카테고리 필터
    if (this.wordCategorySelect) {
      this.wordCategorySelect.addEventListener('change', () => this.renderWords());
    }

    // 캔버스 이벤트
    this.initCanvasEvents();

    // 모달 닫기
    document.getElementById('modalCloseBtn')?.addEventListener('click', () => {
      this.detailModal?.classList.remove('active');
    });
    this.detailModal?.addEventListener('click', (e) => {
      if (e.target === this.detailModal) this.detailModal.classList.remove('active');
    });
  }

  switchTab(tab) {
    this.currentTab = tab;
    this.tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    this.viewSections.forEach(sec => {
      sec.classList.toggle('active', sec.id === `view-${tab}`);
    });

    this.renderCurrentView();
  }

  renderCurrentView() {
    switch (this.currentTab) {
      case 'chart':
        this.renderChart();
        break;
      case 'flashcard':
        this.initFlashcards();
        break;
      case 'quiz':
        this.startQuiz();
        break;
      case 'match':
        this.startMatchGame();
        break;
      case 'words':
        this.renderWords();
        break;
      case 'canvas':
        this.initCanvasSelector();
        this.clearCanvas();
        break;
    }
  }

  /* ==========================================================================
     1. 50음도표 (Interactive Chart)
     ========================================================================== */
  renderChart() {
    if (!this.chartContainer) return;
    this.chartContainer.innerHTML = '';

    let data = [];
    if (this.chartFilter === 'seion') data = SEION_DATA;
    else if (this.chartFilter === 'dakuon') data = DAKUON_DATA;
    else if (this.chartFilter === 'yoon') data = YOON_DATA;

    // 50음도 청음 격자 렌더링
    if (this.chartFilter === 'seion') {
      const rows = ['a', 'ka', 'sa', 'ta', 'na', 'ha', 'ma', 'ya', 'ra', 'wa'];
      const vowels = ['a', 'i', 'u', 'e', 'o'];

      rows.forEach(rowKey => {
        vowels.forEach(vowel => {
          let item = null;
          if (rowKey === 'ya') {
            if (vowel === 'a') item = data.find(d => d.char === 'や');
            else if (vowel === 'u') item = data.find(d => d.char === 'ゆ');
            else if (vowel === 'o') item = data.find(d => d.char === 'よ');
          } else if (rowKey === 'wa') {
            if (vowel === 'a') item = data.find(d => d.char === 'わ');
            else if (vowel === 'o') item = data.find(d => d.char === 'を');
            else if (vowel === 'u') item = data.find(d => d.char === 'ん');
          } else {
            item = data.find(d => d.row === rowKey && (d.romaji.endsWith(vowel) || (rowKey==='ta' && vowel==='i' && d.char==='ち') || (rowKey==='ta' && vowel==='u' && d.char==='つ') || (rowKey==='sa' && vowel==='i' && d.char==='し') || (rowKey==='ha' && vowel==='u' && d.char==='ふ')));
          }

          const card = document.createElement('div');
          if (!item) {
            card.className = 'kana-card empty';
          } else {
            const isLearned = this.learned.has(item.char);
            card.className = `kana-card ${isLearned ? 'learned' : ''}`;
            card.innerHTML = `
              <span class="sound-badge">🔊</span>
              <div class="kana-char">${item.char}</div>
              <div class="kana-romaji">${item.romaji}</div>
              <div class="kana-hangul">${item.kana}</div>
            `;
            card.addEventListener('click', () => {
              audioManager.speak(item.char);
              this.openModal(item);
            });
          }
          this.chartContainer.appendChild(card);
        });
      });
    } else {
      // 탁음 / 요음 그리드 렌더링
      data.forEach(item => {
        const isLearned = this.learned.has(item.char);
        const card = document.createElement('div');
        card.className = `kana-card ${isLearned ? 'learned' : ''}`;
        card.innerHTML = `
          <span class="sound-badge">🔊</span>
          <div class="kana-char">${item.char}</div>
          <div class="kana-romaji">${item.romaji}</div>
          <div class="kana-hangul">${item.kana}</div>
        `;
        card.addEventListener('click', () => {
          audioManager.speak(item.char);
          this.openModal(item);
        });
        this.chartContainer.appendChild(card);
      });
    }
  }

  openModal(item) {
    if (!this.detailModal) return;
    this.modalChar.textContent = item.char;
    this.modalRomaji.textContent = item.romaji;
    this.modalHangul.textContent = `[${item.kana}]`;
    this.modalTip.textContent = item.tip || '모양과 발음을 반복해서 소리내어 읽어보세요.';
    
    if (item.example) {
      this.modalExample.innerHTML = `<strong>대표 단어:</strong> ${item.example.word} (${item.example.romaji}) - ${item.example.meaning}`;
    } else {
      this.modalExample.textContent = '';
    }

    const isLearned = this.learned.has(item.char);
    this.modalLearnBtn.textContent = isLearned ? '✓ 외움 완료 취소' : '✓ 외웠어요!';
    this.modalLearnBtn.className = isLearned ? 'btn btn-secondary' : 'btn btn-success';

    this.modalSoundBtn.onclick = () => audioManager.speak(item.char);
    this.modalLearnBtn.onclick = () => {
      if (this.learned.has(item.char)) {
        this.learned.delete(item.char);
      } else {
        this.learned.add(item.char);
        audioManager.playSfx('correct');
      }
      this.saveStorage();
      this.renderChart();
      this.openModal(item);
    };

    this.detailModal.classList.add('active');
  }

  /* ==========================================================================
     2. 플래시카드 (Flashcards)
     ========================================================================== */
  initFlashcards() {
    let source = [];
    if (this.fcFilter === 'all') source = [...SEION_DATA, ...DAKUON_DATA];
    else if (this.fcFilter === 'seion') source = [...SEION_DATA];
    else if (this.fcFilter === 'dakuon') source = [...DAKUON_DATA];
    else if (this.fcFilter === 'yoon') source = [...YOON_DATA];
    else if (this.fcFilter === 'unlearned') {
      source = [...SEION_DATA, ...DAKUON_DATA].filter(item => !this.learned.has(item.char));
      if (source.length === 0) source = [...SEION_DATA];
    }

    this.flashcards = [...source];
    this.fcIndex = 0;
    this.fcIsFlipped = false;
    this.renderFlashcard();
  }

  renderFlashcard() {
    if (!this.flashcardInner || this.flashcards.length === 0) return;
    const item = this.flashcards[this.fcIndex];
    if (!item) return;

    this.flashcardInner.classList.remove('flipped');
    this.fcIsFlipped = false;

    const frontEl = this.flashcardInner.querySelector('.card-front');
    const backEl = this.flashcardInner.querySelector('.card-back');

    if (!frontEl || !backEl) return;

    if (this.fcMode === 'char-first') {
      frontEl.innerHTML = `
        <div class="card-big-char">${item.char}</div>
        <p style="color: var(--text-muted); font-size: 0.9rem;">(카드를 클릭하면 발음 확인)</p>
      `;
      backEl.innerHTML = `
        <div class="card-romaji">${item.romaji}</div>
        <div class="card-hangul">${item.kana}</div>
        <div class="card-tip">${item.tip || '모양을 연상해보세요'}</div>
        ${item.example ? `<div class="card-example"><strong>${item.example.word}</strong> (${item.example.meaning})</div>` : ''}
      `;
    } else {
      frontEl.innerHTML = `
        <div class="card-romaji">${item.romaji}</div>
        <div class="card-hangul">[${item.kana}]</div>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.5rem;">(소리를 떠올리고 카드를 클릭해 글자 확인)</p>
      `;
      backEl.innerHTML = `
        <div class="card-big-char">${item.char}</div>
        <div class="card-tip">${item.tip || '정확한 글자 형태를 확인하세요'}</div>
        ${item.example ? `<div class="card-example"><strong>${item.example.word}</strong> (${item.example.meaning})</div>` : ''}
      `;
    }

    if (this.fcProgressText) {
      this.fcProgressText.textContent = `${this.fcIndex + 1} / ${this.flashcards.length}`;
    }
  }

  flipFlashcard() {
    if (!this.flashcardInner) return;
    this.fcIsFlipped = !this.fcIsFlipped;
    this.flashcardInner.classList.toggle('flipped', this.fcIsFlipped);
    audioManager.playSfx('flip');
    const item = this.flashcards[this.fcIndex];
    if (item && this.fcIsFlipped) {
      audioManager.speak(item.char);
    }
  }

  nextFlashcard() {
    if (this.fcIndex < this.flashcards.length - 1) {
      this.fcIndex++;
      this.renderFlashcard();
    }
  }

  prevFlashcard() {
    if (this.fcIndex > 0) {
      this.fcIndex--;
      this.renderFlashcard();
    }
  }

  markFlashcard(known) {
    const item = this.flashcards[this.fcIndex];
    if (!item) return;

    if (known) {
      this.learned.add(item.char);
      audioManager.playSfx('correct');
    } else {
      this.learned.delete(item.char);
      audioManager.playSfx('wrong');
    }
    this.saveStorage();
    this.nextFlashcard();
  }

  /* ==========================================================================
     3. 퀴즈 & 테스트 모드 (Quiz)
     ========================================================================== */
  startQuiz() {
    if (!this.quizCard || !this.quizResultBox) return;
    this.quizIndex = 0;
    this.quizScore = 0;
    this.quizResultBox.style.display = 'none';
    this.quizCard.style.display = 'block';

    const pool = this.quizType === 'wordToMeaning' ? [...VOCABULARY_DATA] : [...SEION_DATA, ...DAKUON_DATA];
    const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
    const questions = shuffledPool.slice(0, this.quizTotal);

    this.quizQuestions = questions.map(item => {
      const options = [item];
      while (options.length < 4 && options.length < pool.length) {
        const randomItem = pool[Math.floor(Math.random() * pool.length)];
        if (!options.some(o => (o.char || o.word) === (randomItem.char || randomItem.word))) {
          options.push(randomItem);
        }
      }
      options.sort(() => Math.random() - 0.5);

      return {
        target: item,
        options: options
      };
    });

    this.renderQuizQuestion();
  }

  renderQuizQuestion() {
    if (!this.quizProgressFill || !this.quizOptions) return;
    if (this.quizIndex >= this.quizQuestions.length) {
      this.showQuizResult();
      return;
    }

    const currentQ = this.quizQuestions[this.quizIndex];
    const target = currentQ.target;

    this.quizProgressFill.style.width = `${((this.quizIndex) / this.quizTotal) * 100}%`;
    this.quizFeedback.textContent = '';
    this.quizOptions.innerHTML = '';

    if (this.quizType === 'charToRomaji') {
      this.quizPrompt.textContent = '다음 히라가나의 올바른 발음을 고르세요';
      this.quizTarget.style.display = 'block';
      this.quizTarget.textContent = target.char;
      this.quizAudioBtn.style.display = 'none';

      currentQ.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option-btn';
        btn.textContent = `${opt.romaji} (${opt.kana})`;
        btn.addEventListener('click', () => this.handleQuizAnswer(btn, opt.char === target.char, target));
        this.quizOptions.appendChild(btn);
      });
    } else if (this.quizType === 'audioToChar') {
      this.quizPrompt.textContent = '소리를 듣고 알맞은 히라가나 글자를 고르세요';
      this.quizTarget.style.display = 'none';
      this.quizAudioBtn.style.display = 'flex';
      audioManager.speak(target.char);

      currentQ.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option-btn';
        btn.textContent = opt.char;
        btn.addEventListener('click', () => this.handleQuizAnswer(btn, opt.char === target.char, target));
        this.quizOptions.appendChild(btn);
      });
    } else if (this.quizType === 'wordToMeaning') {
      this.quizPrompt.textContent = '다음 단어의 뜻을 고르세요';
      this.quizTarget.style.display = 'block';
      this.quizTarget.textContent = target.word;
      this.quizAudioBtn.style.display = 'none';
      audioManager.speak(target.word);

      currentQ.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option-btn';
        btn.textContent = opt.meaning;
        btn.addEventListener('click', () => this.handleQuizAnswer(btn, opt.word === target.word, target));
        this.quizOptions.appendChild(btn);
      });
    }
  }

  handleQuizAnswer(clickedBtn, isCorrect, target) {
    const allBtns = this.quizOptions.querySelectorAll('.quiz-option-btn');
    allBtns.forEach(b => b.disabled = true);

    if (isCorrect) {
      clickedBtn.classList.add('correct');
      this.quizFeedback.textContent = '🎉 정답입니다!';
      this.quizFeedback.style.color = 'var(--success)';
      audioManager.playSfx('correct');
      this.quizScore++;
      if (target.char) this.learned.add(target.char);
    } else {
      clickedBtn.classList.add('wrong');
      this.quizFeedback.textContent = `❌ 오답! 정답은 [${target.romaji || target.meaning || target.char}] 입니다.`;
      this.quizFeedback.style.color = 'var(--danger)';
      audioManager.playSfx('wrong');
      allBtns.forEach(b => {
        if (b.textContent.includes(target.romaji) || b.textContent === target.char || b.textContent === target.meaning) {
          b.classList.add('correct');
        }
      });
    }

    this.saveStorage();

    setTimeout(() => {
      this.quizIndex++;
      this.renderQuizQuestion();
    }, 1200);
  }

  showQuizResult() {
    this.quizCard.style.display = 'none';
    this.quizResultBox.style.display = 'block';
    audioManager.playSfx('complete');

    const scoreEl = document.getElementById('quizFinalScore');
    const msgEl = document.getElementById('quizResultMessage');
    if (scoreEl) scoreEl.textContent = `${this.quizScore} / ${this.quizTotal}`;
    
    const percentage = (this.quizScore / this.quizTotal) * 100;
    let msg = '';
    if (percentage === 100) msg = '🌟 완벽해요! 히라가나 마스터입니다!';
    else if (percentage >= 80) msg = '👏 대단해요! 실력이 많이 늘었습니다.';
    else if (percentage >= 50) msg = '💪 잘하고 있어요! 플래시카드로 조금 더 복습해볼까요?';
    else msg = '💡 50음도표를 차근차근 다시 복습해보세요!';

    if (msgEl) msgEl.textContent = msg;
  }

  /* ==========================================================================
     4. 스피드 카드 짝 맞추기 (Memory Match Game)
     ========================================================================== */
  startMatchGame() {
    if (!this.matchGrid) return;
    this.matchGrid.innerHTML = '';
    this.firstSelectedTile = null;
    this.matchedPairsCount = 0;
    this.matchSeconds = 0;

    clearInterval(this.matchTimer);
    this.matchTimer = setInterval(() => {
      this.matchSeconds++;
      if (this.matchTimerDisplay) {
        this.matchTimerDisplay.textContent = `${this.matchSeconds}초`;
      }
    }, 1000);

    const sample = [...SEION_DATA].sort(() => Math.random() - 0.5).slice(0, 6);
    const tiles = [];

    sample.forEach((item, idx) => {
      tiles.push({ id: idx, type: 'char', value: item.char, matchKey: item.romaji });
      tiles.push({ id: idx, type: 'romaji', value: `${item.romaji}`, matchKey: item.romaji });
    });

    tiles.sort(() => Math.random() - 0.5);
    this.matchTiles = tiles;

    tiles.forEach(t => {
      const el = document.createElement('div');
      el.className = 'match-tile';
      el.textContent = t.value;
      el.addEventListener('click', () => this.handleTileClick(el, t));
      this.matchGrid.appendChild(el);
    });
  }

  handleTileClick(el, tileData) {
    if (el.classList.contains('matched') || el.classList.contains('selected')) return;

    if (tileData.type === 'char') {
      audioManager.speak(tileData.value);
    }

    if (!this.firstSelectedTile) {
      el.classList.add('selected');
      this.firstSelectedTile = { el, data: tileData };
    } else {
      const first = this.firstSelectedTile;
      if (first.data.id === tileData.id && first.data.type !== tileData.type) {
        el.classList.add('matched');
        first.el.classList.remove('selected');
        first.el.classList.add('matched');
        audioManager.playSfx('correct');
        this.firstSelectedTile = null;
        this.matchedPairsCount++;

        if (this.matchedPairsCount === 6) {
          clearInterval(this.matchTimer);
          audioManager.playSfx('complete');
          setTimeout(() => {
            alert(`🎉 축하합니다! ${this.matchSeconds}초 만에 모두 맞추셨습니다!`);
          }, 300);
        }
      } else {
        el.classList.add('selected');
        audioManager.playSfx('wrong');
        setTimeout(() => {
          el.classList.remove('selected');
          first.el.classList.remove('selected');
          this.firstSelectedTile = null;
        }, 500);
      }
    }
  }

  /* ==========================================================================
     5. 단어 읽기 훈련 (Word Practice)
     ========================================================================== */
  renderWords() {
    if (!this.wordGrid) return;
    this.wordGrid.innerHTML = '';
    const cat = this.wordCategorySelect ? this.wordCategorySelect.value : 'all';

    let words = VOCABULARY_DATA;
    if (cat !== 'all') {
      words = words.filter(w => w.category === cat);
    }

    words.forEach(item => {
      const card = document.createElement('div');
      card.className = 'word-card';
      card.innerHTML = `
        <div class="word-header">
          <div class="word-jp">${item.word}</div>
          <button class="word-sound-btn" title="발음 듣기">🔊</button>
        </div>
        <div class="word-reading">${item.reading} [${item.romaji}]</div>
        <div class="word-meaning">${item.meaning}</div>
      `;

      card.addEventListener('click', () => {
        audioManager.speak(item.word);
      });

      this.wordGrid.appendChild(card);
    });
  }

  /* ==========================================================================
     6. 따라쓰기 연습 캔버스 (Canvas Stroke Practice)
     ========================================================================== */
  initCanvasSelector() {
    if (!this.canvasCharSelect) return;
    this.canvasCharSelect.innerHTML = '';

    SEION_DATA.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.char;
      opt.textContent = `${item.char} (${item.romaji})`;
      this.canvasCharSelect.appendChild(opt);
    });

    this.canvasCharSelect.value = this.canvasChar;
    this.canvasCharSelect.onchange = (e) => {
      this.canvasChar = e.target.value;
      if (this.canvasGuideChar) this.canvasGuideChar.textContent = this.canvasChar;
      this.clearCanvas();
      audioManager.speak(this.canvasChar);
    };
  }

  initCanvasEvents() {
    if (!this.drawCanvas) return;
    const canvas = this.drawCanvas;
    const ctx = this.ctx;

    canvas.width = 300;
    canvas.height = 300;

    const startDraw = (e) => {
      this.isDrawing = true;
      const pos = this.getCanvasPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.strokeStyle = '#e11d48';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };

    const draw = (e) => {
      if (!this.isDrawing) return;
      e.preventDefault();
      const pos = this.getCanvasPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    };

    const stopDraw = () => {
      this.isDrawing = false;
    };

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('mouseleave', stopDraw);

    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDraw);

    document.getElementById('canvasClearBtn')?.addEventListener('click', () => this.clearCanvas());
    document.getElementById('canvasSpeakBtn')?.addEventListener('click', () => audioManager.speak(this.canvasChar));
  }

  getCanvasPos(e) {
    const rect = this.drawCanvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (this.drawCanvas.width / rect.width),
      y: (clientY - rect.top) * (this.drawCanvas.height / rect.height)
    };
  }

  clearCanvas() {
    if (this.ctx && this.drawCanvas) {
      this.ctx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
    }
  }

  /* ==========================================================================
     테마 및 저장소 유틸
     ========================================================================== */
  saveStorage() {
    try {
      localStorage.setItem('hira_learned', JSON.stringify([...this.learned]));
      localStorage.setItem('hira_starred', JSON.stringify([...this.starred]));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }

  toggleTheme() {
    const isDark = document.body.dataset.theme === 'dark';
    document.body.dataset.theme = isDark ? 'light' : 'dark';
    try {
      localStorage.setItem('hira_theme', document.body.dataset.theme);
    } catch(e) {}
    if (this.themeToggleBtn) {
      this.themeToggleBtn.innerHTML = isDark ? '🌙' : '☀️';
    }
  }

  loadTheme() {
    try {
      const savedTheme = localStorage.getItem('hira_theme') || 'light';
      document.body.dataset.theme = savedTheme;
      if (this.themeToggleBtn) {
        this.themeToggleBtn.innerHTML = savedTheme === 'dark' ? '☀️' : '🌙';
      }
    } catch (e) {
      document.body.dataset.theme = 'light';
    }
  }
}

// DOM 로드 완료 후 안전하게 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.app = new HiraganaApp();
  });
} else {
  window.app = new HiraganaApp();
}
