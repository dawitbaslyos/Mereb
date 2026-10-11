/**
 * Mereb Cloud - Authentication & Project Storage Service
 * GitHub-only authentication with local persistence and project tier restrictions.
 */

const STORAGE_KEY_USER = 'mereb_cloud_user';
const STORAGE_KEY_PROJECTS = 'mereb_cloud_projects';

export class AuthService {
  constructor() {
    this.listeners = new Set();
    this.user = this._loadUser();
    this.projects = this._loadProjects();
  }

  _loadUser() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  _loadProjects() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PROJECTS);
      if (data) return JSON.parse(data);
    } catch {}

    // Default starter project
    return [
      {
        id: 'proj_starter',
        name: 'My First Arena Game',
        apiKey: 'pk_live_mereb_a8f92b710c4d',
        createdAt: '2026-10-12',
        activeRooms: 3,
        totalMatches: 142,
        avgPingMs: 24,
        region: 'Global Edge (Auto)'
      }
    ];
  }

  _saveProjects() {
    try {
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(this.projects));
    } catch {}
  }

  getUser() {
    return this.user;
  }

  isAuthenticated() {
    return !!this.user;
  }

  loginWithGithub(customUsername = 'daevutyb') {
    const user = {
      id: 'gh_' + Math.floor(Math.random() * 1000000),
      username: customUsername,
      name: customUsername,
      avatar: `https://github.com/${customUsername}.png`,
      email: `${customUsername}@users.noreply.github.com`,
      plan: 'free', // 'free' | 'pro'
      maxProjects: 1
    };

    this.user = user;
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } catch {}
    this._notify();
    return user;
  }

  logout() {
    this.user = null;
    try {
      localStorage.removeItem(STORAGE_KEY_USER);
    } catch {}
    this._notify();
  }

  getProjects() {
    return this.projects;
  }

  createProject(name) {
    if (!name || !name.trim()) throw new Error('Project name is required');

    // Free tier limitation enforcement
    const isFreePlan = !this.user || this.user.plan === 'free';
    if (isFreePlan && this.projects.length >= 1) {
      const err = new Error('Free plan allows a maximum of 1 active project.');
      err.code = 'LIMIT_REACHED';
      throw err;
    }

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
