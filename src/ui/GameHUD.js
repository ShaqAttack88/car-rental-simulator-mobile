// ============================================================
// GameHUD.js — Minimal pixel-art HUD overlay
// ============================================================

import { GameState } from '../engine/Game.js';

export class GameHUD {
  /** @param {import('../engine/Game').Game} game */
  constructor(game) {
    this.game = game;

    // Pause button hit area (game pixels)
    this.pauseBtn = { x: 162, y: 0, w: 18, h: 12 };
  }

  update(dt) {
    const input = this.game.input;

    // Check pause button tap
    if (input.justPressed) {
      const px = input.pos.x;
      const py = input.pos.y;
      const b = this.pauseBtn;
      if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) {
        this.game.togglePause();
      }
    }
  }

  render(ctx) {
    const level = this.game.level;
    if (!level || !level.config) return;

    const W = 180;

    // HUD background bar
    ctx.fillStyle = 'rgba(10, 12, 20, 0.8)';
    ctx.fillRect(0, 0, W, 12);

    // Bottom edge line
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 12, W, 1);

    ctx.font = '4px "Press Start 2P"';

    // 1. Money ($ for shop expansions)
    ctx.fillStyle = '#4ade80';
    ctx.textAlign = 'left';
    ctx.fillText(`$${level.score}`, 3, 8.5);

    // 2. Rentals (completed cars processed count)
    const rentals = level.rentals !== undefined ? level.rentals : (level.carsProcessed || 0);
    ctx.fillStyle = '#facc15';
    ctx.fillText(`R:${rentals}`, 36, 8.5);

    // 3. Reputation (quality score earned from speed & combos)
    const rep = level.reputation !== undefined ? level.reputation : 0;
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`REP:${rep}`, 68, 8.5);

    // Pause button
    const b = this.pauseBtn;
    ctx.fillStyle = this.game.state === GameState.PAUSED ? '#f59e0b' : '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText('||', b.x + b.w / 2, 8.5);

    ctx.textAlign = 'left';
  }
}
