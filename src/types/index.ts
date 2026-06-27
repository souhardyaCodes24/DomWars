export type TargetType = 'small' | 'medium' | 'large' | 'rare';

export interface Target {
  id: string;
  type: TargetType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  energyReward: number;
  createdAt: number;
  isFake?: boolean;
  targetFor?: 'host' | 'client';
}

export type EffectType =
  | 'rotate'
  | 'blur'
  | 'shake'
  | 'mirror'
  | 'invert'
  | 'cursorHide'
  | 'fakeCursor'
  | 'targetClone'
  | 'targetTeleport';

export interface ActiveEffect {
  id: string;
  type: EffectType;
  strength: number;
  expiresAt: number | null;
}
