import { create } from 'zustand';
import type { Target, TargetType, ActiveEffect, EffectType } from '../types';
import { TARGET_CONFIG, MAX_TARGETS, ABILITIES, CORRUPTION_CAPS, TARGET_SPEED, WIN_SCORE, NOTIFICATION_TEXTS } from '../constants/game';

let targetIdCounter = 0;
let effectIdCounter = 0;
let floatIdCounter = 0;
let notifIdCounter = 0;

interface FloatingScore {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  createdAt: number;
}

interface Notification {
  id: string;
  text: string;
  createdAt: number;
}

interface PlayerStats {
  score: number;
  energy: number;
  corruption: number;
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function pickTargetType(): TargetType {
  const roll = Math.random();
  let acc = 0;
  for (const [type, cfg] of Object.entries(TARGET_CONFIG)) {
    acc += cfg.spawnWeight;
    if (roll <= acc) return type as TargetType;
  }
  return 'small';
}

function createTarget(boardW: number, boardH: number, isFake = false, targetFor?: 'host' | 'client'): Target {
  const type = pickTargetType();
  const cfg = TARGET_CONFIG[type];
  const id = ++targetIdCounter;
  const speed = TARGET_SPEED;
  const side = Math.floor(Math.random() * 4);

  let x: number, y: number, vx: number, vy: number;

  const offScreen = 6;
  switch (side) {
    case 0:
      x = -offScreen; y = randomBetween(0, boardH); vx = speed; vy = 0; break;
    case 1:
      x = boardW + offScreen; y = randomBetween(0, boardH); vx = -speed; vy = 0; break;
    case 2:
      x = randomBetween(0, boardW); y = -offScreen; vx = 0; vy = speed; break;
    default:
      x = randomBetween(0, boardW); y = boardH + offScreen; vx = 0; vy = -speed; break;
  }

  return {
    id: `t${id}`, type, x, y, vx, vy,
    value: isFake ? (Math.random() < 0.5 ? 10 : 25) : cfg.score,
    energyReward: isFake ? 0 : cfg.energy,
    createdAt: Date.now(), isFake, targetFor,
  };
}

function computeEffectValue(effects: ActiveEffect[], type: EffectType): number {
  const cap = CORRUPTION_CAPS[type];
  const total = effects.filter((e) => e.type === type).reduce((sum, e) => sum + e.strength, 0);
  return cap !== undefined ? Math.min(total, cap) : total;
}

function addEffect(effects: ActiveEffect[], type: EffectType, strength: number, durationMs: number | null): ActiveEffect[] {
  const effect: ActiveEffect = {
    id: `e${++effectIdCounter}`, type, strength,
    expiresAt: durationMs ? Date.now() + durationMs : null,
  };
  return [...effects, effect];
}

function toggleEffect(effects: ActiveEffect[], type: EffectType, strength: number): ActiveEffect[] {
  const existing = effects.find((e) => e.type === type);
  if (existing) return effects.filter((e) => e.id !== existing.id);
  return addEffect(effects, type, strength, null);
}

type GamePhase = 'countdown' | 'playing' | 'finished';

interface GameState {
  myStats: PlayerStats;
  opponentStats: PlayerStats;
  localEffects: ActiveEffect[];
  opponentEffects: ActiveEffect[];
  targets: Target[];
  boardWidth: number;
  boardHeight: number;
  isPatched: boolean;
  isSafeMode: boolean;
  isHost: boolean;
  sendToPeer: ((msg: unknown) => void) | null;
  floatingScores: FloatingScore[];
  gamePhase: GamePhase;
  winner: 'host' | 'client' | null;
  countdownValue: number;
  notifications: Notification[];
  disconnected: boolean;

