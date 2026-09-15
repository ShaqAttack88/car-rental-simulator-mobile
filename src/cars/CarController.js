// ============================================================
// CarController.js — Individual car logic & state machine
// ============================================================

import { CarState } from './CarState.js';

const CAR_SPEED = 40;          // pixels per second
const COLOURS = ['red', 'blue', 'yellow', 'green', 'white'];

export class CarController {
  /**
   * @param {number} id
   * @param {import('../sprites/SpriteFactory').SpriteFactory} sprites
   */
  constructor(id, sprites) {
    this.id = id;
    this.colour = COLOURS[Math.floor(Math.random() * COLOURS.length)];
    this.sprite = sprites.get(`car_${this.colour}`);
    this.sprites = sprites;

    // Position (top-left corner of car sprite in game pixels)
    this.x = 0;
    this.y = 0;
    this.w = 10;
    this.h = 16;

    // Direction the car is facing: 'down', 'up', 'left', 'right'
    this.facing = 'right';

    // State machine
    this.state = CarState.APPROACHING;

    // Patience (seconds)
    this.maxPatience = 15;
    this.patience = this.maxPatience;

    // Park timer (seconds remaining at facility)
    this.parkTimer = 0;
    this.totalParkDuration = 0;
    this._scored = false;

    // Impatience / departure status
    this.angry = false;
    this.needsFuel = false;
    this.needsWash = false;
    this.negComboCount = 0;

    // Level reference for collision detection
    this.level = null;

    // Assigned facility reference
    this.assignedFacility = null;

    // Waypoint path
    this.waypoints = [];
    this.waypointIndex = 0;

    // Visual feedback
    this.selected = false;
    this.selectPulse = 0;
  }

  /** Set a waypoint path and begin driving */
  setPath(waypoints) {
    this.waypoints = waypoints;
    this.waypointIndex = 0;
  }

  /** Assign to a facility and give a path to drive there */
  assignTo(facility, waypoints) {
    this.assignedFacility = facility;
    facility.assignCar(this);
    this.setPath(waypoints);
    this.state = CarState.ASSIGNED;
    // Immediately transition to driving
    this.state = CarState.DRIVING_TO_DESTINATION;
  }

  /** Called when the car should leave the lot */
  startLeaving(exitWaypoints) {
    if (this.assignedFacility) {
      this.assignedFacility.releaseCar();
      this.assignedFacility = null;
    }
    this.setPath(exitWaypoints);
    this.state = CarState.LEAVING;
  }

  update(dt) {
    switch (this.state) {
      case CarState.APPROACHING:
        this._followPath(dt);
        break;

      case CarState.WAITING:
        this.patience -= dt;
        this.selectPulse += dt * 4;
        // Follow waypoints to shuffle position in queue
        this._followPath(dt);
        if (this.patience <= 0) {
          this.patience = 0;
          // Do NOT set state to GONE here; CarQueue.update() extracts expired cars so they drive off
        }
        break;

      case CarState.DRIVING_TO_DESTINATION:
        this._followPath(dt);
        break;

      case CarState.PARKED:
        this.parkTimer -= dt;
        if (this.parkTimer <= 0) {
          this.parkTimer = 0;
          // LevelManager handles departure or transition to NEEDS_REFUEL
        }
        break;

      case CarState.NEEDS_REFUEL:
        this.patience -= dt;
        this.selectPulse += dt * 4;
        if (this.patience <= 0) {
          this.patience = 0;
        }
        break;

      case CarState.STAGED:
        // Resting in neutral waiting bay: patience timer is FROZEN ("without lossing bar")
        this.selectPulse += dt * 4;
        break;

      case CarState.LEAVING:
        this._followPath(dt);
        break;

      default:
        break;
    }
  }

  _followPath(dt) {
    if (this.waypointIndex >= this.waypoints.length) {
      // Reached end of path
      if (this.state === CarState.APPROACHING) {
        this.state = CarState.WAITING;
      } else if (this.state === CarState.DRIVING_TO_DESTINATION) {
        if (this.assignedFacility && this.assignedFacility.type === 'waiting') {
          this.state = CarState.STAGED;
        } else {
          this.state = CarState.PARKED;
        }
      } else if (this.state === CarState.LEAVING) {
        this.state = CarState.GONE;
      }
      return;
    }

    const target = this.waypoints[this.waypointIndex];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 1) {
      this.x = target.x;
      this.y = target.y;
      this.waypointIndex++;
      return;
    }

