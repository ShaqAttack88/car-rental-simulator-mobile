// ============================================================
// OptionsMenu.js — Settings & gameplay help screen
// ============================================================

import { GameState } from '../engine/Game.js';

export class OptionsMenu {
  /** @param {import('../engine/Game').Game} game */
  constructor(game) {
    this.game = game;

    this.backBtn = { x: 10, y: 12, w: 50, h: 16 };
    this.soundToggleBtn = { x: 20, y: 64, w: 140, h: 22 };
    this.resetBtn = { x: 20, y: 260, w: 140, h: 20 };

    this.resetConfirmMessage = null;
  }

  update(dt) {
    const input = this.game.input;
    if (input.justPressed) {
      const px = input.pos.x;
      const py = input.pos.y;

      // Back button
      if (px >= this.backBtn.x && px <= this.backBtn.x + this.backBtn.w &&
          py >= this.backBtn.y && py <= this.backBtn.y + this.backBtn.h) {
        if (this.game.sound) this.game.sound.playClick();
        this.game.setState(GameState.MAIN_MENU);
        return;
      }

      // Sound toggle
      const s = this.soundToggleBtn;
      if (px >= s.x && px <= s.x + s.w && py >= s.y && py <= s.y + s.h) {
        if (this.game.sound) {
          this.game.sound.toggle();
          this.game.sound.playClick();
        }
        return;
      }

      // Reset progress
      const r = this.resetBtn;
      if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) {
        if (this.game.levelSelect) {
          this.game.levelSelect.resetProgress();
        }
        this.resetConfirmMessage = 'Progress Reset!';
        setTimeout(() => { this.resetConfirmMessage = null; }, 2000);
        if (this.game.sound) this.game.sound.playClick();
        return;
      }
    }
  }

  render(ctx) {
    const W = 180, H = 320;

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    // Header bar
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, W, 36);
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 36, W, 1);

    // Back Button
    ctx.fillStyle = '#334155';
    ctx.fillRect(this.backBtn.x, this.backBtn.y, this.backBtn.w, this.backBtn.h);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.backBtn.x, this.backBtn.y, this.backBtn.w, this.backBtn.h);

    ctx.font = '5px "Press Start 2P"';
    ctx.fillStyle = '#e2e8f0';
    ctx.textAlign = 'center';
    ctx.fillText('◀ MENU', this.backBtn.x + this.backBtn.w / 2, this.backBtn.y + 11);

    // Title
    ctx.font = '6px "Press Start 2P"';
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'right';
    ctx.fillText('OPTIONS', 170, 23);

    // Sound FX Button
    const isSoundOn = this.game.sound ? this.game.sound.enabled : true;
    const s = this.soundToggleBtn;
    ctx.fillStyle = isSoundOn ? '#065f46' : '#334155';
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.strokeStyle = isSoundOn ? '#10b981' : '#64748b';
    ctx.lineWidth = 1;
    ctx.strokeRect(s.x, s.y, s.w, s.h);

    ctx.font = '5px "Press Start 2P"';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`SOUND FX: ${isSoundOn ? 'ON 🔊' : 'OFF 🔇'}`, s.x + s.w / 2, s.y + 14);

    // HOW TO PLAY Section
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(16, 96, 148, 148);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(16, 96, 148, 148);

    ctx.font = '5px "Press Start 2P"';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText('HOW TO PLAY', W / 2, 112);

    ctx.font = '4px "Press Start 2P"';
    ctx.fillStyle = '#cbd5e1';
    ctx.textAlign = 'left';

    const lines = [
      '• Cars arrive on road',
      '  and queue at booth.',
      '',
      '• Drag or tap a car,',
      '  then pick open bay.',
      '',
      '• Earn +$50 when parked.',
      '  Cars leave after timer.',
      '',
      '• Watch patience bar!',
      '  Angry cars honk & leave',
      '  with score penalty.',
    ];

    lines.forEach((line, idx) => {
      ctx.fillText(line, 22, 126 + idx * 9);
    });

    // Reset Progress Button
    const r = this.resetBtn;
    ctx.fillStyle = '#3f1515';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = '#ef4444';
    ctx.strokeRect(r.x, r.y, r.w, r.h);

    ctx.font = '5px "Press Start 2P"';
    ctx.fillStyle = '#fca5a5';
    ctx.textAlign = 'center';
    ctx.fillText(this.resetConfirmMessage || 'RESET ALL PROGRESS', r.x + r.w / 2, r.y + 13);
  }
}
