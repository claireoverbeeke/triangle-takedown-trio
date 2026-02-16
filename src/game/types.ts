export interface Vec2 {
  x: number;
  y: number;
}

export interface Player {
  id: number;
  pos: Vec2;
  angle: number;
  vel: Vec2;
  hp: number;
  color: string;
  glowColor: string;
  lastShot: number;
  alive: boolean;
}

export interface Bullet {
  pos: Vec2;
  vel: Vec2;
  ownerId: number;
  color: string;
}

export interface Obstacle {
  pos: Vec2;
  width: number;
  height: number;
}

export interface GameState {
  players: Player[];
  bullets: Bullet[];
  obstacles: Obstacle[];
  winner: number | null;
  gameOver: boolean;
}

export const CANVAS_W = 900;
export const CANVAS_H = 600;
export const PLAYER_SIZE = 18;
export const BULLET_SPEED = 7;
export const BULLET_RADIUS = 5;
export const MOVE_SPEED = 3;
export const ROTATE_SPEED = 0.06;
export const SHOOT_COOLDOWN = 300;
export const MAX_HP = 5;
