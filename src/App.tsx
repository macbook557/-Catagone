import React, { useState } from 'react';
import { GameProvider } from './context/GameContext';
import { Navbar } from './components/Navbar';
import { LobbyMenu } from './components/LobbyMenu';
import { ArenaCanvas } from './components/ArenaCanvas';
import { ArmoryModal } from './components/ArmoryModal';
import { StatsModal } from './components/StatsModal';
import { OnlineLobbyModal } from './components/OnlineLobbyModal';
import { LevelUpModal } from './components/LevelUpModal';
import { GameMode } from './types';

function MainGame() {
  const [inGame, setInGame] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>('local_2p');
  const [selectedArenaId, setSelectedArenaId] = useState<string>('cyber_rooftop');
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard' | 'boss'>('medium');

  // Online match parameters
  const [onlineWs, setOnlineWs] = useState<WebSocket | null>(null);
  const [onlineSlot, setOnlineSlot] = useState<number>(1);
  const [onlineOpponent, setOnlineOpponent] = useState<any>(null);

  // Modals state
  const [isArmoryOpen, setIsArmoryOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isOnlineLobbyOpen, setIsOnlineLobbyOpen] = useState(false);

  const handleStartGame = (
    mode: GameMode,
    arenaId: string,
    difficulty: 'easy' | 'medium' | 'hard' | 'boss' = 'medium'
  ) => {
    setGameMode(mode);
    setSelectedArenaId(arenaId);
    setAiDifficulty(difficulty);
    setOnlineWs(null);
    setInGame(true);
  };

  const handleStartOnlineMatch = (
    ws: WebSocket,
    roomCode: string,
    slot: number,
    opponent: any,
    arenaId: string
  ) => {
    setGameMode('online_room');
    setSelectedArenaId(arenaId);
    setOnlineWs(ws);
    setOnlineSlot(slot);
    setOnlineOpponent(opponent);
    setIsOnlineLobbyOpen(false);
    setInGame(true);
  };

  const handleExitGame = () => {
    if (onlineWs) {
      onlineWs.close();
      setOnlineWs(null);
    }
    setInGame(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-100 flex flex-col selection:bg-[#FFD700] selection:text-[#0A0A0B] relative overflow-x-hidden">
      {/* Subtle Artistic Ambient Lighting */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-[#FFD700]/5 rounded-full blur-[128px] pointer-events-none" />
      <div className="fixed top-1/3 -right-40 w-96 h-96 bg-[#00F0FF]/5 rounded-full blur-[128px] pointer-events-none" />
      <div className="fixed -bottom-40 left-1/3 w-96 h-96 bg-[#FF0055]/5 rounded-full blur-[128px] pointer-events-none" />

      {/* Top Navigation */}
      <Navbar
        onOpenArmory={() => setIsArmoryOpen(true)}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenLobby={() => setIsOnlineLobbyOpen(true)}
        onReturnToLobby={handleExitGame}
        inGame={inGame}
      />

      {/* Main View Area */}
      <main className="flex-1 p-4 sm:p-6 flex flex-col items-center justify-center">
        {inGame ? (
          <ArenaCanvas
            mode={gameMode}
            arenaId={selectedArenaId}
            aiDifficulty={aiDifficulty}
            onlineWs={onlineWs}
            onlineSlot={onlineSlot}
            onlineOpponent={onlineOpponent}
            onExit={handleExitGame}
          />
        ) : (
          <LobbyMenu
            onStartGame={handleStartGame}
            onOpenArmory={() => setIsArmoryOpen(true)}
            onOpenStats={() => setIsStatsOpen(true)}
            onOpenOnlineLobby={() => setIsOnlineLobbyOpen(true)}
          />
        )}
      </main>

      {/* Modals */}
      <ArmoryModal isOpen={isArmoryOpen} onClose={() => setIsArmoryOpen(false)} />
      <StatsModal isOpen={isStatsOpen} onClose={() => setIsStatsOpen(false)} />
      <OnlineLobbyModal
        isOpen={isOnlineLobbyOpen}
        onClose={() => setIsOnlineLobbyOpen(false)}
        onStartOnlineMatch={handleStartOnlineMatch}
      />
      <LevelUpModal
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenArmory={() => setIsArmoryOpen(true)}
      />
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <MainGame />
    </GameProvider>
  );
}
