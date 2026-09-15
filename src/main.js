// ============================================================
// main.js — Entry point: boot the game
// ============================================================

import { Game } from './engine/Game.js';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error('Canvas element #game-canvas not found');
    return;
  }

  const game = new Game();
  game.init(canvas);
});
