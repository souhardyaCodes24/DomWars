import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

export function Notifications() {
  const notifications = useGameStore((s) => s.notifications);
  const cleanupNotifications = useGameStore((s) => s.cleanupNotifications);

  useEffect(() => {
    const interval = setInterval(cleanupNotifications, 500);
    return () => clearInterval(interval);
  }, [cleanupNotifications]);

  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center pointer-events-none" style={{ paddingTop: 8 }}>
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: -30, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="font-fredoka text-lg font-bold text-center"
            style={{
              padding: '10px 28px',
              marginBottom: 8,
              background: '#fff',
              border: '3px solid var(--color-border)',
              borderRadius: 10,
              color: 'var(--color-border)',
              boxShadow: '4px 4px 0 var(--color-border)',
            }}
          >
            {n.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
