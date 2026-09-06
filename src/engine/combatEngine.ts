import {
  Weapon,
  Shield,
  Headgear,
  Arena,
  Projectile,
  Particle,
  FloatingText,
  KeyControls,
  FighterActionState,
} from '../types';
import { sound } from '../utils/audio';

export interface FighterEntity {
  id: string;
  slot: number; // 1 or 2
  name: string;
  isAi: boolean;
  aiDifficulty: 'easy' | 'medium' | 'hard' | 'boss';
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: number; // 1 = right, -1 = left
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  state: FighterActionState;
  stateTimer: number;
  isGrounded: boolean;
  canDoubleJump: boolean;
  weapon: Weapon;
  shield: Shield;
  headgear: Headgear;
  color: string;
  // Timers and cooldowns (in seconds)
  attackCooldown: number;
  dashCooldown: number;
  specialCooldown: number;
  parryTimer: number; // active window for parry
  chilledTimer: number;
  invulnerableTimer: number;
  usedPhoenixRebirth: boolean;
  // Stats modifiers
  damageMultiplier: number;
  speedMultiplier: number;
  // Combat stats for current match
  hitsLanded: number;
  damageDealt: number;
  parriesLanded: number;
  blocksExecuted: number;
}

export interface CombatEngineState {
  arena: Arena;
  fighters: [FighterEntity, FighterEntity];
  projectiles: Projectile[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  screenShake: number;
  roundTimer: number;
  winner: number | null; // 1, 2, or null
  isRoundOver: boolean;
}

export function createFighter(
  id: string,
  slot: number,
  name: string,
  weapon: Weapon,
  shield: Shield,
  headgear: Headgear,
  color: string,
  stats: { attack: number; defense: number; agility: number; energy: number },
  isAi: boolean = false,
  aiDifficulty: 'easy' | 'medium' | 'hard' | 'boss' = 'medium',
  spawnX: number = slot === 1 ? 260 : 700
): FighterEntity {
  const maxHp = 100 + stats.defense * 8;
  const maxEnergy = 100 + stats.energy * 6;
  const damageMult = 1 + (stats.attack * 0.05);
  const speedMult = 1 + (stats.agility * 0.03);

  return {
    id,
    slot,
    name,
    isAi,
    aiDifficulty,
    x: spawnX,
    y: 400,
    vx: 0,
    vy: 0,
    facing: slot === 1 ? 1 : -1,
    hp: maxHp,
    maxHp,
    energy: 50,
    maxEnergy,
    state: 'idle',
    stateTimer: 0,
    isGrounded: false,
    canDoubleJump: true,
    weapon,
    shield,
    headgear,
    color,
    attackCooldown: 0,
    dashCooldown: 0,
    specialCooldown: 0,
    parryTimer: 0,
    chilledTimer: 0,
    invulnerableTimer: 0,
    usedPhoenixRebirth: false,
    damageMultiplier: damageMult,
    speedMultiplier: speedMult,
    hitsLanded: 0,
    damageDealt: 0,
    parriesLanded: 0,
    blocksExecuted: 0,
  };
}

export class CombatEngine {
  public state: CombatEngineState;
  private onRoundEnd?: (winnerSlot: number, stats: any) => void;

  constructor(
    arena: Arena,
    f1: FighterEntity,
    f2: FighterEntity,
    onRoundEnd?: (winnerSlot: number, stats: any) => void
  ) {
    this.state = {
      arena,
      fighters: [f1, f2],
      projectiles: [],
      particles: [],
      floatingTexts: [],
      screenShake: 0,
      roundTimer: 90,
      winner: null,
      isRoundOver: false,
    };
    this.onRoundEnd = onRoundEnd;
  }

