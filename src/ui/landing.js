/**
 * Mereb Cloud - Discord-Style Landing Page
 * Clean, punchy, visual-first presentation:
 * - Custom Mereb Geometric Cloud/Signal Logo
 * - Minimal, high-impact copy without text saturation
 * - Signature Discord Blurple (#5865F2) and cosmic starry indigo gradients
 * - Massive, ultra-punchy ABC Ginto / Fredoka display typography
 * - Floating 3D character squad and peaking mascots
 * - Rounded capsule feature cards (border-radius: 48px) with ambient backlight glows
 * - Mobile slide-over navigation drawer with rounded edge (border-radius: 36px)
 * - Full-width infinite ticker marquee ribbon
 * - Exact footer replication from Discord.com with giant screen-wide wordmark
 */
import { auth } from './auth.js';

export class LandingUI {
  constructor({ onLaunchGame, onNavigateDashboard }) {
    this.onLaunchGame = onLaunchGame;
    this.onNavigateDashboard = onNavigateDashboard;
    this.element = document.createElement('div');
    this.element.className = 'landing-root discord-theme';
    this.activeCodeTab = 'godot'; // 'godot' | 'js' | 'curl'
    this.drawerOpen = false;

    auth.onChange(() => {
      this.render();
    });

    this.render();
  }

