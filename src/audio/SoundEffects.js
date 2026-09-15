// ============================================================
// SoundEffects.js — Retro 8-bit Web Audio synthesizer
// ============================================================

export class SoundEffects {
  constructor() {
    this.enabled = true;
    this.ctx = null;
  }

  _initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  /** Button tap / UI click */
  playClick() {
    if (!this.enabled) return;
    this._initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      osc.type = 'square';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.04);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.05);
    } catch (e) {
      // Audio context might be restricted before first gesture
    }
  }

  /** Car successfully assigned & parked (+$$$) */
  playCoin() {
    if (!this.enabled) return;
    this._initCtx();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, t); // B5
      osc.frequency.setValueAtTime(1318.51, t + 0.08); // E6

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.28);
    } catch (e) {}
  }

  /** Refueling in progress / pump sound */
  playRefuel() {
    if (!this.enabled) return;
    this._initCtx();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      [0, 0.07, 0.14].forEach((delay, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const noteTime = t + delay;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320 + idx * 90, noteTime);
        osc.frequency.exponentialRampToValueAtTime(560 + idx * 90, noteTime + 0.06);

        gain.gain.setValueAtTime(0.13, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.06);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.06);
      });
    } catch (e) {}
  }

  /** Car wash water spray / swoosh sound */
  playWash() {
    if (!this.enabled) return;
    this._initCtx();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      [0, 0.09, 0.18].forEach((delay, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const noteTime = t + delay;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600 + idx * 120, noteTime);
        osc.frequency.exponentialRampToValueAtTime(300 + idx * 80, noteTime + 0.08);

        gain.gain.setValueAtTime(0.14, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.08);
      });
    } catch (e) {}
  }

  /** Color match combo bonus sound */
  playCombo(multiplier = 2) {
    if (!this.enabled) return;
    this._initCtx();
    if (!this.ctx) return;

    try {
      // Ascending celebratory arpeggio scaled by multiplier
      const baseFreq = 523.25 * (1 + (multiplier - 2) * 0.15); // C5 base, higher on higher combos
      const freqs = [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 2.0]; // Major chord arpeggio
      const t = this.ctx.currentTime;

      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const noteTime = t + idx * 0.055;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.18, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.12);
      });
    } catch (e) {}
  }

  /** Car loses patience and honks / drives away */
  playHorn() {
    if (!this.enabled) return;
    this._initCtx();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(190, t);
      osc.frequency.linearRampToValueAtTime(170, t + 0.2);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.25);
    } catch (e) {}
  }

  /** Level complete fanfare */
  playWin() {
    if (!this.enabled) return;
    this._initCtx();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const t = this.ctx.currentTime + idx * 0.1;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.16);
      });
    } catch (e) {}
  }

  /** Disappointed sound when color combo is broken */
  playDisappointed() {
    if (!this.enabled) return;
    this._initCtx();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;

      // First sad drop
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(260, t);
      osc1.frequency.linearRampToValueAtTime(200, t + 0.16);
      gain1.gain.setValueAtTime(0.14, t);
      gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(t);
      osc1.stop(t + 0.18);

      // Second deeper sad drop ("wah-wah")
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(190, t + 0.18);
      osc2.frequency.linearRampToValueAtTime(130, t + 0.4);
      gain2.gain.setValueAtTime(0.15, t + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.42);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(t + 0.18);
      osc2.stop(t + 0.42);
    } catch (e) {}
  }

  /** Building/purchasing a new bay sound */
  playBuild() {
    if (!this.enabled) return;
    this._initCtx();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;

      // Dual hammer/chime tones
      const freqs = [659.25, 987.77, 1318.51];
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const noteTime = t + idx * 0.05;

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.12, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.1);
      });
    } catch (e) {}
  }
}
