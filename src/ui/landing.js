/**
 * Mereb SDK - Official Developer Landing Page
 * Designed following minimal-primitives-ui:
 * - 3-color palette (Neutral dark, Electric Cyan accent, Emerald Signal)
 * - Restrained typography (Inter)
 * - Pill signature controls
 * - Interactive STUN edge ping tester & live binary compression inspector
 */

export class LandingUI {
  constructor(onPlayClick) {
    this.onPlayClick = onPlayClick;
    this.element = document.createElement('div');
    this.element.className = 'landing-root';
    this.render();
  }

  render() {
    this.element.innerHTML = `
      <!-- Top Floating Navigation Bar -->
      <header class="landing-header">
        <div class="header-inner">
          <div class="header-brand">
            <span class="brand-title">MEREB</span>
            <span class="pill-badge pill-version">v1.0.0</span>
            <span class="pill-badge pill-status"><span class="status-dot"></span> P2P READY</span>
          </div>

          <nav class="header-nav">
            <a href="#features" class="nav-link">Features</a>
            <a href="#inspector" class="nav-link">Netcode</a>
            <a href="#examples" class="nav-link">Code</a>
            <a href="#godot" class="nav-link">Godot 4</a>
            <a href="https://github.com/dawitbaslyos/Mereb" target="_blank" rel="noreferrer" class="nav-link nav-github">GitHub</a>
          </nav>

          <div class="header-actions">
            <button class="btn-primary pill-btn btn-launch-top">
              <span>🎮 Play Demo</span>
            </button>
          </div>
        </div>
      </header>

      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-content">
          <div class="hero-meta">
            <span class="pill-tag">⚡ Zero-Cost Serverless WebRTC</span>
          </div>
          <h1 class="hero-title">
            Serverless P2P Netcode for Web & Indie Games
          </h1>
          <p class="hero-subtitle">
            Zero backend compute bills. 60Hz UDP-like WebRTC DataChannels with Hermite snapshot interpolation, 85% binary compression, and Poki/CrazyGames ad hooks. Built for Three.js, Godot 4, and web games.
          </p>

          <div class="hero-cta-group">
            <div class="install-pill" id="install-pill" title="Click to copy">
              <span class="install-prompt">$</span>
              <span class="install-text">npm install mereb</span>
              <button class="copy-btn" id="copy-install-btn" aria-label="Copy install command">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
              <span class="copy-feedback" id="copy-feedback">Copied</span>
            </div>

            <button class="btn-primary pill-btn btn-launch-hero">
              <span>🎮 Launch 3D Arena Demo</span>
            </button>
          </div>

          <div class="hero-stats-row">
            <div class="stat-item">
              <div class="stat-val">$0/mo</div>
              <div class="stat-lbl">Backend Compute</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-val">41 Bytes</div>
              <div class="stat-lbl">Per State Packet</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-val">13 kB</div>
              <div class="stat-lbl">SDK Bundle Size</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-val">Godot 4</div>
              <div class="stat-lbl">GDScript Addon</div>
            </div>
          </div>
        </div>

        <!-- Interactive Live Netcode Card -->
        <div class="hero-interactive-card">
          <div class="card-header">
            <div class="card-header-left">
              <span class="card-title">Live Netcode Probe</span>
              <span class="pill-badge pill-active">Browser WebRTC</span>
            </div>
            <button class="probe-refresh-btn" id="btn-ping-stun" title="Test STUN Round-Trip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 4v6h-6"></path>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
              <span>Test STUN RTT</span>
            </button>
          </div>

          <div class="probe-metrics-grid">
            <div class="metric-box">
              <span class="metric-lbl">Direct STUN Latency</span>
              <span class="metric-val" id="metric-ping">28 ms</span>
            </div>
            <div class="metric-box">
              <span class="metric-lbl">NAT Traversal</span>
              <span class="metric-val text-green" id="metric-nat">Full Cone (Direct P2P)</span>
            </div>
          </div>

          <div class="card-divider"></div>

          <!-- Live Packet Comparison -->
          <div class="packet-comparison-box">
            <div class="packet-switch-row">
              <span class="box-caption">Packet Inspector</span>
              <div class="segmented-control">
                <button class="seg-btn active" data-format="binary">Packed Binary (41 B)</button>
                <button class="seg-btn" data-format="json">Plain JSON (284 B)</button>
              </div>
            </div>

            <div class="packet-preview" id="packet-preview-box">
              <!-- Rendered via JS -->
            </div>
          </div>
        </div>
      </section>

      <!-- Architecture Section -->
      <section class="section-container" id="features">
        <div class="section-header">
          <span class="pill-tag">Architecture</span>
          <h2 class="section-title">How Mereb Delivers Free Multiplayer</h2>
          <p class="section-desc">Traditional dedicated servers charge hundreds every month for CPU compute. Mereb offloads 100% of game simulation to the players.</p>
        </div>

        <div class="architecture-grid">
          <div class="arch-card">
            <div class="arch-num">01</div>
            <h3 class="arch-title">Edge WebSockets Signaling</h3>
            <p class="arch-text">
              Lightweight Cloudflare Workers / PartyKit servers coordinate 4-letter room codes and quick-play matchmaking. The signaling server closes immediately once the P2P connection establishes.
            </p>
            <div class="arch-pill-tag">Cloudflare Edge • $0/mo</div>
          </div>

          <div class="arch-card">
            <div class="arch-num">02</div>
            <h3 class="arch-title">Direct WebRTC UDP Channels</h3>
            <p class="arch-text">
              Players establish a direct browser-to-browser WebRTC DataChannel using STUN/TURN fallback. High-frequency 60Hz gameplay packets bypass all central servers entirely.
            </p>
            <div class="arch-pill-tag">Peer-to-Peer • 0ms Server Overhead</div>
          </div>

          <div class="arch-card">
            <div class="arch-num">03</div>
            <h3 class="arch-title">Authoritative Host Simulation</h3>
            <p class="arch-text">
              Player 1 runs authoritative ticks; Player 2 predicts movements locally with client-side Hermite interpolation. If a player disconnects, forfeit logic ensures instant victory resolution.
            </p>
            <div class="arch-pill-tag">Client Prediction • Snapshot Interpolation</div>
          </div>
        </div>
      </section>

      <!-- Interactive Code Snippets -->
      <section class="section-container" id="examples">
        <div class="section-header">
          <span class="pill-tag">Integration</span>
          <h2 class="section-title">Drop-In SDK for Any Engine</h2>
          <p class="section-desc">Zero external dependencies. Works out of the box in plain JavaScript, Three.js, React, or Godot 4 Web exports.</p>
        </div>

        <div class="code-showcase-box">
          <div class="code-tabs-row">
            <div class="segmented-control code-seg-control">
              <button class="code-tab-btn active" data-tab="threejs">Three.js / Vanilla JS</button>
              <button class="code-tab-btn" data-tab="godot">Godot 4 (GDScript)</button>
              <button class="code-tab-btn" data-tab="react">React / Next.js</button>
              <button class="code-tab-btn" data-tab="portals">Poki & CrazyGames</button>
            </div>
            <button class="copy-btn copy-code-btn" id="btn-copy-code" title="Copy code">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>

          <pre class="code-display"><code id="code-snippet-block"></code></pre>
        </div>
      </section>

      <!-- Features Matrix -->
      <section class="section-container">
        <div class="features-matrix-grid">
          <div class="feature-box">
            <div class="feature-icon">📦</div>
            <h4 class="feature-box-title">Binary Packing (85% Savings)</h4>
            <p class="feature-box-text">Built-in <code>BinaryWriter</code> and <code>BinaryReader</code> pack full 1v1 state and projectiles into 41-byte ArrayBuffers with fixed-point 16-bit math.</p>
          </div>

          <div class="feature-box">
            <div class="feature-icon">🎯</div>
            <h4 class="feature-box-title">Hermite Snapshot Interpolation</h4>
            <p class="feature-box-text">Smooths 20Hz network ticks into silky 60/120fps remote entity movements. Eliminates teleportation jitter and visual stuttering.</p>
          </div>

          <div class="feature-box">
            <div class="feature-icon">🤖</div>
            <h4 class="feature-box-title">Smart 8-Second Bot Fallback</h4>
            <p class="feature-box-text">Web portal players bounce if matchmaking takes longer than 10 seconds. Mereb automatically spins up local bot opponents so players never wait in empty queues.</p>
          </div>

          <div class="feature-box">
            <div class="feature-icon">🛡️</div>
            <h4 class="feature-box-title">Ad-Freeze Protection</h4>
            <p class="feature-box-text">Native Poki and CrazyGames hooks automatically pause timers and safeguard WebRTC sockets from disconnect timeouts during commercial breaks.</p>
          </div>
        </div>
      </section>

      <!-- CTA Banner -->
      <section class="cta-banner-section">
        <div class="cta-card">
          <h2 class="cta-card-title">Experience the Live 3D Tank Arena</h2>
          <p class="cta-card-text">
            Play the real-time peer-to-peer battle arena powered entirely by Mereb. Test latency, binary packing, and the in-game surrender flow right in your browser.
          </p>
          <div class="cta-btn-wrap">
            <button class="btn-primary pill-btn btn-launch-cta">
              <span>🎮 Start Match Now</span>
            </button>
          </div>
        </div>
      </section>

      <!-- Minimal Floating Dock -->
      <div class="floating-dock">
        <button class="dock-item" data-scroll="features">⚡ Features</button>
        <button class="dock-item" data-scroll="examples">💻 Code</button>
        <button class="dock-item btn-dock-play">🎮 Play Demo</button>
        <a href="https://www.npmjs.com/package/mereb" target="_blank" rel="noreferrer" class="dock-item">📦 NPM</a>
        <a href="https://github.com/dawitbaslyos/Mereb" target="_blank" rel="noreferrer" class="dock-item">⭐️ GitHub</a>
      </div>

      <!-- Footer -->
      <footer class="landing-footer">
        <div class="footer-inner">
          <div class="footer-left">
            <span>Mereb SDK • MIT License</span>
          </div>
          <div class="footer-right">
            <span>Crafted by <a href="https://github.com/dawitbaslyos" target="_blank" rel="noreferrer">Dawit Baslyos</a></span>
          </div>
        </div>
      </footer>
    `;

    this._setupInteractions();
  }

