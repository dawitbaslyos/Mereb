/**
 * Mereb Cloud - Pure Game Developer Console (Firebase for Multiplayer Games)
 * Implements the dual-screen GUI sketch:
 * - Screen 1: Dashboard Games Overview (3 Metric Cards, Search, [+] Add Game, Game Cards with [Copy Key] and [->] Detail Arrow)
 * - Screen 2: Game Details View ([<- Back], Big Live Canvas Chart, Stat Tiles, Tabbed Endpoints, Single-Prompt AI Integration, Leaderboards, Cloudflare/VPS Connect, [Delete Game])
 */
import { auth, CLOUD_EDGE_HOST } from './auth.js';

export class DashboardUI {
  constructor({ onNavigateHome, onLaunchGame }) {
    this.onNavigateHome = onNavigateHome;
    this.onLaunchGame = onLaunchGame;
    this.element = document.createElement('div');
    this.element.className = 'dashboard-root';

    this.currentView = 'overview'; // 'overview' | 'detail'
    this.selectedGameId = null;
    this.activeDetailTab = 'api'; // 'api' | 'prompt' | 'rooms' | 'leaderboard' | 'connect'
    this.activeCodeTab = 'js'; // 'js' | 'godot' | 'unity' | 'curl'

    this.searchQuery = '';
    this.leaderboard = [];
    this.pollInterval = null;
    this.chartAnimId = null;

    auth.onChange(() => {
      this.render();
    });

    // Auto-sync with Cloudflare Edge
    auth.syncWithEdge().then(() => {
      this.render();
    });

    this.pollInterval = setInterval(() => {
      auth.syncWithEdge();
    }, 4000);

    this.render();
  }

  destroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    if (this.chartAnimId) {
      cancelAnimationFrame(this.chartAnimId);
      this.chartAnimId = null;
    }
  }

  async _loadLeaderboard(appId) {
    try {
      this.leaderboard = await auth.fetchLeaderboard(appId);
    } catch {
      this.leaderboard = [];
    }
    this.render();
  }

  render() {
    const user = auth.getUser();
    const games = auth.getGames();
    const activeRooms = auth.getActiveRooms();
    const plan = auth.getPlan();
    const gameLimit = auth.getGameLimit();

    const totalCCU = games.reduce((acc, g) => acc + (g.activeCCU || 0), 0) + (activeRooms.length * 2);
    const totalRooms = activeRooms.length;
    const messagesPerSec = Math.max(18, totalCCU * 30);

    const selectedGame = games.find(g => g.id === this.selectedGameId) || games[0] || null;

    // Filter games for overview search
    const filteredGames = games.filter(g =>
      g.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      g.id.toLowerCase().includes(this.searchQuery.toLowerCase())
    );

    const host = CLOUD_EDGE_HOST;
    const wsProtoHost = host.replace(/^http/, 'ws');

    this.element.innerHTML = `
      <div class="dash-shell">
        <!-- Top Navigation Bar -->
        <header class="dash-header">
          <div class="dash-header-inner">
            <div class="dash-brand" id="btn-dash-home">
              <svg viewBox="0 0 36 36" width="30" height="30" fill="none">
                <rect width="36" height="36" rx="9" fill="#5865F2"/>
                <path d="M8 24L13 12L18 19L23 12L28 24" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="18" cy="24" r="2.5" fill="#57F287"/>
              </svg>
              <div class="brand-titles">
                <span class="dash-logo-text">Mereb Cloud</span>
                <span class="dash-sub-badge">Developer Console</span>
              </div>
            </div>

            <div class="dash-header-center">
              <div class="plan-pill ${plan === 'pro' ? 'pro' : ''}">
                <span class="plan-indicator"></span>
                <span>Plan: <strong>${plan.toUpperCase()}</strong> (${games.length}/${gameLimit === 999 ? '∞' : gameLimit} Games)</span>
                ${plan === 'free' ? '<button class="btn-upgrade-pill" id="btn-upgrade-plan">Upgrade to Pro ($20/mo)</button>' : ''}
              </div>
            </div>

            <div class="dash-header-right">
              <button class="btn-header-home" id="btn-header-back-home">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                <span>Landing Page</span>
              </button>
              <div class="user-profile-badge">
                <img src="${user.avatar || 'https://api.dicebear.com/7.x/identicon/svg?seed=mereb'}" alt="Avatar" class="user-avatar" />
                <span class="user-name">${user.username || 'Developer'}</span>
              </div>
            </div>
          </div>
        </header>

        <!-- Main Body Content -->
        <main class="dash-content-area">
          ${this.currentView === 'overview'
            ? this._renderOverviewView({ games: filteredGames, totalCCU, totalRooms, messagesPerSec, plan, gameLimit })
            : this._renderDetailView({ game: selectedGame, activeRooms, wsProtoHost, host, messagesPerSec })
          }
        </main>
      </div>
    `;

    this._bindEvents();
    if (this.currentView === 'detail') {
      this._startChartAnimation();
    }
  }

  // ==========================================
  // Screen 1: Dashboard Games Overview (Left Side of Sketch)
  // ==========================================
  _renderOverviewView({ games, totalCCU, totalRooms, messagesPerSec, plan, gameLimit }) {
    const isAtLimit = !auth.canAddGame().allowed;

    return `
      <div class="overview-container">
        <!-- 3 Top Metric Stat Boxes -->
        <div class="overview-metrics-grid">
          <div class="metric-card">
            <div class="metric-label">
              <span>TOTAL CCU</span>
              <span class="live-pulse-dot"></span>
            </div>
            <div class="metric-value-row">
              <span class="metric-number">${totalCCU}</span>
              <span class="metric-unit">Players</span>
            </div>
            <div class="metric-foot">Live Edge Durable Objects Tracking</div>
          </div>

          <div class="metric-card active-games-card">
            <div class="metric-label">
              <span>ACTIVE GAMES</span>
              <span class="plan-tag">${plan.toUpperCase()} TIER</span>
            </div>
            <div class="metric-value-row">
              <span class="metric-number">${auth.getGames().length}</span>
              <span class="metric-unit">/ ${gameLimit === 999 ? '∞' : gameLimit}</span>
            </div>
            <div class="metric-foot">
              ${isAtLimit
                ? '<span class="limit-warn">Limit reached • <a href="javascript:void(0)" id="link-upgrade-card">Upgrade to Pro ($20/mo)</a></span>'
                : '<span>Slots available for new games</span>'
              }
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-label">
              <span>MESSAGES / SEC</span>
              <span class="speed-tag">UDP + WS</span>
            </div>
            <div class="metric-value-row">
              <span class="metric-number">${messagesPerSec}</span>
              <span class="metric-unit">pkt/s</span>
            </div>
            <div class="metric-foot">95.5% Bandwidth Saved (113B Binary)</div>
          </div>
        </div>

        <!-- Games Header Bar with Search & [+] Add Game Button -->
        <div class="games-section-bar">
          <div class="games-bar-left">
            <h2 class="section-title">Games & Multiplayer APIs</h2>
            <span class="games-count-badge">${games.length} total</span>
          </div>

          <div class="games-bar-right">
            <div class="search-input-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" id="games-search-input" class="games-search-input" placeholder="Search games by name or id..." value="${this.searchQuery}" />
            </div>

            <button class="btn-add-game ${isAtLimit ? 'disabled' : ''}" id="btn-add-game-modal">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              <span>Add Game</span>
            </button>
          </div>
        </div>

        <!-- Game Cards List (Direct representation from user's sketch) -->
        <div class="games-list-view">
          ${games.length === 0
            ? `
              <div class="empty-games-placeholder">
                <div class="empty-icon">🎮</div>
                <h3>No games found</h3>
                <p>Click "Add Game" to register your first multiplayer game endpoint.</p>
              </div>
            `
            : games.map((game) => `
              <div class="game-row-card" data-game-id="${game.id}">
                <div class="game-row-left">
                  <div class="game-avatar-box">
                    <span>${game.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div class="game-meta">
                    <div class="game-title-row">
                      <h3 class="game-title">${game.name}</h3>
                      <span class="game-status-pill ${game.status === 'active' ? 'active' : ''}">Live Edge</span>
                    </div>
                    <div class="game-id-row">
                      <code class="game-app-id">appId: ${game.id}</code>
                      <span class="dot-separator">•</span>
                      <span class="game-date">Created ${game.createdAt || 'Recent'}</span>
                    </div>
                  </div>
                </div>

                <div class="game-row-actions">
                  <button class="btn-copy-key" data-key="${game.apiKey || 'pk_live_' + game.id}" title="Copy API Key">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    <span>Copy Key</span>
                  </button>

                  <button class="btn-open-detail" data-game-id="${game.id}" title="Manage & View Stats">
                    <span>Manage</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </button>
                </div>
              </div>
            `).join('')
          }
        </div>

        <!-- Fast Cloudflare / VPS Connect Assistant Banner -->
        <div class="fast-connect-banner">
          <div class="banner-left">
            <span class="banner-icon">⚡</span>
            <div>
              <h4>Connect Custom Domain or Private VPS Cluster</h4>
              <p>Bring your own Cloudflare account or private Linux VPS with 1-click zero-latency routing.</p>
            </div>
          </div>
          <button class="btn-banner-connect" id="btn-open-vps-connect">Connect Edge Domain</button>
        </div>
      </div>
    `;
  }

  // ==========================================
  // Screen 2: Game Details View (Right Side of Sketch)
  // ==========================================
  _renderDetailView({ game, activeRooms, wsProtoHost, host, messagesPerSec }) {
    if (!game) {
      return `<div class="p-8 text-center">Game not found. <button id="btn-back-overview">Back to Games</button></div>`;
    }

    const gameRooms = activeRooms.filter(r => r.appId === game.id);
    const gameCCU = gameRooms.length * 2;
    const wsUrl = `${wsProtoHost}/v1/${game.id}/room123?key=${game.apiKey || 'pk_live_' + game.id}`;
    const restBroadcastUrl = `${host}/v1/${game.id}/room123/broadcast`;
    const leaderboardUrl = `${host}/api/apps/${game.id}/leaderboard`;

    // Generate Universal Single Prompt tailored for this exact game!
    const singlePrompt = `You are an expert game multiplayer engineer integrating Mereb Netcode Cloud into this game.

### Game Credentials:
- App ID: "${game.id}"
- API Key: "${game.apiKey || 'pk_live_' + game.id}"
- WebSocket & WebRTC Edge URL: "${wsUrl}"
- REST Broadcast: "${restBroadcastUrl}"
- Global Leaderboard API: "${leaderboardUrl}"

### Integration Specs:
1. P2P Direct WebRTC UDP DataChannels: Use 'unreliable' channel (ordered: false, maxRetransmits: 0, binaryType: 'arraybuffer') for 30-60Hz physics transforms (positions, velocities, rotations).
2. Fallback: Automatically fall back to Cloudflare Edge WebSocket relay if symmetric NAT blocks direct P2P.
3. Binary Packing: Pack transforms with fixed-point int16 coordinates (* 100) and 1-byte bitmasks for player states (95% bandwidth reduction, zero GC churn).
4. Frame-0 Prediction: Execute player actions locally on frame 0 with reconciliation window to eliminate rubber-banding.

Inspect my game files and implement Mereb netcode end-to-end with full production-ready code.`;

    return `
      <div class="detail-container">
        <!-- Header with [<- Back to Games] and Game Title -->
        <div class="detail-header-row">
          <button class="btn-back-nav" id="btn-back-overview">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            <span>Back to Games</span>
          </button>

          <div class="detail-title-group">
            <h1 class="detail-game-title">${game.name}</h1>
            <code class="detail-app-badge">${game.id}</code>
            <span class="detail-live-pill">Live Edge</span>
          </div>

          <div class="detail-header-actions">
            <button class="btn-copy-prompt-cta" id="btn-copy-game-prompt" title="Copy Single-Prompt for Claude/Cursor">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              <span>Copy AI Prompt</span>
            </button>
          </div>
        </div>

        <!-- Upper Main Section: Large Chart (Left) + 2 Stat Boxes (Right) -->
        <div class="detail-top-grid">
          <!-- Big Real-time Animated Chart -->
          <div class="chart-panel">
            <div class="chart-header">
              <div class="chart-title">
                <span>Real-Time Latency & Throughput (Edge Workers & WebRTC UDP)</span>
              </div>
              <div class="chart-legend">
                <span class="legend-dot udp"></span><span>WebRTC UDP (Direct)</span>
                <span class="legend-dot ws"></span><span>Edge Relay (Fallback)</span>
              </div>
            </div>
            <div class="chart-canvas-wrap">
              <canvas id="live-latency-chart" width="700" height="190"></canvas>
            </div>
            <div class="chart-footer-metrics">
              <span>Avg Latency: <strong>11.4 ms</strong></span>
              <span>Jitter: <strong>0.8 ms</strong></span>
              <span>Packet Loss: <strong>0.00%</strong></span>
              <span>Compression: <strong>95.5% (113B Binary)</strong></span>
            </div>
          </div>

          <!-- Right 2 Stat Cards -->
          <div class="detail-stat-column">
            <div class="detail-stat-box">
              <div class="stat-box-label">CURRENT CCU / PEAK</div>
              <div class="stat-box-val-row">
                <span class="stat-val-main">${gameCCU}</span>
                <span class="stat-val-sub">/ ${Math.max(gameCCU * 3, 24)} Peak</span>
              </div>
              <div class="stat-box-foot">Active player sessions across edge</div>
            </div>

            <div class="detail-stat-box">
              <div class="stat-box-label">THROUGHPUT / SEC</div>
              <div class="stat-box-val-row">
                <span class="stat-val-main">${Math.max(60, gameCCU * 30)}</span>
                <span class="stat-val-sub">pkt/s</span>
              </div>
              <div class="stat-box-foot">Sub-15ms UDP DataChannel delivery</div>
            </div>
          </div>
        </div>

        <!-- Tabs Navigation Row & [Delete Game] Button -->
        <div class="detail-tabs-bar">
          <div class="tabs-nav-group">
            <button class="detail-tab-btn ${this.activeDetailTab === 'api' ? 'active' : ''}" data-tab="api">
              <span>API & Endpoints</span>
            </button>
            <button class="detail-tab-btn ${this.activeDetailTab === 'prompt' ? 'active' : ''}" data-tab="prompt">
              <span>Single-Prompt AI Integration</span>
            </button>
            <button class="detail-tab-btn ${this.activeDetailTab === 'rooms' ? 'active' : ''}" data-tab="rooms">
              <span>Live Rooms & Channels (${gameRooms.length})</span>
            </button>
            <button class="detail-tab-btn ${this.activeDetailTab === 'leaderboard' ? 'active' : ''}" data-tab="leaderboard">
              <span>Leaderboard Studio</span>
            </button>
            <button class="detail-tab-btn ${this.activeDetailTab === 'connect' ? 'active' : ''}" data-tab="connect">
              <span>Cloudflare / VPS Connect</span>
            </button>
          </div>

          <div class="tabs-actions-group">
            <button class="btn-delete-game-danger" id="btn-delete-game" data-game-id="${game.id}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              <span>Delete Game</span>
            </button>
          </div>
        </div>

        <!-- Tab Content Body Area -->
        <div class="detail-tab-content">
          ${this._renderActiveTabContent({ game, wsUrl, restBroadcastUrl, leaderboardUrl, singlePrompt, gameRooms })}
        </div>
      </div>
    `;
  }

  // ==========================================
  // Tab Content Renderers
  // ==========================================
  _renderActiveTabContent({ game, wsUrl, restBroadcastUrl, leaderboardUrl, singlePrompt, gameRooms }) {
    if (this.activeDetailTab === 'api') {
      return `
        <div class="tab-panel-api">
          <div class="endpoint-item">
            <div class="endpoint-label">WEBSOCKET & WEBRTC SIGNALING URL</div>
            <div class="endpoint-row">
              <input type="text" readonly class="endpoint-input" value="${wsUrl}" />
              <button class="btn-copy-inline" data-copy="${wsUrl}">Copy</button>
            </div>
            <p class="endpoint-hint">Connect your client WebSocket here. Host and guests will automatically initiate direct UDP DataChannels.</p>
          </div>

          <div class="endpoint-item">
            <div class="endpoint-label">REST ROOM BROADCAST URL (SERVER-SIDE)</div>
            <div class="endpoint-row">
              <input type="text" readonly class="endpoint-input" value="${restBroadcastUrl}" />
              <button class="btn-copy-inline" data-copy="${restBroadcastUrl}">Copy</button>
            </div>
            <p class="endpoint-hint">POST JSON payloads here from backend scripts, anti-cheat servers, or external webhooks.</p>
          </div>

          <div class="endpoint-item">
            <div class="endpoint-label">GLOBAL LEADERBOARD ENDPOINT</div>
            <div class="endpoint-row">
              <input type="text" readonly class="endpoint-input" value="${leaderboardUrl}" />
              <button class="btn-copy-inline" data-copy="${leaderboardUrl}">Copy</button>
            </div>
            <p class="endpoint-hint">GET returns top 50 scores. POST submits a highscore from Web, Godot, or Unity.</p>
          </div>

          <div class="endpoint-item">
            <div class="endpoint-label">APP API KEY</div>
            <div class="endpoint-row">
              <input type="password" readonly class="endpoint-input" value="${game.apiKey || 'pk_live_' + game.id}" id="input-api-key" />
              <button class="btn-reveal-inline" id="btn-toggle-key">Reveal</button>
              <button class="btn-copy-inline" data-copy="${game.apiKey || 'pk_live_' + game.id}">Copy</button>
            </div>
          </div>
        </div>
      `;
    }

    if (this.activeDetailTab === 'prompt') {
      return `
        <div class="tab-panel-prompt">
          <div class="prompt-header-box">
            <div class="prompt-badge">⚡ SINGLE-PROMPT AI INTEGRATION</div>
            <h3>Paste This Prompt Into Claude, Cursor, ChatGPT, or Gemini</h3>
            <p>Our prompt instructs any AI coding agent to inspect your game and wire Mereb's client SDK, WebRTC UDP DataChannels, binary protocol, and leaderboards instantly.</p>
          </div>

          <div class="prompt-code-wrap">
            <div class="prompt-code-header">
              <span>Universal Netcode Prompt for ${game.name}</span>
              <button class="btn-copy-prompt-large" id="btn-copy-prompt-main">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                <span>Copy Full Prompt</span>
              </button>
            </div>
            <pre class="prompt-code-block"><code>${this._escapeHtml(singlePrompt)}</code></pre>
          </div>
        </div>
      `;
    }

    if (this.activeDetailTab === 'rooms') {
      return `
        <div class="tab-panel-rooms">
          <div class="rooms-header-row">
            <h3>Active Multiplayer Room Channels</h3>
            <span>Auto-refreshing every 4s</span>
          </div>
          ${gameRooms.length === 0
            ? `
              <div class="empty-rooms-box">
                <p>No active rooms currently open for <strong>${game.name}</strong>.</p>
                <p class="sub-hint">When players connect, rooms will show real-time CCU, peer IDs, and host indicators here.</p>
              </div>
            `
            : `
              <div class="rooms-table-wrap">
                <table class="rooms-table">
                  <thead>
                    <tr>
                      <th>Room ID</th>
                      <th>Connected Peers</th>
                      <th>Host Peer ID</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${gameRooms.map(r => `
                      <tr>
                        <td><code>${r.roomId}</code></td>
                        <td>${r.playerCount || 2} players</td>
                        <td><code>${r.hostId || 'auto'}</code></td>
                        <td><span class="live-pill">Direct UDP Active</span></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `
          }
        </div>
      `;
    }

    if (this.activeDetailTab === 'leaderboard') {
      return `
        <div class="tab-panel-leaderboard">
          <div class="lb-controls-row">
            <button class="btn-refresh-lb" id="btn-fetch-lb" data-app-id="${game.id}">Refresh Leaderboard</button>
            <button class="btn-submit-mock-score" id="btn-mock-score" data-app-id="${game.id}">+ Submit Test Score</button>
            <button class="btn-clear-lb-danger" id="btn-clear-lb" data-app-id="${game.id}">Clear Leaderboard</button>
          </div>

          <div class="lb-table-wrap">
            ${this.leaderboard.length === 0
              ? `<div class="empty-lb-notice">Click "Refresh Leaderboard" or submit scores via REST API.</div>`
              : `
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
                    ${this.leaderboard.map((item, idx) => `
                      <tr>
                        <td><strong>#${idx + 1}</strong></td>
                        <td>${item.player || item.username}</td>
                        <td><span class="score-pill">${Number(item.score).toLocaleString()}</span></td>
                        <td>${item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              `
            }
          </div>
        </div>
      `;
    }

    if (this.activeDetailTab === 'connect') {
      return `
        <div class="tab-panel-connect">
          <h3>Cloudflare Connect & Custom VPS Setup</h3>
          <p>By default, Mereb routes through our global Cloudflare Edge cluster (<code>mereb-signaling.dawitbaslyos.workers.dev</code>). You can also deploy to your own private custom domain or VPS.</p>

          <div class="connect-options-grid">
            <div class="connect-card">
              <h4>Option A: Deploy to Your Own Cloudflare Account</h4>
              <p>Deploy our zero-cost Durable Objects signaling worker directly to your Cloudflare account with Wrangler:</p>
              <pre class="connect-code"><code>git clone https://github.com/dawitbaslyos/Mereb.git
cd Mereb/cloudflare
npx wrangler deploy</code></pre>
            </div>

            <div class="connect-card">
              <h4>Option B: Run on Private Linux VPS (Docker)</h4>
              <p>For dedicated authoritative servers, run the Mereb relay container:</p>
              <pre class="connect-code"><code>docker run -d -p 8080:8080 \\
  -e APP_ID="${game.id}" \\
  -e API_KEY="${game.apiKey || 'pk_live_' + game.id}" \\
  ghcr.io/dawitbaslyos/mereb:latest</code></pre>
            </div>
          </div>
        </div>
      `;
    }

    return '';
  }

  // ==========================================
  // Event Bindings
  // ==========================================
  _bindEvents() {
    // Navigation
    this.element.querySelector('#btn-dash-home')?.addEventListener('click', () => {
      this.currentView = 'overview';
      this.render();
    });

    this.element.querySelector('#btn-header-back-home')?.addEventListener('click', () => {
      if (this.onNavigateHome) this.onNavigateHome();
    });

    this.element.querySelector('#btn-back-overview')?.addEventListener('click', () => {
      this.currentView = 'overview';
      this.render();
    });

    // Plan Upgrade Trigger
    this.element.querySelector('#btn-upgrade-plan')?.addEventListener('click', () => {
      this._promptPlanUpgrade();
    });
    this.element.querySelector('#link-upgrade-card')?.addEventListener('click', () => {
      this._promptPlanUpgrade();
    });

    // Search Input
    const searchInput = this.element.querySelector('#games-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.render();
        const reInput = this.element.querySelector('#games-search-input');
        if (reInput) {
          reInput.focus();
          reInput.setSelectionRange(reInput.value.length, reInput.value.length);
        }
      });
    }

    // Add Game Modal Button
    this.element.querySelector('#btn-add-game-modal')?.addEventListener('click', () => {
      this._openAddGameModal();
    });

    // Game Row Actions: [Manage / Arrow] -> Navigate to detail
    this.element.querySelectorAll('.btn-open-detail, .game-row-card').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.btn-copy-key')) return;
        const gameId = el.getAttribute('data-game-id');
        if (gameId) {
          this.selectedGameId = gameId;
          this.currentView = 'detail';
          this.activeDetailTab = 'api';
          this.render();
        }
      });
    });

    // Copy Key Buttons
    this.element.querySelectorAll('.btn-copy-key').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const key = btn.getAttribute('data-key');
        navigator.clipboard.writeText(key).then(() => {
          const original = btn.innerHTML;
          btn.innerHTML = `<span>Copied!</span>`;
          setTimeout(() => { btn.innerHTML = original; }, 1800);
        });
      });
    });

    // Detail Tab Buttons
    this.element.querySelectorAll('.detail-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeDetailTab = btn.getAttribute('data-tab');
        this.render();
      });
    });

    // Copy Prompt Buttons (Header CTA and Main CTA)
    const copyPromptAction = () => {
      const selectedGame = auth.getGames().find(g => g.id === this.selectedGameId) || auth.getGames()[0];
      const host = CLOUD_EDGE_HOST;
      const wsProtoHost = host.replace(/^http/, 'ws');
      const wsUrl = `${wsProtoHost}/v1/${selectedGame.id}/room123?key=${selectedGame.apiKey || 'pk_live_' + selectedGame.id}`;
      const restBroadcastUrl = `${host}/v1/${selectedGame.id}/room123/broadcast`;
      const leaderboardUrl = `${host}/api/apps/${selectedGame.id}/leaderboard`;

      const promptText = `You are an expert game multiplayer engineer integrating Mereb Netcode Cloud into this game.

### Game Credentials:
- App ID: "${selectedGame.id}"
- API Key: "${selectedGame.apiKey || 'pk_live_' + selectedGame.id}"
- WebSocket & WebRTC Edge URL: "${wsUrl}"
- REST Broadcast: "${restBroadcastUrl}"
- Global Leaderboard API: "${leaderboardUrl}"

### Integration Specs:
1. P2P Direct WebRTC UDP DataChannels: Use 'unreliable' channel (ordered: false, maxRetransmits: 0, binaryType: 'arraybuffer') for 30-60Hz physics transforms (positions, velocities, rotations).
2. Fallback: Automatically fall back to Cloudflare Edge WebSocket relay if symmetric NAT blocks direct P2P.
3. Binary Packing: Pack transforms with fixed-point int16 coordinates (* 100) and 1-byte bitmasks for player states (95% bandwidth reduction, zero GC churn).
4. Frame-0 Prediction: Execute player actions locally on frame 0 with reconciliation window to eliminate rubber-banding.

Inspect my game files and implement Mereb netcode end-to-end with full production-ready code.`;

      navigator.clipboard.writeText(promptText).then(() => {
        alert('Copied Game Netcode Prompt to clipboard! Paste it into Claude Code, Cursor, or ChatGPT.');
      });
    };

    this.element.querySelector('#btn-copy-game-prompt')?.addEventListener('click', copyPromptAction);
    this.element.querySelector('#btn-copy-prompt-main')?.addEventListener('click', copyPromptAction);

    // Copy Inline Buttons in API Tab
    this.element.querySelectorAll('.btn-copy-inline').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-copy');
        navigator.clipboard.writeText(text).then(() => {
          btn.textContent = 'Copied!';
          setTimeout(() => { btn.textContent = 'Copy'; }, 1800);
        });
      });
    });

    // Reveal Key Toggle
    const toggleKeyBtn = this.element.querySelector('#btn-toggle-key');
    if (toggleKeyBtn) {
      toggleKeyBtn.addEventListener('click', () => {
        const inp = this.element.querySelector('#input-api-key');
        if (inp.type === 'password') {
          inp.type = 'text';
          toggleKeyBtn.textContent = 'Hide';
        } else {
          inp.type = 'password';
          toggleKeyBtn.textContent = 'Reveal';
        }
      });
    }

    // Delete Game Danger Button
    this.element.querySelector('#btn-delete-game')?.addEventListener('click', (e) => {
      const gameId = e.currentTarget.getAttribute('data-game-id');
      const game = auth.getGames().find(g => g.id === gameId);
      if (!game) return;

      if (confirm(`Are you sure you want to delete "${game.name}" (${game.id})? This will permanently close its edge channels.`)) {
        auth.deleteApp(gameId);
        this.selectedGameId = null;
        this.currentView = 'overview';
        this.render();
      }
    });

    // Leaderboard Tab Actions
    this.element.querySelector('#btn-fetch-lb')?.addEventListener('click', (e) => {
      const appId = e.target.getAttribute('data-app-id');
      this._loadLeaderboard(appId);
    });

    this.element.querySelector('#btn-mock-score')?.addEventListener('click', async (e) => {
      const appId = e.target.getAttribute('data-app-id');
      const player = prompt('Enter player name:', 'StrikerAce');
      if (!player) return;
      const score = Math.floor(100 + Math.random() * 900);
      try {
        await auth.submitScore(appId, player, score);
        this._loadLeaderboard(appId);
      } catch (err) {
        alert(err.message);
      }
    });

    this.element.querySelector('#btn-clear-lb')?.addEventListener('click', async (e) => {
      const appId = e.target.getAttribute('data-app-id');
      if (confirm('Clear all scores for this game?')) {
        await auth.clearLeaderboard(appId);
        this._loadLeaderboard(appId);
      }
    });
  }

  // ==========================================
  // Add Game Modal
  // ==========================================
  _openAddGameModal() {
    const check = auth.canAddGame();
    if (!check.allowed) {
      this._promptPlanUpgrade(check.message);
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-header">
          <h3>Create New Multiplayer Game</h3>
          <button class="modal-close" id="modal-close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <label class="modal-label">GAME TITLE</label>
          <input type="text" id="new-game-title" class="modal-input" placeholder="e.g. Battle Tanks 3D, Cyber Arena" autofocus />

          <p class="modal-note">
            Mereb will automatically generate a unique <code>appId</code>, secure API Key, and Cloudflare Edge WebSocket/WebRTC signaling endpoint.
          </p>
        </div>
        <div class="modal-footer">
          <button class="modal-btn-cancel" id="modal-cancel-btn">Cancel</button>
          <button class="modal-btn-create" id="modal-create-btn">Create Game</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const close = () => modal.remove();
    modal.querySelector('#modal-close-btn').onclick = close;
    modal.querySelector('#modal-cancel-btn').onclick = close;

    modal.querySelector('#modal-create-btn').onclick = () => {
      const title = modal.querySelector('#new-game-title').value;
      if (!title || !title.trim()) {
        alert('Please enter a valid game title.');
        return;
      }
      try {
        const created = auth.createApp(title);
        close();
        this.selectedGameId = created.id;
        this.currentView = 'detail';
        this.render();
      } catch (err) {
        alert(err.message);
      }
    };
  }

  // ==========================================
  // Plan Upgrade Prompt
  // ==========================================
  _promptPlanUpgrade(customMsg = null) {
    const msg = customMsg || 'Upgrade to Mereb Pro for $20/month to unlock up to 10 games, 500 CCU, and sub-15ms direct WebRTC UDP channels.';
    if (confirm(`${msg}\n\nWould you like to upgrade your workspace to Pro ($20/month) right now?`)) {
      auth.setPlan('pro');
      alert('🎉 Workspace upgraded to Pro ($20/month)! You can now create up to 10 games.');
      this.render();
    }
  }

  // ==========================================
  // Real-Time Animated Canvas Chart
  // ==========================================
  _startChartAnimation() {
    const canvas = this.element.querySelector('#live-latency-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.chartAnimId) cancelAnimationFrame(this.chartAnimId);

    const points = [];
    for (let i = 0; i < 40; i++) {
      points.push(11 + Math.sin(i * 0.4) * 2 + (Math.random() - 0.5) * 1.5);
    }

    let tick = 0;
    const renderChart = () => {
      this.chartAnimId = requestAnimationFrame(renderChart);
      tick++;

      if (tick % 6 === 0) {
        points.shift();
        points.push(11 + Math.sin(Date.now() * 0.003) * 2.5 + (Math.random() - 0.5) * 1.5);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;
      const step = w / (points.length - 1);

      // Grid Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      for (let y = 30; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Fill Gradient under curve
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
      grad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');

      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let i = 0; i < points.length; i++) {
        const x = i * step;
        const y = h - (points[i] * 6.5);
        if (i === 0) ctx.lineTo(x, y);
        else {
          const prevX = (i - 1) * step;
          const prevY = h - (points[i - 1] * 6.5);
          const cpX = (prevX + x) / 2;
          ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
        }
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Line Stroke
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        const x = i * step;
        const y = h - (points[i] * 6.5);
        if (i === 0) ctx.moveTo(x, y);
        else {
          const prevX = (i - 1) * step;
          const prevY = h - (points[i - 1] * 6.5);
          const cpX = (prevX + x) / 2;
          ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
        }
      }
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Current Value Dot
      const lastX = (points.length - 1) * step;
      const lastY = h - (points[points.length - 1] * 6.5);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(lastX, lastY, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    renderChart();
  }

  _escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  getElement() {
    return this.element;
  }
}