  public update(dt: number, p1Input: KeyControls, p2Input: KeyControls) {
    if (this.state.screenShake > 0) {
      this.state.screenShake = Math.max(0, this.state.screenShake - dt * 25);
    }

    if (!this.state.isRoundOver) {
      this.state.roundTimer = Math.max(0, this.state.roundTimer - dt);
      if (this.state.roundTimer <= 0) {
        // Time out: fighter with higher health wins
        const f1 = this.state.fighters[0];
        const f2 = this.state.fighters[1];
        this.endRound(f1.hp >= f2.hp ? 1 : 2);
      }
    }

    // Process inputs for each fighter
    this.processFighterInput(0, p1Input, dt);
    if (this.state.fighters[1].isAi) {
      const aiInput = this.calculateAiInput(1, dt);
      this.processFighterInput(1, aiInput, dt);
    } else {
      this.processFighterInput(1, p2Input, dt);
    }

    // Update fighters physics & combat states
    this.updateFighterPhysics(0, dt);
    this.updateFighterPhysics(1, dt);

    // Update projectiles
    this.updateProjectiles(dt);

    // Update particles & texts
    this.updateParticles(dt);
    this.updateFloatingTexts(dt);
  }

  private processFighterInput(index: number, input: KeyControls, dt: number) {
    const f = this.state.fighters[index];
    const opponent = this.state.fighters[index === 0 ? 1 : 0];
    if (f.state === 'dead' || this.state.isRoundOver) return;

    // Chill / status slow
    const speed = 280 * f.speedMultiplier * (f.chilledTimer > 0 ? 0.55 : 1);

    // If currently blocking, adjust movement speed & facing
    if (input.shield && f.state !== 'dash' && f.state !== 'hit') {
      if (f.state !== 'block' && f.state !== 'parry') {
        f.state = 'parry';
        f.parryTimer = (f.shield.parryWindowMs || 250) / 1000;
        f.stateTimer = 0;
      }
      // Can creep slowly while guarding
      if (input.left) {
        f.vx = -speed * 0.35;
        f.facing = -1;
      } else if (input.right) {
        f.vx = speed * 0.35;
        f.facing = 1;
      } else {
        f.vx = 0;
      }
      return;
    } else if (f.state === 'block' || f.state === 'parry') {
      f.state = 'idle';
    }

    // Dash
    if (input.dash && f.dashCooldown <= 0 && f.state !== 'hit') {
      f.state = 'dash';
      f.stateTimer = 0.22;
      f.dashCooldown = Math.max(0.6, 1.2 - f.speedMultiplier * 0.15);
      f.invulnerableTimer = 0.22;
      f.vx = f.facing * (speed * 2.8);
      f.vy = 0;
      sound.playDash();
      this.spawnDashParticles(f);
      return;
    }

    // Special Skill
    if (input.special && f.specialCooldown <= 0 && f.energy >= f.weapon.specialSkill.energyCost && f.state !== 'hit') {
      f.energy -= f.weapon.specialSkill.energyCost;
      f.specialCooldown = f.weapon.specialSkill.cooldown;
      f.state = 'special';
      f.stateTimer = 0.45;
      sound.playSpecial(f.weapon.specialSkill.type);
      this.executeSpecialSkill(f, opponent);
      return;
    }

    // Basic Attack
    if (input.attack && f.attackCooldown <= 0 && f.state !== 'hit' && f.state !== 'dash') {
      f.state = 'attack';
      const attackDuration = 0.28 / f.weapon.attackSpeed;
      f.stateTimer = attackDuration;
      f.attackCooldown = 0.35 / f.weapon.attackSpeed;
      sound.playSlash(f.weapon.visual.spriteType);
      this.executeAttack(f, opponent);
      return;
    }

    // Movement (Left / Right)
    if (f.state !== 'dash' && f.state !== 'hit') {
      if (input.left) {
        f.vx = -speed;
        f.facing = -1;
        if (f.isGrounded && f.state !== 'attack' && f.state !== 'special') {
          f.state = 'run';
        }
      } else if (input.right) {
        f.vx = speed;
        f.facing = 1;
        if (f.isGrounded && f.state !== 'attack' && f.state !== 'special') {
          f.state = 'run';
        }
      } else {
        f.vx *= 0.7; // friction
        if (f.isGrounded && f.state === 'run') {
          f.state = 'idle';
        }
      }

      // Jump
      if (input.jump) {
        if (f.isGrounded) {
          f.vy = -560;
          f.isGrounded = false;
          f.canDoubleJump = true;
          f.state = 'jump';
          sound.playJump();
          this.spawnDust(f.x, f.y);
        } else if (f.canDoubleJump && f.vy > -200) {
          f.vy = -500;
          f.canDoubleJump = false;
          f.state = 'jump';
          sound.playJump();
          this.spawnDust(f.x, f.y);
        }
      }
    }
  }

