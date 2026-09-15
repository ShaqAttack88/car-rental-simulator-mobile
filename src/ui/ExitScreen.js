// ============================================================
// ExitScreen.js — Exit / Goodbye screen
// ============================================================

import { GameState } from '../engine/Game.js';

export class ExitScreen {
  /** @param {import('../engine/Game').Game} game */
  constructor(game) {
    this.game = game;
    this.returnBtn = { x: 30, y: 210, w: 120, h: 22 };
  }

  update(dt) {
    const input = this.game.input;
    if (input.justPressed) {
      const px = input.pos.x;
      const py = input.pos.y;
      const b = this.returnBtn;
      if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) {
        if (this.game.sound) this.game.sound.playClick();
        this.game.setState(GameState.MAIN_MENU);
      }
    }
  }

  render(ctx) {
    const W = 180, H = 320;

    // Dark backdrop
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, W, H);

    // Dialog card
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(16, 70, 148, 175);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(16, 70, 148, 175);

    ctx.font = '7px "Press Start 2P"';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText('CAR RENTAL', W / 2, 98);
    ctx.fillText('SIMULATOR', W / 2, 112);

    ctx.font = '5px "Press Start 2P"';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('THANKS FOR', W / 2, 140);
    ctx.fillText('PLAYING!', W / 2, 154);

    ctx.font = '4px "Press Start 2P"';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('You can safely close', W / 2, 176);
    ctx.fillText('this browser tab.', W / 2, 187);

    // Return button
    const b = this.returnBtn;
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = '#38bdf8';
    ctx.strokeRect(b.x, b.y, b.w, b.h);

    ctx.font = '5px "Press Start 2P"';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('◀ MAIN MENU', b.x + b.w / 2, b.y + 14);
  }
}
