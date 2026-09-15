// ============================================================
// LevelManager.js — Level lifecycle, scene rendering, game loop
// ============================================================

import { LEVELS } from './LevelConfig.js';
import { CarQueue } from '../cars/CarQueue.js';
import { CarSpawner } from '../cars/CarSpawner.js';
import { CarState } from '../cars/CarState.js';
import { ParkingBay, COLOR_MAP } from '../facilities/ParkingBay.js';
import { WaitingBay } from '../facilities/WaitingBay.js';
import { CarWash } from '../facilities/CarWash.js';
import { WashBay } from '../facilities/WashBay.js';
import { FuelStation } from '../facilities/FuelStation.js';
import { FuelBay } from '../facilities/FuelBay.js';

export class LevelManager {
  /** @param {import('../engine/Game').Game} game */
  constructor(game) {
    this.game = game;

    this.currentLevelNumber = 1;
    this.config = null;
    this.score = 0;      // 1. Money ($ currency for purchasing bays)
    this.rentals = 0;    // 2. Rentals (total cars processed count)
    this.reputation = 0; // 3. Reputation (quality score from speed & combos)
    try {
      this.bestReputation = parseInt(localStorage.getItem('car_rental_best_rep') || '0', 10);
    } catch (e) {
      this.bestReputation = 0;
    }
    this.carsProcessed = 0;
    this.targetCars = 10;
    this.barrierProgress = 0;         // Exit barrier: 0 = closed, 1 = open
    this.entranceBarrierProgress = 0; // Entrance barrier: 0 = closed, 1 = open

    /** @type {import('../facilities/FacilityBase').FacilityBase[]} */
    this.facilities = [];

    /** @type {import('../cars/CarController').CarController[]} */
    this.activeCars = []; // Cars driving/parked/leaving

    this.queue = null;
    this.spawner = null;
  }

  /** Get all active & queued cars for collision detection */
  getAllCars() {
    const all = [];
    if (this.queue && this.queue.cars) {
      all.push(...this.queue.cars);
    }
    if (this.activeCars) {
      all.push(...this.activeCars);
    }
    return all;
  }

  startLevel(levelNumber = 1) {
    this.currentLevelNumber = levelNumber;
    this.config = LEVELS[levelNumber];
    if (!this.config) {
      console.warn(`Level ${levelNumber} not found, defaulting to Level 1`);
      this.currentLevelNumber = 1;
      this.config = LEVELS[1];
    }

    this.score = 0;
    this.rentals = 0;
    this.reputation = 0; // Starts at 0 for every run
    this.barrierProgress = 0;
    this.entranceBarrierProgress = 0;
    this.carsProcessed = 0;
    this.activeCars = [];
    this.availableSpots = (this.config.expansionSpots || []).map(s => ({ ...s }));

    // Create facilities from level configuration
    this.facilities = [];
    for (const fd of this.config.facilities) {
      let facility;
      switch (fd.type) {
        case 'parking':
          facility = new ParkingBay(fd.x, fd.y);
          break;
        case 'waiting':
          facility = new WaitingBay(fd.x, fd.y);
          break;
        case 'carwash':
          facility = new WashBay(fd.x, fd.y);
          break;
        case 'carwash_building':
          facility = new CarWash(fd.x, fd.y);
          break;
        case 'fuel_building':
          facility = new FuelStation(fd.x, fd.y);
          break;
        case 'fuel':
        case 'fuel_bay':
          facility = new FuelBay(fd.x, fd.y);
          break;
        default:
          continue;
      }
      this.facilities.push(facility);
    }

    // Create queue with roadY and entranceX
    this.queue = new CarQueue(
      this.config.maxQueueSize,
      this.config.queuePositions,
      this.config.roadY + 4,
      this.config.entranceX
    );

    // Create spawner (passes level for car collision awareness)
    this.spawner = new CarSpawner(this.game.sprites, this.queue, {
      entranceX: this.config.entranceX,
      entranceY: this.config.entranceY,
      roadY: this.config.roadY,
    }, this);
    this.spawner.minInterval = this.config.spawnInterval[0];
    this.spawner.maxInterval = this.config.spawnInterval[1];

    // Wire up highlighter
    this.game.highlighter.setFacilities(this.facilities);
  }

