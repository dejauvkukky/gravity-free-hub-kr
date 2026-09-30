/**
 * 오디오 제어 모듈 (Web Speech API 일본어 TTS + Web Audio API 사운드 효과)
 */

class AudioManager {
  constructor() {
    this.synth = window.speechSynthesis;
    this.japaneseVoice = null;
    this.playbackRate = 0.85; // 히라가나 초보자에게 알맞은 약간 여유로운 속도
    this.soundEnabled = true;
    this.audioCtx = null;

    this.initVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => this.initVoices();
    }
  }

  // 일본어 보이스 검색 및 설정
  initVoices() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    // 일본어 전용 보이스 우선 검색 (Kyoko, Otoya, Google 日本語 등)
    this.japaneseVoice = voices.find(v => v.lang === 'ja-JP' || v.lang.startsWith('ja')) || null;
  }

  // 오디오 컨텍스트 초기화 (브라우저 정책상 사용자 상호작용 후 생성)
  getAudioContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // 일본어 단어 / 낱자 발음 읽어주기 (TTS)
  speak(text, rate = this.playbackRate) {
    if (!this.synth) return;
    
    // 현재 재생 중인 발음 정지
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = rate;
    utterance.pitch = 1.0;

    if (this.japaneseVoice) {
      utterance.voice = this.japaneseVoice;
    }

    this.synth.speak(utterance);
  }

  // 효과음 생성 (Web Audio API Synthesizer)
  playSfx(type) {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'correct') {
      // 정답 효과음 (맑고 경쾌한 2화음)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'wrong') {
      // 오답 효과음 (낮은 비프음)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now); // A3
      osc.frequency.setValueAtTime(180, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'flip') {
      // 카드 뒤집기 소리 (부드러운 클릭)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.06);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'complete') {
      // 학습 완료/팡파레 효과음
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.12, now + idx * 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.3);
        o.start(now + idx * 0.1);
        o.stop(now + idx * 0.1 + 0.3);
      });
    }
  }
}

// 전역 오디오 싱글톤
const audioManager = new AudioManager();
