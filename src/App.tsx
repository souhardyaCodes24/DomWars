import { useCallback, useState } from 'react';
import { useWebRTC } from './hooks/useWebRTC';
import { useServerStatus } from './hooks/useServerStatus';
import { useGameStore } from './store/gameStore';
import { Lobby } from './components/Lobby';
import { Game } from './components/Game';

export default function App() {
  const [mode, setMode] = useState<'lobby' | 'playground' | 'p2p'>('lobby');
  const webrtc = useWebRTC();
  const { isServerReady, message: serverMessage } = useServerStatus();

  const handleExitRoom = useCallback(() => {
    useGameStore.getState().resetGame();
    useGameStore.getState().setHost(false);
    useGameStore.getState().setSendToPeer(null);
    webrtc.disconnect();
    setMode('lobby');
  }, [webrtc]);

  if (mode === 'playground') {
    return <Game mode="playground" onExitRoom={() => setMode('lobby')} />;
  }

  if (webrtc.isConnected) {
    return <Game mode="p2p" onExitRoom={handleExitRoom} />;
  }

  return <Lobby webrtc={webrtc} onPlayground={() => setMode('playground')} isServerReady={isServerReady} serverMessage={serverMessage} />;
}
