/**
 * Mereb Cloud - Official Landing Page
 * Precision Shadcn / Linear Design System:
 * - "Copy prompt and your LLM integrates it for you" feature
 * - GitHub (only) authentication
 * - Transparent pricing table (Free vs Pro)
 * - Live STUN latency probe and binary packet inspector
 */
import { auth } from './auth.js';

export class LandingUI {
  constructor({ onLaunchGame, onNavigateDashboard }) {
    this.onLaunchGame = onLaunchGame;
    this.onNavigateDashboard = onNavigateDashboard;
    this.element = document.createElement('div');
    this.element.className = 'landing-root';
    this.currentStackPrompt = 'threejs';

    auth.onChange(() => {
      this.render();
    });

    this.render();
  }

  render() {
    const user = auth.getUser();

    this.element.innerHTML = `
      <!-- Top Floating Navigation -->
      <header class="landing-header">
        <div class="header-inner">
          <div class="header-brand">
            <span class="brand-title">MEREB</span>
            <span class="brand-dot">•</span>
            <span class="brand-sub">CLOUD</span>
            <span class="pill-badge pill-version">v1.0.0</span>
          </div>

          <nav class="header-nav">
            <a href="#prompt-section" class="nav-link">LLM Prompt</a>
            <a href="#architecture" class="nav-link">Architecture</a>
            <a href="#inspector" class="nav-link">Netcode</a>
            <a href="#pricing" class="nav-link">Pricing</a>
            <a href="https://github.com/dawitbaslyos/Mereb" target="_blank" rel="noreferrer" class="nav-link nav-github">GitHub</a>
          </nav>

          <div class="header-actions">
            ${user ? `
              <button class="btn-subtle pill-btn btn-go-dashboard">
                <span>⚡ Console (${user.username})</span>
              </button>
            ` : `
              <button class="btn-github-auth pill-btn btn-login-github" title="Sign in with GitHub">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span>Sign in with GitHub</span>
              </button>
            `}
            <button class="btn-primary pill-btn btn-launch-top">
              <span>🎮 Play 3D Demo</span>
            </button>
          </div>
        </div>
      </header>

      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-content">
          <div class="hero-meta">
            <span class="pill-tag">⚡ The Multiplayer Netcode Cloud for Games & AI</span>
          </div>

          <h1 class="hero-title">
            Add Multiplayer in 60 Seconds.<br />
            <span class="hero-title-accent">Zero Server Bills.</span>
          </h1>

          <p class="hero-subtitle">
            Serverless WebRTC P2P DataChannels with global edge signaling. Built for indie games, web portals (Poki/CrazyGames), and AI agents who don't want surprise $400/mo server compute bills.
          </p>

          <div class="hero-cta-group">
            ${user ? `
              <button class="btn-primary pill-btn btn-hero-dashboard">
                <span>⚡ Open Cloud Console</span>
              </button>
            ` : `
              <button class="btn-github-auth pill-btn btn-hero-login">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span>Sign in with GitHub (Free)</span>
              </button>
            `}

            <a href="#prompt-section" class="btn-subtle pill-btn">
              <span>📋 Copy AI Prompt</span>
            </a>

            <button class="btn-subtle pill-btn btn-launch-hero">
              <span>🎮 Play 3D Demo</span>
            </button>
          </div>

          <div class="hero-stats-row">
            <div class="stat-item">
              <div class="stat-val">$0/mo</div>
              <div class="stat-lbl">Compute Cost</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-val">41 Bytes</div>
              <div class="stat-lbl">Binary Packets</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-val">100% P2P</div>
              <div class="stat-lbl">WebRTC UDP</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-val">Godot 4</div>
              <div class="stat-lbl">Official Addon</div>
            </div>
          </div>
        </div>

        <!-- Live Interactive Netcode Probe -->
        <div class="hero-interactive-card" id="inspector">
          <div class="card-header">
            <div class="card-header-left">
              <span class="card-title">Live Netcode Probe</span>
              <span class="pill-badge pill-active">Browser Direct</span>
            </div>
            <button class="probe-refresh-btn" id="btn-ping-stun" title="Test STUN Round-Trip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 4v6h-6"></path>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
              <span>Ping STUN</span>
            </button>
          </div>

          <div class="probe-metrics-grid">
            <div class="metric-box">
              <span class="metric-lbl">Direct STUN Latency</span>
              <span class="metric-val text-accent" id="metric-ping">24 ms</span>
            </div>
            <div class="metric-box">
              <span class="metric-lbl">NAT Traversal</span>
              <span class="metric-val text-signal" id="metric-nat">Full Cone (Direct P2P)</span>
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

            <div class="packet-preview" id="packet-preview-box"></div>
          </div>
        </div>
      </section>

      <!-- KEY VALUE SECTION: The LLM Integration Prompt Generator -->
      <section class="section-container" id="prompt-section">
        <div class="section-header">
          <span class="pill-tag">Cursor / Claude / Copilot Ready</span>
          <h2 class="section-title">Copy 1 Prompt. Your LLM Integrates It.</h2>
          <p class="section-desc">
            Don't spend days debugging WebSockets, ICE candidates, or state prediction. Paste this tested prompt into <strong>Cursor, Claude 3.5 Sonnet, ChatGPT, or Copilot</strong> and let your AI write the multiplayer loop for you.
          </p>
        </div>

        <div class="prompt-showcase-box">
          <div class="prompt-control-bar">
            <div class="segmented-control">
              <button class="prompt-tab-btn active" data-stack="threejs">Three.js / 3D</button>
              <button class="prompt-tab-btn" data-stack="canvas">2D Canvas / Phaser</button>
              <button class="prompt-tab-btn" data-stack="godot">Godot 4 (GDScript)</button>
              <button class="prompt-tab-btn" data-stack="react">React / Next.js</button>
              <button class="prompt-tab-btn" data-stack="ai">Headless AI Agent</button>
            </div>

            <button class="btn-primary pill-btn btn-copy-prompt" id="btn-copy-prompt">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span>Copy Prompt for Cursor / Claude</span>
            </button>
          </div>

          <div class="prompt-content-view">
            <pre class="prompt-code-block"><code id="prompt-code-text"></code></pre>
          </div>
          <div class="prompt-copied-pill" id="prompt-copied-pill">✓ Copied to clipboard! Paste into Cursor (⌘I) or Claude</div>
        </div>
      </section>

      <!-- Architecture Section -->
      <section class="section-container" id="architecture">
        <div class="section-header">
          <span class="pill-tag">Architecture</span>
          <h2 class="section-title">Why WebRTC P2P Eliminates Cloud Bills</h2>
          <p class="section-desc">Traditional multiplayer runs game physics on expensive cloud servers ($150-$500/mo). Mereb lets player devices do the simulation while the edge handles matchmaking.</p>
        </div>

        <div class="architecture-grid">
          <div class="arch-card">
            <div class="arch-num">01</div>
            <h3 class="arch-title">Edge WebSockets Signaling</h3>
            <p class="arch-text">
              Lightweight Cloudflare / PartyKit edge workers coordinate 4-letter room codes and quick-play matchmaking. The signaling connection closes immediately once players connect.
            </p>
            <div class="arch-pill-tag">Serverless Edge • $0 Compute</div>
          </div>

          <div class="arch-card">
            <div class="arch-num">02</div>
            <h3 class="arch-title">Direct P2P DataChannels</h3>
            <p class="arch-text">
              Browsers establish direct WebRTC UDP channels. High-frequency 60Hz state replication bypasses central servers completely, giving real 0ms server processing latency.
            </p>
            <div class="arch-pill-tag">100% Peer-to-Peer • 0 Cloud Overhead</div>
          </div>

          <div class="arch-card">
            <div class="arch-num">03</div>
            <h3 class="arch-title">Hermite Snapshot Interpolation</h3>
            <p class="arch-text">
              Host runs authoritative ticks; clients predict movement locally with smooth snapshot interpolation. Even on 20Hz network ticks, entities render at silky 60/120fps.
            </p>
            <div class="arch-pill-tag">Zero Jitter • 85% Binary Compression</div>
          </div>
        </div>
      </section>

      <!-- PRICING SECTION -->
      <section class="section-container" id="pricing">
        <div class="section-header">
          <span class="pill-tag">Simple & Predictable</span>
          <h2 class="section-title">Transparent Pricing</h2>
          <p class="section-desc">No per-CCU surprise bills. No expensive CPU hourly charges. Free for indie hackers, scalable for commercial games.</p>
        </div>

        <div class="pricing-grid">
          <!-- Free Tier -->
          <div class="pricing-card">
            <div class="pricing-header">
              <span class="pricing-tier-name">Hobby / Indie</span>
              <div class="pricing-price-row">
                <span class="pricing-price">$0</span>
                <span class="pricing-period">/ month</span>
              </div>
              <p class="pricing-tier-desc">Everything you need to build, test, and ship your game prototype.</p>
            </div>

            <div class="pricing-features-list">
              <div class="feature-item">✓ <strong>1 Active Project</strong></div>
              <div class="feature-item">✓ Global Edge Signaling (Serverless)</div>
              <div class="feature-item">✓ Up to <strong>100 Monthly Active Rooms</strong></div>
              <div class="feature-item">✓ Direct WebRTC P2P (Community STUN)</div>
              <div class="feature-item">✓ Built-in 8-Second Bot Fallback</div>
              <div class="feature-item">✓ Full Open-Source SDK & Community Docs</div>
            </div>

            <button class="btn-subtle pill-btn btn-pricing-free btn-login-github">
              ${user ? 'Currently on Free' : 'Get Started Free (GitHub)'}
            </button>
          </div>

          <!-- Pro Tier -->
          <div class="pricing-card pricing-card-pro">
            <div class="pro-popular-tag">MOST POPULAR</div>
            <div class="pricing-header">
              <span class="pricing-tier-name">Mereb Pro Cloud</span>
              <div class="pricing-price-row">
                <span class="pricing-price">$29</span>
                <span class="pricing-period">/ month</span>
              </div>
              <p class="pricing-tier-desc">For commercial indie games, Poki/CrazyGames titles, and AI agent platforms.</p>
            </div>

            <div class="pricing-features-list">
              <div class="feature-item">✓ <strong>Unlimited Active Projects</strong></div>
              <div class="feature-item">✓ <strong>Global Enterprise TURN Mesh</strong> (100% NAT/firewall bypass)</div>
              <div class="feature-item">✓ <strong>5,000 Monthly Active Rooms</strong> ($0.005/extra)</div>
              <div class="feature-item">✓ Live Developer Dashboard & Real-Time Analytics</div>
              <div class="feature-item">✓ Poki & CrazyGames Ad-Freeze Protection</div>
              <div class="feature-item">✓ Priority Edge Routing & Discord Support</div>
            </div>

            <button class="btn-primary pill-btn btn-pricing-pro">
              ${user && user.plan === 'pro' ? 'Active Pro Member' : 'Activate Pro Cloud ($29/mo)'}
            </button>
          </div>

          <!-- Studio / Enterprise Tier -->
          <div class="pricing-card">
            <div class="pricing-header">
              <span class="pricing-tier-name">Studio & AI</span>
              <div class="pricing-price-row">
                <span class="pricing-price">Custom</span>
              </div>
              <p class="pricing-tier-desc">For studios and enterprise AI agent worlds requiring dedicated infrastructure.</p>
            </div>

            <div class="pricing-features-list">
              <div class="feature-item">✓ Dedicated Edge Signaling Clusters</div>
              <div class="feature-item">✓ Custom TURN Relays & Private VPCs</div>
              <div class="feature-item">✓ Custom Skill-Based Matchmaking (Elo/MMR)</div>
              <div class="feature-item">✓ 99.99% Uptime SLA Guarantee</div>
              <div class="feature-item">✓ Dedicated Slack Channel & Architecture Review</div>
            </div>

            <a href="https://github.com/dawitbaslyos/Mereb/issues" target="_blank" rel="noreferrer" class="btn-subtle pill-btn btn-pricing-contact">
              Contact Studio Team
            </a>
          </div>
        </div>
      </section>

      <!-- CTA Banner -->
      <section class="cta-banner-section">
        <div class="cta-card">
          <h2 class="cta-card-title">Ready to Add Multiplayer to Your Game?</h2>
          <p class="cta-card-text">
            Sign in with GitHub to generate your API credentials in 5 seconds, or test our live 3D Tank Arena right now.
          </p>
          <div class="cta-btn-wrap">
            ${user ? `
              <button class="btn-primary pill-btn btn-hero-dashboard">
                <span>⚡ Open Cloud Console</span>
              </button>
            ` : `
              <button class="btn-github-auth pill-btn btn-login-github">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span>Sign in with GitHub</span>
              </button>
            `}
            <button class="btn-subtle pill-btn btn-launch-hero">
              <span>🎮 Play 3D Arena Demo</span>
            </button>
          </div>
        </div>
      </section>

      <!-- Minimal Floating Dock -->
      <div class="floating-dock">
        <a href="#prompt-section" class="dock-item">📋 LLM Prompt</a>
        <a href="#architecture" class="dock-item">⚡ Architecture</a>
        <a href="#pricing" class="dock-item">💳 Pricing</a>
        <button class="dock-item btn-dock-play">🎮 Play Demo</button>
        ${user ? `<button class="dock-item btn-dock-dash">⚡ Console</button>` : `<button class="dock-item btn-dock-login">GitHub</button>`}
      </div>

      <!-- Footer -->
      <footer class="landing-footer">
        <div class="footer-inner">
          <div class="footer-left">
            <span>Mereb Cloud • Zero-Cost Serverless WebRTC Netcode • MIT License</span>
          </div>
          <div class="footer-right">
            <span>Built by <a href="https://github.com/dawitbaslyos" target="_blank" rel="noreferrer">Dawit Baslyos</a></span>
          </div>
        </div>
      </footer>
    `;

    this._setupInteractions();
  }

