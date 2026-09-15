// ============================================================
// DragHandler.js — Touch/mouse drag-to-assign interaction
// ============================================================

import { CarState } from '../cars/CarState.js';

export class DragHandler {
  /** @param {import('../engine/Game').Game} game */
  constructor(game) {
    this.game = game;

    /** @type {import('../cars/CarController').CarController|null} */
    this.selectedCar = null;
    this.isDragging = false;

    // Tap-tap mode: first tap selects car, second tap selects facility
    this.tapSelectMode = false;
  }

  _isValidSelectedCar(car) {
    if (!car) return false;
    if (car.state === CarState.LEAVING || car.state === CarState.GONE) return false;

    // Queue cars: cannot be selected if expired or angry
    if (car.state === CarState.WAITING) {
      return car.patience > 0 && !car.angry;
    }

    // NEEDS_REFUEL / service cars: ALWAYS valid (cannot leave until all services complete!)
    if (car.state === CarState.NEEDS_REFUEL || car.needsFuel || car.needsWash) {
      return true;
    }

    // STAGED cars: valid as long as not angry
    if (car.state === CarState.STAGED) {
      return !car.angry;
    }

    return false;
  }

  update(dt) {
    const input = this.game.input;
    const level = this.game.level;
    const highlighter = this.game.highlighter;

    // Immediately cancel selection if car started leaving, lost patience, or became angry
    if (this.selectedCar && !this._isValidSelectedCar(this.selectedCar)) {
      this._deselect();
    }

    // --- POINTER DOWN: Select a waiting car, service car, or staged car ---
    if (input.justPressed) {
      if (!this.selectedCar) {
        const car = this._findSelectableCarAt(input.pos.x, input.pos.y);
        if (car) {
          this.selectedCar = car;
          this.selectedCar.selected = true;
          this.isDragging = true;
          highlighter.showHighlights(input.pos.x, input.pos.y, this.selectedCar);
        }
      } else if (this.tapSelectMode) {
        // Second tap — check if pointer is on an eligible facility or exit
        const facility = highlighter.getFacilityAtPoint(input.pos.x, input.pos.y, this.selectedCar);
        if (facility && this._isValidSelectedCar(this.selectedCar)) {
          this._assignCarToFacility(this.selectedCar, facility);
        } else if (input.pos.x >= 160 && input.pos.y >= 115 && input.pos.y <= 160) {
          if (this.selectedCar.state === CarState.NEEDS_REFUEL || this.selectedCar.needsFuel || this.selectedCar.needsWash) {
            // Cars waiting for services CANNOT leave!
            if (this.game.sound) this.game.sound.playHorn();
            if (this.game.floatingText) {
              const msg = this.selectedCar.needsWash && this.selectedCar.needsFuel
                ? 'NEED WASH & FUEL!'
                : (this.selectedCar.needsWash ? 'NEED WASH FIRST!' : 'NEED FUEL FIRST!');
              this.game.floatingText.spawn(msg, this.selectedCar.x + 5, this.selectedCar.y - 10, '#ef4444');
            }
          } else if (this.selectedCar.state === CarState.STAGED) {
            this._dismissStagedCar(this.selectedCar);
          }
        }
        this._deselect();
      }
    }

    // --- POINTER MOVE: Update highlights ---
    if (this.isDragging && input.isDown && this.selectedCar) {
      highlighter.showHighlights(input.pos.x, input.pos.y, this.selectedCar);
    }

    // --- POINTER UP: Assign or cancel ---
    if (input.justReleased && this.selectedCar && this.isDragging) {
      const facility = highlighter.getFacilityAtPoint(input.pos.x, input.pos.y, this.selectedCar);

      if (facility && this._isValidSelectedCar(this.selectedCar)) {
        // Drag released on a valid facility
        this._assignCarToFacility(this.selectedCar, facility);
        this._deselect();
      } else if (input.pos.x >= 160 && input.pos.y >= 115 && input.pos.y <= 160) {
        if (this.selectedCar.state === CarState.NEEDS_REFUEL || this.selectedCar.needsFuel || this.selectedCar.needsWash) {
          // Cars waiting for services CANNOT leave!
          if (this.game.sound) this.game.sound.playHorn();
          if (this.game.floatingText) {
            const msg = this.selectedCar.needsWash && this.selectedCar.needsFuel
              ? 'NEED WASH & FUEL!'
              : (this.selectedCar.needsWash ? 'NEED WASH FIRST!' : 'NEED FUEL FIRST!');
            this.game.floatingText.spawn(msg, this.selectedCar.x + 5, this.selectedCar.y - 10, '#ef4444');
          }
        } else if (this.selectedCar.state === CarState.STAGED) {
          this._dismissStagedCar(this.selectedCar);
        }
        this._deselect();
      } else {
        // Check if this was a quick tap (no significant drag)
        const dragDist = this._distance(input.dragStartPos, input.pos);
        if (dragDist < 6) {
          // Tap-select mode
          this.isDragging = false;
          this.tapSelectMode = true;
          highlighter.showHighlights(input.pos.x, input.pos.y, this.selectedCar);
        } else {
          // Drag released on empty space
          this._deselect();
        }
      }
    }
  }

  _dismissStagedCar(car) {
    if (!car || car.state !== CarState.STAGED) return;
    if (car.needsFuel || car.needsWash) {
      if (this.game.sound) this.game.sound.playHorn();
      if (this.game.floatingText) {
        this.game.floatingText.spawn('CANT LEAVE: NEED SERVICE!', car.x + 5, car.y - 10, '#ef4444');
      }
      return;
    }
    if (car.assignedFacility) {
      car.assignedFacility.releaseCar();
      car.assignedFacility = null;
    }
    const exitWP = this.game.level._buildExitPath(car);
    car.startLeaving(exitWP);
    if (this.game.sound) this.game.sound.playClick();
    if (this.game.floatingText) {
      this.game.floatingText.spawn('LEAVING', car.x + 5, car.y - 6, '#94a3b8');
    }
  }

