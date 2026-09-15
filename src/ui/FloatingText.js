// ============================================================
// FloatingText.js — Floating score, combo & feedback popups
// ============================================================

export class FloatingTextManager {
  constructor() {
    this.particles = [];
  }

  /** Spawn standard floating text */
  spawn(text, x, y, color = '#4ade80') {
    this.particles.push({
      text,
      x,
      y,
      color,
      isCombo: false,
      alpha: 1.0,
      life: 1.0,
      maxLife: 1.0,
      size: 5,
    });
  }

  /** Spawn energized combo text */
  spawnCombo(text, x, y, color = '#fbbf24') {
    this.particles.push({
      text,
      x,
      y,
      color,
      isCombo: true,
      alpha: 1.0,
      life: 1.4,
      maxLife: 1.4,
      size: 6,
    });
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.y -= (p.isCombo ? 18 : 14) * dt;
      p.alpha = Math.max(0, p.life / p.maxLife);

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx) {
    if (this.particles.length === 0) return;

    ctx.save();
    ctx.textAlign = 'center';

    for (const p of this.particles) {
      const px = Math.floor(p.x);
      const py = Math.floor(p.y);

      ctx.globalAlpha = p.alpha;
      ctx.font = `${p.size}px "Press Start 2P"`;

      if (p.isCombo) {
        // Drop shadow for combo
        ctx.fillStyle = '#0f172a';
        ctx.fillText(p.text, px + 1, py + 1);
      }

      ctx.fillStyle = p.color;
      ctx.fillText(p.text, px, py);
    }

    ctx.restore();
  }

  clear() {
    this.particles = [];
  }
}
