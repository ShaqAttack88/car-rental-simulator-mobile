// ============================================================
// FacilityBase.js — Abstract base class for all facilities
// ============================================================

export class FacilityBase {
  /**
   * @param {string} type - 'parking', 'carwash', 'fuel', etc.
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   */
  constructor(type, x, y, w, h) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;

    this.enabled = true;       // Whether this facility accepts cars
    this.occupied = false;
    /** @type {import('../cars/CarController').CarController|null} */
    this.occupiedBy = null;
    this.highlighted = false;  // Visual highlight during drag
    this.hoverHighlight = false; // Extra emphasis when pointer directly over
  }

  /** Can this facility accept a car right now? */
  canAccept() {
    return this.enabled && !this.occupied;
  }

  /** Assign a car to this facility */
  assignCar(car) {
    this.occupied = true;
    this.occupiedBy = car;
  }

  /** Release the car from this facility */
  releaseCar() {
    this.occupied = false;
    this.occupiedBy = null;
  }

  /** World-space point the car should drive to */
  getEntryPoint() {
    return { x: this.x + (this.w - 10) / 2, y: this.y + 1 };
  }

  /** Check if a game-pixel point is inside this facility */
  containsPoint(px, py) {
    return px >= this.x && px <= this.x + this.w &&
           py >= this.y && py <= this.y + this.h;
  }

  /** Override in subclasses */
  render(ctx, sprites) { }

  /** Override in subclasses */
  renderHighlight(ctx) { }
}
