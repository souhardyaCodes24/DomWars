import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';

export function FakeCursor() {
  const hasFakeCursor = useGameStore((s) =>
    s.localEffects.some((e) => e.type === 'fakeCursor')
  );
  const [pos, setPos] = useState({ x: -100, y: -100 });

  useEffect(() => {
    if (!hasFakeCursor) {
      setPos({ x: -100, y: -100 });
      return;
    }

    const handle = (e: MouseEvent) => {
      setPos({ x: e.clientX + 40, y: e.clientY + 40 });
    };
    window.addEventListener('mousemove', handle);
    return () => window.removeEventListener('mousemove', handle);
  }, [hasFakeCursor]);

  if (!hasFakeCursor) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: 24,
        height: 24,
        pointerEvents: 'none',
        zIndex: 9999,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M2 2L9 21L11.5 14.5L18 11L2 2Z"
          fill="#ff6b6b"
          stroke="#1a1a2e"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="14" cy="14" r="4" fill="#ff6b6b" stroke="#1a1a2e" strokeWidth="2" />
      </svg>
    </div>
  );
}
