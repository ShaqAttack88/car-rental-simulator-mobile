// ============================================================
// MainMenu.js — Retro pixel-art title & main menu screen
// ============================================================

import { GameState } from '../engine/Game.js';

export class MainMenu {
  /** @param {import('../engine/Game').Game} game */
  constructor(game) {
    this.game = game;

    // Menu button bounds (game pixels in 180x320)
    this.buttons = [
      { id: 'start',   text: 'START GAME', x: 26, y: 175, w: 128, h: 22, bg: '#10b981', border: '#34d399', textCol: '#ffffff' },
      { id: 'options', text: 'OPTIONS',    x: 26, y: 207, w: 128, h: 20, bg: '#1e293b', border: '#475569', textCol: '#e2e8f0' },
      { id: 'exit',    text: 'EXIT GAME',  x: 26, y: 235, w: 128, h: 20, bg: '#1e293b', border: '#475569', textCol: '#94a3b8' },
    ];

    this.animTime = 0;
    this.decorCarX = -20;
  }

  update(dt) {
    this.animTime += dt;

    // Decorative car drives across screen periodically
    this.decorCarX += 35 * dt;
    if (this.decorCarX > 200) {
      this.decorCarX = -30;
    }

    const input = this.game.input;
    if (input.justPressed) {
      const px = input.pos.x;
      const py = input.pos.y;

      for (const btn of this.buttons) {
        if (px >= btn.x && px <= btn.x + btn.w && py >= btn.y && py <= btn.y + btn.h) {
          if (this.game.sound) this.game.sound.playClick();
          this._handleButton(btn.id);
          break;
        }
      }
    }
  }

  _handleButton(id) {
    switch (id) {
      case 'start':
        this.game.startLevel(1);
        break;
      case 'options':
        this.game.setState(GameState.OPTIONS);
        break;
      case 'exit':
        this.game.setState(GameState.EXIT_SCREEN);
        break;
    }
  }

  render(ctx) {
    const W = 180, H = 320;

    // 1. Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.4, '#1e1b4b');
    bgGrad.addColorStop(1, '#090d16');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Decorative road stripe at bottom
    ctx.fillStyle = '#2a2a3e';
    ctx.fillRect(0, 130, W, 22);
    ctx.fillStyle = '#fef08a';
    for (let x = 0; x < W; x += 12) {
      ctx.fillRect(x, 140, 6, 1);
    }

    // Decorative car on the stripe
    const carSprite = this.game.sprites.get('car_yellow') || this.game.sprites.get('car_red');
    if (carSprite) {
      ctx.save();
      ctx.translate(Math.floor(this.decorCarX) + 5, 141);
      ctx.rotate(Math.PI / 2); // facing right
      ctx.drawImage(carSprite, -5, -8);
      ctx.restore();
    }

    // 2. Title Box / Banner
    const bounce = Math.sin(this.animTime * 2.5) * 1.5;
    const titleY = 48 + bounce;

    // Outer glow / banner
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(16, titleY - 14, 148, 54);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    ctx.strokeRect(16, titleY - 14, 148, 54);

    // Pixel corner accents
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(14, titleY - 16, 4, 4);
    ctx.fillRect(162, titleY - 16, 4, 4);
    ctx.fillRect(14, titleY + 38, 4, 4);
    ctx.fillRect(162, titleY + 38, 4, 4);

    // Text: CAR RENTAL
    ctx.font = '9px "Press Start 2P"';
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'center';
    ctx.fillText('CAR RENTAL', W / 2, titleY + 6);

    // Text: SIMULATOR
    ctx.font = '8px "Press Start 2P"';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('SIMULATOR', W / 2, titleY + 24);

    // Subtitle
    ctx.font = '4px "Press Start 2P"';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('TIME MANAGEMENT ARCADE', W / 2, 114);

    // 3. Menu Buttons
    for (const btn of this.buttons) {
      this._renderButton(ctx, btn);
    }

    // 4. Footer
    ctx.font = '4px "Press Start 2P"';
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'center';
    ctx.fillText('TAP TO PLAY • IPHONE READY', W / 2, 305);
    ctx.textAlign = 'left';
  }

  _renderButton(ctx, btn) {
    // Drop shadow
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(btn.x, btn.y + 2, btn.w, btn.h);

    // Main button face
    ctx.fillStyle = btn.bg;
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);

    // Border
    ctx.strokeStyle = btn.border;
    ctx.lineWidth = 1;
    ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);

    // Text
    ctx.font = '6px "Press Start 2P"';
    ctx.fillStyle = btn.textCol;
    ctx.textAlign = 'center';
    ctx.fillText(btn.text, btn.x + btn.w / 2, btn.y + btn.h / 2 + 2);
  }
}
