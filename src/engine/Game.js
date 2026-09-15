// ============================================================
// Game.js — Core game loop and system orchestrator
// ============================================================

import { PixelCanvas } from './PixelCanvas.js';
import { Input } from './Input.js';
import { SpriteFactory } from '../sprites/SpriteFactory.js';
import { LevelManager } from '../level/LevelManager.js';
import { DragHandler } from '../interaction/DragHandler.js';
import { Highlighter } from '../interaction/Highlighter.js';
import { GameHUD } from '../ui/GameHUD.js';
import { MainMenu } from '../ui/MainMenu.js';
import { OptionsMenu } from '../ui/OptionsMenu.js';
import { ExitScreen } from '../ui/ExitScreen.js';
import { ShopUI } from '../ui/ShopUI.js';
import { SoundEffects } from '../audio/SoundEffects.js';
import { FloatingTextManager } from '../ui/FloatingText.js';

export const GameState = {
  MAIN_MENU: 'mainMenu',
  OPTIONS: 'options',
  EXIT_SCREEN: 'exitScreen',
  PLAYING: 'playing',
  PAUSED: 'paused',
};

export class Game {
  constructor() {
    this.state = GameState.MAIN_MENU;
    this.pixelCanvas = null;
    this.input = null;
    this.sprites = null;
    this.sound = null;
    this.floatingText = null;

    this.level = null;
    this.dragHandler = null;
    this.highlighter = null;
    this.hud = null;
    this.shopUI = null;

    // Menu screens
    this.mainMenu = null;
    this.optionsMenu = null;
    this.exitScreen = null;

    this._lastTime = 0;

    // Pause menu buttons
    this.pauseButtons = [
      { id: 'resume',  text: 'RESUME',       x: 30, y: 135, w: 120, h: 22, bg: '#059669', border: '#34d399' },
      { id: 'restart', text: 'RESTART',      x: 30, y: 165, w: 120, h: 22, bg: '#1e293b', border: '#475569' },
      { id: 'menu',    text: 'MAIN MENU',    x: 30, y: 195, w: 120, h: 22, bg: '#1e293b', border: '#475569' },
    ];
  }

  init(canvasElement) {
    this.pixelCanvas = new PixelCanvas(canvasElement, 180, 320);
    this.input = new Input(canvasElement, this.pixelCanvas);
    this.sprites = new SpriteFactory();
    this.sound = new SoundEffects();
    this.floatingText = new FloatingTextManager();

    this.highlighter = new Highlighter();
    this.level = new LevelManager(this);
    this.dragHandler = new DragHandler(this);
    this.hud = new GameHUD(this);
    this.shopUI = new ShopUI(this);

    this.mainMenu = new MainMenu(this);
    this.optionsMenu = new OptionsMenu(this);
    this.exitScreen = new ExitScreen(this);

    // Initial state: start with Main Menu
    this.state = GameState.MAIN_MENU;

    this._lastTime = performance.now();
    requestAnimationFrame((t) => this._loop(t));
  }

  setState(newState) {
    this.state = newState;
  }

  startLevel(levelNumber = 1) {
    this.floatingText.clear();
    this.level.startLevel(1);
    this.state = GameState.PLAYING;
  }

  _loop(time) {
    const dt = Math.min((time - this._lastTime) / 1000, 0.05); // cap delta
    this._lastTime = time;

    this.update(dt);
    this.render();
    this.input.endFrame();

    requestAnimationFrame((t) => this._loop(t));
  }

  update(dt) {
    switch (this.state) {
      case GameState.MAIN_MENU:
        this.mainMenu.update(dt);
        break;

      case GameState.OPTIONS:
        this.optionsMenu.update(dt);
        break;

      case GameState.EXIT_SCREEN:
        this.exitScreen.update(dt);
        break;

      case GameState.PAUSED:
        this.hud.update(dt);
        this._updatePauseMenu();
        break;

      case GameState.PLAYING:
        this.floatingText.update(dt);
        this.shopUI.update(dt);
        this.dragHandler.update(dt);
        this.level.update(dt);
        this.hud.update(dt);
        break;
    }
  }

  _updatePauseMenu() {
    const input = this.input;
    if (input.justPressed) {
      const px = input.pos.x;
      const py = input.pos.y;

      for (const btn of this.pauseButtons) {
        if (px >= btn.x && px <= btn.x + btn.w && py >= btn.y && py <= btn.y + btn.h) {
          if (this.sound) this.sound.playClick();
          switch (btn.id) {
            case 'resume':
              this.state = GameState.PLAYING;
              break;
            case 'restart':
              this.startLevel(1);
              break;
            case 'menu':
              this.state = GameState.MAIN_MENU;
              break;
          }
          break;
        }
      }
    }
  }

  render() {
    const ctx = this.pixelCanvas.getContext();
    this.pixelCanvas.clear();

    switch (this.state) {
      case GameState.MAIN_MENU:
        this.mainMenu.render(ctx);
        break;

      case GameState.OPTIONS:
        this.optionsMenu.render(ctx);
        break;

      case GameState.EXIT_SCREEN:
        this.exitScreen.render(ctx);
        break;

      case GameState.PLAYING:
      case GameState.PAUSED:
        // 1. Level background, facilities, cars, floating text
        this.level.render(ctx);

        // 2. Shop UI / expansion plots / buy button
        this.shopUI.render(ctx);

        // 3. Drag indicator
        this.dragHandler.render(ctx);

        // 4. HUD overlay
        this.hud.render(ctx);

        // 5. Pause overlay
        if (this.state === GameState.PAUSED) {
          this._renderPaused(ctx);
        }
        break;
    }

    // Blit to screen
    this.pixelCanvas.present();
  }

  togglePause() {
    if (this.state === GameState.PLAYING) {
      this.state = GameState.PAUSED;
    } else if (this.state === GameState.PAUSED) {
      this.state = GameState.PLAYING;
    }
  }

  _renderPaused(ctx) {
    const W = 180, H = 320;
    ctx.fillStyle = 'rgba(10, 15, 29, 0.85)';
    ctx.fillRect(0, 0, W, H);

    ctx.font = '8px "Press Start 2P"';
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', W / 2, 95);

    ctx.font = '5px "Press Start 2P"';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('CAR RENTAL BRANCH', W / 2, 112);

    for (const btn of this.pauseButtons) {
      this._renderButton(ctx, btn);
    }
  }

  _renderButton(ctx, btn) {
    ctx.fillStyle = '#050811';
    ctx.fillRect(btn.x, btn.y + 2, btn.w, btn.h);

    ctx.fillStyle = btn.bg;
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);

    ctx.strokeStyle = btn.border;
    ctx.lineWidth = 1;
    ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);

    ctx.font = '5px "Press Start 2P"';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(btn.text, btn.x + btn.w / 2, btn.y + btn.h / 2 + 2);
  }
}
