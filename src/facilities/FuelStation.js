// ============================================================
// FuelStation.js — Refuel station kiosk building / canopy
// ============================================================

import { FacilityBase } from './FacilityBase.js';

export class FuelStation extends FacilityBase {
  constructor(x, y) {
    super('fuel_building', x, y, 20, 20);
    this.enabled = true;
    this.animTime = 0;
  }

  canAccept() {
    // The kiosk building itself is a visual header; adjacent FuelBays accept cars
    return false;
  }

  update(dt) {
    this.animTime += dt;
  }

  render(ctx, sprites) {
    const cx = Math.floor(this.x);
    const cy = Math.floor(this.y);

    const sprite = sprites.get('fuelstation');
    if (sprite) {
      ctx.drawImage(sprite, cx, cy);
    } else {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(cx, cy, this.w, 4);
      ctx.fillStyle = '#334155';
      ctx.fillRect(cx, cy + 4, this.w, this.h - 4);
    }

    // Glowing LED sign on top of pump kiosk
    ctx.save();
    ctx.fillStyle = '#f59e0b';
    ctx.font = '4px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('GAS', cx + this.w / 2, cy - 2);
    ctx.restore();
  }
}
