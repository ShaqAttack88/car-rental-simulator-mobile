// ============================================================
// CarState.js — Car state enum
// ============================================================

export const CarState = {
  APPROACHING: 'approaching',           // Driving along road towards entrance
  WAITING: 'waiting',                    // In queue, patience ticking
  ASSIGNED: 'assigned',                  // Destination set, about to drive
  DRIVING_TO_DESTINATION: 'drivingTo',   // Following waypoints to facility
  PARKED: 'parked',                      // At facility, timer counting
  NEEDS_REFUEL: 'needsRefuel',          // Finished rental, waiting for refuel assignment
  STAGED: 'staged',                      // Resting in neutral waiting bay, patience frozen
  LEAVING: 'leaving',                    // Driving out of lot
  GONE: 'gone',                          // Ready to be removed
};
