import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PlayerProfile, PlayerStats } from '../types';
import { WEAPONS, SHIELDS, HEADGEAR_LIST } from '../data/gear';
import { sound } from '../utils/audio';

interface LevelUpNotification {
  oldLevel: number;
  newLevel: number;
  unlockedItems: string[];
}

interface GameContextType {
  profile: PlayerProfile;
  levelUpAlert: LevelUpNotification | null;
  dismissLevelUpAlert: () => void;
  addMatchRewards: (xp: number, coins: number, isWin: boolean, kills: number, parries: number) => void;
  upgradeStat: (stat: keyof PlayerStats) => boolean;
  equipWeapon: (id: string) => void;
  equipShield: (id: string) => void;
  equipHeadgear: (id: string) => void;
  setStickColor: (color: string) => void;
  buyGear: (category: 'weapon' | 'shield' | 'headgear', id: string, cost: number) => boolean;
}

const STORAGE_KEY = 'stick_brawlers_profile_v1';

const DEFAULT_PROFILE: PlayerProfile = {
  name: 'Stick Champion',
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  coins: 150,
  skillPoints: 2,
  stats: {
    attack: 0,
    defense: 0,
    agility: 0,
    energy: 0,
  },
  unlockedWeapons: ['starter_blade'],
  unlockedShields: ['wood_buckler'],
  unlockedHeadgear: ['none'],
  equippedWeapon: 'starter_blade',
  equippedShield: 'wood_buckler',
  equippedHeadgear: 'none',
  stickColor: '#06b6d4',
  matchesPlayed: 0,
  wins: 0,
  kills: 0,
  parries: 0,
};

function getRequiredXp(level: number): number {
  return Math.round(100 * Math.pow(level, 1.35));
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<PlayerProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_PROFILE, ...parsed };
      }
    } catch (e) {
      console.error('Failed to load profile', e);
    }
    return DEFAULT_PROFILE;
  });

  const [levelUpAlert, setLevelUpAlert] = useState<LevelUpNotification | null>(null);

  // Save on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save profile', e);
    }
  }, [profile]);

  const dismissLevelUpAlert = () => setLevelUpAlert(null);

  const addMatchRewards = (
    xpGained: number,
    coinsGained: number,
    isWin: boolean,
    killsGained: number,
    parriesGained: number
  ) => {
    setProfile((prev) => {
      let currentXp = prev.xp + xpGained;
      let currentCoins = prev.coins + coinsGained;
      let currentLevel = prev.level;
      let reqXp = getRequiredXp(currentLevel);
      let newSkillPoints = prev.skillPoints;
      const newlyUnlocked: string[] = [];
      let leveledUp = false;

      while (currentXp >= reqXp) {
        currentXp -= reqXp;
        currentLevel++;
        reqXp = getRequiredXp(currentLevel);
        newSkillPoints += 2;
        leveledUp = true;

        // Check for newly level-unlocked weapons & shields
        WEAPONS.forEach((w) => {
          if (w.unlockLevel <= currentLevel && !prev.unlockedWeapons.includes(w.id)) {
            newlyUnlocked.push(w.name);
          }
        });
        SHIELDS.forEach((s) => {
          if (s.unlockLevel <= currentLevel && !prev.unlockedShields.includes(s.id)) {
            newlyUnlocked.push(s.name);
          }
        });
        HEADGEAR_LIST.forEach((h) => {
          if (h.unlockLevel <= currentLevel && !prev.unlockedHeadgear.includes(h.id)) {
            newlyUnlocked.push(h.name);
          }
        });
      }

      if (leveledUp) {
        sound.playLevelUp();
        setLevelUpAlert({
          oldLevel: prev.level,
          newLevel: currentLevel,
          unlockedItems: newlyUnlocked,
        });
      }

      // Auto-unlock level-gated weapons
      const updatedWeapons = Array.from(
        new Set([
          ...prev.unlockedWeapons,
          ...WEAPONS.filter((w) => w.unlockLevel <= currentLevel && w.cost === 0).map((w) => w.id),
        ])
      );
      const updatedShields = Array.from(
        new Set([
          ...prev.unlockedShields,
          ...SHIELDS.filter((s) => s.unlockLevel <= currentLevel && s.cost === 0).map((s) => s.id),
        ])
      );
      const updatedHeadgear = Array.from(
        new Set([
          ...prev.unlockedHeadgear,
          ...HEADGEAR_LIST.filter((h) => h.unlockLevel <= currentLevel && h.cost === 0).map((h) => h.id),
        ])
      );

      return {
        ...prev,
        level: currentLevel,
        xp: currentXp,
        xpToNextLevel: reqXp,
        coins: currentCoins,
        skillPoints: newSkillPoints,
        unlockedWeapons: updatedWeapons,
        unlockedShields: updatedShields,
        unlockedHeadgear: updatedHeadgear,
        matchesPlayed: prev.matchesPlayed + 1,
        wins: prev.wins + (isWin ? 1 : 0),
        kills: prev.kills + killsGained,
        parries: prev.parries + parriesGained,
      };
    });
  };

  const upgradeStat = (stat: keyof PlayerStats): boolean => {
    if (profile.skillPoints <= 0) return false;
    setProfile((prev) => ({
      ...prev,
      skillPoints: prev.skillPoints - 1,
      stats: {
        ...prev.stats,
        [stat]: prev.stats[stat] + 1,
      },
    }));
    sound.playParry();
    return true;
  };

  const equipWeapon = (id: string) => {
    if (profile.unlockedWeapons.includes(id)) {
      setProfile((prev) => ({ ...prev, equippedWeapon: id }));
      sound.playSlash('sword');
    }
  };

  const equipShield = (id: string) => {
    if (profile.unlockedShields.includes(id)) {
      setProfile((prev) => ({ ...prev, equippedShield: id }));
      sound.playShieldBlock('normal');
    }
  };

  const equipHeadgear = (id: string) => {
    if (profile.unlockedHeadgear.includes(id)) {
      setProfile((prev) => ({ ...prev, equippedHeadgear: id }));
    }
  };

  const setStickColor = (color: string) => {
    setProfile((prev) => ({ ...prev, stickColor: color }));
  };

  const buyGear = (category: 'weapon' | 'shield' | 'headgear', id: string, cost: number): boolean => {
    if (profile.coins < cost) return false;

    setProfile((prev) => {
      const nextCoins = prev.coins - cost;
      if (category === 'weapon') {
        return {
          ...prev,
          coins: nextCoins,
          unlockedWeapons: [...prev.unlockedWeapons, id],
          equippedWeapon: id,
        };
      } else if (category === 'shield') {
        return {
          ...prev,
          coins: nextCoins,
          unlockedShields: [...prev.unlockedShields, id],
          equippedShield: id,
        };
      } else {
        return {
          ...prev,
          coins: nextCoins,
          unlockedHeadgear: [...prev.unlockedHeadgear, id],
          equippedHeadgear: id,
        };
      }
    });

    sound.playLevelUp();
    return true;
  };

  return (
    <GameContext.Provider
      value={{
        profile,
        levelUpAlert,
        dismissLevelUpAlert,
        addMatchRewards,
        upgradeStat,
        equipWeapon,
        equipShield,
        equipHeadgear,
        setStickColor,
        buyGear,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
};
