// ============================================================
// LevelSelectScreen.js — Level selection with 4-tier difficulty selector
// ============================================================

import { GameState } from '../engine/Game.js';
import { DIFFICULTIES } from '../level/LevelConfig.js';

export class LevelSelectScreen {
  /** @param {import('../engine/Game').Game} game */
  constructor(game) {
    this.game = game;

    // Default difficulty is Level 2 (NORMAL / STANDARD)
    this.selectedDifficulty = 2;
    this.selectedLevel = 1;

    // Screen bounds (180x320)
    // 4 Difficulty Pills across the width of Level 1 card
    this.diffPills = [
      { id: 1, text: '1:EASY', x: 14,  y: 84, w: 36, h: 18 },
      { id: 2, text: '2:NORM', x: 53,  y: 84, w: 36, h: 18 },
      { id: 3, text: '3:HARD', x: 92,  y: 84, w: 36, h: 18 },
      { id: 4, text: '4:EPIC', x: 131, y: 84, w: 36, h: 18 },
    ];

    // Play button
    this.playBtn = { x: 20, y: 196, w: 140, h: 24 };

    // Back button
    this.backBtn = { x: 12, y: 288, w: 64, h: 20 };

    this.animTime = 0;
  }

  update(dt) {
    this.animTime += dt;
    const input = this.game.input;

    if (input.justPressed) {
      const px = input.pos.x;
      const py = input.pos.y;

      // 1. Check difficulty pill taps
      for (const pill of this.diffPills) {
        if (px >= pill.x && px <= pill.x + pill.w && py >= pill.y && py <= pill.y + pill.h) {
          this.selectedDifficulty = pill.id;
          if (this.game.sound) this.game.sound.playClick();
          return;
        }
      }

      // 2. Check Play button tap
      const pb = this.playBtn;
      if (px >= pb.x && px <= pb.x + pb.w && py >= pb.y && py <= pb.y + pb.h) {
        if (this.game.sound) this.game.sound.playCoin();
        this.game.startLevel(this.selectedLevel, this.selectedDifficulty);
        return;
      }

      // 3. Check Back button tap
      const bb = this.backBtn;
      if (px >= bb.x && px <= bb.x + bb.w && py >= bb.y && py <= bb.y + bb.h) {
        if (this.game.sound) this.game.sound.playClick();
        this.game.setState(GameState.MAIN_MENU);
        return;
      }
    }
  }

  render(ctx) {
    const W = 180, H = 320;
    const diff = DIFFICULTIES[this.selectedDifficulty] || DIFFICULTIES[2];
    const pulse = 0.6 + Math.abs(Math.sin(this.animTime * 4)) * 0.4;

    // 1. Dark background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#0a0f1d');
    bgGrad.addColorStop(0.5, '#1e1b4b');
    bgGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Subtle background grid
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let y = 0; y < H; y += 16) {
      ctx.fillRect(0, y, W, 1);
    }
    for (let x = 0; x < W; x += 16) {
      ctx.fillRect(x, 0, 1, H);
    }

    // 2. Top Title
    ctx.font = '6px "Press Start 2P"';
    ctx.fillStyle = '#f59e0b';
    ctx.textAlign = 'center';
    ctx.fillText('SELECT LEVEL', W / 2, 22);

    ctx.font = '3.5px "Press Start 2P"';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('CHOOSE BRANCH & DIFFICULTY', W / 2, 32);

    // 3. LEVEL 1 CARD (Active)
    const cardX = 10, cardY = 40, cardW = 160, cardH = 188;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(cardX, cardY, cardW, cardH);

    // Card Header Bar
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(cardX, cardY, cardW, 24);
    ctx.fillStyle = '#334155';
    ctx.fillRect(cardX, cardY + 24, cardW, 1);

    // Level number badge
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(cardX + 6, cardY + 5, 42, 14);
    ctx.font = '4px "Press Start 2P"';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL 1', cardX + 27, cardY + 15);

    // Level title
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f8fafc';
    ctx.font = '4px "Press Start 2P"';
    ctx.fillText('AIRPORT BRANCH', cardX + 54, cardY + 12);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '3.5px "Press Start 2P"';
    ctx.fillText('One-Way Circuit', cardX + 54, cardY + 20);

    // Difficulty Section Header
    ctx.font = '4px "Press Start 2P"';
    ctx.fillStyle = '#fef08a';
    ctx.fillText('DIFFICULTY (1-4):', cardX + 8, cardY + 38);

