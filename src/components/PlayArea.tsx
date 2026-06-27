import { useRef, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { Target } from './Target';
import { FakeCursor } from './FakeCursor';

export function PlayArea() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isHost = useGameStore((s) => s.isHost);
  const targets = useGameStore((s) => s.targets);
  const visibleTargets = isHost ? targets.filter((t) => t.targetFor !== 'client') : targets;
  const localEffects = useGameStore((s) => s.localEffects);
  const floatingScores = useGameStore((s) => s.floatingScores);
  const cleanupFloatingScores = useGameStore((s) => s.cleanupFloatingScores);
  const [size, setSize] = useState({ w: 800, h: 500 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ w: width, h: height });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(cleanupFloatingScores, 1000);
    return () => clearInterval(interval);
  }, [cleanupFloatingScores]);

  const rotate = localEffects
    .filter((e) => e.type === 'rotate')
    .reduce((sum, e) => sum + e.strength, 0);

  const blur = localEffects
    .filter((e) => e.type === 'blur')
    .reduce((sum, e) => sum + e.strength, 0);

  const hasMirror = localEffects.some((e) => e.type === 'mirror');
  const hasInvert = localEffects.some((e) => e.type === 'invert');
  const hasShake = localEffects.some((e) => e.type === 'shake');
  const hasCursorHide = localEffects.some((e) => e.type === 'cursorHide');

  const transforms: string[] = [];
  if (rotate) transforms.push(`rotate(${Math.min(rotate, 30)}deg)`);
  if (hasMirror) transforms.push(`scaleX(-1)`);

  const filters: string[] = [];
  if (blur) filters.push(`blur(${Math.min(blur, 12)}px)`);
  if (hasInvert) filters.push(`invert(1)`);

  return (
    <>
      <div
        ref={containerRef}
        className="relative flex-1 mx-4 my-2 overflow-hidden"
        style={{
          background: '#f0e6d3',
          border: '4px solid var(--color-border)',
          borderRadius: 0,
          cursor: hasCursorHide ? 'none' : undefined,
          animation: hasShake ? 'shake 0.15s infinite' : undefined,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            transform: transforms.length ? transforms.join(' ') : undefined,
            filter: filters.length ? filters.join(' ') : undefined,
          }}
        >
          <AnimatePresence>
            {visibleTargets.map((t) => (
              <Target key={t.id} target={t} parentW={size.w} parentH={size.h} />
            ))}
          </AnimatePresence>
          {floatingScores.map((f) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 0, y: -40 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="font-fredoka text-lg font-bold pointer-events-none"
              style={{
                position: 'absolute',
                left: (f.x / 100) * size.w,
                top: (f.y / 100) * size.h,
                color: f.color,
                textShadow: '2px 2px 0 #000, -1px -1px 0 #000',
                zIndex: 20,
              }}
            >
              {f.text}
            </motion.div>
          ))}
        </div>
      </div>
      <FakeCursor />
    </>
  );
}