  render() {
    const user = auth.getUser();

    this.element.innerHTML = `
      <!-- Mobile Slide-Over Navigation Drawer -->
      <div class="discord-drawer-backdrop ${this.drawerOpen ? 'open' : ''}" id="discord-drawer-backdrop"></div>
      <aside class="discord-drawer ${this.drawerOpen ? 'open' : ''}" id="discord-drawer">
        <div class="discord-drawer-header">
          <div class="mereb-brand">
            <svg class="mereb-logo-mark" viewBox="0 0 36 36" width="34" height="34" fill="none">
              <rect width="36" height="36" rx="10" fill="#ffffff"/>
              <path d="M8 24L13 12L18 19L23 12L28 24" stroke="#5865F2" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="18" cy="24" r="2.5" fill="#57F287"/>
            </svg>
            <span class="logo-text">Mereb</span>
          </div>
          <button class="drawer-close-btn" id="drawer-close-btn" aria-label="Close menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <nav class="discord-drawer-nav">
          <a href="#hero" class="drawer-link drawer-nav-item">
            <span>Home</span>
          </a>
          <a href="#features" class="drawer-link drawer-nav-item">
            <span>Features</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </a>
          <a href="#rooms" class="drawer-link drawer-nav-item">
            <span>Realtime Channels</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </a>
          <a href="#engines" class="drawer-link drawer-nav-item">
            <span>Godot 4 & Web</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </a>
          <a href="https://github.com/dawitbaslyos/Mereb" target="_blank" rel="noreferrer" class="drawer-link drawer-nav-item">
            <span>GitHub Repository</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </a>
        </nav>

        <div class="discord-drawer-actions">
          <button class="btn-drawer-console" id="btn-drawer-console">
            <span>${user ? `Open Console (${user.username})` : 'Open Developer Console'}</span>
          </button>
          <a href="/sdk.js" download="mereb-sdk.js" class="btn-drawer-download">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            <span>Download Client SDK</span>
          </a>
        </div>
      </aside>

      <!-- Top Navigation Bar -->
      <header class="discord-header">
        <div class="discord-header-inner">
          <a href="#hero" class="mereb-brand">
            <svg class="mereb-logo-mark" viewBox="0 0 36 36" width="34" height="34" fill="none">
              <rect width="36" height="36" rx="10" fill="#5865F2"/>
              <path d="M8 24L13 12L18 19L23 12L28 24" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="18" cy="24" r="2.5" fill="#57F287"/>
            </svg>
            <span class="logo-text">Mereb</span>
          </a>

          <nav class="discord-nav">
            <a href="#hero" class="discord-nav-link">Download</a>
            <a href="#features" class="discord-nav-link">Features</a>
            <a href="#rooms" class="discord-nav-link">Channels</a>
            <a href="#engines" class="discord-nav-link">Godot 4 & Web</a>
            <a href="https://github.com/dawitbaslyos/Mereb" target="_blank" rel="noreferrer" class="discord-nav-link">GitHub</a>
          </nav>

          <div class="discord-header-actions">
            <button class="discord-btn-white btn-header-login" id="btn-header-login">
              <span>${user ? 'Console' : 'Open Console'}</span>
            </button>
            <button class="discord-hamburger-btn" id="btn-hamburger" aria-label="Toggle navigation">
              <span class="hamburger-line"></span>
              <span class="hamburger-line"></span>
              <span class="hamburger-line"></span>
            </button>
          </div>
        </div>
      </header>

      <!-- HERO SECTION -->
      <section class="discord-hero" id="hero">
        <div class="star-field" aria-hidden="true">
          <div class="star star-1">✦</div>
          <div class="star star-2">+</div>
          <div class="star star-3">✦</div>
          <div class="star star-4">+</div>
          <div class="star star-5">✦</div>
          <div class="star star-6">+</div>
        </div>

        <div class="discord-hero-inner">
          <!-- 3D Mascot Squad Illustration -->
          <div class="hero-mascot-scene" aria-hidden="true">
            <svg class="mascot-svg" viewBox="0 0 860 300" width="100%" height="auto">
              <defs>
                <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#3c45a5" stop-opacity="0.8"/>
                  <stop offset="100%" stop-color="#232b6e" stop-opacity="0"/>
                </linearGradient>
                <linearGradient id="charGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#ec4899"/>
                  <stop offset="100%" stop-color="#8b5cf6"/>
                </linearGradient>
                <linearGradient id="charGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#3b82f6"/>
                  <stop offset="100%" stop-color="#1d4ed8"/>
                </linearGradient>
                <linearGradient id="wumpusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#7c8bf7"/>
                  <stop offset="100%" stop-color="#4e5dd4"/>
                </linearGradient>
                <filter id="glowDrop" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000" flood-opacity="0.4"/>
                </filter>
              </defs>

              <!-- Cloud Base Platform -->
              <ellipse cx="430" cy="260" rx="380" ry="36" fill="url(#cloudGrad)"/>

              <!-- Character 1: Left Cyberpunk Gamer -->
              <g transform="translate(140, 50)" filter="url(#glowDrop)">
                <path d="M45,150 L35,210 L50,212 L60,150 Z" fill="#1e293b"/>
                <path d="M75,150 L95,210 L80,212 L65,150 Z" fill="#2563eb"/>
                <rect x="25" y="210" width="28" height="12" rx="6" fill="#38bdf8"/>
                <rect x="85" y="210" width="28" height="12" rx="6" fill="#38bdf8"/>
                <path d="M30,70 Q60,50 90,70 L85,150 L35,150 Z" fill="url(#charGrad1)"/>
                <path d="M25,65 Q60,90 95,65 Q80,45 40,45 Z" fill="#67e8f9"/>
                <circle cx="60" cy="40" r="22" fill="#fed7aa"/>
                <path d="M38,35 Q60,10 82,35 Q80,18 60,18 Q40,18 38,35 Z" fill="#0f172a"/>
                <path d="M35,38 C32,25 88,25 85,38" fill="none" stroke="#f43f5e" stroke-width="6" stroke-linecap="round"/>
                <circle cx="36" cy="40" r="7" fill="#f43f5e"/>
                <circle cx="84" cy="40" r="7" fill="#f43f5e"/>
              </g>

              <!-- Character 2: Small Robot Companion -->
              <g transform="translate(230, 140)" filter="url(#glowDrop)">
                <rect x="24" y="95" width="8" height="25" rx="4" fill="#64748b"/>
                <rect x="48" y="95" width="8" height="25" rx="4" fill="#64748b"/>
                <rect x="18" y="115" width="20" height="10" rx="5" fill="#f59e0b"/>
                <rect x="42" y="115" width="20" height="10" rx="5" fill="#f59e0b"/>
                <rect x="15" y="45" width="50" height="52" rx="14" fill="#e2e8f0"/>
                <rect x="10" y="8" width="60" height="42" rx="10" fill="#1e293b"/>
                <rect x="15" y="13" width="50" height="32" rx="6" fill="#0f172a"/>
                <circle cx="28" cy="28" r="4" fill="#facc15"/>
                <circle cx="52" cy="28" r="4" fill="#facc15"/>
                <path d="M36,36 Q40,40 44,36" stroke="#facc15" stroke-width="2.5" fill="none" stroke-linecap="round"/>
                <line x1="40" y1="8" x2="40" y2="0" stroke="#94a3b8" stroke-width="3"/>
                <circle cx="40" cy="0" r="4" fill="#ef4444"/>
              </g>

              <!-- Character 3: Center Mascot Creature -->
              <g transform="translate(370, 70)" filter="url(#glowDrop)">
                <ellipse cx="60" cy="115" rx="50" ry="50" fill="url(#wumpusGrad)"/>
                <path d="M22,95 Q60,80 98,95 L95,155 Q60,165 25,155 Z" fill="#ffffff"/>
                <line x1="60" y1="90" x2="60" y2="160" stroke="#cbd5e1" stroke-width="3"/>
                <ellipse cx="38" cy="172" rx="14" ry="10" fill="#4e5dd4"/>
                <ellipse cx="82" cy="172" rx="14" ry="10" fill="#4e5dd4"/>
                <ellipse cx="14" cy="45" rx="12" ry="18" fill="#4e5dd4" transform="rotate(-15 14 45)"/>
                <ellipse cx="106" cy="45" rx="12" ry="18" fill="#4e5dd4" transform="rotate(15 106 45)"/>
                <ellipse cx="60" cy="62" rx="28" ry="18" fill="#93a0f8"/>
                <ellipse cx="52" cy="62" rx="4" ry="6" fill="#2d3780"/>
                <ellipse cx="68" cy="62" rx="4" ry="6" fill="#2d3780"/>
                <circle cx="40" cy="44" r="5" fill="#0f172a"/>
                <circle cx="80" cy="44" r="5" fill="#0f172a"/>
                <circle cx="42" cy="42" r="2" fill="#ffffff"/>
                <circle cx="82" cy="42" r="2" fill="#ffffff"/>
                <path d="M55,18 Q75,10 70,26 Q55,24 55,18 Z" fill="#22c55e"/>
                <circle cx="56" cy="22" r="6" fill="#15803d"/>
              </g>

              <!-- Character 4: Right Gamer -->
              <g transform="translate(560, 65)" filter="url(#glowDrop)">
                <rect x="42" y="145" width="16" height="40" fill="#60a5fa"/>
                <rect x="68" y="145" width="16" height="40" fill="#60a5fa"/>
                <rect x="44" y="185" width="12" height="28" fill="#fed7aa"/>
                <rect x="70" y="185" width="12" height="28" fill="#fed7aa"/>
                <rect x="36" y="210" width="24" height="12" rx="6" fill="#ffffff"/>
                <rect x="66" y="210" width="24" height="12" rx="6" fill="#ffffff"/>
                <path d="M30,75 Q62,60 95,75 L90,148 L35,148 Z" fill="url(#charGrad2)"/>
                <circle cx="62" cy="45" r="20" fill="#fed7aa"/>
                <path d="M40,40 L35,20 L50,30 L60,10 L72,28 L88,18 L82,40 Z" fill="#312e81"/>
                <rect x="48" y="38" width="12" height="10" rx="3" fill="none" stroke="#000" stroke-width="2"/>
                <rect x="64" y="38" width="12" height="10" rx="3" fill="none" stroke="#000" stroke-width="2"/>
                <line x1="60" y1="43" x2="64" y2="43" stroke="#000" stroke-width="2"/>
              </g>
            </svg>
          </div>

          <!-- Main Hero Headline (Clean & Punchy) -->
          <h1 class="discord-hero-title">
            GROUP PLAY THAT’S ALL FUN & GAMES
          </h1>

          <p class="discord-hero-subtitle">
            Instant client-side multiplayer for Godot 4, Three.js, and web games.<br />Zero servers to manage, 100,000 free requests per day.
          </p>

          <!-- Dual Hero Action Buttons -->
          <div class="discord-hero-buttons">
            <a href="/sdk.js" download="mereb-sdk.js" class="discord-btn-white btn-download-hero">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Download Client SDK</span>
            </a>

            <button class="discord-btn-dark btn-browser-hero" id="btn-browser-hero">
              <span>Open Mereb in your browser</span>
            </button>
          </div>
        </div>
      </section>

      <!-- TICKER / MARQUEE RIBBON -->
      <section class="discord-ticker-banner" aria-label="Keywords ticker">
        <div class="ticker-track">
          <div class="ticker-content">
            <span class="ticker-word">CONNECT</span>
            <span class="ticker-icon">☁️</span>
            <span class="ticker-word">SYNC</span>
            <span class="ticker-icon">🎮</span>
            <span class="ticker-word">MULTIPLAYER</span>
            <span class="ticker-icon">⚡</span>
            <span class="ticker-word">WEBSOCKET</span>
            <span class="ticker-icon">🌐</span>
            <span class="ticker-word">GODOT 4</span>
            <span class="ticker-icon">🏆</span>
            <span class="ticker-word">LEADERBOARDS</span>
            <span class="ticker-icon">🚀</span>
            <!-- Duplicate for infinite marquee loop -->
            <span class="ticker-word">CONNECT</span>
            <span class="ticker-icon">☁️</span>
            <span class="ticker-word">SYNC</span>
            <span class="ticker-icon">🎮</span>
            <span class="ticker-word">MULTIPLAYER</span>
            <span class="ticker-icon">⚡</span>
            <span class="ticker-word">WEBSOCKET</span>
            <span class="ticker-icon">🌐</span>
            <span class="ticker-word">GODOT 4</span>
            <span class="ticker-icon">🏆</span>
            <span class="ticker-word">LEADERBOARDS</span>
            <span class="ticker-icon">🚀</span>
          </div>
        </div>
      </section>

      <!-- FEATURE SECTION 1: "MAKE MULTIPLAYER MORE FUN" (Clean, Visual First) -->
      <section class="discord-feature-section" id="features">
        <div class="discord-feature-container">
          <!-- Peaking Mascot Creature on Top Edge -->
          <div class="peaking-mascot-wrapper" aria-hidden="true">
            <svg class="peaking-mascot-svg" viewBox="0 0 120 70" width="100" height="60">
              <rect x="25" y="15" width="70" height="55" rx="20" fill="#4ade80"/>
              <ellipse cx="60" cy="38" rx="22" ry="12" fill="#1e293b"/>
              <circle cx="50" cy="38" r="4" fill="#22c55e"/>
              <circle cx="70" cy="38" r="4" fill="#22c55e"/>
              <rect x="15" y="28" width="10" height="20" rx="5" fill="#22c55e"/>
              <rect x="95" y="28" width="10" height="20" rx="5" fill="#22c55e"/>
              <line x1="60" y1="15" x2="60" y2="4" stroke="#22c55e" stroke-width="4"/>
              <circle cx="60" cy="4" r="5" fill="#86efac"/>
            </svg>
          </div>

          <div class="feature-card-grid">
            <!-- Left Side: Smartphone / Live Channel Mockup with Pink/Magenta Backlight -->
            <div class="mockup-side phone-mockup-wrapper">
              <div class="phone-ambient-glow"></div>
              <div class="phone-frame">
                <div class="phone-notch"></div>
                <div class="phone-screen">
                  <div class="chat-header">
                    <span class="channel-hashtag">#</span>
                    <span class="channel-title">general</span>
                    <span class="status-dot"></span>
                    <span class="status-text">2 Online</span>
                  </div>

                  <div class="chat-messages">
                    <div class="chat-bubble left">
                      <div class="avatar avatar-1">⚽</div>
                      <div class="bubble-content">
                        <span class="author">Striker99</span>
                        <p class="text">Joined the room! Ready for the match?</p>
                      </div>
                    </div>

                    <div class="chat-bubble right">
                      <div class="bubble-content">
                        <span class="author">You</span>
                        <p class="text">Connected over edge socket! RTT: 12ms</p>
                      </div>
                      <div class="avatar avatar-2">🎮</div>
                    </div>

                    <div class="chat-bubble left">
                      <div class="avatar avatar-1">⚽</div>
                      <div class="bubble-content">
                        <span class="author">Striker99</span>
                        <p class="text">Binary transform stream active 🚀</p>
                      </div>
                    </div>
                  </div>

                  <div class="phone-input-bar">
                    <span>Message #general</span>
                    <div class="send-pill">Send</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Side: Concise Copy -->
            <div class="copy-side">
              <h2 class="feature-headline">
                MAKE MULTIPLAYER MORE FUN
              </h2>
              <p class="feature-body">
                Stream real-time JSON events and raw binary packets between players worldwide with sub-10ms edge speed. Zero server provisioning needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- FEATURE SECTION 2: "HOP IN WHEN YOU'RE FREE" -->
      <section class="discord-feature-section alt-bg" id="rooms">
        <div class="discord-feature-container">
          <!-- 3D Origami Diamond Popping Out of Top Right -->
          <div class="origami-mascot-wrapper" aria-hidden="true">
            <svg class="origami-svg" viewBox="0 0 100 100" width="90" height="90">
              <polygon points="50,10 90,40 50,90 10,40" fill="#f43f5e" opacity="0.9"/>
              <polygon points="50,10 90,40 50,45" fill="#fb7185"/>
              <polygon points="10,40 50,45 50,90" fill="#e11d48"/>
              <polygon points="90,40 50,45 50,90" fill="#be123c"/>
            </svg>
          </div>

          <div class="feature-card-grid reverse">
            <!-- Left Side: Desktop Server Channel Mockup -->
            <div class="mockup-side desktop-mockup-wrapper">
              <div class="desktop-window">
                <div class="window-sidebar">
                  <div class="sidebar-header">
                    <span class="server-name">IllegalSoccer Arena</span>
                    <span class="server-chevron">⌵</span>
                  </div>

                  <div class="category-title">TEXT CHANNELS</div>
                  <div class="channel-item active">
                    <span class="hash">#</span>
                    <span>gaming</span>
                  </div>
                  <div class="channel-item">
                    <span class="hash">#</span>
                    <span>main-chat</span>
                  </div>

                  <div class="category-title">REALTIME CHANNELS</div>
                  <div class="channel-item voice active-voice">
                    <span class="speaker">🔊</span>
                    <span>vc-general</span>
                  </div>

                  <div class="voice-users">
                    <div class="user-row">
                      <div class="user-avatar" style="background: #3b82f6;">R</div>
                      <span class="username">Rod</span>
                      <span class="voice-badge">Live</span>
                    </div>
                    <div class="user-row">
                      <div class="user-avatar" style="background: #ec4899;">M</div>
                      <span class="username">moongirl</span>
                    </div>
                    <div class="user-row">
                      <div class="user-avatar" style="background: #10b981;">K</div>
                      <span class="username">kirbs</span>
                    </div>
                  </div>
                </div>

                <div class="window-main">
                  <div class="window-main-header">
                    <span class="main-hash">#</span>
                    <span class="main-channel">gaming</span>
                    <span class="main-desc">Edge Netcode Room</span>
                  </div>
                  <div class="window-logs">
                    <div class="log-entry">
                      <span class="log-time">8:14 AM</span>
                      <span class="log-badge join">JOIN</span>
                      <span class="log-text">Player "Rod" joined room</span>
                    </div>
                    <div class="log-entry">
                      <span class="log-time">8:14 AM</span>
                      <span class="log-badge broadcast">DATA</span>
                      <span class="log-text">Broadcast: { score: 2, ball: [14.2, 8.5] }</span>
                    </div>
                    <div class="log-entry">
                      <span class="log-time">8:16 AM</span>
                      <span class="log-badge ping">PING</span>
                      <span class="log-text">Heartbeat: 12ms RTT latency</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Side: Concise Copy -->
            <div class="copy-side">
              <h2 class="feature-headline">
                HOP IN WHEN YOU'RE FREE, NO NEED TO CALL
              </h2>
              <p class="feature-body">
                Channels auto-scale as players join. No port-forwarding, no firewall headaches, and zero surprise hosting bills.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- FEATURE SECTION 3: 5 LINES OF CODE -->
      <section class="discord-feature-section" id="engines">
        <div class="discord-feature-container">
          <div class="feature-card-grid">
            <!-- Left Side: Interactive Code Snippet Tabs -->
            <div class="mockup-side code-mockup-wrapper">
              <div class="code-container-window">
                <div class="code-tabs-header">
                  <button class="code-tab-btn ${this.activeCodeTab === 'godot' ? 'active' : ''}" data-codetab="godot">
                    Godot 4 GDScript
                  </button>
                  <button class="code-tab-btn ${this.activeCodeTab === 'js' ? 'active' : ''}" data-codetab="js">
                    Native Web JS
                  </button>
                  <button class="code-tab-btn ${this.activeCodeTab === 'curl' ? 'active' : ''}" data-codetab="curl">
                    REST Broadcast
                  </button>
                </div>

                <div class="code-content-box">
                  <button class="btn-copy-code" id="btn-copy-code" title="Copy code">
                    <span>Copy</span>
                  </button>
                  <pre><code id="code-display">${this.getCodeSnippet()}</code></pre>
                </div>

                <div class="code-footer-status">
                  <span class="status-pulse"></span>
                  <span>Edge WebSocket Verified • Sub-10ms RTT</span>
                </div>
              </div>
            </div>

            <!-- Right Side: Concise Copy -->
            <div class="copy-side">
              <h2 class="feature-headline">
                5 LINES OF CODE, ANY GAME ENGINE
              </h2>
              <p class="feature-body">
                Works out of the box with Godot 4, Three.js, and pure browser WebSockets. Copy, paste, and start playing.
              </p>
              <div>
                <button class="discord-btn-white btn-test-code" id="btn-test-code">
                  <span>Open Developer Console</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- RICH FOOTER REPLICATED FROM ATTACHED IMAGE (media_1792671301874_261c749e.png) -->
      <footer class="discord-footer-replicated">
        <!-- Top Horizon Mascot Lineup Section -->
        <div class="footer-mascot-horizon" aria-hidden="true">
          <svg viewBox="0 0 860 280" width="100%" height="auto">
            <defs>
              <linearGradient id="footerCloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#4e5dd4" stop-opacity="0.9"/>
                <stop offset="100%" stop-color="#2a327d" stop-opacity="0"/>
              </linearGradient>
            </defs>

            <!-- Horizon Cloud Layer -->
            <ellipse cx="430" cy="245" rx="420" ry="35" fill="url(#footerCloudGrad)"/>

            <!-- Character Group (Matching the image exactly) -->
            <!-- Left Cyber Character -->
            <g transform="translate(160, 40)">
              <path d="M45,150 L35,210 L50,212 L60,150 Z" fill="#1e293b"/>
              <path d="M75,150 L95,210 L80,212 L65,150 Z" fill="#2563eb"/>
              <path d="M30,70 Q60,50 90,70 L85,150 L35,150 Z" fill="#ec4899"/>
              <path d="M25,65 Q60,90 95,65 Q80,45 40,45 Z" fill="#67e8f9"/>
              <circle cx="60" cy="40" r="22" fill="#fed7aa"/>
              <path d="M35,38 C32,25 88,25 85,38" fill="none" stroke="#f43f5e" stroke-width="6" stroke-linecap="round"/>
              <circle cx="36" cy="40" r="7" fill="#f43f5e"/>
              <circle cx="84" cy="40" r="7" fill="#f43f5e"/>
            </g>

            <!-- Small Robot -->
            <g transform="translate(240, 130)">
              <rect x="15" y="45" width="50" height="52" rx="14" fill="#e2e8f0"/>
              <rect x="10" y="8" width="60" height="42" rx="10" fill="#1e293b"/>
              <rect x="15" y="13" width="50" height="32" rx="6" fill="#0f172a"/>
              <circle cx="28" cy="28" r="4" fill="#facc15"/>
              <circle cx="52" cy="28" r="4" fill="#facc15"/>
              <path d="M36,36 Q40,40 44,36" stroke="#facc15" stroke-width="2.5" fill="none" stroke-linecap="round"/>
              <circle cx="40" cy="0" r="4" fill="#ef4444"/>
            </g>

            <!-- Center Creature Mascot -->
            <g transform="translate(370, 60)">
              <ellipse cx="60" cy="115" rx="50" ry="50" fill="#5865F2"/>
              <path d="M22,95 Q60,80 98,95 L95,155 Q60,165 25,155 Z" fill="#ffffff"/>
              <line x1="60" y1="90" x2="60" y2="160" stroke="#cbd5e1" stroke-width="3"/>
              <ellipse cx="60" cy="62" rx="28" ry="18" fill="#93a0f8"/>
              <ellipse cx="52" cy="62" rx="4" ry="6" fill="#2d3780"/>
              <ellipse cx="68" cy="62" rx="4" ry="6" fill="#2d3780"/>
              <circle cx="40" cy="44" r="5" fill="#0f172a"/>
              <circle cx="80" cy="44" r="5" fill="#0f172a"/>
              <path d="M55,18 Q75,10 70,26 Q55,24 55,18 Z" fill="#22c55e"/>
              <circle cx="56" cy="22" r="6" fill="#15803d"/>
            </g>

            <!-- Right Gamer with Glasses -->
            <g transform="translate(520, 55)">
              <rect x="42" y="145" width="16" height="40" fill="#60a5fa"/>
              <rect x="68" y="145" width="16" height="40" fill="#60a5fa"/>
              <path d="M30,75 Q62,60 95,75 L90,148 L35,148 Z" fill="#3b82f6"/>
              <circle cx="62" cy="45" r="20" fill="#fed7aa"/>
              <path d="M40,40 L35,20 L50,30 L60,10 L72,28 L88,18 L82,40 Z" fill="#312e81"/>
              <rect x="48" y="38" width="12" height="10" rx="3" fill="none" stroke="#000" stroke-width="2"/>
              <rect x="64" y="38" width="12" height="10" rx="3" fill="none" stroke="#000" stroke-width="2"/>
            </g>

            <!-- Witch / Artist Character -->
            <g transform="translate(630, 80)">
              <circle cx="40" cy="50" r="16" fill="#fed7aa"/>
              <path d="M15,45 Q40,15 65,45 Z" fill="#1e1b4b"/>
              <polygon points="40,5 20,40 60,40" fill="#1e1b4b"/>
              <path d="M22,70 L58,70 L55,140 L25,140 Z" fill="#ec4899"/>
            </g>
          </svg>
        </div>

        <!-- Footer Columns Grid (Exact parity with attached image) -->
        <div class="footer-columns-container">
          <div class="footer-grid">
            <!-- Left Info Column -->
            <div class="footer-info-col">
              <div class="mereb-brand footer-brand-mark">
                <svg class="mereb-logo-mark" viewBox="0 0 36 36" width="36" height="36" fill="none">
                  <rect width="36" height="36" rx="10" fill="#ffffff"/>
                  <path d="M8 24L13 12L18 19L23 12L28 24" stroke="#5865F2" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="18" cy="24" r="2.5" fill="#57F287"/>
                </svg>
                <span class="logo-text">Mereb</span>
              </div>

              <!-- Language Dropdown -->
              <div class="footer-widget-group">
                <span class="footer-widget-label">Language</span>
                <div class="footer-lang-box">
                  <span>English</span>
                  <span class="chevron-down">⌵</span>
                </div>
              </div>

              <!-- Social Links -->
              <div class="footer-widget-group">
                <span class="footer-widget-label">Social</span>
                <div class="footer-social-icons">
                  <a href="https://twitter.com" target="_blank" rel="noreferrer" class="social-icon-btn" aria-label="X Twitter">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>
                  <a href="https://instagram.com" target="_blank" rel="noreferrer" class="social-icon-btn" aria-label="Instagram">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </a>
                  <a href="https://facebook.com" target="_blank" rel="noreferrer" class="social-icon-btn" aria-label="Facebook">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.6 5H18V0h-3.808C10.595 0 9 1.583 9 4.615V8z"/></svg>
                  </a>
                  <a href="https://youtube.com" target="_blank" rel="noreferrer" class="social-icon-btn" aria-label="YouTube">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  </a>
                  <a href="https://tiktok.com" target="_blank" rel="noreferrer" class="social-icon-btn" aria-label="TikTok">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 2.89 3.5 2.77 1.81-.04 3.25-1.55 3.32-3.36.07-2.6.02-5.2.03-7.81V.02z"/></svg>
                  </a>
                  <a href="https://github.com/dawitbaslyos/Mereb" target="_blank" rel="noreferrer" class="social-icon-btn" aria-label="GitHub">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                  </a>
                </div>
              </div>
            </div>

            <!-- Column 1: Product -->
            <div class="footer-nav-col">
              <h4 class="col-heading">Product</h4>
              <ul class="col-menu">
                <li><a href="/sdk.js" download="mereb-sdk.js">Download SDK</a></li>
                <li><a href="#engines">Godot 4 Addon</a></li>
                <li><a href="#features">Status</a></li>
                <li><a href="#rooms">App Directory</a></li>
                <li><a href="#hero">100k Free Tier</a></li>
              </ul>
            </div>

            <!-- Column 2: Company -->
            <div class="footer-nav-col">
              <h4 class="col-heading">Company</h4>
              <ul class="col-menu">
                <li><a href="https://github.com/dawitbaslyos/Mereb" target="_blank" rel="noreferrer">About</a></li>
                <li><a href="#hero">Jobs</a></li>
                <li><a href="#hero">Brand</a></li>
                <li><a href="#hero">Newsroom</a></li>
              </ul>
            </div>

            <!-- Column 3: Resources -->
            <div class="footer-nav-col">
              <h4 class="col-heading">Resources</h4>
              <ul class="col-menu">
                <li><a href="#engines">Documentation</a></li>
                <li><a href="#hero">Safety</a></li>
                <li><a href="https://github.com/dawitbaslyos/Mereb" target="_blank" rel="noreferrer">Developers</a></li>
                <li><a href="#hero">Community</a></li>
                <li><a href="#hero">Feedback</a></li>
              </ul>
            </div>

            <!-- Column 4: Policies -->
            <div class="footer-nav-col">
              <h4 class="col-heading">Policies</h4>
              <ul class="col-menu">
                <li><a href="#hero">Terms</a></li>
                <li><a href="#hero">Privacy</a></li>
                <li><a href="#hero">Cookie Settings</a></li>
                <li><a href="#hero">Guidelines</a></li>
                <li><a href="#hero">Licenses</a></li>
              </ul>
            </div>
          </div>
        </div>

        <!-- GIANT TYPOGRAPHIC WATERMARK / WORDMARK (Exact match to image bottom) -->
        <div class="footer-wordmark-wrapper" aria-hidden="true">
          <div class="giant-wordmark">Mereb</div>
        </div>
      </footer>
    `;

    this.attachEventListeners();
  }

