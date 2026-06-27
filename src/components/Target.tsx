import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { Target as TargetType } from '../types';
import { TARGET_CONFIG } from '../constants/game';
import { useGameStore } from '../store/gameStore';

interface TargetProps {
  target: TargetType;
  parentW: number;
  parentH: number;
}

export const Target = memo(function Target({ target, parentW, parentH }: TargetProps) {
  const handleTargetClick = useGameStore((s) => s.handleTargetClick);

  const cfg = TARGET_CONFIG[target.type];
  const pctW = target.x / 100;
  const pctH = target.y / 100;
  const left = pctW * parentW - cfg.size / 2;
  const top = pctH * parentH - cfg.size / 2;

  const handleClick = useCallback(() => {
    handleTargetClick(target.id, target.value, target.energyReward, target.isFake);
  }, [target.id, target.value, target.energyReward, target.isFake, handleTargetClick]);

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      exit={{ scale: 1.4, rotate: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 12 }}
      onClick={handleClick}
      style={{
        position: 'absolute',
        left,
        top,
        width: cfg.size + 6,
        height: cfg.size + 6,
        margin: -3,
        cursor: 'pointer',
        zIndex: 10,
      }}
      className="flex items-center justify-center"
    >
      {cfg.shape === 'circle' ? (
        <div
          style={{
            width: cfg.size,
            height: cfg.size,
            borderRadius: '50%',
            background: cfg.color,
            border: '3px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span className="font-fredoka text-xs text-white drop-shadow-md">
            {target.value}
          </span>
        </div>
      ) : (
        <div
          style={{
            width: cfg.size,
            height: cfg.size,
            borderRadius: 6,
            background: cfg.color,
            border: '3px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span className="font-fredoka text-xs text-white drop-shadow-md">
            {target.value}
          </span>
        </div>
      )}
    </motion.div>
  );
});
