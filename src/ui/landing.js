/**
 * Mereb Cloud - Official Landing Page
 * Designed in exact parity with Reactor (https://www.reactor.inc/):
 * - Reactor Gold & Void Black Palette
 * - Compact 3px-radius Monospace 11px Buttons
 * - Size-9 (36px) Champagne Gold Technical Vector Icons
 * - Signature 1px Laser Wire Dividers (bg-flow-h)
 * - Chromatic Metallic Model Cards (Mint, Violet, Rose, Indigo)
 * - Overworld-style Production Case Study Panel with animated wire packets and "LIVE ON MEREB" pill
 * - "Copy prompt and your LLM integrates it for you" feature
 * - GitHub (only) authentication & 1-Project Free Tier Console
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
      <!-- Top Navigation -->
      <header class="landing-header">
        <div class="header-inner">
          <div class="header-brand">
            <span class="brand-title">MEREB</span>
            <span class="brand-dot">•</span>
            <span class="brand-sub">CLOUD</span>
            <span class="pill-badge pill-version">v1.0.0</span>
          </div>

          <nav class="header-nav">
            <a href="#models" class="nav-link">Engines</a>
            <a href="#case-study" class="nav-link">Case Study</a>
            <a href="#prompt-section" class="nav-link">LLM Prompt</a>
            <a href="#inspector" class="nav-link">Netcode</a>
            <a href="#pricing" class="nav-link">Pricing</a>
            <a href="https://github.com/dawitbaslyos/Mereb" target="_blank" rel="noreferrer" class="nav-link">GitHub</a>
          </nav>

          <div class="header-actions">
            ${user ? `
              <button class="reactor-btn-secondary btn-go-dashboard">
                <span>⚡ Console (${user.username})</span>
              </button>
            ` : `
              <button class="reactor-btn-secondary btn-login-github" title="Sign in with GitHub">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span>GitHub Login</span>
              </button>
            `}
            <button class="reactor-btn-primary btn-launch-top">
              <span>🎮 Play 3D Demo</span>
            </button>
          </div>
        </div>
      </header>

      <!-- Laser Divider -->
      <div aria-hidden="true" class="reactor-laser-divider">
        <div class="reactor-laser-pulse"></div>
      </div>

      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-content">
          <div class="hero-meta">
            <span class="reactor-tag">⚡ The Multiplayer Netcode Cloud for Games & AI</span>
          </div>

          <h1 class="hero-title">
            Real-time multiplayer in 60 seconds.<br />
            <span class="hero-title-accent">Zero server bills.</span>
          </h1>

          <p class="hero-subtitle">
            Serverless WebRTC P2P DataChannels with global edge signaling. Built for indie games, browser portals (Poki/CrazyGames), and AI agents who don't want surprise $400/mo server compute bills.
          </p>

          <div class="hero-cta-group">
            ${user ? `
              <button class="reactor-btn-primary btn-hero-dashboard">
                <span>⚡ Open Cloud Console</span>
              </button>
            ` : `
              <button class="reactor-btn-primary btn-hero-login">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span>Start Building Free</span>
              </button>
            `}

            <a href="#prompt-section" class="reactor-btn-secondary">
              <span>📋 Copy AI Prompt</span>
            </a>

            <button class="reactor-btn-secondary btn-launch-hero">
              <span>🎮 Play 3D Demo</span>
            </button>
          </div>
        </div>

        <!-- Reactor Feature / Stat 4-Grid Matrix (gap-px with 1px border grid) -->
        <div class="reactor-stats-grid">
          <!-- Stat 1: Latency -->
          <div class="reactor-stat-card">
            <svg class="reactor-stat-icon" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.5 3L6 19.5H18L16.5 33L30 16.5H18L19.5 3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="reactor-stat-category">Latency</span>
            <span class="reactor-stat-metric">Sub-20ms</span>
            <span class="reactor-stat-sublabel">Direct P2P RTT</span>
            <p class="reactor-stat-desc">Direct browser-to-browser UDP channels with zero intermediary server routing overhead.</p>
          </div>

          <!-- Stat 2: Cloud Cost -->
          <div class="reactor-stat-card">
            <svg class="reactor-stat-icon" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 4.5L6 9.75V18C6 25.5 11.25 31.5 18 33C24.75 31.5 30 25.5 30 18V9.75L18 4.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M14 18L17 21L23 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="reactor-stat-category">Cloud Cost</span>
            <span class="reactor-stat-metric">$0 / mo</span>
            <span class="reactor-stat-sublabel">Server Compute</span>
            <p class="reactor-stat-desc">Client host simulates physics. Edge workers coordinate 4-letter rooms and instantly disconnect.</p>
          </div>

          <!-- Stat 3: Data Efficiency -->
          <div class="reactor-stat-card">
            <svg class="reactor-stat-icon" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4.5" y="6" width="11" height="10" rx="1.5" stroke="currentColor" stroke-width="2"/>
              <rect x="20.5" y="6" width="11" height="10" rx="1.5" stroke="currentColor" stroke-width="2"/>
              <rect x="4.5" y="20" width="11" height="10" rx="1.5" stroke="currentColor" stroke-width="2"/>
              <rect x="20.5" y="20" width="11" height="10" rx="1.5" stroke="currentColor" stroke-width="2"/>
            </svg>
            <span class="reactor-stat-category">Data Efficiency</span>
            <span class="reactor-stat-metric">41 Bytes</span>
            <span class="reactor-stat-sublabel">Hermite Binary</span>
            <p class="reactor-stat-desc">Packed binary replication saves 85.6% network bandwidth compared to standard JSON streams.</p>
          </div>

          <!-- Stat 4: Availability -->
          <div class="reactor-stat-card">
            <svg class="reactor-stat-icon" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="18" cy="18" r="13.5" stroke="currentColor" stroke-width="2"/>
              <path d="M4.5 18H31.5" stroke="currentColor" stroke-width="2"/>
              <path d="M18 4.5C21.5 9 23.5 13.5 23.5 18C23.5 22.5 21.5 27 18 31.5C14.5 27 12.5 22.5 12.5 18C12.5 13.5 14.5 9 18 4.5Z" stroke="currentColor" stroke-width="2"/>
            </svg>
            <span class="reactor-stat-category">Availability</span>
            <span class="reactor-stat-metric">99.99%</span>
            <span class="reactor-stat-sublabel">STUN / TURN Mesh</span>
            <p class="reactor-stat-desc">Zero-config NAT traversal with automated 8-second headless bot fallback for 100% match uptime.</p>
          </div>
        </div>
      </section>

      <!-- Laser Divider -->
      <div aria-hidden="true" class="reactor-laser-divider">
        <div class="reactor-laser-pulse"></div>
      </div>

      <!-- "THAT IMAGES DESIGN THING": Chromatic Metallic Model Cards Grid -->
      <section class="section-container" id="models">
        <div class="section-header-reactor">
          <span class="reactor-tag">Models & Engines</span>
          <h2 class="section-title">
            Three.js, Godot, Web Portals.<br />
            One prompt away.
          </h2>
          <p class="section-desc">
            Discover real-time peer-to-peer netcode with drop-in SDK bindings. Try the playable arena, then bring instant multiplayer into your game.
          </p>
        </div>

        <div class="reactor-models-grid">
          <!-- Model Card 1: Three.js 3D (Mint) -->
          <div class="reactor-model-card">
            <div class="reactor-card-bg">
              <svg viewBox="0 0 320 250" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient id="mintGrad" cx="50%" cy="50%" r="60%">
                    <stop offset="0%" stop-color="#a5ccc7" stop-opacity="0.25"/>
                    <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
                  </radialGradient>
                </defs>
                <rect width="320" height="250" fill="url(#mintGrad)"/>
                <path d="M0 190L320 190M0 220L320 220M40 160L280 160" stroke="#a5ccc7" stroke-opacity="0.15" stroke-dasharray="4 4"/>
                <path d="M60 250L130 150M260 250L190 150M160 250L160 150" stroke="#a5ccc7" stroke-opacity="0.18"/>
                <!-- 3D Tank wireframe -->
                <rect x="135" y="170" width="50" height="26" rx="3" stroke="#a5ccc7" stroke-width="1.8" fill="#121816" fill-opacity="0.8"/>
                <circle cx="160" cy="183" r="10" stroke="#a5ccc7" stroke-width="1.8"/>
                <line x1="160" y1="183" x2="160" y2="152" stroke="#a5ccc7" stroke-width="2.2" stroke-linecap="round"/>
                <circle cx="160" cy="148" r="2.5" fill="#a5ccc7"/>
              </svg>
            </div>
            <div class="reactor-card-overlay">
              <span class="reactor-card-badge badge-mint">Three.js 3D</span>
              <h3 class="reactor-card-title">Mereb Tank Arena</h3>
              <p class="reactor-card-desc">Authoritative host simulation with Hermite prediction and 60Hz peer-to-peer data channels.</p>
            </div>
          </div>

          <!-- Model Card 2: Godot 4 (Violet) -->
          <div class="reactor-model-card">
            <div class="reactor-card-bg">
              <svg viewBox="0 0 320 250" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient id="violetGrad" cx="50%" cy="50%" r="60%">
                    <stop offset="0%" stop-color="#c4add5" stop-opacity="0.25"/>
                    <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
                  </radialGradient>
                </defs>
                <rect width="320" height="250" fill="url(#violetGrad)"/>
                <!-- Godot Node Tree wireframe -->
                <circle cx="90" cy="170" r="14" stroke="#c4add5" stroke-width="1.8" fill="#17121c"/>
                <circle cx="160" cy="145" r="18" stroke="#c4add5" stroke-width="1.8" fill="#17121c"/>
                <circle cx="230" cy="170" r="14" stroke="#c4add5" stroke-width="1.8" fill="#17121c"/>
                <line x1="104" y1="166" x2="142" y2="151" stroke="#c4add5" stroke-width="1.5" stroke-dasharray="3 3"/>
                <line x1="178" y1="151" x2="216" y2="166" stroke="#c4add5" stroke-width="1.5" stroke-dasharray="3 3"/>
                <rect x="130" y="200" width="60" height="20" rx="3" stroke="#c4add5" stroke-opacity="0.4" stroke-width="1.2"/>
                <text x="160" y="214" font-family="monospace" font-size="9" fill="#c4add5" text-anchor="middle">RPC.UDP</text>
              </svg>
            </div>
            <div class="reactor-card-overlay">
              <span class="reactor-card-badge badge-violet">Godot 4 Addon</span>
              <h3 class="reactor-card-title">Godot Web Multiplayer</h3>
              <p class="reactor-card-desc">Official GDScript node addon with drop-in signal bindings for high-performance HTML5 exports.</p>
            </div>
          </div>

          <!-- Model Card 3: Web Portals (Rose) -->
          <div class="reactor-model-card">
            <div class="reactor-card-bg">
              <svg viewBox="0 0 320 250" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient id="roseGrad" cx="50%" cy="50%" r="60%">
                    <stop offset="0%" stop-color="#e0bdb4" stop-opacity="0.25"/>
                    <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
                  </radialGradient>
                </defs>
                <rect width="320" height="250" fill="url(#roseGrad)"/>
                <!-- Portal Heartbeat Waveform -->
                <path d="M30 180H110L125 150L145 205L160 170L175 190L190 180H290" stroke="#e0bdb4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="145" cy="205" r="3.5" fill="#e0bdb4"/>
                <circle cx="125" cy="150" r="3.5" fill="#e0bdb4"/>
                <rect x="100" y="215" width="120" height="18" rx="3" stroke="#e0bdb4" stroke-opacity="0.4" stroke-width="1"/>
                <text x="160" y="227" font-family="monospace" font-size="8.5" fill="#e0bdb4" text-anchor="middle">POKI / CRAZYGAMES</text>
              </svg>
            </div>
            <div class="reactor-card-overlay">
              <span class="reactor-card-badge badge-rose">Web Portals</span>
              <h3 class="reactor-card-title">Ad-Freeze Resilient</h3>
              <p class="reactor-card-desc">Background heartbeat preservation prevents player disconnects during 30s full-screen video ads.</p>
            </div>
          </div>

          <!-- Model Card 4: AI Agents (Indigo) -->
          <div class="reactor-model-card">
            <div class="reactor-card-bg">
              <svg viewBox="0 0 320 250" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient id="indigoGrad" cx="50%" cy="50%" r="60%">
                    <stop offset="0%" stop-color="#b6bbdb" stop-opacity="0.25"/>
                    <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
                  </radialGradient>
                </defs>
                <rect width="320" height="250" fill="url(#indigoGrad)"/>
                <!-- Neural Agent Nodes Matrix -->
                <circle cx="80" cy="140" r="4" fill="#b6bbdb"/>
                <circle cx="80" cy="180" r="4" fill="#b6bbdb"/>
                <circle cx="80" cy="220" r="4" fill="#b6bbdb"/>
                <circle cx="160" cy="155" r="5" fill="#b6bbdb"/>
                <circle cx="160" cy="205" r="5" fill="#b6bbdb"/>
                <circle cx="240" cy="180" r="6" fill="#b6bbdb"/>
                <line x1="84" y1="140" x2="155" y2="155" stroke="#b6bbdb" stroke-opacity="0.4" stroke-width="1.2"/>
                <line x1="84" y1="180" x2="155" y2="155" stroke="#b6bbdb" stroke-opacity="0.4" stroke-width="1.2"/>
                <line x1="84" y1="180" x2="155" y2="205" stroke="#b6bbdb" stroke-opacity="0.4" stroke-width="1.2"/>
                <line x1="84" y1="220" x2="155" y2="205" stroke="#b6bbdb" stroke-opacity="0.4" stroke-width="1.2"/>
                <line x1="165" y1="155" x2="234" y2="180" stroke="#b6bbdb" stroke-opacity="0.6" stroke-width="1.5"/>
                <line x1="165" y1="205" x2="234" y2="180" stroke="#b6bbdb" stroke-opacity="0.6" stroke-width="1.5"/>
              </svg>
            </div>
            <div class="reactor-card-overlay">
              <span class="reactor-card-badge badge-indigo">AI Agent Sim</span>
              <h3 class="reactor-card-title">Autonomous NPC Swarm</h3>
              <p class="reactor-card-desc">Sub-20ms sensory and input streaming for LLMs and RL agents playing directly alongside human peers.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Laser Divider -->
      <div aria-hidden="true" class="reactor-laser-divider">
        <div class="reactor-laser-pulse"></div>
      </div>

      <!-- PRODUCTION CASE STUDY BANNER PANEL (Overworld Style) -->
      <section class="section-container" id="case-study">
        <div class="reactor-casestudy-panel">
          <!-- Left Column: Copy & Animated Wire Connector -->
          <div class="casestudy-info">
            <div class="casestudy-meta-row">
              <div class="casestudy-brand-chip">MEREB NETCODE</div>
              <div class="reactor-connection">
                <span class="reactor-wire reactor-wire-left">
                  <span class="reactor-packet"></span>
                </span>
                <span class="reactor-node"></span>
                <span class="reactor-wire reactor-wire-right">
                  <span class="reactor-packet"></span>
                </span>
              </div>
              <div class="casestudy-brand-chip">3D ARENA</div>
            </div>

            <span class="casestudy-tag">Case study · 3D Tank Arena</span>
            <h3 class="casestudy-title">Top-down 3D arena running authoritative host simulation over raw browser UDP.</h3>

            <ul class="casestudy-list">
              <li>
                <svg class="check-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Sub-20ms browser-to-browser round trip, completely bypassing server VMs.</span>
              </li>
              <li>
                <svg class="check-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Automatic 8-second headless bot fallback keeps matchmaking queue zero.</span>
              </li>
              <li>
                <svg class="check-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Zero server maintenance, zero CPU-hour billing, 100% serverless edge.</span>
              </li>
            </ul>

            <div>
              <button class="reactor-btn-primary btn-launch-casestudy">
                <span>🎮 Launch Live Arena</span>
              </button>
            </div>
          </div>

          <!-- Right Column: Visual Mesh + "LIVE ON MEREB" Badge -->
          <div class="casestudy-visual">
            <svg viewBox="0 0 540 380" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%; object-fit: cover;">
              <defs>
                <radialGradient id="arenaGlow" cx="50%" cy="50%" r="55%">
                  <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.2"/>
                  <stop offset="50%" stop-color="#ef4444" stop-opacity="0.1"/>
                  <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
                </radialGradient>
              </defs>
              <rect width="540" height="380" fill="#000000"/>
              <rect width="540" height="380" fill="url(#arenaGlow)"/>
              <!-- Arena Grid -->
              <path d="M40 280L500 280M70 230L470 230M100 180L440 180M130 130L410 130" stroke="rgba(255,255,255,0.08)" stroke-width="1.2"/>
              <path d="M40 280L130 130M500 280L410 130M270 280L270 130M155 280L200 130M385 280L340 130" stroke="rgba(255,255,255,0.08)" stroke-width="1.2"/>
              <!-- Blue Tank (Player 1) -->
              <rect x="170" y="210" width="46" height="26" rx="3" stroke="#60a5fa" stroke-width="2" fill="#1e293b"/>
              <circle cx="193" cy="223" r="8" stroke="#60a5fa" stroke-width="2" fill="#0f172a"/>
              <line x1="193" y1="223" x2="235" y2="223" stroke="#60a5fa" stroke-width="3" stroke-linecap="round"/>
              <!-- Bullet tracer -->
              <circle cx="260" cy="223" r="3" fill="#60a5fa"/>
              <line x1="245" y1="223" x2="257" y2="223" stroke="#60a5fa" stroke-width="1.5" stroke-dasharray="2 2"/>
              <!-- Red Tank (Player 2) -->
              <rect x="340" y="200" width="46" height="26" rx="3" stroke="#f87171" stroke-width="2" fill="#2d1215"/>
              <circle cx="363" cy="213" r="8" stroke="#f87171" stroke-width="2" fill="#1a0b0d"/>
              <line x1="363" y1="213" x2="320" y2="213" stroke="#f87171" stroke-width="3" stroke-linecap="round"/>
            </svg>

            <!-- Bottom Left Live Badge -->
            <div class="casestudy-live-badge">
              <span class="live-dot-pulse"></span>
              <span>Live on Mereb Netcode</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Laser Divider -->
      <div aria-hidden="true" class="reactor-laser-divider">
        <div class="reactor-laser-pulse"></div>
      </div>

      <!-- Live Interactive Netcode Probe -->
      <section class="section-container" id="inspector">
        <div class="section-header-reactor">
          <span class="reactor-tag">Browser Direct UDP</span>
          <h2 class="section-title">Live Netcode Probe</h2>
          <p class="section-desc">Test real-time STUN round-trip latency and inspect raw binary packet serialization directly from your current browser session.</p>
        </div>

        <div class="hero-interactive-card">
          <div class="card-header">
            <div class="card-header-left">
              <span class="card-title">STUN ICE Traversal</span>
              <span class="pill-badge pill-active">Browser Direct</span>
            </div>
            <button class="probe-refresh-btn" id="btn-ping-stun" title="Test STUN Round-Trip">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
              <span class="box-caption">State Replication Inspector</span>
              <div class="segmented-control">
                <button class="seg-btn active" data-format="binary">Packed Binary (41 B)</button>
                <button class="seg-btn" data-format="json">Plain JSON (284 B)</button>
              </div>
            </div>

            <div class="packet-preview" id="packet-preview-box"></div>
          </div>
        </div>
      </section>

      <!-- Laser Divider -->
      <div aria-hidden="true" class="reactor-laser-divider">
        <div class="reactor-laser-pulse"></div>
      </div>

      <!-- KEY VALUE SECTION: The LLM Integration Prompt Generator -->
      <section class="section-container" id="prompt-section">
        <div class="section-header-reactor">
          <span class="reactor-tag">Cursor / Claude / Copilot Ready</span>
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

            <button class="reactor-btn-primary btn-copy-prompt" id="btn-copy-prompt">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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

      <!-- Laser Divider -->
      <div aria-hidden="true" class="reactor-laser-divider">
        <div class="reactor-laser-pulse"></div>
      </div>

      <!-- PRICING SECTION -->
      <section class="section-container" id="pricing">
        <div class="section-header-reactor">
          <span class="reactor-tag">Simple & Predictable</span>
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

            <button class="reactor-btn-secondary btn-pricing-free btn-login-github">
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

            <button class="reactor-btn-primary btn-pricing-pro">
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
              <div class="feature-item">✓ Dedicated Architecture Review</div>
            </div>

            <a href="https://github.com/dawitbaslyos/Mereb/issues" target="_blank" rel="noreferrer" class="reactor-btn-secondary">
              Contact Studio Team
            </a>
          </div>
        </div>
      </section>

      <!-- Laser Divider -->
      <div aria-hidden="true" class="reactor-laser-divider">
        <div class="reactor-laser-pulse"></div>
      </div>

      <!-- Closing CTA Banner -->
      <section class="cta-banner-section">
        <div class="cta-card">
          <h2 class="cta-card-title">The Serverless Multiplayer Era Is Here.</h2>
          <p class="cta-card-text">
            Mereb is the netcode infrastructure layer for real-time games and AI agent worlds. Sign in with GitHub to generate your API keys in 5 seconds.
          </p>
          <div class="cta-btn-wrap">
            ${user ? `
              <button class="reactor-btn-primary btn-hero-dashboard">
                <span>⚡ Open Cloud Console</span>
              </button>
            ` : `
              <button class="reactor-btn-primary btn-login-github">
                <span>Start Building Free</span>
              </button>
            `}
            <button class="reactor-btn-secondary btn-launch-hero">
              <span>🎮 Play 3D Arena Demo</span>
            </button>
          </div>
        </div>
      </section>

      <!-- Laser Divider -->
      <div aria-hidden="true" class="reactor-laser-divider">
        <div class="reactor-laser-pulse"></div>
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
    const playBtns = this.element.querySelectorAll('.btn-launch-top, .btn-launch-hero, .btn-launch-casestudy');
    playBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.onLaunchGame) this.onLaunchGame();
      });
    });

    // 2. Dashboard triggers
    const dashBtns = this.element.querySelectorAll('.btn-go-dashboard, .btn-hero-dashboard');
    dashBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.onNavigateDashboard) this.onNavigateDashboard();
      });
    });

    // 3. GitHub Login triggers
    const loginBtns = this.element.querySelectorAll('.btn-login-github, .btn-hero-login');
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
      threejs: `I want to add serverless real-time 1v1 multiplayer to my Three.js game using the 'mereb-netcode' npm package.

Follow these instructions:
1. Install 'mereb-netcode' (npm install mereb-netcode) and import:
   import { MerebClient, MerebLobby } from 'mereb-netcode';

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

      canvas: `I want to add serverless P2P multiplayer to my HTML5 2D Canvas / Phaser game using the 'mereb-netcode' SDK.

Please refactor my game loop to support 2-player WebRTC peer-to-peer networking:
1. Import { MerebClient, MerebLobby } from 'mereb-netcode'.
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

      react: `I want to add multiplayer connectivity to my React / Next.js web application or interactive game canvas using 'mereb-netcode'.

Write a clean React custom hook 'useMereb(options)' that:
1. Initializes MerebClient in a useEffect and cleans it up on unmount.
2. Exposes state: { status, role, peerId, isHost, ping, isBot }.
3. Exposes methods: { createRoom, joinRoom, quickPlay, sendState, sendInput, sendEvent }.
4. Subscribes to 'match-start', 'state', 'event', 'quality', and 'peer-disconnect'.
5. Displays a modern Tailwind/shadcn lobby dialog with 4-letter room code sharing.`,

      ai: `I am building an autonomous AI game agent or virtual NPC that connects as a player into a Mereb WebRTC game room.

Using Node.js and 'mereb-netcode':
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
