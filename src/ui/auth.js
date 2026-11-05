/**
 * Mereb Cloud - Authentication, Game Catalog & Telemetry Service
 * GitHub-only authentication with local persistence and multi-game management.
 */

const STORAGE_KEY_USER = 'mereb_cloud_user';
const STORAGE_KEY_PROJECTS = 'mereb_cloud_projects';
const STORAGE_KEY_GAMES = 'mereb_cloud_games';
const STORAGE_KEY_TOKEN = 'mereb_cloud_token';
export const CLOUD_EDGE_HOST = 'https://mereb-signaling.dawitbaslyos.workers.dev';

const DEFAULT_GAMES = [
  {
    id: 'app_starter',
    name: 'Starter App',
    apiKey: 'pk_live_mereb_starter_key',
    createdAt: '2026-10-22',
    status: 'active',
    apiLink: 'https://mereb-signaling.dawitbaslyos.workers.dev/api/apps/app_starter'
  }
];

export class AuthService {
  constructor() {
    this.listeners = new Set();
    this.token = this._loadToken();
    this.user = this._loadUser();
    this.projects = this._loadProjects();
    this.games = this._loadGames();
    this.activeRooms = [];
    this.recentLogs = [];
    this.cloudMetrics = {
      totalGames: 1,
      totalCCU: 0,
      totalActiveRooms: 0
    };
  }

  _loadToken() {
    try {
      return localStorage.getItem(STORAGE_KEY_TOKEN) || null;
    } catch {
      return null;
    }
  }

  getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    if (this.user?.id) {
      headers['X-Mereb-User-Id'] = this.user.id;
    }
    return headers;
  }

  _loadUser() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_USER);
      if (data) return JSON.parse(data);
    } catch {}

    // Auto-provision seamless Developer Workspace (Never blocks the user!)
    return {
      id: 'dev_local',
      username: 'Developer',
      name: 'Developer Workspace',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=mereb',
      plan: 'free',
      isGuest: true
    };
  }

  _loadProjects() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PROJECTS);
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  }

  _saveProjects() {
    try {
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(this.projects));
    } catch {}
  }

  _loadGames() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_GAMES);
      if (data) return JSON.parse(data);
    } catch {}
    return [...DEFAULT_GAMES];
  }

  _saveGames() {
    try {
      localStorage.setItem(STORAGE_KEY_GAMES, JSON.stringify(this.games));
    } catch {}
  }

  getGames() {
    return this.games;
  }

  getCloudMetrics() {
    return this.cloudMetrics;
  }

  async syncWithEdge(host = 'https://mereb-signaling.dawitbaslyos.workers.dev') {
    try {
      const res = await fetch(`${host}/api/apps`, {
        headers: this.getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const appList = data.apps || data.games;
        if (appList && Array.isArray(appList)) {
          this.games = appList;
          this._saveGames();
        }
        if (data.metrics) {
          this.cloudMetrics = data.metrics;
        }
        if (data.activeRooms) {
          this.activeRooms = data.activeRooms;
        }
        if (data.recentLogs) {
          this.recentLogs = data.recentLogs;
        }
        if (data.user && !this.user?.isGuest) {
          this.user = { ...this.user, plan: data.user.plan || this.user.plan };
          try { localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(this.user)); } catch {}
        }
        this._notify();
      }
    } catch (e) {
      console.warn('Edge catalog sync notice:', e.message);
    }
  }

  getActiveRooms() {
    return this.activeRooms || [];
  }

  getRecentLogs() {
    return this.recentLogs || [];
  }

  getPlan() {
    return this.user?.plan || 'free';
  }

  getGameLimit() {
    const plan = this.getPlan();
    if (plan === 'pro') return 10;
    if (plan === 'enterprise') return 999;
    return 1;
  }

  canAddGame() {
    const limit = this.getGameLimit();
    if (this.games.length >= limit) {
      if (this.getPlan() === 'free') {
        return {
          allowed: false,
          limit,
          message: 'Free tier is limited to 1 game. Upgrade to Pro ($20/mo) for up to 10 games.'
        };
      }
      return {
        allowed: false,
        limit,
        message: 'Pro tier limit reached (10 games). Contact us for custom Enterprise scale.'
      };
    }
    return { allowed: true, limit };
  }

  setPlan(plan) {
    if (!this.user) {
      this.user = this._loadUser();
    }
    this.user.plan = plan;
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(this.user));
    } catch {}
    this._notify();
  }

  async createApp(name, host = CLOUD_EDGE_HOST) {
    if (!name || !name.trim()) throw new Error('App title is required');

    const check = this.canAddGame();
    if (!check.allowed) {
      throw new Error(check.message);
    }

    const trimmed = name.trim();
    let createdApp = null;

    try {
      const res = await fetch(`${host}/api/apps`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ name: trimmed })
      });
      if (res.ok) {
        const data = await res.json();
        createdApp = data.app || data.game;
      } else {
        const errData = await res.json().catch(() => ({ error: 'Failed to create game' }));
        throw new Error(errData.error || 'Failed to create game');
      }
    } catch (err) {
      if (err.message.includes('limit reached')) throw err;
      console.warn('Edge app create notice, using local fallback:', err);
    }

    if (!createdApp) {
      const id = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `app-${Date.now().toString(36)}`;
      const pubKey = `pk_live_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
      const secKey = `sk_live_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
      createdApp = {
        id,
        name: trimmed,
        publishableKey: pubKey,
        secretKey: secKey,
        publishableKeyDisplay: `${pubKey.slice(0, 10)}...`,
        secretKeyDisplay: `${secKey.slice(0, 10)}...`,
        apiKey: pubKey,
        createdAt: new Date().toISOString().split('T')[0],
        activeCCU: 0,
        activeRooms: 0,
        status: 'active',
        apiLink: `${host}/api/apps/${id}`
      };
    }

    this.games = this.games.filter(g => g.id !== createdApp.id);
    this.games.unshift(createdApp);
    this._saveGames();
    this._notify();

    return createdApp;
  }

  async createPolarCheckout(plan = 'pro', host = CLOUD_EDGE_HOST) {
    try {
      const res = await fetch(`${host}/api/billing/polar/checkout`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          plan,
          userId: this.user?.id || 'dev_local',
          email: this.user?.email || ''
        })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Polar checkout initiation warning:', err);
    }
    return { 
      status: 'ok', 
      mode: 'demo', 
      message: 'Polar checkout ready. Configure POLAR_CHECKOUT_PRO_URL in cloudflare/.dev.vars to connect live billing.',
      url: 'https://polar.sh/'
    };
  }

  async syncSubscription(host = CLOUD_EDGE_HOST) {
    if (!this.user?.id) return;
    try {
      const res = await fetch(`${host}/api/billing/subscription?userId=${encodeURIComponent(this.user.id)}`, {
        headers: this.getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.plan && data.plan !== this.user.plan) {
          this.setPlan(data.plan);
        }
      }
    } catch {}
  }

  // Alias for backward compatibility
  addGame(name, _genre, _maxPlayers, host) {
    return this.createApp(name, host);
  }

  deleteApp(appId, host = CLOUD_EDGE_HOST) {
    this.games = this.games.filter(g => g.id !== appId);
    this._saveGames();
    this._notify();

    try {
      fetch(`${host}/api/apps/${appId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      }).catch(() => {});
    } catch {}
  }

  deleteGame(gameId, host) {
    return this.deleteApp(gameId, host);
  }

  async fetchLeaderboard(appId, host = CLOUD_EDGE_HOST) {
    try {
      const res = await fetch(`${host}/api/apps/${appId}/leaderboard`, {
        headers: this.getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        return data.leaderboard || [];
      }
    } catch (e) {
      console.warn('Failed to fetch leaderboard:', e);
    }
    return [];
  }

  async submitScore(appId, player, score, host = CLOUD_EDGE_HOST) {
    const res = await fetch(`${host}/api/apps/${appId}/leaderboard`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ player, score })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Submission failed' }));
      throw new Error(err.error || 'Failed to submit score');
    }
    return await res.json();
  }

  async clearLeaderboard(appId, host = CLOUD_EDGE_HOST) {
    const res = await fetch(`${host}/api/apps/${appId}/leaderboard`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    return res.ok;
  }

  getUser() {
    return this.user;
  }

  isAuthenticated() {
    return this.isSignedIn();
  }

  isSignedIn() {
    return !!(this.user && !this.user.isGuest && this.user.id && this.user.id !== 'dev_local');
  }

  loginWithGithub() {
    const clientId = 'Ov23lizozUDKwKt6LRJr';
    const redirectUri = window.location.origin.replace(/\/+$/, '') + window.location.pathname.replace(/\/+$/, '');
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=read:user,user:email&redirect_uri=${encodeURIComponent(redirectUri)}`;
    window.location.href = authUrl;
  }

  async handleAuthCallback(code, host = CLOUD_EDGE_HOST) {
    try {
      const redirect_uri = window.location.origin.replace(/\/+$/, '') + window.location.pathname.replace(/\/+$/, '');
      const res = await fetch(`${host}/api/auth/github/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirect_uri })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          this.user = {
            ...data.user,
            isGuest: false
          };
          try {
            localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(this.user));
          } catch {}

          if (data.token) {
            this.token = data.token;
            try {
              localStorage.setItem(STORAGE_KEY_TOKEN, data.token);
            } catch {}
          }

          this._notify();
          await this.syncWithEdge(host);
          return this.user;
        }
      }
    } catch (err) {
      console.error('OAuth exchange error:', err);
    }
    return null;
  }

  logout() {
    try {
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_TOKEN);
    } catch {}
    this.token = null;
    this.user = {
      id: 'dev_local',
      username: 'Developer',
      name: 'Developer Workspace',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=mereb',
      plan: 'free',
      isGuest: true
    };
    this._notify();
  }

  getProjects() {
    return this.projects;
  }

  createProject(name) {
    if (!name || !name.trim()) throw new Error('Project name is required');

    const randomSuffix = Math.random().toString(36).substring(2, 10);
    const newProj = {
      id: 'proj_' + randomSuffix,
      name: name.trim(),
      apiKey: 'pk_live_mereb_' + randomSuffix + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString().split('T')[0],
      activeRooms: 0,
      totalMatches: 0,
      avgPingMs: 22,
      region: 'Global Edge (Auto)'
    };

    this.projects.push(newProj);
    this._saveProjects();
    this._notify();
    return newProj;
  }

  deleteProject(projectId) {
    this.projects = this.projects.filter(p => p.id !== projectId);
    this._saveProjects();
    this._notify();
  }

  upgradePlan() {
    if (this.user) {
      this.user.plan = 'pro';
      this.user.maxProjects = 999;
      try {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(this.user));
      } catch {}
      this._notify();
    }
  }

  onChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  _notify() {
    for (const listener of this.listeners) {
      listener(this.user, this.projects);
    }
  }
}

export const auth = new AuthService();
