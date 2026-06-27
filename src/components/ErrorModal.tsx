import { motion, AnimatePresence } from 'framer-motion';

interface ErrorAction {
  label: string;
  onClick: () => void;
  variant: 'primary' | 'danger' | 'secondary';
}

interface ErrorModalProps {
  open: boolean;
  title: string;
  message: string;
  actions: ErrorAction[];
  onClose?: () => void;
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary: {
    background: 'var(--color-btn-primary)',
    color: '#fff',
  },
  danger: {
    background: '#e74c3c',
    color: '#fff',
  },
  secondary: {
    background: '#4ecdc4',
    color: '#fff',
  },
};

export function ErrorModal({ open, title, message, actions, onClose }: ErrorModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              minWidth: 360,
              maxWidth: 440,
              padding: '28px 32px',
              background: '#fff',
              border: '4px solid var(--color-border)',
              borderRadius: 16,
              boxShadow: '8px 8px 0 var(--color-border)',
            }}
          >
            <h2
              className="font-fredoka text-lg mb-3"
              style={{ color: 'var(--color-corruption)' }}
            >
              {title}
            </h2>
            <p className="font-patrick text-sm leading-relaxed mb-5" style={{ color: '#555' }}>
              {message}
            </p>
            <div className="flex items-center justify-end gap-3">
              {actions.map((a, i) => (
                <button
                  key={i}
                  onClick={a.onClick}
                  className="font-fredoka text-sm transition-transform active:scale-90"
                  style={{
                    padding: '10px 22px',
                    border: '3px solid var(--color-border)',
                    borderRadius: 10,
                    boxShadow: '0 4px 0 var(--color-border)',
                    cursor: 'pointer',
                    textShadow: '1px 1px 0 #000, -1px -1px 0 #000',
                    ...variantStyles[a.variant],
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
