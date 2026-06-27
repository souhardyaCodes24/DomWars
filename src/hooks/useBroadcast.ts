import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

export function useBroadcast() {
  const intervalRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const isHost = useGameStore.getState().isHost;
    if (!isHost) return;

    intervalRef.current = window.setInterval(() => {
      const state = useGameStore.getState();
      const send = state.sendToPeer;
      if (!send) return;
      send({
        type: 'state',
        payload: {
          targets: state.targets,
          gamePhase: state.gamePhase,
          winner: state.winner,
          countdownValue: state.countdownValue,
          clientStats: {
            score: state.opponentStats.score,
            energy: state.opponentStats.energy,
            corruption: state.opponentStats.corruption,
            isPatched: (state.opponentStats as any).isPatched ?? false,
            isSafeMode: (state.opponentStats as any).isSafeMode ?? false,
          },
          clientEffects: state.opponentEffects,
        },
      });
    }, 50);

    return () => {
      if (intervalRef.current !== undefined) clearInterval(intervalRef.current);
    };
  }, []);
}
