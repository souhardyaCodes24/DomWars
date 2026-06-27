import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

export function useCountdown() {
  const phase = useGameStore((s) => s.gamePhase);
  const isHost = useGameStore((s) => s.isHost);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isHost || phase !== 'countdown') return;

    intervalRef.current = setInterval(() => {
      const state = useGameStore.getState();
      const next = state.countdownValue - 1;
      if (next <= 0) {
        useGameStore.setState({ gamePhase: 'playing', countdownValue: 0 });
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
      } else {
        useGameStore.setState({ countdownValue: next });
      }
    }, 1000);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [phase, isHost]);
}
