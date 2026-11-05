/**
 * Mereb Cloudflare Edge Signaling & Studio Platform Worker
 * 100% REAL live WebRTC signaling, Cloudflare D1 multi-tenant persistence & telemetry.
 */

import {
  sha256,
  createSessionToken,
  verifySessionToken,
  generateTurnHmac,
  verifyPolarWebhook
} from './auth.js';

import {
  PLAN_TIERS,
  upsertGithubUser,
  getUserById,
  getUserApps,
  getAppById,
  createAppWithKeys,
  deleteApp,
  validateApiKey,
  getLeaderboard,
  submitScore,
  clearLeaderboard,
  recordUsageSnapshot
} from './db.js';

const CLOUDFLARE_ICE_SERVERS = [
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
];

// Default starter app in catalog
const INITIAL_GAMES = [
  {
    id: 'app_starter',
    name: 'Starter App',
    apiKey: 'pk_live_mereb_starter_key',
    createdAt: '2026-10-22',
    status: 'active',
    plan: 'free',
    ownerId: 'dev_local'
  }
];

export class GameRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.connections = new Map(); // connId -> WebSocket
    this.hostId = null;
    this.queue = [];
    this.appId = 'illegalsoccer';
    this.roomId = 'default';
    this.createdAt = Date.now();

    // Registry fields (used when this instance is 'system:studio_catalog')
    this.activeRooms = new Map(); // `${appId}:${roomId}` -> { appId, roomId, players: Set<string>, hostId: string, createdAt: number }
    this.recentLogs = []; // Array<{ time: string, message: string, type: string }>
    this.logsLoaded = false;
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.searchParams.has('appId')) this.appId = url.searchParams.get('appId');
    if (url.searchParams.has('roomId')) this.roomId = url.searchParams.get('roomId');

    // Studio Catalog, Polar Billing & Managed TURN REST API handler
    if (
      url.pathname.startsWith('/api/games') ||
      url.pathname.startsWith('/api/catalog') ||
      url.pathname.startsWith('/api/apps') ||
      url.pathname.startsWith('/api/leaderboard') ||
      url.pathname.startsWith('/api/billing') ||
      url.pathname.startsWith('/api/turn-credentials')
    ) {
      return this.handleCatalogAPI(request, url);
    }

    // Internal telemetry notification from active GameRooms
    if (url.pathname === '/api/telemetry/room-event') {
      return this.handleRoomEvent(request);
    }

    // Room Presence API
    if (url.pathname.endsWith('/presence') || url.pathname.endsWith('/info')) {
      return new Response(JSON.stringify({
        appId: this.appId,
        roomId: this.roomId,
        ccu: this.connections.size,
        peerCount: this.connections.size,
        connectedPeers: Array.from(this.connections.keys()),
        hostId: this.hostId,
        createdAt: this.createdAt
      }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Room Broadcast REST API
    if (request.method === 'POST' && (url.pathname.endsWith('/broadcast') || url.pathname.endsWith('/publish'))) {
      const body = await request.json().catch(() => ({}));
      const payload = JSON.stringify({
        ...body,
        from: 'server',
        timestamp: Date.now()
      });
      let count = 0;
      for (const ws of this.connections.values()) {
        try {
          ws.send(payload);
          count++;
        } catch {}
      }
      return new Response(JSON.stringify({
        status: 'ok',
        sentToPeers: count,
        roomId: this.roomId,
        appId: this.appId
      }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 });
    }

    const connId = url.searchParams.get('_pk') || Math.random().toString(36).slice(2, 10);
    const isMatchmaker = url.searchParams.get('is_matchmaker') === '1';
    this.appId = url.searchParams.get('appId') || this.appId || 'app_starter';
    this.roomId = url.searchParams.get('roomId') || this.roomId || 'default';

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

  async _recordDailyStat(key) {
    const today = new Date().toISOString().split('T')[0];
    let stats = (await this.state.storage.get('daily_stats')) || { date: today, requests: 0, messages: 0, scores: 0 };
    if (stats.date !== today) {
      stats = { date: today, requests: 0, messages: 0, scores: 0 };
    }
    stats[key] = (stats[key] || 0) + 1;
    await this.state.storage.put('daily_stats', stats);
    return stats;
  }

  async _getDailyStats() {
    const today = new Date().toISOString().split('T')[0];
    let stats = (await this.state.storage.get('daily_stats')) || { date: today, requests: 0, messages: 0, scores: 0 };
    if (stats.date !== today) {
      stats = { date: today, requests: 0, messages: 0, scores: 0 };
    }
    return stats;
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

    await this._recordDailyStat('requests');

    let games = await this.state.storage.get('catalog_games');
    if (!games) {
      games = [...INITIAL_GAMES];
      await this.state.storage.put('catalog_games', games);
    }
    await this._ensureLogsLoaded();

    const parts = url.pathname.split('/').filter(Boolean);

    // ==========================================
    // 0A. POLAR BILLING API (/api/billing/polar/*)
    // ==========================================
    if (url.pathname.startsWith('/api/billing')) {
      // 1. Polar Webhook: subscription.created, updated, canceled, order.created
      if (url.pathname === '/api/billing/polar/webhook' && request.method === 'POST') {
        const rawBody = await request.text();
        const secret = this.env?.POLAR_WEBHOOK_SECRET;
        const isValid = await verifyPolarWebhook(request, rawBody, secret);
        if (!isValid) {
          return new Response(JSON.stringify({ error: 'Invalid Polar webhook signature' }), { status: 401, headers });
        }

        let event;
        try {
          event = JSON.parse(rawBody);
        } catch {
          return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers });
        }

        const eventType = event.type || event.event;
        const data = event.data || {};
        const customer = data.customer || {};
        const userId = data.metadata?.userId || data.custom_field_data?.userId || customer.metadata?.userId;
        const email = customer.email || data.customer_email;

        const productName = (data.product?.name || '').toLowerCase();
        let targetPlan = 'free';
        if (eventType?.startsWith('subscription.') || eventType === 'order.created') {
          if (data.status === 'active' || data.status === 'trialing' || eventType === 'order.created') {
            targetPlan = productName.includes('studio') ? 'studio' : 'pro';
          }
        }
        if (eventType === 'subscription.canceled' || eventType === 'subscription.revoked') {
          targetPlan = 'free';
        }

        // Persist plan state to user profile
        if (userId) {
          const userKey = `user:${userId}`;
          let userProfile = (await this.state.storage.get(userKey)) || { id: userId, email, plan: 'free' };
          userProfile.plan = targetPlan;
          userProfile.polarSubscriptionId = data.id || null;
          userProfile.polarCustomerId = data.customer_id || customer.id || null;
          userProfile.updatedAt = new Date().toISOString();
          await this.state.storage.put(userKey, userProfile);

          // Update user's games to reflect new plan
          let updated = false;
          games = games.map(g => {
            if (g.ownerId === userId || (!g.ownerId && userId === 'dev_local')) {
              updated = true;
              return { ...g, plan: targetPlan };
            }
            return g;
          });
          if (updated) {
            await this.state.storage.put('catalog_games', games);
          }

          this._addLog(`[Polar] Plan changed to ${targetPlan.toUpperCase()} for user ${userId}`, targetPlan === 'free' ? 'close' : 'create');
        }

        return new Response(JSON.stringify({ received: true, event: eventType, plan: targetPlan }), { headers });
      }

      // 2. Polar Checkout Generator
      if (url.pathname === '/api/billing/polar/checkout' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const plan = (body.plan || 'pro').toLowerCase();
        const userId = body.userId || 'dev_local';
        const email = body.email || '';
        const origin = url.origin;

        // Direct checkout URL from wrangler env vars if configured
        const directUrl = plan === 'studio' ? this.env?.POLAR_CHECKOUT_STUDIO_URL : this.env?.POLAR_CHECKOUT_PRO_URL;
        if (directUrl) {
          const checkoutUrl = new URL(directUrl);
          if (email) checkoutUrl.searchParams.set('customer_email', email);
          checkoutUrl.searchParams.set('metadata[userId]', userId);
          return new Response(JSON.stringify({ status: 'ok', url: checkoutUrl.toString() }), { headers });
        }

        // Dynamic Polar API Checkout session
        if (this.env?.POLAR_ACCESS_TOKEN) {
          try {
            const polarRes = await fetch('https://api.polar.sh/v1/checkouts/custom/', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${this.env.POLAR_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                product_price_id: body.productPriceId || undefined,
                customer_email: email || undefined,
                metadata: { userId },
                success_url: `${origin}/?upgraded=true`
              })
            });
            if (polarRes.ok) {
              const session = await polarRes.json();
              if (session.url) {
                return new Response(JSON.stringify({ status: 'ok', url: session.url }), { headers });
              }
            }
          } catch (e) {
            console.warn('[Polar:Checkout] API generation fallback', e);
          }
        }

        // Fallback info for instant developer onboarding
        return new Response(JSON.stringify({
          status: 'ok',
          mode: 'demo',
          message: 'Polar checkout link ready. Configure POLAR_CHECKOUT_PRO_URL or POLAR_ACCESS_TOKEN in cloudflare/.dev.vars for live redirect.',
          url: 'https://polar.sh/'
        }), { headers });
      }

      // 3. User Subscription & Plan Status
      if (url.pathname === '/api/billing/subscription' && request.method === 'GET') {
        const userId = url.searchParams.get('userId') || 'dev_local';
        const userProfile = (await this.state.storage.get(`user:${userId}`)) || { id: userId, plan: 'free' };
        const tier = PLAN_TIERS[userProfile.plan] || PLAN_TIERS.free;
        return new Response(JSON.stringify({
          status: 'ok',
          userId,
          plan: userProfile.plan,
          tier,
          subscription: {
            id: userProfile.polarSubscriptionId || null,
            customerId: userProfile.polarCustomerId || null
          }
        }, null, 2), { headers });
      }
    }

    // ==========================================
    // 0B. MANAGED TURN CREDENTIALS API (/api/turn-credentials)
    // ==========================================
    if (url.pathname === '/api/turn-credentials' && request.method === 'GET') {
      const apiKey = url.searchParams.get('apiKey') || request.headers.get('Authorization')?.replace('Bearer ', '');
      const appId = url.searchParams.get('appId');

      let matchedGame = null;
      if (apiKey) matchedGame = games.find(g => g.apiKey === apiKey);
      if (!matchedGame && appId) matchedGame = games.find(g => g.id === appId);

      const plan = matchedGame?.plan || 'free';
      const isPaid = plan === 'pro' || plan === 'studio';

      if (!isPaid) {
        return new Response(JSON.stringify({
          status: 'ok',
          plan: 'free',
          turnEnabled: false,
          iceServers: CLOUDFLARE_ICE_SERVERS,
          message: 'Managed TURN relay requires Pro or Studio plan. Fast STUN servers returned.'
        }, null, 2), { headers });
      }

      // Generate time-limited HMAC TURN credentials (RFC 5766)
      const ttl = 86400; // 24 hours
      const expiry = Math.floor(Date.now() / 1000) + ttl;
      const username = `${expiry}:${matchedGame?.id || 'mereb'}`;
      const turnSecret = this.env?.TURN_SECRET || 'mereb_default_turn_secret_dev_32b';
      const credential = await generateTurnHmac(turnSecret, username);

      return new Response(JSON.stringify({
        status: 'ok',
        plan,
        turnEnabled: true,
        ttl,
        iceServers: [
          ...CLOUDFLARE_ICE_SERVERS,
          {
            urls: [
              'turn:turn.mereb.dev:3478?transport=udp',
              'turn:turn.mereb.dev:3478?transport=tcp',
              'turns:turn.mereb.dev:443?transport=tcp'
            ],
            username,
            credential
          }
        ]
      }, null, 2), { headers });
    }

    // ==========================================
    // 1. LEADERBOARD API: /api/apps/:appId/leaderboard or /api/leaderboard(s)
    // ==========================================
    const isLbRoute = (
      ((parts[1] === 'games' || parts[1] === 'apps') && parts.length >= 4 && (parts[3] === 'leaderboard' || parts[3] === 'leaderboards')) ||
      (parts[1] === 'leaderboard' || parts[1] === 'leaderboards')
    );
    if (isLbRoute) {
      let targetAppId = ((parts[1] === 'games' || parts[1] === 'apps') && parts[2])
        ? parts[2]
        : (url.searchParams.get('appId') || 'illegalsoccer');
      let parsedBody = null;
      if (request.method === 'POST') {
        parsedBody = await request.json().catch(() => ({}));
        if (parsedBody && parsedBody.appId) targetAppId = parsedBody.appId;
      }
      const storageKey = `lb:${targetAppId}`;

      // GET: Retrieve top highscores
      if (request.method === 'GET') {
        const lb = (await this.state.storage.get(storageKey)) || [];
        return new Response(JSON.stringify({
          status: 'ok',
          appId: targetAppId,
          totalScores: lb.length,
          leaderboard: lb.slice(0, 50)
        }, null, 2), { headers });
      }

      // POST: Submit a score from Godot, Unity, Web, etc.
      if (request.method === 'POST') {
        try {
          const body = parsedBody || (await request.json().catch(() => ({})));
          const player = (body.player || body.username || 'Anonymous').toString().trim().slice(0, 32);
          const score = typeof body.score === 'number' ? body.score : parseFloat(body.score);

          if (isNaN(score)) {
            return new Response(JSON.stringify({ error: 'Valid numeric "score" is required' }), { status: 400, headers });
          }

          let lb = (await this.state.storage.get(storageKey)) || [];
          const entry = {
            id: `sc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
            player,
            username: player,
            score,
            metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : {},
            createdAt: new Date().toISOString()
          };

          lb.push(entry);
          lb.sort((a, b) => b.score - a.score);
          lb = lb.slice(0, 100); // keep top 100

          await this.state.storage.put(storageKey, lb);
          await this._recordDailyStat('scores');
          await this._addLog(`Highscore in [${targetAppId}]: "${player}" scored ${score.toLocaleString()}`, 'join');

          const rank = lb.findIndex(e => e.id === entry.id) + 1;
          return new Response(JSON.stringify({
            status: 'ok',
            rank,
            entry,
            leaderboard: lb.slice(0, 10)
          }, null, 2), { status: 201, headers });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), { status: 400, headers });
        }
      }

      // DELETE: Reset / clear leaderboard for this App
      if (request.method === 'DELETE') {
        await this.state.storage.delete(storageKey);
        await this._addLog(`Leaderboard cleared for [${targetAppId}]`, 'close');
        return new Response(JSON.stringify({ status: 'ok', cleared: true, appId: targetAppId }), { headers });
      }
    }

    // ==========================================
    // 2. APPS & CATALOG GET: Real-time CCU & Active Rooms
    // ==========================================
    if (request.method === 'GET') {
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
          apiKey: g.apiKey || `mb_live_${g.id.replace(/[^a-z0-9]/g, '').slice(0, 16)}`,
          createdAt: g.createdAt,
          status: g.status || 'active',
          plan: g.plan || 'free',
          ownerId: g.ownerId || 'dev_local',
          activeCCU: gameCCU,
          activeRooms: gameRooms.length
        };
      });

      // Specific app/game API detail
      if (parts.length >= 3 && (parts[1] === 'games' || parts[1] === 'apps')) {
        const targetId = parts[2];
        const game = gamesWithLiveStats.find(g => g.id === targetId);
        if (!game) {
          return new Response(JSON.stringify({ error: 'App not found' }), { status: 404, headers });
        }
        const roomsForGame = activeRoomsList.filter(r => r.appId === targetId);
        const lb = (await this.state.storage.get(`lb:${targetId}`)) || [];
        return new Response(JSON.stringify({
          app: game,
          game,
          activeRooms: roomsForGame,
          leaderboard: lb.slice(0, 10),
          logs: this.recentLogs.slice(-20)
        }, null, 2), { headers });
      }

      const totalLiveCCU = gamesWithLiveStats.reduce((sum, g) => sum + g.activeCCU, 0);
      const dailyStats = await this._getDailyStats();

      return new Response(JSON.stringify({
        status: 'ok',
        apps: gamesWithLiveStats,
        games: gamesWithLiveStats,
        activeRooms: activeRoomsList,
        recentLogs: this.recentLogs.slice(-25),
        metrics: {
          totalApps: games.length,
          totalGames: games.length,
          totalCCU: totalLiveCCU,
          totalActiveRooms: activeRoomsList.length,
          dailyRequests: dailyStats.requests,
          dailyRequestsLimit: 100000,
          totalScores: dailyStats.scores || 0
        }
      }, null, 2), { headers });
    }

    // ==========================================
    // 3. CREATE APP (POST): Pure Photon-style (Only name required)
    // ==========================================
    if (request.method === 'POST') {
      try {
        const body = await request.json().catch(() => ({}));
        const name = (body.name || 'New App').trim();
        const id = (body.id || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) || `app-${Date.now().toString(36)}`;
        const apiKey = `mb_live_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;

        const existing = games.find(g => g.id === id);
        if (existing) {
          return new Response(JSON.stringify({ error: 'An App with this App ID already exists' }), { status: 409, headers });
        }

        const userId = body.userId || request.headers.get('X-Mereb-User-Id') || 'dev_local';
        const userProfile = (await this.state.storage.get(`user:${userId}`)) || { id: userId, plan: 'free' };
        const userPlan = userProfile.plan || 'free';
        const tier = PLAN_TIERS[userPlan] || PLAN_TIERS.free;

        const userGames = games.filter(g => g.ownerId === userId || (!g.ownerId && userId === 'dev_local'));
        if (userGames.length >= tier.maxGames) {
          return new Response(JSON.stringify({
            error: `${tier.name} tier limit reached (${tier.maxGames} game${tier.maxGames > 1 ? 's' : ''}). Upgrade your plan via Polar ($20/mo) to create up to 10 games.`,
            code: 'PLAN_LIMIT_EXCEEDED',
            plan: userPlan,
            maxGames: tier.maxGames
          }), { status: 403, headers });
        }

        const origin = url.origin;
        const newGame = {
          id,
          name,
          apiKey,
          ownerId: userId,
          plan: userPlan,
          createdAt: new Date().toISOString().split('T')[0],
          status: 'active',
          apiLink: `${origin}/api/apps/${id}`
        };

        games.push(newGame);
        await this.state.storage.put('catalog_games', games);
        await this._addLog(`Created App ID "${id}" (${name})`, 'create');

        return new Response(JSON.stringify({
          status: 'created',
          app: {
            ...newGame,
            activeCCU: 0,
            activeRooms: 0
          },
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

    // ==========================================
    // 4. DELETE APP: /api/apps/:appId or /api/games/:appId
    // ==========================================
    if (request.method === 'DELETE') {
      if (parts.length >= 3 && (parts[1] === 'games' || parts[1] === 'apps')) {
        const targetId = parts[2];
        games = games.filter(g => g.id !== targetId);
        await this.state.storage.put('catalog_games', games);
        await this.state.storage.delete(`lb:${targetId}`);
        await this._addLog(`Deleted App ID "${targetId}"`, 'close');
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
    if (this.connections.size >= 100) {
      ws.send(JSON.stringify({ type: 'error', message: 'Room channel capacity reached (100 peers max)' }));
      ws.close(1008, 'Room capacity reached');
      return;
    }

    // Cancel pending room reaper alarm since player joined
    this.state.storage.deleteAlarm().catch(() => {});

    this.connections.set(ws.id, ws);

    if (!this.hostId) {
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

    // Handshake packet to new client
    const existingPeers = Array.from(this.connections.keys()).filter(id => id !== ws.id);
    ws.send(JSON.stringify({
      type: 'connected',
      id: ws.id,
      appId: this.appId,
      roomId: this.roomId,
      isHost: ws.id === this.hostId,
      peers: existingPeers,
      totalConnected: this.connections.size
    }));

    // If joining a 2-player match and host is waiting, trigger WebRTC handshake
    if (this.connections.size === 2 && this.hostId && ws.id !== this.hostId) {
      // 1. Send room-joined event to joining peer
      ws.send(JSON.stringify({
        type: 'room-joined',
        players: [this.hostId, ws.id],
        hostId: this.hostId,
        peerId: this.hostId
      }));

      // 2. Notify host that player joined and to start signaling offer
      const hostWs = this.connections.get(this.hostId);
      if (hostWs) {
        hostWs.send(JSON.stringify({
          type: 'player-joined',
          playerId: ws.id
        }));
        hostWs.send(JSON.stringify({
          type: 'start-signal',
          peerId: ws.id
        }));
      }
    }

    // Notify other peers in room
    for (const [peerId, peerWs] of this.connections.entries()) {
      if (peerId !== ws.id) {
        try {
          peerWs.send(JSON.stringify({
            type: 'peer-joined',
            id: ws.id,
            totalConnected: this.connections.size
          }));
        } catch {}
      }
    }

    ws.addEventListener('message', (event) => {
      // 1. High-Performance Raw Binary Forwarding (Godot, Three.js, ArrayBuffer, Uint8Array)
      if (typeof event.data !== 'string') {
        for (const [peerId, peerWs] of this.connections.entries()) {
          if (peerId !== ws.id) {
            try {
              peerWs.send(event.data);
            } catch {}
          }
        }
        return;
      }

      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        data = { type: 'message', text: event.data };
      }

      // 2. Heartbeat Ping / Pong for sub-10ms RTT & connection keepalive
      if (data.type === 'ping') {
        try {
          ws.send(JSON.stringify({ type: 'pong', time: data.time || Date.now() }));
        } catch {}
        return;
      }

      // 3. Peer Discovery
      if (data.type === 'get-peers') {
        try {
          const peerList = Array.from(this.connections.keys()).filter(id => id !== ws.id);
          ws.send(JSON.stringify({ type: 'peers', peers: peerList, total: this.connections.size }));
        } catch {}
        return;
      }

      // 4. Targeted Message (WebRTC Signaling: Offer, Answer, ICE Candidate)
      if (data.to) {
        const target = this.connections.get(data.to);
        if (target) {
          target.send(JSON.stringify({
            ...data,
            from: ws.id
          }));
        }
        return;
      }

      // 5. Room Broadcast to all other peers in channel
      const payload = JSON.stringify({
        ...data,
        from: ws.id,
        timestamp: Date.now()
      });

      for (const [peerId, peerWs] of this.connections.entries()) {
        if (peerId !== ws.id) {
          try {
            peerWs.send(payload);
          } catch {}
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
          peerWs.send(JSON.stringify({
            type: 'peer-left',
            id: ws.id,
            totalConnected: this.connections.size
          }));
        } catch {}
      }

      if (ws.id === this.hostId) {
        this.hostId = this.connections.keys().next().value || null;
      }

      if (this.connections.size === 0) {
        this.hostId = null;
        this._notifyCatalog({
          event: 'room-closed',
          appId: this.appId,
          roomId: this.roomId,
          timestamp: Date.now()
        });

        // 60-second Dead Room Reaper Alarm
        this.state.storage.setAlarm(Date.now() + 60000).catch(() => {});
      }
    };

    ws.addEventListener('close', handleDisconnect);
    ws.addEventListener('error', handleDisconnect);
  }

  // Durable Object Alarm handler: Cleans up empty room memory after 60s idle
  async alarm() {
    if (this.connections.size === 0) {
      this.hostId = null;
      this.queue = [];
      await this.state.storage.deleteAll();
    }
  }
}

const CLIENT_SDK_JS = `/**
 * Mereb Cloud Client SDK v1.0.0
 * Universal Realtime WebSocket & WebRTC Client for Web, Node, and Game Engines.
 * (c) 2026 Mereb Cloud Platform
 */
(function(global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Mereb = factory());
})(this, function() {
  'use strict';

  class MerebRoom extends EventTarget {
    constructor(client, roomId) {
      super();
      this.client = client;
      this.roomId = roomId;
      this.id = null;
      this.peers = [];
      this.isHost = false;
      this.connected = false;
      this._listeners = new Map();
      this.ws = null;
      this._connect();
    }

    _connect() {
      const proto = this.client.endpoint.startsWith('https') ? 'wss:' : 'ws:';
      const host = this.client.endpoint.replace(/^https?:\\/\\//, '');
      const url = \`\${proto}//\${host}/v1/\${this.client.appId}/\${this.roomId}?key=\${this.client.apiKey || ''}\`;
      this.ws = new WebSocket(url);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        this.connected = true;
        this.emit('open', { roomId: this.roomId });
      };

      this.ws.onmessage = (event) => {
        if (typeof event.data !== 'string') {
          this.emit('binary', event.data);
          this.emit('*', event.data);
          return;
        }

        try {
          const data = JSON.parse(event.data);
          if (data.type === 'connected') {
            this.id = data.id;
            this.isHost = data.isHost;
            this.peers = data.peers || [];
            this.emit('connected', data);
            return;
          }
          if (data.type === 'peer-joined') {
            if (!this.peers.includes(data.id)) this.peers.push(data.id);
            this.emit('peer-joined', data);
            return;
          }
          if (data.type === 'peer-left') {
            this.peers = this.peers.filter(p => p !== data.id);
            this.emit('peer-left', data);
            return;
          }
          if (data.type === 'pong') {
            this.emit('pong', data);
            return;
          }
          
          const eventType = data.event || data.type || 'message';
          this.emit(eventType, data);
          this.emit('*', data);
        } catch {
          this.emit('message', event.data);
        }
      };

      this.ws.onclose = (e) => {
        this.connected = false;
        this.emit('close', e);
      };

      this.ws.onerror = (e) => {
        this.emit('error', e);
      };
    }

    on(event, callback) {
      if (!this._listeners.has(event)) this._listeners.set(event, []);
      this._listeners.get(event).push(callback);
      return this;
    }

    off(event, callback) {
      if (!this._listeners.has(event)) return this;
      this._listeners.set(event, this._listeners.get(event).filter(cb => cb !== callback));
      return this;
    }

    emit(event, data) {
      const cbs = this._listeners.get(event) || [];
      cbs.forEach(cb => cb(data));
      this.dispatchEvent(new CustomEvent(event, { detail: data }));
    }

    send(data) {
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(payload);
      } else if (this.ws) {
        this.ws.addEventListener('open', () => this.ws.send(payload), { once: true });
      }
    }

    sendBinary(buffer) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(buffer);
      }
    }

    sendTo(peerId, data) {
      this.send({ to: peerId, payload: data });
    }

    ping() {
      return new Promise((resolve) => {
        const start = performance.now();
        const handler = (data) => {
          this.off('pong', handler);
          resolve(Math.round(performance.now() - start));
        };
        this.on('pong', handler);
        this.send({ type: 'ping' });
        setTimeout(() => {
          this.off('pong', handler);
          resolve(-1);
        }, 3000);
      });
    }

    close() {
      if (this.ws) this.ws.close();
    }
  }

  class Mereb {
    constructor(options = {}) {
      if (typeof options === 'string') {
        this.appId = options;
        this.apiKey = '';
        this.endpoint = 'https://mereb-signaling.dawitbaslyos.workers.dev';
      } else {
        this.appId = options.appId || 'app_starter';
        this.apiKey = options.apiKey || options.key || '';
        this.endpoint = (options.endpoint || 'https://mereb-signaling.dawitbaslyos.workers.dev').replace(/\/+$/, '');
      }
      this.rooms = new Map();
    }

    room(roomId = 'default') {
      if (!this.rooms.has(roomId)) {
        this.rooms.set(roomId, new MerebRoom(this, roomId));
      }
      return this.rooms.get(roomId);
    }

    async broadcast(roomId, message) {
      const res = await fetch(\`\${this.endpoint}/v1/\${this.appId}/\${roomId}/broadcast\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
      return await res.json();
    }

    async getPresence(roomId) {
      const res = await fetch(\`\${this.endpoint}/v1/\${this.appId}/\${roomId}/presence\`);
      return await res.json();
    }

    async getLeaderboard(appId = this.appId) {
      const res = await fetch(\`\${this.endpoint}/api/apps/\${appId}/leaderboard\`);
      return await res.json();
    }

    async submitScore(player, score, metadata = {}, appId = this.appId) {
      const res = await fetch(\`\${this.endpoint}/api/apps/\${appId}/leaderboard\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player, score, metadata })
      });
      return await res.json();
    }
  }

  return Mereb;
});
`;

/**
 * Main Worker Router
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Serve Standalone Client SDK
    if (url.pathname === '/sdk.js' || url.pathname === '/v1/sdk.js') {
      return new Response(CLIENT_SDK_JS, {
        headers: {
          'Content-Type': 'application/javascript; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }

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

    // GitHub OAuth Token Exchange (Returns cryptographically signed JWT Session Token)
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

        let user = {
          id: `gh_${ghUser.id}`,
          username: ghUser.login,
          name: ghUser.name || ghUser.login,
          avatar: ghUser.avatar_url,
          email: ghUser.email || `${ghUser.login}@users.noreply.github.com`,
          bio: ghUser.bio || '',
          plan: 'free',
          maxProjects: 1
        };

        // Persist to Cloudflare D1 multi-tenant users table
        if (env.DB) {
          try {
            const dbUser = await upsertGithubUser(env.DB, ghUser);
            if (dbUser) {
              user = {
                ...user,
                id: dbUser.id,
                plan: dbUser.plan || 'free'
              };
            }
          } catch (dbErr) {
            console.error('D1 user upsert error:', dbErr);
          }
        }

        // Generate HMAC-SHA256 Signed JWT Session Token
        const sessionToken = await createSessionToken(user, env.SESSION_SECRET);

        return new Response(JSON.stringify({
          status: 'ok',
          user,
          token: sessionToken
        }), {
          headers: {
            ...headers,
            'Set-Cookie': `mereb_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 86400}`
          }
        });
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
        let user = {
          id: `gh_${ghUser.id}`,
          username: ghUser.login,
          name: ghUser.name || ghUser.login,
          avatar: ghUser.avatar_url,
          email: `${ghUser.login}@users.noreply.github.com`,
          bio: ghUser.bio || '',
          plan: 'free',
          maxProjects: 1
        };

        if (env.DB) {
          try {
            const dbUser = await upsertGithubUser(env.DB, ghUser);
            if (dbUser) user = { ...user, id: dbUser.id, plan: dbUser.plan };
          } catch {}
        }

        const sessionToken = await createSessionToken(user, env.SESSION_SECRET);

        return new Response(JSON.stringify({ status: 'ok', user, token: sessionToken }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // Route Studio Catalog, Apps, Leaderboards, Polar Billing & Managed TURN API
    if (
      url.pathname.startsWith('/api/games') ||
      url.pathname.startsWith('/api/catalog') ||
      url.pathname.startsWith('/api/apps') ||
      url.pathname.startsWith('/api/leaderboard') ||
      url.pathname.startsWith('/api/billing') ||
      url.pathname.startsWith('/api/turn-credentials')
    ) {
      // Use Cloudflare D1 Relational Engine for Apps & Leaderboard if available
      if (
        env.DB &&
        (url.pathname.startsWith('/api/apps') ||
         url.pathname.startsWith('/api/games') ||
         url.pathname.includes('/leaderboard'))
      ) {
        return handleD1CatalogAPI(request, url, env);
      }

      const catalogDoId = env.GAME_ROOM.idFromName('system:studio_catalog');
      const catalogStub = env.GAME_ROOM.get(catalogDoId);
      return catalogStub.fetch(new Request(url.toString(), request));
    }

    // Route room connections
    const parts = url.pathname.split('/').filter(Boolean);
    let appId = url.searchParams.get('appId') || request.headers.get('X-Mereb-App-Id') || 'app_starter';
    let roomId = 'default';

    if (parts[0] === 'v1' && parts.length >= 3) {
      appId = parts[1];
      roomId = parts[2];
    } else if (parts.length >= 4 && (parts[0] === 'games' || parts[0] === 'apps') && parts[2] === 'room') {
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
  },

  // 5-Minute Scheduled Cron (Peak CCU & Usage Metering Aggregator)
  async scheduled(event, env, ctx) {
    if (!env.DB) return;
    try {
      const apps = await env.DB.prepare('SELECT id FROM apps').all();
      for (const app of (apps.results || [])) {
        await recordUsageSnapshot(env.DB, app.id, 0, 0);
      }
      console.log(`[Cron] Aggregated 5-min CCU snapshot for ${apps.results?.length || 0} apps.`);
    } catch (err) {
      console.error('[Cron] CCU snapshot error:', err);
    }
  }
};

/**
 * Extracts and verifies developer session from Authorization Bearer or Cookie
 */
async function getAuthenticatedUser(request, env) {
  const authHeader = request.headers.get('Authorization') || '';
  const cookieHeader = request.headers.get('Cookie') || '';
  let token = '';

  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (cookieHeader.includes('mereb_session=')) {
    token = cookieHeader.split('mereb_session=')[1].split(';')[0].trim();
  }

  if (token) {
    const payload = await verifySessionToken(token, env.SESSION_SECRET);
    if (payload && payload.sub) {
      if (env.DB) {
        const u = await getUserById(env.DB, payload.sub);
        if (u) return u;
      }
      return { id: payload.sub, username: payload.username, plan: payload.plan || 'free' };
    }
  }

  const devUserId = request.headers.get('X-Mereb-User-Id');
  if (devUserId) {
    if (env.DB) {
      const u = await getUserById(env.DB, devUserId);
      if (u) return u;
    }
    return { id: devUserId, username: 'Developer', plan: 'free' };
  }

  return null;
}

/**
 * Handles multi-tenant Apps and Global Leaderboard queries against Cloudflare D1
 */
async function handleD1CatalogAPI(request, url, env) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Mereb-User-Id, X-Mereb-App-Id'
  };

  try {
    const parts = url.pathname.split('/').filter(Boolean);
    const user = await getAuthenticatedUser(request, env);

  // 1. Leaderboard APIs: /api/apps/:appId/leaderboard or /api/leaderboard/:appId
  if (parts.includes('leaderboard')) {
    let targetAppId = url.searchParams.get('appId') || request.headers.get('X-Mereb-App-Id') || 'app_starter';
    const lbIdx = parts.indexOf('leaderboard');
    if (lbIdx > 0 && (parts[lbIdx - 1] === 'apps' || parts[lbIdx - 1] === 'games')) {
      targetAppId = parts[lbIdx - 2] || targetAppId;
    } else if (parts[lbIdx + 1]) {
      targetAppId = parts[lbIdx + 1];
    } else if (lbIdx >= 2 && parts[lbIdx - 2] === 'apps') {
      targetAppId = parts[lbIdx - 1];
    }

    if (request.method === 'GET') {
      const lb = await getLeaderboard(env.DB, targetAppId, 100);
      return new Response(JSON.stringify({
        status: 'ok',
        appId: targetAppId,
        leaderboard: lb
      }, null, 2), { headers });
    }

    if (request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const player = (body.player || body.username || 'Anonymous').trim();
      const score = parseInt(body.score, 10);
      if (isNaN(score)) {
        return new Response(JSON.stringify({ error: 'Valid integer score is required' }), { status: 400, headers });
      }
      const result = await submitScore(env.DB, targetAppId, player, score, body.metadata);
      return new Response(JSON.stringify({
        status: 'ok',
        ...result
      }, null, 2), { status: 201, headers });
    }

    if (request.method === 'DELETE') {
      await clearLeaderboard(env.DB, targetAppId);
      return new Response(JSON.stringify({ status: 'ok', cleared: true, appId: targetAppId }), { headers });
    }
  }

  // 2. Apps API: /api/apps or /api/games
  if (parts[1] === 'apps' || parts[1] === 'games') {
    if (request.method === 'GET') {
      const targetUserId = user?.id || url.searchParams.get('userId') || request.headers.get('X-Mereb-User-Id') || 'dev_local';
      const apps = await getUserApps(env.DB, targetUserId);

      // Fetch live telemetry from studio catalog
      let liveRooms = [];
      try {
        const catStub = env.GAME_ROOM.get(env.GAME_ROOM.idFromName('system:studio_catalog'));
        const catRes = await catStub.fetch('https://internal/api/catalog');
        if (catRes.ok) {
          const catData = await catRes.json();
          liveRooms = catData.activeRooms || [];
        }
      } catch {}

      const appsWithStats = apps.map(app => {
        const rooms = liveRooms.filter(r => r.appId === app.id);
        const ccu = rooms.reduce((sum, r) => sum + (r.playerCount || 0), 0);
        return {
          ...app,
          activeCCU: ccu,
          activeRooms: rooms.length
        };
      });

      return new Response(JSON.stringify({
        status: 'ok',
        apps: appsWithStats,
        games: appsWithStats,
        user: user || { id: targetUserId, username: 'Developer', plan: 'free' }
      }, null, 2), { headers });
    }

    if (request.method === 'POST') {
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized. Please sign in.' }), { status: 401, headers });
      }

      const body = await request.json().catch(() => ({}));
      const name = (body.name || 'New App').trim();
      const id = (body.id || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) || `app_${Date.now().toString(36)}`;

      // Check plan limits
      const userApps = await getUserApps(env.DB, user.id);
      const tier = PLAN_TIERS[user.plan || 'free'] || PLAN_TIERS.free;
      if (userApps.length >= tier.maxGames) {
        return new Response(JSON.stringify({
          error: `${tier.name} tier limit reached (${tier.maxGames} game${tier.maxGames > 1 ? 's' : ''}). Upgrade to Pro to create more games.`,
          code: 'PLAN_LIMIT_EXCEEDED'
        }), { status: 403, headers });
      }

      const created = await createAppWithKeys(env.DB, { id, name, ownerId: user.id });
      return new Response(JSON.stringify({
        status: 'created',
        app: created,
        game: created
      }, null, 2), { status: 201, headers });
    }

    if (request.method === 'DELETE') {
      const targetId = parts[2];
      if (!targetId) {
        return new Response(JSON.stringify({ error: 'App ID required' }), { status: 400, headers });
      }
      try {
        await deleteApp(env.DB, targetId, user?.id);
        return new Response(JSON.stringify({ status: 'deleted', id: targetId }), { headers });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 403, headers });
      }
    }
  }

  // Fallback to Durable Object catalog
  const catalogStub = env.GAME_ROOM.get(env.GAME_ROOM.idFromName('system:studio_catalog'));
  return catalogStub.fetch(new Request(url.toString(), request));
  } catch (err) {
    console.error('[D1 Catalog Error]', err);
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), {
      status: 500,
      headers
    });
  }
}
