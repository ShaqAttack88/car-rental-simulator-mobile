// ============================================================
// CarQueue.js — Orderly queue management (lot & road queuing)
// ============================================================

import { CarState } from './CarState.js';

export class CarQueue {
  /**
   * @param {number} maxSize
   * @param {{x:number, y:number, inLot?:boolean}[]} queuePositions
   * @param {number} roadY
   * @param {number} entranceX
   */
  constructor(maxSize, queuePositions, roadY = 16, entranceX = 85) {
    this.maxSize = maxSize;
    this.queuePositions = queuePositions;
    this.roadY = roadY;
    this.entranceX = entranceX;

    /** @type {import('./CarController').CarController[]} */
    this.cars = [];
  }

  get length() { return this.cars.length; }
  get isFull() { return this.cars.length >= this.maxSize; }

  /** Add a new approaching car to the end of the line */
  enqueue(car) {
    if (this.isFull) return false;

    const slotIndex = this.cars.length;
    const targetSlot = this.queuePositions[slotIndex];
    if (!targetSlot) return false;

    this.cars.push(car);

    // Build entering path to this slot
    const waypoints = this._buildPathToSlot(car, targetSlot);
    car.setPath(waypoints);
    car.state = CarState.APPROACHING;

    return true;
  }

  /** Remove car from queue (e.g. when assigned to bay or leaving) */
  remove(car) {
    const idx = this.cars.indexOf(car);
    if (idx === -1) return;
    this.cars.splice(idx, 1);

    // Orderly shuffle forward: each remaining car advances to fill open spots
    this._advanceQueue();
  }

  /** Get all waiting cars that are inside the branch and ready to be assigned */
  getWaitingCars() {
    return this.cars.filter(c => c.state === CarState.WAITING && c.y >= 35);
  }

  /** Move all cars forward to their updated slot index */
  _advanceQueue() {
    for (let i = 0; i < this.cars.length; i++) {
      const car = this.cars[i];
      const targetSlot = this.queuePositions[i];
      if (!targetSlot) continue;

      // Only give new path if car is not already at or heading to targetSlot
      const currentDest = car.waypoints[car.waypoints.length - 1];
      const isAlreadyTargeting = currentDest &&
        Math.abs(currentDest.x - targetSlot.x) < 2 &&
        Math.abs(currentDest.y - targetSlot.y) < 2;

      if (!isAlreadyTargeting) {
        const waypoints = this._buildPathToSlot(car, targetSlot);
        car.setPath(waypoints);
      }
    }
  }

  /**
   * Build waypoints from car's current position to a designated queue slot
   * Ensures cars follow road first, then turn into entrance, without cutting corners
   */
  _buildPathToSlot(car, slot) {
    const waypoints = [];
    const roadY = this.roadY;
    const entranceX = this.entranceX;

    if (slot.inLot) {
      // Slot is inside the branch (y >= 42)
      if (car.y < 25) {
        // Car is currently on the road: drive to entrance, then turn down into slot
        if (Math.abs(car.x - entranceX) > 2) {
          waypoints.push({ x: entranceX, y: roadY });
        }
        waypoints.push({ x: entranceX, y: slot.y });
      } else {
        // Car is already inside the branch: drive straight forward down to slot
        waypoints.push({ x: entranceX, y: slot.y });
      }
    } else {
      // Slot is on the public road (waiting line before turn)
      waypoints.push({ x: slot.x, y: roadY });
    }

    return waypoints;
  }

  /** Update all queued cars; return expired cars that ran out of patience */
  update(dt) {
    const expired = [];

    // 1. Update each car
    for (let i = 0; i < this.cars.length; i++) {
      this.cars[i].update(dt);
    }

    // 2. Check for patience expiry
    for (let i = this.cars.length - 1; i >= 0; i--) {
      const car = this.cars[i];
      if (car.state === CarState.WAITING && car.patience <= 0) {
        expired.push(car);
        this.cars.splice(i, 1);
      }
    }

    // 3. Advance line if any cars left due to impatience
    if (expired.length > 0) {
      this._advanceQueue();
    }

    return expired;
  }
}