  useAbility: (name: string) => void;
  useRemoteAbility: (name: string) => void;
  handleTargetClick: (targetId: string, value: number, energyReward: number, isFake: boolean | undefined, targetIsOpponent?: boolean, targetX?: number, targetY?: number) => void;
  removeTarget: (id: string) => void;
  applyRemoteState: (payload: any) => void;
  spawnTarget: () => void;
  updateTargets: (dt: number) => void;
  tickEffects: (_dt: number) => void;
  removeEffect: (id: string) => void;
  removeRandomEffect: () => void;
  clearAllEffects: () => void;
  teleportTargets: () => void;
  setHost: (isHost: boolean) => void;
  setSendToPeer: (fn: ((msg: unknown) => void) | null) => void;
  addFloatingScore: (x: number, y: number, text: string, color: string) => void;
  cleanupFloatingScores: () => void;
  computeRotate: () => number;
  computeBlur: () => number;
  hasEffect: (type: EffectType) => boolean;
  addNotification: (text: string) => void;
  cleanupNotifications: () => void;
  resetGame: () => void;
  setDisconnected: (val: boolean) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  myStats: { score: 0, energy: 60, corruption: 0 },
  opponentStats: { score: 0, energy: 60, corruption: 0 },
  localEffects: [],
  opponentEffects: [],
  targets: [],
  boardWidth: 100,
  boardHeight: 100,
  isPatched: false,
  isSafeMode: false,
  isHost: false,
  sendToPeer: null,
  floatingScores: [],
  gamePhase: 'countdown',
  winner: null,
  countdownValue: 3,
  notifications: [],
  disconnected: false,

  useAbility: (name: string) => {
    const state = get();
    const ability = ABILITIES.find((a) => a.name === name);
    if (!ability) return;

    if (!state.isHost && state.sendToPeer) {
      state.sendToPeer({ type: 'ability', name });
      return;
    }

    if (state.myStats.energy < ability.cost) return;
    if (state.isSafeMode && ability.category === 'attack') return;

    // Spend energy
    set((s) => ({ myStats: { ...s.myStats, energy: s.myStats.energy - ability.cost } }));

    if (ability.category === 'defense') {
      const text = NOTIFICATION_TEXTS[ability.name] || ability.label;
      state.addNotification(text);
      // Self-buff — apply locally
      switch (ability.name) {
        case 'cssReset':
          state.removeRandomEffect();
          break;
        case 'patch':
          set({ isPatched: true });
          break;
        case 'safeMode':
          set({ isSafeMode: true });
          set((s) => ({ localEffects: addEffect(s.localEffects, 'shake', 1, 5000) }));
          break;
        case 'gc':
          set((s) => ({ myStats: { ...s.myStats, corruption: Math.max(0, s.myStats.corruption - 20) } }));
          break;
      }
      return;
    }

    // Attack — target the opponent
    const isPlayground = !state.sendToPeer;

    // Check if opponent has Patch or Safe Mode active
    const opponentPatched = !isPlayground && (state.opponentStats as any).isPatched;
    const opponentSafe = !isPlayground && (state.opponentStats as any).isSafeMode;

    if (opponentSafe) return;
    if (opponentPatched) {
      set((s) => ({ opponentStats: { score: s.opponentStats.score, energy: s.opponentStats.energy, corruption: s.opponentStats.corruption } }));
      state.sendToPeer?.({ type: 'notification', text: NOTIFICATION_TEXTS.blockedPatch });
      return;
    }

    const effectsList = isPlayground ? 'localEffects' : 'opponentEffects';
    const statsList = isPlayground ? 'myStats' : 'opponentStats';

    set((s) => ({ [statsList]: { ...s[statsList as keyof typeof s] as PlayerStats, corruption: Math.min(100, (s[statsList as keyof typeof s] as PlayerStats).corruption + ability.corruptionAdd) } }));

    if (!isPlayground) {
      state.sendToPeer?.({ type: 'notification', text: NOTIFICATION_TEXTS[ability.name] || ability.label });
    }

    switch (ability.name) {
      case 'rotate':
      case 'blur':
        set((s) => ({ [effectsList]: addEffect(s[effectsList], ability.effectType!, ability.strength!, null) }));
        break;
      case 'mirror':
      case 'invert':
        set((s) => ({ [effectsList]: toggleEffect(s[effectsList], ability.effectType!, ability.strength!) }));
        break;
      case 'shake':
      case 'cursorHide':
      case 'fakeCursor':
        set((s) => ({ [effectsList]: addEffect(s[effectsList], ability.effectType!, ability.strength!, ability.durationMs!) }));
        break;
      case 'targetClone': {
        const count = ability.strength!;
        const targetFor = isPlayground ? undefined : (state.isHost ? 'client' : 'host');
        const clones: Target[] = [];
        for (let i = 0; i < count; i++) {
          clones.push(createTarget(state.boardWidth, state.boardHeight, true, targetFor));
        }
        set((s) => ({ targets: [...s.targets, ...clones] }));
        set((s) => ({ [effectsList]: addEffect(s[effectsList], 'targetClone', count, ability.durationMs!) }));
        break;
      }
      case 'targetTeleport':
        state.teleportTargets();
        break;
    }
  },

