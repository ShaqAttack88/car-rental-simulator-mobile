// ============================================================
// LevelConfig.js — One-Way Traffic Circuit & Expansion Spots
// ============================================================

// Queue spots on the LEFT side (x = 45) flowing DOWNWARD
const STANDARD_QUEUE_POSITIONS = [
  { x: 45, y: 96, inLot: true  }, // Index 0: Front booth stop line
  { x: 45, y: 78, inLot: true  }, // Index 1: In lot
  { x: 45, y: 60, inLot: true  }, // Index 2: In lot
  { x: 45, y: 42, inLot: true  }, // Index 3: In lot entrance
  { x: 25, y: 16, inLot: false }, // Index 4: On road waiting line
  { x: 8,  y: 16, inLot: false }, // Index 5: On road waiting line
];

export const LEVELS = {
  1: {
    levelNumber: 1,
    title: 'Car Rental Branch',
    subtitle: 'One-Way Circuit',
    spawnInterval: [3, 5],
    maxQueueSize: 6,
    carPatience: 16,
    parkDuration: [7, 10],
    scorePerPark: 50,
    patiencePenalty: -25,

    roadY: 12,
    roadHeight: 18,
    entranceX: 45,               // Left side entrance
    entranceY: 42,
    exitX: 195,                  // Right side dedicated exit off-screen
    exitY: 138,                  // Outbound exit driveway height

    queuePositions: STANDARD_QUEUE_POSITIONS,

    officeX: 75,
    officeY: 34,

    // Initial facilities at start (Row 1 bays on left + Car Wash + Fuel Station)
    facilities: [
      { type: 'parking',          x: 16,  y: 165 }, // Row 1 Bay 1 (left)
      { type: 'parking',          x: 34,  y: 165 }, // Row 1 Bay 2 (middle-left)
      { type: 'parking',          x: 52,  y: 165 }, // Row 1 Bay 3 (stacked right of bay 2)
      { type: 'waiting',          x: 116, y: 42  }, // 1 Neutral waiting bay next to office
      { type: 'carwash_building', x: 2,   y: 260 }, // Car wash building kiosk
      { type: 'carwash',          x: 24,  y: 260 }, // Car Wash Bay 1 (Initial)
      { type: 'fuel_building',    x: 94,  y: 260 }, // Fuel Station building kiosk
      { type: 'fuel',             x: 116, y: 260 }, // Refueling Bay 1 (Initial)
    ],

    // Available expansion plots across the branch (extended up to 4 bays each!)
    expansionSpots: [
      // 1. Car Wash Extensions (extendable to 4 bays!)
      { type: 'carwash', x: 40, y: 260, cost: 160 }, // Car Wash Bay 2
      { type: 'carwash', x: 56, y: 260, cost: 200 }, // Car Wash Bay 3
      { type: 'carwash', x: 72, y: 260, cost: 250 }, // Car Wash Bay 4

      // 2. Refueling Station Extensions (extendable to 4 bays!)
      { type: 'fuel',    x: 132, y: 260, cost: 160 }, // Refueling Bay 2
      { type: 'fuel',    x: 148, y: 260, cost: 200 }, // Refueling Bay 3
      { type: 'fuel',    x: 164, y: 260, cost: 250 }, // Refueling Bay 4

      // 3. Row 1 future bays (continuing to the right of starting 3 bays)
      { type: 'parking', x: 70,  y: 165, cost: 120 }, // Row 1 slot 4
      { type: 'parking', x: 88,  y: 165, cost: 150 }, // Row 1 slot 5
      { type: 'parking', x: 106, y: 165, cost: 180 }, // Row 1 slot 6
      { type: 'parking', x: 124, y: 165, cost: 220 }, // Row 1 slot 7
      { type: 'parking', x: 142, y: 165, cost: 260 }, // Row 1 slot 8

      // 4. Service expansion bays
      { type: 'waiting', x: 136, y: 42,  cost: 150 }, // Extra waiting bay next to office

      // 5. Row 2 future bays
      { type: 'parking', x: 16,  y: 215, cost: 200 }, // Row 2 slot 1
      { type: 'parking', x: 34,  y: 215, cost: 220 }, // Row 2 slot 2
      { type: 'parking', x: 52,  y: 215, cost: 240 }, // Row 2 slot 3
      { type: 'parking', x: 70,  y: 215, cost: 260 }, // Row 2 slot 4
      { type: 'parking', x: 88,  y: 215, cost: 280 }, // Row 2 slot 5
      { type: 'parking', x: 106, y: 215, cost: 310 }, // Row 2 slot 6
      { type: 'parking', x: 124, y: 215, cost: 350 }, // Row 2 slot 7
      { type: 'parking', x: 142, y: 215, cost: 400 }, // Row 2 slot 8
    ],
  },
};
