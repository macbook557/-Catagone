import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { ARENAS } from '../data/gear';
import { Arena } from '../types';
import { Swords, Users, Copy, Check, RefreshCw, X, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

interface OnlinePlayer {
  id: string;
  name: string;
  level: number;
  weaponId: string;
  shieldId: string;
  color: string;
  headgear: string;
  slot: number;
  ready: boolean;
}

interface OnlineLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartOnlineMatch: (ws: WebSocket, roomCode: string, slot: number, opponent: OnlinePlayer, arenaId: string) => void;
}

export const OnlineLobbyModal: React.FC<OnlineLobbyModalProps> = ({
  isOpen,
  onClose,
  onStartOnlineMatch,
}) => {
  const { profile } = useGame();
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [selectedArena, setSelectedArena] = useState<string>('cyber_rooftop');
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [wsInstance, setWsInstance] = useState<WebSocket | null>(null);
  const [connectedPlayers, setConnectedPlayers] = useState<OnlinePlayer[]>([]);
  const [mySlot, setMySlot] = useState<number>(1);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen && wsInstance) {
      wsInstance.close();
      setWsInstance(null);
      setCreatedRoomCode(null);
      setConnectedPlayers([]);
      setErrorMsg(null);
      setIsConnecting(false);
    }
  }, [isOpen, wsInstance]);

  if (!isOpen) return null;

  const connectWebSocket = (): WebSocket => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    setWsInstance(ws);
    return ws;
  };

  const handleCreateRoom = () => {
    setErrorMsg(null);
    setIsConnecting(true);

    const ws = connectWebSocket();

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'create_room',
          arena: selectedArena,
          name: profile.name,
          level: profile.level,
          weaponId: profile.equippedWeapon,
          shieldId: profile.equippedShield,
          color: profile.stickColor,
          headgear: profile.equippedHeadgear,
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'room_created') {
          setCreatedRoomCode(data.code);
          setMySlot(data.slot);
          setConnectedPlayers(data.players);
          setIsConnecting(false);
        } else if (data.type === 'player_joined') {
          setConnectedPlayers(data.players);
        } else if (data.type === 'match_start') {
          // Launch game!
          const opponent = connectedPlayers.find((p) => p.slot !== mySlot) || data.player;
          onStartOnlineMatch(ws, createdRoomCode || data.code, mySlot, opponent, data.arena || selectedArena);
        } else if (data.type === 'error') {
          setErrorMsg(data.message);
          setIsConnecting(false);
        }
      } catch (err) {
        console.error(err);
      }
    };

    ws.onerror = () => {
      setErrorMsg('Failed to connect to multiplayer server.');
      setIsConnecting(false);
    };
  };

  const handleJoinRoom = () => {
    const code = roomCodeInput.trim().toUpperCase();
    if (!code || code.length < 4) {
      setErrorMsg('Please enter a valid 4-character room code.');
      return;
    }

    setErrorMsg(null);
    setIsConnecting(true);

    const ws = connectWebSocket();

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'join_room',
          code,
          name: profile.name,
          level: profile.level,
          weaponId: profile.equippedWeapon,
          shieldId: profile.equippedShield,
          color: profile.stickColor,
          headgear: profile.equippedHeadgear,
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'room_joined') {
          setMySlot(data.slot);
          setConnectedPlayers(data.players);
          setIsConnecting(false);
        } else if (data.type === 'match_start') {
          const opponent = connectedPlayers.find((p) => p.slot !== data.slot) || data.players?.find((p: any) => p.slot !== data.slot);
          onStartOnlineMatch(ws, code, data.slot || 2, opponent, data.arena);
        } else if (data.type === 'error') {
          setErrorMsg(data.message);
          setIsConnecting(false);
        }
      } catch (err) {
        console.error(err);
      }
    };

    ws.onerror = () => {
      setErrorMsg('Unable to reach multiplayer server.');
      setIsConnecting(false);
    };
  };

  const copyCode = () => {
    if (createdRoomCode) {
      navigator.clipboard.writeText(createdRoomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      id="online-lobby-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
    >
      <div
        id="online-lobby-card"
        className="w-full max-w-lg bg-[#0E0E13] border border-[#252530] rounded-3xl flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#22222B] flex items-center justify-between bg-[#13131A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00F0FF]/15 border border-[#00F0FF]/40 flex items-center justify-center text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.2)]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-100 uppercase tracking-wider font-display">Multiplayer Duel Room</h2>
              <p className="text-xs text-slate-400">Play in real-time with a friend anywhere using a room code</p>
            </div>
          </div>
          <button
            id="btn-close-lobby"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-[#1A1A24] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        {!createdRoomCode && (
          <div className="flex p-2 gap-2 bg-[#101016] border-b border-[#20202A]">
            <button
              id="tab-lobby-create"
              onClick={() => {
                setActiveTab('create');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider font-display transition-all cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_12px_rgba(0,240,255,0.15)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#181820]'
              }`}
            >
              Host Match (Create Room)
            </button>
            <button
              id="tab-lobby-join"
              onClick={() => {
                setActiveTab('join');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider font-display transition-all cursor-pointer ${
                activeTab === 'join'
                  ? 'bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/40 shadow-[0_0_12px_rgba(255,215,0,0.15)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#181820]'
              }`}
            >
              Join Friend (Enter Code)
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-[#FF0055]/15 border border-[#FF0055]/40 flex items-center gap-2.5 text-[#FF0055] text-xs font-bold">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#FF0055]" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 space-y-5">
          {/* WAITING ROOM VIEW */}
          {createdRoomCode ? (
            <div className="space-y-5 text-center">
              <div className="p-5 rounded-2xl bg-[#121218] border border-[#22222C] space-y-3 shadow-[0_0_20px_rgba(0,240,255,0.08)]">
                <span className="text-xs font-black text-[#FFD700] uppercase tracking-widest font-display">Share Room Code</span>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-4xl font-black text-[#00F0FF] tracking-wider font-mono drop-shadow-[0_0_12px_rgba(0,240,255,0.4)]">
                    {createdRoomCode}
                  </span>
                  <button
                    id="btn-copy-room-code"
                    onClick={copyCode}
                    className="p-2.5 rounded-xl bg-[#1A1A24] hover:bg-[#252535] text-slate-200 border border-[#303042] transition-all cursor-pointer shadow-sm"
                    title="Copy Code"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-400">Tell your friend to open the game and click "Join Friend"</p>
              </div>

              {/* Connected Players Status */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider text-left font-display">Fighters in Room</h4>
                <div className="grid grid-cols-2 gap-3">
                  {/* Host */}
                  <div className="p-3.5 rounded-2xl bg-[#121218] border border-[#00F0FF]/30 text-left">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shadow-sm ring-1 ring-white/30" style={{ backgroundColor: profile.stickColor }} />
                      <span className="font-bold text-xs text-slate-200 truncate">{profile.name} (You)</span>
                    </div>
                    <span className="text-[11px] text-[#00F0FF] font-bold block mt-1">Player 1 • Ready</span>
                  </div>

                  {/* Opponent */}
                  <div className="p-3.5 rounded-2xl bg-[#121218] border border-[#22222C] text-left flex flex-col justify-center">
                    {connectedPlayers.length >= 2 ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full shadow-sm ring-1 ring-white/30"
                            style={{
                              backgroundColor: connectedPlayers.find((p) => p.slot !== mySlot)?.color || '#f43f5e',
                            }}
                          />
                          <span className="font-bold text-xs text-slate-200 truncate">
                            {connectedPlayers.find((p) => p.slot !== mySlot)?.name || 'Challenger'}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#FFD700] font-bold block mt-1">Starting Duel...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00F0FF]" />
                        <span>Waiting for friend...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'create' ? (
            /* CREATE ROOM VIEW */
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-[#FFD700] uppercase tracking-wider block mb-2 font-display">
                  Select Duel Arena
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {ARENAS.map((arena) => (
                    <button
                      key={arena.id}
                      onClick={() => setSelectedArena(arena.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        selectedArena === arena.id
                          ? 'border-[#FFD700] bg-[#FFD700]/15 shadow-[0_0_15px_rgba(255,215,0,0.15)]'
                          : 'border-[#22222C] bg-[#121218] hover:border-[#333342]'
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-200 truncate font-display">{arena.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 capitalize">{arena.theme}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#121218] border border-[#22222C] text-xs text-slate-400 space-y-1">
                <div className="font-bold text-slate-200">Equipped Gear Active:</div>
                <div>Your custom weapon, shield, level stats, and skin color will be used in the match!</div>
              </div>

              <button
                id="btn-host-room-submit"
                onClick={handleCreateRoom}
                disabled={isConnecting}
                className="w-full py-3.5 rounded-2xl bg-[#00F0FF] hover:bg-[#33F4FF] text-[#0A0A0B] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all cursor-pointer disabled:opacity-50 font-display"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Creating Room...</span>
                  </>
                ) : (
                  <>
                    <Swords className="w-4 h-4" />
                    <span>Create Room & Generate Code</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* JOIN ROOM VIEW */
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-[#FFD700] uppercase tracking-wider block mb-2 font-display">
                  Enter 4-Character Room Code
                </label>
                <input
                  id="input-room-code"
                  type="text"
                  maxLength={4}
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. DUEL"
                  className="w-full bg-[#121218] border-2 border-[#2C2C3C] rounded-2xl px-4 py-3 text-center text-2xl font-mono font-black text-[#00F0FF] tracking-widest uppercase focus:outline-none focus:border-[#00F0FF] focus:shadow-[0_0_15px_rgba(0,240,255,0.2)] transition-colors"
                />
              </div>

              <button
                id="btn-join-room-submit"
                onClick={handleJoinRoom}
                disabled={isConnecting || roomCodeInput.length < 4}
                className="w-full py-3.5 rounded-2xl bg-[#FFD700] hover:bg-[#FFE240] text-[#0A0A0B] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,215,0,0.3)] transition-all cursor-pointer disabled:opacity-50 font-display"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Joining Match...</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    <span>Join Duel</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
