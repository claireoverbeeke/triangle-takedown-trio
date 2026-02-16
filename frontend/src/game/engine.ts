import {
  GameState, Player, Bullet, Obstacle, Vec2,
  CANVAS_W, CANVAS_H, PLAYER_SIZE, BULLET_SPEED, BULLET_RADIUS,
  MOVE_SPEED, ROTATE_SPEED, SHOOT_COOLDOWN, MAX_HP,
} from './types';

export function createObstacles(): Obstacle[] {
  return [
    { pos: { x: 200, y: 150 }, width: 80, height: 30 },
    { pos: { x: 620, y: 150 }, width: 80, height: 30 },
    { pos: { x: 410, y: 280 }, width: 80, height: 40 },
    { pos: { x: 150, y: 400 }, width: 30, height: 80 },
    { pos: { x: 720, y: 400 }, width: 30, height: 80 },
    { pos: { x: 350, y: 460 }, width: 60, height: 25 },
    { pos: { x: 490, y: 460 }, width: 60, height: 25 },
    { pos: { x: 100, y: 250 }, width: 50, height: 20 },
    { pos: { x: 750, y: 250 }, width: 50, height: 20 },
  ];
}

const PLAYER_COLORS = [
  { color: 'hsl(160, 100%, 50%)', glow: 'hsl(160, 100%, 60%)' },
  { color: 'hsl(280, 100%, 65%)', glow: 'hsl(280, 100%, 75%)' },
  { color: 'hsl(30, 100%, 55%)', glow: 'hsl(30, 100%, 65%)' },
];

const SPAWN_POINTS: Vec2[] = [
  { x: 100, y: 100 },
  { x: 800, y: 100 },
  { x: 450, y: 500 },
];

export function createInitialState(): GameState {
  const players: Player[] = SPAWN_POINTS.map((pos, i) => ({
    id: i,
    pos: { ...pos },
    angle: i === 0 ? Math.PI / 4 : i === 1 ? (3 * Math.PI) / 4 : -Math.PI / 2,
    vel: { x: 0, y: 0 },
    hp: MAX_HP,
    color: PLAYER_COLORS[i].color,
    glowColor: PLAYER_COLORS[i].glow,
    lastShot: 0,
    alive: true,
  }));

  return {
    players,
    bullets: [],
    obstacles: createObstacles(),
    winner: null,
    gameOver: false,
  };
}

export function shoot(player: Player, now: number): Bullet | null {
  if (!player.alive || now - player.lastShot < SHOOT_COOLDOWN) return null;
  player.lastShot = now;
  return {
    pos: {
      x: player.pos.x + Math.cos(player.angle) * (PLAYER_SIZE + 5),
      y: player.pos.y + Math.sin(player.angle) * (PLAYER_SIZE + 5),
    },
    vel: {
      x: Math.cos(player.angle) * BULLET_SPEED,
      y: Math.sin(player.angle) * BULLET_SPEED,
    },
    ownerId: player.id,
    color: player.color,
  };
}

function rectContains(obs: Obstacle, px: number, py: number, radius: number): boolean {
  const closestX = Math.max(obs.pos.x, Math.min(px, obs.pos.x + obs.width));
  const closestY = Math.max(obs.pos.y, Math.min(py, obs.pos.y + obs.height));
  const dx = px - closestX;
  const dy = py - closestY;
  return dx * dx + dy * dy < radius * radius;
}

export function movePlayer(player: Player, forward: number, rotate: number, obstacles: Obstacle[]) {
  if (!player.alive) return;
  player.angle += rotate * ROTATE_SPEED;
  const nx = player.pos.x + Math.cos(player.angle) * forward * MOVE_SPEED;
  const ny = player.pos.y + Math.sin(player.angle) * forward * MOVE_SPEED;

  const blocked = obstacles.some((o) => rectContains(o, nx, ny, PLAYER_SIZE));
  if (!blocked) {
    player.pos.x = Math.max(PLAYER_SIZE, Math.min(CANVAS_W - PLAYER_SIZE, nx));
    player.pos.y = Math.max(PLAYER_SIZE, Math.min(CANVAS_H - PLAYER_SIZE, ny));
  }
}

export function updateBullets(state: GameState) {
  state.bullets = state.bullets.filter((b) => {
    b.pos.x += b.vel.x;
    b.pos.y += b.vel.y;

    // Out of bounds
    if (b.pos.x < 0 || b.pos.x > CANVAS_W || b.pos.y < 0 || b.pos.y > CANVAS_H) return false;

    // Hit obstacle
    if (state.obstacles.some((o) => rectContains(o, b.pos.x, b.pos.y, BULLET_RADIUS))) return false;

    // Hit player
    for (const p of state.players) {
      if (p.id === b.ownerId || !p.alive) continue;
      const dx = p.pos.x - b.pos.x;
      const dy = p.pos.y - b.pos.y;
      if (dx * dx + dy * dy < (PLAYER_SIZE + BULLET_RADIUS) ** 2) {
        p.hp--;
        if (p.hp <= 0) p.alive = false;
        return false;
      }
    }
    return true;
  });

  // Check win
  const alive = state.players.filter((p) => p.alive);
  if (alive.length <= 1 && !state.gameOver) {
    state.gameOver = true;
    state.winner = alive.length === 1 ? alive[0].id : -1;
  }
}

// Simple AI: rotate toward nearest enemy, move forward, shoot
export function updateAI(player: Player, state: GameState, now: number) {
  if (!player.alive) return;
  const enemies = state.players.filter((p) => p.id !== player.id && p.alive);
  if (enemies.length === 0) return;

  let nearest = enemies[0];
  let minDist = Infinity;
  for (const e of enemies) {
    const d = Math.hypot(e.pos.x - player.pos.x, e.pos.y - player.pos.y);
    if (d < minDist) { minDist = d; nearest = e; }
  }

  const targetAngle = Math.atan2(nearest.pos.y - player.pos.y, nearest.pos.x - player.pos.x);
  let diff = targetAngle - player.angle;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;

  const rotate = diff > 0.1 ? 1 : diff < -0.1 ? -1 : 0;
  const forward = minDist > 150 ? 1 : minDist < 80 ? -1 : 0;

  movePlayer(player, forward, rotate, state.obstacles);

  if (Math.abs(diff) < 0.3) {
    const bullet = shoot(player, now);
    if (bullet) state.bullets.push(bullet);
  }
}
