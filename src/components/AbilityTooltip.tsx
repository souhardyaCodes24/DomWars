import type { AbilityConfig } from '../constants/game';

interface AbilityTooltipProps {
  ability: AbilityConfig;
}

export function AbilityTooltip({ ability }: AbilityTooltipProps) {
  const isAttack = ability.category === 'attack';

  return (
    <div
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none"
      style={{ minWidth: 250 }}
    >
      <div
        className="relative font-fredoka"
        style={{
          padding: '14px 18px',
          background: '#fff',
          border: '3px solid var(--color-border)',
          borderRadius: 12,
          color: 'var(--color-border)',
          boxShadow: '4px 4px 0 var(--color-border)',
        }}
      >
        <div className="flex items-center justify-between mb-1.5 gap-2">
          <span className="text-base font-bold">{ability.label}</span>
          <span
            className="text-xs px-2 py-0.5 rounded shrink-0"
            style={{
              background: isAttack ? 'var(--color-btn-primary)' : 'var(--color-btn-secondary)',
              color: '#fff',
              textShadow: '1px 1px 0 #000',
            }}
          >
            {isAttack ? 'ATTACK' : 'DEFENSE'}
          </span>
        </div>

        <p className="font-patrick text-sm leading-snug mb-2.5" style={{ color: '#444' }}>
          {ability.description}
        </p>

        <div className="flex items-center gap-2 text-xs border-t pt-2 flex-wrap" style={{ borderColor: '#ddd' }}>
          <span>
            Cost: <strong style={{ color: isAttack ? 'var(--color-btn-primary)' : 'var(--color-btn-secondary)' }}>{ability.cost}e</strong>
          </span>
          {isAttack && ability.corruptionAdd > 0 && (
            <span style={{ color: 'var(--color-corruption)' }}>
              +{ability.corruptionAdd}%
            </span>
          )}
          {ability.durationMs && (
            <span>{(ability.durationMs / 1000).toFixed(0)}s</span>
          )}
          <span className="ml-auto opacity-60">[{ability.hotkey}]</span>
        </div>
      </div>
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '8px solid var(--color-border)',
          margin: '0 auto',
        }}
      />
    </div>
  );
}