  getCodeSnippet() {
    if (this.activeCodeTab === 'godot') {
      return `# Godot 4 Client-Side Realtime Web Connection
extends Node

var ws = WebSocketPeer.new()
const URL = "wss://mereb-signaling.dawitbaslyos.workers.dev/v1/illegalsoccer/general"

func _ready():
    ws.connect_to_url(URL)

func _process(_delta):
    ws.poll()
    if ws.get_ready_state() == WebSocketPeer.STATE_OPEN:
        while ws.get_available_packet_count():
            var packet = ws.get_packet().get_string_from_utf8()
            print("Received: ", packet)

# Broadcast JSON to all connected peers
func send_data(dict: Dictionary):
    if ws.get_ready_state() == WebSocketPeer.STATE_OPEN:
        ws.send_text(JSON.stringify(dict))

# Broadcast raw binary packet
func send_binary(bytes: PackedByteArray):
    if ws.get_ready_state() == WebSocketPeer.STATE_OPEN:
        ws.put_packet(bytes)`;
    }

    if (this.activeCodeTab === 'js') {
      return `// Pure Native Browser WebSocket
const url = 'wss://mereb-signaling.dawitbaslyos.workers.dev/v1/illegalsoccer/general';
const ws = new WebSocket(url);

ws.onopen = () => {
  console.log('Connected to Mereb Edge WebSocket!');
  ws.send(JSON.stringify({ event: 'player-moved', x: 42, y: 88 }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received live packet:', data);
};

// Heartbeat ping / pong for latency check
ws.send(JSON.stringify({ type: 'ping' }));`;
    }

    return `# 1. Broadcast event to all connected sockets in this channel from your backend:
curl -X POST https://mereb-signaling.dawitbaslyos.workers.dev/v1/illegalsoccer/general/broadcast \\
  -H "Content-Type: application/json" \\
  -d '{"event": "goal-scored", "scorer": "Striker99", "score": 1}'

# 2. Query active presence in this channel:
curl https://mereb-signaling.dawitbaslyos.workers.dev/v1/illegalsoccer/general/presence`;
  }

