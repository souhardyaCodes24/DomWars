import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

export function CountdownOverlay() {
  const gamePhase = useGameStore((s) => s.gamePhase);
  const countdownValue = useGameStore((s) => s.countdownValue);

  return (
    <AnimatePresence>
      {gamePhase === 'countdown' && (
        <motion.div
          key="countdown"
          className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.35)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            key={countdownValue}
            className="font-fredoka font-bold"
            style={{ color: '#fff', fontSize: countdownValue === 0 ? 100 : 140, textShadow: '4px 4px 0 rgba(0,0,0,0.3)' }}
            initial={{ scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            {countdownValue === 0 ? 'GO!' : countdownValue}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