  restartCurrentLevel() {
    this.startLevel(this.currentLevelNumber);
  }

  addScore(amount) {
    this.score = Math.max(0, this.score + amount);
  }

  update(dt) {
    if (!this.config) return;

    // 1. Spawner
    this.spawner.update(dt);

    // 2. Facilities (sparkles & pulse animation updates)
    for (const facility of this.facilities) {
      if (facility.update) {
        facility.update(dt);
      }
    }

    // 3. Update queued cars
    for (const car of this.queue.cars) {
      car.update(dt);
    }

    // 4. Check for queue patience expiry
    const expired = this.queue.update(dt);
    for (const car of expired) {
      // 1. Money penalty: lost revenue / refund
      this.addScore(this.config.patiencePenalty);

      // 2. Reputation penalty: customer dissatisfaction drops reputation score
      const repLoss = 25;
      this.reputation = Math.max(0, this.reputation - repLoss);

      // Visual feedback: red floating penalty popup with money & reputation loss
      if (this.game.floatingText) {
        this.game.floatingText.spawn(`-$25  -${repLoss} REP`, car.x + 5, car.y - 6, '#ef4444');
      }

      // Audio feedback: horn sound
      if (this.game.sound) {
        this.game.sound.playHorn();
      }

      // Car drives off angrily instead of vanishing or crashing into incoming queue!
      car.angry = true;
      car.state = CarState.LEAVING;
      if (car.y >= 35) {
        // Car is inside branch: drive forward through booth to inbound lane, then outbound exit on the right!
        car.setPath([
          { x: car.x, y: 114 },
          { x: this.config.exitX || 195, y: this.config.exitY || 138 },
        ]);
      } else {
        // Car is on public road: continue right along road off-screen
        car.setPath([
          { x: 210, y: this.config.roadY + 4 },
        ]);
      }
      this.activeCars.push(car);
    }

    // 5. Update active cars (driving to bay, parked, leaving)
    for (let i = this.activeCars.length - 1; i >= 0; i--) {
      const car = this.activeCars[i];
      car.update(dt);

      switch (car.state) {
        case CarState.PARKED:
          // Just arrived at facility — initialize park timer and award score
          if (!car._scored && car.assignedFacility) {
            const fac = car.assignedFacility;

            if (fac.type === 'parking') {
              const [minD, maxD] = this.config.parkDuration;
              const duration = minD + Math.random() * (maxD - minD);
              car.parkTimer = duration;
              car.totalParkDuration = duration;
              car._scored = true;

              // 1. MONEY: rental fee earned
              const cashEarned = 50;

              // SPEED COMPONENT for Reputation:
              const waitRatio = Math.max(0, Math.min(1, car.patience / car.maxPatience));
              const speedRep = Math.round(waitRatio * 40); // 0 to 40 speed points

              let comboMultiplier = 1;
              let isCombo = false;

              // COMBO COMPONENT for Parking Bay:
              if (fac.assignedColor && fac.assignedColor === car.colour) {
                // Same color match! Stacking bonus multiplier
                comboMultiplier = (fac.comboCount || 1) + 1;
                fac.triggerCombo(comboMultiplier);
                isCombo = true;
                if (this.game.sound) this.game.sound.playCombo(comboMultiplier);
              } else if (fac.assignedColor && fac.assignedColor !== car.colour) {
                // Different color car parked in bay
                if (fac.comboCount > 1) {
                  if (this.game.sound) this.game.sound.playDisappointed();
                  if (this.game.floatingText) {
                    this.game.floatingText.spawn('COMBO BROKEN!', car.x + 5, car.y - 12, '#ef4444');
                  }
                  fac.setNeutral();
                } else {
                  fac.assignedColor = car.colour;
                  fac.comboCount = 1;
                  if (this.game.sound) this.game.sound.playCoin();
                }
              } else {
                // Bay was neutral: takes on this car's color
                fac.assignedColor = car.colour;
                fac.comboCount = 1;
                if (this.game.sound) this.game.sound.playCoin();
              }

              const repEarned = (10 + speedRep) * comboMultiplier;

              this.addScore(cashEarned);
              this.carsProcessed++;
              this.rentals = this.carsProcessed;
              this.reputation += repEarned;
              if (this.reputation > this.bestReputation) {
                this.bestReputation = this.reputation;
                try { localStorage.setItem('car_rental_best_rep', this.bestReputation.toString()); } catch (e) {}
              }

              // Visual floating feedback (only money, and combo if combo; no fast/slow text)
              if (this.game.floatingText) {
                if (isCombo) {
                  const colorHex = COLOR_MAP[car.colour] ? COLOR_MAP[car.colour].light : '#fbbf24';
                  this.game.floatingText.spawnCombo(`${comboMultiplier}x COMBO! +$${cashEarned}`, car.x + 5, car.y - 8, colorHex);
                } else {
                  this.game.floatingText.spawn(`+$${cashEarned}`, car.x + 5, car.y - 6, '#4ade80');
                }
              }
            } else if (fac.type === 'fuel') {
              // Car arrived at Fuel Station to refuel!
              const refuelDuration = 3.5;
              car.parkTimer = refuelDuration;
              car.totalParkDuration = refuelDuration;
              car._scored = true;

              if (this.game.sound) {
                if (this.game.sound.playRefuel) this.game.sound.playRefuel();
                else this.game.sound.playCoin();
              }
            } else if (fac.type === 'carwash') {
              // Car arrived at Car Wash to be washed!
              const washDuration = 3.5;
              car.parkTimer = washDuration;
              car.totalParkDuration = washDuration;
              car._scored = true;

              if (this.game.sound) {
                if (this.game.sound.playWash) this.game.sound.playWash();
                else this.game.sound.playCoin();
              }
            }
          }

          // Service timer finished
          if (car._scored && car.parkTimer <= 0 && car.assignedFacility) {
            const fac = car.assignedFacility;

            if (fac.type === 'parking') {
              // Parking duration completed! Roll multi-service needs:
              // 30% fuel only, 25% wash only, 25% both fuel & wash, 20% clean & full (leaves)
              const roll = Math.random();
              if (roll < 0.30) {
                car.needsFuel = true;
                car.needsWash = false;
                car.state = CarState.NEEDS_REFUEL;
              } else if (roll < 0.55) {
                car.needsFuel = false;
                car.needsWash = true;
                car.state = CarState.NEEDS_REFUEL;
              } else if (roll < 0.80) {
                car.needsFuel = true;
                car.needsWash = true;
                car.state = CarState.NEEDS_REFUEL;
              } else {
                // Clean and fueled: departs smoothly to exit
                car.needsFuel = false;
                car.needsWash = false;
                const exitWP = this._buildExitPath(car);
                car.startLeaving(exitWP);
                break;
              }

              car.patience = 18;
              car.maxPatience = 18;
              car.negComboCount = 0;
              car._scored = false;

              if (this.game.sound) this.game.sound.playClick();
              if (this.game.floatingText) {
                const label = (car.needsFuel && car.needsWash)
                  ? 'WASH & FUEL NEEDED!'
                  : (car.needsWash ? 'NEEDS WASH!' : 'NEEDS FUEL!');
                const color = car.needsWash && !car.needsFuel ? '#38bdf8' : '#f59e0b';
                this.game.floatingText.spawn(label, car.x + 5, car.y - 12, color);
              }
            } else if (fac.type === 'carwash') {
              // Car wash completed!
              const washFee = 40;
              let comboMultiplier = 1;
              let isCombo = false;

              car.needsWash = false;

              // Color combo mechanics for the Car Wash Bay!
              if (fac.assignedColor && fac.assignedColor === car.colour) {
                comboMultiplier = (fac.comboCount || 1) + 1;
                fac.triggerCombo(comboMultiplier);
                isCombo = true;
                if (this.game.sound) this.game.sound.playCombo(comboMultiplier);
              } else if (fac.assignedColor && fac.assignedColor !== car.colour) {
                if (fac.comboCount > 1) {
                  if (this.game.sound) this.game.sound.playDisappointed();
                  if (this.game.floatingText) {
                    this.game.floatingText.spawn('COMBO BROKEN!', car.x + 5, car.y - 12, '#ef4444');
                  }
                  fac.setNeutral();
                } else {
                  fac.assignedColor = car.colour;
                  fac.comboCount = 1;
                  if (this.game.sound) this.game.sound.playCoin();
                }
              } else {
                fac.assignedColor = car.colour;
                fac.comboCount = 1;
                if (this.game.sound) this.game.sound.playCoin();
              }

              const repEarned = 25 * comboMultiplier;
              this.addScore(washFee);
              this.reputation += repEarned;
              if (this.reputation > this.bestReputation) {
                this.bestReputation = this.reputation;
                try { localStorage.setItem('car_rental_best_rep', this.bestReputation.toString()); } catch (e) {}
              }

              if (this.game.floatingText) {
                if (isCombo) {
                  const colorHex = COLOR_MAP[car.colour] ? COLOR_MAP[car.colour].light : '#38bdf8';
                  this.game.floatingText.spawnCombo(`${comboMultiplier}x COMBO! +$${washFee}`, car.x + 5, car.y - 8, colorHex);
                } else {
                  this.game.floatingText.spawn(`+$${washFee}`, car.x + 5, car.y - 6, '#38bdf8');
                }
              }

              // Check if remaining services needed (e.g. still needs fuel):
              if (car.needsFuel) {
                car.state = CarState.NEEDS_REFUEL;
                car.patience = 18;
                car.maxPatience = 18;
                car._scored = false;
                if (this.game.floatingText) {
                  this.game.floatingText.spawn('NOW NEEDS FUEL!', car.x + 5, car.y - 14, '#f59e0b');
                }
              } else {
                // All services finished!
                car.negComboCount = 0;
                car.angry = false;
                const exitWP = this._buildExitPath(car);
                car.startLeaving(exitWP);
              }
            } else if (fac.type === 'fuel') {
              // Refueling service completed at Fuel Station!
              const refuelFee = 40;
              let comboMultiplier = 1;
              let isCombo = false;

              car.needsFuel = false;

              // Same color and combo mechanics for the Refueling Bay!
              if (fac.assignedColor && fac.assignedColor === car.colour) {
                comboMultiplier = (fac.comboCount || 1) + 1;
                fac.triggerCombo(comboMultiplier);
                isCombo = true;
                if (this.game.sound) this.game.sound.playCombo(comboMultiplier);
              } else if (fac.assignedColor && fac.assignedColor !== car.colour) {
                if (fac.comboCount > 1) {
                  if (this.game.sound) this.game.sound.playDisappointed();
                  if (this.game.floatingText) {
                    this.game.floatingText.spawn('COMBO BROKEN!', car.x + 5, car.y - 12, '#ef4444');
                  }
                  fac.setNeutral();
                } else {
                  fac.assignedColor = car.colour;
                  fac.comboCount = 1;
                  if (this.game.sound) this.game.sound.playCoin();
                }
              } else {
                // Fuel bay was neutral: takes on this car's color
                fac.assignedColor = car.colour;
                fac.comboCount = 1;
                if (this.game.sound) this.game.sound.playCoin();
              }

              const repEarned = 25 * comboMultiplier;

              this.addScore(refuelFee);
              this.reputation += repEarned;
              if (this.reputation > this.bestReputation) {
                this.bestReputation = this.reputation;
                try { localStorage.setItem('car_rental_best_rep', this.bestReputation.toString()); } catch (e) {}
              }

              // Visual floating feedback for completed refueling
              if (this.game.floatingText) {
                if (isCombo) {
                  const colorHex = COLOR_MAP[car.colour] ? COLOR_MAP[car.colour].light : '#fbbf24';
                  this.game.floatingText.spawnCombo(`${comboMultiplier}x COMBO! +$${refuelFee}`, car.x + 5, car.y - 8, colorHex);
                } else {
                  this.game.floatingText.spawn(`+$${refuelFee}`, car.x + 5, car.y - 6, '#4ade80');
                }
              }

              // Check if remaining services needed (e.g. still needs car wash):
              if (car.needsWash) {
                car.state = CarState.NEEDS_REFUEL;
                car.patience = 18;
                car.maxPatience = 18;
                car._scored = false;
                if (this.game.floatingText) {
                  this.game.floatingText.spawn('NOW NEEDS WASH!', car.x + 5, car.y - 14, '#38bdf8');
                }
              } else {
                // All services finished!
                car.negComboCount = 0;
                car.angry = false;
                const exitWP = this._buildExitPath(car);
                car.startLeaving(exitWP);
              }
            }
          }
          break;

        case CarState.NEEDS_REFUEL:
          // Patience expired while waiting for fuel:
          // Car CANNOT leave unrefueled! It stays and stacks negative combo reputation penalties!
          if (car.patience <= 0) {
            car.angry = true;
            car.negComboCount = (car.negComboCount || 0) + 1;
            const baseLoss = 15;
            const repLoss = baseLoss * car.negComboCount;
            this.reputation = Math.max(0, this.reputation - repLoss);

            if (this.game.sound) {
              if (car.negComboCount > 1) {
                this.game.sound.playDisappointed();
              } else {
                this.game.sound.playHorn();
              }
            }

            if (this.game.floatingText) {
              if (car.negComboCount > 1) {
                this.game.floatingText.spawn(`${car.negComboCount}x NEG COMBO! -${repLoss} REP`, car.x + 5, car.y - 12, '#ef4444');
              } else {
                this.game.floatingText.spawn(`-${repLoss} REP`, car.x + 5, car.y - 8, '#ef4444');
              }
            }

            // Reset patience bar for next negative combo countdown (car NEVER leaves until refueled!)
            car.patience = 10;
            car.maxPatience = 10;
          }
          break;

        case CarState.GONE:
          this.activeCars.splice(i, 1);
          break;
      }
    }

    // 6. Auto-opening entrance & exit boom barriers:
    // Entrance barrier: opens smoothly when any car approaches or enters through the entrance gate
    const allCars = this.getAllCars();
    const isCarEntering = allCars.some(
      c => (c.state === CarState.APPROACHING || c.state === CarState.WAITING) &&
           c.x >= 20 && c.x <= 55 && c.y >= 10 && c.y <= 46
    );
    const targetEntrance = isCarEntering ? 1.0 : 0.0;
    const barrierSpeed = 3.5;
    if (this.entranceBarrierProgress < targetEntrance) {
      this.entranceBarrierProgress = Math.min(targetEntrance, this.entranceBarrierProgress + dt * barrierSpeed);
    } else if (this.entranceBarrierProgress > targetEntrance) {
      this.entranceBarrierProgress = Math.max(targetEntrance, this.entranceBarrierProgress - dt * barrierSpeed);
    }

    // Exit barrier: opens smoothly when any leaving car approaches the right exit
    const isCarExiting = this.activeCars.some(
      c => c.state === CarState.LEAVING && c.x >= 105 && Math.abs(c.y - (this.config.exitY || 138)) < 24
    );
    const targetExit = isCarExiting ? 1.0 : 0.0;
    if (this.barrierProgress < targetExit) {
      this.barrierProgress = Math.min(targetExit, this.barrierProgress + dt * barrierSpeed);
    } else if (this.barrierProgress > targetExit) {
      this.barrierProgress = Math.max(targetExit, this.barrierProgress - dt * barrierSpeed);
    }
  }

