/**
 * Mereb Cloud - Pure Developer Console
 * Real Game APIs management, live edge connection tracking, active rooms inspector,
 * and zero mock data.
 */
import { auth } from './auth.js';

export class DashboardUI {
  constructor({ onNavigateHome, onLaunchGame }) {
    this.onNavigateHome = onNavigateHome;
    this.onLaunchGame = onLaunchGame;
    this.element = document.createElement('div');
    this.element.className = 'dashboard-root';
    this.selectedGameIndex = 0;
    this.pollInterval = null;

    auth.onChange(() => {
      this.render();
    });

    // Initial background sync with edge catalog
    auth.syncWithEdge().then(() => {
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

  render() {
    const user = auth.getUser();
    const games = auth.getGames();
    const activeRooms = auth.getActiveRooms();
    const recentLogs = auth.getRecentLogs();
    const selectedGame = games[this.selectedGameIndex] || games[0] || null;

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
    const totalCCU = games.reduce((acc, g) => acc + (g.activeCCU || 0), 0);
    const totalRooms = activeRooms.length;

    // Filter active rooms for selected game
    const selectedGameRooms = selectedGame
      ? activeRooms.filter(r => r.appId === selectedGame.id)
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
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
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
          font-size: 28px;
          font-weight: 900;
          color: #f1f5f9;
        }
        .metric-sub {
          font-size: 11.5px;
          color: #64748b;
        }
        .games-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 16px;
        }
        .game-api-card {
          background: rgba(15, 23, 42, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .game-api-card:hover {
          border-color: rgba(56, 189, 248, 0.4);
          transform: translateY(-2px);
        }
        .game-api-card.selected {
          border-color: #38bdf8;
          background: rgba(15, 23, 42, 0.95);
          box-shadow: 0 0 20px rgba(56, 189, 248, 0.15);
        }
        .game-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }
        .game-card-title {
          font-size: 16px;
          font-weight: 800;
          color: #f8fafc;
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
          padding: 8px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11.5px;
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          color: #cbd5e1;
        }
        .key-box-mini code {
          color: #38bdf8;
          font-weight: 700;
        }
        .card-actions-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-card-action {
          flex: 1;
          background: rgba(30, 41, 59, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #e2e8f0;
          font-family: inherit;
          font-size: 11.5px;
          font-weight: 600;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.12s;
        }
        .btn-card-action:hover {
          background: rgba(56, 189, 248, 0.15);
          border-color: #38bdf8;
          color: #fff;
        }
        .inspector-card {
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(56, 189, 248, 0.3);
          border-radius: 12px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
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
        .empty-rooms-banner {
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
      </style>

      <!-- Dashboard Top Header (Clean Minimalist) -->
      <header class="dash-topbar">
        <div class="dash-topbar-inner">
          <div class="dash-brand-wrap">
            <span class="dash-logo-badge">MEREB</span>
            <span class="dash-section-name">/ Console</span>
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

      <!-- Main Dashboard Container -->
      <main class="dash-main-container">
        <!-- Title & Action Row -->
        <div class="console-header-row">
          <div>
            <h1 class="dash-page-title" style="font-size: 26px; font-weight: 800; color: #fff;">Game APIs & Live Telemetry</h1>
            <p class="dash-page-desc" style="color: #94a3b8; margin-top: 4px; font-size: 13.5px;">
              Create game APIs and track active rooms & live connections in real time.
            </p>
          </div>
          <div class="dash-title-actions" style="display: flex; gap: 10px;">
            <button class="btn-subtle pill-btn" id="btn-sync-edge">🔄 Refresh</button>
            <button class="btn-primary pill-btn" id="btn-create-game-modal">+ Create Game API</button>
          </div>
        </div>

        <!-- Real Metrics Grid (Zero Mock Data) -->
        <div class="dash-metrics-grid">
          <div class="dash-metric-card">
            <div class="metric-top">
              <span class="metric-title">Live Players (CCU)</span>
              <span class="status-live-dot"></span>
            </div>
            <div class="metric-number text-signal">${totalCCU}</div>
            <div class="metric-sub">Active players connected right now</div>
          </div>

          <div class="dash-metric-card">
            <div class="metric-top">
              <span class="metric-title">Active Rooms</span>
              <span class="metric-icon">⚔️</span>
            </div>
            <div class="metric-number">${totalRooms}</div>
            <div class="metric-sub">Currently running P2P matches</div>
          </div>

          <div class="dash-metric-card">
            <div class="metric-top">
              <span class="metric-title">Registered APIs</span>
              <span class="metric-icon">📁</span>
            </div>
            <div class="metric-number">${games.length}</div>
            <div class="metric-sub">Partitioned edge realms</div>
          </div>
        </div>

        <!-- Game APIs List Section -->
        <div style="display: flex; flex-direction: column; gap: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h2 class="card-heading" style="font-size: 16px; font-weight: 700; color: #e2e8f0;">My Game APIs</h2>
            <span style="font-size: 12px; color: #64748b;">Click a game to inspect live connections</span>
          </div>

          <div class="games-grid">
            ${games.map((g, idx) => `
              <div class="game-api-card ${idx === this.selectedGameIndex ? 'selected' : ''}" data-idx="${idx}">
                <div class="game-card-header">
                  <div>
                    <div class="game-card-title">${g.name}</div>
                    <div style="display: flex; gap: 6px; margin-top: 4px;">
                      <span class="tag-pill">${g.genre || 'Arcade'}</span>
                      <span class="tag-pill">${g.maxPlayers || 2} Players</span>
                      <span class="tag-pill live">● Edge Ready</span>
                    </div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 14px; font-weight: 800; color: #4ade80;">${g.activeCCU || 0} CCU</div>
                    <div style="font-size: 11px; color: #64748b;">${g.activeRooms || 0} Rooms</div>
                  </div>
                </div>

                <div class="key-box-mini">
                  <span>App ID: <code>${g.id}</code></span>
                  <button class="btn-subtle pill-btn btn-copy-appid" data-id="${g.id}" style="padding: 2px 8px; font-size: 10px;">Copy ID</button>
                </div>

                <div class="card-actions-row">
                  <button class="btn-card-action btn-copy-endpoint" data-url="${host}/api/games/${g.id}">
                    🔗 Copy Endpoint
                  </button>
                  ${games.length > 1 ? `
                    <button class="btn-danger-icon btn-game-delete" data-id="${g.id}" title="Delete game API" style="padding: 6px;">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Live Connection & Room Inspector (Replacing the giant static code snippet) -->
        ${selectedGame ? `
          <div class="inspector-card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
              <div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <h2 style="font-size: 17px; font-weight: 800; color: #f8fafc;">
                    Live Connection Inspector: ${selectedGame.name}
                  </h2>
                  <span class="tag-pill live">● Auto-Syncing (3.5s)</span>
                </div>
                <p style="font-size: 12.5px; color: #94a3b8; margin-top: 4px;">
                  Real-time rooms and peer sessions active on Cloudflare edge for App ID <code>${selectedGame.id}</code>.
                </p>
              </div>

              <div style="display: flex; gap: 8px;">
                <button class="btn-subtle pill-btn btn-copy-ws" data-ws="wss://${host.replace(/^https?:\/\//, '')}/?appId=${selectedGame.id}">
                  Copy WebSocket URL
                </button>
                <button class="btn-subtle pill-btn btn-copy-endpoint" data-url="${host}/api/games/${selectedGame.id}">
                  Copy REST API URL
                </button>
              </div>
            </div>

            <!-- Active Rooms Table -->
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 12px; font-weight: 700; color: #cbd5e1; text-transform: uppercase;">
                  Active Rooms (${selectedGameRooms.length})
                </span>
                <span style="font-size: 11px; color: #64748b;">Auto-updates as players join or leave</span>
              </div>

              ${selectedGameRooms.length > 0 ? `
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
                    ${selectedGameRooms.map(r => `
                      <tr>
                        <td><code style="color: #38bdf8; font-weight: 700; font-size: 13px;">${r.roomId}</code></td>
                        <td>
                          <span class="tag-pill ${r.playerCount >= 2 ? 'live' : ''}">
                            ${r.playerCount >= 2 ? '⚔️ Match Live' : '⏳ Waiting for Peer'}
                          </span>
                        </td>
                        <td><strong>${r.playerCount}</strong> / ${selectedGame.maxPlayers || 2}</td>
                        <td><code style="color: #94a3b8; font-size: 11px;">${r.hostId || 'N/A'}</code></td>
                        <td style="color: #64748b; font-size: 11px;">${new Date(r.createdAt).toLocaleTimeString()}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : `
                <div class="empty-rooms-banner">
                  No active rooms right now for <strong>${selectedGame.name}</strong>.<br/>
                  When players join via <code>${selectedGame.id}</code>, their live connections will appear here.
                </div>
              `}
            </div>

            <!-- Live Edge Event Feed -->
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <span style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">
                Edge Telemetry Log Stream
              </span>
              <div class="log-terminal">
                ${recentLogs.length > 0 ? recentLogs.map(l => `
                  <div class="log-entry">
                    <span class="log-time">[${l.time}]</span>
                    <span class="log-text ${l.type === 'join' ? 'log-join' : l.type === 'leave' ? 'log-leave' : ''}">${l.message}</span>
                  </div>
                `).join('') : `
                  <div style="color: #475569;">[${new Date().toLocaleTimeString()}] Console listening for real-time edge room events...</div>
                `}
              </div>
            </div>
          </div>
        ` : ''}
      </main>

      <!-- Create New Game API Modal -->
      <div class="dash-modal-backdrop" id="modal-create-game" style="display: none;">
        <div class="dash-modal-card">
          <h3 class="modal-title">Create New Game API</h3>
          <p class="modal-desc">
            Instantly creates an isolated edge namespace and App ID for your game on Cloudflare Durable Objects.
          </p>
          
          <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 4px;">
            <div>
              <label style="font-size: 12px; font-weight: 600; color: #94a3b8;">Game Title</label>
              <input type="text" class="modal-input" id="new-game-name" placeholder="e.g. Cyber Kart" maxlength="50" style="width: 100%; box-sizing: border-box; margin-top: 4px;" />
            </div>

            <div style="display: flex; gap: 10px;">
              <div style="flex: 1;">
                <label style="font-size: 12px; font-weight: 600; color: #94a3b8;">Genre</label>
                <select class="modal-input" id="new-game-genre" style="width: 100%; box-sizing: border-box; margin-top: 4px;">
                  <option value="Top-Down Shooter">Top-Down Shooter</option>
                  <option value="2D Kart Arcade">2D Kart Arcade</option>
                  <option value="Party Brawler">Party Brawler</option>
                  <option value="Turn-Based Strategy">Turn-Based Strategy</option>
                  <option value="Hypercasual Canvas">Hypercasual Canvas</option>
                </select>
              </div>

              <div style="flex: 1;">
                <label style="font-size: 12px; font-weight: 600; color: #94a3b8;">Max Players</label>
                <select class="modal-input" id="new-game-players" style="width: 100%; box-sizing: border-box; margin-top: 4px;">
                  <option value="2">2 Players (1v1)</option>
                  <option value="4">4 Players (Party)</option>
                  <option value="8">8 Players (Arena)</option>
                </select>
              </div>
            </div>

            <div class="key-box-mini">
              <span style="font-size: 11px; color: #94a3b8;">Generated App ID:</span>
              <code id="preview-app-id">cyber-kart</code>
            </div>
          </div>

          <div class="modal-actions" style="margin-top: 16px;">
            <button class="btn-subtle pill-btn" id="btn-modal-cancel">Cancel</button>
            <button class="btn-primary pill-btn" id="btn-modal-submit">Create API</button>
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
      btn.innerText = 'Synced! ✓';
      setTimeout(() => { btn.innerText = orig; }, 1200);
    });

    // Select Game Card
    this.element.querySelectorAll('.game-api-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        const idx = parseInt(card.getAttribute('data-idx'), 10);
        this.selectedGameIndex = idx;
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

    // Copy Endpoint
    this.element.querySelectorAll('.btn-copy-endpoint').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const url = btn.getAttribute('data-url');
        if (url) {
          await navigator.clipboard.writeText(url);
          const orig = btn.innerText;
          btn.innerText = 'Copied! ✓';
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

    // Delete Game API
    this.element.querySelectorAll('.btn-game-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (id && confirm(`Delete Game API "${id}"?`)) {
          auth.deleteGame(id);
          this.selectedGameIndex = 0;
        }
      });
    });

    // Modal Create Game
    const modal = this.element.querySelector('#modal-create-game');
    const openBtn = this.element.querySelector('#btn-create-game-modal');
    const cancelBtn = this.element.querySelector('#btn-modal-cancel');
    const submitBtn = this.element.querySelector('#btn-modal-submit');
    const nameInput = this.element.querySelector('#new-game-name');
    const genreInput = this.element.querySelector('#new-game-genre');
    const playersInput = this.element.querySelector('#new-game-players');
    const previewAppId = this.element.querySelector('#preview-app-id');

    nameInput?.addEventListener('input', (e) => {
      const slug = e.target.value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'my-game';
      if (previewAppId) previewAppId.innerText = slug;
    });

    openBtn?.addEventListener('click', () => {
      modal.style.display = 'flex';
      nameInput.value = '';
      if (previewAppId) previewAppId.innerText = 'my-game';
      nameInput.focus();
    });

    cancelBtn?.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    submitBtn?.addEventListener('click', () => {
      const name = nameInput.value.trim();
      if (!name) return;
      const genre = genreInput.value;
      const maxPlayers = playersInput.value;

      try {
        auth.addGame(name, genre, maxPlayers);
        modal.style.display = 'none';
        this.selectedGameIndex = auth.getGames().length - 1;
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
