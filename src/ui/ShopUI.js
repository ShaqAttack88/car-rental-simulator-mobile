// ============================================================
// ShopUI.js — Side UI for purchasing & placing parking, waiting & fuel bays
// ============================================================

import { ParkingBay } from '../facilities/ParkingBay.js';
import { WaitingBay } from '../facilities/WaitingBay.js';
import { FuelBay } from '../facilities/FuelBay.js';
import { WashBay } from '../facilities/WashBay.js';

export class ShopUI {
  /** @param {import('../engine/Game').Game} game */
  constructor(game) {
    this.game = game;

    // Top HUD Buy Button (relocated to free up all yard space for expansions)
    this.btn = { x: 100, y: 1, w: 60, h: 10 };
    this.placementMode = false;
    this.pulseTime = 0;
  }

  _drawCartIcon(ctx, cx, cy, isColor = true, bounce = 0) {
    const by = cy + bounce;
    const handleColor = isColor ? '#ffffff' : '#94a3b8';
    const basketColor = isColor ? '#fbbf24' : '#64748b';
    const itemColor   = isColor ? '#22c55e' : '#475569';
    const wheelColor  = isColor ? '#0f172a' : '#1e293b';
    const hubColor    = isColor ? '#fde68a' : '#94a3b8';

    ctx.save();
    // 1. Handle (angled bar)
    ctx.fillStyle = handleColor;
    ctx.fillRect(cx - 5, by - 3, 2, 1);
    ctx.fillRect(cx - 4, by - 2, 1, 3);

    // 2. Basket wireframe
    ctx.fillStyle = basketColor;
    ctx.fillRect(cx - 3, by + 1, 7, 1); // bottom
    ctx.fillRect(cx - 3, by - 3, 1, 4); // rear upright
    ctx.fillRect(cx + 3, by - 3, 1, 4); // front upright
    ctx.fillRect(cx - 2, by - 1, 5, 1); // center wire

    // 3. Green gem / coin inside cart
    ctx.fillStyle = itemColor;
    ctx.fillRect(cx - 1, by - 2, 2, 2);

    // 4. Wheels with hubcaps
    ctx.fillStyle = wheelColor;
    ctx.fillRect(cx - 2, by + 2, 2, 2);
    ctx.fillRect(cx + 2, by + 2, 2, 2);
    ctx.fillStyle = hubColor;
    ctx.fillRect(cx - 2, by + 2, 1, 1);
    ctx.fillRect(cx + 2, by + 2, 1, 1);

    ctx.restore();
  }

  getCheapestSpot() {
    const level = this.game.level;
    if (!level || !level.availableSpots || level.availableSpots.length === 0) return null;
    let cheapest = level.availableSpots[0];
    for (const s of level.availableSpots) {
      if (s.cost < cheapest.cost) {
        cheapest = s;
      }
    }
    return cheapest;
  }

