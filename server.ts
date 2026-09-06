import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

interface PlayerSession {
  id: string;
  ws: WebSocket;
  name: string;
  level: number;
  weaponId: string;
  shieldId: string;
  color: string;
  headgear: string;
  slot: number;
  ready: boolean;
}

interface GameRoom {
  code: string;
  arena: string;
  createdAt: number;
  players: Map<string, PlayerSession>;
  status: 'waiting' | 'fighting' | 'ended';
  scores: Record<string, number>;
}

const rooms = new Map<string, GameRoom>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function broadcastToRoom(room: GameRoom, data: any, excludeId?: string) {
  const msg = JSON.stringify(data);
  room.players.forEach((player) => {
    if (player.id !== excludeId && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(msg);
    }
  });
}

function cleanEmptyRooms() {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    if (room.players.size === 0 && now - room.createdAt > 30000) {
      rooms.delete(code);
    }
  }
}
setInterval(cleanEmptyRooms, 60000);

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = http.createServer(app);

  app.use(express.json());

  // API endpoints
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', activeRooms: rooms.size });
  });

  app.get('/api/rooms', (req, res) => {
    const list = Array.from(rooms.values()).map((r) => ({
      code: r.code,
      playerCount: r.players.size,
      status: r.status,
      arena: r.arena,
    }));
    res.json({ rooms: list });
  });

  // WebSocket Server
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    let currentRoomCode: string | null = null;
    let playerId = 'p_' + Math.random().toString(36).substring(2, 9);

    ws.on('message', (raw: string) => {
      try {
        const msg = JSON.parse(raw.toString());

        switch (msg.type) {
          case 'create_room': {
            let code = generateRoomCode();
            while (rooms.has(code)) {
              code = generateRoomCode();
            }
            const room: GameRoom = {
              code,
              arena: msg.arena || 'cyber_rooftop',
              createdAt: Date.now(),
              players: new Map(),
              status: 'waiting',
              scores: {},
            };
            const player: PlayerSession = {
              id: playerId,
              ws,
              name: msg.name || 'Stick Master',
              level: msg.level || 1,
              weaponId: msg.weaponId || 'katana',
              shieldId: msg.shieldId || 'buckler',
              color: msg.color || '#06b6d4',
              headgear: msg.headgear || 'headband',
              slot: 1,
              ready: true,
            };
            room.players.set(playerId, player);
            room.scores[playerId] = 0;
            rooms.set(code, room);
            currentRoomCode = code;

            ws.send(
              JSON.stringify({
                type: 'room_created',
                code,
                slot: 1,
                playerId,
                arena: room.arena,
                players: [
                  {
                    id: player.id,
                    name: player.name,
                    level: player.level,
                    weaponId: player.weaponId,
                    shieldId: player.shieldId,
                    color: player.color,
                    headgear: player.headgear,
                    slot: 1,
                    ready: true,
                  },
                ],
              })
            );
            break;
          }

          case 'join_room': {
            const targetCode = (msg.code || '').trim().toUpperCase();
            const room = rooms.get(targetCode);
            if (!room) {
              ws.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Room not found! Check the 4-letter code.',
                })
              );
              return;
            }
            if (room.players.size >= 2) {
              ws.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Room is already full (max 2 players for 1v1 duel).',
                })
              );
              return;
            }

            const existingSlots = Array.from(room.players.values()).map((p) => p.slot);
            const slot = existingSlots.includes(1) ? 2 : 1;

            const player: PlayerSession = {
              id: playerId,
              ws,
              name: msg.name || 'Challenger',
              level: msg.level || 1,
              weaponId: msg.weaponId || 'katana',
              shieldId: msg.shieldId || 'buckler',
              color: msg.color || '#f43f5e',
              headgear: msg.headgear || 'horns',
              slot,
              ready: true,
            };

            room.players.set(playerId, player);
            room.scores[playerId] = 0;
            currentRoomCode = targetCode;

            const allPlayers = Array.from(room.players.values()).map((p) => ({
              id: p.id,
              name: p.name,
              level: p.level,
              weaponId: p.weaponId,
              shieldId: p.shieldId,
              color: p.color,
              headgear: p.headgear,
              slot: p.slot,
              ready: p.ready,
            }));

            // Tell joiner
            ws.send(
              JSON.stringify({
                type: 'room_joined',
                code: targetCode,
                slot,
                playerId,
                arena: room.arena,
                players: allPlayers,
              })
            );

            // Notify other player
            broadcastToRoom(
              room,
              {
                type: 'player_joined',
                player: {
                  id: player.id,
                  name: player.name,
                  level: player.level,
                  weaponId: player.weaponId,
                  shieldId: player.shieldId,
                  color: player.color,
                  headgear: player.headgear,
                  slot,
                },
                players: allPlayers,
              },
              playerId
            );

            // If 2 players, auto-start countdown
            if (room.players.size === 2) {
              room.status = 'fighting';
              broadcastToRoom(room, {
                type: 'match_start',
                countdown: 3,
                arena: room.arena,
              });
            }
            break;
          }

          case 'player_sync': {
            if (!currentRoomCode) return;
            const room = rooms.get(currentRoomCode);
            if (!room) return;
            // Broadcast state to opponent
            broadcastToRoom(
              room,
              {
                type: 'opponent_sync',
                playerId,
                state: msg.state,
              },
              playerId
            );
            break;
          }

          case 'combat_event': {
            if (!currentRoomCode) return;
            const room = rooms.get(currentRoomCode);
            if (!room) return;
            broadcastToRoom(
              room,
              {
                type: 'combat_event',
                playerId,
                event: msg.event,
              },
              playerId
            );
            break;
          }

          case 'round_finish': {
            if (!currentRoomCode) return;
            const room = rooms.get(currentRoomCode);
            if (!room) return;
            room.status = 'ended';
            if (msg.winnerId && room.scores[msg.winnerId] !== undefined) {
              room.scores[msg.winnerId]++;
            }
            broadcastToRoom(room, {
              type: 'round_finished',
              winnerId: msg.winnerId,
              scores: room.scores,
            });
            break;
          }

          case 'rematch_request': {
            if (!currentRoomCode) return;
            const room = rooms.get(currentRoomCode);
            if (!room) return;
            room.status = 'fighting';
            broadcastToRoom(room, {
              type: 'match_start',
              countdown: 3,
              arena: msg.arena || room.arena,
            });
            break;
          }

          case 'emote': {
            if (!currentRoomCode) return;
            const room = rooms.get(currentRoomCode);
            if (!room) return;
            broadcastToRoom(
              room,
              {
                type: 'player_emote',
                playerId,
                emote: msg.emote,
              },
              playerId
            );
            break;
          }

          case 'ping': {
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
          }
        }
      } catch (err) {
        console.error('WS parse error', err);
      }
    });

    ws.on('close', () => {
      if (currentRoomCode) {
        const room = rooms.get(currentRoomCode);
        if (room) {
          room.players.delete(playerId);
          broadcastToRoom(room, {
            type: 'player_left',
            playerId,
          });
          if (room.players.size === 0) {
            rooms.delete(currentRoomCode);
          }
        }
      }
    });
  });

  // Vite middleware for dev / static for prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
