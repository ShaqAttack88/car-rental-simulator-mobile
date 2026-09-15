// ============================================================
// PixelCanvas.js — Low-res pixel canvas with nearest-neighbour scaling
// ============================================================

export class PixelCanvas {
  /** @param {HTMLCanvasElement} displayCanvas */
  constructor(displayCanvas, gameWidth = 180, gameHeight = 320) {
    this.display = displayCanvas;
    this.displayCtx = displayCanvas.getContext('2d');

    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;

    // Off-screen low-res canvas where all game art is drawn
    this.buffer = document.createElement('canvas');
    this.buffer.width = gameWidth;
    this.buffer.height = gameHeight;
    this.ctx = this.buffer.getContext('2d');

    // Scale / offset for mapping screen coords → game coords
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;

    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  /** Resize display canvas to fill window and compute scale */
  _resize() {
    const dpr = window.devicePixelRatio || 1;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    this.display.style.width = screenW + 'px';
    this.display.style.height = screenH + 'px';
    this.display.width = screenW * dpr;
    this.display.height = screenH * dpr;

    // Fit game buffer into display while preserving aspect ratio
    const ratioX = this.display.width / this.gameWidth;
    const ratioY = this.display.height / this.gameHeight;
    this.scale = Math.floor(Math.min(ratioX, ratioY)) || 1;

    // Centre the game area on screen
    this.offsetX = Math.floor((this.display.width - this.gameWidth * this.scale) / 2);
    this.offsetY = Math.floor((this.display.height - this.gameHeight * this.scale) / 2);
  }

  /** Convert screen/touch coordinates to game-pixel coordinates */
  screenToGame(screenX, screenY) {
    const dpr = window.devicePixelRatio || 1;
    const px = screenX * dpr;
    const py = screenY * dpr;
    return {
      x: Math.floor((px - this.offsetX) / this.scale),
      y: Math.floor((py - this.offsetY) / this.scale),
    };
  }

  /** Clear the low-res buffer */
  clear() {
    this.ctx.clearRect(0, 0, this.gameWidth, this.gameHeight);
  }

  /** Blit the low-res buffer onto the high-res display canvas */
  present() {
    this.displayCtx.imageSmoothingEnabled = false;
    // Black letterbox background
    this.displayCtx.fillStyle = '#000';
    this.displayCtx.fillRect(0, 0, this.display.width, this.display.height);
    // Scale up the pixel buffer
    this.displayCtx.drawImage(
      this.buffer,
      this.offsetX, this.offsetY,
      this.gameWidth * this.scale, this.gameHeight * this.scale
    );
  }

  /** Get the low-res drawing context */
  getContext() {
    return this.ctx;
  }
}
