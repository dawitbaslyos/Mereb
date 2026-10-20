/**
 * Mereb Terminal - In-Game Developer Console & Live Netcode Inspector
 * Enables developers and AI to inspect state, monitor WebRTC telemetry,
 * simulate network lag/packet loss, and execute real-time game commands.
 */

export class MerebTerminal {
  constructor(client, options = {}) {
    this.client = client;
    this.container = options.container || document.body;
    this.engine = options.engine || null;
    this.visible = false;
    this.activeTab = 'console'; // 'console' | 'telemetry' | 'chaos' | 'entities'

    // Chaos simulation parameters
    this.artificialLagMs = 0;
    this.artificialDropRate = 0; // 0 to 1

    this.logs = [];
    this.maxLogs = 100;

    this._buildDOM();
    this._attachGlobalHotkey();
    this._hookClientEvents();
  }

  _buildDOM() {
    this._injectStyles();

    // Floating pill button
    this.pill = document.createElement('button');
    this.pill.className = 'mereb-terminal-pill';
    this.pill.innerHTML = `⚡ <span class="pill-text">MEREB DEV</span>`;
    this.pill.title = 'Toggle Mereb Netcode Terminal (` or ~)';
    this.pill.addEventListener('click', () => this.toggle());
    this.container.appendChild(this.pill);

    // Main Modal
    this.element = document.createElement('div');
    this.element.className = 'mereb-terminal-modal';
    this.element.style.display = 'none';

    this.element.innerHTML = `
      <div class="terminal-header">
        <div class="terminal-title">
          <span class="terminal-badge">⚡ MEREB NETCODE v1.0</span>
          <span class="terminal-status-dot"></span>
          <span class="terminal-room-id">OFFLINE</span>
        </div>
        <div class="terminal-tabs">
          <button class="terminal-tab-btn active" data-tab="console">💻 CONSOLE</button>
          <button class="terminal-tab-btn" data-tab="telemetry">📊 TELEMETRY</button>
          <button class="terminal-tab-btn" data-tab="chaos">🧪 CHAOS SIM</button>
          <button class="terminal-tab-btn" data-tab="entities">📦 ENTITIES</button>
        </div>
        <button class="terminal-close-btn" title="Close">✕</button>
      </div>

      <div class="terminal-body">
        <!-- Tab 1: Console -->
        <div class="terminal-tab-content tab-console active">
          <div class="terminal-output"></div>
          <form class="terminal-input-bar">
            <span class="terminal-prompt">&gt;</span>
            <input type="text" class="terminal-input" placeholder="Type a command (or 'help')..." />
            <button type="submit" class="terminal-send-btn">RUN</button>
          </form>
        </div>

        <!-- Tab 2: Telemetry -->
        <div class="terminal-tab-content tab-telemetry">
          <div class="telemetry-grid">
            <div class="telemetry-card">
              <div class="telemetry-label">RTT / PING</div>
              <div class="telemetry-value telemetry-ping">-- ms</div>
            </div>
            <div class="telemetry-card">
              <div class="telemetry-label">JITTER</div>
              <div class="telemetry-value telemetry-jitter">-- ms</div>
            </div>
            <div class="telemetry-card">
              <div class="telemetry-label">PACKET LOSS</div>
              <div class="telemetry-value telemetry-loss">0%</div>
            </div>
            <div class="telemetry-card">
              <div class="telemetry-label">WEBRTC STATE</div>
              <div class="telemetry-value telemetry-rtc">DISCONNECTED</div>
            </div>
            <div class="telemetry-card">
              <div class="telemetry-label">PEER ROLE</div>
              <div class="telemetry-value telemetry-role">NONE</div>
            </div>
            <div class="telemetry-card">
              <div class="telemetry-label">ROOM CODE</div>
              <div class="telemetry-value telemetry-room">--</div>
            </div>
          </div>
          <div class="telemetry-details"></div>
        </div>

        <!-- Tab 3: Chaos Simulator -->
        <div class="terminal-tab-content tab-chaos">
          <div class="chaos-desc">
            Simulate real-world mobile network conditions (3G/4G lag and packet drops) to test client prediction and snapshot interpolation.
          </div>
          <div class="chaos-controls">
            <div class="chaos-field">
              <label>Artificial Latency: <span class="chaos-lag-val">0ms</span></label>
              <input type="range" class="chaos-lag-slider" min="0" max="600" step="25" value="0" />
            </div>
            <div class="chaos-field">
              <label>Packet Drop Rate: <span class="chaos-drop-val">0%</span></label>
              <input type="range" class="chaos-drop-slider" min="0" max="50" step="5" value="0" />
            </div>
            <div class="chaos-presets">
              <button class="chaos-preset-btn" data-lag="0" data-drop="0">🟢 Perfect (0ms)</button>
              <button class="chaos-preset-btn" data-lag="60" data-drop="0">🟡 4G LTE (60ms)</button>
              <button class="chaos-preset-btn" data-lag="180" data-drop="5">🟠 Slow 3G (180ms + 5%)</button>
              <button class="chaos-preset-btn" data-lag="400" data-drop="20">🔴 Extreme (400ms + 20%)</button>
            </div>
          </div>
        </div>

        <!-- Tab 4: Entities -->
        <div class="terminal-tab-content tab-entities">
          <pre class="entities-json">No active game state to inspect.</pre>
        </div>
      </div>
    `;

    this.container.appendChild(this.element);

    // Event binding
    this.closeBtn = this.element.querySelector('.terminal-close-btn');
    this.closeBtn.addEventListener('click', () => this.hide());

    this.output = this.element.querySelector('.terminal-output');
    this.input = this.element.querySelector('.terminal-input');
    this.form = this.element.querySelector('.terminal-input-bar');

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const cmd = this.input.value.trim();
      if (!cmd) return;
      this.executeCommand(cmd);
      this.input.value = '';
    });

    // Tab buttons
    this.tabBtns = this.element.querySelectorAll('.terminal-tab-btn');
    this.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Chaos sliders
    const lagSlider = this.element.querySelector('.chaos-lag-slider');
    const lagVal = this.element.querySelector('.chaos-lag-val');
    lagSlider.addEventListener('input', (e) => {
      this.artificialLagMs = parseInt(e.target.value, 10);
      lagVal.innerText = `${this.artificialLagMs}ms`;
      this.log(`[Chaos] Injected artificial latency: ${this.artificialLagMs}ms`, 'warn');
    });

    const dropSlider = this.element.querySelector('.chaos-drop-slider');
    const dropVal = this.element.querySelector('.chaos-drop-val');
    dropSlider.addEventListener('input', (e) => {
      this.artificialDropRate = parseInt(e.target.value, 10) / 100;
      dropVal.innerText = `${e.target.value}%`;
      this.log(`[Chaos] Injected packet drop rate: ${e.target.value}%`, 'warn');
    });

    const presetBtns = this.element.querySelectorAll('.chaos-preset-btn');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const lag = parseInt(btn.dataset.lag, 10);
        const drop = parseInt(btn.dataset.drop, 10);
        lagSlider.value = lag;
        dropSlider.value = drop;
        this.artificialLagMs = lag;
        this.artificialDropRate = drop / 100;
        lagVal.innerText = `${lag}ms`;
        dropVal.innerText = `${drop}%`;
        this.log(`[Chaos] Preset applied: Lag ${lag}ms, Drop ${drop}%`, 'info');
      });
    });

    this.log('Mereb Terminal Initialized. Type "help" for commands.', 'system');
  }

  _injectStyles() {
    if (document.getElementById('mereb-terminal-styles')) return;

    const style = document.createElement('style');
    style.id = 'mereb-terminal-styles';
    style.textContent = `
      .mereb-terminal-pill {
        position: fixed;
        bottom: 16px;
        left: 16px;
        background: rgba(15, 23, 42, 0.85);
        border: 1px solid rgba(56, 189, 248, 0.5);
        color: #38bdf8;
        border-radius: 9999px;
        padding: 6px 14px;
        font-family: 'Fredoka', ui-monospace, monospace;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 6px;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
        transition: transform 0.1s, background 0.15s;
      }
      .mereb-terminal-pill:hover {
        transform: scale(1.05);
        background: rgba(56, 189, 248, 0.15);
      }

      .mereb-terminal-modal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: min(850px, 92vw);
        height: min(520px, 85vh);
        background: rgba(10, 15, 30, 0.94);
        border: 1px solid rgba(56, 189, 248, 0.35);
        border-radius: 14px;
        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.85), 0 0 30px rgba(56, 189, 248, 0.15);
        backdrop-filter: blur(16px);
        z-index: 2000;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
        color: #e2e8f0;
      }

      .terminal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 16px;
        background: rgba(15, 23, 42, 0.9);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      .terminal-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
      }
      .terminal-badge {
        color: #38bdf8;
        font-weight: 700;
      }
      .terminal-status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #ef4444;
      }
      .terminal-status-dot.connected {
        background: #22c55e;
      }
      .terminal-room-id {
        font-size: 11px;
        color: #94a3b8;
      }

      .terminal-tabs {
        display: flex;
        gap: 4px;
      }
      .terminal-tab-btn {
        background: transparent;
        border: none;
        color: #94a3b8;
        font-family: inherit;
        font-size: 11px;
        font-weight: 600;
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
        transition: color 0.15s, background 0.15s;
      }
      .terminal-tab-btn:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.05);
      }
      .terminal-tab-btn.active {
        color: #38bdf8;
        background: rgba(56, 189, 248, 0.15);
      }

      .terminal-close-btn {
        background: transparent;
        border: none;
        color: #94a3b8;
        font-size: 16px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
      }
      .terminal-close-btn:hover {
        color: #fff;
        background: rgba(239, 68, 68, 0.3);
      }

      .terminal-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .terminal-tab-content {
        flex: 1;
        display: none;
        flex-direction: column;
        padding: 14px;
        overflow-y: auto;
      }
      .terminal-tab-content.active {
        display: flex;
      }

      /* Console Tab */
      .terminal-output {
        flex: 1;
        overflow-y: auto;
        font-size: 12px;
        line-height: 1.6;
        display: flex;
        flex-direction: column;
        gap: 3px;
        margin-bottom: 10px;
        word-break: break-all;
      }
      .terminal-log-line {
        display: flex;
        gap: 8px;
      }
      .terminal-log-time {
        color: #64748b;
        font-size: 11px;
      }
      .log-info { color: #38bdf8; }
      .log-warn { color: #facc15; }
      .log-error { color: #f87171; }
      .log-system { color: #a855f7; }
      .log-success { color: #4ade80; }

      .terminal-input-bar {
        display: flex;
        align-items: center;
        background: rgba(15, 23, 42, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 8px;
        padding: 4px 10px;
        gap: 8px;
      }
      .terminal-prompt {
        color: #38bdf8;
        font-weight: 700;
      }
      .terminal-input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        color: #f1f5f9;
        font-family: inherit;
        font-size: 13px;
      }
      .terminal-send-btn {
        background: #0284c7;
        color: #fff;
        border: none;
        border-radius: 6px;
        padding: 4px 12px;
        font-family: inherit;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
      }

      /* Telemetry Tab */
      .telemetry-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
        gap: 12px;
        margin-bottom: 16px;
      }
      .telemetry-card {
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        padding: 12px;
        text-align: center;
      }
      .telemetry-label {
        font-size: 10px;
        color: #94a3b8;
        margin-bottom: 6px;
        letter-spacing: 0.5px;
      }
      .telemetry-value {
        font-size: 16px;
        font-weight: 700;
        color: #38bdf8;
      }

      /* Chaos Tab */
      .chaos-desc {
        font-size: 12px;
        color: #94a3b8;
        line-height: 1.5;
        margin-bottom: 18px;
      }
      .chaos-controls {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .chaos-field label {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 6px;
      }
      .chaos-field input[type="range"] {
        width: 100%;
        accent-color: #38bdf8;
      }
      .chaos-presets {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 10px;
      }
      .chaos-preset-btn {
        background: rgba(30, 41, 59, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #cbd5e1;
        font-family: inherit;
        font-size: 11px;
        padding: 8px 14px;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.1s;
      }
      .chaos-preset-btn:hover {
        background: rgba(56, 189, 248, 0.2);
        color: #fff;
      }

      /* Entities Tab */
      .entities-json {
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        padding: 14px;
        font-size: 12px;
        line-height: 1.5;
        overflow-x: auto;
        color: #38bdf8;
      }
    `;
    document.head.appendChild(style);
  }

  _attachGlobalHotkey() {
    window.addEventListener('keydown', (e) => {
      if (e.key === '`' || e.key === '~') {
        // Prevent typing backtick in input fields if active
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          this.toggle();
        }
      }
    });
  }

  _hookClientEvents() {
    if (!this.client) return;

    this.client.on('status', (status) => {
      this.log(`[Status] ${status}`, 'info');
      this._updateHeader();
    });

    this.client.on('quality', (q) => {
      this._updateTelemetry(q);
    });

    this.client.on('match-start', (info) => {
      this.log(`[Match] Started as ${info.role} vs ${info.peerId}`, 'success');
      this._updateHeader();
    });

    this.client.on('event', (msg) => {
      this.log(`[Event] ${msg.name}: ${JSON.stringify(msg.data || {})}`, 'info');
    });

    this.client.on('error', (err) => {
      this.log(`[Error] ${err.message || err}`, 'error');
    });
  }

  toggle() {
    this.visible ? this.hide() : this.show();
  }

  show() {
    this.visible = true;
    this.element.style.display = 'flex';
    this.input.focus();
    this._refreshEntities();
  }

  hide() {
    this.visible = false;
    this.element.style.display = 'none';
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    this.tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    this.element.querySelectorAll('.terminal-tab-content').forEach(content => {
      content.classList.toggle('active', content.classList.contains(`tab-${tabName}`));
    });

    if (tabName === 'entities') {
      this._refreshEntities();
    }
  }

  log(message, type = 'info') {
    const time = new Date().toLocaleTimeString();
    const entry = { time, message, type };
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) this.logs.shift();

    if (this.output) {
      const line = document.createElement('div');
      line.className = `terminal-log-line log-${type}`;
      line.innerHTML = `<span class="terminal-log-time">[${time}]</span> <span class="terminal-log-msg">${this._escapeHTML(message)}</span>`;
      this.output.appendChild(line);
      this.output.scrollTop = this.output.scrollHeight;
    }
  }

  executeCommand(commandLine) {
    this.log(`> ${commandLine}`, 'system');
    const [cmd, ...args] = commandLine.trim().split(/\s+/);
    const command = cmd.toLowerCase();

    switch (command) {
      case 'help':
        this.log('Available Commands:', 'info');
        this.log('  help                 - Show this help list', 'info');
        this.log('  status               - Dump connection & room status', 'info');
        this.log('  state                - Inspect player/bullet entities', 'info');
        this.log('  lag <ms>             - Simulate network latency (e.g. lag 150)', 'info');
        this.log('  drop <percent>       - Simulate packet loss (e.g. drop 10)', 'info');
        this.log('  kick                 - Forfeit / leave current match', 'info');
        this.log('  clear                - Clear console output', 'info');
        break;

      case 'status':
        const room = this.client?.roomCode || 'None';
        const role = this.client?.role || 'None';
        const peer = this.client?.peerId || 'None';
        const local = this.client?.localId || 'None';
        this.log(`Status Report: Room=${room} | Role=${role} | Local=${local} | Peer=${peer}`, 'success');
        break;

      case 'state':
        this._refreshEntities();
        this.switchTab('entities');
        break;

      case 'lag':
        const ms = parseInt(args[0], 10) || 0;
        this.artificialLagMs = ms;
        this.log(`Simulated lag set to ${ms}ms`, 'warn');
        break;

      case 'drop':
        const pct = parseInt(args[0], 10) || 0;
        this.artificialDropRate = pct / 100;
        this.log(`Simulated packet drop rate set to ${pct}%`, 'warn');
        break;

      case 'kick':
      case 'leave':
        if (this.client) {
          this.client.leave();
          this.log('Forfeited and disconnected.', 'warn');
        }
        break;

      case 'clear':
        if (this.output) this.output.innerHTML = '';
        this.logs = [];
        break;

      default:
        this.log(`Unknown command: "${command}". Type "help" for options.`, 'error');
        break;
    }
  }

  _updateHeader() {
    const roomEl = this.element.querySelector('.terminal-room-id');
    const dot = this.element.querySelector('.terminal-status-dot');
    const isConn = this.client && this.client.peer && this.client.peer.connected;

    if (dot) dot.classList.toggle('connected', isConn);
    if (roomEl) roomEl.innerText = this.client?.roomCode ? `ROOM: ${this.client.roomCode}` : 'OFFLINE';

    // Update telemetry tab values
    const rtcVal = this.element.querySelector('.telemetry-rtc');
    const roleVal = this.element.querySelector('.telemetry-role');
    const roomVal = this.element.querySelector('.telemetry-room');

    if (rtcVal) rtcVal.innerText = isConn ? 'CONNECTED' : (this.client?.status || 'IDLE');
    if (roleVal) roleVal.innerText = this.client?.role || 'NONE';
    if (roomVal) roomVal.innerText = this.client?.roomCode || '--';
  }

  _updateTelemetry(quality) {
    if (!quality) return;
    const pingEl = this.element.querySelector('.telemetry-ping');
    const jitterEl = this.element.querySelector('.telemetry-jitter');
    const lossEl = this.element.querySelector('.telemetry-loss');

    if (pingEl) pingEl.innerText = `${quality.ping || 0} ms`;
    if (jitterEl) jitterEl.innerText = `${quality.jitter || 0} ms`;
    if (lossEl) lossEl.innerText = `${quality.packetLoss || 0}%`;
  }

  _refreshEntities() {
    const pre = this.element.querySelector('.entities-json');
    if (!pre) return;

    if (this.engine && this.engine.playerStates) {
      pre.innerText = JSON.stringify({
        players: this.engine.playerStates,
        bullets: this.engine.bulletStates || []
      }, null, 2);
    } else {
      pre.innerText = 'No entity states available.';
    }
  }

  _escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }
}
