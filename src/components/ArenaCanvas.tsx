import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import {
  Arena,
  Weapon,
  Shield,
  Headgear,
  GameMode,
  KeyControls,
} from '../types';
import { WEAPONS, SHIELDS, HEADGEAR_LIST, ARENAS } from '../data/gear';
import {
  CombatEngine,
  createFighter,
  FighterEntity,
} from '../engine/combatEngine';
import {
  drawStickFigure,
  renderParticles,
  renderFloatingTexts,
  renderProjectiles,
} from '../engine/stickRenderer';
import {
  Swords,
  Shield as ShieldIcon,
  Zap,
  RotateCcw,
  Home,
  Trophy,
  Coins,
  Sparkles,
} from 'lucide-react';

interface ArenaCanvasProps {
  mode: GameMode;
  arenaId: string;
  aiDifficulty?: 'easy' | 'medium' | 'hard' | 'boss';
  onlineWs?: WebSocket | null;
  onlineSlot?: number;
  onlineOpponent?: any;
  onExit: () => void;
}

export const ArenaCanvas: React.FC<ArenaCanvasProps> = ({
  mode,
  arenaId,
  aiDifficulty = 'medium',
  onlineWs,
  onlineSlot = 1,
  onlineOpponent,
  onExit,
}) => {
  const { profile, addMatchRewards } = useGame();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<CombatEngine | null>(null);

  // Keyboard state
  const keysRef = useRef<{
    p1: KeyControls;
    p2: KeyControls;
  }>({
    p1: { left: false, right: false, jump: false, crouch: false, attack: false, shield: false, special: false, dash: false },
    p2: { left: false, right: false, jump: false, crouch: false, attack: false, shield: false, special: false, dash: false },
  });

  // HUD and Round states
  const [hudState, setHudState] = useState<{
    f1Hp: number;
    f1MaxHp: number;
    f1Energy: number;
    f1MaxEnergy: number;
    f1SpecialCd: number;
    f1DashCd: number;
    f2Hp: number;
    f2MaxHp: number;
    f2Energy: number;
    f2MaxEnergy: number;
    f2SpecialCd: number;
    f2DashCd: number;
    roundTimer: number;
    winner: number | null;
    isOver: boolean;
  }>({
    f1Hp: 100,
    f1MaxHp: 100,
    f1Energy: 50,
    f1MaxEnergy: 100,
    f1SpecialCd: 0,
    f1DashCd: 0,
    f2Hp: 100,
    f2MaxHp: 100,
    f2Energy: 50,
    f2MaxEnergy: 100,
    f2SpecialCd: 0,
    f2DashCd: 0,
    roundTimer: 90,
    winner: null,
    isOver: false,
  });

  const [matchRewardsEarned, setMatchRewardsEarned] = useState<{
    xp: number;
    coins: number;
    isWin: boolean;
  } | null>(null);

  const [roundScores, setRoundScores] = useState<[number, number]>([0, 0]);

  // Initialize Fighter Data
  const setupEngine = useCallback(() => {
    const arena = ARENAS.find((a) => a.id === arenaId) || ARENAS[0];

    const p1Weapon = WEAPONS.find((w) => w.id === profile.equippedWeapon) || WEAPONS[0];
    const p1Shield = SHIELDS.find((s) => s.id === profile.equippedShield) || SHIELDS[0];
    const p1Headgear = HEADGEAR_LIST.find((h) => h.id === profile.equippedHeadgear) || HEADGEAR_LIST[0];

    let f1: FighterEntity;
    let f2: FighterEntity;

    if (mode === 'online_room' && onlineOpponent) {
      const oppWeapon = WEAPONS.find((w) => w.id === onlineOpponent.weaponId) || WEAPONS[0];
      const oppShield = SHIELDS.find((s) => s.id === onlineOpponent.shieldId) || SHIELDS[0];
      const oppHeadgear = HEADGEAR_LIST.find((h) => h.id === onlineOpponent.headgear) || HEADGEAR_LIST[0];

      if (onlineSlot === 1) {
        f1 = createFighter('p1', 1, profile.name, p1Weapon, p1Shield, p1Headgear, profile.stickColor, profile.stats, false, 'medium', 240);
        f2 = createFighter('p2', 2, onlineOpponent.name || 'Rival', oppWeapon, oppShield, oppHeadgear, onlineOpponent.color || '#f43f5e', { attack: 1, defense: 1, agility: 1, energy: 1 }, false, 'medium', 720);
      } else {
        f1 = createFighter('p1', 1, onlineOpponent.name || 'Host', oppWeapon, oppShield, oppHeadgear, onlineOpponent.color || '#06b6d4', { attack: 1, defense: 1, agility: 1, energy: 1 }, false, 'medium', 240);
        f2 = createFighter('p2', 2, profile.name, p1Weapon, p1Shield, p1Headgear, profile.stickColor, profile.stats, false, 'medium', 720);
      }
    } else if (mode === 'local_2p') {
      // Local 2-Player duel on shared keyboard
      const p2Weapon = WEAPONS[1]; // Katana for Player 2 default
      const p2Shield = SHIELDS[1]; // Aegis for Player 2 default
      const p2Headgear = HEADGEAR_LIST[1];

      f1 = createFighter('p1', 1, 'Player 1', p1Weapon, p1Shield, p1Headgear, profile.stickColor, profile.stats, false, 'medium', 240);
      f2 = createFighter('p2', 2, 'Player 2', p2Weapon, p2Shield, p2Headgear, '#f43f5e', { attack: 2, defense: 2, agility: 2, energy: 2 }, false, 'medium', 720);
    } else {
      // Solo vs Bot or Survival
      const botWeapons = [WEAPONS[1], WEAPONS[2], WEAPONS[4], WEAPONS[5], WEAPONS[8]];
      const randomWeapon = botWeapons[Math.floor(Math.random() * botWeapons.length)];
      const randomShield = SHIELDS[Math.floor(Math.random() * SHIELDS.length)];
      const botName = aiDifficulty === 'boss' ? 'Titan Overlord' : aiDifficulty === 'hard' ? 'Shadow Ninja' : 'Cyber Brawler';
      const botColor = aiDifficulty === 'boss' ? '#eab308' : '#f43f5e';

      f1 = createFighter('p1', 1, profile.name, p1Weapon, p1Shield, p1Headgear, profile.stickColor, profile.stats, false, 'medium', 240);
      f2 = createFighter(
        'p2',
        2,
        botName,
        randomWeapon,
        randomShield,
        HEADGEAR_LIST[3],
        botColor,
        {
          attack: aiDifficulty === 'boss' ? 5 : aiDifficulty === 'hard' ? 3 : 1,
          defense: aiDifficulty === 'boss' ? 5 : aiDifficulty === 'hard' ? 3 : 1,
          agility: aiDifficulty === 'boss' ? 4 : 2,
          energy: aiDifficulty === 'boss' ? 5 : 2,
        },
        true,
        (aiDifficulty || 'medium') as 'easy' | 'medium' | 'hard' | 'boss',
        720
      );
    }

    const engine = new CombatEngine(arena, f1, f2, (winnerSlot, stats) => {
      const isPlayerWinner = (mode === 'online_room' ? onlineSlot : 1) === winnerSlot;
      const earnedXp = isPlayerWinner ? 120 + stats.winnerHits * 4 : 40 + stats.winnerHits * 2;
      const earnedCoins = isPlayerWinner ? 60 + stats.winnerParries * 8 : 20;

      addMatchRewards(earnedXp, earnedCoins, isPlayerWinner, isPlayerWinner ? 1 : 0, stats.winnerParries);
      setMatchRewardsEarned({
        xp: earnedXp,
        coins: earnedCoins,
        isWin: isPlayerWinner,
      });

      setRoundScores((prev) => [
        prev[0] + (winnerSlot === 1 ? 1 : 0),
        prev[1] + (winnerSlot === 2 ? 1 : 0),
      ]);
    });

    engineRef.current = engine;
    setMatchRewardsEarned(null);
  }, [arenaId, profile, mode, aiDifficulty, onlineOpponent, onlineSlot, addMatchRewards]);

  // Handle Online WebSocket sync
  useEffect(() => {
    if (!onlineWs) return;

    const handleMsg = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'opponent_sync' && engineRef.current) {
          const targetSlot = onlineSlot === 1 ? 1 : 0;
          const oppFighter = engineRef.current.state.fighters[targetSlot];
          if (oppFighter && msg.state) {
            oppFighter.x = msg.state.x;
            oppFighter.y = msg.state.y;
            oppFighter.vx = msg.state.vx;
            oppFighter.vy = msg.state.vy;
            oppFighter.facing = msg.state.facing;
            oppFighter.state = msg.state.action;
            oppFighter.hp = msg.state.hp;
            oppFighter.energy = msg.state.energy;
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    onlineWs.addEventListener('message', handleMsg);
    return () => onlineWs.removeEventListener('message', handleMsg);
  }, [onlineWs, onlineSlot]);

  // Initial engine setup
  useEffect(() => {
    setupEngine();
  }, [setupEngine]);

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent browser scrolling on space/arrows
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      const k = keysRef.current;

      // Player 1 controls (WASD + F / G / Space / Q)
      if (e.code === 'KeyA') k.p1.left = true;
      if (e.code === 'KeyD') k.p1.right = true;
      if (e.code === 'KeyW') k.p1.jump = true;
      if (e.code === 'KeyS') k.p1.crouch = true;
      if (e.code === 'KeyF' || e.code === 'KeyJ') k.p1.attack = true;
      if (e.code === 'KeyG' || e.code === 'KeyK') k.p1.shield = true;
      if (e.code === 'Space') k.p1.special = true;
      if (e.code === 'KeyQ' || e.code === 'KeyL') k.p1.dash = true;

      // Player 2 controls (Arrows + Numpad or alternate keys)
      if (e.code === 'ArrowLeft') k.p2.left = true;
      if (e.code === 'ArrowRight') k.p2.right = true;
      if (e.code === 'ArrowUp') k.p2.jump = true;
      if (e.code === 'ArrowDown') k.p2.crouch = true;
      if (e.code === 'Numpad1' || e.code === 'Slash') k.p2.attack = true;
      if (e.code === 'Numpad2' || e.code === 'Period') k.p2.shield = true;
      if (e.code === 'Numpad3' || e.code === 'Quote') k.p2.special = true;
      if (e.code === 'ShiftRight' || e.code === 'Enter') k.p2.dash = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = keysRef.current;

      // Player 1
      if (e.code === 'KeyA') k.p1.left = false;
      if (e.code === 'KeyD') k.p1.right = false;
      if (e.code === 'KeyW') k.p1.jump = false;
      if (e.code === 'KeyS') k.p1.crouch = false;
      if (e.code === 'KeyF' || e.code === 'KeyJ') k.p1.attack = false;
      if (e.code === 'KeyG' || e.code === 'KeyK') k.p1.shield = false;
      if (e.code === 'Space') k.p1.special = false;
      if (e.code === 'KeyQ' || e.code === 'KeyL') k.p1.dash = false;

      // Player 2
      if (e.code === 'ArrowLeft') k.p2.left = false;
      if (e.code === 'ArrowRight') k.p2.right = false;
      if (e.code === 'ArrowUp') k.p2.jump = false;
      if (e.code === 'ArrowDown') k.p2.crouch = false;
      if (e.code === 'Numpad1' || e.code === 'Slash') k.p2.attack = false;
      if (e.code === 'Numpad2' || e.code === 'Period') k.p2.shield = false;
      if (e.code === 'Numpad3' || e.code === 'Quote') k.p2.special = false;
      if (e.code === 'ShiftRight' || e.code === 'Enter') k.p2.dash = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main Canvas Render Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let syncTimer = 0;

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const engine = engineRef.current;
      const canvas = canvasRef.current;

      if (engine && canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Update game logic
          const k = keysRef.current;
          engine.update(dt, k.p1, k.p2);

          // Online sync packet sending (at ~30Hz)
          if (onlineWs && onlineWs.readyState === WebSocket.OPEN) {
            syncTimer += dt;
            if (syncTimer >= 0.033) {
              syncTimer = 0;
              const myFighter = engine.state.fighters[onlineSlot - 1];
              if (myFighter) {
                onlineWs.send(
                  JSON.stringify({
                    type: 'player_sync',
                    state: {
                      x: Math.round(myFighter.x),
                      y: Math.round(myFighter.y),
                      vx: Math.round(myFighter.vx),
                      vy: Math.round(myFighter.vy),
                      facing: myFighter.facing,
                      action: myFighter.state,
                      hp: Math.round(myFighter.hp),
                      energy: Math.round(myFighter.energy),
                    },
                  })
                );
              }
            }
          }

          // Camera focus & dynamic bounds
          const f1 = engine.state.fighters[0];
          const f2 = engine.state.fighters[1];

          // Clear Canvas
          ctx.save();

          // Screen Shake
          if (engine.state.screenShake > 0) {
            const shake = engine.state.screenShake;
            ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
          }

          // Draw Arena Background
          drawArenaBackground(ctx, canvas.width, canvas.height, engine.state.arena, now);

          // Draw Arena Platforms
          drawArenaPlatforms(ctx, engine.state.arena);

          // Draw Projectiles
          renderProjectiles(ctx, engine.state.projectiles);

          // Draw Stick Figures
          drawStickFigure(
            ctx,
            {
              x: f1.x,
              y: f1.y,
              facing: f1.facing,
              action: f1.state,
              actionTime: f1.stateTimer,
              color: f1.color,
              isGrounded: f1.isGrounded,
              isBlocking: f1.state === 'block' || f1.state === 'parry',
              isParrying: f1.state === 'parry',
              isDashing: f1.state === 'dash',
              isChilled: f1.chilledTimer > 0,
              weapon: f1.weapon,
              shield: f1.shield,
              headgear: f1.headgear,
              hp: f1.hp,
              maxHp: f1.maxHp,
              energy: f1.energy,
              maxEnergy: f1.maxEnergy,
            },
            now
          );

          drawStickFigure(
            ctx,
            {
              x: f2.x,
              y: f2.y,
              facing: f2.facing,
              action: f2.state,
              actionTime: f2.stateTimer,
              color: f2.color,
              isGrounded: f2.isGrounded,
              isBlocking: f2.state === 'block' || f2.state === 'parry',
              isParrying: f2.state === 'parry',
              isDashing: f2.state === 'dash',
              isChilled: f2.chilledTimer > 0,
              weapon: f2.weapon,
              shield: f2.shield,
              headgear: f2.headgear,
              hp: f2.hp,
              maxHp: f2.maxHp,
              energy: f2.energy,
              maxEnergy: f2.maxEnergy,
            },
            now
          );

          // Draw Particles and Combat Floaters
          renderParticles(ctx, engine.state.particles);
          renderFloatingTexts(ctx, engine.state.floatingTexts);

          ctx.restore();

          // Sync state to HUD
          setHudState({
            f1Hp: f1.hp,
            f1MaxHp: f1.maxHp,
            f1Energy: f1.energy,
            f1MaxEnergy: f1.maxEnergy,
            f1SpecialCd: f1.specialCooldown,
            f1DashCd: f1.dashCooldown,
            f2Hp: f2.hp,
            f2MaxHp: f2.maxHp,
            f2Energy: f2.energy,
            f2MaxEnergy: f2.maxEnergy,
            f2SpecialCd: f2.specialCooldown,
            f2DashCd: f2.dashCooldown,
            roundTimer: Math.ceil(engine.state.roundTimer),
            winner: engine.state.winner,
            isOver: engine.state.isRoundOver,
          });
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [onlineWs, onlineSlot]);

  // Background Scenery Painting
  const drawArenaBackground = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    arena: Arena,
    now: number
  ) => {
    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, arena.bgGradient[0]);
    grad.addColorStop(1, arena.bgGradient[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    if (arena.theme === 'cyber') {
      // Futuristic skyline silhouettes
      ctx.fillStyle = '#0f172a';
      for (let i = 0; i < 16; i++) {
        const bx = i * 65;
        const bh = 140 + Math.sin(i * 99) * 90;
        ctx.fillRect(bx, h - bh - 50, 52, bh + 50);
        // Window dots
        ctx.fillStyle = i % 2 === 0 ? '#38bdf8' : '#eab308';
        ctx.globalAlpha = 0.3;
        for (let wy = h - bh - 30; wy < h - 70; wy += 20) {
          ctx.fillRect(bx + 10, wy, 8, 8);
          ctx.fillRect(bx + 26, wy, 8, 8);
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#0f172a';
      }
    } else if (arena.theme === 'volcano') {
      // Lava glow at bottom
      const lavaGrad = ctx.createLinearGradient(0, h - 90, 0, h);
      lavaGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
      lavaGrad.addColorStop(1, 'rgba(239, 68, 68, 0.45)');
      ctx.fillStyle = lavaGrad;
      ctx.fillRect(0, h - 90, w, 90);
    } else {
      // Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath();
      ctx.arc(200 + Math.sin(now * 0.0005) * 40, 120, 90, 0, Math.PI * 2);
      ctx.arc(320 + Math.sin(now * 0.0005) * 40, 100, 120, 0, Math.PI * 2);
      ctx.arc(700 - Math.sin(now * 0.0005) * 40, 160, 110, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // Arena Platforms Painting
  const drawArenaPlatforms = (ctx: CanvasRenderingContext2D, arena: Arena) => {
    arena.platforms.forEach((plat) => {
      ctx.save();
      // Main body
      ctx.fillStyle = plat.color || '#1e293b';
      ctx.fillRect(plat.x, plat.y, plat.width, plat.height);

      // Glowing ledge border
      ctx.strokeStyle = plat.isJumpPad ? '#facc15' : '#06b6d4';
      ctx.shadowColor = plat.isJumpPad ? '#facc15' : '#06b6d4';
      ctx.shadowBlur = plat.isJumpPad ? 12 : 6;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(plat.x, plat.y);
      ctx.lineTo(plat.x + plat.width, plat.y);
      ctx.stroke();

      // Jump pad chevron markings
      if (plat.isJumpPad) {
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('▲ SPRING JUMP ▲', plat.x + plat.width / 2, plat.y + 12);
      }
      ctx.restore();
    });
  };

  const f1 = engineRef.current?.state.fighters[0];
  const f2 = engineRef.current?.state.fighters[1];

  const f1HpPercent = Math.max(0, Math.round((hudState.f1Hp / hudState.f1MaxHp) * 100));
  const f2HpPercent = Math.max(0, Math.round((hudState.f2Hp / hudState.f2MaxHp) * 100));
  const f1EnergyPercent = Math.min(100, Math.round((hudState.f1Energy / hudState.f1MaxEnergy) * 100));
  const f2EnergyPercent = Math.min(100, Math.round((hudState.f2Energy / hudState.f2MaxEnergy) * 100));

  return (
    <div
      ref={containerRef}
      id="arena-container"
      className="relative w-full max-w-5xl mx-auto flex flex-col items-center select-none"
    >
      {/* Top HUD: Health Bars, Energy, Cooldowns, Round Timer */}
      <div
        id="combat-hud"
        className="w-full bg-[#0E0E13]/95 border-x border-t border-[#252530] rounded-t-3xl p-4 flex items-center justify-between gap-4 shadow-xl backdrop-blur-md"
      >
        {/* Fighter 1 Bar */}
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full ring-2 ring-white/20 shadow-xs" style={{ backgroundColor: f1?.color || '#00F0FF' }} />
              <span className="font-black text-sm text-slate-100 font-display">{f1?.name || 'Player 1'}</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40">
                P1
              </span>
            </div>
            <span className="text-xs font-mono font-black text-slate-300">
              {Math.max(0, Math.round(hudState.f1Hp))} / {hudState.f1MaxHp} HP
            </span>
          </div>

          {/* Health bar */}
          <div className="w-full h-4 bg-[#14141C] rounded-xl overflow-hidden border border-[#252535] p-0.5 shadow-inner">
            <div
              className={`h-full rounded-lg transition-all duration-150 ${
                f1HpPercent > 50
                  ? 'bg-gradient-to-r from-[#00F0FF] to-[#3B82F6] shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                  : f1HpPercent > 25
                  ? 'bg-[#FFD700] shadow-[0_0_10px_rgba(255,215,0,0.4)]'
                  : 'bg-[#FF0055] animate-pulse shadow-[0_0_12px_rgba(255,0,85,0.5)]'
              }`}
              style={{ width: `${f1HpPercent}%` }}
            />
          </div>

          {/* Energy bar & skill indicators */}
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <div className="flex-1 h-2 bg-[#14141C] rounded-full overflow-hidden border border-[#252535]">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-[#00F0FF] transition-all duration-100 shadow-[0_0_8px_rgba(0,240,255,0.3)]"
                style={{ width: `${f1EnergyPercent}%` }}
              />
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold">
              <span
                className={`px-2 py-0.5 rounded-md border font-black ${
                  hudState.f1SpecialCd <= 0
                    ? 'bg-[#FF0055]/20 text-[#FF0055] border-[#FF0055]/50 animate-pulse shadow-[0_0_8px_rgba(255,0,85,0.3)]'
                    : 'bg-[#181822] text-slate-500 border-[#2A2A38]'
                }`}
              >
                SPECIAL {hudState.f1SpecialCd > 0 ? `${hudState.f1SpecialCd.toFixed(1)}s` : 'READY'}
              </span>
              <span
                className={`px-2 py-0.5 rounded-md border font-black ${
                  hudState.f1DashCd <= 0
                    ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/50 shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                    : 'bg-[#181822] text-slate-500 border-[#2A2A38]'
                }`}
              >
                DASH {hudState.f1DashCd > 0 ? `${hudState.f1DashCd.toFixed(1)}s` : 'RDY'}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Timer & Round Score */}
        <div className="flex flex-col items-center px-4 py-1.5 bg-[#13131A] border border-[#2A2A38] rounded-2xl min-w-[96px] shadow-[0_0_15px_rgba(255,215,0,0.1)]">
          <span className="text-2xl font-black font-mono text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.3)]">{hudState.roundTimer}</span>
          <div className="flex items-center gap-2 text-xs font-black font-display">
            <span className="text-[#00F0FF]">{roundScores[0]}</span>
            <span className="text-slate-500">:</span>
            <span className="text-[#FF0055]">{roundScores[1]}</span>
          </div>
        </div>

        {/* Fighter 2 Bar */}
        <div className="flex-1 flex flex-col gap-1.5 text-right">
          <div className="flex items-center justify-between flex-row-reverse">
            <div className="flex items-center gap-2 flex-row-reverse">
              <span className="w-3.5 h-3.5 rounded-full ring-2 ring-white/20 shadow-xs" style={{ backgroundColor: f2?.color || '#FF0055' }} />
              <span className="font-black text-sm text-slate-100 font-display">{f2?.name || 'Opponent'}</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#FF0055]/15 text-[#FF0055] border border-[#FF0055]/40">
                P2
              </span>
            </div>
            <span className="text-xs font-mono font-black text-slate-300">
              {Math.max(0, Math.round(hudState.f2Hp))} / {hudState.f2MaxHp} HP
            </span>
          </div>

          {/* Health bar (fills right-to-left) */}
          <div className="w-full h-4 bg-[#14141C] rounded-xl overflow-hidden border border-[#252535] p-0.5 flex justify-end shadow-inner">
            <div
              className={`h-full rounded-lg transition-all duration-150 ${
                f2HpPercent > 50
                  ? 'bg-gradient-to-l from-[#FF0055] to-[#FFAA00] shadow-[0_0_10px_rgba(255,0,85,0.4)]'
                  : f2HpPercent > 25
                  ? 'bg-[#FFD700] shadow-[0_0_10px_rgba(255,215,0,0.4)]'
                  : 'bg-[#FF0055] animate-pulse shadow-[0_0_12px_rgba(255,0,85,0.5)]'
              }`}
              style={{ width: `${f2HpPercent}%` }}
            />
          </div>

          {/* Energy bar & skill indicators */}
          <div className="flex items-center justify-between gap-2 mt-0.5 flex-row-reverse">
            <div className="flex-1 h-2 bg-[#14141C] rounded-full overflow-hidden border border-[#252535] flex justify-end">
              <div
                className="h-full bg-gradient-to-l from-purple-500 to-[#FF0055] transition-all duration-100 shadow-[0_0_8px_rgba(255,0,85,0.3)]"
                style={{ width: `${f2EnergyPercent}%` }}
              />
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold">
              <span
                className={`px-2 py-0.5 rounded-md border font-black ${
                  hudState.f2SpecialCd <= 0
                    ? 'bg-[#FF0055]/20 text-[#FF0055] border-[#FF0055]/50'
                    : 'bg-[#181822] text-slate-500 border-[#2A2A38]'
                }`}
              >
                SPECIAL {hudState.f2SpecialCd > 0 ? `${hudState.f2SpecialCd.toFixed(1)}s` : 'RDY'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Canvas */}
      <div className="relative w-full border-x border-b border-[#252530] rounded-b-3xl overflow-hidden bg-[#0A0A0E] shadow-2xl">
        <canvas
          ref={canvasRef}
          width={960}
          height={540}
          className="w-full aspect-[16/9] block object-contain"
        />

        {/* POST-MATCH OVERLAY */}
        {hudState.isOver && (
          <div
            id="match-result-overlay"
            className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fade-in"
          >
            <div className="w-full max-w-md bg-gradient-to-b from-[#14141E] to-[#0A0A0E] border-2 border-[#FFD700]/70 rounded-3xl p-7 text-center space-y-5 shadow-[0_0_40px_rgba(255,215,0,0.25)]">
              <div className="w-16 h-16 rounded-2xl bg-[#FFD700]/20 border-2 border-[#FFD700]/60 mx-auto flex items-center justify-center text-[#FFD700] shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                <Trophy className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-4xl font-black text-white uppercase tracking-wider font-display drop-shadow-[0_0_15px_rgba(255,215,0,0.4)]">
                  {hudState.winner === (mode === 'online_room' ? onlineSlot : 1) ? 'VICTORY!' : 'DEFEAT!'}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  {hudState.winner === 1 ? f1?.name : f2?.name} conquered the arena!
                </p>
              </div>

              {/* Match Rewards */}
              {matchRewardsEarned && (
                <div className="p-4 rounded-2xl bg-[#121218] border border-[#262636] flex items-center justify-around text-xs shadow-inner">
                  <div className="flex items-center gap-2 text-[#00F0FF] font-black font-display text-sm">
                    <Sparkles className="w-4 h-4 text-[#00F0FF]" />
                    <span>+{matchRewardsEarned.xp} XP</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#FFD700] font-black font-display text-sm">
                    <Coins className="w-4 h-4 text-[#FFD700]" />
                    <span>+{matchRewardsEarned.coins} Coins</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  id="btn-match-rematch"
                  onClick={() => setupEngine()}
                  className="py-3.5 rounded-2xl bg-[#00F0FF] hover:bg-[#33F4FF] text-[#0A0A0B] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all cursor-pointer font-display"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Rematch</span>
                </button>
                <button
                  id="btn-match-exit"
                  onClick={onExit}
                  className="py-3.5 rounded-2xl bg-[#1A1A24] hover:bg-[#252535] text-slate-200 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-[#303042] transition-all cursor-pointer font-display"
                >
                  <Home className="w-4 h-4" />
                  <span>Exit to Menu</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* On-Screen Virtual Controls & Control Cheatsheet */}
      <div className="w-full mt-3 p-4 bg-[#0E0E13] border border-[#252530] rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs shadow-lg">
        {/* P1 Controls Legend */}
        <div className="flex items-center gap-3.5 text-slate-300">
          <span className="font-black text-[#00F0FF] font-display">P1 Controls:</span>
          <div className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 bg-[#181822] border border-[#2C2C3D] rounded-md text-[11px] font-mono text-slate-200 font-bold">W A D</kbd>
            <span className="text-slate-400">Move/Jump</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 bg-[#181822] border border-[#2C2C3D] rounded-md text-[11px] font-mono text-slate-200 font-bold">F</kbd>
            <span className="text-slate-400">Attack</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 bg-[#181822] border border-[#2C2C3D] rounded-md text-[11px] font-mono text-slate-200 font-bold">G</kbd>
            <span className="text-slate-400">Shield</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 bg-[#181822] border border-[#2C2C3D] rounded-md text-[11px] font-mono text-slate-200 font-bold">SPACE</kbd>
            <span className="text-slate-400">Special</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 bg-[#181822] border border-[#2C2C3D] rounded-md text-[11px] font-mono text-slate-200 font-bold">Q</kbd>
            <span className="text-slate-400">Dash</span>
          </div>
        </div>

        {/* Local 2P Legend */}
        {mode === 'local_2p' && (
          <div className="flex items-center gap-3.5 text-slate-300 border-l border-[#22222E] pl-4">
            <span className="font-black text-[#FF0055] font-display">P2 Controls:</span>
            <div className="flex items-center gap-1.5">
              <kbd className="px-2 py-0.5 bg-[#181822] border border-[#2C2C3D] rounded-md text-[11px] font-mono text-slate-200 font-bold">ARROWS</kbd>
              <span className="text-slate-400">Move</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-2 py-0.5 bg-[#181822] border border-[#2C2C3D] rounded-md text-[11px] font-mono text-slate-200 font-bold">K</kbd>
              <span className="text-slate-400">Attack</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-2 py-0.5 bg-[#181822] border border-[#2C2C3D] rounded-md text-[11px] font-mono text-slate-200 font-bold">L</kbd>
              <span className="text-slate-400">Shield</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-2 py-0.5 bg-[#181822] border border-[#2C2C3D] rounded-md text-[11px] font-mono text-slate-200 font-bold">P</kbd>
              <span className="text-slate-400">Special</span>
            </div>
          </div>
        )}

        {/* Return Button */}
        <button
          id="btn-arena-return"
          onClick={onExit}
          className="ml-auto px-4 py-2 rounded-xl bg-[#14141C] hover:bg-[#1E1E2A] text-slate-400 hover:text-slate-100 border border-[#262636] text-xs font-bold transition-colors cursor-pointer"
        >
          Exit Duel
        </button>
      </div>

      {/* Mobile / On-Screen Touch Bar for touch devices */}
      <div className="w-full mt-2 grid grid-cols-2 gap-2 sm:hidden">
        <div className="flex gap-2">
          <button
            onMouseDown={() => (keysRef.current.p1.left = true)}
            onMouseUp={() => (keysRef.current.p1.left = false)}
            onTouchStart={() => (keysRef.current.p1.left = true)}
            onTouchEnd={() => (keysRef.current.p1.left = false)}
            className="flex-1 py-3 bg-slate-800 border border-slate-700 rounded-xl font-bold text-slate-200 active:bg-cyan-500 active:text-slate-950"
          >
            ◀ LEFT
          </button>
          <button
            onMouseDown={() => (keysRef.current.p1.right = true)}
            onMouseUp={() => (keysRef.current.p1.right = false)}
            onTouchStart={() => (keysRef.current.p1.right = true)}
            onTouchEnd={() => (keysRef.current.p1.right = false)}
            className="flex-1 py-3 bg-slate-800 border border-slate-700 rounded-xl font-bold text-slate-200 active:bg-cyan-500 active:text-slate-950"
          >
            RIGHT ▶
          </button>
          <button
            onMouseDown={() => (keysRef.current.p1.jump = true)}
            onMouseUp={() => (keysRef.current.p1.jump = false)}
            onTouchStart={() => (keysRef.current.p1.jump = true)}
            onTouchEnd={() => (keysRef.current.p1.jump = false)}
            className="flex-1 py-3 bg-slate-800 border border-slate-700 rounded-xl font-bold text-slate-200 active:bg-cyan-500 active:text-slate-950"
          >
            ▲ JUMP
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onMouseDown={() => (keysRef.current.p1.attack = true)}
            onMouseUp={() => (keysRef.current.p1.attack = false)}
            onTouchStart={() => (keysRef.current.p1.attack = true)}
            onTouchEnd={() => (keysRef.current.p1.attack = false)}
            className="flex-1 py-3 bg-rose-950/60 border border-rose-500/40 rounded-xl font-black text-rose-300 active:bg-rose-500 active:text-slate-950"
          >
            ATTACK
          </button>
          <button
            onMouseDown={() => (keysRef.current.p1.shield = true)}
            onMouseUp={() => (keysRef.current.p1.shield = false)}
            onTouchStart={() => (keysRef.current.p1.shield = true)}
            onTouchEnd={() => (keysRef.current.p1.shield = false)}
            className="flex-1 py-3 bg-blue-950/60 border border-blue-500/40 rounded-xl font-black text-blue-300 active:bg-blue-500 active:text-slate-950"
          >
            SHIELD
          </button>
          <button
            onMouseDown={() => (keysRef.current.p1.special = true)}
            onMouseUp={() => (keysRef.current.p1.special = false)}
            onTouchStart={() => (keysRef.current.p1.special = true)}
            onTouchEnd={() => (keysRef.current.p1.special = false)}
            className="flex-1 py-3 bg-purple-950/60 border border-purple-500/40 rounded-xl font-black text-purple-300 active:bg-purple-500 active:text-slate-950"
          >
            SKILL
          </button>
        </div>
      </div>
    </div>
  );
};
