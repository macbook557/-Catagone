import React from 'react';
import { useGame } from '../context/GameContext';
import { sound } from '../utils/audio';
import { Shield, Swords, Sparkles, Volume2, VolumeX, Music, Trophy, Coins, User } from 'lucide-react';

interface NavbarProps {
  onOpenArmory: () => void;
  onOpenStats: () => void;
  onOpenLobby: () => void;
  onReturnToLobby: () => void;
  inGame: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenArmory,
  onOpenStats,
  onOpenLobby,
  onReturnToLobby,
  inGame,
}) => {
  const { profile } = useGame();
  const [soundOn, setSoundOn] = React.useState(sound.enabled);
  const [musicOn, setMusicOn] = React.useState(sound.musicEnabled);

  const toggleSound = () => {
    const next = sound.toggleSound();
    setSoundOn(next);
  };

  const toggleMusic = () => {
    const next = sound.toggleMusic();
    setMusicOn(next);
  };

  const xpPercent = Math.min(100, Math.round((profile.xp / profile.xpToNextLevel) * 100));

  return (
    <header
      id="main-navbar"
      className="w-full bg-[#0A0A0B]/90 backdrop-blur-md border-b border-[#222228] px-4 py-2.5 flex items-center justify-between sticky top-0 z-30 select-none shadow-md shadow-black/40"
    >
      {/* Brand & Mode */}
      <div className="flex items-center gap-3">
        <button
          id="btn-nav-home"
          onClick={onReturnToLobby}
          className="flex items-center gap-2.5 group text-left cursor-pointer focus:outline-none"
          title="Return to Menu"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FFD700]/15 to-[#00F0FF]/15 border border-[#FFD700]/40 flex items-center justify-center text-[#FFD700] group-hover:scale-105 group-hover:border-[#00F0FF] group-hover:text-[#00F0FF] transition-all shadow-sm shadow-[#FFD700]/10">
            <Swords className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base tracking-wider text-slate-100 font-display group-hover:text-[#00F0FF] transition-colors">
                STICK BRAWLERS
              </span>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-[#FFD700]/15 text-[#FFD700] uppercase tracking-widest border border-[#FFD700]/30 shadow-xs">
                ARTISTIC
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Physics Duel & Combat Arena</p>
          </div>
        </button>
      </div>

      {/* Level & XP Meter */}
      <div className="hidden md:flex items-center gap-3 bg-[#121216] border border-[#26262f] rounded-full px-4 py-1.5 shadow-inner">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-[#FFD700]/20 border border-[#FFD700]/50 text-[#FFD700] text-xs font-black flex items-center justify-center shadow-[0_0_8px_rgba(255,215,0,0.3)]">
            {profile.level}
          </div>
          <span className="text-xs font-bold text-slate-200">LVL {profile.level}</span>
        </div>

        {/* XP Progress Bar */}
        <div className="w-28 flex flex-col gap-0.5">
          <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
            <span>XP</span>
            <span>{profile.xp}/{profile.xpToNextLevel}</span>
          </div>
          <div className="w-full h-1.5 bg-[#1e1e26] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#FFD700] via-[#00F0FF] to-[#FF0055] rounded-full transition-all duration-300"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>

        {/* Coins */}
        <div className="flex items-center gap-1 text-[#FFD700] font-black text-xs pl-2.5 border-l border-[#26262f]">
          <Coins className="w-3.5 h-3.5 text-[#FFD700]" />
          <span>{profile.coins}</span>
        </div>

        {/* Skill Points alert */}
        {profile.skillPoints > 0 && (
          <button
            id="btn-nav-skill-points"
            onClick={onOpenStats}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FF0055]/20 border border-[#FF0055]/50 text-[#FF0055] text-xs font-black animate-pulse hover:bg-[#FF0055]/30 transition-all cursor-pointer shadow-[0_0_10px_rgba(255,0,85,0.2)]"
          >
            <Sparkles className="w-3 h-3 text-[#FF0055]" />
            <span>+{profile.skillPoints} PTS</span>
          </button>
        )}
      </div>

      {/* Controls & Nav Buttons */}
      <div className="flex items-center gap-2">
        <button
          id="btn-nav-armory"
          onClick={onOpenArmory}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141419] hover:bg-[#1a1a22] text-slate-200 border border-[#2a2a34] hover:border-[#00F0FF]/50 text-xs font-bold transition-all cursor-pointer shadow-xs"
          title="Weapons & Shields Arsenal"
        >
          <Shield className="w-3.5 h-3.5 text-[#00F0FF]" />
          <span className="hidden sm:inline">Armory</span>
        </button>

        <button
          id="btn-nav-stats"
          onClick={onOpenStats}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141419] hover:bg-[#1a1a22] text-slate-200 border border-[#2a2a34] hover:border-[#FFD700]/50 text-xs font-bold transition-all cursor-pointer relative shadow-xs"
          title="Fighter Stats & Skill Tree"
        >
          <User className="w-3.5 h-3.5 text-[#FFD700]" />
          <span className="hidden sm:inline">Stats</span>
          {profile.skillPoints > 0 && (
            <span className="w-2 h-2 rounded-full bg-[#FF0055] absolute -top-0.5 -right-0.5 ring-2 ring-[#0A0A0B] animate-ping" />
          )}
        </button>

        <button
          id="btn-nav-online"
          onClick={onOpenLobby}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 text-[#00F0FF] border border-[#00F0FF]/40 text-xs font-black tracking-wide transition-all cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.15)]"
          title="Play Online with Friends"
        >
          <Swords className="w-3.5 h-3.5 text-[#00F0FF]" />
          <span>Online Duel</span>
        </button>

        {/* Audio Toggles */}
        <div className="flex items-center border-l border-[#26262f] pl-2 ml-1 gap-1">
          <button
            id="btn-toggle-sound"
            onClick={toggleSound}
            className={`p-1.5 rounded-xl border text-xs transition-colors cursor-pointer ${
              soundOn
                ? 'bg-[#141419] border-[#00F0FF]/40 text-[#00F0FF] hover:bg-[#1a1a22] shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                : 'bg-[#101014] border-[#222228] text-slate-500 hover:text-slate-400'
            }`}
            title={soundOn ? 'Mute SFX' : 'Enable SFX'}
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            id="btn-toggle-music"
            onClick={toggleMusic}
            className={`p-1.5 rounded-xl border text-xs transition-colors cursor-pointer ${
              musicOn
                ? 'bg-[#141419] border-[#FF0055]/40 text-[#FF0055] hover:bg-[#1a1a22] shadow-[0_0_8px_rgba(255,0,85,0.2)]'
                : 'bg-[#101014] border-[#222228] text-slate-500 hover:text-slate-400'
            }`}
            title={musicOn ? 'Stop Synth BGM' : 'Start Synth BGM'}
          >
            <Music className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
