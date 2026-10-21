/**
 * Mereb Cloud - Pure Developer Console (Photon-Style Netcode & Leaderboards)
 * Engine-agnostic multiplayer backend, real-time room tracking, Cloudflare edge stats,
 * and built-in global leaderboards.
 */
import { auth } from './auth.js';

export class DashboardUI {
  constructor({ onNavigateHome, onLaunchGame }) {
    this.onNavigateHome = onNavigateHome;
    this.onLaunchGame = onLaunchGame;
    this.element = document.createElement('div');
    this.element.className = 'dashboard-root';
    this.selectedGameIndex = 0;
    this.activeTab = 'rooms'; // 'rooms' | 'leaderboard' | 'engine'
    this.activeEngineTab = 'godot'; // 'godot' | 'web' | 'curl'
    this.leaderboard = [];
    this.loadingLeaderboard = false;
    this.pollInterval = null;

    auth.onChange(() => {
      this.render();
    });

    // Initial background sync with edge catalog
    auth.syncWithEdge().then(() => {
      this._loadCurrentLeaderboard();
      this.render();
    });

    // Auto-poll live edge connections every 3.5 seconds
    this.pollInterval = setInterval(() => {
      auth.syncWithEdge();
    }, 3500);

    this.render();
  }

  destroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  async _loadCurrentLeaderboard() {
    const apps = auth.getGames();
    const selected = apps[this.selectedGameIndex] || apps[0];
    if (!selected) return;
    this.loadingLeaderboard = true;
    try {
      this.leaderboard = await auth.fetchLeaderboard(selected.id);
    } catch {
      this.leaderboard = [];
    } finally {
      this.loadingLeaderboard = false;
    }
  }

