export interface WeaponSpecial {
  name: string;
  description: string;
  cooldown: number; // in seconds
  energyCost: number;
  type: 'dash_strike' | 'vortex' | 'beam' | 'cyclone' | 'ground_pound' | 'pierce_flurry' | 'arrow_rain' | 'saber_throw' | 'scattershot';
}

export interface Weapon {
  id: string;
  name: string;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  damage: number;
  attackSpeed: number; // attacks per second multiplier
  range: number;
  knockback: number;
  critChance: number;
  isRanged?: boolean;
  projectileSpeed?: number;
  unlockLevel: number;
  cost: number;
  description: string;
  specialSkill: WeaponSpecial;
  visual: {
    bladeColor: string;
    glowColor: string;
    trailColor: string;
    length: number;
    width: number;
    spriteType: 'sword' | 'katana' | 'scythe' | 'blaster' | 'daggers' | 'hammer' | 'rapier' | 'bow' | 'saber' | 'mace' | 'crossbow';
  };
}

export interface ShieldPerk {
  name: string;
  description: string;
  type: 'normal' | 'parry_stun' | 'energy_absorb' | 'thorns' | 'frost_chill' | 'reflect_projectiles' | 'phoenix_burst' | 'fortress' | 'static_shock' | 'void_cloak';
  value: number;
}

export interface Shield {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  blockAbsorption: number; // 0.6 = 60% damage blocked
  parryWindowMs: number; // e.g. 250ms
  perk: ShieldPerk;
  unlockLevel: number;
  cost: number;
  description: string;
  visual: {
    shieldColor: string;
    borderColor: string;
    glowColor: string;
    shape: 'round' | 'kite' | 'tower' | 'hex' | 'spiked' | 'phoenix' | 'conduit' | 'carapace';
    size: number;
  };
}

export interface Headgear {
  id: string;
  name: string;
  unlockLevel: number;
  cost: number;
  type: 'none' | 'headband' | 'spartan' | 'cyber_visor' | 'crown' | 'horns' | 'wizard_hat' | 'samurai';
  color: string;
}

export interface PlayerStats {
  attack: number;    // damage boost %
  defense: number;   // HP boost & shield efficiency
  agility: number;   // movement speed & dash CD
  energy: number;    // special skill power & energy cap
}

export interface PlayerProfile {
  name: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  coins: number;
  skillPoints: number;
  stats: PlayerStats;
  unlockedWeapons: string[];
  unlockedShields: string[];
  unlockedHeadgear: string[];
  equippedWeapon: string;
  equippedShield: string;
  equippedHeadgear: string;
  stickColor: string;
  matchesPlayed: number;
  wins: number;
  kills: number;
  parries: number;
}

export interface ArenaPlatform {
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  isJumpPad?: boolean;
}

export interface Arena {
  id: string;
  name: string;
  theme: string;
  bgGradient: [string, string];
  floorY: number;
  boundsWidth: number;
  boundsHeight: number;
  platforms: ArenaPlatform[];
  description: string;
}

export type FighterActionState =
  | 'idle'
  | 'run'
  | 'jump'
  | 'fall'
  | 'dash'
  | 'attack'
  | 'special'
  | 'block'
  | 'parry'
  | 'hit'
  | 'dead';

export interface Projectile {
  id: string;
  ownerSlot: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  color: string;
  trailColor: string;
  isReflected?: boolean;
  type: 'plasma' | 'arrow' | 'saber' | 'shockwave';
  life: number;
  maxLife: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
  shape?: 'circle' | 'spark' | 'smoke' | 'ring';
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  scale: number;
  vy: number;
  isCrit?: boolean;
}

export interface KeyControls {
  left: boolean;
  right: boolean;
  jump: boolean;
  crouch: boolean;
  attack: boolean;
  shield: boolean;
  special: boolean;
  dash: boolean;
}

export type GameMode = 'local_2p' | 'online_room' | 'solo_arena' | 'survival_waves';