  useRemoteAbility: (name: string) => {
    const state = get();
    const ability = ABILITIES.find((a) => a.name === name);
    if (!ability) return;

    if (state.isSafeMode && ability.category === 'attack') {
      state.addNotification(NOTIFICATION_TEXTS.blockedSafe || 'Safe mode blocked!');
      return;
    }
    if (state.isPatched && ability.category === 'attack') {
      set({ isPatched: false });
      state.addNotification(NOTIFICATION_TEXTS.blockedPatch || 'Patched!');
      return;
    }

    if (state.opponentStats.energy < ability.cost) return;

    // Deduct opponent's energy
    set((s) => ({ opponentStats: { ...s.opponentStats, energy: s.opponentStats.energy - ability.cost } }));

    if (ability.category === 'defense') {
      const text = NOTIFICATION_TEXTS[ability.name] || ability.label;
      state.sendToPeer?.({ type: 'notification', text });
      switch (ability.name) {
        case 'patch':
          set((s) => ({ opponentStats: { ...s.opponentStats, isPatched: true } }));
          break;
        case 'safeMode':
          set((s) => ({ opponentStats: { ...s.opponentStats, isSafeMode: true } }));
          break;
      }
      return;
    }

    // Apply attack to host (local effects and corruption)
    set((s) => ({ myStats: { ...s.myStats, corruption: Math.min(100, s.myStats.corruption + ability.corruptionAdd) } }));
    state.addNotification(NOTIFICATION_TEXTS[ability.name] || ability.label);

    switch (ability.name) {
      case 'rotate':
      case 'blur':
        set((s) => ({ localEffects: addEffect(s.localEffects, ability.effectType!, ability.strength!, null) }));
        break;
      case 'mirror':
      case 'invert':
        set((s) => ({ localEffects: toggleEffect(s.localEffects, ability.effectType!, ability.strength!) }));
        break;
      case 'shake':
      case 'cursorHide':
      case 'fakeCursor':
        set((s) => ({ localEffects: addEffect(s.localEffects, ability.effectType!, ability.strength!, ability.durationMs!) }));
        break;
      case 'targetClone': {
        const count = ability.strength!;
        const clones: Target[] = [];
        for (let i = 0; i < count; i++) {
          clones.push(createTarget(state.boardWidth, state.boardHeight, true, state.isHost ? 'host' : 'client'));
        }
        set((s) => ({ targets: [...s.targets, ...clones] }));
        set((s) => ({ localEffects: addEffect(s.localEffects, 'targetClone', count, ability.durationMs!) }));
        break;
      }
      case 'targetTeleport':
        state.teleportTargets();
        break;
    }
  },