  private updateFighterPhysics(index: number, dt: number) {
    const f = this.state.fighters[index];

    // Cooldown reductions
    if (f.attackCooldown > 0) f.attackCooldown -= dt;
    if (f.dashCooldown > 0) f.dashCooldown -= dt;
    if (f.specialCooldown > 0) f.specialCooldown -= dt;
    if (f.invulnerableTimer > 0) f.invulnerableTimer -= dt;
    if (f.chilledTimer > 0) f.chilledTimer -= dt;

    // Parry window countdown
    if (f.parryTimer > 0) {
      f.parryTimer -= dt;
      if (f.parryTimer <= 0 && f.state === 'parry') {
        f.state = 'block';
      }
    }

    // Action timer
    if (f.stateTimer > 0) {
      f.stateTimer -= dt;
      if (f.stateTimer <= 0) {
        if (f.state === 'attack' || f.state === 'special' || f.state === 'dash' || f.state === 'hit') {
          f.state = f.isGrounded ? 'idle' : 'fall';
        }
      }
    }

    // Energy passive regeneration
    f.energy = Math.min(f.maxEnergy, f.energy + dt * 14);

    // Apply gravity
    f.vy += 1200 * dt;

    // Apply velocities
    f.x += f.vx * dt;
    f.y += f.vy * dt;

    // Arena Platform Collisions
    f.isGrounded = false;
    const arena = this.state.arena;

    // Main floor
    if (f.y >= arena.floorY) {
      f.y = arena.floorY;
      f.vy = 0;
      f.isGrounded = true;
      f.canDoubleJump = true;
      if (f.state === 'fall') f.state = 'idle';
    }

    // Elevated platforms (one-way from above)
    arena.platforms.forEach((plat) => {
      if (plat.y < arena.floorY) {
        const isAbove = f.y >= plat.y && f.y - f.vy * dt <= plat.y + 15;
        const withinX = f.x >= plat.x - 15 && f.x <= plat.x + plat.width + 15;
        if (isAbove && withinX && f.vy >= 0) {
          f.y = plat.y;
          f.vy = 0;
          f.isGrounded = true;
          f.canDoubleJump = true;
          if (plat.isJumpPad) {
            // High spring launch
            f.vy = -800;
            f.isGrounded = false;
            sound.playJump();
            this.spawnDust(f.x, f.y);
          }
        }
      }
    });

    // Horizontal bounds
    if (f.x < 40) {
      f.x = 40;
      f.vx = 0;
    } else if (f.x > arena.boundsWidth - 40) {
      f.x = arena.boundsWidth - 40;
      f.vx = 0;
    }

    // Fall state if in mid-air
    if (!f.isGrounded && f.vy > 50 && f.state !== 'attack' && f.state !== 'special' && f.state !== 'dash' && f.state !== 'hit') {
      f.state = 'fall';
    }
  }

