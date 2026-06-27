import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { randomUUID } from 'crypto';
import cors from 'cors';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const rooms = new Map();

// ─── REST API ────────────────────────────────────────

app.post('/api/rooms/create', (req, res) => {
  const roomId = randomUUID().slice(0, 8).toUpperCase();
  const hostId = randomUUID().slice(0, 8).toUpperCase();
  rooms.set(roomId, {
    id: roomId,
    createdAt: Date.now(),
    hostId,
    clientId: null,
    players: new Map([[hostId, { id: hostId, ws: null }]]),
  });
  console.log(`[ROOM] Created: ${roomId} (host: ${hostId})`);
  res.json({ roomId, hostId });
});

app.post('/api/rooms/:id/join', (req, res) => {
  const room = rooms.get(req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const playerId = randomUUID().slice(0, 8).toUpperCase();

  if (!room.hostId) {
    room.hostId = playerId;
  } else if (!room.clientId) {
    room.clientId = playerId;
  } else {
    return res.status(400).json({ error: 'Room full' });
  }

  room.players.set(playerId, { id: playerId, ws: null });
  console.log(`[ROOM] ${playerId} joined ${req.params.id}`);
  res.json({ playerId, roomId: req.params.id });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', rooms: rooms.size, uptime: process.uptime() });
});

// ─── WebSocket Signaling ─────────────────────────────

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const roomId = url.searchParams.get('roomId');
  const playerId = url.searchParams.get('playerId');

  if (!roomId || !playerId) {
    ws.close(1008, 'Missing roomId or playerId');
    return;
  }

  const room = rooms.get(roomId);
  if (!room) {
    ws.close(1008, 'Room not found');
    return;
  }

  const player = room.players.get(playerId);
  if (!player) {
    ws.close(1008, 'Player not registered');
    return;
  }

  player.ws = ws;
  console.log(`[WS] ${playerId} connected to ${roomId}`);

  // Notify other player
  room.players.forEach((p, id) => {
    if (id !== playerId && p.ws?.readyState === 1) {
      p.ws.send(JSON.stringify({ type: 'peer_connected', playerId }));
    }
  });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      console.log(`[SIGNAL] ${playerId} -> ${roomId}: ${msg.type}`);

      // Forward message to the other player
      room.players.forEach((p, id) => {
        if (id !== playerId && p.ws?.readyState === 1) {
          p.ws.send(JSON.stringify({ ...msg, from: playerId }));
        }
      });
    } catch (err) {
      console.error('[WS] Parse error:', err);
    }
  });

  ws.on('close', () => {
    console.log(`[WS] ${playerId} disconnected from ${roomId}`);
    player.ws = null;

    // Notify other player
    room.players.forEach((p, id) => {
      if (id !== playerId && p.ws?.readyState === 1) {
        p.ws.send(JSON.stringify({ type: 'peer_disconnected', playerId }));
      }
    });

    // Cleanup empty rooms after 5 min
    setTimeout(() => {
      const r = rooms.get(roomId);
      if (r) {
        const hasActive = [...r.players.values()].some((p) => p.ws !== null);
        if (!hasActive) {
          rooms.delete(roomId);
          console.log(`[ROOM] Deleted: ${roomId}`);
        }
      }
    }, 300000);
  });
});

// ─── Start ───────────────────────────────────────────

server.listen(PORT, () => {
  console.log(`[SERVER] Listening on port ${PORT}`);
  console.log(`[SERVER] REST: http://localhost:${PORT}/api`);
  console.log(`[SERVER] WS:   ws://localhost:${PORT}/ws`);
});