  handleTargetClick: (targetId, value, energyReward, isFake, targetIsOpponent = false, targetX = 0, targetY = 0) => {
    const state = get();
    const target = state.targets.find((t) => t.id === targetId);

    if (!state.isHost && state.sendToPeer) {
      const clickMsg: any = { type: 'click', targetId, value, energy: energyReward };
      if (target) {
        clickMsg.targetX = target.x;
        clickMsg.targetY = target.y;
      }
      state.sendToPeer(clickMsg);
      if (!isFake && target) {
        const cfg = TARGET_CONFIG[target.type];
        state.addFloatingScore(target.x, target.y, `+${energyReward}e`, cfg.color);
      }
      return;
    }

    state.removeTarget(targetId);
    if (!isFake && target) {
      const isRemote = targetIsOpponent || !state.isHost;
      const statsKey = isRemote ? 'opponentStats' : 'myStats';
      set((s) => {
        const updated = { ...s[statsKey], score: s[statsKey].score + value, energy: s[statsKey].energy + energyReward };
        const gamePhase: GamePhase = updated.score >= WIN_SCORE ? 'finished' : s.gamePhase;
        const winner = gamePhase === 'finished' ? (statsKey === 'myStats' ? 'host' : 'client') : s.winner;
        return { [statsKey]: updated, gamePhase, winner };
      });
      const cfg = TARGET_CONFIG[target.type];
      state.addFloatingScore(target.x, target.y, `+${energyReward}e`, cfg.color);
    } else if (state.isHost && targetIsOpponent && !isFake && !target) {
      state.sendToPeer?.({ type: 'miss', x: targetX, y: targetY });
    }
  },

  removeTarget: (id: string) =>
    set((s) => ({ targets: s.targets.filter((t) => t.id !== id) })),

  spawnTarget: () => {
    const state = get();
    if (state.targets.length >= MAX_TARGETS) return;
    const target = createTarget(state.boardWidth, state.boardHeight);
    set((s) => ({ targets: [...s.targets, target] }));
  },

  updateTargets: (dt) => {
    set((s) => {
      const margin = 6;
      const TARGET_SIZE = 6;

      let updated = s.targets
        .map((t) => ({ ...t, x: t.x + t.vx * dt, y: t.y + t.vy * dt }))
        .filter((t) => {
          if (t.x < -margin || t.x > s.boardWidth + margin) return false;
          if (t.y < -margin || t.y > s.boardHeight + margin) return false;
          return true;
        });

      for (let i = 0; i < updated.length; i++) {
        for (let j = i + 1; j < updated.length; j++) {
          const a = updated[i];
          const b = updated[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < TARGET_SIZE && dist > 0.01) {
            const nx = dx / dist;
            const ny = dy / dist;
            const overlap = (TARGET_SIZE - dist) / 2;
            const relV = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
            if (relV > 0) {
              updated[i] = { ...a, x: a.x + nx * overlap, y: a.y + ny * overlap, vx: a.vx - relV * nx, vy: a.vy - relV * ny };
              updated[j] = { ...b, x: b.x - nx * overlap, y: b.y - ny * overlap, vx: b.vx + relV * nx, vy: b.vy + relV * ny };
            } else {
              updated[i] = { ...a, x: a.x + nx * overlap, y: a.y + ny * overlap };
              updated[j] = { ...b, x: b.x - nx * overlap, y: b.y - ny * overlap };
            }
          }
        }
      }

      return { targets: updated };
    });
  },

  tickEffects: (_dt: number) => {
    const now = Date.now();
    set((s) => {
      const localRemaining = s.localEffects.filter((e) => e.expiresAt === null || e.expiresAt > now);
      const opponentRemaining = s.opponentEffects.filter((e) => e.expiresAt === null || e.expiresAt > now);

      let targets = s.targets;

      // Clean up clones by checking both local and opponent clone effects
      const expiredLocalClone = s.localEffects.find((e) => e.type === 'targetClone' && e.expiresAt !== null && e.expiresAt <= now);
      const expiredOpponentClone = s.opponentEffects.find((e) => e.type === 'targetClone' && e.expiresAt !== null && e.expiresAt <= now);
      if (expiredLocalClone || expiredOpponentClone) {
        targets = targets.filter((t) => !t.isFake);
      }

      let isSafeMode = s.isSafeMode;
      if (isSafeMode) {
        const safeEffect = localRemaining.find((e) => e.type === 'shake' && e.expiresAt !== null && e.expiresAt > now);
        if (!safeEffect) isSafeMode = false;
      }

      return { localEffects: localRemaining, opponentEffects: opponentRemaining, targets, isSafeMode };
    });
  },

