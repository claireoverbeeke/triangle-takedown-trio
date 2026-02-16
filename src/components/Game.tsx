import { useEffect, useRef, useCallback } from 'react';
import { createInitialState, movePlayer, shoot, updateBullets, updateAI } from '@/game/engine';
import { render } from '@/game/renderer';
import { GameState, CANVAS_W, CANVAS_H } from '@/game/types';

const KEYS = new Set<string>();

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialState());
  const rafRef = useRef<number>(0);

  const reset = useCallback(() => {
    stateRef.current = createInitialState();
  }, []);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      KEYS.add(e.key.toLowerCase());
      if (e.key.toLowerCase() === 'r' && stateRef.current.gameOver) reset();
    };
    const onUp = (e: KeyboardEvent) => KEYS.delete(e.key.toLowerCase());
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, [reset]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      const state = stateRef.current;
      if (!state.gameOver) {
        const now = Date.now();
        const p = state.players[0];

        // Player 1 controls: WASD + Space
        let fwd = 0, rot = 0;
        if (KEYS.has('w')) fwd = 1;
        if (KEYS.has('s')) fwd = -1;
        if (KEYS.has('a')) rot = -1;
        if (KEYS.has('d')) rot = 1;
        movePlayer(p, fwd, rot, state.obstacles);

        if (KEYS.has(' ')) {
          const b = shoot(p, now);
          if (b) state.bullets.push(b);
        }

        // AI for players 2 & 3
        updateAI(state.players[1], state, now);
        updateAI(state.players[2], state, now);

        updateBullets(state);
      }

      render(ctx, state);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-background select-none">
      <h1 className="text-2xl font-bold font-mono tracking-widest text-primary uppercase">
        Dorito Shooter
      </h1>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="rounded-lg border border-border shadow-[0_0_40px_rgba(0,255,180,0.15)]"
      />
      <div className="flex gap-6 text-sm font-mono text-muted-foreground">
        <span><kbd className="px-1 border border-border rounded text-primary">W</kbd><kbd className="px-1 border border-border rounded text-primary">A</kbd><kbd className="px-1 border border-border rounded text-primary">S</kbd><kbd className="px-1 border border-border rounded text-primary">D</kbd> Move</span>
        <span><kbd className="px-1 border border-border rounded text-primary">Space</kbd> Shoot</span>
        <span><kbd className="px-1 border border-border rounded text-primary">R</kbd> Restart</span>
      </div>
      <div className="flex gap-4 text-xs font-mono">
        <span style={{ color: 'hsl(160, 100%, 50%)' }}>● You</span>
        <span style={{ color: 'hsl(280, 100%, 65%)' }}>● Bot 2</span>
        <span style={{ color: 'hsl(30, 100%, 55%)' }}>● Bot 3</span>
      </div>
    </div>
  );
}
