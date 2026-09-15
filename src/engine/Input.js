// ============================================================
// Input.js — Unified touch + mouse input handler
// ============================================================

export class Input {
  /** @param {HTMLCanvasElement} canvas @param {import('./PixelCanvas').PixelCanvas} pixelCanvas */
  constructor(canvas, pixelCanvas) {
    this.canvas = canvas;
    this.pixelCanvas = pixelCanvas;

    // Current state
    this.isDown = false;
    this.justPressed = false;
    this.justReleased = false;
    this.pos = { x: 0, y: 0 };       // game-pixel coords
    this.screenPos = { x: 0, y: 0 };  // raw screen coords
    this.dragStartPos = null;

    this._bindEvents();
  }

  _bindEvents() {
    const c = this.canvas;

    // Prevent iOS default touch behaviours
    c.addEventListener('touchstart', (e) => { e.preventDefault(); this._onDown(e.touches[0]); }, { passive: false });
    c.addEventListener('touchmove',  (e) => { e.preventDefault(); this._onMove(e.touches[0]); }, { passive: false });
    c.addEventListener('touchend',   (e) => { e.preventDefault(); this._onUp(); }, { passive: false });
    c.addEventListener('touchcancel',(e) => { e.preventDefault(); this._onUp(); }, { passive: false });

    // Mouse for desktop testing
    c.addEventListener('mousedown', (e) => this._onDown(e));
    c.addEventListener('mousemove', (e) => this._onMove(e));
    c.addEventListener('mouseup',   (e) => this._onUp());

    // Prevent context menu on long-press
    c.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  _toGameCoords(clientX, clientY) {
    return this.pixelCanvas.screenToGame(clientX, clientY);
  }

  _onDown(e) {
    this.screenPos = { x: e.clientX, y: e.clientY };
    this.pos = this._toGameCoords(e.clientX, e.clientY);
    this.isDown = true;
    this.justPressed = true;
    this.dragStartPos = { ...this.pos };
  }

  _onMove(e) {
    this.screenPos = { x: e.clientX, y: e.clientY };
    this.pos = this._toGameCoords(e.clientX, e.clientY);
  }

  _onUp() {
    this.isDown = false;
    this.justReleased = true;
  }

  /** Call at the END of each frame to clear one-frame flags */
  endFrame() {
    this.justPressed = false;
    this.justReleased = false;
  }
}
