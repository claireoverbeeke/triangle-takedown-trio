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
