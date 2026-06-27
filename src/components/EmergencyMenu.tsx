import { useGameStore } from '../store/gameStore';
import { ErrorModal } from './ErrorModal';

interface EmergencyMenuProps {
  open: boolean;
  onClose: () => void;
}

export function EmergencyMenu({ open, onClose }: EmergencyMenuProps) {
  const isHost = useGameStore((s) => s.isHost);
  const sendToPeer = useGameStore((s) => s.sendToPeer);
  const setPhase = (phase: 'countdown' | 'playing' | 'finished') =>
    useGameStore.setState({ gamePhase: phase });
  const setWinner = (w: 'host' | 'client' | null) =>
    useGameStore.setState({ winner: w });

  const handleSurrender = () => {
    const winner = isHost ? 'client' : 'host';
    setWinner(winner);
    setPhase('finished');
    sendToPeer?.({ type: 'surrender' });
    onClose();
  };

  return (
    <ErrorModal
      open={open}
      title="Maximum call stack size exceeded"
      message="The DOM is too corrupted to interact with. Press ESC to access the emergency exit menu."
      actions={[
        { label: 'SURRENDER', onClick: handleSurrender, variant: 'danger' },
        { label: 'RESUME', onClick: onClose, variant: 'primary' },
      ]}
    />
  );
}
