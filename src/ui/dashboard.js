/**
 * Mereb Cloud - Pure Developer Console
 * Realtime WebSocket & WebRTC Cloud Platform
 * Client SDK, Connection Endpoints, Active Channels, and Edge Telemetry.
 */
import { auth, CLOUD_EDGE_HOST } from './auth.js';

export class DashboardUI {
  constructor({ onNavigateHome }) {
    this.onNavigateHome = onNavigateHome;
    this.element = document.createElement('div');
    this.element.className = 'dashboard-root';
    this.selectedAppIndex = 0;
    this.activeTab = 'sdk'; // 'sdk' | 'channels' | 'leaderboard'
    this.activeSdkTab = 'godot'; // 'godot' | 'native' | 'js' | 'curl'
    this.leaderboard = [];
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
    const selected = apps[this.selectedAppIndex] || apps[0];
    if (!selected) return;
    try {
      this.leaderboard = await auth.fetchLeaderboard(selected.id);
    } catch {
      this.leaderboard = [];
    }
  }

  render() {
    const user = auth.getUser();
    const apps = auth.getGames();
    const activeRooms = auth.getActiveRooms();
    const recentLogs = auth.getRecentLogs();
    const metrics = auth.getCloudMetrics() || {};
    const selectedApp = apps[this.selectedAppIndex] || apps[0] || null;

    const host = CLOUD_EDGE_HOST;
    const wsProtoHost = host.replace(/^http/, 'ws');
    const totalCCU = apps.reduce((acc, g) => acc + (g.activeCCU || 0), 0);
    const totalRooms = activeRooms.length;
    const dailyReqs = metrics.dailyRequests || 0;
    const dailyLimit = metrics.dailyRequestsLimit || 100000;

    const selectedAppRooms = selectedApp
      ? activeRooms.filter(r => r.appId === selectedApp.id)
      : [];

    const wsUrl = selectedApp
      ? `${wsProtoHost}/v1/${selectedApp.id}/general?key=${selectedApp.apiKey || 'pk_live_...'}`
      : '';
    const broadcastUrl = selectedApp
      ? `${host}/v1/${selectedApp.id}/general/broadcast`
      : '';

    this.element.innerHTML = `
      <style>
        .dash-topbar {
          background: rgba(8, 12, 24, 0.96);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: 12px 24px;
          backdrop-filter: blur(16px);
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .dash-topbar-inner {
          max-width: 1280px;
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
          font-size: 13.5px;
          color: #94a3b8;
        }
        .dash-main-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 28px 24px 80px;
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
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 14px;
        }
        .dash-metric-card {
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 4px;
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
          grid-template-columns: 330px 1fr;
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
          gap: 12px;
        }
        .app-card {
          background: rgba(15, 23, 42, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 10px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
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
          padding: 22px 26px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .credentials-card {
          background: rgba(0, 0, 0, 0.38);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .cred-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .cred-label {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .cred-value {
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-size: 12px;
          color: #38bdf8;
          background: rgba(0, 0, 0, 0.4);
          padding: 4px 10px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          word-break: break-all;
          flex: 1;
        }
        .tab-nav {
          display: flex;
          gap: 6px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 10px;
        }
        .tab-btn {
          background: transparent;
          border: 1px solid transparent;
          color: #94a3b8;
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: 6px;
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
          font-size: 12px;
          text-align: left;
        }
        .rooms-table th {
          padding: 8px 12px;
          color: #94a3b8;
          font-weight: 600;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .rooms-table td {
          padding: 10px 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          color: #f1f5f9;
        }
        .rooms-table tr:hover td {
          background: rgba(255, 255, 255, 0.02);
        }
        .empty-banner {
          padding: 28px;
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
          padding: 12px 14px;
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-size: 11.5px;
          line-height: 1.6;
          max-height: 200px;
          overflow-y: auto;
          color: #94a3b8;
        }
        .log-entry { display: flex; gap: 8px; }
        .log-time { color: #475569; }
        .log-text { color: #38bdf8; }
        .log-join { color: #4ade80; }
        .log-leave { color: #f87171; }
        .code-box {
          background: #050811;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 16px 18px;
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-size: 12.5px;
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
          font-size: 12px;
          padding: 6px 14px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.12s;
        }
        .subtab-btn.active {
          background: #0284c7;
          color: #fff;
          border-color: #38bdf8;
        }
      </style>

      <!-- Top Header -->
      <header class="dash-topbar">
        <div class="dash-topbar-inner">
          <div class="dash-brand-wrap">
            <span class="dash-logo-badge">MEREB</span>
            <span class="dash-section-name">/ Realtime Cloud</span>
            <span class="tag-pill live" style="margin-left: 6px;">● Global Edge Active</span>
          </div>

          <div class="dash-topbar-actions" style="display: flex; align-items: center; gap: 10px;">
            <div class="user-pill-dropdown" style="display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 20px; font-size: 12px;">
              <img src="${user?.avatar || 'https://api.dicebear.com/7.x/identicon/svg?seed=mereb'}" alt="User" style="width: 20px; height: 20px; border-radius: 50%;" />
              <span style="color: #f1f5f9; font-weight: 600;">${user?.username || 'Developer'}</span>
              ${user?.isGuest ? `
                <button class="btn-login-github" style="background: none; border: none; color: #38bdf8; cursor: pointer; font-size: 11px; margin-left: 4px;">
                  Connect GitHub
                </button>
              ` : `
                <button class="btn-logout" title="Sign out" style="background: none; border: none; color: #64748b; cursor: pointer;">✕</button>
              `}
            </div>
          </div>
        </div>
      </header>

      <!-- Main Container -->
      <main class="dash-main-container">
        <!-- Top Title & Primary Actions -->
        <div class="console-header-row">
          <div>
            <h1 style="font-size: 24px; font-weight: 800; color: #fff; margin: 0;">
              Realtime Web Connections & Client SDK
            </h1>
            <p style="color: #94a3b8; margin-top: 4px; font-size: 13px;">
              Serverless WebSockets, WebRTC signaling & edge broadcast. Built for client-side web apps, games & AI.
            </p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="btn-subtle pill-btn" id="btn-sync-edge">🔄 Refresh</button>
            <button class="btn-primary pill-btn" id="btn-create-app-modal">+ New App</button>
          </div>
        </div>

        <!-- Real Infrastructure Telemetry Bar (Zero Mock Data) -->
        <div class="dash-metrics-grid">
          <div class="dash-metric-card">
            <div class="metric-top">
              <span class="metric-title">Live WebSockets (CCU)</span>
              <span class="status-live-dot"></span>
            </div>
            <div class="metric-number text-signal">${totalCCU}</div>
            <div class="metric-sub">Connected client sockets right now</div>
          </div>

          <div class="dash-metric-card">
            <div class="metric-top">
              <span class="metric-title">Active Channels / Rooms</span>
              <span class="metric-icon">⚡</span>
            </div>
            <div class="metric-number">${totalRooms}</div>
            <div class="metric-sub">Open channels on Cloudflare Edge</div>
          </div>

          <div class="dash-metric-card">
            <div class="metric-top">
              <span class="metric-title">Daily Edge Requests</span>
              <span class="metric-icon">🌐</span>
            </div>
            <div class="metric-number">${dailyReqs.toLocaleString()}</div>
            <div class="metric-sub">${((dailyReqs / dailyLimit) * 100).toFixed(2)}% of 100,000 Free Tier / day</div>
          </div>

          <div class="dash-metric-card">
            <div class="metric-top">
              <span class="metric-title">Platform Cost</span>
              <span class="metric-icon">💰</span>
            </div>
            <div class="metric-number" style="color: #4ade80;">$0.00 / mo</div>
            <div class="metric-sub">Zero compute fees on Cloudflare Edge</div>
          </div>
        </div>

        <!-- Main Layout: Apps List (Left) + Selected App Panel (Right) -->
        <div class="two-col-layout">
          <!-- Apps List -->
          <div class="apps-column">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">
                Your Apps (${apps.length})
              </span>
            </div>

            ${apps.map((app, idx) => `
              <div class="app-card ${idx === this.selectedAppIndex ? 'selected' : ''}" data-idx="${idx}">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <strong style="font-size: 14px; color: #f8fafc;">${app.name}</strong>
                  <span class="tag-pill ${app.activeCCU > 0 ? 'live' : ''}">${app.activeCCU || 0} CCU</span>
                </div>

                <div class="key-box-mini">
                  <span>App ID: <code>${app.id}</code></span>
                  <button class="btn-subtle pill-btn btn-copy-appid" data-id="${app.id}" style="padding: 2px 6px; font-size: 9px;">Copy</button>
                </div>

                <div class="key-box-mini" style="font-size: 10px;">
                  <span style="color: #64748b;">Key: <code>${(app.apiKey || 'pk_live_...').slice(0, 14)}...</code></span>
                  <button class="btn-subtle pill-btn btn-copy-key" data-key="${app.apiKey || app.id}" style="padding: 2px 6px; font-size: 9px;">Copy</button>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 2px;">
                  <span style="font-size: 11px; color: #64748b;">${app.activeRooms || 0} active channels</span>
                  ${apps.length > 1 ? `
                    <button class="btn-danger-icon btn-app-delete" data-id="${app.id}" title="Delete app" style="padding: 3px;">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>

          <!-- App Inspector & Live Tools -->
          ${selectedApp ? `
            <div class="inspector-panel">
              <!-- App Overview Header -->
              <div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px;">
                  <div>
                    <h2 style="font-size: 20px; font-weight: 800; color: #f8fafc; margin: 0;">
                      ${selectedApp.name}
                    </h2>
                    <p style="font-size: 12.5px; color: #94a3b8; margin-top: 2px;">
                      Real-time client connection endpoint for Web, Godot, React, and Game Engines.
                    </p>
                  </div>
                </div>

                <!-- Comprehensive Connection Credentials Card -->
                <div class="credentials-card" style="margin-top: 14px;">
                  <div class="cred-row">
                    <span class="cred-label">WebSocket URL:</span>
                    <span class="cred-value">${wsUrl}</span>
                    <button class="btn-primary pill-btn btn-copy-hero-ws" data-url="${wsUrl}" style="padding: 5px 12px; font-size: 11px; white-space: nowrap;">
                      Copy URL
                    </button>
                  </div>

                  <div class="cred-row">
                    <span class="cred-label">REST / Broadcast:</span>
                    <span class="cred-value">${broadcastUrl}</span>
                    <button class="btn-subtle pill-btn btn-copy-endpoint" data-url="${broadcastUrl}" style="padding: 5px 12px; font-size: 11px; white-space: nowrap;">
                      Copy Endpoint
                    </button>
                  </div>

                  <div style="display: flex; gap: 12px; flex-wrap: wrap; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px;">
                    <div style="display: flex; align-items: center; gap: 6px; font-size: 11.5px;">
                      <span style="color: #64748b;">App ID:</span>
                      <code style="color: #38bdf8; font-weight: 700;">${selectedApp.id}</code>
                      <button class="btn-subtle pill-btn btn-copy-appid" data-id="${selectedApp.id}" style="padding: 1px 6px; font-size: 9.5px;">Copy</button>
                    </div>

                    <div style="display: flex; align-items: center; gap: 6px; font-size: 11.5px;">
                      <span style="color: #64748b;">API Key:</span>
                      <code style="color: #38bdf8; font-weight: 700;">${selectedApp.apiKey || 'pk_live_...'}</code>
                      <button class="btn-subtle pill-btn btn-copy-key" data-key="${selectedApp.apiKey || selectedApp.id}" style="padding: 1px 6px; font-size: 9.5px;">Copy</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Main Navigation Tabs -->
              <div class="tab-nav">
                <button class="tab-btn ${this.activeTab === 'sdk' ? 'active' : ''}" data-tab="sdk">
                  📦 Client SDK & Code
                </button>
                <button class="tab-btn ${this.activeTab === 'channels' ? 'active' : ''}" data-tab="channels">
                  📊 Active Channels (${selectedAppRooms.length})
                </button>
                <button class="tab-btn ${this.activeTab === 'leaderboard' ? 'active' : ''}" data-tab="leaderboard">
                  🏆 Global Leaderboards
                </button>
              </div>

              <!-- TAB 1: Client SDK & Integration Code -->
              ${this.activeTab === 'sdk' ? `
                <div style="display: flex; flex-direction: column; gap: 14px;">
                  <div class="subtab-row">
                    <button class="subtab-btn ${this.activeSdkTab === 'godot' ? 'active' : ''}" data-sdk="godot">Godot 4 (GDScript)</button>
                    <button class="subtab-btn ${this.activeSdkTab === 'native' ? 'active' : ''}" data-sdk="native">Zero-Dependency Native WebSocket</button>
                    <button class="subtab-btn ${this.activeSdkTab === 'js' ? 'active' : ''}" data-sdk="js">Client SDK (CDN / ESM)</button>
                    <button class="subtab-btn ${this.activeSdkTab === 'curl' ? 'active' : ''}" data-sdk="curl">REST Server Broadcast (cURL)</button>
                  </div>

                  ${this.activeSdkTab === 'godot' ? `
                    <div class="code-box"># Godot 4 Client-Side Realtime Web Connection
extends Node

var ws = WebSocketPeer.new()
const URL = "${wsUrl}"

func _ready():
    # 1. Connect directly to Mereb Cloud Edge WebSocket
    var err = ws.connect_to_url(URL)
    if err != OK:
        print("Failed to connect: ", err)

func _process(_delta):
    ws.poll()
    var state = ws.get_ready_state()
    if state == WebSocketPeer.STATE_OPEN:
        while ws.get_available_packet_count():
            var packet = ws.get_packet().get_string_from_utf8()
            print("Received from Mereb: ", packet)

# 2. Broadcast data to all peers connected to this channel
func send_data(dict: Dictionary):
    if ws.get_ready_state() == WebSocketPeer.STATE_OPEN:
        ws.send_text(JSON.stringify(dict))</div>
                  ` : ''}

                  ${this.activeSdkTab === 'native' ? `
                    <div class="code-box">// Pure Native Browser WebSocket (Zero Dependencies, Zero Libraries!)
const url = '${wsUrl}';
const ws = new WebSocket(url);

ws.onopen = () =&gt; {
  console.log('Connected to Mereb Edge WebSocket!');
  // Send message to all other connected peers in the channel
  ws.send(JSON.stringify({ event: 'greeting', text: 'Hello from web client!' }));
};

ws.onmessage = (event) =&gt; {
  const data = JSON.parse(event.data);
  console.log('Received live packet:', data);
};

ws.onclose = () =&gt; console.log('Disconnected from edge channel');</div>
                  ` : ''}

                  ${this.activeSdkTab === 'js' ? `
                    <div class="code-box">&lt;!-- 1. Include Mereb SDK directly via CDN script tag --&gt;
&lt;script src="https://mereb-cloud.vercel.app/sdk.js"&gt;&lt;/script&gt;

&lt;script&gt;
  // 2. Initialize Mereb Client with your App ID
  const client = new Mereb({
    appId: '${selectedApp.id}',
    apiKey: '${selectedApp.apiKey || 'pk_live_...'}'
  });

  // 3. Join a real-time channel
  const channel = client.room('general');

  // 4. Listen for live incoming messages
  channel.on('message', (data) =&gt; {
    console.log('Received message from peer:', data);
  });

  // 5. Send message to all peers in the channel
  channel.send({ text: 'Hello from client-side web!' });
&lt;/script&gt;</div>
                  ` : ''}

                  ${this.activeSdkTab === 'curl' ? `
                    <div class="code-box"># 1. Publish a message to all connected clients in this channel from your backend:
curl -X POST ${host}/v1/${selectedApp.id}/general/broadcast \\
  -H "Content-Type: application/json" \\
  -d '{"event": "system-alert", "text": "Server scheduled maintenance in 10 minutes"}'

# 2. Query active presence in this channel:
curl ${host}/v1/${selectedApp.id}/general/presence</div>
                  ` : ''}
                </div>
              ` : ''}

              <!-- TAB 2: Active Channels & Live Telemetry -->
              ${this.activeTab === 'channels' ? `
                <div style="display: flex; flex-direction: column; gap: 16px;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 12px; font-weight: 700; color: #cbd5e1; text-transform: uppercase;">
                      Active Match Rooms & Channels (${selectedAppRooms.length})
                    </span>
                    <span style="font-size: 11px; color: #64748b;">Auto-updates as clients connect</span>
                  </div>

                  ${selectedAppRooms.length > 0 ? `
                    <table class="rooms-table">
                      <thead>
                        <tr>
                          <th>Channel Name</th>
                          <th>Status</th>
                          <th>Connected Clients</th>
                          <th>Host ID</th>
                          <th>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${selectedAppRooms.map(r => `
                          <tr>
                            <td><code style="color: #38bdf8; font-weight: 700;">${r.roomId}</code></td>
                            <td>
                              <span class="tag-pill live">● Channel Active</span>
                            </td>
                            <td><strong>${r.playerCount}</strong> clients</td>
                            <td><code style="color: #94a3b8; font-size: 11px;">${r.hostId || 'N/A'}</code></td>
                            <td style="color: #64748b; font-size: 11px;">${new Date(r.createdAt).toLocaleTimeString()}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  ` : `
                    <div class="empty-banner">
                      No active channels currently open for <strong>${selectedApp.name}</strong>.<br/>
                      When clients connect via WebSocket, their real-time sessions appear here immediately.
                    </div>
                  `}

                  <!-- Edge Telemetry Stream -->
                  <div style="display: flex; flex-direction: column; gap: 8px;">
                    <span style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">
                      Real-Time Edge Telemetry Stream
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

              <!-- TAB 3: Global Leaderboards -->
              ${this.activeTab === 'leaderboard' ? `
                <div style="display: flex; flex-direction: column; gap: 16px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <div>
                      <span style="font-size: 12px; font-weight: 700; color: #cbd5e1; text-transform: uppercase;">
                        Global Highscores & Shared State
                      </span>
                      <p style="font-size: 12px; color: #64748b; margin-top: 2px;">
                        REST API: <code>/api/apps/${selectedApp.id}/leaderboard</code>
                      </p>
                    </div>

                    ${this.leaderboard.length > 0 ? `
                      <button class="btn-subtle pill-btn btn-clear-lb" style="color: #f87171; border-color: rgba(239, 68, 68, 0.3);">
                        Clear Scores
                      </button>
                    ` : ''}
                  </div>

                  <!-- Quick Interactive Score Tester -->
                  <div style="background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 12px 14px; display: flex; flex-wrap: wrap; gap: 10px; align-items: center;">
                    <input type="text" id="test-lb-player" placeholder="Player Name" class="modal-input" style="flex: 1; min-width: 120px;" />
                    <input type="number" id="test-lb-score" placeholder="Score" class="modal-input" style="flex: 1; min-width: 100px;" />
                    <button class="btn-primary pill-btn" id="btn-submit-test-score" style="white-space: nowrap;">
                      Post Highscore
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
                            <td><code style="color: #38bdf8; font-weight: 800;">${e.score.toLocaleString()}</code></td>
                            <td style="color: #64748b; font-size: 11px;">${new Date(e.createdAt || e.date).toLocaleDateString()}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  ` : `
                    <div class="empty-banner">
                      No highscores posted yet for <strong>${selectedApp.name}</strong>.
                    </div>
                  `}
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>
      </main>

      <!-- Create New App Modal -->
      <div class="dash-modal-backdrop" id="modal-create-app" style="display: none;">
        <div class="dash-modal-card">
          <h3 class="modal-title">Create Realtime App</h3>
          <p class="modal-desc">
            Instantly creates a real-time connection endpoint on Cloudflare Edge with 100,000 free requests per day.
          </p>
          
          <div style="display: flex; flex-direction: column; gap: 14px; margin-top: 8px;">
            <div>
              <label style="font-size: 12px; font-weight: 600; color: #94a3b8;">App Name</label>
              <input type="text" class="modal-input" id="new-app-name" placeholder="e.g. My Chat Web App" maxlength="50" style="width: 100%; box-sizing: border-box; margin-top: 4px;" />
            </div>

            <div class="key-box-mini">
              <span style="font-size: 11px; color: #94a3b8;">Generated App ID:</span>
              <code id="preview-app-id">my-chat-web-app</code>
            </div>
          </div>

          <div class="modal-actions" style="margin-top: 18px;">
            <button class="btn-subtle pill-btn" id="btn-modal-cancel">Cancel</button>
            <button class="btn-primary pill-btn" id="btn-modal-submit">Create Endpoint</button>
          </div>
        </div>
      </div>
    `;

    this._wireEvents();
  }

  _wireEvents() {
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

    // GitHub connect / logout
    this.element.querySelector('.btn-login-github')?.addEventListener('click', () => {
      auth.loginWithGithub();
    });
    this.element.querySelector('.btn-logout')?.addEventListener('click', () => {
      auth.logout();
      this.render();
    });

    // Tab Navigation
    this.element.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        this.activeTab = btn.getAttribute('data-tab');
        if (this.activeTab === 'leaderboard') {
          await this._loadCurrentLeaderboard();
        }
        this.render();
      });
    });

    // SDK Subtabs
    this.element.querySelectorAll('.subtab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeSdkTab = btn.getAttribute('data-sdk');
        this.render();
      });
    });

    // Select App Card
    this.element.querySelectorAll('.app-card').forEach(card => {
      card.addEventListener('click', async (e) => {
        if (e.target.closest('button')) return;
        const idx = parseInt(card.getAttribute('data-idx'), 10);
        this.selectedAppIndex = idx;
        await this._loadCurrentLeaderboard();
        this.render();
      });
    });

    // Copy Hero WS URL
    this.element.querySelector('.btn-copy-hero-ws')?.addEventListener('click', async (e) => {
      const url = e.target.getAttribute('data-url');
      if (url) {
        await navigator.clipboard.writeText(url);
        const orig = e.target.innerText;
        e.target.innerText = 'Copied! ✓';
        setTimeout(() => { e.target.innerText = orig; }, 1400);
      }
    });

    // Copy Endpoint
    this.element.querySelector('.btn-copy-endpoint')?.addEventListener('click', async (e) => {
      const url = e.target.getAttribute('data-url');
      if (url) {
        await navigator.clipboard.writeText(url);
        const orig = e.target.innerText;
        e.target.innerText = 'Copied! ✓';
        setTimeout(() => { e.target.innerText = orig; }, 1400);
      }
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

    // Delete App
    this.element.querySelectorAll('.btn-app-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (id && confirm(`Delete App "${id}"? This will terminate its active connections.`)) {
          auth.deleteApp(id);
          this.selectedAppIndex = 0;
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
      if (previewAppId) previewAppId.innerText = 'my-chat-web-app';
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
        this.selectedAppIndex = auth.getGames().length - 1;
        await this._loadCurrentLeaderboard();
        this.render();
      } catch (err) {
        alert(err.message);
      }
    });

    // Leaderboard form
    this.element.querySelector('#btn-submit-test-score')?.addEventListener('click', async () => {
      const apps = auth.getGames();
      const selected = apps[this.selectedAppIndex] || apps[0];
      if (!selected) return;

      const playerInput = this.element.querySelector('#test-lb-player');
      const scoreInput = this.element.querySelector('#test-lb-score');
      const player = playerInput.value.trim() || 'Player1';
      const score = parseFloat(scoreInput.value) || 100;

      try {
        await auth.submitScore(selected.id, player, score);
        await this._loadCurrentLeaderboard();
        this.render();
      } catch (err) {
        alert(err.message);
      }
    });

    this.element.querySelector('.btn-clear-lb')?.addEventListener('click', async () => {
      const apps = auth.getGames();
      const selected = apps[this.selectedAppIndex] || apps[0];
      if (!selected) return;
      if (confirm('Clear leaderboard for this app?')) {
        await auth.clearLeaderboard(selected.id);
        await this._loadCurrentLeaderboard();
        this.render();
      }
    });
  }

  getElement() {
    return this.element;
  }
}
