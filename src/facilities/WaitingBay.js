// ============================================================
// WaitingBay.js — Neutral holding bay next to office (no color/combo, frozen patience)
// ============================================================

import { FacilityBase } from './FacilityBase.js';

export class WaitingBay extends FacilityBase {
  constructor(x, y) {
    super('waiting', x, y, 14, 18);
    this.enabled = true;
    this.occupied = false;
    this.occupiedBy = null;

    // Strictly neutral: never paints colors, never triggers or breaks combos
    this.assignedColor = null;
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

  render(ctx, sprites) {
    const cx = Math.floor(this.x);
    const cy = Math.floor(this.y);

    // 1. Tarmac base
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(cx, cy, this.w, this.h);

    // 2. Neutral silver / cyan boundary markings (never changes color)
    ctx.save();
    ctx.fillStyle = '#94a3b8';

    // Left dashed line
    ctx.fillRect(cx, cy, 1, 4);
    ctx.fillRect(cx, cy + 6, 1, 4);
    ctx.fillRect(cx, cy + 12, 1, 4);

    // Right dashed line
    ctx.fillRect(cx + this.w - 1, cy, 1, 4);
    ctx.fillRect(cx + this.w - 1, cy + 6, 1, 4);
    ctx.fillRect(cx + this.w - 1, cy + 12, 1, 4);

    // Bottom solid stopper line
    ctx.fillRect(cx, cy + this.h - 1, this.w, 1);

    // Top entry markers
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(cx, cy, 2, 2);
    ctx.fillRect(cx + this.w - 2, cy, 2, 2);

    // "WAIT" pavement label
    if (!this.occupied) {
      ctx.font = '3px "Press Start 2P"';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.fillText('WAIT', cx + this.w / 2, cy + 10);
    }
    ctx.restore();

    // 3. Drag highlight
    if (this.hoverHighlight) {
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 1, cy - 1, this.w + 2, this.h + 2);
    } else if (this.highlighted) {
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.6)';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 1, cy - 1, this.w + 2, this.h + 2);
    }
  }
}
