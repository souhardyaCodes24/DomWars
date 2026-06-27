import { useEffect, useState, useCallback } from 'react';
import { useGameLoop } from '../game/useGameLoop';
import { useKeyboard } from '../game/useKeyboard';
import { useCountdown } from '../hooks/useCountdown';
import { useBroadcast } from '../hooks/useBroadcast';
import { useGameStore } from '../store/gameStore';
import { TopHUD } from './TopHUD';
import { PlayArea } from './PlayArea';
import { BottomControls } from './BottomControls';
import { Notifications } from './Notifications';
import { CountdownOverlay } from './CountdownOverlay';
import { GameOverDialog } from './GameOverDialog';
import { EmergencyMenu } from './EmergencyMenu';
import { ErrorModal } from './ErrorModal';

interface GameProps {
  mode: 'playground' | 'p2p';
  onExitRoom?: () => void;
}

export function Game({ mode, onExitRoom }: GameProps) {
  const [showIntro, setShowIntro] = useState(mode === 'playground');
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const disconnected = useGameStore((s) => s.disconnected);

  useEffect(() => {
    if (mode === 'playground') {
      useGameStore.setState({
        myStats: { score: 0, energy: 60, corruption: 0 },
        opponentStats: { score: 0, energy: 60, corruption: 0 },
        targets: [], localEffects: [], opponentEffects: [],
        isPatched: false, isSafeMode: false,
        floatingScores: [],
        notifications: [],
        gamePhase: 'playing',
        winner: null,
        disconnected: false,
      });
      useGameStore.getState().setHost(true);
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== 'playground') return;
    const timer = setTimeout(() => setShowIntro(false), 5000);
    return () => clearTimeout(timer);
  }, [mode]);

  // beforeunload for P2P
  useEffect(() => {
    if (mode !== 'p2p') return;
    const handle = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handle);
    return () => window.removeEventListener('beforeunload', handle);
  }, [mode]);

  // ESC emergency menu
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const state = useGameStore.getState();
        if (state.gamePhase === 'playing') {
          setShowEmergency((v) => !v);
        }
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);

  // Disconnect → auto-finish
  useEffect(() => {
    if (disconnected && mode === 'p2p') {
      const state = useGameStore.getState();
      if (state.gamePhase === 'playing' || state.gamePhase === 'countdown') {
        useGameStore.setState({
          gamePhase: 'finished',
          winner: state.isHost ? 'host' : 'client',
        });
      }
    }
  }, [disconnected, mode]);

  const handleLeaveConfirm = useCallback(() => {
    setShowLeaveConfirm(false);
    onExitRoom?.();
  }, [onExitRoom]);

  useGameLoop();
  useKeyboard();
  useCountdown();
  useBroadcast();

  return (
    <div
      className="flex flex-col"
      style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}
    >
      {showIntro && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
          style={{
            background: 'rgba(0,0,0,0.4)',
            animation: 'fadeOut 4.5s ease forwards',
          }}
        >
          <div
            className="font-fredoka text-center p-8"
            style={{
              background: '#fff',
              border: '4px solid var(--color-border)',
              borderRadius: 16,
              boxShadow: '8px 8px 0 var(--color-border)',
              maxWidth: 400,
            }}
          >
            <p className="text-xl mb-2" style={{ color: 'var(--color-border)' }}>
              Catch the targets!
            </p>
            <p className="font-patrick text-base" style={{ color: '#555' }}>
              Click targets to earn energy. Hover any button to learn what it does.
              Get 1000 points to win!
            </p>
          </div>
        </div>
      )}
      <style>{`
        @keyframes fadeOut {
          0%, 60% { opacity: 1; }
          100% { opacity: 0; pointer-events: none; }
        }
      `}</style>
      <TopHUD onLeaveClick={() => setShowLeaveConfirm(true)} />
      <Notifications />
      <CountdownOverlay />
      <GameOverDialog onExitRoom={onExitRoom || (() => {})} />
      <PlayArea />
      <BottomControls />

      <EmergencyMenu open={showEmergency} onClose={() => setShowEmergency(false)} />

      <ErrorModal
        open={showLeaveConfirm}
        title="Warning: Unsaved Changes!"
        message="Your opponent will get a free win and your corruption will be set to 0. Are you sure you want to abandon this DOM?"
        actions={[
          { label: 'LEAVE ANYWAY', onClick: handleLeaveConfirm, variant: 'danger' },
          { label: 'STAY AND FIGHT', onClick: () => setShowLeaveConfirm(false), variant: 'primary' },
        ]}
      />
    </div>
  );
}