    // Smooth headway & collision avoidance with deterministic right-of-way
    const blockCheck = this._checkHeadway(dx, dy);
    if (blockCheck.blocked) {
      this.yieldTimer = (this.yieldTimer || 0) + dt;
      if (this.yieldTimer < 0.8) {
        return; // Yield to vehicle with right-of-way
      }
      // Anti-deadlock failsafe: gently creep at slow speed so traffic never stays frozen
    } else {
      this.yieldTimer = 0;
    }

    // Dynamic speed: slow down if closing in on car ahead to maintain spacing buffer
    let speed = this.angry ? CAR_SPEED * 1.3 : CAR_SPEED;
    if (blockCheck.slowDown) {
      speed *= 0.5; // Smooth deceleration buffer
    } else if (this.yieldTimer >= 0.8) {
      speed *= 0.4; // Creep speed during deadlock failsafe
    }

    const step = Math.min(speed * dt, dist);
    this.x += (dx / dist) * step;
    this.y += (dy / dist) * step;

    // Update facing direction
    if (Math.abs(dx) > Math.abs(dy)) {
      this.facing = dx > 0 ? 'right' : 'left';
    } else {
      this.facing = dy > 0 ? 'down' : 'up';
    }
  }

  /**
   * Check headway ahead with deterministic priority:
   * Returns { blocked: boolean, slowDown: boolean }
   * Guarantees no two cars ever yield to each other simultaneously.
   */
  _checkHeadway(dx, dy) {
    if (!this.level) return { blocked: false, slowDown: false };
    const allCars = this.level.getAllCars();

    const isMovingHorizontal = Math.abs(dx) > Math.abs(dy);
    const stopDist = 17;    // distance to come to complete stop (1 car length + 1px)
    const bufferDist = 24;  // distance to begin smooth deceleration

    for (const other of allCars) {
      if (other === this || other.state === CarState.GONE) continue;

      // Parked cars inside bays do not block driving lanes
      if (other.state === CarState.PARKED) continue;

      const diffX = other.x - this.x;
      const diffY = other.y - this.y;
      const dist = Math.sqrt(diffX * diffX + diffY * diffY);

      // --- CASE 1: In-lane Following (same travel axis) ---
      if (isMovingHorizontal) {
        // Horizontal travel (road / driveway)
        const inSameLane = Math.abs(diffY) < 7;
        if (inSameLane) {
          if (dx > 0 && diffX > 0 && diffX < bufferDist) {
            return { blocked: diffX < stopDist, slowDown: true };
          }
          if (dx < 0 && diffX < 0 && -diffX < bufferDist) {
            return { blocked: -diffX < stopDist, slowDown: true };
          }
        }
      } else {
        // Vertical travel (queue / bay entry)
        const inSameLane = Math.abs(diffX) < 7;
        if (inSameLane) {
          if (dy > 0 && diffY > 0 && diffY < bufferDist) {
            return { blocked: diffY < stopDist, slowDown: true };
          }
          if (dy < 0 && diffY < 0 && -diffY < bufferDist) {
            return { blocked: -diffY < stopDist, slowDown: true };
          }
        }
      }

      // --- CASE 2: Intersection / Crossing Conflict (< 15px) ---
      // When two cars are in close proximity at crossing paths:
      if (dist < 15) {
        // Deterministic Right-of-Way:
        // Leaving cars have right-of-way over arriving cars (clear the branch first!)
        // Ties broken by car ID.
        const weHavePriority =
          (this.state === CarState.LEAVING && other.state !== CarState.LEAVING) ||
          (this.state === other.state && this.id < other.id);

        if (!weHavePriority) {
          // Other car has priority — we yield briefly
          return { blocked: true, slowDown: true };
        }
      }
    }

    return { blocked: false, slowDown: false };
  }

  /** Has this car reached the end of its current path? */
  hasReachedPathEnd() {
    return this.waypointIndex >= this.waypoints.length;
  }

  render(ctx) {
    if (this.state === CarState.GONE) return;

    ctx.save();

    // Draw car with rotation based on facing direction
    const cx = Math.floor(this.x);
    const cy = Math.floor(this.y);

    ctx.translate(cx + this.w / 2, cy + this.h / 2);

    switch (this.facing) {
      case 'up':    ctx.rotate(0); break;
      case 'down':  ctx.rotate(Math.PI); break;
      case 'left':  ctx.rotate(-Math.PI / 2); break;
      case 'right': ctx.rotate(Math.PI / 2); break;
    }

    // The car sprite is drawn facing UP by default (headlights at bottom)
    ctx.drawImage(this.sprite, -this.w / 2, -this.h / 2);

    ctx.restore();

    // Selection pulse
    if (this.selected) {
      const pulse = 0.3 + Math.abs(Math.sin(this.selectPulse)) * 0.4;
      ctx.strokeStyle = `rgba(74, 222, 128, ${pulse})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 1, cy - 1, this.w + 2, this.h + 2);
    }

    // Patience bar (only when waiting in queue)
    if (this.state === CarState.WAITING) {
      this._renderPatienceBar(ctx, cx, cy);
    }

    // Staged waiting bar (when resting safely in neutral waiting bay)
    if (this.state === CarState.STAGED) {
      this._renderStagedBar(ctx, cx, cy);
    }

    // Refuel / wash service icon & patience indicator (when waiting in bay for services)
    if (this.state === CarState.NEEDS_REFUEL || this.needsFuel || this.needsWash) {
      this._renderServiceIcon(ctx, cx, cy);
    }

    // Park service countdown bar (while parked at facility, washing, or refueling)
    if (this.state === CarState.PARKED && this.totalParkDuration > 0) {
      this._renderParkBar(ctx, cx, cy);
    }

    // Angry indicator (when lost patience and leaving)
    if (this.angry) {
      this._renderAngryEmote(ctx, cx, cy);
    }
  }

  _renderPatienceBar(ctx, cx, cy) {
    const barW = 12;
    const barH = 2;
    const bx = cx + (this.w - barW) / 2;
    const by = cy - 4;
    const ratio = Math.max(0, this.patience / this.maxPatience);

    // Background
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(bx, by, barW, barH);

    // Fill (green → yellow → red)
    if (ratio > 0.5) ctx.fillStyle = '#22c55e';
    else if (ratio > 0.25) ctx.fillStyle = '#eab308';
    else ctx.fillStyle = '#ef4444';
    ctx.fillRect(bx, by, Math.ceil(barW * ratio), barH);
  }

  _renderStagedBar(ctx, cx, cy) {
    const barW = 12;
    const barH = 2;
    const bx = cx + (this.w - barW) / 2;
    const by = cy - 4;
    const ratio = Math.max(0, this.patience / this.maxPatience);

    // Background
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(bx, by, barW, barH);

    // Calm frozen cyan bar
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(bx, by, Math.ceil(barW * ratio), barH);

    // "WAIT" badge
    ctx.save();
    ctx.font = '4px "Press Start 2P"';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText('HOLD', cx + this.w / 2, cy - 6);
    ctx.restore();
  }

  _drawDropletIcon(ctx, cx, cy) {
    // Water droplet with gleam and depth (6x6 px)
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(cx - 1, cy - 3, 2, 1);
    ctx.fillRect(cx - 2, cy - 2, 4, 1);
    ctx.fillRect(cx - 3, cy - 1, 6, 3);
    ctx.fillRect(cx - 2, cy + 2, 4, 1);

    // Gleam / shine
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(cx - 2, cy - 1, 1, 2);
    ctx.fillRect(cx - 1, cy - 2, 1, 1);

    // Depth shade
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(cx + 1, cy, 1, 2);
    ctx.fillRect(cx, cy + 2, 2, 1);
  }

  _drawPumpIcon(ctx, cx, cy, isRed = false) {
    // Pump body
    ctx.fillStyle = isRed ? '#ef4444' : '#f59e0b';
    ctx.fillRect(cx - 3, cy - 3, 4, 6);

    // Meter display window
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx - 2, cy - 2, 2, 2);

    // Hose & nozzle
    ctx.fillStyle = isRed ? '#fca5a5' : '#fbbf24';
    ctx.fillRect(cx + 1, cy - 2, 2, 1);
    ctx.fillRect(cx + 2, cy - 1, 1, 3);

    // Pump base
    ctx.fillStyle = isRed ? '#b91c1c' : '#d97706';
    ctx.fillRect(cx - 3, cy + 3, 4, 1);
  }

  _renderServiceIcon(ctx, cx, cy) {
    const bob = Math.sin(Date.now() / 150) * 2;
    const iconX = Math.floor(cx + this.w / 2);
    const iconY = Math.floor(cy - 9 + bob);
    const hasNegCombo = (this.negComboCount || 0) > 0;
    const dual = this.needsFuel && this.needsWash;

    ctx.save();

    if (dual) {
      // Dual badge: both Fuel & Wash needed
      const badgeW = 24;
      const bx = iconX - badgeW / 2;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(bx, iconY - 6, badgeW, 11);
      ctx.strokeStyle = hasNegCombo ? '#ef4444' : '#fbbf24';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, iconY - 6, badgeW, 11);

      // Subtle divider between fuel and wash
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(iconX, iconY - 4, 1, 7);

      // Left: Identical Fuel Pump
      this._drawPumpIcon(ctx, iconX - 6, iconY, hasNegCombo);

      // Right: Identical Water Droplet
      this._drawDropletIcon(ctx, iconX + 6, iconY);
    } else if (this.needsWash) {
      // Car wash only needed
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(iconX - 6, iconY - 6, 12, 11);
      ctx.strokeStyle = hasNegCombo ? '#ef4444' : '#38bdf8';
      ctx.lineWidth = 1;
      ctx.strokeRect(iconX - 6, iconY - 6, 12, 11);

      // Center: Identical Water Droplet
      this._drawDropletIcon(ctx, iconX, iconY);
    } else {
      // Fuel only needed
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(iconX - 6, iconY - 6, 12, 11);
      ctx.strokeStyle = hasNegCombo ? '#ef4444' : '#f59e0b';
      ctx.lineWidth = 1;
      ctx.strokeRect(iconX - 6, iconY - 6, 12, 11);

      // Center: Identical Fuel Pump
      this._drawPumpIcon(ctx, iconX, iconY, hasNegCombo);
    }

    // Negative combo badge above icon if stacking penalties
    if (hasNegCombo) {
      ctx.font = '3px "Press Start 2P"';
      ctx.fillStyle = '#ef4444';
      ctx.textAlign = 'center';
      ctx.fillText(`-${this.negComboCount}x`, iconX, iconY - 8);
    }

    ctx.restore();

    // Patience countdown bar below icon
    const barW = 12;
    const barH = 2;
    const bx = cx + (this.w - barW) / 2;
    const by = cy - 2;
    const ratio = Math.max(0, this.patience / this.maxPatience);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(bx, by, barW, barH);
    if (hasNegCombo) {
      ctx.fillStyle = '#ef4444';
    } else if (ratio > 0.5) {
      ctx.fillStyle = this.needsWash && !this.needsFuel ? '#38bdf8' : '#f59e0b';
    } else if (ratio > 0.25) {
      ctx.fillStyle = '#ea580c';
    } else {
      ctx.fillStyle = '#ef4444';
    }
    ctx.fillRect(bx, by, Math.ceil(barW * ratio), barH);
  }

  _renderParkBar(ctx, cx, cy) {
    const barW = 12;
    const barH = 2;
    const bx = cx + (this.w - barW) / 2;
    const by = cy - 4;
    const ratio = Math.max(0, this.parkTimer / this.totalParkDuration);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(bx, by, barW, barH);

    if (this.assignedFacility && this.assignedFacility.type === 'carwash') {
      // Washing progress bar in vibrant water-blue with bubble indicator
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(bx, by, Math.ceil(barW * (1 - ratio)), barH);

      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(bx + barW + 1, by, 2, 2);
    } else if (this.assignedFacility && this.assignedFacility.type === 'fuel') {
      // Fuel pumping progress bar in vibrant amber
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(bx, by, Math.ceil(barW * (1 - ratio)), barH);

      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(bx + barW + 1, by, 2, 2);
    } else {
      ctx.fillStyle = '#38bdf8'; // Sky blue progress for parking rental
      ctx.fillRect(bx, by, Math.ceil(barW * ratio), barH);
    }
  }

  _renderAngryEmote(ctx, cx, cy) {
    // Red exclamation mark or anger icon
    ctx.save();
    ctx.font = '5px "Press Start 2P"';
    ctx.fillStyle = '#ef4444';
    ctx.textAlign = 'center';
    ctx.fillText('!', cx + this.w / 2, cy - 3);
    ctx.restore();
  }

  /** Check if game-pixel point is inside this car */
  containsPoint(px, py) {
    if (this.state === CarState.LEAVING || this.state === CarState.GONE) {
      return false;
    }

    // WAITING cars in queue: cannot be selected if expired or angry
    if (this.state === CarState.WAITING && (this.patience <= 0 || this.angry)) {
      return false;
    }

    // Only WAITING, NEEDS_REFUEL, and STAGED are selectable
    // Crucially: NEEDS_REFUEL cars REMAIN selectable even when angry and stacking negative combo!
    const isSelectable = (
      this.state === CarState.WAITING ||
      this.state === CarState.NEEDS_REFUEL ||
      this.state === CarState.STAGED
    );
    if (!isSelectable) {
      return false;
    }

    const pad = 3;
    return px >= this.x - pad && px <= this.x + this.w + pad &&
           py >= this.y - pad && py <= this.y + this.h + pad;
  }
}
