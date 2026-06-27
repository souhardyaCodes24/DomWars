import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { WIN_SCORE } from '../constants/game';

function HUDTooltip({ children, label, description }: { children: React.ReactNode; label: string; description: string }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      {hovered && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 pointer-events-none"
          style={{ minWidth: 200 }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderBottom: '8px solid var(--color-border)',
              margin: '0 auto',
            }}
          />
          <div
            className="font-fredoka"
            style={{
              padding: '14px 18px',
              background: '#fff',
              border: '3px solid var(--color-border)',
              borderRadius: 12,
              color: 'var(--color-border)',
              boxShadow: '4px 4px 0 var(--color-border)',
            }}
          >
            <p className="text-sm font-bold mb-1.5">{label}</p>
            <p className="font-patrick text-xs leading-snug" style={{ color: '#444' }}>
              {description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function TopHUD({ onLeaveClick }: { onLeaveClick?: () => void }) {
  const myStats = useGameStore((s) => s.myStats);
  const isPatched = useGameStore((s) => s.isPatched);
  const isSafeMode = useGameStore((s) => s.isSafeMode);
  const energyOverflow = myStats.energy > 100;

  return (
    <div
      className="flex items-center py-3 relative"
      style={{
        padding: '12px 40px',
        background: 'var(--color-hud-bg)',
        borderBottom: '4px solid var(--color-border)',
      }}
    >
      <div className="flex items-center gap-1.5 shrink-0">
        <span
          className="font-fredoka text-xl"
          style={{ color: 'var(--color-score)' }}
        >
          SCORE: {myStats.score}
        </span>
        <span className="text-sm font-patrick" style={{ color: '#888' }}>
          / {WIN_SCORE}
        </span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        {isPatched && (
          <span className="font-fredoka text-xs px-2 py-0.5 rounded shrink-0" style={{ background: '#4ecdc4', color: '#000', border: '2px solid var(--color-border)' }}>
            PATCHED
          </span>
        )}
        {isSafeMode && (
          <span className="font-fredoka text-xs px-2 py-0.5 rounded shrink-0" style={{ background: '#ffd700', color: '#000', border: '2px solid var(--color-border)' }}>
            SAFE
          </span>
        )}

        <HUDTooltip
          label="CORRUPTION"
          description="Using attacks fills the corruption bar. At 100% the play area gets heavily corrupted!"
        >
          <div className="flex items-center gap-2 cursor-default shrink-0">
            <span className="font-fredoka text-sm text-gray-300">CORRUPTION</span>
            <div
              style={{
                width: 130,
                height: 20,
                background: '#444',
                border: '2px solid var(--color-border)',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
              width: `${myStats.corruption}%`,
              height: '100%',
              background: 'var(--color-corruption)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <span
          className="font-fredoka text-sm"
          style={{ color: 'var(--color-corruption)' }}
        >
          {myStats.corruption}%
            </span>
          </div>
        </HUDTooltip>

        <HUDTooltip
          label="ENERGY"
          description={energyOverflow ? 'Energy is overflowing! Keep clicking!' : 'Click targets to earn energy (E). Spend it to use attacks and defenses!'}
        >
          <div className="flex items-center gap-2 cursor-default shrink-0">
            <span className="font-fredoka text-sm text-gray-300">ENERGY</span>
            <div
              style={{
                width: 110,
                height: 20,
                background: '#444',
                border: '2px solid var(--color-border)',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
              width: `${Math.min(100, myStats.energy)}%`,
              height: '100%',
              background: energyOverflow ? '#00ffaa' : 'var(--color-energy)',
              transition: 'width 0.15s ease',
              boxShadow: energyOverflow ? '0 0 8px #00ffaa' : undefined,
              animation: energyOverflow ? 'energyGlow 0.8s ease-in-out infinite alternate' : undefined,
            }}
          />
        </div>
        <span
          className="font-fredoka text-sm"
          style={{ color: energyOverflow ? '#00ffaa' : 'var(--color-energy)' }}
        >
          {myStats.energy}
            </span>
          </div>
        </HUDTooltip>

        {onLeaveClick && (
          <button
            onClick={onLeaveClick}
            className="font-fredoka text-sm font-bold transition-transform active:scale-90 shrink-0"
            style={{
              padding: '6px 14px',
              background: '#e74c3c',
              border: '3px solid var(--color-border)',
              borderRadius: 10,
              color: '#fff',
              textShadow: '1px 1px 0 #000, -1px -1px 0 #000',
              boxShadow: '0 4px 0 var(--color-border)',
              cursor: 'pointer',
            }}
          >
            LEAVE
          </button>
        )}
      </div>

      <style>{`
        @keyframes energyGlow {
          0% { box-shadow: 0 0 4px #00ffaa; }
          100% { box-shadow: 0 0 16px #00ffaa, 0 0 30px #00ffaa; }
        }
      `}</style>
    </div>
  );
}
