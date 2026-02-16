import { GameState, CANVAS_W, CANVAS_H, PLAYER_SIZE, BULLET_RADIUS } from './types';

export function render(ctx: CanvasRenderingContext2D, state: GameState) {
  // Background
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Grid lines
  ctx.strokeStyle = 'rgba(0, 255, 180, 0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < CANVAS_W; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
  }
  for (let y = 0; y < CANVAS_H; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
  }

  // Obstacles
  for (const obs of state.obstacles) {
    ctx.fillStyle = 'rgba(100, 120, 160, 0.6)';
    ctx.strokeStyle = 'rgba(140, 170, 220, 0.4)';
    ctx.lineWidth = 2;
    ctx.fillRect(obs.pos.x, obs.pos.y, obs.width, obs.height);
    ctx.strokeRect(obs.pos.x, obs.pos.y, obs.width, obs.height);
  }

  // Bullets
  for (const b of state.bullets) {
    ctx.save();
    ctx.shadowColor = b.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.pos.x, b.pos.y, BULLET_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Players
  for (const p of state.players) {
    if (!p.alive) continue;
    ctx.save();
    ctx.translate(p.pos.x, p.pos.y);
    ctx.rotate(p.angle);

    // Glow
    ctx.shadowColor = p.glowColor;
    ctx.shadowBlur = 20;

    // Triangle
    ctx.fillStyle = p.color;
    ctx.strokeStyle = p.glowColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PLAYER_SIZE, 0);
    ctx.lineTo(-PLAYER_SIZE * 0.7, -PLAYER_SIZE * 0.6);
    ctx.lineTo(-PLAYER_SIZE * 0.7, PLAYER_SIZE * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();

    // HP bar
    const barW = 30;
    const barH = 4;
    const barX = p.pos.x - barW / 2;
    const barY = p.pos.y - PLAYER_SIZE - 10;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = p.hp > 2 ? p.color : 'hsl(0, 85%, 55%)';
    ctx.fillRect(barX, barY, barW * (p.hp / 5), barH);
  }

  // Airstrikes
  if (state.airstrikes) {
    for (const strike of state.airstrikes) {
      ctx.save();
      if (strike.phase === 'warning') {
        // Pulsing red target zone
        const pulse = 0.4 + 0.3 * Math.sin(Date.now() * 0.015);
        ctx.globalAlpha = pulse;
        ctx.fillStyle = 'rgba(255, 40, 40, 0.35)';
        ctx.beginPath();
        ctx.arc(strike.pos.x, strike.pos.y, strike.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = pulse + 0.2;
        ctx.strokeStyle = 'rgba(255, 60, 60, 0.8)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Crosshair
        ctx.strokeStyle = 'rgba(255, 80, 80, 0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(strike.pos.x - strike.radius, strike.pos.y);
        ctx.lineTo(strike.pos.x + strike.radius, strike.pos.y);
        ctx.moveTo(strike.pos.x, strike.pos.y - strike.radius);
        ctx.lineTo(strike.pos.x, strike.pos.y + strike.radius);
        ctx.stroke();
      } else {
        // Explosion
        const progress = 1 - (strike.ticksLeft / 12);
        const r = strike.radius * (0.6 + progress * 0.6);

        ctx.shadowColor = 'rgba(255, 100, 0, 1)';
        ctx.shadowBlur = 40;

        // Outer fireball
        ctx.globalAlpha = 1 - progress * 0.7;
        const gradient = ctx.createRadialGradient(
          strike.pos.x, strike.pos.y, 0,
          strike.pos.x, strike.pos.y, r
        );
        gradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
        gradient.addColorStop(0.3, 'rgba(255, 160, 30, 0.9)');
        gradient.addColorStop(0.7, 'rgba(255, 50, 0, 0.6)');
        gradient.addColorStop(1, 'rgba(180, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(strike.pos.x, strike.pos.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // Lasers
  if (state.lasers) {
    for (const laser of state.lasers) {
      ctx.save();
      const fade = Math.min(1, laser.ticksLeft / 5);
      ctx.globalAlpha = fade;

      // Outer glow
      ctx.shadowColor = laser.color;
      ctx.shadowBlur = 40;
      ctx.strokeStyle = laser.color;
      ctx.lineWidth = 14;
      ctx.globalAlpha = fade * 0.3;
      ctx.beginPath();
      ctx.moveTo(laser.start.x, laser.start.y);
      ctx.lineTo(laser.end.x, laser.end.y);
      ctx.stroke();

      // Mid beam
      ctx.shadowBlur = 20;
      ctx.strokeStyle = laser.glowColor;
      ctx.lineWidth = 6;
      ctx.globalAlpha = fade * 0.7;
      ctx.beginPath();
      ctx.moveTo(laser.start.x, laser.start.y);
      ctx.lineTo(laser.end.x, laser.end.y);
      ctx.stroke();

      // Core beam (white-hot)
      ctx.shadowBlur = 10;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.globalAlpha = fade;
      ctx.beginPath();
      ctx.moveTo(laser.start.x, laser.start.y);
      ctx.lineTo(laser.end.x, laser.end.y);
      ctx.stroke();

      ctx.restore();
    }
  }

  // Game over overlay
  if (state.gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (state.winner !== null && state.winner >= 0) {
      const winner = state.players[state.winner];
      ctx.shadowColor = winner.glowColor;
      ctx.shadowBlur = 30;
      ctx.fillStyle = winner.color;
      ctx.font = 'bold 48px monospace';
      ctx.fillText(`PLAYER ${state.winner + 1} WINS!`, CANVAS_W / 2, CANVAS_H / 2 - 20);
    } else {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 48px monospace';
      ctx.fillText('DRAW!', CANVAS_W / 2, CANVAS_H / 2 - 20);
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(180,200,255,0.7)';
    ctx.font = '18px monospace';
    ctx.fillText('Press R to restart', CANVAS_W / 2, CANVAS_H / 2 + 30);
  }
}