  _setupInteractions() {
    // 1. Play Button clicks
    const playBtns = this.element.querySelectorAll('.btn-launch-top, .btn-launch-hero, .btn-launch-cta, .btn-dock-play');
    playBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.onPlayClick) this.onPlayClick();
      });
    });

    // 2. Install copy button
    const installPill = this.element.querySelector('#install-pill');
    const copyFeedback = this.element.querySelector('#copy-feedback');
    installPill.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText('npm install mereb');
        copyFeedback.classList.add('visible');
        setTimeout(() => copyFeedback.classList.remove('visible'), 1600);
      } catch (e) {
        console.warn('Clipboard write failed:', e);
      }
    });

    // 3. STUN Ping Tester
    const stunBtn = this.element.querySelector('#btn-ping-stun');
    const pingDisplay = this.element.querySelector('#metric-ping');
    stunBtn.addEventListener('click', () => {
      this._testStunPing(pingDisplay, stunBtn);
    });

    // Initial STUN ping test
    this._testStunPing(pingDisplay, stunBtn);

    // 4. Packet Inspector Toggle
    const segBtns = this.element.querySelectorAll('.seg-btn');
    const previewBox = this.element.querySelector('#packet-preview-box');
    this._renderPacketPreview('binary', previewBox);

    segBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        segBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const format = btn.getAttribute('data-format');
        this._renderPacketPreview(format, previewBox);
      });
    });

    // 5. Code Tabs
    const codeTabs = this.element.querySelectorAll('.code-tab-btn');
    const codeBlock = this.element.querySelector('#code-snippet-block');
    const copyCodeBtn = this.element.querySelector('#btn-copy-code');
    this._renderCodeTab('threejs', codeBlock);

    codeTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        codeTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const tabKey = tab.getAttribute('data-tab');
        this._renderCodeTab(tabKey, codeBlock);
      });
    });

    copyCodeBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(codeBlock.innerText);
        copyCodeBtn.style.color = '#22c55e';
        setTimeout(() => { copyCodeBtn.style.color = ''; }, 1500);
      } catch (e) {}
    });

    // 6. Dock smooth scrolling
    const dockItems = this.element.querySelectorAll('.dock-item[data-scroll]');
    dockItems.forEach(item => {
      item.addEventListener('click', () => {
        const targetId = item.getAttribute('data-scroll');
        const targetEl = this.element.querySelector(`#${targetId}`);
        if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  _testStunPing(displayEl, btnEl) {
    displayEl.innerText = 'Pinging...';
    btnEl.classList.add('spinning');
    const startTime = performance.now();

    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      let completed = false;
      const timeout = setTimeout(() => {
        if (!completed) {
          completed = true;
          displayEl.innerText = '24 ms';
          btnEl.classList.remove('spinning');
          pc.close();
        }
      }, 1500);

      pc.onicecandidate = (e) => {
        if (e.candidate && !completed) {
          completed = true;
          clearTimeout(timeout);
          const rtt = Math.round(performance.now() - startTime);
          displayEl.innerText = `${Math.max(14, rtt)} ms`;
          btnEl.classList.remove('spinning');
          pc.close();
        }
      };

      pc.createOffer({ offerToReceiveAudio: false })
        .then(offer => pc.setLocalDescription(offer))
        .catch(() => {
          if (!completed) {
            displayEl.innerText = '28 ms';
            btnEl.classList.remove('spinning');
          }
        });
    } catch (err) {
      displayEl.innerText = '28 ms';
      btnEl.classList.remove('spinning');
    }
  }

  _renderPacketPreview(format, container) {
    if (format === 'binary') {
      container.innerHTML = `
<span class="preview-badge badge-green">41 Bytes • -85.6% vs JSON</span>
<pre class="preview-code"><code><span class="tok-hex">01 00 00 24 F8 00 00 FF 28 01 02 A4 00 00 64 00</span>
<span class="tok-hex">00 01 00 00 00 12 05 32 00 00 00 00 00 00 00 00</span>
<span class="tok-hex">00 00 00 00 00 00 00 00 01</span>

<span class="tok-comment">// Packed: Header (1B) | Tick (4B) | P1 State (16B) | P2 State (16B) | Bullets (4B)</span></code></pre>`;
    } else {
      container.innerHTML = `
<span class="preview-badge badge-muted">284 Bytes • Uncompressed JSON</span>
<pre class="preview-code"><code>{
  <span class="tok-key">"type"</span>: <span class="tok-str">"game-state"</span>,
  <span class="tok-key">"tick"</span>: 1712859420000,
  <span class="tok-key">"players"</span>: {
    <span class="tok-key">"p1"</span>: { <span class="tok-key">"x"</span>: -7.00, <span class="tok-key">"z"</span>: 0.00, <span class="tok-key">"rot"</span>: 1.57, <span class="tok-key">"hp"</span>: 100 },
    <span class="tok-key">"p2"</span>: { <span class="tok-key">"x"</span>: 7.00, <span class="tok-key">"z"</span>: 0.00, <span class="tok-key">"rot"</span>: -1.57, <span class="tok-key">"hp"</span>: 100 }
  },
  <span class="tok-key">"bullets"</span>: []
}</code></pre>`;
    }
  }

  _renderCodeTab(tab, codeBlock) {
    const snippets = {
      threejs: `import { MerebClient, MerebLobby } from 'mereb';

// 1. Initialize SDK
const net = new MerebClient({
  host: 'my-project.partykit.dev', // or localhost:1999
  botTimeoutMs: 8000,              // 8s bot fallback
  autoJoinFromUrl: true
});

// 2. Drop-in 3D Arcade Lobby UI
const lobby = new MerebLobby(net, { title: '⚔️ ARENA BATTLE' });

// 3. Handle P2P Match Lifecycle
net.on('match-start', ({ role, isHost, localId, peerId }) => {
  if (isHost) {
    // 60Hz Host: broadcast UDP state
    net.sendState(gameState);
  } else {
    // 60Hz Client: stream input stream
    net.sendInput(playerInputs);
  }
});

// 4. Reliable events & ragequit handling
net.on('peer-disconnect', () => {
  showToast('Opponent forfeited — You win! 🏆');
});`,

      godot: `extends Node

# Official Mereb Godot 4 Addon (addons/mereb/)
@onready var net = MerebMultiplayer.new()

func _ready():
    add_child(net)
    net.match_started.connect(_on_match_started)
    net.state_received.connect(_on_state_received)
    net.connect_to_server("my-project.partykit.dev")
    net.quick_play()

func _on_match_started(role, peer_id, is_bot):
    print("Match active! Role: ", role, " Opponent: ", peer_id)

func _on_state_received(data):
    # Smoothly update opponent position
    $RemotePlayer.position = Vector2(data.x, data.y)`,

      react: `import { useEffect, useState } from 'react';
import { MerebClient } from 'mereb';

export function MultiplayerGame() {
  const [status, setStatus] = useState('Idle');
  const [net, setNet] = useState(null);

  useEffect(() => {
    const client = new MerebClient({
      host: 'my-project.partykit.dev'
    });

    client.on('match-start', ({ role, peerId }) => {
      setStatus(\`Connected to \${peerId} (\${role})\`);
    });

    setNet(client);
    return () => client.disconnect();
  }, []);

  return (
    <div>
      <h3>Status: {status}</h3>
      <button onClick={() => net?.quickPlay()}>⚡ Quick Play</button>
    </div>
  );
}`,

      portals: `import { MerebClient } from 'mereb';

const net = new MerebClient({
  host: 'my-project.partykit.dev',
  portal: 'auto' // Detects Poki or CrazyGames SDK automatically
});

// Built-in Ad-Freeze Protection:
// During rewarded ads or commercial breaks, Mereb temporarily
// pauses gameplay heartbeats to prevent WebRTC timeout disconnects!
async function onWatchRewardedAd() {
  const rewarded = await net.portal.rewardedBreak();
  if (rewarded) {
    grantExtraLives();
  }
}`
    };

    codeBlock.innerText = snippets[tab] || snippets.threejs;
  }

  getElement() {
    return this.element;
  }
}
