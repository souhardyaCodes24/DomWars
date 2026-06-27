import type { TargetType, EffectType } from '../types';

export const TARGET_CONFIG: Record<TargetType, {
  score: number;
  energy: number;
  size: number;
  spawnWeight: number;
  color: string;
  shape: 'circle' | 'square';
}> = {
  small: {
    score: 10,
    energy: 2,
    size: 48,
    spawnWeight: 0.4,
    color: 'var(--color-target-small)',
    shape: 'circle',
  },
  medium: {
    score: 25,
    energy: 5,
    size: 48,
    spawnWeight: 0.4,
    color: 'var(--color-target-medium)',
    shape: 'square',
  },
  large: {
    score: 50,
    energy: 8,
    size: 64,
    spawnWeight: 0.1,
    color: '#ffa500',
    shape: 'circle',
  },
  rare: {
    score: 100,
    energy: 15,
    size: 48,
    spawnWeight: 0.1,
    color: '#ff69b4',
    shape: 'square',
  },
};

export const MAX_TARGETS = 20;
export const SPAWN_INTERVAL_MS = 500;
export const WIN_SCORE = 1000;
export const TARGET_SPEED = 18;

export interface AbilityConfig {
  name: string;
  hotkey: string;
  label: string;
  description: string;
  cost: number;
  corruptionAdd: number;
  category: 'attack' | 'defense';
  color: string;
  effectType?: EffectType;
  strength?: number;
  durationMs?: number;
}

export const ABILITIES: AbilityConfig[] = [
  { name: 'rotate', hotkey: 'Q', label: 'Rotate', description: 'Rotates the play area, making it harder to aim at targets', cost: 15, corruptionAdd: 5, category: 'attack', color: 'var(--color-btn-primary)', effectType: 'rotate', strength: 15 },
  { name: 'blur', hotkey: 'W', label: 'Blur', description: 'Blurs the play area to obscure target positions', cost: 20, corruptionAdd: 8, category: 'attack', color: 'var(--color-btn-primary)', effectType: 'blur', strength: 4 },
  { name: 'shake', hotkey: 'E', label: 'Shake', description: 'Shakes the screen violently to disorient your opponent', cost: 25, corruptionAdd: 10, category: 'attack', color: 'var(--color-btn-primary)', effectType: 'shake', strength: 1, durationMs: 4000 },
  { name: 'mirror', hotkey: 'R', label: 'Mirror', description: 'Flips the play area horizontally for visual confusion', cost: 35, corruptionAdd: 12, category: 'attack', color: 'var(--color-btn-primary)', effectType: 'mirror', strength: 1 },
  { name: 'invert', hotkey: 'T', label: 'Invert', description: 'Inverts all colors on the play area', cost: 20, corruptionAdd: 7, category: 'attack', color: 'var(--color-btn-primary)', effectType: 'invert', strength: 1 },
  { name: 'cursorHide', hotkey: 'Y', label: 'Hide Cursor', description: 'Hides the mouse cursor for 3 seconds', cost: 30, corruptionAdd: 15, category: 'attack', color: 'var(--color-btn-primary)', effectType: 'cursorHide', strength: 1, durationMs: 3000 },
  { name: 'fakeCursor', hotkey: 'U', label: 'Fake Cursor', description: 'Spawns a fake offset cursor to mislead clicks', cost: 40, corruptionAdd: 15, category: 'attack', color: 'var(--color-btn-primary)', effectType: 'fakeCursor', strength: 1, durationMs: 5000 },
  { name: 'targetClone', hotkey: 'O', label: 'Clone', description: 'Spawns 4 fake decoy targets that give no points', cost: 35, corruptionAdd: 10, category: 'attack', color: 'var(--color-btn-primary)', effectType: 'targetClone', strength: 4, durationMs: 5000 },
  { name: 'targetTeleport', hotkey: 'P', label: 'Teleport', description: 'Teleports all targets to random positions', cost: 45, corruptionAdd: 15, category: 'attack', color: 'var(--color-btn-primary)', effectType: 'targetTeleport', strength: 1 },
  { name: 'cssReset', hotkey: '1', label: 'CSS Reset', description: 'Removes one random active visual effect from yourself', cost: 30, corruptionAdd: 0, category: 'defense', color: 'var(--color-btn-secondary)' },
  { name: 'patch', hotkey: '2', label: 'Patch', description: 'Blocks the next incoming attack (one-time shield)', cost: 25, corruptionAdd: 0, category: 'defense', color: 'var(--color-btn-secondary)' },
  { name: 'safeMode', hotkey: '3', label: 'Safe Mode', description: 'Temporarily blocks all attacks for 5 seconds', cost: 40, corruptionAdd: 0, category: 'defense', color: 'var(--color-btn-secondary)' },
  { name: 'gc', hotkey: '4', label: 'GC', description: 'Garbage collector — reduces corruption by 20%', cost: 50, corruptionAdd: 0, category: 'defense', color: 'var(--color-btn-secondary)' },
];

export const CORRUPTION_CAPS: Partial<Record<EffectType, number>> = {
  rotate: 30,
  blur: 12,
};

export const NOTIFICATION_TEXTS: Record<string, string> = {
  rotate: 'Screen spinning!',
  blur: 'Blurred!',
  shake: 'Earthquake!',
  mirror: 'Mirrored!',
  invert: 'Inverted!',
  cursorHide: 'Cursor gone!',
  fakeCursor: 'Fake cursor!',
  targetClone: 'Fake targets!',
  targetTeleport: 'Scrambled!',
  cssReset: 'Reset!',
  patch: 'Shield up!',
  safeMode: 'Safe mode!',
  gc: 'Cleaned!',
  blockedPatch: 'Patched!',
  blockedSafe: 'Safe mode blocked!',
};
