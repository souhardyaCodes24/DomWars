import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { SPAWN_INTERVAL_MS } from '../constants/game';

export function useGameLoop() {
  const lastTimeRef = useRef(0);
  const spawnAccumRef = useRef(0);

  useEffect(() => {
    const isHost = useGameStore.getState().isHost;
    if (!isHost) return;

    let rafId: number;

    const loop = (time: number) => {
      const state = useGameStore.getState();
      if (state.gamePhase !== 'playing') {
        lastTimeRef.current = 0;
        spawnAccumRef.current = 0;
        rafId = requestAnimationFrame(loop);
        return;
      }

      const dt = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0.016;
      lastTimeRef.current = time;

      state.updateTargets(dt);
      state.tickEffects(dt);

      spawnAccumRef.current += dt * 1000;
      if (spawnAccumRef.current >= SPAWN_INTERVAL_MS) {
        spawnAccumRef.current -= SPAWN_INTERVAL_MS;
        state.spawnTarget();
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);
}
