import React from 'react';
import { useGame } from '../context/GameContext';
import { PlayerStats } from '../types';
import { Swords, Shield, Zap, Wind, Plus, Trophy, Award, X, Sparkles } from 'lucide-react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose }) => {
  const { profile, upgradeStat } = useGame();

  if (!isOpen) return null;

  const winRate =
    profile.matchesPlayed > 0 ? Math.round((profile.wins / profile.matchesPlayed) * 100) : 0;

  const statItems: {
    key: keyof PlayerStats;
    label: string;
    desc: string;
    icon: any;
    color: string;
    effectText: string;
  }[] = [
    {
      key: 'attack',
      label: 'Attack Power',
      desc: 'Increases all weapon and projectile strike damage.',
      icon: Swords,
      color: 'text-[#FF0055] bg-[#FF0055]/15 border-[#FF0055]/40 shadow-[0_0_10px_rgba(255,0,85,0.2)]',
      effectText: `+${profile.stats.attack * 5}% Damage`,
    },
    {
      key: 'defense',
      label: 'Defense & Vitality',
      desc: 'Boosts max HP and shield impact stability.',
      icon: Shield,
      color: 'text-[#00F0FF] bg-[#00F0FF]/15 border-[#00F0FF]/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]',
      effectText: `+${profile.stats.defense * 8} Max HP`,
    },
    {
      key: 'agility',
      label: 'Agility & Speed',
      desc: 'Increases movement velocity and reduces dash cooldown.',
      icon: Wind,
      color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/40',
      effectText: `+${profile.stats.agility * 3}% Movement Speed`,
    },
    {
      key: 'energy',
      label: 'Energy & Tech',
      desc: 'Expands energy pool for special weapon skills.',
      icon: Zap,
      color: 'text-[#FFD700] bg-[#FFD700]/15 border-[#FFD700]/40 shadow-[0_0_10px_rgba(255,215,0,0.2)]',
      effectText: `+${profile.stats.energy * 6} Max Energy`,
    },
  ];

  return (
    <div
      id="stats-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
    >
      <div
        id="stats-modal-card"
        className="w-full max-w-2xl bg-[#0E0E13] border border-[#252530] rounded-3xl flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#22222B] flex items-center justify-between bg-[#13131A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFD700]/15 border border-[#FFD700]/40 flex items-center justify-center text-[#FFD700] font-black font-display text-base shadow-[0_0_12px_rgba(255,215,0,0.2)]">
              {profile.level}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-100 uppercase tracking-wider font-display">Fighter Profile & Stats</h2>
              <p className="text-xs text-slate-400">Level up to earn skill points and boost combat attributes</p>
            </div>
          </div>
          <button
            id="btn-close-stats"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-[#1A1A24] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Points banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FFD700]/15 via-[#FF0055]/10 to-[#00F0FF]/15 border border-[#FFD700]/40 flex items-center justify-between shadow-[0_0_20px_rgba(255,215,0,0.1)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFD700]/20 flex items-center justify-center text-[#FFD700]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase font-black tracking-wider">Available Skill Points</span>
                <div className="text-2xl font-black text-[#FFD700] font-display">{profile.skillPoints} Points</div>
              </div>
            </div>
            <span className="text-xs text-slate-300 max-w-[200px] text-right hidden sm:inline leading-tight">
              Earn +2 Skill Points each time your stick fighter levels up!
            </span>
          </div>

          {/* Stat upgrade rows */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-[#00F0FF] uppercase tracking-wider font-display">Combat Attributes</h3>
            {statItems.map((stat) => {
              const Icon = stat.icon;
              const val = profile.stats[stat.key];
              const canUpgrade = profile.skillPoints > 0;

              return (
                <div
                  key={stat.key}
                  className="p-4 rounded-2xl bg-[#121218] border border-[#22222C] flex items-center justify-between gap-3 hover:border-[#333345] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${stat.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-200 font-display">{stat.label}</span>
                        <span className="text-[11px] font-black text-[#00F0FF] px-2 py-0.5 rounded-md bg-[#00F0FF]/10 border border-[#00F0FF]/30">
                          Rank {val}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{stat.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-300 hidden sm:inline">{stat.effectText}</span>
                    <button
                      id={`btn-upgrade-${stat.key}`}
                      onClick={() => upgradeStat(stat.key)}
                      disabled={!canUpgrade}
                      className={`px-3.5 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                        canUpgrade
                          ? 'bg-[#FFD700] hover:bg-[#FFE240] text-[#0A0A0B] shadow-[0_0_15px_rgba(255,215,0,0.3)]'
                          : 'bg-[#181820] text-slate-500 cursor-not-allowed border border-[#2A2A35]'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Upgrade</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Career Combat Record */}
          <div className="pt-2">
            <h3 className="text-xs font-black text-[#FF0055] uppercase tracking-wider mb-3 font-display">Lifetime Battle Record</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#121218] border border-[#22222C] text-center">
                <span className="text-[11px] text-slate-400 font-bold">Matches Played</span>
                <div className="text-xl font-black text-slate-100 mt-1 font-display">{profile.matchesPlayed}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#121218] border border-[#22222C] text-center">
                <span className="text-[11px] text-slate-400 font-bold">Victories</span>
                <div className="text-xl font-black text-[#00F0FF] mt-1 font-display">{profile.wins}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#121218] border border-[#22222C] text-center">
                <span className="text-[11px] text-slate-400 font-bold">Win Rate</span>
                <div className="text-xl font-black text-[#FFD700] mt-1 font-display">{winRate}%</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#121218] border border-[#22222C] text-center">
                <span className="text-[11px] text-slate-400 font-bold">Perfect Parries</span>
                <div className="text-xl font-black text-[#FF0055] mt-1 font-display">{profile.parries}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
