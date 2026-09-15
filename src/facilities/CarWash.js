// ============================================================
// CarWash.js — Car wash building / kiosk
// ============================================================

import { FacilityBase } from './FacilityBase.js';

export class CarWash extends FacilityBase {
  constructor(x, y) {
    super('carwash_building', x, y, 24, 20);
    this.enabled = true; // Active facility
    this.washActive = false;
    this.animTime = 0;
  }

  canAccept() {
    // The building itself is visual / station header; adjacent WashBays accept cars
    return false;
  }

  update(dt) {
    this.animTime += dt;
  }

  render(ctx, sprites) {
    const cx = Math.floor(this.x);
    const cy = Math.floor(this.y);

    const sprite = sprites.get('carwash');
    if (sprite) {
      ctx.drawImage(sprite, cx, cy);
    } else {
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(cx, cy + 4, this.w, this.h - 4);
      ctx.fillStyle = '#1e40af';
      ctx.fillRect(cx, cy, this.w, 6);
    }

    // Glowing LED "WASH" sign on top
    ctx.save();
    ctx.fillStyle = '#38bdf8';
    ctx.font = '4px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('WASH', cx + this.w / 2, cy - 2);
    ctx.restore();
  }
}
