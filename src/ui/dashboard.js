/**
 * Mereb Cloud - Game Studio & Multiplayer Management Dashboard
 * Photon-style Multi-Game Catalog, AppID manager, Edge Telemetry & Zero-Cost Tracker.
 */
import { auth } from './auth.js';

export class DashboardUI {
  constructor({ onNavigateHome, onLaunchGame }) {
    this.onNavigateHome = onNavigateHome;
    this.onLaunchGame = onLaunchGame;
    this.element = document.createElement('div');
    this.element.className = 'dashboard-root';
    this.selectedGameIndex = 0;

    auth.onChange(() => {
      this.render();
    });

    // Sync live metrics and catalog from Cloudflare Edge
    auth.syncWithEdge().then(() => {
      this.render();
    });

    this.render();
  }

  render() {
    const user = auth.getUser();
    const games = auth.getGames();
    const metrics = auth.getCloudMetrics();
    const selectedGame = games[this.selectedGameIndex] || games[0] || null;

    if (!user) {
      this.element.innerHTML = `
        <div class="dash-empty-state">
          <h2>Authentication Required</h2>
          <p>Please sign in with GitHub to access the Mereb Cloud Dashboard.</p>
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
    const totalMatches = games.reduce((acc, g) => acc + (g.totalMatches || 0), 0);

    this.element.innerHTML = `
      <!-- Dashboard Top Header -->
      <header class="dash-topbar">
        <div class="dash-topbar-inner">
          <div class="dash-brand-wrap">
            <span class="dash-logo">MEREB</span>
            <span class="dash-slash">/</span>
            <span class="dash-section-name">Game Studio Cloud</span>
            <span class="pill-badge pill-free">
              Cloudflare Edge Free Tier ($0.00 / mo)
            </span>
          </div>

          <div class="dash-topbar-actions">
            <button class="btn-subtle pill-btn btn-dash-home">← Back to Site</button>
            <button class="btn-subtle pill-btn btn-dash-play">🎮 Play Arena Demo</button>
            
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
        <div class="dash-title-row">
          <div>
            <h1 class="dash-page-title">Game Studio & Network Telemetry</h1>
            <p class="dash-page-desc">Manage game App IDs, copy AI integration prompts, and monitor edge traffic & costs.</p>
          </div>
          <div class="dash-title-actions">
            <button class="btn-subtle pill-btn" id="btn-sync-edge">🔄 Sync Edge Stats</button>
            <button class="btn-primary pill-btn" id="btn-create-game-modal">+ Register New Game</button>
          </div>
        </div>

        <!-- Metric Cards Grid (Photon CCU & Free-Tier Cost Metrics) -->
        <div class="dash-metrics-grid">
          <div class="dash-metric-card">
            <div class="metric-top">
              <span class="metric-title">Total Active CCU</span>
              <span class="status-live-dot"></span>
            </div>
            <div class="metric-number text-signal">${totalCCU}</div>
            <div class="metric-sub">Live concurrent web players</div>
          </div>

          <div class="dash-metric-card">
            <div class="metric-top">
              <span class="metric-title">Catalog Games</span>
              <span class="metric-icon">🎮</span>
            </div>
            <div class="metric-number">${games.length}</div>
            <div class="metric-sub">Dedicated App ID universes</div>
          </div>

          <div class="dash-metric-card">
            <div class="metric-top">
              <span class="metric-title">Daily Edge Quota</span>
              <span class="metric-icon">⚡</span>
            </div>
            <div class="metric-number text-accent">${metrics.quotaUsedPercent}%</div>
            <div class="metric-sub">${metrics.dailyRequests} / ${metrics.dailyQuotaLimit} free requests</div>
          </div>

          <div class="dash-metric-card">
            <div class="metric-top">
              <span class="metric-title">Photon Savings</span>
              <span class="metric-icon">💰</span>
            </div>
            <div class="metric-number text-signal">+$${metrics.savedCostVsPhotonUSD || 45}.00</div>
            <div class="metric-sub">Monthly savings vs Photon Engine</div>
          </div>
        </div>

        <!-- Game Catalog Section (Photon AppID Manager) -->
        <div class="dash-card projects-card">
          <div class="card-title-row">
            <div>
              <h2 class="card-heading">My Game Catalog & App IDs</h2>
              <p class="card-subheading">
                Each game operates in an isolated Cloudflare edge namespace. Click <strong>"Copy AI Prompt"</strong> to hand the setup to any AI assistant.
              </p>
            </div>
          </div>

          <div class="projects-list">
            ${games.map((g, idx) => `
              <div class="project-row ${idx === this.selectedGameIndex ? 'project-selected' : ''}" data-idx="${idx}">
                <div class="project-info">
                  <div class="project-name-wrap">
                    <span class="project-name">${g.name}</span>
                    <span class="pill-badge pill-status">${g.genre}</span>
                    <span class="pill-badge pill-active">${g.maxPlayers} Players</span>
                  </div>
                  <div class="project-meta">
                    <span>App ID: <code>${g.id}</code></span>
                    <span>•</span>
                    <span>Matches: ${g.totalMatches || 0}</span>
                    <span>•</span>
                    <span>Messages: ${g.totalMessages || 0}</span>
                    <span>•</span>
                    <span>Created: ${g.createdAt}</span>
                  </div>
                </div>

                <div class="project-actions">
                  <button class="btn-subtle pill-btn btn-copy-api" data-url="${host}/api/games/${g.id}" title="Copy Single API link">
                    🔗 Copy API Link
                  </button>
                  <button class="btn-primary pill-btn btn-copy-prompt" data-id="${g.id}" data-name="${g.name}">
                    🤖 Copy AI Prompt
                  </button>
                  ${games.length > 1 ? `
                    <button class="btn-danger-icon btn-game-delete" data-id="${g.id}" title="Delete game from catalog">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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

        <!-- Selected Game Quickstart & AI Integration Card -->
        ${selectedGame ? `
          <div class="dash-card api-key-card">
            <div class="card-title-row">
              <div>
                <h2 class="card-heading">Selected Game: ${selectedGame.name} (App ID: <code>${selectedGame.id}</code>)</h2>
                <p class="card-subheading">
                  AI Integration link: <code>${host}/api/games/${selectedGame.id}</code>
                </p>
              </div>
              <button class="btn-primary pill-btn btn-copy-prompt" data-id="${selectedGame.id}" data-name="${selectedGame.name}">
                📋 Copy AI Integration Prompt
              </button>
            </div>

            <div class="quickstart-snippet">
              <div class="snippet-header">
                <span>Multiplayer Integration Code (Photon-Style SDK)</span>
                <span class="snippet-lang">JavaScript / TypeScript</span>
              </div>
              <pre class="snippet-code"><code>import { MerebClient, defineSchema, TouchControls } from 'mereb-netcode';

// 1. Initialize with this game's isolated App ID
const net = new MerebClient({
  appId: '${selectedGame.id}',
  host: 'mereb-signaling.dawitbaslyos.workers.dev',
  botTimeoutMs: 8000
});

// 2. Define game state schema (Photon-style declarative packing)
export const StateSchema = defineSchema({
  x: 'fixed16',
  y: 'fixed16',
  rotation: 'fixed16',
  score: 'uint8',
  health: 'uint8'
});

// 3. Connect & synchronize over sub-5ms WebRTC DataChannels!
net.on('match-start', ({ role, isHost }) => {
  console.log('Match live in ${selectedGame.name}!');
});</code></pre>
            </div>
          </div>
        ` : ''}
      </main>

      <!-- Register New Game Modal -->
      <div class="dash-modal-backdrop" id="modal-create-game" style="display: none;">
        <div class="dash-modal-card">
          <h3 class="modal-title">Register New Game in Catalog</h3>
          <p class="modal-desc">
            Creates a dedicated App ID and edge signaling namespace for your new game on Cloudflare Durable Objects.
          </p>
          
          <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 4px;">
            <label style="font-size: 12px; font-weight: 600; color: #94a3b8;">Game Title</label>
            <input type="text" class="modal-input" id="new-game-name" placeholder="e.g. Cyber Kart 2088" maxlength="50" />

            <label style="font-size: 12px; font-weight: 600; color: #94a3b8;">Genre</label>
            <select class="modal-input" id="new-game-genre">
              <option value="Top-Down Shooter">Top-Down Shooter</option>
              <option value="2D Kart Arcade">2D Kart Arcade</option>
              <option value="Party Brawler">Party Brawler</option>
              <option value="Turn-Based Strategy">Turn-Based Strategy</option>
              <option value="Hypercasual Canvas">Hypercasual Canvas</option>
              <option value="Physics Arena">Physics Arena</option>
            </select>

            <label style="font-size: 12px; font-weight: 600; color: #94a3b8;">Match Capacity</label>
            <select class="modal-input" id="new-game-players">
              <option value="2">2 Players (1v1 Competitive)</option>
              <option value="4">4 Players (Party Mode)</option>
              <option value="8">8 Players (Arena Mayhem)</option>
            </select>
          </div>

          <div class="modal-actions" style="margin-top: 14px;">
            <button class="btn-subtle pill-btn" id="btn-modal-cancel">Cancel</button>
            <button class="btn-primary pill-btn" id="btn-modal-submit">Create Game API</button>
          </div>
        </div>
      </div>
    `;

    this._wireEvents();
  }

  _wireEvents() {
    // Navigation
    this.element.querySelector('.btn-dash-home')?.addEventListener('click', () => {
      if (this.onNavigateHome) this.onNavigateHome();
    });

    this.element.querySelector('.btn-dash-play')?.addEventListener('click', () => {
      if (this.onLaunchGame) this.onLaunchGame();
    });

    // Logout
    this.element.querySelector('.btn-logout')?.addEventListener('click', () => {
      auth.logout();
      if (this.onNavigateHome) this.onNavigateHome();
    });

    // Sync Edge Stats Button
    this.element.querySelector('#btn-sync-edge')?.addEventListener('click', async (e) => {
      const btn = e.target;
      const orig = btn.innerText;
      btn.innerText = 'Syncing...';
      await auth.syncWithEdge();
      btn.innerText = 'Synced! ✓';
      setTimeout(() => { btn.innerText = orig; }, 1500);
    });

    // Select Game Row
    this.element.querySelectorAll('.project-row').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        const idx = parseInt(row.getAttribute('data-idx'), 10);
        this.selectedGameIndex = idx;
        this.render();
      });
    });

    // Copy API Link
    this.element.querySelectorAll('.btn-copy-api').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const url = btn.getAttribute('data-url');
        if (url) {
          await navigator.clipboard.writeText(url);
          const orig = btn.innerText;
          btn.innerText = 'Link Copied! ✓';
          setTimeout(() => { btn.innerText = orig; }, 1500);
        }
      });
    });

    // Copy AI Setup Prompt
    this.element.querySelectorAll('.btn-copy-prompt').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        const host = 'https://mereb-signaling.dawitbaslyos.workers.dev';
        const prompt = `I want to add real-time multiplayer to "${name}" using Mereb Netcode Engine.
App ID: '${id}'
Signaling Server: '${host}'
Follow MEREB_INTEGRATION_SPEC:
1. Initialize MerebClient with { appId: '${id}', host: '${host}' }.
2. Declare our game's state with defineSchema().
3. Attach TouchControls for mobile virtual joysticks and MerebLobby.
4. Synchronize state over WebRTC DataChannels using SnapshotInterpolator.
5. Mount MerebTerminal for live in-game diagnostics and network lag simulation.`;

        await navigator.clipboard.writeText(prompt);
        const orig = btn.innerText;
        btn.innerText = 'Prompt Copied! 📋';
        setTimeout(() => { btn.innerText = orig; }, 1500);
      });
    });

    // Delete Game
    this.element.querySelectorAll('.btn-game-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (id && confirm(`Delete game "${id}" from catalog?`)) {
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

    openBtn?.addEventListener('click', () => {
      modal.style.display = 'flex';
      nameInput.value = '';
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
      } catch (err) {
        alert(err.message);
      }
    });
  }

  getElement() {
    return this.element;
  }
}
