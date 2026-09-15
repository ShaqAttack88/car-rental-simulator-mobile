// ============================================================
// FuelBay.js — Individual refueling bay with color combo mechanics
// ============================================================

import { FacilityBase } from './FacilityBase.js';
import { COLOR_MAP } from './ParkingBay.js';

export class FuelBay extends FacilityBase {
  constructor(x, y) {
    super('fuel', x, y, 14, 18);

    this.enabled = true;
    this.occupied = false;
    this.occupiedBy = null;

    // Color combo tracking
    this.assignedColor = null;
    this.comboCount = 1;
    this.comboPulseTimer = 0;
    this.sparkles = [];
  }

  setNeutral() {
    this.assignedColor = null;
    this.comboCount = 1;
    this.comboPulseTimer = 0;
    this.sparkles = [];
  }

  triggerCombo(multiplier) {
    this.comboPulseTimer = 0.8;
    this.comboCount = multiplier;

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

  canAccept() {
    return this.enabled && !this.occupied;
  }

  assignCar(car) {
    this.occupied = true;
    this.occupiedBy = car;
  }

  releaseCar() {
    this.occupied = false;
    this.occupiedBy = null;
  }

  getEntryPoint() {
    return {
      x: this.x + Math.floor((this.w - 10) / 2),
      y: this.y + 1,
    };
  }

  update(dt) {
    if (this.comboPulseTimer > 0) {
      this.comboPulseTimer -= dt;
    }

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
    const bx = Math.floor(this.x);
    const by = Math.floor(this.y);

    // 1. Tarmac base
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(bx, by, this.w, this.h);

    // 2. Diagonal hazard/fuel stripes in pavement
    ctx.fillStyle = '#334155';
    ctx.fillRect(bx + 2, by + 3, this.w - 4, 1);
    ctx.fillRect(bx + 2, by + 8, this.w - 4, 1);
    ctx.fillRect(bx + 2, by + 13, this.w - 4, 1);

    // 3. Mini fuel pump icon stamped on bay asphalt
    ctx.save();
    ctx.fillStyle = '#475569';
    ctx.fillRect(bx + 5, by + 6, 4, 6);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(bx + 6, by + 7, 2, 2);
    ctx.restore();

    // 4. Colored combo borders or neutral amber dashed lines
    if (this.assignedColor && COLOR_MAP[this.assignedColor]) {
      const c = COLOR_MAP[this.assignedColor];
      ctx.save();
      ctx.fillStyle = c.hex;

      // Left & right lines
      ctx.fillRect(bx, by, 2, this.h);
      ctx.fillRect(bx + this.w - 2, by, 2, this.h);
      // Bottom stopper
      ctx.fillRect(bx, by + this.h - 2, this.w, 2);

      // Top entry dots
      ctx.fillStyle = c.light;
      ctx.fillRect(bx, by, 2, 2);
      ctx.fillRect(bx + this.w - 2, by, 2, 2);

      // Multiplier badge
      if (this.comboCount > 1) {
        ctx.font = '4px "Press Start 2P"';
        ctx.fillStyle = c.light;
        ctx.textAlign = 'center';
        ctx.fillText(`x${this.comboCount}`, bx + this.w / 2, by + this.h + 5);
      }
      ctx.restore();
    } else {
      // Neutral bay: amber dashed lines
      ctx.save();
      ctx.fillStyle = '#eab308';
      ctx.fillRect(bx, by, 1, 4);
      ctx.fillRect(bx, by + 6, 1, 4);
      ctx.fillRect(bx, by + 12, 1, 4);
      ctx.fillRect(bx + this.w - 1, by, 1, 4);
      ctx.fillRect(bx + this.w - 1, by + 6, 1, 4);
      ctx.fillRect(bx + this.w - 1, by + 12, 1, 4);
      ctx.fillRect(bx, by + this.h - 1, this.w, 1);
      ctx.restore();
    }

    // 5. Drag highlight
    if (this.hoverHighlight) {
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx - 1, by - 1, this.w + 2, this.h + 2);
    } else if (this.highlighted) {
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.6)';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx - 1, by - 1, this.w + 2, this.h + 2);
    }

    // 6. Combo celebration pulse & sparkles
    if (this.comboPulseTimer > 0) {
      const c = COLOR_MAP[this.assignedColor] || COLOR_MAP.yellow;
      const progress = this.comboPulseTimer / 0.8;
      const expand = Math.floor((1 - progress) * 6);

      ctx.save();
      ctx.strokeStyle = c.light;
      ctx.lineWidth = 1;
      ctx.globalAlpha = progress;
      ctx.strokeRect(bx - expand, by - expand, this.w + expand * 2, this.h + expand * 2);

      for (const sp of this.sparkles) {
        ctx.fillStyle = sp.color;
        ctx.globalAlpha = Math.max(0, sp.life / sp.maxLife);
        ctx.fillRect(Math.floor(sp.x), Math.floor(sp.y), 1, 1);
      }
      ctx.restore();
    }
  }
}