  /**
   * Build clean exit path for cars leaving bays or fuel station:
   * Bay -> Outbound Driveway (y=138) -> Dedicated Right-Side Exit (x=195)
   */
  _buildExitPath(car) {
    const cfg = this.config;
    const outboundY = cfg.exitY || 138;
    const exitX = cfg.exitX || 195;

    // For cars leaving neutral waiting bays next to office (y <= 60)
    if (car.y <= 60) {
      return [
        { x: car.x, y: 114 },        // drive down into driveway corridor
        { x: 168, y: 114 },          // drive across to clear right lane
        { x: 168, y: outboundY },    // drive down to outbound driveway
        { x: exitX, y: outboundY },  // drive through exit gate off-screen
      ];
    }

    // For cars in lower rows or fuel station (y > 185)
    if (car.y > 185) {
      const pullOutY = car.y > 230 ? 242 : 238;
      return [
        { x: car.x, y: pullOutY },   // pull out into clear lane
        { x: 168, y: pullOutY },     // drive across to right clear lane
        { x: 168, y: outboundY },    // drive up to outbound driveway
        { x: exitX, y: outboundY },  // drive straight through exit gate off-screen
      ];
    }

    // For cars in Row 1 bays (y = 165)
    return [
      { x: car.x, y: outboundY },
      { x: exitX, y: outboundY },
    ];
  }

