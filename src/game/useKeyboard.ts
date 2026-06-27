import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { ABILITIES } from '../constants/game';

export function useKeyboard() {
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const state = useGameStore.getState();
      if (state.gamePhase !== 'playing') return;
      const key = e.key.toUpperCase();
      const ability = ABILITIES.find((a) => a.hotkey === key);
      if (ability) {
        e.preventDefault();
        state.useAbility(ability.name);
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);
}