  // Attack execution
  private executeAttack(attacker: FighterEntity, defender: FighterEntity) {
    if (attacker.weapon.isRanged) {
      // Fire ranged projectile
      const projSpeed = (attacker.weapon.projectileSpeed || 14) * 50;
      this.state.projectiles.push({
        id: 'proj_' + Math.random().toString(36).substr(2, 6),
        ownerSlot: attacker.slot,
        x: attacker.x + attacker.facing * 30,
        y: attacker.y - 20,
        vx: attacker.facing * projSpeed,
        vy: 0,
        radius: attacker.weapon.category === 'Blaster' ? 7 : 5,
        damage: attacker.weapon.damage * attacker.damageMultiplier,
        color: attacker.weapon.visual.bladeColor,
        trailColor: attacker.weapon.visual.trailColor,
        type: attacker.weapon.category === 'Blaster' ? 'plasma' : 'arrow',
        life: 0,
        maxLife: 2.5,
      });
      return;
    }

    // Melee attack range check
    const dist = Math.abs(attacker.x - defender.x);
    const yDist = Math.abs(attacker.y - defender.y);
    const facingDefender = (defender.x - attacker.x) * attacker.facing > 0;

    if (facingDefender && dist <= attacker.weapon.range + 25 && yDist <= 55) {
      this.handleHit(attacker, defender, attacker.weapon.damage, attacker.weapon.knockback);
    }
  }