  render(ctx) {
    this._renderBackground(ctx);
    this._renderFacilities(ctx);
    this._renderCars(ctx);
    this._renderEntranceBarrier(ctx); // Animated entrance boom barrier
    this._renderExitBarrier(ctx);     // Animated exit boom barrier

    // Render floating popups on top of scene
    if (this.game.floatingText) {
      this.game.floatingText.render(ctx);
    }
  }

  _renderBackground(ctx) {
    const cfg = this.config;
    const W = 180, H = 320;

    // Sky / dark backdrop
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, W, H);

    // Car park asphalt
    ctx.fillStyle = '#2a2a3e';
    ctx.fillRect(0, cfg.roadY + cfg.roadHeight, W, H - cfg.roadY - cfg.roadHeight);

    // Subtle grid markings on asphalt
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (let y = cfg.roadY + cfg.roadHeight; y < H; y += 20) {
      ctx.fillRect(0, y, W, 1);
    }
    for (let x = 0; x < W; x += 20) {
      ctx.fillRect(x, cfg.roadY + cfg.roadHeight, 1, H);
    }

    // Public road
    ctx.fillStyle = '#4a4a5e';
    ctx.fillRect(0, cfg.roadY, W, cfg.roadHeight);

    // Road lane markings (dashed center line)
    ctx.fillStyle = '#fef08a';
    const lineY = cfg.roadY + cfg.roadHeight / 2;
    for (let x = 0; x < W; x += 10) {
      ctx.fillRect(x, lineY, 5, 1);
    }

