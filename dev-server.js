import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

const PORT = 1999;
const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', server: 'Mereb Local Signaling Server' }));
});

const wss = new WebSocketServer({ server });

// Map of roomId -> { hostId: string | null, connections: Map<string, WebSocket> }
const rooms = new Map();
// Queue of connections waiting in matchmaker: Array<{ id: string, ws: WebSocket }>
const matchQueue = [];

function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      hostId: null,
      connections: new Map()
    });
  }
  return rooms.get(roomId);
}

function parseUrl(urlStr) {
  const parsed = new URL(urlStr, 'http://localhost:1999');
  // Match path pattern: /parties/:party/:room or /party/:room
  const parts = parsed.pathname.split('/').filter(Boolean);
  let roomId = 'default';
  if (parts.length >= 3 && parts[0] === 'parties') {
    roomId = parts[2];
  } else if (parts.length >= 2 && parts[0] === 'party') {
    roomId = parts[1];
  } else if (parts.length >= 1) {
    roomId = parts[parts.length - 1];
  }
  const pk = parsed.searchParams.get('_pk') || Math.random().toString(36).slice(2, 10);
  return { roomId, connId: pk };
}

wss.on('connection', (ws, req) => {
  const { roomId, connId } = parseUrl(req.url);
  ws.id = connId;
  ws.roomId = roomId;

  console.log(`[WS] Connected: ${connId} -> Room: ${roomId}`);

  if (roomId === 'matchmaker') {
    // Matchmaker mode: wait for quick-play message
    ws.on('message', (raw) => {
      let data;
      try { data = JSON.parse(raw); } catch { return; }

      if (data.type === 'quick-play') {
        if (!matchQueue.find(p => p.id === ws.id)) {
          matchQueue.push({ id: ws.id, ws });
          console.log(`[Matchmaker] Player queued: ${ws.id} (Queue size: ${matchQueue.length})`);
        }

        if (matchQueue.length >= 2) {
          const p1 = matchQueue.shift();
          const p2 = matchQueue.shift();
          const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
          let code = '';
          for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];

          console.log(`[Matchmaker] Match made: ${p1.id} vs ${p2.id} in Room ${code}`);
          p1.ws.send(JSON.stringify({ type: 'match-found', roomCode: code, opponentId: p2.id }));
          p2.ws.send(JSON.stringify({ type: 'match-found', roomCode: code, opponentId: p1.id }));
        } else {
          ws.send(JSON.stringify({ type: 'match-queued' }));
        }
      }
    });

    ws.on('close', () => {
      const idx = matchQueue.findIndex(p => p.id === ws.id);
      if (idx !== -1) {
        matchQueue.splice(idx, 1);
        console.log(`[Matchmaker] Player left queue: ${ws.id}`);
      }
    });

  } else {
    // Game Room mode
    const room = getOrCreateRoom(roomId);

    if (room.connections.size >= 2) {
      ws.send(JSON.stringify({ type: 'error', message: 'Room full' }));
      ws.close();
      return;
    }

    room.connections.set(ws.id, ws);

    if (room.connections.size === 1) {
      room.hostId = ws.id;
      console.log(`[Room ${roomId}] Host assigned: ${ws.id}`);
    } else if (room.connections.size === 2 && room.hostId) {
      console.log(`[Room ${roomId}] Peer joined: ${ws.id}`);
      // Send joiner info
      ws.send(JSON.stringify({
        type: 'room-joined',
        players: [room.hostId, ws.id],
        hostId: room.hostId
      }));

      // Notify host
      const hostWs = room.connections.get(room.hostId);
      if (hostWs && hostWs.readyState === WebSocket.OPEN) {
        hostWs.send(JSON.stringify({ type: 'player-joined', playerId: ws.id }));
        hostWs.send(JSON.stringify({ type: 'start-signal', peerId: ws.id }));
      }
    }

    ws.on('message', (raw) => {
      let data;
      try { data = JSON.parse(raw); } catch { return; }

      if (data.type === 'signal' && data.to) {
        const target = room.connections.get(data.to);
        if (target && target.readyState === WebSocket.OPEN) {
          target.send(JSON.stringify({
            type: 'signal',
            from: ws.id,
            signal: data.signal
          }));
        }
      }
    });

    ws.on('close', () => {
      console.log(`[Room ${roomId}] Disconnected: ${ws.id}`);
      room.connections.delete(ws.id);

      // Notify remaining peer
      for (const [id, peerWs] of room.connections.entries()) {
        if (peerWs.readyState === WebSocket.OPEN) {
          peerWs.send(JSON.stringify({ type: 'player-left', playerId: ws.id }));
        }
      }

      // If host disconnected, clean up room
      if (ws.id === room.hostId) {
        for (const [id, peerWs] of room.connections.entries()) {
          peerWs.close();
        }
        rooms.delete(roomId);
        console.log(`[Room ${roomId}] Host left, room destroyed`);
      } else if (room.connections.size === 0) {
        rooms.delete(roomId);
      }
    });
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Mereb Local Signaling Server listening on ws://localhost:${PORT}`);
});
