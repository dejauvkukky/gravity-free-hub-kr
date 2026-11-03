(function () {
  'use strict';

  const BB = (window.BB = window.BB || {});

  class SoundManager {
    constructor() {
      this.ctx = null;
      this.bgmEnabled = true;
      this.sfxEnabled = true;
      this.bgmTimer = null;
      this.bgmStep = 0;
      this.isPlayingBgm = false;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(function () {});
      }
    }

    toggleBgm() {
      this.init();
      this.bgmEnabled = !this.bgmEnabled;
      if (!this.bgmEnabled) {
        this.stopBgm();
      } else if (this.isPlayingBgm) {
        this.startBgm(true);
      }
      this.play('ui_click');
      return this.bgmEnabled;
    }

    toggleSfx() {
      this.init();
      this.sfxEnabled = !this.sfxEnabled;
      if (this.sfxEnabled) this.play('ui_click');
      return this.sfxEnabled;
    }

    startBgm(forceRestart) {
      this.isPlayingBgm = true;
      if (!this.bgmEnabled) return;
      this.init();
      if (!this.ctx) return;
      if (this.bgmTimer && !forceRestart) return;
      if (this.bgmTimer) clearInterval(this.bgmTimer);

      // 밝고 말랑말랑한 오르골/마림바풍 캐주얼 루프 멜로디
      const melody = [
        523.25, 659.25, 783.99, 659.25, 880.00, 783.99, 659.25, 587.33,
        523.25, 587.33, 659.25, 783.99, 698.46, 659.25, 587.33, 0,
        523.25, 659.25, 783.99, 1046.5, 880.00, 783.99, 659.25, 523.25,
        587.33, 698.46, 659.25, 587.33, 523.25, 0,      392.00, 0
      ];
      const bass = [
        261.63, 0, 196.00, 0, 220.00, 0, 196.00, 0,
        174.61, 0, 196.00, 0, 261.63, 0, 196.00, 0
      ];

      const self = this;
      this.bgmTimer = setInterval(function () {
        if (!self.bgmEnabled || !self.ctx || self.ctx.state !== 'running') return;
        const now = self.ctx.currentTime;
        const note = melody[self.bgmStep % melody.length];
        const bassNote = bass[self.bgmStep % bass.length];

        if (note > 0) {
          self._tone(note, 'sine', 0.032, 0.21, now, note * 1.002);
          self._tone(note * 2, 'triangle', 0.009, 0.09, now);
        }
        if (bassNote > 0) {
          self._tone(bassNote, 'triangle', 0.028, 0.24, now);
        }
        self.bgmStep++;
      }, 230);
    }

    stopBgm() {
      if (this.bgmTimer) {
        clearInterval(this.bgmTimer);
        this.bgmTimer = null;
      }
    }

    _tone(freq, type, vol, dur, startTime, endFreq) {
      if (!this.ctx) return;
      const t = startTime || this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t);
      if (endFreq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t + dur);
      }
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    }

    _noise(vol, dur, filterFreq) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * dur);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterFreq || 1100, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(t);
    }

    play(name) {
      if (!this.sfxEnabled) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      switch (name) {
        case 'ui_click':
          this._tone(660, 'sine', 0.08, 0.07, t, 880);
          break;
        case 'error':
          this._tone(210, 'sawtooth', 0.06, 0.14, t, 150);
          break;
        case 'place':
          // 말랑한 피규어를 매트 위에 톡 올려놓는 소리
          this._tone(340, 'sine', 0.12, 0.11, t, 620);
          this._tone(680, 'triangle', 0.06, 0.09, t + 0.05, 840);
          break;
        case 'shovel':
          this._noise(0.09, 0.12, 900);
          this._tone(420, 'triangle', 0.08, 0.12, t, 220);
          break;
        case 'dream_spawn':
          this._tone(784, 'sine', 0.06, 0.14, t, 1046);
          break;
        case 'dream_collect':
          this._tone(880, 'sine', 0.09, 0.11, t, 1174);
          this._tone(1318, 'sine', 0.08, 0.16, t + 0.06, 1568);
          break;
        case 'cookie_throw':
          this._tone(480, 'triangle', 0.06, 0.08, t, 310);
          break;
        case 'hit':
          this._tone(260, 'square', 0.045, 0.06, t, 140);
          this._noise(0.04, 0.045, 1400);
          break;
        case 'pan_swing':
          this._noise(0.08, 0.11, 1800);
          this._tone(520, 'triangle', 0.09, 0.13, t, 280);
          this._tone(920, 'sine', 0.05, 0.10, t + 0.03, 620);
          break;
        case 'laser':
          this._tone(980, 'sine', 0.08, 0.22, t, 460);
          this._tone(1420, 'triangle', 0.05, 0.18, t, 720);
          break;
        case 'fuse':
          this._tone(360, 'sine', 0.08, 0.85, t, 960);
          break;
        case 'explosion':
          this._noise(0.24, 0.42, 650);
          this._tone(150, 'sawtooth', 0.18, 0.36, t, 42);
          this._tone(520, 'sine', 0.09, 0.24, t + 0.03, 180);
          break;
        case 'enemy_shot':
          this._tone(580, 'sine', 0.05, 0.1, t, 410);
          break;
        case 'boss_skill':
          this._tone(660, 'triangle', 0.1, 0.22, t, 990);
          this._tone(990, 'sine', 0.09, 0.28, t + 0.12, 1320);
          break;
        case 'spring':
          // 통통! 스프링 발판 점프 효과음
          this._tone(240, 'sine', 0.13, 0.24, t, 880);
          this._tone(480, 'triangle', 0.07, 0.20, t + 0.04, 1120);
          break;
        case 'portal':
          // 차원 거울 워프 효과음
          this._tone(920, 'sine', 0.08, 0.18, t, 460);
          this._tone(620, 'triangle', 0.07, 0.22, t + 0.06, 1240);
          break;
        case 'gift_open':
          // 선물상자 개봉 팡파레
          this._tone(587.33, 'triangle', 0.11, 0.12, t);
          this._tone(880.0, 'triangle', 0.11, 0.14, t + 0.08);
          this._tone(1174.66, 'sine', 0.12, 0.26, t + 0.16);
          break;
        case 'music_box':
          // 태엽 별빛 오르골 전체 파동 멜로디
          [783.99, 987.77, 1174.66, 1567.98].forEach((n, idx) => {
            this._tone(n, 'sine', 0.10, 0.35, t + idx * 0.07);
          });
          break;
        case 'pop_die':
          this._tone(420, 'sine', 0.08, 0.11, t, 740);
          this._noise(0.05, 0.08, 1200);
          break;
        case 'life_lost':
          this._tone(440, 'sawtooth', 0.13, 0.22, t, 220);
          this._tone(280, 'sawtooth', 0.13, 0.34, t + 0.15, 130);
          break;
        case 'wave_start':
          this._tone(523.25, 'triangle', 0.1, 0.16, t);
          this._tone(659.25, 'triangle', 0.1, 0.16, t + 0.13);
          this._tone(783.99, 'triangle', 0.12, 0.28, t + 0.26);
          break;
        case 'victory':
          [523.25, 659.25, 783.99, 1046.5].forEach((n, idx) => {
            this._tone(n, 'triangle', 0.12, 0.25, t + idx * 0.13);
          });
          this._tone(1318.5, 'sine', 0.12, 0.55, t + 0.52);
          break;
        case 'gameover':
          [392.0, 349.23, 329.63, 261.63].forEach((n, idx) => {
            this._tone(n, 'triangle', 0.11, 0.28, t + idx * 0.18);
          });
          break;
      }
    }
  }

  BB.sound = new SoundManager();
})();