    // Road edge lines (solid white)
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, cfg.roadY, W, 1);
    ctx.fillRect(0, cfg.roadY + cfg.roadHeight - 1, W, 1);

    // Entrance opening on LEFT side (cut out bottom road curb at entranceX)
    ctx.fillStyle = '#2a2a3e';
    ctx.fillRect(cfg.entranceX - 8, cfg.roadY + cfg.roadHeight - 1, 16, 1);

    // Entrance guide lines
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(cfg.entranceX - 8, cfg.roadY + cfg.roadHeight - 1, 1, 12);
    ctx.fillRect(cfg.entranceX + 7, cfg.roadY + cfg.roadHeight - 1, 1, 12);

    // --- CAR PARK PERIMETER BOUNDARY (right wall with clean exit opening) ---
    ctx.fillStyle = '#475569';
    ctx.fillRect(W - 2, cfg.roadY + cfg.roadHeight, 2, 128 - (cfg.roadY + cfg.roadHeight));
    ctx.fillRect(W - 2, 148, 2, H - 148);

    // Subtle yellow stop line before the barrier gate on lot asphalt
    ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
    ctx.fillRect(172, 130, 1, 16);

    // Subtle inbound & outbound lane markings in main asphalt
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    // Inbound lane dashes (y = 114)
    for (let x = 15; x < 140; x += 14) {
      ctx.fillRect(x, 114, 6, 1);
    }
    // Outbound lane dashes (y = 138)
    for (let x = 15; x < 165; x += 14) {
      ctx.fillRect(x, 138, 6, 1);
    }

    // Office building
    const officeSprite = this.game.sprites.get('office');
    if (officeSprite) {
      ctx.drawImage(officeSprite, cfg.officeX, cfg.officeY);
    }
  }

  /** Render the automated boom barrier at the top entrance of the car park */
  _renderEntranceBarrier(ctx) {
    const cfg = this.config;
    const gateX = cfg.entranceX || 45;
    const gateY = cfg.roadY + cfg.roadHeight - 1; // y = 29
    const postX = gateX - 12; // 33
    const postY = gateY - 4;  // 25

    ctx.save();

    // 1. Barrier housing cabinet (industrial safety orange with dark border)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(postX - 1, postY - 1, 6, 8);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(postX, postY, 4, 6);

    // 2. Status LED: Green when opening/open, Red when closed
    const isOpen = this.entranceBarrierProgress > 0.35;
    ctx.fillStyle = isOpen ? '#22c55e' : '#ef4444';
    ctx.fillRect(postX + 1, postY + 1, 2, 2);

    // 3. Resting base socket on opposite curb (x = 52)
    ctx.fillStyle = '#334155';
    ctx.fillRect(gateX + 7, gateY, 4, 2);

    // 4. Rotating boom arm (red & white striped, pivoted at cabinet)
    // Closed: 0 rad (horizontal across entrance opening x = 37..53, y = 29)
    // Open: -Math.PI / 2 rad (swings straight up 90° into the air)
    const pivotX = postX + 4; // 37
    const pivotY = gateY + 1; // 30
    const angle = - (Math.PI / 2) * this.entranceBarrierProgress;

    ctx.translate(pivotX, pivotY);
    ctx.rotate(angle);

    // Boom arm stripes (16px long, 2px thick)
    for (let s = 0; s < 16; s += 3) {
      ctx.fillStyle = (Math.floor(s / 3) % 2 === 0) ? '#ef4444' : '#ffffff';
      ctx.fillRect(s, -1, 3, 2);
    }
    // Dark tip on the end
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(15, -1, 1, 2);

    // Pivot center cap
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-1, -1, 3, 3);

    ctx.restore();
  }

  /** Render the automated boom barrier at the right exit of the car park */
  _renderExitBarrier(ctx) {
    const W = 180;
    const postX = W - 6; // 174
    const postY = 124;

    ctx.save();

    // 1. Barrier housing cabinet (industrial orange with dark outline)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(postX - 1, postY - 1, 6, 8);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(postX, postY, 4, 6);

    // 2. Status LED: Green when opening/open, Red when closed
    const isOpen = this.barrierProgress > 0.35;
    ctx.fillStyle = isOpen ? '#22c55e' : '#ef4444';
    ctx.fillRect(postX + 1, postY + 1, 2, 2);

    // 3. Resting base socket on opposite curb
    ctx.fillStyle = '#334155';
    ctx.fillRect(postX - 1, 147, 5, 2);

    // 4. Rotating boom arm (red & white striped, pivoted at cabinet)
    // Closed: Math.PI / 2 (pointing straight down across exit, y = 129..147)
    // Open: -0.4 rad (~110° up into the air)
    const pivotX = postX + 2;
    const pivotY = postY + 5; // y = 129
    const closedAngle = Math.PI / 2;
    const openAngle = -0.4;
    const angle = closedAngle + (openAngle - closedAngle) * this.barrierProgress;

    ctx.translate(pivotX, pivotY);
    ctx.rotate(angle);

    // Boom arm stripes (18px long, 2px thick)
    for (let s = 0; s < 18; s += 3) {
      ctx.fillStyle = (Math.floor(s / 3) % 2 === 0) ? '#ef4444' : '#ffffff';
      ctx.fillRect(s, -1, 3, 2);
    }
    // Dark tip on the end
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(17, -1, 1, 2);

    // Pivot center cap
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-1, -1, 3, 3);

    ctx.restore();
  }

  _renderFacilities(ctx) {
    for (const facility of this.facilities) {
      facility.render(ctx, this.game.sprites);
    }
  }

  _renderCars(ctx) {
    // Render spawner's approaching cars
    if (this.spawner) {
      this.spawner.render(ctx);
    }

    // Render queued cars
    if (this.queue) {
      for (const car of this.queue.cars) {
        car.render(ctx);
      }
    }

    // Render active cars (driving, parked, leaving)
    for (const car of this.activeCars) {
      car.render(ctx);
    }
  }
}
