import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';

interface GameOverDialogProps {
  onExitRoom: () => void;
}

export function GameOverDialog({ onExitRoom }: GameOverDialogProps) {
  const gamePhase = useGameStore((s) => s.gamePhase);
  const winner = useGameStore((s) => s.winner);
  const isHost = useGameStore((s) => s.isHost);
  const myStats = useGameStore((s) => s.myStats);
  const opponentStats = useGameStore((s) => s.opponentStats);
  const sendToPeer = useGameStore((s) => s.sendToPeer);
  const disconnected = useGameStore((s) => s.disconnected);
  const resetGame = useGameStore((s) => s.resetGame);
  const [visible, setVisible] = useState(false);
  const [exitTimer, setExitTimer] = useState(5);

  useEffect(() => {
    if (gamePhase === 'finished') {
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
    setVisible(false);
    setExitTimer(5);
  }, [gamePhase]);

  // Auto-return on disconnect
  useEffect(() => {
    if (!visible || !disconnected) return;
    if (exitTimer <= 0) {
      onExitRoom();
      return;
    }
    const t = setTimeout(() => setExitTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [visible, disconnected, exitTimer, onExitRoom]);

  const iWon = (isHost && winner === 'host') || (!isHost && winner === 'client');
  const myScore = isHost ? myStats.score : opponentStats.score;
  const opponentScore = isHost ? opponentStats.score : myStats.score;

  const handlePlayAgain = () => {
    if (sendToPeer) {
      sendToPeer({ type: 'playAgain' });
      resetGame();
    } else {
      resetGame();
    }
  };

  if (gamePhase !== 'finished' || !visible) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div
        className="flex flex-col items-center gap-5"
        style={{
          padding: '32px 40px',
          background: '#fff',
          border: '4px solid var(--color-border)',
          borderRadius: 16,
          boxShadow: '8px 8px 0 var(--color-border)',
          minWidth: 340,
        }}
      >
        {disconnected ? (
          <>
            <span
              className="font-fredoka text-2xl text-center"
              style={{ color: '#4ecdc4' }}
            >
              Connection Reset by Peer
            </span>
            <p className="font-patrick text-sm leading-relaxed text-center" style={{ color: '#555' }}>
              Your opponent hit F12 and never came back. You win by default!
            </p>
          </>
        ) : (
          <>
            <span
              className="font-fredoka text-4xl"
              style={{ color: iWon ? '#4ecdc4' : 'var(--color-corruption)' }}
            >
              {iWon ? 'YOU WIN!' : 'YOU LOSE'}
            </span>
            <div className="font-patrick text-base text-gray-500 text-center">
              <p>You: {myScore}</p>
              <p>Opponent: {opponentScore}</p>
            </div>
          </>
        )}

        {disconnected ? (
          <div className="font-patrick text-sm text-gray-400">
            Returning to lobby in {exitTimer}s...
          </div>
        ) : (
          <>
            <button
              onClick={handlePlayAgain}
              className="font-fredoka text-lg transition-transform active:scale-90"
              style={{
                width: 220,
                height: 52,
                background: 'var(--color-btn-primary)',
                border: '3px solid var(--color-border)',
                borderRadius: 12,
                color: '#fff',
                textShadow: '1px 1px 0 #000, -1px -1px 0 #000',
                boxShadow: '0 5px 0 var(--color-border)',
                cursor: 'pointer',
              }}
            >
              PLAY AGAIN
            </button>

            <button
              onClick={onExitRoom}
              className="font-fredoka text-lg transition-transform active:scale-90"
              style={{
                width: 220,
                height: 52,
                background: '#e74c3c',
                border: '3px solid var(--color-border)',
                borderRadius: 12,
                color: '#fff',
                textShadow: '1px 1px 0 #000, -1px -1px 0 #000',
                boxShadow: '0 5px 0 var(--color-border)',
                cursor: 'pointer',
              }}
            >
              EXIT ROOM
            </button>
          </>
        )}
      </div>
    </div>
  );
}
