// ============================================================
// Highlighter.js — Highlight valid facility destinations
// ============================================================

import { CarState } from '../cars/CarState.js';

export class Highlighter {
  constructor() {
    /** @type {import('../facilities/FacilityBase').FacilityBase[]} */
    this.facilities = [];
  }

  setFacilities(facilities) {
    this.facilities = facilities;
  }

  /** Check if a facility is eligible for the given car */
  _isFacilityEligible(f, car) {
    if (!f.canAccept()) return false;
    if (!car) return true;

    // Incoming cars from queue: can go to parking bay or neutral waiting bay
    if (car.state === CarState.WAITING) {
      return f.type === 'parking' || f.type === 'waiting';
    }

    // Cars resting in neutral waiting bay:
    if (car.state === CarState.STAGED) {
      if (car.needsWash && car.needsFuel) return f.type === 'carwash' || f.type === 'fuel';
      if (car.needsWash) return f.type === 'carwash';
      if (car.needsFuel) return f.type === 'fuel';
      return f.type === 'parking';
    }

    // Cars needing services (refueling, car wash, or both):
    if (car.state === CarState.NEEDS_REFUEL || car.needsFuel || car.needsWash) {
      if (f.type === 'waiting') return true; // Can always hold in waiting bay
      if (f.type === 'carwash' && car.needsWash) return true;
      if (f.type === 'fuel' && car.needsFuel) return true;
      return false;
    }

    return false;
  }

  /** Show highlights on all available facilities matching car requirements */
  showHighlights(pointerX, pointerY, car = null) {
    for (const f of this.facilities) {
      if (this._isFacilityEligible(f, car)) {
        f.highlighted = true;
        f.hoverHighlight = f.containsPoint(pointerX, pointerY);
      } else {
        f.highlighted = false;
        f.hoverHighlight = false;
      }
    }
  }

  /** Clear all highlights */
  clearHighlights() {
    for (const f of this.facilities) {
      f.highlighted = false;
      f.hoverHighlight = false;
    }
  }

  /** Find the eligible facility under the pointer that can accept this car */
  getFacilityAtPoint(px, py, car = null) {
    for (const f of this.facilities) {
      if (this._isFacilityEligible(f, car) && f.containsPoint(px, py)) {
        return f;
      }
    }
    return null;
  }
}
