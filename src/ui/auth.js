/**
 * Mereb Cloud - Authentication, Game Catalog & Telemetry Service
 * GitHub-only authentication with local persistence and multi-game management.
 */

const STORAGE_KEY_USER = 'mereb_cloud_user';
const STORAGE_KEY_PROJECTS = 'mereb_cloud_projects';
const STORAGE_KEY_GAMES = 'mereb_cloud_games';
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
      const res = await fetch(`${host}/api/apps`);
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

  createApp(name, host = 'https://mereb-signaling.dawitbaslyos.workers.dev') {
    if (!name || !name.trim()) throw new Error('App title is required');

    const id = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `app-${Date.now().toString(36)}`;
    const existing = this.games.find(g => g.id === id);
    if (existing) throw new Error('An App with this App ID already exists');

    const apiKey = `mb_live_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;

    const newApp = {
      id,
      name: name.trim(),
      apiKey,
      createdAt: new Date().toISOString().split('T')[0],
      activeCCU: 0,
      activeRooms: 0,
      status: 'active',
      apiLink: `${host}/api/apps/${id}`
    };

    this.games.push(newApp);
    this._saveGames();
    this._notify();

    // Sync to Cloudflare Edge
    try {
      fetch(`${host}/api/apps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: name.trim() })
      }).catch(() => {});
    } catch {}

    return newApp;
  }

  // Alias for backward compatibility
  addGame(name, _genre, _maxPlayers, host) {
    return this.createApp(name, host);
  }

  deleteApp(appId, host = 'https://mereb-signaling.dawitbaslyos.workers.dev') {
    this.games = this.games.filter(g => g.id !== appId);
    this._saveGames();
    this._notify();

    try {
      fetch(`${host}/api/apps/${appId}`, { method: 'DELETE' }).catch(() => {});
    } catch {}
  }

  deleteGame(gameId, host) {
    return this.deleteApp(gameId, host);
  }

  async fetchLeaderboard(appId, host = 'https://mereb-signaling.dawitbaslyos.workers.dev') {
    try {
      const res = await fetch(`${host}/api/apps/${appId}/leaderboard`);
      if (res.ok) {
        const data = await res.json();
        return data.leaderboard || [];
      }
    } catch (e) {
      console.warn('Failed to fetch leaderboard:', e);
    }
    return [];
  }

  async submitScore(appId, player, score, host = 'https://mereb-signaling.dawitbaslyos.workers.dev') {
    const res = await fetch(`${host}/api/apps/${appId}/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player, score })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Submission failed' }));
      throw new Error(err.error || 'Failed to submit score');
    }
    return await res.json();
  }

  async clearLeaderboard(appId, host = 'https://mereb-signaling.dawitbaslyos.workers.dev') {
    const res = await fetch(`${host}/api/apps/${appId}/leaderboard`, {
      method: 'DELETE'
    });
    return res.ok;
  }

  getUser() {
    return this.user;
  }

  isAuthenticated() {
    return !!this.user;
  }

  async loginWithGithub(customUsername = null, host = 'https://mereb-signaling.dawitbaslyos.workers.dev') {
    // 1. Check if OAuth app is configured on Cloudflare Edge
    try {
      const configRes = await fetch(`${host}/api/auth/github/config`);
      if (configRes.ok) {
        const { clientId, configured } = await configRes.json();
        if (configured && clientId) {
          // Official GitHub OAuth Redirect
          const redirectUri = window.location.origin.replace(/\/+$/, '') + window.location.pathname.replace(/\/+$/, '');
          const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=read:user,user:email&redirect_uri=${encodeURIComponent(redirectUri)}`;
          window.location.href = authUrl;
          return;
        }
      }
    } catch {}

    // 2. Instant Live GitHub Profile Connection (Zero-setup mode)
    let username = customUsername;
    if (!username) {
      username = prompt('Enter your GitHub username to connect your live profile:', this.user?.username || 'dawitbaslyos');
      if (!username || !username.trim()) return null;
      username = username.trim();
    }

    try {
      const res = await fetch(`${host}/api/auth/github/profile?username=${encodeURIComponent(username)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          this.user = data.user;
          try {
            localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(this.user));
          } catch {}
          this._notify();
          return this.user;
        }
      }
    } catch (err) {
      console.warn('Profile fetch warning:', err);
    }

    // 3. Fallback
    const fallbackUser = {
      id: 'gh_' + Math.floor(Math.random() * 1000000),
      username: username || 'dawitbaslyos',
      name: username || 'Dawit Abiy',
      avatar: `https://github.com/${username || 'dawitbaslyos'}.png`,
      email: `${username || 'dawitbaslyos'}@users.noreply.github.com`,
      plan: 'free',
      maxProjects: 1
    };

    this.user = fallbackUser;
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(fallbackUser));
    } catch {}
    this._notify();
    return fallbackUser;
  }

  async handleAuthCallback(code, host = 'https://mereb-signaling.dawitbaslyos.workers.dev') {
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
          this.user = data.user;
          try {
            localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(this.user));
          } catch {}
          this._notify();
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
    } catch {}
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
