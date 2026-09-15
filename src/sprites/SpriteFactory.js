// ============================================================
// SpriteFactory.js — Programmatic pixel-art sprite generator
// ============================================================

export class SpriteFactory {
  constructor() {
    this._cache = {};
    this._generateAll();
  }

  get(name) {
    return this._cache[name];
  }

  _generateAll() {
    // Cars in 5 colours (top-down view, 10×16 px)
    const carColours = {
      red:    { body: '#e53e3e', dark: '#c53030', roof: '#fc8181' },
      blue:   { body: '#3182ce', dark: '#2b6cb0', roof: '#90cdf4' },
      yellow: { body: '#ecc94b', dark: '#d69e2e', roof: '#fefcbf' },
      green:  { body: '#38a169', dark: '#2f855a', roof: '#9ae6b4' },
      white:  { body: '#e2e8f0', dark: '#cbd5e1', roof: '#f7fafc' },
    };
    for (const [name, pal] of Object.entries(carColours)) {
      this._cache[`car_${name}`] = this._makeCar(pal);
    }

    // Parking bay: normal, highlighted, occupied
    this._cache.bay_free = this._makeParkingBay('#ffffff', '#1a1a2e');
    this._cache.bay_highlight = this._makeParkingBay('#4ade80', '#0f3d1f');
    this._cache.bay_occupied = this._makeParkingBay('#64748b', '#1a1a2e');

    // Buildings
    this._cache.office = this._makeOffice();
    this._cache.carwash = this._makeCarWash();
    this._cache.fuelstation = this._makeFuelStation();

    // Patience bar frames
    this._cache.patience_bg = this._makeBar(16, 3, '#1e293b');
  }

  // --- Car (top-down, facing DOWN, 10w × 16h) ---
  _makeCar(pal) {
    const w = 10, h = 16;
    const c = this._createCanvas(w, h);
    const d = c.getContext('2d');

    // Body outline / shadow
    d.fillStyle = '#111';
    d.fillRect(1, 1, 8, 14);

    // Main body
    d.fillStyle = pal.body;
    d.fillRect(2, 2, 6, 12);

    // Darker sides
    d.fillStyle = pal.dark;
    d.fillRect(2, 2, 1, 12);
    d.fillRect(7, 2, 1, 12);

    // Roof / windshield area
    d.fillStyle = '#4a5568';
    d.fillRect(3, 3, 4, 3); // rear window
    d.fillStyle = '#63b3ed';
    d.fillRect(3, 10, 4, 3); // front windshield

    // Wheels
    d.fillStyle = '#1a202c';
    d.fillRect(1, 3, 1, 3);  // rear-left
    d.fillRect(8, 3, 1, 3);  // rear-right
    d.fillRect(1, 10, 1, 3); // front-left
    d.fillRect(8, 10, 1, 3); // front-right

    // Headlights
    d.fillStyle = '#fefcbf';
    d.fillRect(3, 14, 1, 1);
    d.fillRect(6, 14, 1, 1);

    // Taillights
    d.fillStyle = '#fc8181';
    d.fillRect(3, 1, 1, 1);
    d.fillRect(6, 1, 1, 1);

    return c;
  }

  // --- Parking Bay (14w × 18h) ---
  _makeParkingBay(lineColour, fillColour) {
    const w = 14, h = 18;
    const c = this._createCanvas(w, h);
    const d = c.getContext('2d');

    // Fill
    d.fillStyle = fillColour;
    d.fillRect(0, 0, w, h);

    // White outline (top-left-right-bottom)
    d.fillStyle = lineColour;
    // Top
    d.fillRect(0, 0, w, 1);
    // Bottom
    d.fillRect(0, h - 1, w, 1);
    // Left
    d.fillRect(0, 0, 1, h);
    // Right
    d.fillRect(w - 1, 0, 1, h);

    // Small "P" indicator in centre
    d.fillStyle = lineColour;
    d.globalAlpha = 0.3;
    // P letter (crude pixel)
    d.fillRect(5, 6, 1, 6);  // vertical stroke
    d.fillRect(6, 6, 3, 1);  // top
    d.fillRect(8, 7, 1, 2);  // right of top
    d.fillRect(6, 9, 2, 1);  // middle
    d.globalAlpha = 1.0;

    return c;
  }