  _findSelectableCarAt(px, py) {
    // 1. Check waiting cars in queue
    const waitingCars = this.game.level.queue.getWaitingCars();
    for (const car of waitingCars) {
      if (car.state === CarState.WAITING && car.patience > 0 && !car.angry && car.containsPoint(px, py)) {
        return car;
      }
    }

    // 2. Check active cars (staged in waiting bays, or needing service in parking/wash/fuel bays)
    for (const car of this.game.level.activeCars) {
      const isEligible = (
        car.state === CarState.NEEDS_REFUEL ||
        car.needsFuel ||
        car.needsWash ||
        (car.state === CarState.STAGED && !car.angry)
      );
      if (isEligible && car.containsPoint(px, py)) {
        return car;
      }
    }

    return null;
  }

  _assignCarToFacility(car, facility) {
    if (!this._isValidSelectedCar(car)) return;

    const level = this.game.level;

    if (car.state === CarState.WAITING) {
      // 1. Assigning incoming car from queue to parking or waiting bay
      level.queue.remove(car);
      const entry = facility.getEntryPoint();
      const waypoints = this._buildPath(car, entry);
      car.assignTo(facility, waypoints);
      level.activeCars.push(car);
    } else if (car.state === CarState.STAGED) {
      // 2. Dispatching car from neutral waiting bay to parking bay, wash bay, or fuel bay
      if (car.assignedFacility) {
        car.assignedFacility.releaseCar();
        car.assignedFacility = null;
      }
      const entry = facility.getEntryPoint();
      const waypoints = this._buildStagedToFacilityPath(car, entry);
      car._scored = false;
      car.assignTo(facility, waypoints);
    } else {
      // 3. Assigning car needing service (wash or fuel) from its bay
      if (car.assignedFacility) {
        car.assignedFacility.releaseCar();
        car.assignedFacility = null;
      }

      const entry = facility.getEntryPoint();
      const waypoints = facility.type === 'waiting'
        ? this._buildBayToWaitingPath(car, entry)
        : this._buildBayToFuelPath(car, entry);

      car._scored = false;
      car.assignTo(facility, waypoints);
    }

    // Audio feedback
    if (this.game.sound) {
      this.game.sound.playClick();
    }
  }

  /** Path from queue down inbound driveway to facility */
  _buildPath(car, target) {
    const waypoints = [];
    const inboundLaneY = 114;

    if (Math.abs(car.y - inboundLaneY) > 2) {
      waypoints.push({ x: car.x, y: inboundLaneY });
    }
    if (Math.abs(car.x - target.x) > 2) {
      waypoints.push({ x: target.x, y: inboundLaneY });
    }
    waypoints.push({ x: target.x, y: target.y });
    return waypoints;
  }

  /** Path from staged waiting bay down into driveway corridor to destination facility */
  _buildStagedToFacilityPath(car, target) {
    const waypoints = [];
    const inboundLaneY = 114;

    // 1. Drive down out of waiting bay into driveway corridor
    waypoints.push({ x: car.x, y: inboundLaneY });

    // 2. Drive across corridor toward target column
    if (Math.abs(car.x - target.x) > 2) {
      waypoints.push({ x: target.x, y: inboundLaneY });
    }

    // 3. Drive straight into target facility
    waypoints.push({ x: target.x, y: target.y });
    return waypoints;
  }

  /** Path from parking bay up to waiting bay */
  _buildBayToWaitingPath(car, target) {
    const waypoints = [];
    const aisleY = car.y < 190 ? 198 : 242;
    const drivewayY = 114;

    waypoints.push({ x: car.x, y: aisleY });
    waypoints.push({ x: 168, y: aisleY });
    waypoints.push({ x: 168, y: drivewayY });
    waypoints.push({ x: target.x, y: drivewayY });
    waypoints.push({ x: target.x, y: target.y });
    return waypoints;
  }

  /** Clean path from parking bay across aisles to refueling bay */
  _buildBayToFuelPath(car, target) {
    const waypoints = [];
    // Lower aisle or middle aisle depending on car starting row
    const aisleY = car.y < 190 ? 198 : 242;

    // 1. Pull down out of bay into driving aisle
    waypoints.push({ x: car.x, y: aisleY });

    // 2. Drive across aisle towards refuel bay column
    if (Math.abs(car.x - target.x) > 2) {
      waypoints.push({ x: target.x, y: aisleY });
    }

    // 3. Drive straight into the refuel bay
    waypoints.push({ x: target.x, y: target.y });
    return waypoints;
  }

  _deselect() {
    if (this.selectedCar) {
      this.selectedCar.selected = false;
    }
    this.selectedCar = null;
    this.isDragging = false;
    this.tapSelectMode = false;
    this.game.highlighter.clearHighlights();
  }

  _distance(a, b) {
    if (!a || !b) return 0;
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  render(ctx) {
    if (!this.selectedCar || !this.isDragging) return;

    // Draw a dashed indicator line from selected car to pointer
    const input = this.game.input;
    const cx = Math.floor(this.selectedCar.x + this.selectedCar.w / 2);
    const cy = Math.floor(this.selectedCar.y + this.selectedCar.h / 2);
    const px = Math.floor(input.pos.x);
    const py = Math.floor(input.pos.y);

    // Simple dotted line
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.6)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(px, py);
    ctx.stroke();
    ctx.setLineDash([]);

    // Small circle at pointer
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(px - 1, py - 1, 3, 3);
  }
}