  attachEventListeners() {
    // Drawer handlers
    const drawerBackdrop = this.element.querySelector('#discord-drawer-backdrop');
    const drawer = this.element.querySelector('#discord-drawer');
    const hamburgerBtn = this.element.querySelector('#btn-hamburger');
    const drawerCloseBtn = this.element.querySelector('#drawer-close-btn');

    const openDrawer = () => {
      this.drawerOpen = true;
      drawerBackdrop?.classList.add('open');
      drawer?.classList.add('open');
      document.body.style.overflow = 'hidden';
    };

    const closeDrawer = () => {
      this.drawerOpen = false;
      drawerBackdrop?.classList.remove('open');
      drawer?.classList.remove('open');
      document.body.style.overflow = '';
    };

    hamburgerBtn?.addEventListener('click', openDrawer);
    drawerCloseBtn?.addEventListener('click', closeDrawer);
    drawerBackdrop?.addEventListener('click', closeDrawer);

    this.element.querySelectorAll('.drawer-link').forEach(link => {
      link.addEventListener('click', closeDrawer);
    });

    // Console Navigation handlers
    const navConsole = () => {
      closeDrawer();
      if (this.onNavigateDashboard) this.onNavigateDashboard();
    };

    this.element.querySelector('#btn-header-login')?.addEventListener('click', navConsole);
    this.element.querySelector('#btn-browser-hero')?.addEventListener('click', navConsole);
    this.element.querySelector('#btn-drawer-console')?.addEventListener('click', navConsole);
    this.element.querySelector('#btn-test-code')?.addEventListener('click', navConsole);

    // Code Tab switching
    this.element.querySelectorAll('.code-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-codetab');
        this.activeCodeTab = tab;
        this.element.querySelectorAll('.code-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const codeDisplay = this.element.querySelector('#code-display');
        if (codeDisplay) {
          codeDisplay.textContent = this.getCodeSnippet();
        }
      });
    });

    // Copy Code button
    const copyBtn = this.element.querySelector('#btn-copy-code');
    copyBtn?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(this.getCodeSnippet());
        copyBtn.innerHTML = '<span>Copied! ✓</span>';
        setTimeout(() => {
          copyBtn.innerHTML = '<span>Copy</span>';
        }, 2000);
      } catch (e) {
        console.warn('Copy failed:', e);
      }
    });
  }

  getElement() {
    return this.element;
  }
}
