// ============================================================
// ParkingBay.js — Functional parking bay with color combo mechanics
// ============================================================

import { FacilityBase } from './FacilityBase.js';

export const COLOR_MAP = {
  red:    { hex: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)', light: '#f87171' },
  blue:   { hex: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)', light: '#60a5fa' },
  yellow: { hex: '#eab308', glow: 'rgba(234, 179, 8, 0.5)',  light: '#fde047' },
  green:  { hex: '#22c55e', glow: 'rgba(34, 197, 94, 0.5)',  light: '#4ade80' },
  white:  { hex: '#f8fafc', glow: 'rgba(248, 250, 252, 0.5)',light: '#ffffff' },
};

export class ParkingBay extends FacilityBase {
  constructor(x, y) {
    super('parking', x, y, 14, 18);
    this.scoreValue = 50;

    // Color combo tracking
    this.assignedColor = null;   // e.g. 'red', 'blue', etc.
    this.comboCount = 1;         // 1 = base, 2 = 2x, 3 = 3x, etc.
    this.comboPulseTimer = 0;    // countdown timer for visual celebration pulse
    this.sparkles = [];          // celebration sparkle particles
  }

  /** Reset bay to neutral unpainted state when combo is broken */
  setNeutral() {
    this.assignedColor = null;
    this.comboCount = 1;
    this.comboPulseTimer = 0;
    this.sparkles = [];
  }

  /** Trigger combo celebration animation */
  triggerCombo(multiplier) {
    this.comboPulseTimer = 0.8;
    this.comboCount = multiplier;

    // Generate burst sparkles
    this.sparkles = [];
    const colorInfo = COLOR_MAP[this.assignedColor] || COLOR_MAP.yellow;
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;
      this.sparkles.push({
        x: this.x + this.w / 2,
        y: this.y + this.h / 2,
        vx: Math.cos(angle) * (15 + Math.random() * 15),
        vy: Math.sin(angle) * (15 + Math.random() * 15),
        color: colorInfo.light,
        life: 0.6,
        maxLife: 0.6,
      });
    }
  }

  update(dt) {
    if (this.comboPulseTimer > 0) {
      this.comboPulseTimer -= dt;
    }

    // Update sparkles
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const sp = this.sparkles[i];
      sp.life -= dt;
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      if (sp.life <= 0) {
        this.sparkles.splice(i, 1);
      }
    }
  }

  render(ctx, sprites) {
    const cx = Math.floor(this.x);
    const cy = Math.floor(this.y);

    // 1. Base bay sprite
    let spriteKey = 'bay_free';
    if (this.highlighted || this.hoverHighlight) {
      spriteKey = 'bay_highlight';
    } else if (this.occupied) {
      spriteKey = 'bay_occupied';
    }

    const sprite = sprites.get(spriteKey);
    if (sprite) {
      ctx.drawImage(sprite, cx, cy);
    }

    // 2. Colored bay lines if this bay has been parked in
    if (this.assignedColor && COLOR_MAP[this.assignedColor]) {
      const c = COLOR_MAP[this.assignedColor];

      ctx.save();
      ctx.fillStyle = c.hex;

      // Left side line
      ctx.fillRect(cx, cy, 2, this.h);
      // Right side line
      ctx.fillRect(cx + this.w - 2, cy, 2, this.h);
      // Bottom stopper line
      ctx.fillRect(cx, cy + this.h - 2, this.w, 2);

      // Top entry markings (colored dots)
      ctx.fillStyle = c.light;
      ctx.fillRect(cx, cy, 2, 2);
      ctx.fillRect(cx + this.w - 2, cy, 2, 2);

      // Multiplier badge if combo > 1
      if (this.comboCount > 1) {
        ctx.font = '4px "Press Start 2P"';
        ctx.fillStyle = c.light;
        ctx.textAlign = 'center';
        ctx.fillText(`x${this.comboCount}`, cx + this.w / 2, cy + this.h + 5);
      }

      ctx.restore();
    }

    // 3. Hover highlight
    if (this.hoverHighlight) {
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 1, cy - 1, this.w + 2, this.h + 2);
    }

    // 4. Combo pulse animation
    if (this.comboPulseTimer > 0) {
      const c = COLOR_MAP[this.assignedColor] || COLOR_MAP.yellow;
      const progress = this.comboPulseTimer / 0.8;
      const expand = Math.floor((1 - progress) * 6);

      ctx.save();
      ctx.strokeStyle = c.light;
      ctx.lineWidth = 1;
      ctx.globalAlpha = progress;
      ctx.strokeRect(cx - expand, cy - expand, this.w + expand * 2, this.h + expand * 2);

      // Sparkles
      for (const sp of this.sparkles) {
        ctx.fillStyle = sp.color;
        ctx.globalAlpha = Math.max(0, sp.life / sp.maxLife);
        ctx.fillRect(Math.floor(sp.x), Math.floor(sp.y), 1, 1);
      }
      ctx.restore();
    }
  }
}
