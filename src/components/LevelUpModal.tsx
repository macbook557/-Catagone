import React from 'react';
import { useGame } from '../context/GameContext';
import { Sparkles, Trophy, ArrowRight, Swords, Shield } from 'lucide-react';

interface LevelUpModalProps {
  onOpenStats: () => void;
  onOpenArmory: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ onOpenStats, onOpenArmory }) => {
  const { levelUpAlert, dismissLevelUpAlert } = useGame();

  if (!levelUpAlert) return null;

  return (
    <div
      id="level-up-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        id="level-up-card"
        className="w-full max-w-md bg-gradient-to-b from-[#14141E] to-[#0A0A0E] border-2 border-[#FFD700]/80 rounded-3xl p-6 text-center space-y-5 shadow-[0_0_40px_rgba(255,215,0,0.25)]"
      >
        {/* Glowing Trophy Icon */}
        <div className="relative mx-auto w-20 h-20 rounded-2xl bg-[#FFD700]/20 border-2 border-[#FFD700]/60 flex items-center justify-center text-[#FFD700] shadow-[0_0_25px_rgba(255,215,0,0.35)]">
          <Trophy className="w-10 h-10 animate-bounce" />
          <Sparkles className="w-5 h-5 absolute -top-2 -right-2 text-[#00F0FF] animate-pulse" />
        </div>

        <div>
          <span className="text-xs font-black tracking-widest text-[#FFD700] uppercase font-display">Victory Progression</span>
          <h2 className="text-4xl font-black text-white mt-1 tracking-wider font-display drop-shadow-[0_0_15px_rgba(255,215,0,0.4)]">
            LEVEL UP!
          </h2>
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="text-sm font-bold text-slate-400">LVL {levelUpAlert.oldLevel}</span>
            <ArrowRight className="w-4 h-4 text-[#FFD700]" />
            <span className="text-xl font-black text-[#FFD700] px-3.5 py-1 rounded-full bg-[#FFD700]/15 border border-[#FFD700]/50 font-display shadow-[0_0_15px_rgba(255,215,0,0.2)]">
              LVL {levelUpAlert.newLevel}
            </span>
          </div>
        </div>

        {/* Rewards summary */}
        <div className="p-4 rounded-2xl bg-[#121218] border border-[#262636] space-y-2 text-left text-xs">
          <div className="flex items-center justify-between text-slate-200 font-bold">
            <span className="flex items-center gap-1.5 text-[#FFD700]">
              <Sparkles className="w-4 h-4 text-[#FFD700]" />
              Skill Points Earned
            </span>
            <span className="text-sm text-[#FFD700] font-black font-display">+2 Points</span>
          </div>

          {levelUpAlert.unlockedItems.length > 0 && (
            <div className="pt-2 border-t border-[#22222D]">
              <span className="text-[11px] font-black text-[#00F0FF] uppercase tracking-wider block mb-1.5 font-display">
                New Gear Unlocked in Armory:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {levelUpAlert.unlockedItems.map((name) => (
                  <span
                    key={name}
                    className="px-2.5 py-1 rounded-lg bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] font-black text-[11px] font-display shadow-[0_0_8px_rgba(0,240,255,0.15)]"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            id="btn-level-up-stats"
            onClick={() => {
              dismissLevelUpAlert();
              onOpenStats();
            }}
            className="py-3 rounded-2xl bg-[#1A1A24] hover:bg-[#252535] text-slate-200 font-black text-xs border border-[#303042] transition-all cursor-pointer font-display uppercase tracking-wider"
          >
            Allocate Stats
          </button>
          <button
            id="btn-level-up-continue"
            onClick={dismissLevelUpAlert}
            className="py-3 rounded-2xl bg-gradient-to-r from-[#FFD700] to-[#FFAA00] hover:brightness-110 text-[#0A0A0B] font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(255,215,0,0.3)] transition-all cursor-pointer font-display"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};