  update(dt) {
    this.pulseTime += dt;
    const input = this.game.input;
    const level = this.game.level;
    if (!level) return;

    const cheapest = this.getCheapestSpot();
    if (!cheapest) {
      this.placementMode = false;
      return;
    }

    if (input.justPressed) {
      const px = input.pos.x;
      const py = input.pos.y;

      // 1. Check click on top HUD shop buy button
      const b = this.btn;
      if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) {
        if (this.placementMode) {
          this.placementMode = false;
          if (this.game.sound) this.game.sound.playClick();
          return;
        }

        if (level.score < cheapest.cost) {
          if (this.game.sound) this.game.sound.playHorn();
          if (this.game.floatingText) {
            this.game.floatingText.spawn(`NEED $${cheapest.cost}!`, px, py + 16, '#ef4444');
          }
          return;
        }

        this.placementMode = true;
        if (this.game.sound) this.game.sound.playClick();
        return;
      }

      // 2. Check if tapped on an expansion plot directly or in placement mode
      for (let i = 0; i < level.availableSpots.length; i++) {
        const spot = level.availableSpots[i];
        const pad = 5;
        if (px >= spot.x - pad && px <= spot.x + 14 + pad &&
            py >= spot.y - pad && py <= spot.y + 18 + pad) {
          this._purchaseSpot(spot, i);
          return;
        }
      }

      // If in placement mode and clicked outside, dismiss
      if (this.placementMode) {
        this.placementMode = false;
      }
    }
  }

  _purchaseSpot(spot, index) {
    const level = this.game.level;
    if (level.score < spot.cost) {
      if (this.game.sound) this.game.sound.playHorn();
      if (this.game.floatingText) {
        this.game.floatingText.spawn(`NEED $${spot.cost}!`, spot.x + 7, spot.y - 10, '#ef4444');
      }
      return;
    }

    // Deduct cost
    level.score -= spot.cost;

    // Create facility corresponding to plot type
    let newFacility;
    let label = 'NEW BAY BUILT!';
    if (spot.type === 'waiting') {
      newFacility = new WaitingBay(spot.x, spot.y);
      label = 'WAIT BAY BUILT!';
    } else if (spot.type === 'fuel') {
      newFacility = new FuelBay(spot.x, spot.y);
      label = 'FUEL BAY BUILT!';
    } else if (spot.type === 'carwash') {
      newFacility = new WashBay(spot.x, spot.y);
      label = 'WASH BAY BUILT!';
    } else {
      newFacility = new ParkingBay(spot.x, spot.y);
      label = 'PARK BAY BUILT!';
    }

    level.facilities.push(newFacility);
    this.game.highlighter.setFacilities(level.facilities);

    // Remove from available spots
    level.availableSpots.splice(index, 1);

    // Audio & visual feedback
    if (this.game.sound) {
      this.game.sound.playBuild();
    }
    if (this.game.floatingText) {
      this.game.floatingText.spawn(`-$${spot.cost}`, spot.x + 7, spot.y - 6, '#f59e0b');
      this.game.floatingText.spawnCombo(label, 90, 150, '#38bdf8');
    }

    this.placementMode = false;
  }

  render(ctx) {
    const level = this.game.level;
    if (!level) return;

    const cheapest = this.getCheapestSpot();

    // 1. Render Top HUD Buy Button
    const b = this.btn;
    const canAfford = cheapest && level.score >= cheapest.cost;
    const pulse = Math.abs(Math.sin(this.pulseTime * 4));

    if (!cheapest) {
      // All bays built!
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.strokeRect(b.x, b.y, b.w, b.h);

      this._drawCartIcon(ctx, b.x + 8, b.y + 5, false);

      ctx.font = '4px "Press Start 2P"';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.fillText('MAX', b.x + 36, b.y + 7);
    } else if (this.placementMode) {
      // Active placement mode
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = `rgba(147, 197, 253, ${0.7 + pulse * 0.3})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(b.x, b.y, b.w, b.h);

      const bounce = Math.sin(this.pulseTime * 8) * 1.5;
      this._drawCartIcon(ctx, b.x + 8, b.y + 5, true, bounce);

      ctx.font = '4px "Press Start 2P"';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('TAP PLOT', b.x + 34, b.y + 7);
    } else if (canAfford) {
      // Affordable: Vibrant golden yellow button with beacon border
      ctx.fillStyle = '#d97706';
      ctx.fillRect(b.x, b.y, b.w, b.h);

      // Top shine highlight
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(b.x + 1, b.y + 1, b.w - 2, 1);

      // Pulsing golden neon border
      ctx.strokeStyle = `rgba(254, 240, 138, ${0.8 + pulse * 0.2})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(b.x, b.y, b.w, b.h);

      // Bright colorful shopping cart icon
      this._drawCartIcon(ctx, b.x + 8, b.y + 5, true);

      // Bold text with drop shadow
      ctx.font = '4px "Press Start 2P"';
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.fillText(`BUY $${cheapest.cost}`, b.x + 35, b.y + 8);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`BUY $${cheapest.cost}`, b.x + 34, b.y + 7);

      // Notification beacon dot on top-right corner
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(b.x + b.w - 3, b.y, 3, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(b.x + b.w - 2, b.y + 1, 1, 1);
    } else {
      // Not enough money: Sleek slate button
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.strokeRect(b.x, b.y, b.w, b.h);

      this._drawCartIcon(ctx, b.x + 8, b.y + 5, false);

      ctx.font = '4px "Press Start 2P"';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText(`BUY $${cheapest.cost}`, b.x + 34, b.y + 7);
    }

    // 2. Render all available expansion plots (always visible, extra bright in placement mode)
    if (level.availableSpots && level.availableSpots.length > 0) {
      const pulse = 0.5 + Math.abs(Math.sin(this.pulseTime * 5)) * 0.5;

      for (const spot of level.availableSpots) {
        const canBuyThis = level.score >= spot.cost;

        ctx.save();
        let strokeColor = `rgba(52, 211, 153, ${pulse})`;
        let fillColor = 'rgba(16, 185, 129, 0.18)';
        let textColor = '#4ade80';
        let typeBadge = 'PARK';

        if (spot.type === 'waiting') {
          strokeColor = `rgba(56, 189, 248, ${pulse})`;
          fillColor = 'rgba(14, 165, 233, 0.18)';
          textColor = '#38bdf8';
          typeBadge = 'WAIT';
        } else if (spot.type === 'fuel') {
          strokeColor = `rgba(245, 158, 11, ${pulse})`;
          fillColor = 'rgba(217, 119, 6, 0.18)';
          textColor = '#f59e0b';
          typeBadge = 'GAS';
        } else if (spot.type === 'carwash') {
          strokeColor = `rgba(6, 182, 212, ${pulse})`;
          fillColor = 'rgba(8, 145, 178, 0.18)';
          textColor = '#22d3ee';
          typeBadge = 'WASH';
        }

        if (this.placementMode) {
          // Highlighted in active placement mode
          ctx.strokeStyle = canBuyThis ? strokeColor : 'rgba(148, 163, 184, 0.4)';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
          ctx.strokeRect(spot.x, spot.y, 14, 18);
          ctx.setLineDash([]);

          ctx.fillStyle = canBuyThis ? fillColor : 'rgba(15, 23, 42, 0.35)';
          ctx.fillRect(spot.x, spot.y, 14, 18);

          ctx.font = '3px "Press Start 2P"';
          ctx.fillStyle = canBuyThis ? textColor : '#64748b';
          ctx.textAlign = 'center';
          ctx.fillText(typeBadge, spot.x + 7, spot.y + 8);
          ctx.fillText(`$${spot.cost}`, spot.x + 7, spot.y + 15);
        } else {
          // Idle mode: subtle dashed outline showing where expansion bays can be placed
          ctx.strokeStyle = canBuyThis ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
          ctx.strokeRect(spot.x, spot.y, 14, 18);
          ctx.setLineDash([]);

          if (canBuyThis) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.fillRect(spot.x, spot.y, 14, 18);
            ctx.font = '3px "Press Start 2P"';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.textAlign = 'center';
            ctx.fillText('+', spot.x + 7, spot.y + 10);
          }
        }
        ctx.restore();
      }
    }
  }
}