  removeEffect: (id) =>
    set((s) => ({ localEffects: s.localEffects.filter((e) => e.id !== id) })),

  removeRandomEffect: () => {
    const state = get();
    const removable = state.localEffects.filter((e) => e.expiresAt === null);
    if (removable.length === 0) return;
    const idx = Math.floor(Math.random() * removable.length);
    set((s) => ({ localEffects: s.localEffects.filter((e) => e.id !== removable[idx].id) }));
  },

  clearAllEffects: () => set({ localEffects: [], opponentEffects: [] }),

  teleportTargets: () => {
    const state = get();
    set((s) => ({
      targets: s.targets.map((t) => ({
        ...t, x: randomBetween(5, state.boardWidth - 5), y: randomBetween(5, state.boardHeight - 5),
      })),
    }));
  },

  setHost: (isHost) => set({ isHost }),

  setSendToPeer: (fn) => set({ sendToPeer: fn }),

  applyRemoteState: (payload) => {
    const updates: Partial<GameState> = {
      targets: payload.targets,
      myStats: payload.clientStats,
      isPatched: payload.clientStats.isPatched,
      isSafeMode: payload.clientStats.isSafeMode,
      localEffects: payload.clientEffects,
    };
    if (payload.gamePhase !== undefined) updates.gamePhase = payload.gamePhase;
    if (payload.winner !== undefined) updates.winner = payload.winner;
    if (payload.countdownValue !== undefined) updates.countdownValue = payload.countdownValue;
    set(updates);
  },

  addFloatingScore: (x, y, text, color) => {
    set((s) => ({
      floatingScores: [
        ...s.floatingScores.filter((f) => Date.now() - f.createdAt < 1500),
        { id: `f${++floatIdCounter}`, x, y, text, color, createdAt: Date.now() },
      ],
    }));
  },

  cleanupFloatingScores: () => {
    set((s) => ({ floatingScores: s.floatingScores.filter((f) => Date.now() - f.createdAt < 1500) }));
  },

  addNotification: (text) => {
    set((s) => ({
      notifications: [
        ...s.notifications.filter((n) => Date.now() - n.createdAt < 2000),
        { id: `n${++notifIdCounter}`, text, createdAt: Date.now() },
      ],
    }));
  },

  cleanupNotifications: () => {
    set((s) => ({ notifications: s.notifications.filter((n) => Date.now() - n.createdAt < 2000) }));
  },

  resetGame: () => {
    set({
      myStats: { score: 0, energy: 60, corruption: 0 },
      opponentStats: { score: 0, energy: 60, corruption: 0 },
      targets: [],
      localEffects: [],
      opponentEffects: [],
      isPatched: false,
      isSafeMode: false,
      floatingScores: [],
      notifications: [],
      gamePhase: 'countdown',
      winner: null,
      countdownValue: 3,
      disconnected: false,
    });
  },

  setDisconnected: (val) => set({ disconnected: val }),

  computeRotate: () => {
    const state = get();
    return computeEffectValue(state.localEffects, 'rotate') || computeEffectValue(state.opponentEffects, 'rotate');
  },

  computeBlur: () => {
    const state = get();
    return computeEffectValue(state.localEffects, 'blur') || computeEffectValue(state.opponentEffects, 'blur');
  },

  hasEffect: (type) => {
    const state = get();
    return state.localEffects.some((e) => e.type === type);
  },
}));