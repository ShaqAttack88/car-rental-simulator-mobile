// ============================================================
// CarSpawner.js — Periodic car spawning onto public road
// ============================================================

import { CarController } from './CarController.js';

export class CarSpawner {
  /**
   * @param {import('../sprites/SpriteFactory').SpriteFactory} sprites
   * @param {import('./CarQueue').CarQueue} queue
   * @param {{entranceX: number, entranceY: number, roadY: number}} config
   */
  constructor(sprites, queue, config, level = null) {
    this.sprites = sprites;
    this.queue = queue;
    this.config = config;
    this.level = level;

    this.spawnTimer = 0;
    this.minInterval = 3;
    this.maxInterval = 5;
    this.spawnInterval = 3.5;
    this.nextId = 1;

    this._randomiseInterval();
  }

  _randomiseInterval() {
    this.spawnInterval = this.minInterval + Math.random() * (this.maxInterval - this.minInterval);
    this.spawnTimer = 0;
  }

  update(dt) {
    this.spawnTimer += dt;

    if (this.spawnTimer >= this.spawnInterval && !this.queue.isFull) {
      this._spawnCar();
      this._randomiseInterval();
    }
  }

  _spawnCar() {
    const car = new CarController(this.nextId++, this.sprites);
    car.level = this.level;
    if (this.carPatience) {
      car.maxPatience = this.carPatience;
      car.patience = this.carPatience;
    }

    // Start off-screen left on the road
    car.x = -16;
    car.y = this.config.roadY + 4;
    car.facing = 'right';

    // Directly hand over to queue management — avoids any desync or pileups
    this.queue.enqueue(car);
  }

  render(ctx) {
    // Car queue handles all car rendering
  }
}
