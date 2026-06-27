import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { ABILITIES } from '../constants/game';
import type { AbilityConfig as AbilityConfigType } from '../constants/game';
import { AbilityTooltip } from './AbilityTooltip';

function GameButton({ ability }: { ability: AbilityConfigType }) {
  const [hovered, setHovered] = useState(false);
  const useAbility = useGameStore((s) => s.useAbility);
  const energy = useGameStore((s) => s.myStats.energy);
  const isPatched = useGameStore((s) => s.isPatched);
  const isSafeMode = useGameStore((s) => s.isSafeMode);

  const isAttack = ability.category === 'attack';
  const blocked = isAttack && (isPatched || isSafeMode);
  const canAfford = energy >= ability.cost;

  const handleClick = () => {
    useAbility(ability.name);
  };

  return (
    <div className="relative">
      {hovered && <AbilityTooltip ability={ability} />}
      <button
        onClick={handleClick}
        disabled={!canAfford}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="flex flex-col items-center justify-center gap-0.5 font-fredoka transition-transform active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          width: 110,
          height: 72,
          background: ability.color,
          border: '3px solid var(--color-border)',
          borderRadius: 12,
          color: '#fff',
          textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
          boxShadow: blocked
            ? '0 2px 0 var(--color-border)'
            : '0 5px 0 var(--color-border)',
          opacity: blocked ? 0.5 : canAfford ? 1 : 0.5,
        }}
      >
        <span className="text-base leading-none font-bold">{ability.label}</span>
        <span className="text-xs opacity-90">
          [{ability.hotkey}] {ability.cost}e
        </span>
        {ability.category === 'attack' && ability.corruptionAdd > 0 && (
          <span className="text-[10px] opacity-80 leading-none">
            +{ability.corruptionAdd}%
          </span>
        )}
      </button>
    </div>
  );
}

export function BottomControls() {
  const attacks = ABILITIES.filter((a) => a.category === 'attack');
  const defenses = ABILITIES.filter((a) => a.category === 'defense');

  return (
    <div
      className="flex items-center justify-center gap-3 px-4 py-3 flex-wrap"
      style={{
        background: 'var(--color-hud-bg)',
        borderTop: '4px solid var(--color-border)',
      }}
    >
      {attacks.map((a) => (
        <GameButton key={a.name} ability={a} />
      ))}
      <div
        style={{
          width: 3,
          height: 40,
          background: '#555',
          borderRadius: 2,
          margin: '0 4px',
        }}
      />
      {defenses.map((d) => (
        <GameButton key={d.name} ability={d} />
      ))}
    </div>
  );
}
