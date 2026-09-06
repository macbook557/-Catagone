import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { GameMode } from '../types';
import { ARENAS, WEAPONS, SHIELDS, HEADGEAR_LIST } from '../data/gear';
import {
  Swords,
  Users,
  Bot,
  Flame,
  Shield,
  Sparkles,
  Play,
  Zap,
  ArrowRight,
  Trophy,
} from 'lucide-react';

interface LobbyMenuProps {
  onStartGame: (mode: GameMode, arenaId: string, difficulty?: 'easy' | 'medium' | 'hard' | 'boss') => void;
  onOpenArmory: () => void;
  onOpenStats: () => void;
  onOpenOnlineLobby: () => void;
}

export const LobbyMenu: React.FC<LobbyMenuProps> = ({
  onStartGame,
  onOpenArmory,
  onOpenStats,
  onOpenOnlineLobby,
}) => {
  const { profile } = useGame();
  const [selectedArena, setSelectedArena] = useState<string>('cyber_rooftop');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard' | 'boss'>('medium');

  const currentWeapon = WEAPONS.find((w) => w.id === profile.equippedWeapon) || WEAPONS[0];
  const currentShield = SHIELDS.find((s) => s.id === profile.equippedShield) || SHIELDS[0];
  const currentHeadgear = HEADGEAR_LIST.find((h) => h.id === profile.equippedHeadgear) || HEADGEAR_LIST[0];

  return (
    <div id="lobby-menu" className="w-full max-w-5xl mx-auto space-y-6 pb-12">
      {/* Hero Fighter Status Card */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0E0E13] border border-[#252530] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl hover:border-[#FFD700]/40 transition-colors">
        <div className="space-y-3 text-center md:text-left z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] text-xs font-black uppercase tracking-wider shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fighter Profile • Ready for Combat</span>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-3">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-50 tracking-tight font-display">
              {profile.name}
            </h1>
            <span className="px-3 py-1 rounded-xl bg-[#FFD700]/20 border border-[#FFD700]/50 text-[#FFD700] font-black text-xs shadow-[0_0_10px_rgba(255,215,0,0.25)]">
              LVL {profile.level}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Swords className="w-4 h-4 text-[#00F0FF]" />
              <span>Weapon: <strong className="text-slate-200">{currentWeapon.name}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#FFD700]" />
              <span>Shield: <strong className="text-slate-200">{currentShield.name}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-[#FF0055]" />
              <span>Victories: <strong className="text-slate-200">{profile.wins}</strong></span>
            </div>
          </div>
        </div>

        {/* Action quick links for Fighter */}
        <div className="flex items-center gap-3 z-10">
          <button
            id="btn-hero-armory"
            onClick={onOpenArmory}
            className="px-5 py-3 rounded-2xl bg-[#15151D] hover:bg-[#1C1C26] text-slate-100 font-bold text-xs border border-[#2B2B38] hover:border-[#00F0FF]/60 hover:text-[#00F0FF] shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Swords className="w-4 h-4 text-[#00F0FF]" />
            <span>Switch Gear</span>
          </button>
          <button
            id="btn-hero-stats"
            onClick={onOpenStats}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#FFD700] to-[#FFAA00] hover:brightness-110 text-[#0A0A0B] font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(255,215,0,0.3)] transition-all flex items-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4 text-[#0A0A0B]" />
            <span>Upgrade Stats ({profile.skillPoints} pts)</span>
          </button>
        </div>

        {/* Ambient artistic glows */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#00F0FF]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-[#FFD700]/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main Game Modes Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-widest text-[#FFD700] flex items-center gap-2">
          <span>Select Game Mode</span>
          <span className="w-8 h-px bg-[#FFD700]/40 inline-block" />
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Mode 1: Local 2-Player with Friends */}
          <div
            onClick={() => onStartGame('local_2p', selectedArena)}
            className="group relative p-6 rounded-3xl bg-[#0E0E13] border border-[#252530] hover:border-[#00F0FF] hover:shadow-[0_0_30px_rgba(0,240,255,0.18)] transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF] group-hover:scale-110 group-hover:border-[#00F0FF] group-hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all mb-4">
                <Users className="w-6 h-6" />
              </div>
              <div className="inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#00F0FF]/15 border border-[#00F0FF]/30 text-[#00F0FF] mb-2 tracking-wider">
                SAME SCREEN / KEYBOARD
              </div>
              <h3 className="text-xl font-black text-slate-100 group-hover:text-[#00F0FF] transition-colors font-display">
                Play With Friends (Local 2P)
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Grab a friend and duel on the same laptop or keyboard! P1 uses WASD + F/G/Space, P2 uses Arrow Keys + Num Keys.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[#22222D] flex items-center justify-between text-xs font-bold text-[#00F0FF] group-hover:translate-x-1 transition-transform">
              <span>Start Local 2P Duel</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Mode 2: Online Multiplayer Room */}
          <div
            onClick={onOpenOnlineLobby}
            className="group relative p-6 rounded-3xl bg-[#0E0E13] border border-[#252530] hover:border-[#FF0055] hover:shadow-[0_0_30px_rgba(255,0,85,0.18)] transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#FF0055]/10 border border-[#FF0055]/30 flex items-center justify-center text-[#FF0055] group-hover:scale-110 group-hover:border-[#FF0055] group-hover:shadow-[0_0_15px_rgba(255,0,85,0.3)] transition-all mb-4">
                <Swords className="w-6 h-6" />
              </div>
              <div className="inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#FF0055]/15 border border-[#FF0055]/30 text-[#FF0055] mb-2 tracking-wider">
                REAL-TIME WEBSOCKET
              </div>
              <h3 className="text-xl font-black text-slate-100 group-hover:text-[#FF0055] transition-colors font-display">
                Online Room Duel
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Create a 4-letter room code and send it to your friend on another phone or computer to clash in real-time!
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[#22222D] flex items-center justify-between text-xs font-bold text-[#FF0055] group-hover:translate-x-1 transition-transform">
              <span>Host or Join Online Room</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Mode 3: Solo Bot Battle & Practice */}
          <div
            onClick={() => onStartGame('solo_arena', selectedArena, selectedDifficulty)}
            className="group relative p-6 rounded-3xl bg-[#0E0E13] border border-[#252530] hover:border-[#FFD700] hover:shadow-[0_0_30px_rgba(255,215,0,0.18)] transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#FFD700]/10 border border-[#FFD700]/30 flex items-center justify-center text-[#FFD700] group-hover:scale-110 group-hover:border-[#FFD700] group-hover:shadow-[0_0_15px_rgba(255,215,0,0.3)] transition-all mb-4">
                <Bot className="w-6 h-6" />
              </div>
              <div className="inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#FFD700]/15 border border-[#FFD700]/30 text-[#FFD700] mb-2 tracking-wider">
                SOLO GRIND & LEVEL UP
              </div>
              <h3 className="text-xl font-black text-slate-100 group-hover:text-[#FFD700] transition-colors font-display">
                Solo Arena Match
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Battle intelligent AI stickmen with smart parrying, dodging, and special skills to farm XP and unlock weapons!
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[#22222D] flex items-center justify-between text-xs font-bold text-[#FFD700] group-hover:translate-x-1 transition-transform">
              <span>Start Battle vs AI</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Arena Selector & AI Difficulty Tuning */}
      <div className="p-6 rounded-3xl bg-[#0E0E13]/80 border border-[#252530] space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider font-display">Combat Arena</h3>
            <p className="text-xs text-slate-400">Select where the battle takes place</p>
          </div>

          {/* AI Difficulty Selector */}
          <div className="flex items-center gap-1 bg-[#14141A] p-1.5 rounded-2xl border border-[#2A2A38] text-xs">
            <span className="text-[11px] font-bold text-slate-400 px-2">AI Rank:</span>
            {(['easy', 'medium', 'hard', 'boss'] as const).map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-3 py-1 rounded-xl font-black capitalize transition-all cursor-pointer ${
                  selectedDifficulty === diff
                    ? 'bg-[#FFD700] text-[#0A0A0B] shadow-[0_0_12px_rgba(255,215,0,0.3)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Arenas List */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ARENAS.map((arena) => (
            <button
              key={arena.id}
              onClick={() => setSelectedArena(arena.id)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedArena === arena.id
                  ? 'border-[#00F0FF] bg-[#00F0FF]/10 shadow-[0_0_20px_rgba(0,240,255,0.15)]'
                  : 'border-[#22222C] bg-[#121217] hover:border-[#353545]'
              }`}
            >
              <div className="font-black text-sm text-slate-100 font-display">{arena.name}</div>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{arena.description}</p>
              <div className="mt-3 text-[10px] font-black text-[#00F0FF] uppercase tracking-wider">
                {selectedArena === arena.id ? '● SELECTED' : 'CHOOSE ARENA'}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
