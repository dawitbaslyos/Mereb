/**
 * Mereb Cloudflare Edge Signaling & Studio Platform Worker
 * 100% REAL live WebRTC signaling, game catalog & active connection telemetry.
 * NO MOCK DATA. Real CCU, real active rooms, and real edge logs.
 */

const CLOUDFLARE_ICE_SERVERS = [
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
];

// Default starter game in catalog (Only 1 real game)
const INITIAL_GAMES = [
  {
    id: 'tank-arena',
    name: 'Mereb Arena (3D Tanks)',
    genre: 'Top-Down Shooter',
    maxPlayers: 2,
    createdAt: '2026-10-18',
    status: 'active'
  }
];

export class GameRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.connections = new Map(); // connId -> WebSocket
    this.hostId = null;
    this.queue = [];
    this.appId = 'tank-arena';
    this.roomId = 'default';
    this.createdAt = Date.now();

    // Registry fields (used when this instance is 'system:studio_catalog')
    this.activeRooms = new Map(); // `${appId}:${roomId}` -> { appId, roomId, players: Set<string>, hostId: string, createdAt: number }
    this.recentLogs = []; // Array<{ time: string, message: string, type: string }>
    this.logsLoaded = false;
  }

  async fetch(request) {
    const url = new URL(request.url);

    // Studio Catalog REST API handler
    if (url.pathname.startsWith('/api/games') || url.pathname.startsWith('/api/catalog')) {
      return this.handleCatalogAPI(request, url);
    }

    // Internal telemetry notification from active GameRooms
    if (url.pathname === '/api/telemetry/room-event') {
      return this.handleRoomEvent(request);
    }

    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 });
    }

    const connId = url.searchParams.get('_pk') || Math.random().toString(36).slice(2, 10);
    const isMatchmaker = url.searchParams.get('is_matchmaker') === '1';
    this.appId = url.searchParams.get('appId') || 'tank-arena';
    this.roomId = url.searchParams.get('roomId') || 'default';

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    this.handleSession(server, connId, isMatchmaker);

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }

  async _notifyCatalog(eventData) {
    if (!this.env.GAME_ROOM) return;
    try {
      const catalogDo = this.env.GAME_ROOM.get(this.env.GAME_ROOM.idFromName('system:studio_catalog'));
      await catalogDo.fetch('https://internal/api/telemetry/room-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });
    } catch {}
  }

  async handleRoomEvent(request) {
    const data = await request.json();
    const key = `${data.appId}:${data.roomId}`;
    const timeStr = new Date().toLocaleTimeString();

    if (data.event === 'player-connected') {
      let room = this.activeRooms.get(key);
      if (!room) {
        room = {
          appId: data.appId,
          roomId: data.roomId,
          players: new Set(),
          hostId: data.playerId,
          createdAt: Date.now()
        };
        this.activeRooms.set(key, room);
        this._addLog(`Room "${data.roomId}" created for [${data.appId}]`, 'create');
      }
      room.players.add(data.playerId);
      this._addLog(`Player "${data.playerId}" joined room "${data.roomId}" (${room.players.size} active)`, 'join');
    } else if (data.event === 'player-disconnected') {
      const room = this.activeRooms.get(key);
      if (room) {
        room.players.delete(data.playerId);
        this._addLog(`Player "${data.playerId}" left room "${data.roomId}"`, 'leave');
        if (room.players.size === 0) {
          this.activeRooms.delete(key);
          this._addLog(`Room "${data.roomId}" closed`, 'close');
        }
      }
    } else if (data.event === 'room-closed') {
      this.activeRooms.delete(key);
      this._addLog(`Room "${data.roomId}" terminated`, 'close');
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async _ensureLogsLoaded() {
    if (!this.logsLoaded) {
      try {
        const stored = await this.state.storage.get('recent_logs');
        if (Array.isArray(stored)) {
          this.recentLogs = stored;
        }
      } catch {}
      this.logsLoaded = true;
    }
  }

  async _addLog(message, type) {
    await this._ensureLogsLoaded();
    const time = new Date().toLocaleTimeString();
    this.recentLogs.push({ time, message, type });
    if (this.recentLogs.length > 50) this.recentLogs.shift();
    try {
      await this.state.storage.put('recent_logs', this.recentLogs);
    } catch {}
  }

  async handleCatalogAPI(request, url) {
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Mereb-App-Id'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    let games = await this.state.storage.get('catalog_games');
    if (!games) {
      games = [...INITIAL_GAMES];
      await this.state.storage.put('catalog_games', games);
    }
    await this._ensureLogsLoaded();

    // GET /api/games: List all games + REAL LIVE CCU & ACTIVE ROOMS
    if (request.method === 'GET') {
      const parts = url.pathname.split('/').filter(Boolean);
      
      // Calculate 100% REAL live metrics across active rooms
      const activeRoomsList = [];
      for (const room of this.activeRooms.values()) {
        activeRoomsList.push({
          appId: room.appId,
          roomId: room.roomId,
          playerCount: room.players.size,
          players: Array.from(room.players),
          hostId: room.hostId,
          createdAt: room.createdAt
        });
      }

      const gamesWithLiveStats = games.map(g => {
        const gameRooms = activeRoomsList.filter(r => r.appId === g.id);
        const gameCCU = gameRooms.reduce((sum, r) => sum + r.playerCount, 0);
        return {
          id: g.id,
          name: g.name,
          genre: g.genre,
          maxPlayers: g.maxPlayers,
          createdAt: g.createdAt,
          status: g.status || 'active',
          activeCCU: gameCCU,
          activeRooms: gameRooms.length
        };
      });

      // Specific game API detail
      if (parts.length >= 3 && parts[1] === 'games') {
        const targetId = parts[2];
        const game = gamesWithLiveStats.find(g => g.id === targetId);
        if (!game) {
          return new Response(JSON.stringify({ error: 'Game not found' }), { status: 404, headers });
        }
        const roomsForGame = activeRoomsList.filter(r => r.appId === targetId);
        return new Response(JSON.stringify({
          game,
          activeRooms: roomsForGame,
          logs: this.recentLogs.slice(-20)
        }, null, 2), { headers });
      }

      const totalLiveCCU = gamesWithLiveStats.reduce((sum, g) => sum + g.activeCCU, 0);

      return new Response(JSON.stringify({
        status: 'ok',
        games: gamesWithLiveStats,
        activeRooms: activeRoomsList,
        recentLogs: this.recentLogs.slice(-25),
        metrics: {
          totalGames: games.length,
          totalCCU: totalLiveCCU,
          totalActiveRooms: activeRoomsList.length
        }
      }, null, 2), { headers });
    }

    // POST /api/games: Create a real game API
    if (request.method === 'POST') {
      try {
        const body = await request.json();
        const name = (body.name || 'New Game').trim();
        const genre = body.genre || 'Action';
        const maxPlayers = parseInt(body.maxPlayers, 10) || 2;
        const id = (body.id || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) || `game-${Date.now().toString(36)}`;

        const existing = games.find(g => g.id === id);
        if (existing) {
          return new Response(JSON.stringify({ error: 'A game API with this App ID already exists' }), { status: 409, headers });
        }

        const origin = url.origin;
        const newGame = {
          id,
          name,
          genre,
          maxPlayers,
          createdAt: new Date().toISOString().split('T')[0],
          status: 'active',
          apiLink: `${origin}/api/games/${id}`
        };

        games.push(newGame);
        await this.state.storage.put('catalog_games', games);
        this._addLog(`Created new Game API "${id}" (${name})`, 'create');

        return new Response(JSON.stringify({
          status: 'created',
          game: {
            ...newGame,
            activeCCU: 0,
            activeRooms: 0
          }
        }, null, 2), { status: 201, headers });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 400, headers });
      }
    }

    // DELETE /api/games/:appId: Remove game API
    if (request.method === 'DELETE') {
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length >= 3 && parts[1] === 'games') {
        const targetId = parts[2];
        games = games.filter(g => g.id !== targetId);
        await this.state.storage.put('catalog_games', games);
        this._addLog(`Deleted Game API "${targetId}"`, 'close');
        return new Response(JSON.stringify({ status: 'deleted', id: targetId }), { headers });
      }
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
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
    }

    // REAL TELEMETRY: notify catalog of connection
    this._notifyCatalog({
      event: 'player-connected',
      appId: this.appId,
      roomId: this.roomId,
      playerId: ws.id,
      timestamp: Date.now()
    });

    if (this.connections.size === 2 && this.hostId) {
      ws.send(JSON.stringify({
        type: 'room-joined',
        players: [this.hostId, ws.id],
        hostId: this.hostId
      }));

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

      // REAL TELEMETRY: notify catalog of disconnect
      this._notifyCatalog({
        event: 'player-disconnected',
        appId: this.appId,
        roomId: this.roomId,
        playerId: ws.id,
        timestamp: Date.now()
      });

      for (const peerWs of this.connections.values()) {
        try {
          peerWs.send(JSON.stringify({ type: 'player-left', playerId: ws.id }));
        } catch {}
      }

      if (ws.id === this.hostId) {
        for (const peerWs of this.connections.values()) {
          try { peerWs.close(); } catch {}
        }
        this.connections.clear();
        this.hostId = null;

        this._notifyCatalog({
          event: 'room-closed',
          appId: this.appId,
          roomId: this.roomId,
          timestamp: Date.now()
        });
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

    // Global CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Upgrade, Authorization, X-Mereb-App-Id'
        }
      });
    }

    // Health check & Server Info
    if (url.pathname === '/' || url.pathname === '/health') {
      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response(JSON.stringify({
          status: 'ok',
          service: 'Mereb Cloudflare Edge Signaling & Studio Platform',
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

    // STUN / ICE Server discovery
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

    // GitHub OAuth Config
    if (url.pathname === '/api/auth/github/config') {
      return new Response(JSON.stringify({
        clientId: env.GITHUB_CLIENT_ID || null,
        configured: !!(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET)
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // GitHub OAuth Token Exchange
    if (url.pathname === '/api/auth/github/exchange' && request.method === 'POST') {
      const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      };

      try {
        const { code, redirect_uri } = await request.json();
        if (!code) {
          return new Response(JSON.stringify({ error: 'Authorization code is required' }), { status: 400, headers });
        }

        const clientId = env.GITHUB_CLIENT_ID;
        const clientSecret = env.GITHUB_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
          return new Response(JSON.stringify({
            error: 'GitHub OAuth credentials not set. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET on Cloudflare Worker.'
          }), { status: 501, headers });
        }

        const tokenPayload = {
          client_id: clientId,
          client_secret: clientSecret,
          code
        };
        if (redirect_uri) tokenPayload.redirect_uri = redirect_uri;

        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Mereb-Cloud-Auth'
          },
          body: JSON.stringify(tokenPayload)
        });

        const tokenData = await tokenRes.json();
        if (tokenData.error) {
          return new Response(JSON.stringify({ error: tokenData.error_description || tokenData.error }), { status: 400, headers });
        }

        const userRes = await fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Accept': 'application/json',
            'User-Agent': 'Mereb-Cloud-Auth'
          }
        });

        const ghUser = await userRes.json();
        if (!ghUser || !ghUser.login) {
          return new Response(JSON.stringify({ error: 'Failed to retrieve profile from GitHub' }), { status: 400, headers });
        }

        const user = {
          id: `gh_${ghUser.id}`,
          username: ghUser.login,
          name: ghUser.name || ghUser.login,
          avatar: ghUser.avatar_url,
          email: ghUser.email || `${ghUser.login}@users.noreply.github.com`,
          bio: ghUser.bio || '',
          plan: 'free',
          maxProjects: 1
        };

        return new Response(JSON.stringify({ status: 'ok', user }), { headers });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
      }
    }

    // Direct Live GitHub Profile Lookup
    if (url.pathname === '/api/auth/github/profile') {
      const username = url.searchParams.get('username');
      if (!username) {
        return new Response(JSON.stringify({ error: 'Username parameter required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      try {
        const ghRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username.trim())}`, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mereb-Cloud-Auth'
          }
        });

        if (!ghRes.ok) {
          return new Response(JSON.stringify({ error: `GitHub user "${username}" not found` }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        const ghUser = await ghRes.json();
        const user = {
          id: `gh_${ghUser.id}`,
          username: ghUser.login,
          name: ghUser.name || ghUser.login,
          avatar: ghUser.avatar_url,
          email: `${ghUser.login}@users.noreply.github.com`,
          bio: ghUser.bio || '',
          plan: 'free',
          maxProjects: 1
        };

        return new Response(JSON.stringify({ status: 'ok', user }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // Route Studio Catalog API to singleton catalog Durable Object
    if (url.pathname.startsWith('/api/games') || url.pathname.startsWith('/api/catalog')) {
      const catalogDoId = env.GAME_ROOM.idFromName('system:studio_catalog');
      const catalogStub = env.GAME_ROOM.get(catalogDoId);
      return catalogStub.fetch(new Request(url.toString(), request));
    }

    // Route room connections
    const parts = url.pathname.split('/').filter(Boolean);
    let appId = url.searchParams.get('appId') || request.headers.get('X-Mereb-App-Id') || 'tank-arena';
    let roomId = 'default';

    if (parts.length >= 4 && parts[0] === 'games' && parts[2] === 'room') {
      appId = parts[1];
      roomId = parts[3];
    } else if (parts.length >= 3 && parts[0] === 'parties') {
      roomId = parts[2];
    } else if (parts.length >= 2 && (parts[0] === 'party' || parts[0] === 'room')) {
      roomId = parts[1];
    } else if (parts.length === 2) {
      appId = parts[0];
      roomId = parts[1];
    } else if (parts.length === 1) {
      roomId = parts[0];
    }

    const isMatchmaker = roomId === 'matchmaker';
    url.searchParams.set('is_matchmaker', isMatchmaker ? '1' : '0');
    url.searchParams.set('appId', appId);
    url.searchParams.set('roomId', roomId);

    if (!env.GAME_ROOM) {
      return new Response(JSON.stringify({
        error: 'GAME_ROOM Durable Object binding not configured in wrangler.toml'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const doPartitionKey = `${appId}:${roomId}`;
    const doId = env.GAME_ROOM.idFromName(doPartitionKey);
    const roomStub = env.GAME_ROOM.get(doId);

    return roomStub.fetch(new Request(url.toString(), request));
  }
};
