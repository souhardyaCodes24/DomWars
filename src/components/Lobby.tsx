import { useState, useCallback } from 'react';
import { HowToPlay } from './HowToPlay';
import { ErrorModal } from './ErrorModal';

export interface WebRTCState {
  roomId: string | null;
  isHost: boolean;
  isConnected: boolean;
  error: string | null;
  errorTitle?: string | null;
  createRoom: () => Promise<void>;
  joinRoom: (roomId: string) => Promise<void>;
  sendMessage: (msg: unknown) => void;
  disconnect: () => void;
}

interface LobbyProps {
  webrtc: WebRTCState;
  onPlayground: () => void;
  isServerReady: boolean;
  serverMessage: string;
}

export function Lobby({ webrtc, onPlayground, isServerReady, serverMessage }: LobbyProps) {
  const [joinInput, setJoinInput] = useState('');
  const [loading, setLoading] = useState<'create' | 'join' | null>(null);
  const [showManual, setShowManual] = useState(false);

  const handleCreate = useCallback(async () => {
    setLoading('create');
    await webrtc.createRoom();
    setLoading(null);
  }, [webrtc]);

  const handleJoin = useCallback(async () => {
    if (!joinInput.trim()) return;
    setLoading('join');
    try {
      await webrtc.joinRoom(joinInput.trim());
    } catch {}
    setLoading(null);
  }, [webrtc, joinInput]);

  const isLoading = loading !== null;

  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{ width: '100vw', height: '100vh', background: 'var(--color-board-bg)' }}
    >
      {showManual && <HowToPlay onClose={() => setShowManual(false)} />}

      <button
        onClick={() => setShowManual(true)}
        className="font-fredoka text-sm transition-transform active:scale-90 fixed"
        style={{
          top: 16,
          right: 16,
          zIndex: 30,
          padding: '8px 18px',
          background: '#fff',
          border: '3px solid var(--color-border)',
          borderRadius: 10,
          color: 'var(--color-border)',
          boxShadow: '4px 4px 0 var(--color-border)',
          cursor: 'pointer',
        }}
      >
        HOW TO PLAY
      </button>

      {!isServerReady && (
        <div
          className="font-fredoka text-sm flex items-center gap-2"
          style={{
            padding: '10px 20px',
            marginBottom: 10,
            background: '#d4edda',
            border: '3px solid #4ecdc4',
            borderRadius: 12,
            color: '#155724',
            boxShadow: '4px 4px 0 #4ecdc4',
            maxWidth: 420,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#4ecdc4',
              display: 'inline-block',
              animation: 'pulse 1.2s ease-in-out infinite',
            }}
          />
          {serverMessage}
        </div>
      )}

      <div
        className="flex flex-col items-center gap-6"
        style={{
          padding: '32px 40px',
          border: '4px solid var(--color-border)',
          borderRadius: 16,
          background: '#fff',
          boxShadow: '8px 8px 0 var(--color-border)',
          minWidth: 380,
        }}
      >
        <h1
          className="font-fredoka text-4xl"
          style={{
            color: 'var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          DOM
          <img src="/icon.png" alt="" style={{ height: '1em', width: 'auto', display: 'block' }} />
          WARS
        </h1>
        <p className="font-patrick text-lg text-gray-600 -mt-3">
          Weaponize frontend bugs!
        </p>

        {webrtc.roomId && !webrtc.isConnected ? (
          <div className="flex flex-col items-center gap-3">
            <p className="font-patrick text-base text-gray-600">
              Share this room code:
            </p>
            <div
              className="font-fredoka text-3xl tracking-widest cursor-pointer select-all transition-transform active:scale-95"
              style={{
                padding: '12px 32px',
                border: '3px solid var(--color-border)',
                borderRadius: 8,
                background: '#fef9e7',
              }}
              onClick={() => navigator.clipboard.writeText(webrtc.roomId!)}
              title="Click to copy"
            >
              {webrtc.roomId}
            </div>
            <p className="font-patrick text-sm text-gray-500 animate-pulse">
              Waiting for opponent...
            </p>
          </div>
        ) : (
          <>
            <button
              onClick={handleCreate}
              disabled={isLoading || !isServerReady}
              className="font-fredoka text-lg transition-transform active:scale-90 disabled:opacity-50"
              style={{
                width: 260,
                height: 56,
                background: 'var(--color-btn-primary)',
                border: '3px solid var(--color-border)',
                borderRadius: 12,
                color: '#fff',
                textShadow: '1px 1px 0 #000, -1px -1px 0 #000',
                boxShadow: '0 5px 0 var(--color-border)',
                cursor: isLoading || !isServerReady ? 'not-allowed' : 'pointer',
              }}
            >
              {loading === 'create' ? 'CREATING...' : !isServerReady ? 'CONNECTING...' : 'CREATE ROOM'}
            </button>

            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div style={{ flex: 1, height: 2, background: '#ccc' }} />
              <span className="font-patrick text-sm text-gray-400">OR</span>
              <div style={{ flex: 1, height: 2, background: '#ccc' }} />
            </div>

            <div className="flex gap-2 w-full">
              <input
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                placeholder="Enter room code"
                maxLength={8}
                className="font-fredoka text-center flex-1"
                style={{
                  height: 56,
                  border: '3px solid var(--color-border)',
                  borderRadius: 12,
                  outline: 'none',
                  fontSize: 18,
                  textTransform: 'uppercase',
                  background: '#fff',
                }}
              />
              <button
                onClick={handleJoin}
                disabled={isLoading || !joinInput.trim() || !isServerReady}
                className="font-fredoka text-lg transition-transform active:scale-90 disabled:opacity-50"
                style={{
                  width: 120,
                  height: 56,
                  background: 'var(--color-btn-secondary)',
                  border: '3px solid var(--color-border)',
                  borderRadius: 12,
                  color: '#fff',
                  textShadow: '1px 1px 0 #000, -1px -1px 0 #000',
                  boxShadow: '0 5px 0 var(--color-border)',
                  cursor: isLoading || !joinInput.trim() || !isServerReady ? 'not-allowed' : 'pointer',
                }}
              >
                {loading === 'join' ? '...' : 'JOIN'}
              </button>
            </div>

            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div style={{ flex: 1, height: 2, background: '#ccc' }} />
            </div>

            <button
              onClick={onPlayground}
              className="font-fredoka text-lg transition-transform active:scale-90"
              style={{
                width: 260,
                height: 56,
                background: '#ffd700',
                border: '3px solid var(--color-border)',
                borderRadius: 12,
                color: '#000',
                textShadow: 'none',
                boxShadow: '0 5px 0 var(--color-border)',
                cursor: 'pointer',
              }}
            >
              TRY PLAYGROUND
            </button>
          </>
        )}

        <ErrorModal
          open={!!webrtc.error && !!webrtc.errorTitle}
          title={webrtc.errorTitle || ''}
          message={webrtc.error || ''}
          actions={[
            { label: 'OK', onClick: webrtc.disconnect, variant: 'primary' },
          ]}
          onClose={webrtc.disconnect}
        />
      </div>
    </div>
  );
}