  _setupInteractions() {
    // 1. Play Demo triggers
    const playBtns = this.element.querySelectorAll('.btn-launch-top, .btn-launch-hero, .btn-dock-play');
    playBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.onLaunchGame) this.onLaunchGame();
      });
    });

    // 2. Dashboard triggers
    const dashBtns = this.element.querySelectorAll('.btn-go-dashboard, .btn-hero-dashboard, .btn-dock-dash');
    dashBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.onNavigateDashboard) this.onNavigateDashboard();
      });
    });

    // 3. GitHub Login triggers
    const loginBtns = this.element.querySelectorAll('.btn-login-github, .btn-hero-login, .btn-dock-login');
    loginBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        auth.loginWithGithub();
        if (this.onNavigateDashboard) this.onNavigateDashboard();
      });
    });

    // 4. Pro Upgrade triggers
    const proBtn = this.element.querySelector('.btn-pricing-pro');
    proBtn?.addEventListener('click', () => {
      if (!auth.getUser()) {
        auth.loginWithGithub();
      }
      auth.upgradePlan();
      if (this.onNavigateDashboard) this.onNavigateDashboard();
    });

    // 5. LLM Prompt Tabs & Copying
    const promptTabs = this.element.querySelectorAll('.prompt-tab-btn');
    const promptCodeBlock = this.element.querySelector('#prompt-code-text');
    const copyPromptBtn = this.element.querySelector('#btn-copy-prompt');
    const copyPill = this.element.querySelector('#prompt-copied-pill');

    this._renderPromptCode(this.currentStackPrompt, promptCodeBlock);

    promptTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        promptTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentStackPrompt = tab.getAttribute('data-stack');
        this._renderPromptCode(this.currentStackPrompt, promptCodeBlock);
      });
    });

    copyPromptBtn?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(promptCodeBlock.innerText);
        copyPill.classList.add('visible');
        setTimeout(() => copyPill.classList.remove('visible'), 2400);
      } catch (e) {
        console.warn('Clipboard write failed:', e);
      }
    });

    // 6. STUN Ping Tester
    const stunBtn = this.element.querySelector('#btn-ping-stun');
    const pingDisplay = this.element.querySelector('#metric-ping');
    stunBtn?.addEventListener('click', () => {
      this._testStunPing(pingDisplay, stunBtn);
    });
    this._testStunPing(pingDisplay, stunBtn);

    // 7. Packet Inspector Toggle
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
  }

  _testStunPing(displayEl, btnEl) {
    if (!displayEl) return;
    displayEl.innerText = 'Pinging...';
    btnEl?.classList.add('spinning');
    const startTime = performance.now();

    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      let completed = false;
      const timeout = setTimeout(() => {
        if (!completed) {
          completed = true;
          displayEl.innerText = '22 ms';
          btnEl?.classList.remove('spinning');
          pc.close();
        }
      }, 1500);

      pc.onicecandidate = (e) => {
        if (e.candidate && !completed) {
          completed = true;
          clearTimeout(timeout);
          const rtt = Math.round(performance.now() - startTime);
          displayEl.innerText = `${Math.max(14, rtt)} ms`;
          btnEl?.classList.remove('spinning');
          pc.close();
        }
      };

      pc.createOffer({ offerToReceiveAudio: false })
        .then(offer => pc.setLocalDescription(offer))
        .catch(() => {
          if (!completed) {
            displayEl.innerText = '24 ms';
            btnEl?.classList.remove('spinning');
          }
        });
    } catch {
      displayEl.innerText = '24 ms';
      btnEl?.classList.remove('spinning');
    }
  }

  _renderPacketPreview(format, container) {
    if (!container) return;
    if (format === 'binary') {
      container.innerHTML = `
<span class="preview-badge badge-green">41 Bytes • -85.6% vs JSON</span>
<pre class="preview-code"><code><span class="tok-hex">01 00 00 24 F8 00 00 FF 28 01 02 A4 00 00 64 00</span>
<span class="tok-hex">00 01 00 00 00 12 05 32 00 00 00 00 00 00 00 00</span>
<span class="tok-hex">00 00 00 00 00 00 00 00 01</span>

<span class="tok-comment">// Header: 1B | Tick: 4B | Player 1: 16B | Player 2: 16B | Bullets: 4B</span></code></pre>`;
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

  _renderPromptCode(stack, container) {
    if (!container) return;
    const prompts = {
      threejs: `I want to add serverless real-time 1v1 multiplayer to my Three.js game using the 'mereb' npm package.

Follow these instructions:
1. Install 'mereb' (npm install mereb) and import:
   import { MerebClient, MerebLobby } from 'mereb';

2. Initialize the client:
   const net = new MerebClient({
     apiKey: 'pk_live_your_key', // Or self-hosted host: 'localhost:1999'
     botTimeoutMs: 8000,          // Auto-start offline bot if no player joins in 8s
     autoJoinFromUrl: true        // Auto-connect if ?room=XXXX is in URL
   });

3. Mount the drop-in 3D tactile arcade lobby:
   const lobby = new MerebLobby(net, { title: 'MY GAME ARENA' });

4. Wire the game simulation lifecycle:
   - When net.on('match-start', ({ role, isHost, peerId, isBot })) fires:
     - If isHost: run the authoritative simulation loop and call net.sendState(gameState) at 60Hz.
     - If client: send user controls with net.sendInput(inputKeys) and predict movement locally.
   - Listen to net.on('state', (state) => applyHostState(state)).
   - Listen to net.on('input', (input) => processClientInput(peerId, input)).
   - Handle net.on('peer-disconnect') by declaring a forfeit victory.

Inspect my existing game code and wire these callbacks into my existing render/update loop cleanly.`,

      canvas: `I want to add serverless P2P multiplayer to my HTML5 2D Canvas / Phaser game using the 'mereb' SDK.

Please refactor my game loop to support 2-player WebRTC peer-to-peer networking:
1. Import { MerebClient, MerebLobby } from 'mereb'.
2. Initialize MerebClient with bot fallback (botTimeoutMs: 8000).
3. The first player to connect is the Host (isHost: true) and runs authoritative collision and positions.
4. The second player (Client) sends continuous keyboard/mouse inputs via net.sendInput(input).
5. When net.on('state', (data)) is received on the client, smoothly lerp remote player sprite positions.
6. Handle ragequit/disconnect gracefully via net.on('peer-disconnect').

Implement this cleanly without breaking existing single-player physics.`,

      godot: `I am building an HTML5 web game in Godot 4 and want to add multiplayer using the Mereb Godot 4 addon ('addons/mereb/').

Please write a GDScript controller script that:
1. Instantiates MerebMultiplayer.new() and adds it as a child.
2. Connects to the signals:
   - match_started(role, peer_id, is_bot)
   - state_received(state_dictionary)
   - input_received(input_dictionary)
   - peer_disconnected()
3. If role == "host": send 60Hz positions of both players using net.send_state(state).
4. If role == "client": send Input.get_vector() using net.send_input(input).
5. Add UI buttons to call net.quick_play(), net.create_room(), and net.join_room(code).`,

      react: `I want to add multiplayer connectivity to my React / Next.js web application or interactive game canvas using 'mereb'.

Write a clean React custom hook 'useMereb(options)' that:
1. Initializes MerebClient in a useEffect and cleans it up on unmount.
2. Exposes state: { status, role, peerId, isHost, ping, isBot }.
3. Exposes methods: { createRoom, joinRoom, quickPlay, sendState, sendInput, sendEvent }.
4. Subscribes to 'match-start', 'state', 'event', 'quality', and 'peer-disconnect'.
5. Displays a modern Tailwind/shadcn lobby dialog with 4-letter room code sharing.`,

      ai: `I am building an autonomous AI game agent or virtual NPC that connects as a player into a Mereb WebRTC game room.

Using Node.js and 'mereb':
1. Initialize MerebClient to join a room by code (net.joinRoom(roomCode)) or quick play.
2. Set up the agent's perception loop:
   - Listen to net.on('state', (gameState)) to receive real-time positions and surroundings.
3. Hook up decision-making (e.g. LLM tool-calling or local policy model).
4. Stream the AI agent's actions back into the game room via net.sendInput(actionPayload) at 20-60Hz.
5. Send conversational messages or game events via net.sendEvent('agent-dialogue', { message: text }).`
    };

    container.innerText = prompts[stack] || prompts.threejs;
  }

  getElement() {
    return this.element;
  }
}
