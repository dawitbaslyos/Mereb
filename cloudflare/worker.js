/**
 * Mereb Cloudflare Edge Signaling Worker
 * Zero-cost, globally distributed WebRTC signaling & matchmaking worker on Cloudflare.
 * Supports Cloudflare Durable Objects for edge state isolation and sub-20ms handshakes.
 */

// Cloudflare STUN Servers (Anycast across 300+ edge datacenters)
const CLOUDFLARE_ICE_SERVERS = [
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
];

/**
 * GameRoom Durable Object
 * Isolates room state and pairs WebRTC players directly at the nearest Cloudflare PoP.
 */
export class GameRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.connections = new Map(); // connId -> WebSocket
    this.hostId = null;
    this.queue = []; // Array<{ id: string, ws: WebSocket }>
  }

  async fetch(request) {
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 });
    }

    const url = new URL(request.url);
    const connId = url.searchParams.get('_pk') || Math.random().toString(36).slice(2, 10);
    const isMatchmaker = url.searchParams.get('is_matchmaker') === '1';

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    this.handleSession(server, connId, isMatchmaker);

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }

  handleSession(ws, connId, isMatchmaker) {
    ws.accept();
    ws.id = connId;

    if (isMatchmaker) {
      this._handleMatchmaker(ws);
    } else {
      this._handleGameRoom(ws);
    }
  }

  _handleMatchmaker(ws) {
    ws.addEventListener('message', (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }

      if (data.type === 'quick-play') {
        if (!this.queue.find(p => p.id === ws.id)) {
          this.queue.push({ id: ws.id, ws });
        }

        if (this.queue.length >= 2) {
          const p1 = this.queue.shift();
          const p2 = this.queue.shift();
          const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
          let code = '';
          for (let i = 0; i < 4; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
          }

          p1.ws.send(JSON.stringify({ type: 'match-found', roomCode: code, opponentId: p2.id }));
          p2.ws.send(JSON.stringify({ type: 'match-found', roomCode: code, opponentId: p1.id }));
        } else {
          ws.send(JSON.stringify({ type: 'match-queued' }));
        }
      }
    });

    const cleanupQueue = () => {
      const idx = this.queue.findIndex(p => p.id === ws.id);
      if (idx !== -1) {
        this.queue.splice(idx, 1);
      }
    };

    ws.addEventListener('close', cleanupQueue);
    ws.addEventListener('error', cleanupQueue);
  }

  _handleGameRoom(ws) {
    if (this.connections.size >= 2) {
      ws.send(JSON.stringify({ type: 'error', message: 'Room full' }));
      ws.close(1008, 'Room full');
      return;
    }

    this.connections.set(ws.id, ws);

    if (this.connections.size === 1) {
      this.hostId = ws.id;
    } else if (this.connections.size === 2 && this.hostId) {
      // Send joiner room details
      ws.send(JSON.stringify({
        type: 'room-joined',
        players: [this.hostId, ws.id],
        hostId: this.hostId
      }));

      // Notify host to initiate WebRTC offer
      const hostWs = this.connections.get(this.hostId);
      if (hostWs) {
        hostWs.send(JSON.stringify({ type: 'player-joined', playerId: ws.id }));
        hostWs.send(JSON.stringify({ type: 'start-signal', peerId: ws.id }));
      }
    }

    ws.addEventListener('message', (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }

      if (data.type === 'signal' && data.to) {
        const target = this.connections.get(data.to);
        if (target) {
          target.send(JSON.stringify({
            type: 'signal',
            from: ws.id,
            signal: data.signal
          }));
        }
      }
    });

    const handleDisconnect = () => {
      this.connections.delete(ws.id);

      // Notify remaining peer
      for (const peerWs of this.connections.values()) {
        try {
          peerWs.send(JSON.stringify({ type: 'player-left', playerId: ws.id }));
        } catch {}
      }

      // If host left, shut down room
      if (ws.id === this.hostId) {
        for (const peerWs of this.connections.values()) {
          try { peerWs.close(); } catch {}
        }
        this.connections.clear();
        this.hostId = null;
      }
    };

    ws.addEventListener('close', handleDisconnect);
    ws.addEventListener('error', handleDisconnect);
  }
}

/**
 * Main Worker Router
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Upgrade'
        }
      });
    }

    // Health check & Server Info
    if (url.pathname === '/' || url.pathname === '/health') {
      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response(JSON.stringify({
          status: 'ok',
          service: 'Mereb Cloudflare Edge Signaling',
          edgePoP: request.cf?.colo || 'UNKNOWN',
          country: request.cf?.country || 'GLOBAL',
          iceServers: CLOUDFLARE_ICE_SERVERS
        }, null, 2), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }

    // STUN / ICE Server discovery endpoint
    if (url.pathname === '/api/ice') {
      return new Response(JSON.stringify({
        iceServers: CLOUDFLARE_ICE_SERVERS
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Extract room ID from URL path:
    // e.g. /parties/:party/:room, /party/:room, /room/:room, or /:room
    const parts = url.pathname.split('/').filter(Boolean);
    let roomId = 'default';
    if (parts.length >= 3 && parts[0] === 'parties') {
      roomId = parts[2];
    } else if (parts.length >= 2 && (parts[0] === 'party' || parts[0] === 'room')) {
      roomId = parts[1];
    } else if (parts.length >= 1) {
      roomId = parts[parts.length - 1];
    }

    const isMatchmaker = roomId === 'matchmaker';
    url.searchParams.set('is_matchmaker', isMatchmaker ? '1' : '0');

    // Route request to the appropriate GameRoom Durable Object
    if (!env.GAME_ROOM) {
      return new Response(JSON.stringify({
        error: 'GAME_ROOM Durable Object binding not configured in wrangler.toml'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const doId = env.GAME_ROOM.idFromName(roomId);
    const roomStub = env.GAME_ROOM.get(doId);

    return roomStub.fetch(new Request(url.toString(), request));
  }
};
