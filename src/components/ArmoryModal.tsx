import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { WEAPONS, SHIELDS, HEADGEAR_LIST, STICK_COLORS } from '../data/gear';
import { Weapon, Shield, Headgear } from '../types';
import { Swords, Shield as ShieldIcon, Sparkles, Lock, Check, Zap, X, Coins } from 'lucide-react';

interface ArmoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArmoryModal: React.FC<ArmoryModalProps> = ({ isOpen, onClose }) => {
  const {
    profile,
    equipWeapon,
    equipShield,
    equipHeadgear,
    setStickColor,
    buyGear,
  } = useGame();

  const [activeTab, setActiveTab] = useState<'weapons' | 'shields' | 'custom'>('weapons');
  const [selectedWeaponId, setSelectedWeaponId] = useState<string>(profile.equippedWeapon);
  const [selectedShieldId, setSelectedShieldId] = useState<string>(profile.equippedShield);

  if (!isOpen) return null;

  const currentWeapon = WEAPONS.find((w) => w.id === selectedWeaponId) || WEAPONS[0];
  const currentShield = SHIELDS.find((s) => s.id === selectedShieldId) || SHIELDS[0];

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'mythic':
        return 'bg-[#FFD700]/20 text-[#FFD700] border-[#FFD700]/60 shadow-[0_0_10px_rgba(255,215,0,0.25)]';
      case 'legendary':
        return 'bg-[#FF0055]/20 text-[#FF0055] border-[#FF0055]/60 shadow-[0_0_10px_rgba(255,0,85,0.25)]';
      case 'epic':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/50';
      case 'rare':
        return 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/50';
      default:
        return 'bg-[#1C1C24] text-slate-300 border-[#2C2C3A]';
    }
  };

  return (
    <div
      id="armory-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
    >
      <div
        id="armory-modal-card"
        className="w-full max-w-5xl h-[90vh] max-h-[720px] bg-[#0E0E13] border border-[#252530] rounded-3xl flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#22222B] flex items-center justify-between bg-[#13131A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00F0FF]/15 border border-[#00F0FF]/40 flex items-center justify-center text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.2)]">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-100 uppercase tracking-wider font-display">Fighter Armory</h2>
              <p className="text-xs text-slate-400">Equip unique weapons and shields to alter your combat build</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#181822] border border-[#2C2C3B] text-[#FFD700] font-black text-xs shadow-xs">
              <Coins className="w-4 h-4 text-[#FFD700]" />
              <span>{profile.coins} Coins</span>
            </div>
            <button
              id="btn-close-armory"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-[#1A1A24] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2.5 border-b border-[#20202A] bg-[#101016]">
          <button
            id="tab-armory-weapons"
            onClick={() => setActiveTab('weapons')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'weapons'
                ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#181820]'
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>Weapons ({WEAPONS.length})</span>
          </button>

          <button
            id="tab-armory-shields"
            onClick={() => setActiveTab('shields')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'shields'
                ? 'bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/40 shadow-[0_0_15px_rgba(255,215,0,0.15)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#181820]'
            }`}
          >
            <ShieldIcon className="w-4 h-4" />
            <span>Shields ({SHIELDS.length})</span>
          </button>

          <button
            id="tab-armory-custom"
            onClick={() => setActiveTab('custom')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'custom'
                ? 'bg-[#FF0055]/15 text-[#FF0055] border border-[#FF0055]/40 shadow-[0_0_15px_rgba(255,0,85,0.15)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#181820]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Headgear & Colors</span>
          </button>
        </div>

        {/* Content Body: Split View (List on left, Details on right) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* Item Grid List */}
          <div className="md:col-span-7 p-4 overflow-y-auto space-y-2.5 border-r border-[#20202A]">
            {activeTab === 'weapons' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {WEAPONS.map((weapon) => {
                  const isUnlocked = profile.unlockedWeapons.includes(weapon.id);
                  const isEquipped = profile.equippedWeapon === weapon.id;
                  const isSelected = selectedWeaponId === weapon.id;
                  const levelOk = profile.level >= weapon.unlockLevel;

                  return (
                    <div
                      key={weapon.id}
                      onClick={() => setSelectedWeaponId(weapon.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#00F0FF] bg-[#00F0FF]/10 shadow-[0_0_20px_rgba(0,240,255,0.12)]'
                          : 'border-[#22222C] bg-[#121217] hover:border-[#333342] hover:bg-[#16161E]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${getRarityBadge(
                              weapon.rarity
                            )}`}
                          >
                            {weapon.rarity}
                          </span>
                          {isEquipped && (
                            <span className="text-[10px] font-black text-[#00F0FF] bg-[#00F0FF]/10 border border-[#00F0FF]/30 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> EQUIPPED
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-slate-100 flex items-center gap-1.5 font-display">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: weapon.visual.bladeColor }}
                          />
                          {weapon.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{weapon.description}</p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-[#22222D] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-slate-300 font-bold">
                          <span>DMG: {weapon.damage}</span>
                          <span className="text-slate-500">•</span>
                          <span>SPD: {weapon.attackSpeed}x</span>
                        </div>
                        <div>
                          {!isUnlocked ? (
                            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                              <Lock className="w-3 h-3 text-slate-500" />
                              {levelOk ? `${weapon.cost} C` : `LVL ${weapon.unlockLevel}`}
                            </span>
                          ) : (
                            <span className="text-[10px] font-black text-[#00F0FF]">READY</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'shields' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SHIELDS.map((shield) => {
                  const isUnlocked = profile.unlockedShields.includes(shield.id);
                  const isEquipped = profile.equippedShield === shield.id;
                  const isSelected = selectedShieldId === shield.id;
                  const levelOk = profile.level >= shield.unlockLevel;

                  return (
                    <div
                      key={shield.id}
                      onClick={() => setSelectedShieldId(shield.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#FFD700] bg-[#FFD700]/10 shadow-[0_0_20px_rgba(255,215,0,0.12)]'
                          : 'border-[#22222C] bg-[#121217] hover:border-[#333342] hover:bg-[#16161E]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${getRarityBadge(
                              shield.rarity
                            )}`}
                          >
                            {shield.rarity}
                          </span>
                          {isEquipped && (
                            <span className="text-[10px] font-black text-[#FFD700] bg-[#FFD700]/10 border border-[#FFD700]/30 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> EQUIPPED
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-slate-100 flex items-center gap-1.5 font-display">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: shield.visual.shieldColor }}
                          />
                          {shield.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{shield.description}</p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-[#22222D] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-slate-300 font-bold">
                          <span>BLOCK: {Math.round(shield.blockAbsorption * 100)}%</span>
                        </div>
                        <div>
                          {!isUnlocked ? (
                            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                              <Lock className="w-3 h-3 text-slate-500" />
                              {levelOk ? `${shield.cost} C` : `LVL ${shield.unlockLevel}`}
                            </span>
                          ) : (
                            <span className="text-[10px] font-black text-[#FFD700]">READY</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'custom' && (
              <div className="space-y-6">
                {/* Stick Figure Colors */}
                <div>
                  <h4 className="text-xs font-black text-[#FFD700] uppercase tracking-wider mb-2 font-display">Stickman Skin Color</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {STICK_COLORS.map((col) => {
                      const isSelected = profile.stickColor === col.color;
                      return (
                        <button
                          key={col.id}
                          onClick={() => setStickColor(col.color)}
                          className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#00F0FF] bg-[#00F0FF]/15 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                              : 'border-[#22222C] bg-[#121217] hover:border-[#333342]'
                          }`}
                        >
                          <span className="w-5 h-5 rounded-full ring-1 ring-white/30" style={{ backgroundColor: col.color }} />
                          <span className="text-xs font-bold text-slate-200">{col.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Headgear List */}
                <div>
                  <h4 className="text-xs font-black text-[#FF0055] uppercase tracking-wider mb-2 font-display">Headgear & Helmets</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {HEADGEAR_LIST.map((h) => {
                      const isUnlocked = profile.unlockedHeadgear.includes(h.id);
                      const isEquipped = profile.equippedHeadgear === h.id;
                      const levelOk = profile.level >= h.unlockLevel;

                      return (
                        <div
                          key={h.id}
                          onClick={() => {
                            if (isUnlocked) equipHeadgear(h.id);
                            else if (levelOk && h.cost <= profile.coins) {
                              buyGear('headgear', h.id, h.cost);
                            }
                          }}
                          className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-all cursor-pointer ${
                            isEquipped
                              ? 'border-[#FF0055] bg-[#FF0055]/15 shadow-[0_0_15px_rgba(255,0,85,0.2)]'
                              : 'border-[#22222C] bg-[#121217] hover:border-[#333342]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-slate-400">LVL {h.unlockLevel}</span>
                              {isEquipped && <Check className="w-3.5 h-3.5 text-[#FF0055]" />}
                            </div>
                            <h5 className="font-bold text-xs text-slate-100 font-display">{h.name}</h5>
                          </div>
                          <div className="mt-3 pt-2 border-t border-[#22222D] text-xs">
                            {isUnlocked ? (
                              <span className="text-[10px] font-black text-[#FF0055]">
                                {isEquipped ? 'EQUIPPED' : 'CLICK TO EQUIP'}
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-[#FFD700] flex items-center gap-1">
                                <Lock className="w-3 h-3 text-slate-500" />
                                {levelOk ? `${h.cost} Coins` : `Unlocks at LVL ${h.unlockLevel}`}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Item Details & Equip Panel */}
          <div className="md:col-span-5 p-5 bg-[#111116] flex flex-col justify-between overflow-y-auto">
            {activeTab === 'weapons' && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${getRarityBadge(
                        currentWeapon.rarity
                      )}`}
                    >
                      {currentWeapon.rarity}
                    </span>
                    <span className="text-xs font-bold text-slate-400">{currentWeapon.category}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-100 font-display">{currentWeapon.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{currentWeapon.description}</p>
                </div>

                {/* Stats Breakdown */}
                <div className="space-y-2 bg-[#0E0E13] p-4 rounded-2xl border border-[#22222C] text-xs">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Base Damage</span>
                    <span className="font-black text-[#00F0FF] text-sm">{currentWeapon.damage}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Attack Speed</span>
                    <span className="font-bold text-slate-100">{currentWeapon.attackSpeed}x</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Range / Reach</span>
                    <span className="font-bold text-slate-100">
                      {currentWeapon.isRanged ? 'Ranged Projectile' : `${currentWeapon.range}px`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Critical Hit Rate</span>
                    <span className="font-black text-[#FFD700]">{Math.round(currentWeapon.critChance * 100)}%</span>
                  </div>
                </div>

                {/* Weapon Special Skill */}
                <div className="p-4 rounded-2xl bg-[#FF0055]/10 border border-[#FF0055]/30 text-xs space-y-1.5 shadow-[0_0_15px_rgba(255,0,85,0.1)]">
                  <div className="flex items-center justify-between text-[#FF0055] font-black">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-[#FF0055]" />
                      SPECIAL: {currentWeapon.specialSkill.name}
                    </span>
                    <span>CD: {currentWeapon.specialSkill.cooldown}s</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-normal">
                    {currentWeapon.specialSkill.description}
                  </p>
                  <div className="text-[10px] text-[#00F0FF] font-bold">
                    Energy Cost: {currentWeapon.specialSkill.energyCost} / 100
                  </div>
                </div>

                {/* Equip or Buy Actions */}
                <div className="pt-3">
                  {profile.unlockedWeapons.includes(currentWeapon.id) ? (
                    <button
                      id="btn-equip-weapon"
                      onClick={() => equipWeapon(currentWeapon.id)}
                      disabled={profile.equippedWeapon === currentWeapon.id}
                      className={`w-full py-3 rounded-2xl font-black text-xs tracking-wider uppercase transition-all cursor-pointer ${
                        profile.equippedWeapon === currentWeapon.id
                          ? 'bg-[#181820] text-slate-500 border border-[#2A2A35]'
                          : 'bg-[#00F0FF] hover:bg-[#33F4FF] text-[#0A0A0B] shadow-[0_0_20px_rgba(0,240,255,0.3)]'
                      }`}
                    >
                      {profile.equippedWeapon === currentWeapon.id ? 'Equipped' : 'Equip Weapon'}
                    </button>
                  ) : profile.level < currentWeapon.unlockLevel ? (
                    <div className="w-full py-3 rounded-2xl bg-[#14141A] border border-[#242430] text-slate-500 font-bold text-xs text-center">
                      Requires Fighter Level {currentWeapon.unlockLevel}
                    </div>
                  ) : (
                    <button
                      id="btn-buy-weapon"
                      onClick={() => buyGear('weapon', currentWeapon.id, currentWeapon.cost)}
                      disabled={profile.coins < currentWeapon.cost}
                      className={`w-full py-3 rounded-2xl font-black text-xs tracking-wider uppercase transition-all cursor-pointer ${
                        profile.coins >= currentWeapon.cost
                          ? 'bg-gradient-to-r from-[#FFD700] to-[#FFAA00] hover:brightness-110 text-[#0A0A0B] shadow-[0_0_20px_rgba(255,215,0,0.3)]'
                          : 'bg-[#181820] text-slate-500 border border-[#2A2A35]'
                      }`}
                    >
                      Unlock for {currentWeapon.cost} Coins
                    </button>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'shields' && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${getRarityBadge(
                        currentShield.rarity
                      )}`}
                    >
                      {currentShield.rarity}
                    </span>
                    <span className="text-xs font-bold text-slate-400">Protective Bulwark</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-100 font-display">{currentShield.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{currentShield.description}</p>
                </div>

                {/* Stats Breakdown */}
                <div className="space-y-2 bg-[#0E0E13] p-4 rounded-2xl border border-[#22222C] text-xs">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Block Absorption</span>
                    <span className="font-black text-[#FFD700] text-sm">
                      {Math.round(currentShield.blockAbsorption * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Parry Counter Window</span>
                    <span className="font-black text-[#00F0FF]">{currentShield.parryWindowMs} ms</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Shield Shape</span>
                    <span className="font-bold text-slate-100 capitalize">{currentShield.visual.shape}</span>
                  </div>
                </div>

                {/* Shield Perk */}
                <div className="p-4 rounded-2xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-xs space-y-1.5 shadow-[0_0_15px_rgba(0,240,255,0.1)]">
                  <div className="flex items-center justify-between text-[#00F0FF] font-black">
                    <span className="flex items-center gap-1.5">
                      <ShieldIcon className="w-3.5 h-3.5 text-[#00F0FF]" />
                      PERK: {currentShield.perk.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-normal">{currentShield.perk.description}</p>
                </div>

                {/* Equip or Buy Actions */}
                <div className="pt-3">
                  {profile.unlockedShields.includes(currentShield.id) ? (
                    <button
                      id="btn-equip-shield"
                      onClick={() => equipShield(currentShield.id)}
                      disabled={profile.equippedShield === currentShield.id}
                      className={`w-full py-3 rounded-2xl font-black text-xs tracking-wider uppercase transition-all cursor-pointer ${
                        profile.equippedShield === currentShield.id
                          ? 'bg-[#181820] text-slate-500 border border-[#2A2A35]'
                          : 'bg-[#FFD700] hover:bg-[#FFE240] text-[#0A0A0B] shadow-[0_0_20px_rgba(255,215,0,0.3)]'
                      }`}
                    >
                      {profile.equippedShield === currentShield.id ? 'Equipped' : 'Equip Shield'}
                    </button>
                  ) : profile.level < currentShield.unlockLevel ? (
                    <div className="w-full py-3 rounded-2xl bg-[#14141A] border border-[#242430] text-slate-500 font-bold text-xs text-center">
                      Requires Fighter Level {currentShield.unlockLevel}
                    </div>
                  ) : (
                    <button
                      id="btn-buy-shield"
                      onClick={() => buyGear('shield', currentShield.id, currentShield.cost)}
                      disabled={profile.coins < currentShield.cost}
                      className={`w-full py-3 rounded-2xl font-black text-xs tracking-wider uppercase transition-all cursor-pointer ${
                        profile.coins >= currentShield.cost
                          ? 'bg-gradient-to-r from-[#FFD700] to-[#FFAA00] hover:brightness-110 text-[#0A0A0B] shadow-[0_0_20px_rgba(255,215,0,0.3)]'
                          : 'bg-[#181820] text-slate-500 border border-[#2A2A35]'
                      }`}
                    >
                      Unlock for {currentShield.cost} Coins
                    </button>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'custom' && (
              <div className="space-y-4 text-center">
                <div className="w-24 h-24 rounded-full bg-[#0E0E13] border-2 border-[#00F0FF]/50 mx-auto flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                  <div
                    className="w-12 h-12 rounded-full border-2 border-white/60 shadow-lg"
                    style={{ backgroundColor: profile.stickColor }}
                  />
                </div>
                <div>
                  <h4 className="font-black text-slate-100 text-base font-display">Fighter Identity</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Customizing headgear and colors makes you instantly recognizable in online duels and 2-player battles!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