  render() {
    const user = auth.getUser();
    const apps = auth.getGames();
    const activeRooms = auth.getActiveRooms();
    const recentLogs = auth.getRecentLogs();
    const metrics = auth.getCloudMetrics() || {};
    const selectedApp = apps[this.selectedGameIndex] || apps[0] || null;

    if (!user) {
      this.element.innerHTML = `
        <div class="dash-empty-state">
          <div class="dash-lock-icon">🔒</div>
          <h2>Authentication Required</h2>
          <p>Sign in with your verified GitHub account to access the Mereb Game Console.</p>
          <button class="btn-primary pill-btn btn-login-redirect">Sign in with GitHub</button>
        </div>
      `;
      this.element.querySelector('.btn-login-redirect')?.addEventListener('click', () => {
        auth.loginWithGithub();
      });
      return;
    }

    const host = 'https://mereb-signaling.dawitbaslyos.workers.dev';
    const totalCCU = apps.reduce((acc, g) => acc + (g.activeCCU || 0), 0);
    const totalRooms = activeRooms.length;
    const dailyReqs = metrics.dailyRequests || 0;
    const dailyLimit = metrics.dailyRequestsLimit || 100000;
    const totalScores = metrics.totalScores || 0;

    // Filter active rooms for selected app
    const selectedAppRooms = selectedApp
      ? activeRooms.filter(r => r.appId === selectedApp.id)
      : [];

    this.element.innerHTML = `
      <style>
        .dash-topbar {
          background: rgba(10, 15, 30, 0.95);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: 14px 28px;
          backdrop-filter: blur(16px);
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .dash-topbar-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .dash-brand-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .dash-logo-badge {
          background: linear-gradient(135deg, #0284c7, #38bdf8);
          color: #fff;
          font-weight: 900;
          font-size: 13px;
          padding: 3px 8px;
          border-radius: 6px;
          letter-spacing: 0.5px;
        }
        .dash-section-name {
          font-weight: 700;
          font-size: 14px;
          color: #94a3b8;
        }
        .dash-main-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 24px 80px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .console-header-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .dash-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
        }
        .dash-metric-card {
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .metric-title {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .metric-number {
          font-size: 26px;
          font-weight: 900;
          color: #f1f5f9;
        }
        .metric-sub {
          font-size: 11.5px;
          color: #64748b;
        }
        .two-col-layout {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .two-col-layout {
            grid-template-columns: 1fr;
          }
        }
        .apps-column {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .app-card {
          background: rgba(15, 23, 42, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 10px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .app-card:hover {
          border-color: rgba(56, 189, 248, 0.4);
        }
        .app-card.selected {
          border-color: #38bdf8;
          background: rgba(15, 23, 42, 0.95);
          box-shadow: 0 0 16px rgba(56, 189, 248, 0.15);
        }
        .tag-pill {
          font-size: 10.5px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.06);
          color: #94a3b8;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .tag-pill.live {
          background: rgba(34, 197, 94, 0.15);
          color: #4ade80;
          border-color: rgba(34, 197, 94, 0.3);
        }
        .key-box-mini {
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 6px;
          padding: 6px 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          color: #cbd5e1;
        }
        .key-box-mini code {
          color: #38bdf8;
          font-weight: 700;
        }
        .inspector-panel {
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(56, 189, 248, 0.25);
          border-radius: 12px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .tab-nav {
          display: flex;
          gap: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 12px;
        }
        .tab-btn {
          background: transparent;
          border: 1px solid transparent;
          color: #94a3b8;
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.12s;
        }
        .tab-btn:hover {
          color: #f1f5f9;
          background: rgba(255, 255, 255, 0.04);
        }
        .tab-btn.active {
          color: #38bdf8;
          background: rgba(56, 189, 248, 0.12);
          border-color: rgba(56, 189, 248, 0.3);
        }
        .rooms-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12.5px;
          text-align: left;
        }
        .rooms-table th {
          padding: 10px 14px;
          color: #94a3b8;
          font-weight: 600;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .rooms-table td {
          padding: 12px 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          color: #f1f5f9;
        }
        .rooms-table tr:hover td {
          background: rgba(255, 255, 255, 0.02);
        }
        .empty-banner {
          padding: 32px;
          text-align: center;
          color: #64748b;
          font-size: 13px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          border: 1px dashed rgba(255, 255, 255, 0.08);
        }
        .log-terminal {
          background: #050811;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 12px 16px;
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-size: 11.5px;
          line-height: 1.6;
          max-height: 180px;
          overflow-y: auto;
          color: #94a3b8;
        }
        .log-entry {
          display: flex;
          gap: 10px;
        }
        .log-time { color: #475569; }
        .log-text { color: #38bdf8; }
        .log-join { color: #4ade80; }
        .log-leave { color: #f87171; }
        .code-box {
          background: #050811;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 14px 16px;
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-size: 12px;
          line-height: 1.6;
          overflow-x: auto;
          color: #e2e8f0;
          white-space: pre;
        }
        .subtab-row {
          display: flex;
          gap: 6px;
          margin-bottom: 12px;
        }
        .subtab-btn {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #94a3b8;
          font-family: inherit;
          font-size: 11.5px;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
        }
        .subtab-btn.active {
          background: #0284c7;
          color: #fff;
          border-color: #38bdf8;
        }
      </style>

      <!-- Dashboard Top Header -->
      <header class="dash-topbar">
        <div class="dash-topbar-inner">
          <div class="dash-brand-wrap">
            <span class="dash-logo-badge">MEREB</span>
            <span class="dash-section-name">/ Cloud Console</span>
            <span class="tag-pill live" style="margin-left: 6px;">● Cloudflare Edge Global</span>
          </div>

          <div class="dash-topbar-actions">
            <div class="user-pill-dropdown">
              <img src="${user.avatar}" alt="${user.username}" class="user-avatar" />
              <span class="user-name">${user.username}</span>
              <button class="btn-logout" title="Sign out">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Container -->
      <main class="dash-main-container">
        <!-- Title & Action Row -->
        <div class="console-header-row">
          <div>
            <h1 class="dash-page-title" style="font-size: 26px; font-weight: 800; color: #fff;">Cloud Apps & Netcode Stats</h1>
            <p class="dash-page-desc" style="color: #94a3b8; margin-top: 4px; font-size: 13.5px;">
              Engine-agnostic multiplayer signaling, CCU tracking & global leaderboards on Cloudflare edge.
            </p>
          </div>
          <div class="dash-title-actions" style="display: flex; gap: 10px;">
            <button class="btn-subtle pill-btn" id="btn-sync-edge">🔄 Refresh</button>
            <button class="btn-primary pill-btn" id="btn-create-app-modal">+ New App</button>
          </div>
        </div>

        <!-- Real Cloudflare & Edge Stats (Zero Mock Data) -->
        <div class="dash-metrics-grid">
          <div class="dash-metric-card">
            <div class="metric-top">
              <span class="metric-title">Live Players (CCU)</span>
              <span class="status-live-dot"></span>
            </div>
            <div class="metric-number text-signal">${totalCCU}</div>
            <div class="metric-sub">Connected players right now</div>
          </div>

          <div class="dash-metric-card">
            <div class="metric-top">
              <span class="metric-title">Active Rooms</span>
              <span class="metric-icon">⚔️</span>
            </div>
            <div class="metric-number">${totalRooms}</div>
            <div class="metric-sub">Live multiplayer match rooms</div>
          </div>

          <div class="dash-metric-card">
            <div class="metric-top">
              <span class="metric-title">Cloudflare Edge Requests</span>
              <span class="metric-icon">⚡</span>
            </div>
            <div class="metric-number">${dailyReqs.toLocaleString()}</div>
            <div class="metric-sub">${((dailyReqs / dailyLimit) * 100).toFixed(2)}% of 100,000 Free Tier / day</div>
          </div>

          <div class="dash-metric-card">
            <div class="metric-top">
              <span class="metric-title">Leaderboard Scores</span>
              <span class="metric-icon">🏆</span>
            </div>
            <div class="metric-number">${totalScores.toLocaleString()}</div>
            <div class="metric-sub">Highscores logged in Durable Objects</div>
          </div>
        </div>

        <!-- Two-Column Architecture: Apps List (Left) + Inspector / Tools (Right) -->
        <div class="two-col-layout">
          <!-- Left Column: Apps List -->
          <div class="apps-column">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h2 style="font-size: 15px; font-weight: 700; color: #e2e8f0; text-transform: uppercase; letter-spacing: 0.5px;">
                Your Apps (${apps.length})
              </h2>
            </div>

            ${apps.map((app, idx) => `
              <div class="app-card ${idx === this.selectedGameIndex ? 'selected' : ''}" data-idx="${idx}">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <div style="font-weight: 800; font-size: 15px; color: #f8fafc;">${app.name}</div>
                  <span class="tag-pill ${app.activeCCU > 0 ? 'live' : ''}">${app.activeCCU || 0} CCU</span>
                </div>

                <div class="key-box-mini">
                  <span>App ID: <code>${app.id}</code></span>
                  <button class="btn-subtle pill-btn btn-copy-appid" data-id="${app.id}" style="padding: 2px 6px; font-size: 9.5px;">Copy</button>
                </div>

                <div class="key-box-mini" style="font-size: 10.5px;">
                  <span style="color: #64748b;">Key: <code>${(app.apiKey || 'mb_live_...').slice(0, 14)}...</code></span>
                  <button class="btn-subtle pill-btn btn-copy-key" data-key="${app.apiKey || app.id}" style="padding: 2px 6px; font-size: 9.5px;">Copy Key</button>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                  <span style="font-size: 11px; color: #64748b;">${app.activeRooms || 0} active rooms</span>
                  ${apps.length > 1 ? `
                    <button class="btn-danger-icon btn-app-delete" data-id="${app.id}" title="Delete app" style="padding: 4px;">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Right Column: Inspector Panel with Tabs -->
          ${selectedApp ? `
            <div class="inspector-panel">
              <!-- Top App Info & Navigation Tabs -->
              <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
                <div>
                  <h2 style="font-size: 18px; font-weight: 800; color: #f8fafc;">
                    ${selectedApp.name}
                  </h2>
                  <p style="font-size: 12px; color: #94a3b8; margin-top: 3px;">
                    App ID: <code style="color: #38bdf8;">${selectedApp.id}</code> &bull; Partitioned Durable Object Realm
                  </p>
                </div>

                <div style="display: flex; gap: 8px;">
                  <button class="btn-subtle pill-btn btn-copy-ws" data-ws="wss://${host.replace(/^https?:\/\//, '')}/party/?appId=${selectedApp.id}">
                    Copy WS URL
                  </button>
                </div>
              </div>

              <!-- Main Navigation Tabs -->
              <div class="tab-nav">
                <button class="tab-btn ${this.activeTab === 'rooms' ? 'active' : ''}" data-tab="rooms">
                  ⚡ Live Rooms & Netcode
                </button>
                <button class="tab-btn ${this.activeTab === 'leaderboard' ? 'active' : ''}" data-tab="leaderboard">
                  🏆 Leaderboards (${this.leaderboard.length})
                </button>
                <button class="tab-btn ${this.activeTab === 'engine' ? 'active' : ''}" data-tab="engine">
                  🎮 Godot & Engine SDK
                </button>
              </div>

              <!-- TAB 1: Live Rooms & Edge Logs -->
              ${this.activeTab === 'rooms' ? `
                <div style="display: flex; flex-direction: column; gap: 18px;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 12px; font-weight: 700; color: #cbd5e1; text-transform: uppercase;">
                      Active Match Rooms (${selectedAppRooms.length})
                    </span>
                    <span style="font-size: 11px; color: #64748b;">Auto-updates as peers connect</span>
                  </div>

                  ${selectedAppRooms.length > 0 ? `
                    <table class="rooms-table">
                      <thead>
                        <tr>
                          <th>Room Code</th>
                          <th>Status</th>
                          <th>Connected Peers</th>
                          <th>Host Peer ID</th>
                          <th>Started</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${selectedAppRooms.map(r => `
                          <tr>
                            <td><code style="color: #38bdf8; font-weight: 700;">${r.roomId}</code></td>
                            <td>
                              <span class="tag-pill ${r.playerCount >= 2 ? 'live' : ''}">
                                ${r.playerCount >= 2 ? '⚔️ Match Live' : '⏳ Waiting for Peer'}
                              </span>
                            </td>
                            <td><strong>${r.playerCount}</strong></td>
                            <td><code style="color: #94a3b8; font-size: 11px;">${r.hostId || 'N/A'}</code></td>
                            <td style="color: #64748b; font-size: 11px;">${new Date(r.createdAt).toLocaleTimeString()}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  ` : `
                    <div class="empty-banner">
                      No active rooms right now for <strong>${selectedApp.name}</strong>.<br/>
                      When players launch the game or connect via WebSocket, their sessions appear here instantly.
                    </div>
                  `}

                  <!-- Edge Telemetry Stream -->
                  <div style="display: flex; flex-direction: column; gap: 8px;">
                    <span style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">
                      Live Edge Telemetry Log Stream
                    </span>
                    <div class="log-terminal">
                      ${recentLogs.length > 0 ? recentLogs.map(l => `
                        <div class="log-entry">
                          <span class="log-time">[${l.time}]</span>
                          <span class="log-text ${l.type === 'join' ? 'log-join' : l.type === 'leave' ? 'log-leave' : ''}">${l.message}</span>
                        </div>
                      `).join('') : `
                        <div style="color: #475569;">[${new Date().toLocaleTimeString()}] Listening for real-time edge connections...</div>
                      `}
                    </div>
                  </div>
                </div>
              ` : ''}

              <!-- TAB 2: Leaderboards -->
              ${this.activeTab === 'leaderboard' ? `
                <div style="display: flex; flex-direction: column; gap: 18px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <div>
                      <span style="font-size: 12px; font-weight: 700; color: #cbd5e1; text-transform: uppercase;">
                        Global Highscores (Cloudflare DO Storage)
                      </span>
                      <p style="font-size: 12px; color: #64748b; margin-top: 2px;">
                        Rest API: <code>/api/apps/${selectedApp.id}/leaderboard</code>
                      </p>
                    </div>

                    ${this.leaderboard.length > 0 ? `
                      <button class="btn-subtle pill-btn btn-clear-lb" style="color: #f87171; border-color: rgba(239, 68, 68, 0.3);">
                        Reset Leaderboard
                      </button>
                    ` : ''}
                  </div>

                  <!-- Quick Interactive Score Tester -->
                  <div style="background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 14px; display: flex; flex-wrap: wrap; gap: 10px; align-items: center;">
                    <input type="text" id="test-lb-player" placeholder="Player Name" class="modal-input" style="flex: 1; min-width: 130px;" />
                    <input type="number" id="test-lb-score" placeholder="Score (e.g. 1500)" class="modal-input" style="flex: 1; min-width: 110px;" />
                    <button class="btn-primary pill-btn" id="btn-submit-test-score" style="white-space: nowrap;">
                      Submit Test Score
                    </button>
                  </div>

                  <!-- Leaderboard Table -->
                  ${this.leaderboard.length > 0 ? `
                    <table class="rooms-table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Player</th>
                          <th>Score</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${this.leaderboard.map((e, idx) => `
                          <tr>
                            <td style="font-weight: 800; color: ${idx === 0 ? '#facc15' : idx === 1 ? '#e2e8f0' : idx === 2 ? '#cd7f32' : '#94a3b8'};">
                              #${idx + 1}
                            </td>
                            <td><strong style="color: #f8fafc;">${e.player}</strong></td>
                            <td><code style="color: #38bdf8; font-weight: 800; font-size: 13px;">${e.score.toLocaleString()}</code></td>
                            <td style="color: #64748b; font-size: 11px;">${new Date(e.createdAt || e.date).toLocaleDateString()}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  ` : `
                    <div class="empty-banner">
                      No highscores submitted yet for <strong>${selectedApp.name}</strong>.<br/>
                      Use the test form above or call the REST API from Godot to log your first score!
                    </div>
                  `}
                </div>
              ` : ''}

              <!-- TAB 3: Godot & Engine Quickstart -->
              ${this.activeTab === 'engine' ? `
                <div style="display: flex; flex-direction: column; gap: 14px;">
                  <div class="subtab-row">
                    <button class="subtab-btn ${this.activeEngineTab === 'godot' ? 'active' : ''}" data-eng="godot">Godot 4 (GDScript)</button>
                    <button class="subtab-btn ${this.activeEngineTab === 'web' ? 'active' : ''}" data-eng="web">Web & JS</button>
                    <button class="subtab-btn ${this.activeEngineTab === 'curl' ? 'active' : ''}" data-eng="curl">cURL & REST</button>
                  </div>

                  ${this.activeEngineTab === 'godot' ? `
                    <div class="code-box"># Mereb Netcode & Leaderboard Client for Godot 4
extends Node

var ws = WebSocketPeer.new()
const APP_ID = "${selectedApp.id}"
const SERVER_URL = "wss://mereb-signaling.dawitbaslyos.workers.dev/party/ROOM_123?appId=" + APP_ID

func _ready():
    # 1. Connect to Real-time Multiplayer Signaling Room
    var err = ws.connect_to_url(SERVER_URL)
    if err != OK:
        print("Failed to connect: ", err)

func _process(_delta):
    ws.poll()
    var state = ws.get_ready_state()
    if state == WebSocketPeer.STATE_OPEN:
        while ws.get_available_packet_count():
            var packet = ws.get_packet().get_string_from_utf8()
            print("Received from Mereb: ", packet)

# 2. Submit Highscore to Cloudflare Leaderboard
func submit_score(player_name: String, score: int):
    var http = HTTPRequest.new()
    add_child(http)
    var url = "https://mereb-signaling.dawitbaslyos.workers.dev/api/apps/" + APP_ID + "/leaderboard"
    var headers = ["Content-Type: application/json"]
    var payload = JSON.stringify({ "player": player_name, "score": score })
    http.request(url, headers, HTTPClient.METHOD_POST, payload)</div>
                  ` : ''}

                  ${this.activeEngineTab === 'web' ? `
                    <div class="code-box">// Mereb Client for Web (Three.js / Canvas)
const APP_ID = "${selectedApp.id}";
const ws = new WebSocket(\`wss://mereb-signaling.dawitbaslyos.workers.dev/party/ROOM_123?appId=\${APP_ID}\`);

ws.onopen = () => console.log('Connected to Mereb room!');
ws.onmessage = (e) => console.log('Peer message:', JSON.parse(e.data));

// Submit Highscore
await fetch(\`https://mereb-signaling.dawitbaslyos.workers.dev/api/apps/\${APP_ID}/leaderboard\`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ player: 'AceGamer', score: 2500 })
});</div>
                  ` : ''}

                  ${this.activeEngineTab === 'curl' ? `
                    <div class="code-box"># 1. Fetch Global Leaderboard
curl https://mereb-signaling.dawitbaslyos.workers.dev/api/apps/${selectedApp.id}/leaderboard

# 2. Submit Highscore
curl -X POST https://mereb-signaling.dawitbaslyos.workers.dev/api/apps/${selectedApp.id}/leaderboard \\
  -H "Content-Type: application/json" \\
  -d '{"player": "Alex", "score": 1250}'

# 3. Check App Live Telemetry
curl https://mereb-signaling.dawitbaslyos.workers.dev/api/apps/${selectedApp.id}</div>
                  ` : ''}
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>
      </main>

      <!-- Create New App Modal (Pure Photon Style: Only Name Required!) -->
      <div class="dash-modal-backdrop" id="modal-create-app" style="display: none;">
        <div class="dash-modal-card">
          <h3 class="modal-title">Create Cloud App</h3>
          <p class="modal-desc">
            Instantly allocates a multi-tenant namespace on Cloudflare edge. Any engine (Godot, Unity, Web) connects using this single App ID.
          </p>
          
          <div style="display: flex; flex-direction: column; gap: 14px; margin-top: 8px;">
            <div>
              <label style="font-size: 12px; font-weight: 600; color: #94a3b8;">App Name</label>
              <input type="text" class="modal-input" id="new-app-name" placeholder="e.g. Godot Arena Battle" maxlength="50" style="width: 100%; box-sizing: border-box; margin-top: 4px;" />
            </div>

            <div class="key-box-mini">
              <span style="font-size: 11px; color: #94a3b8;">Generated App ID:</span>
              <code id="preview-app-id">godot-arena-battle</code>
            </div>
          </div>

          <div class="modal-actions" style="margin-top: 18px;">
            <button class="btn-subtle pill-btn" id="btn-modal-cancel">Cancel</button>
            <button class="btn-primary pill-btn" id="btn-modal-submit">Create App</button>
          </div>
        </div>
      </div>
    `;

    this._wireEvents();
  }

  _wireEvents() {
    // Logout
    this.element.querySelector('.btn-logout')?.addEventListener('click', () => {
      auth.logout();
      if (this.onNavigateHome) this.onNavigateHome();
    });

    // Refresh Button
    this.element.querySelector('#btn-sync-edge')?.addEventListener('click', async (e) => {
      const btn = e.target;
      const orig = btn.innerText;
      btn.innerText = 'Syncing...';
      await auth.syncWithEdge();
      await this._loadCurrentLeaderboard();
      this.render();
      btn.innerText = 'Synced! ✓';
      setTimeout(() => { btn.innerText = orig; }, 1200);
    });

    // Navigation Tabs
    this.element.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const tab = btn.getAttribute('data-tab');
        this.activeTab = tab;
        if (tab === 'leaderboard') {
          await this._loadCurrentLeaderboard();
        }
        this.render();
      });
    });

    // Engine SDK Subtabs
    this.element.querySelectorAll('.subtab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeEngineTab = btn.getAttribute('data-eng');
        this.render();
      });
    });

    // Select App Card
    this.element.querySelectorAll('.app-card').forEach(card => {
      card.addEventListener('click', async (e) => {
        if (e.target.closest('button')) return;
        const idx = parseInt(card.getAttribute('data-idx'), 10);
        this.selectedGameIndex = idx;
        await this._loadCurrentLeaderboard();
        this.render();
      });
    });

    // Copy App ID
    this.element.querySelectorAll('.btn-copy-appid').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (id) {
          await navigator.clipboard.writeText(id);
          const orig = btn.innerText;
          btn.innerText = 'Copied!';
          setTimeout(() => { btn.innerText = orig; }, 1400);
        }
      });
    });

    // Copy API Key
    this.element.querySelectorAll('.btn-copy-key').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const key = btn.getAttribute('data-key');
        if (key) {
          await navigator.clipboard.writeText(key);
          const orig = btn.innerText;
          btn.innerText = 'Copied!';
          setTimeout(() => { btn.innerText = orig; }, 1400);
        }
      });
    });

    // Copy WebSocket URL
    this.element.querySelector('.btn-copy-ws')?.addEventListener('click', async (e) => {
      const ws = e.target.getAttribute('data-ws');
      if (ws) {
        await navigator.clipboard.writeText(ws);
        const orig = e.target.innerText;
        e.target.innerText = 'Copied! ✓';
        setTimeout(() => { e.target.innerText = orig; }, 1400);
      }
    });

    // Submit Test Score
    this.element.querySelector('#btn-submit-test-score')?.addEventListener('click', async () => {
      const apps = auth.getGames();
      const selected = apps[this.selectedGameIndex] || apps[0];
      if (!selected) return;

      const playerInput = this.element.querySelector('#test-lb-player');
      const scoreInput = this.element.querySelector('#test-lb-score');
      const player = playerInput.value.trim() || 'GodotPlayer';
      const score = parseFloat(scoreInput.value) || 100;

      const btn = this.element.querySelector('#btn-submit-test-score');
      btn.innerText = 'Submitting...';
      try {
        await auth.submitScore(selected.id, player, score);
        await this._loadCurrentLeaderboard();
        this.render();
      } catch (err) {
        alert(err.message);
        btn.innerText = 'Submit Test Score';
      }
    });

    // Clear Leaderboard
    this.element.querySelector('.btn-clear-lb')?.addEventListener('click', async () => {
      const apps = auth.getGames();
      const selected = apps[this.selectedGameIndex] || apps[0];
      if (!selected) return;

      if (confirm(`Reset leaderboard for ${selected.name}?`)) {
        await auth.clearLeaderboard(selected.id);
        await this._loadCurrentLeaderboard();
        this.render();
      }
    });

    // Delete App
    this.element.querySelectorAll('.btn-app-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (id && confirm(`Delete App "${id}"? This will terminate its rooms and leaderboards.`)) {
          auth.deleteApp(id);
          this.selectedGameIndex = 0;
          this.render();
        }
      });
    });

    // Modal Create App
    const modal = this.element.querySelector('#modal-create-app');
    const openBtn = this.element.querySelector('#btn-create-app-modal');
    const cancelBtn = this.element.querySelector('#btn-modal-cancel');
    const submitBtn = this.element.querySelector('#btn-modal-submit');
    const nameInput = this.element.querySelector('#new-app-name');
    const previewAppId = this.element.querySelector('#preview-app-id');

    nameInput?.addEventListener('input', (e) => {
      const slug = e.target.value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'my-app';
      if (previewAppId) previewAppId.innerText = slug;
    });

    openBtn?.addEventListener('click', () => {
      modal.style.display = 'flex';
      nameInput.value = '';
      if (previewAppId) previewAppId.innerText = 'godot-arena-battle';
      nameInput.focus();
    });

    cancelBtn?.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    submitBtn?.addEventListener('click', async () => {
      const name = nameInput.value.trim();
      if (!name) return;

      try {
        auth.createApp(name);
        modal.style.display = 'none';
        this.selectedGameIndex = auth.getGames().length - 1;
        await this._loadCurrentLeaderboard();
        this.render();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  getElement() {
    return this.element;
  }
}