  // --- Office building (40w × 24h) ---
  _makeOffice() {
    const w = 40, h = 24;
    const c = this._createCanvas(w, h);
    const d = c.getContext('2d');

    // Wall
    d.fillStyle = '#cbd5e1';
    d.fillRect(0, 4, w, h - 4);

    // Roof
    d.fillStyle = '#475569';
    d.fillRect(0, 0, w, 6);
    d.fillStyle = '#334155';
    d.fillRect(0, 4, w, 2);

    // Door
    d.fillStyle = '#1e40af';
    d.fillRect(17, 12, 6, 12);
    d.fillStyle = '#93c5fd';
    d.fillRect(18, 13, 4, 6); // glass

    // Windows
    d.fillStyle = '#bfdbfe';
    d.fillRect(4, 10, 5, 5);
    d.fillRect(31, 10, 5, 5);
    // Window frames
    d.fillStyle = '#64748b';
    d.fillRect(6, 10, 1, 5);
    d.fillRect(33, 10, 1, 5);

    // Sign "RENT" on roof
    d.fillStyle = '#f59e0b';
    d.fillRect(12, 1, 16, 3);
    d.fillStyle = '#111';
    // R
    d.fillRect(13, 1, 1, 3);
    d.fillRect(14, 1, 2, 1);
    d.fillRect(14, 2, 2, 1);
    // E
    d.fillRect(17, 1, 1, 3);
    d.fillRect(18, 1, 2, 1);
    d.fillRect(18, 2, 1, 1);
    d.fillRect(18, 3, 2, 1);
    // N
    d.fillRect(21, 1, 1, 3);
    d.fillRect(22, 2, 1, 1);
    d.fillRect(23, 1, 1, 3);
    // T
    d.fillRect(25, 1, 3, 1);
    d.fillRect(26, 2, 1, 2);

    return c;
  }

  // --- Car Wash (24w × 20h) ---
  _makeCarWash() {
    const w = 24, h = 20;
    const c = this._createCanvas(w, h);
    const d = c.getContext('2d');

    // Main building
    d.fillStyle = '#60a5fa';
    d.fillRect(0, 4, w, h - 4);

    // Roof
    d.fillStyle = '#1e40af';
    d.fillRect(0, 0, w, 6);

    // Entrance (dark opening)
    d.fillStyle = '#0f172a';
    d.fillRect(3, 8, 18, 12);

    // Roller brushes (vertical stripes)
    d.fillStyle = '#f87171';
    d.fillRect(5, 8, 2, 10);
    d.fillStyle = '#fbbf24';
    d.fillRect(11, 8, 2, 10);
    d.fillStyle = '#34d399';
    d.fillRect(17, 8, 2, 10);

    // Water drops
    d.fillStyle = '#93c5fd';
    d.fillRect(8, 1, 1, 2);
    d.fillRect(12, 2, 1, 1);
    d.fillRect(16, 1, 1, 2);

    // "WASH" label
    d.fillStyle = '#fff';
    d.fillRect(6, 5, 1, 1);
    d.fillRect(8, 5, 1, 1);
    d.fillRect(7, 6, 1, 1);
    // just a decorative wave to keep it small

    return c;
  }

  // --- Fuel Station (22w × 20h) ---
  _makeFuelStation() {
    const w = 22, h = 20;
    const c = this._createCanvas(w, h);
    const d = c.getContext('2d');

    // Canopy roof
    d.fillStyle = '#ef4444';
    d.fillRect(0, 0, w, 4);
    // Canopy supports (pillars)
    d.fillStyle = '#94a3b8';
    d.fillRect(2, 4, 2, 6);
    d.fillRect(w - 4, 4, 2, 6);

    // Ground pad
    d.fillStyle = '#334155';
    d.fillRect(0, 10, w, h - 10);

    // Fuel pump (centre)
    d.fillStyle = '#e2e8f0';
    d.fillRect(8, 8, 6, 8);
    // Pump screen
    d.fillStyle = '#0f172a';
    d.fillRect(9, 9, 4, 3);
    // Nozzle
    d.fillStyle = '#1a202c';
    d.fillRect(14, 10, 3, 1);
    d.fillRect(16, 10, 1, 4);

    // Price display on pump
    d.fillStyle = '#4ade80';
    d.fillRect(10, 10, 2, 1);

    // Fuel icon (drop shape on canopy)
    d.fillStyle = '#fbbf24';
    d.fillRect(10, 1, 2, 2);
    d.fillRect(11, 0, 1, 1);

    return c;
  }

  // --- Utility bar ---
  _makeBar(w, h, colour) {
    const c = this._createCanvas(w, h);
    const d = c.getContext('2d');
    d.fillStyle = colour;
    d.fillRect(0, 0, w, h);
    return c;
  }

  _createCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }
}