    // 4 Difficulty Pills
    for (const pill of this.diffPills) {
      const isSelected = this.selectedDifficulty === pill.id;
      const pDiff = DIFFICULTIES[pill.id];

      ctx.save();
      if (isSelected) {
        ctx.fillStyle = pDiff.bg;
        ctx.fillRect(pill.x, pill.y, pill.w, pill.h);

        ctx.strokeStyle = pDiff.color;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(pill.x, pill.y, pill.w, pill.h);

        // Highlight marker
        ctx.fillStyle = pDiff.color;
        ctx.fillRect(pill.x + 2, pill.y + pill.h - 2, pill.w - 4, 2);
      } else {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(pill.x, pill.y, pill.w, pill.h);

        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.strokeRect(pill.x, pill.y, pill.w, pill.h);
      }

      ctx.font = '3.5px "Press Start 2P"';
      ctx.fillStyle = isSelected ? '#ffffff' : '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText(pill.text, pill.x + pill.w / 2, pill.y + 11);
      ctx.restore();
    }

    // Selected Difficulty Details Box
    const dbX = cardX + 6, dbY = cardY + 68, dbW = cardW - 12, dbH = 82;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(dbX, dbY, dbW, dbH);
    ctx.strokeStyle = diff.border;
    ctx.lineWidth = 1;
    ctx.strokeRect(dbX, dbY, dbW, dbH);

    // Difficulty Title Banner
    ctx.fillStyle = diff.bg;
    ctx.fillRect(dbX + 1, dbY + 1, dbW - 2, 16);
    ctx.font = '4.5px "Press Start 2P"';
    ctx.fillStyle = diff.color;
    ctx.textAlign = 'center';
    ctx.fillText(diff.title, dbX + dbW / 2, dbY + 12);

    // Stat 1: Starting Cash
    ctx.textAlign = 'left';
    ctx.font = '3.5px "Press Start 2P"';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('STARTING CASH:', dbX + 6, dbY + 28);
    ctx.fillStyle = diff.startingCash > 0 ? '#4ade80' : '#ef4444';
    ctx.fillText(`$${diff.startingCash}`, dbX + 86, dbY + 28);

    // Stat 2: Traffic Flow
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('CAR TRAFFIC:', dbX + 6, dbY + 40);
    ctx.fillStyle = diff.color;
    ctx.fillText(`${diff.spawnInterval[0]}s - ${diff.spawnInterval[1]}s`, dbX + 86, dbY + 40);

    // Stat 3: Driver Patience
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('MAX PATIENCE:', dbX + 6, dbY + 52);
    ctx.fillStyle = '#facc15';
    ctx.fillText(`${diff.carPatience} SECONDS`, dbX + 86, dbY + 52);

    // Description / Skill Note
    ctx.font = '3px "Press Start 2P"';
    ctx.fillStyle = diff.id === 4 ? '#f87171' : '#cbd5e1';
    ctx.textAlign = 'center';
    ctx.fillText(diff.desc, dbX + dbW / 2, dbY + 66);
    if (diff.id === 4) {
      ctx.fillStyle = '#ef4444';
      ctx.fillText('FAST REFLEXES & COMBOS NEEDED!', dbX + dbW / 2, dbY + 75);
    }

    // Big Launch Button
    const pb = this.playBtn;
    ctx.save();
    ctx.fillStyle = '#059669';
    ctx.fillRect(pb.x, pb.y, pb.w, pb.h);

    ctx.strokeStyle = `rgba(52, 211, 153, ${pulse})`;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(pb.x, pb.y, pb.w, pb.h);

    // Button highlight line
    ctx.fillStyle = '#6ee7b7';
    ctx.fillRect(pb.x + 2, pb.y + 2, pb.w - 4, 1);

    ctx.font = '5px "Press Start 2P"';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('START LEVEL 1', pb.x + pb.w / 2, pb.y + 15);
    ctx.restore();

    // 4. LEVEL 2 CARD (Locked / Teaser)
    const l2X = 10, l2Y = 236, l2W = 160, l2H = 42;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.fillRect(l2X, l2Y, l2W, l2H);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(l2X, l2Y, l2W, l2H);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(l2X + 6, l2Y + 8, 42, 12);
    ctx.font = '3.5px "Press Start 2P"';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL 2', l2X + 27, l2Y + 17);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748b';
    ctx.fillText('DOWNTOWN MULTI-STORY', l2X + 54, l2Y + 16);
    ctx.fillStyle = '#475569';
    ctx.font = '3px "Press Start 2P"';
    ctx.fillText('LOCKED - COMPLETE LEVEL 1', l2X + 54, l2Y + 26);

    // 5. Bottom Navigation: Back Button
    const bb = this.backBtn;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(bb.x, bb.y, bb.w, bb.h);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.strokeRect(bb.x, bb.y, bb.w, bb.h);

    ctx.font = '4px "Press Start 2P"';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText('< BACK', bb.x + bb.w / 2, bb.y + 13);
  }
}