  // Special skill execution
  private executeSpecialSkill(attacker: FighterEntity, defender: FighterEntity) {
    const special = attacker.weapon.specialSkill;
    const facingOpponent = (defender.x - attacker.x) * attacker.facing > 0;

    if (special.type === 'dash_strike') {
      // Teleport forward + strike
      attacker.x += attacker.facing * 120;
      this.spawnDashParticles(attacker);
      const dist = Math.abs(attacker.x - defender.x);
      if (dist <= 100) {
        this.handleHit(attacker, defender, attacker.weapon.damage * 1.8, 14, true);
      }
    } else if (special.type === 'vortex') {
      // Pull opponent in + damage
      defender.x = attacker.x + attacker.facing * 40;
      this.handleHit(attacker, defender, attacker.weapon.damage * 1.6, 6);
      this.spawnShockwave(attacker.x, attacker.y, '#a855f7');
    } else if (special.type === 'beam') {
      // Massive laser beam
      this.state.screenShake = 16;
      this.spawnShockwave(attacker.x + attacker.facing * 150, attacker.y - 20, '#22c55e', 80);
      if (facingOpponent) {
        this.handleHit(attacker, defender, attacker.weapon.damage * 2.2, 16, true);
      }
    } else if (special.type === 'cyclone') {
      // Rapid multi-hits
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          if (Math.abs(attacker.x - defender.x) <= 75) {
            this.handleHit(attacker, defender, attacker.weapon.damage * 0.6, 4);
          }
        }, i * 70);
      }
      this.spawnShockwave(attacker.x, attacker.y, '#f97316');
    } else if (special.type === 'ground_pound') {
      // Ground smash stun
      this.state.screenShake = 18;
      this.spawnShockwave(attacker.x, attacker.y, '#eab308', 90);
      if (Math.abs(attacker.x - defender.x) <= 130) {
        this.handleHit(attacker, defender, attacker.weapon.damage * 1.9, 14, true);
      }
    } else if (special.type === 'pierce_flurry') {
      // Rapier flurry
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          if (Math.abs(attacker.x - defender.x) <= attacker.weapon.range + 30) {
            this.handleHit(attacker, defender, attacker.weapon.damage * 0.45, 3);
          }
        }, i * 60);
      }
    } else if (special.type === 'arrow_rain') {
      // Raining arrows
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          const rx = defender.x + (Math.random() - 0.5) * 80;
          this.state.projectiles.push({
            id: 'rain_' + Math.random(),
            ownerSlot: attacker.slot,
            x: rx,
            y: 40,
            vx: (Math.random() - 0.5) * 40,
            vy: 600,
            radius: 5,
            damage: attacker.weapon.damage * 0.75,
            color: '#06b6d4',
            trailColor: 'rgba(6, 182, 212, 0.5)',
            type: 'arrow',
            life: 0,
            maxLife: 1.5,
          });
        }, i * 90);
      }
    } else if (special.type === 'saber_throw') {
      // Saber Boomerang
      this.state.projectiles.push({
        id: 'saber_' + Math.random(),
        ownerSlot: attacker.slot,
        x: attacker.x + attacker.facing * 40,
        y: attacker.y - 20,
        vx: attacker.facing * 500,
        vy: 0,
        radius: 12,
        damage: attacker.weapon.damage * 1.6,
        color: '#84cc16',
        trailColor: 'rgba(132, 204, 22, 0.6)',
        type: 'saber',
        life: 0,
        maxLife: 1.8,
      });
    } else if (special.type === 'scattershot') {
      // Crossbow Scattershot Barrage (5-bolt fan)
      sound.playSlash('katana');
      this.state.screenShake = 10;
      for (let i = -2; i <= 2; i++) {
        const angle = i * 0.14;
        const speed = 900;
        this.state.projectiles.push({
          id: 'scatter_' + Math.random(),
          ownerSlot: attacker.slot,
          x: attacker.x + attacker.facing * 34,
          y: attacker.y - 20,
          vx: attacker.facing * Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 4,
          damage: attacker.weapon.damage * 0.9 * attacker.damageMultiplier,
          color: attacker.weapon.visual.bladeColor,
          trailColor: attacker.weapon.visual.trailColor,
          type: 'arrow',
          life: 0,
          maxLife: 1.4,
        });
      }
    }
  }

  // Handle hit resolution, blocking, parrying, and damage
  public handleHit(
    attacker: FighterEntity,
    defender: FighterEntity,
    baseDamage: number,
    knockback: number,
    isSpecial: boolean = false
  ) {
    if (defender.invulnerableTimer > 0 || defender.state === 'dead') return;

    // Check if defender is blocking
    const isDefenderFacingAttacker = (attacker.x - defender.x) * defender.facing > 0;
    const isGuarding = (defender.state === 'block' || defender.state === 'parry') && isDefenderFacingAttacker;

    if (isGuarding && defender.parryTimer > 0) {
      // PERFECT PARRY!
      sound.playParry();
      defender.parriesLanded++;
      this.state.screenShake = 12;
      this.spawnShockwave(defender.x, defender.y - 20, '#fef08a', 50);

      // Stun attacker
      attacker.state = 'hit';
      attacker.stateTimer = 0.7;
      attacker.vx = -attacker.facing * 180;

      this.addFloatingText('PARRY!', defender.x, defender.y - 50, '#facc15', true);

      // Aegis of the Sun perk: counter damage
      if (defender.shield.perk.type === 'parry_stun') {
        const counterDmg = baseDamage * defender.shield.perk.value;
        attacker.hp = Math.max(0, attacker.hp - counterDmg);
        this.addFloatingText(`-${Math.round(counterDmg)}`, attacker.x, attacker.y - 35, '#eab308');
        if (attacker.hp <= 0) this.checkDeath(attacker, defender);
      } else if (defender.shield.perk.type === 'void_cloak') {
        defender.invulnerableTimer = defender.shield.perk.value;
        this.addFloatingText('VOID CLOAK!', defender.x, defender.y - 55, '#c084fc', true);
        this.spawnShockwave(defender.x, defender.y - 20, '#a855f7', 40);
      }
      return;
    }

    if (isGuarding) {
      // Standard Shield Block
      sound.playShieldBlock(defender.shield.perk.type);
      defender.blocksExecuted++;

      const absorption = defender.shield.blockAbsorption;
      const finalDmg = Math.max(1, baseDamage * (1 - absorption));

      defender.hp = Math.max(0, defender.hp - finalDmg);
      attacker.hitsLanded++;
      attacker.damageDealt += finalDmg;

      // Knockback on block (reduced unless obsidian)
      if (defender.shield.perk.type !== 'fortress') {
        defender.vx = attacker.facing * knockback * 8;
      }

      this.addFloatingText(`BLOCKED -${Math.round(finalDmg)}`, defender.x, defender.y - 35, '#38bdf8');
      this.spawnSparks(defender.x + defender.facing * 15, defender.y - 20, '#67e8f9');

      // Shield Perks
      if (defender.shield.perk.type === 'energy_absorb') {
        const energyGained = baseDamage * defender.shield.perk.value;
        defender.energy = Math.min(defender.maxEnergy, defender.energy + energyGained);
      } else if (defender.shield.perk.type === 'thorns') {
        const thornDmg = baseDamage * defender.shield.perk.value;
        attacker.hp = Math.max(0, attacker.hp - thornDmg);
        this.addFloatingText(`THORNS -${Math.round(thornDmg)}`, attacker.x, attacker.y - 35, '#ef4444');
      } else if (defender.shield.perk.type === 'frost_chill') {
        attacker.chilledTimer = 2.5;
        this.addFloatingText('FROZEN!', attacker.x, attacker.y - 45, '#38bdf8');
      } else if (defender.shield.perk.type === 'static_shock') {
        const shockDmg = defender.shield.perk.value;
        attacker.hp = Math.max(0, attacker.hp - shockDmg);
        this.addFloatingText(`SHOCK -${Math.round(shockDmg)}`, attacker.x, attacker.y - 35, '#00F0FF');
        this.spawnSparks(attacker.x, attacker.y - 20, '#38bdf8');
      }

      this.checkDeath(defender, attacker);
      return;
    }

    // Direct Unblocked Hit!
    const isCrit = Math.random() < (attacker.weapon.critChance || 0.15) || isSpecial;
    const finalDmg = Math.round(baseDamage * (isCrit ? 1.7 : 1.0) * attacker.damageMultiplier);

    defender.hp = Math.max(0, defender.hp - finalDmg);
    attacker.hitsLanded++;
    attacker.damageDealt += finalDmg;

    // Vampiric Rapier lifesteal
    if (attacker.weapon.id === 'vampiric_rapier') {
      const heal = Math.round(finalDmg * 0.25);
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
      this.addFloatingText(`+${heal} HP`, attacker.x, attacker.y - 40, '#ec4899');
    }

    // Knockback and hit reaction
    defender.state = 'hit';
    defender.stateTimer = 0.28;
    defender.vx = attacker.facing * knockback * 25;
    defender.vy = -180;

    this.state.screenShake = isCrit ? 14 : 7;
    sound.playHitImpact(isCrit);

    this.addFloatingText(
      isCrit ? `CRIT! -${finalDmg}` : `-${finalDmg}`,
      defender.x,
      defender.y - 35,
      isCrit ? '#ef4444' : '#ffffff',
      isCrit
    );

    this.spawnBloodParticles(defender.x, defender.y - 20, attacker.facing);
    this.checkDeath(defender, attacker);
  }

  // Death check & Phoenix Rebirth
  private checkDeath(victim: FighterEntity, killer: FighterEntity) {
    if (victim.hp <= 0) {
      // Check Phoenix Rebirth
      if (victim.shield.perk.type === 'phoenix_burst' && !victim.usedPhoenixRebirth) {
        victim.usedPhoenixRebirth = true;
        victim.hp = Math.round(victim.maxHp * 0.3);
        victim.invulnerableTimer = 1.0;
        sound.playSpecial('beam');
        this.spawnShockwave(victim.x, victim.y, '#f97316', 70);
        this.addFloatingText('PHOENIX REBIRTH!', victim.x, victim.y - 50, '#f97316', true);
        return;
      }

      victim.hp = 0;
      victim.state = 'dead';
      this.spawnDeathParticles(victim);
      this.endRound(killer.slot);
    }
  }

  private endRound(winnerSlot: number) {
    if (this.state.isRoundOver) return;
    this.state.isRoundOver = true;
    this.state.winner = winnerSlot;
    sound.playVictory();

    const winnerFighter = this.state.fighters[winnerSlot - 1];
    const loserFighter = this.state.fighters[winnerSlot === 1 ? 1 : 0];

    if (this.onRoundEnd) {
      this.onRoundEnd(winnerSlot, {
        winnerHits: winnerFighter.hitsLanded,
        winnerDamage: winnerFighter.damageDealt,
        winnerParries: winnerFighter.parriesLanded,
        winnerBlocks: winnerFighter.blocksExecuted,
      });
    }
  }

  // Projectiles update
  private updateProjectiles(dt: number) {
    for (let i = this.state.projectiles.length - 1; i >= 0; i--) {
      const proj = this.state.projectiles[i];
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.life += dt;

      // Check lifetime or out of bounds
      if (proj.life >= proj.maxLife || proj.x < 0 || proj.x > this.state.arena.boundsWidth) {
        this.state.projectiles.splice(i, 1);
        continue;
      }

      // Check collision with fighters
      const targetSlot = proj.ownerSlot === 1 ? 2 : 1;
      const target = this.state.fighters[targetSlot - 1];
      const dist = Math.hypot(proj.x - target.x, proj.y - (target.y - 20));

      if (dist <= proj.radius + 20 && target.state !== 'dead') {
        // Check Prism Mirror Shield Reflection
        const isFacingProj = (proj.vx > 0 && target.facing < 0) || (proj.vx < 0 && target.facing > 0);
        if ((target.state === 'block' || target.state === 'parry') && isFacingProj && target.shield.perk.type === 'reflect_projectiles') {
          // Reflect!
          proj.ownerSlot = target.slot;
          proj.vx = -proj.vx * 1.4;
          proj.damage *= 1.4;
          proj.color = '#d946ef';
          sound.playParry();
          this.addFloatingText('REFLECTED!', target.x, target.y - 45, '#d946ef', true);
          this.spawnSparks(proj.x, proj.y, '#f5d0fe');
          continue;
        }

        const attacker = this.state.fighters[proj.ownerSlot - 1];
        this.handleHit(attacker, target, proj.damage, 6);
        this.spawnSparks(proj.x, proj.y, proj.color);
        this.state.projectiles.splice(i, 1);
      }
    }
  }

  // AI Decision loop
  private calculateAiInput(aiIndex: number, dt: number): KeyControls {
    const ai = this.state.fighters[aiIndex];
    const player = this.state.fighters[aiIndex === 0 ? 1 : 0];

    const input: KeyControls = {
      left: false,
      right: false,
      jump: false,
      crouch: false,
      attack: false,
      shield: false,
      special: false,
      dash: false,
    };

    if (ai.state === 'dead' || this.state.isRoundOver) return input;

    const dist = Math.abs(ai.x - player.x);
    const playerOnLeft = player.x < ai.x;
    const playerAttacking = player.state === 'attack' || player.state === 'special';

    // Difficulty params
    const parryChance = ai.aiDifficulty === 'boss' ? 0.7 : ai.aiDifficulty === 'hard' ? 0.45 : ai.aiDifficulty === 'medium' ? 0.2 : 0.05;
    const dashChance = ai.aiDifficulty === 'boss' ? 0.4 : 0.15;

    // React to player attack: block or parry
    if (playerAttacking && dist < player.weapon.range + 45) {
      if (Math.random() < parryChance) {
        input.shield = true;
        return input;
      }
    }

    // Special skill if in range and ready
    if (ai.specialCooldown <= 0 && ai.energy >= ai.weapon.specialSkill.energyCost && dist < 160) {
      if (Math.random() < 0.3) {
        input.special = true;
        return input;
      }
    }

    // Weapon attack range
    const desiredRange = ai.weapon.isRanged ? 220 : ai.weapon.range + 10;

    if (dist <= desiredRange) {
      // In range: attack!
      if (ai.attackCooldown <= 0) {
        input.attack = true;
      }
      // Occasional defensive backstep
      if (Math.random() < 0.08) {
        input.shield = true;
      }
    } else {
      // Approach player
      if (playerOnLeft) {
        input.left = true;
      } else {
        input.right = true;
      }

      // Jump if player is elevated or to dodge
      if (player.y < ai.y - 40 && Math.random() < 0.1) {
        input.jump = true;
      }

      // Dash in to close gap
      if (dist > 180 && Math.random() < dashChance && ai.dashCooldown <= 0) {
        input.dash = true;
      }
    }

    return input;
  }

  // Particle and effect spawners
  private spawnSparks(x: number, y: number, color: string) {
    for (let i = 0; i < 8; i++) {
      this.state.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 240,
        vy: (Math.random() - 0.5) * 240,
        radius: 2.5,
        color,
        alpha: 1,
        decay: 3.5,
        shape: 'spark',
      });
    }
  }

  private spawnBloodParticles(x: number, y: number, hitDir: number) {
    for (let i = 0; i < 10; i++) {
      this.state.particles.push({
        x,
        y,
        vx: hitDir * (Math.random() * 180 + 40),
        vy: (Math.random() - 0.6) * 160,
        radius: Math.random() * 3 + 2,
        color: '#f43f5e',
        alpha: 1,
        decay: 2.2,
      });
    }
  }

  private spawnDashParticles(f: FighterEntity) {
    for (let i = 0; i < 6; i++) {
      this.state.particles.push({
        x: f.x - f.facing * (i * 12),
        y: f.y - 20,
        vx: -f.facing * 40,
        vy: (Math.random() - 0.5) * 20,
        radius: 4,
        color: f.weapon.visual.glowColor,
        alpha: 0.8,
        decay: 3.0,
      });
    }
  }

  private spawnShockwave(x: number, y: number, color: string, maxRadius: number = 40) {
    this.state.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      radius: 10,
      color,
      alpha: 1,
      decay: 2.5,
      shape: 'ring',
    });
  }

  private spawnDust(x: number, y: number) {
    for (let i = 0; i < 5; i++) {
      this.state.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y,
        vx: (Math.random() - 0.5) * 60,
        vy: -Math.random() * 40,
        radius: 3,
        color: '#64748b',
        alpha: 0.6,
        decay: 2.0,
        shape: 'smoke',
      });
    }
  }

  private spawnDeathParticles(f: FighterEntity) {
    for (let i = 0; i < 24; i++) {
      this.state.particles.push({
        x: f.x + (Math.random() - 0.5) * 20,
        y: f.y - 20 + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 300,
        vy: (Math.random() - 0.8) * 300,
        radius: Math.random() * 4 + 2,
        color: f.color,
        alpha: 1,
        decay: 1.5,
      });
    }
  }

  public addFloatingText(text: string, x: number, y: number, color: string, isCrit: boolean = false) {
    this.state.floatingTexts.push({
      id: 'text_' + Math.random(),
      text,
      x,
      y,
      color,
      alpha: 1,
      scale: isCrit ? 1.4 : 1.0,
      vy: -60,
      isCrit,
    });
  }

  private updateParticles(dt: number) {
    for (let i = this.state.particles.length - 1; i >= 0; i--) {
      const p = this.state.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.shape === 'ring') {
        p.radius += 120 * dt;
      }
      p.alpha -= p.decay * dt;
      if (p.alpha <= 0) {
        this.state.particles.splice(i, 1);
      }
    }
  }

  private updateFloatingTexts(dt: number) {
    for (let i = this.state.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.state.floatingTexts[i];
      t.y += t.vy * dt;
      t.alpha -= 1.3 * dt;
      if (t.alpha <= 0) {
        this.state.floatingTexts.splice(i, 1);
      }
    }
  }
}
