import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TARGET_CONFIG, ABILITIES, WIN_SCORE } from '../constants/game';

const PAGES = [
  { title: 'HOW TO PLAY' },
  { title: 'TARGETS' },
  { title: 'ATTACKS' },
  { title: 'DEFENSES' },
  { title: 'EFFECTS & RULES' },
];

function Arrow({ dir, onClick, disabled }: { dir: 'left' | 'right'; onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center transition-transform active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
      style={{
        width: 44,
        height: 44,
        background: '#4ecdc4',
        border: '3px solid var(--color-border)',
        borderRadius: 10,
        boxShadow: '0 4px 0 var(--color-border)',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        {dir === 'left' ? (
          <path d="M13 2L5 9L13 16" stroke="#1a1a2e" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M5 2L13 9L5 16" stroke="#1a1a2e" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  );
}

function Dot({ active }: { active: boolean }) {
  return (
    <div
      style={{
        width: active ? 12 : 8,
        height: active ? 12 : 8,
        borderRadius: '50%',
        background: active ? 'var(--color-border)' : '#bbb',
        transition: 'all 0.2s ease',
      }}
    />
  );
}

function TinyTargetPreview({ shape, color, size }: { shape: 'circle' | 'square'; color: string; size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: shape === 'circle' ? '50%' : 4,
        background: color,
        border: '2px solid var(--color-border)',
        flexShrink: 0,
      }}
    />
  );
}

function TargetRow({ typeKey }: { typeKey: string }) {
  const cfg = TARGET_CONFIG[typeKey as keyof typeof TARGET_CONFIG];
  if (!cfg) return null;
  const label = typeKey.charAt(0).toUpperCase() + typeKey.slice(1);
  return (
    <div className="flex items-center gap-4 py-2.5" style={{ borderBottom: '1px solid #ddd' }}>
      <TinyTargetPreview shape={cfg.shape} color={cfg.color} size={32} />
      <span className="font-fredoka text-base" style={{ color: 'var(--color-border)', minWidth: 70 }}>{label}</span>
      <span className="font-patrick text-sm" style={{ color: '#555' }}>Score <strong>{cfg.score}</strong></span>
      <span className="font-patrick text-sm" style={{ color: '#555' }}>Energy <strong>{cfg.energy}e</strong></span>
      <span className="font-patrick text-xs" style={{ color: '#999' }}>{(cfg.spawnWeight * 100)}% spawn</span>
    </div>
  );
}

function AbilityRow({ ability }: { ability: typeof ABILITIES[0] }) {
  const color = ability.color === 'var(--color-btn-primary)' ? '#ff6b6b' : '#4ecdc4';
  return (
    <div className="flex items-center gap-3 py-2.5" style={{ borderBottom: '1px solid #ddd' }}>
      <div
        className="flex items-center justify-center font-fredoka text-xs shrink-0"
        style={{
          width: 36,
          height: 36,
          background: color,
          border: '2px solid var(--color-border)',
          borderRadius: 8,
          color: '#fff',
          textShadow: '1px 1px 0 #000',
        }}
      >
        {ability.hotkey}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-fredoka text-sm" style={{ color: 'var(--color-border)' }}>{ability.label}</div>
        <div className="font-patrick text-xs leading-snug" style={{ color: '#555' }}>{ability.description}</div>
      </div>
      <div className="flex flex-col items-end gap-0.5 shrink-0">
        <span className="font-fredoka text-xs" style={{ color: '#00d4aa' }}>{ability.cost}e</span>
        {ability.category === 'attack' && ability.corruptionAdd > 0 && (
          <span className="font-fredoka text-xs" style={{ color: '#ff4757' }}>+{ability.corruptionAdd}%</span>
        )}
      </div>
    </div>
  );
}

const attacks = ABILITIES.filter((a) => a.category === 'attack');
const defenses = ABILITIES.filter((a) => a.category === 'defense');

function PageContent({ page }: { page: number }) {
  const shared = { padding: '28px 32px' };

  switch (page) {
    case 0:
      return (
        <div className="font-patrick text-base leading-relaxed" style={{ color: '#444', ...shared }}>
          <p className="mb-3"><strong style={{ color: 'var(--color-border)' }}>Goal:</strong> First player to <strong>{WIN_SCORE} points</strong> wins!</p>
          <p className="mb-3"><strong style={{ color: 'var(--color-border)' }}>Click targets</strong> to earn points and energy. Energy is spent on abilities.</p>
          <p className="mb-3">Use <strong style={{ color: 'var(--color-border)' }}>attacks</strong> to disrupt your opponent with visual effects and corruption. Use <strong style={{ color: 'var(--color-border)' }}>defenses</strong> to protect yourself.</p>
          <p>Watch your <strong style={{ color: 'var(--color-corruption)' }}>corruption bar</strong> — it fills up as you attack. At 100% you're in danger!</p>
        </div>
      );
    case 1:
      return (
        <div style={shared}>
          <TargetRow typeKey="small" />
          <TargetRow typeKey="medium" />
          <TargetRow typeKey="large" />
          <TargetRow typeKey="rare" />
        </div>
      );
    case 2:
      return (
        <div style={shared}>
          {attacks.map((a) => (
            <AbilityRow key={a.name} ability={a} />
          ))}
        </div>
      );
    case 3:
      return (
        <div style={shared}>
          {defenses.map((d) => (
            <AbilityRow key={d.name} ability={d} />
          ))}
          <div className="font-patrick text-sm mt-3 leading-relaxed" style={{ color: '#555' }}>
            <p><strong style={{ color: 'var(--color-border)' }}>Patch</strong> blocks the next incoming attack (one-time shield, consumed on block).</p>
            <p><strong style={{ color: 'var(--color-border)' }}>Safe Mode</strong> blocks all attacks for 5 seconds.</p>
          </div>
        </div>
      );
    case 4:
      return (
        <div className="font-patrick text-base leading-relaxed" style={{ color: '#444', ...shared }}>
          <p className="mb-3"><strong style={{ color: 'var(--color-border)' }}>Permanent effects</strong> (Rotate, Blur, Mirror, Invert) stay until removed by <strong>CSS Reset</strong>.</p>
          <p className="mb-3"><strong style={{ color: 'var(--color-border)' }}>Temporary effects</strong> (Shake, Cursor Hide, Fake Cursor, Target Clone) expire after a few seconds.</p>
          <p className="mb-3"><strong style={{ color: 'var(--color-corruption)' }}>Corruption</strong> increases with each attack you use. Use <strong>GC</strong> to reduce it.</p>
          <p>First to <strong>{WIN_SCORE} points</strong> wins the match!</p>
        </div>
      );
    default:
      return null;
  }
}

export function HowToPlay({ onClose }: { onClose: () => void }) {
  const [page, setPage] = useState(0);

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          minWidth: 520,
          maxWidth: 560,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#fff',
          border: '4px solid var(--color-border)',
          borderRadius: 16,
          boxShadow: '8px 8px 0 var(--color-border)',
          overflow: 'hidden',
        }}
      >
        <div className="flex items-center justify-between" style={{ padding: '24px 32px 0' }}>
          <h2 className="font-fredoka text-xl" style={{ color: 'var(--color-border)' }}>
            {PAGES[page].title}
          </h2>
          <span className="font-patrick text-sm" style={{ color: '#999' }}>
            {page + 1} / {PAGES.length}
          </span>
        </div>

        <div style={{ height: 2, background: '#ccc', margin: '16px 32px 0' }} />

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
            >
              <PageContent page={page} />
            </motion.div>
          </AnimatePresence>
        </div>

        <div style={{ height: 2, background: '#ccc', margin: '0 32px' }} />

        <div className="flex items-center justify-center gap-3" style={{ padding: '16px 32px' }}>
          <Arrow dir="left" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} />
          <div className="flex items-center gap-2 mx-2">
            {PAGES.map((_, i) => (
              <Dot key={i} active={i === page} />
            ))}
          </div>
          <Arrow dir="right" onClick={() => setPage((p) => Math.min(PAGES.length - 1, p + 1))} disabled={page === PAGES.length - 1} />
        </div>
      </div>
    </div>
  );
}
