/**
 * Mereb Cloud - Discord-Style Landing Page
 * Pixel-accurate adaptation of discord.com:
 * - Signature Discord Blurple (#5865F2) and cosmic starry indigo gradients
 * - Massive, ultra-punchy all-caps ABC Ginto / Fredoka display typography
 * - Floating 3D character squad and peaking mascots
 * - Rounded capsule feature cards (border-radius: 48px) with ambient backlight glows
 * - Mobile slide-over navigation drawer with rounded edge (border-radius: 36px)
 * - Full-width infinite ticker marquee ribbon
 * - High-contrast white pill CTA buttons
 * - Multi-column midnight footer
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
          <div class="discord-logo">
            <svg class="clyde-icon" viewBox="0 0 127.14 96.36" width="34" height="26">
              <path fill="currentColor" d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,45.91,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,45.91,96.12,53,91.08,65.69,84.69,65.69Z"/>
            </svg>
            <span class="logo-text">Mereb</span>
          </div>
          <button class="drawer-close-btn" id="drawer-close-btn" aria-label="Close menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
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
          <a href="#engines" class="drawer-link drawer-nav-item">
            <span>Godot & Web SDK</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </a>
          <a href="#leaderboards" class="drawer-link drawer-nav-item">
            <span>Leaderboards</span>
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
          <a href="#hero" class="discord-brand">
            <svg class="clyde-icon" viewBox="0 0 127.14 96.36" width="38" height="28">
              <path fill="currentColor" d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,45.91,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,45.91,96.12,53,91.08,65.69,84.69,65.69Z"/>
            </svg>
            <span class="logo-text">Mereb</span>
          </a>

          <nav class="discord-nav">
            <a href="#hero" class="discord-nav-link">Download</a>
            <a href="#features" class="discord-nav-link">Features</a>
            <a href="#engines" class="discord-nav-link">Godot 4 & Web</a>
            <a href="#leaderboards" class="discord-nav-link">Leaderboards</a>
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
            <svg class="mascot-svg" viewBox="0 0 860 320" width="100%" height="auto">
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
                <linearGradient id="botGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#fbbf24"/>
                  <stop offset="100%" stop-color="#f59e0b"/>
                </linearGradient>
                <filter id="glowDrop" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000" flood-opacity="0.4"/>
                </filter>
              </defs>

              <!-- Cloud Base Platform -->
              <ellipse cx="430" cy="270" rx="380" ry="40" fill="url(#cloudGrad)"/>

              <!-- Character 1: Left Cyberpunk Gamer -->
              <g transform="translate(140, 60)" filter="url(#glowDrop)">
                <!-- Legs -->
                <path d="M45,150 L35,210 L50,212 L60,150 Z" fill="#1e293b"/>
                <path d="M75,150 L95,210 L80,212 L65,150 Z" fill="#2563eb"/>
                <!-- Boots -->
                <rect x="25" y="210" width="28" height="12" rx="6" fill="#38bdf8"/>
                <rect x="85" y="210" width="28" height="12" rx="6" fill="#38bdf8"/>
                <!-- Torso & Hoodie -->
                <path d="M30,70 Q60,50 90,70 L85,150 L35,150 Z" fill="url(#charGrad1)"/>
                <!-- Scarf -->
                <path d="M25,65 Q60,90 95,65 Q80,45 40,45 Z" fill="#67e8f9"/>
                <!-- Head -->
                <circle cx="60" cy="40" r="22" fill="#fed7aa"/>
                <path d="M38,35 Q60,10 82,35 Q80,18 60,18 Q40,18 38,35 Z" fill="#0f172a"/>
                <!-- Headphones -->
                <path d="M35,38 C32,25 88,25 85,38" fill="none" stroke="#f43f5e" stroke-width="6" stroke-linecap="round"/>
                <circle cx="36" cy="40" r="7" fill="#f43f5e"/>
                <circle cx="84" cy="40" r="7" fill="#f43f5e"/>
              </g>

              <!-- Character 2: Small Robot Companion -->
              <g transform="translate(230, 150)" filter="url(#glowDrop)">
                <!-- Legs -->
                <rect x="24" y="95" width="8" height="25" rx="4" fill="#64748b"/>
                <rect x="48" y="95" width="8" height="25" rx="4" fill="#64748b"/>
                <rect x="18" y="115" width="20" height="10" rx="5" fill="#f59e0b"/>
                <rect x="42" y="115" width="20" height="10" rx="5" fill="#f59e0b"/>
                <!-- Body -->
                <rect x="15" y="45" width="50" height="52" rx="14" fill="#e2e8f0"/>
                <!-- Screen Head -->
                <rect x="10" y="8" width="60" height="42" rx="10" fill="#1e293b"/>
                <rect x="15" y="13" width="50" height="32" rx="6" fill="#0f172a"/>
                <!-- Pixel Face Eyes -->
                <circle cx="28" cy="28" r="4" fill="#facc15"/>
                <circle cx="52" cy="28" r="4" fill="#facc15"/>
                <path d="M36,36 Q40,40 44,36" stroke="#facc15" stroke-width="2.5" fill="none" stroke-linecap="round"/>
                <!-- Antenna -->
                <line x1="40" y1="8" x2="40" y2="0" stroke="#94a3b8" stroke-width="3"/>
                <circle cx="40" cy="0" r="4" fill="#ef4444"/>
              </g>

              <!-- Character 3: Center Mascot (Wumpus / Mereb Creature) -->
              <g transform="translate(370, 80)" filter="url(#glowDrop)">
                <!-- Body -->
                <ellipse cx="60" cy="115" rx="50" ry="50" fill="url(#wumpusGrad)"/>
                <!-- Puffer Vest Jacket -->
                <path d="M22,95 Q60,80 98,95 L95,155 Q60,165 25,155 Z" fill="#ffffff"/>
                <!-- Zipper Line -->
                <line x1="60" y1="90" x2="60" y2="160" stroke="#cbd5e1" stroke-width="3"/>
                <!-- Quilted jacket stitches -->
                <path d="M25,115 Q60,110 95,115" stroke="#e2e8f0" stroke-width="2" fill="none"/>
                <path d="M25,135 Q60,130 95,135" stroke="#e2e8f0" stroke-width="2" fill="none"/>
                <!-- Little Feet -->
                <ellipse cx="38" cy="172" rx="14" ry="10" fill="#4e5dd4"/>
                <ellipse cx="82" cy="172" rx="14" ry="10" fill="#4e5dd4"/>
                <!-- Ears -->
                <ellipse cx="14" cy="45" rx="12" ry="18" fill="#4e5dd4" transform="rotate(-15 14 45)"/>
                <ellipse cx="106" cy="45" rx="12" ry="18" fill="#4e5dd4" transform="rotate(15 106 45)"/>
                <!-- Snout & Face -->
                <ellipse cx="60" cy="62" rx="28" ry="18" fill="#93a0f8"/>
                <!-- Nostrils -->
                <ellipse cx="52" cy="62" rx="4" ry="6" fill="#2d3780"/>
                <ellipse cx="68" cy="62" rx="4" ry="6" fill="#2d3780"/>
                <!-- Eyes -->
                <circle cx="40" cy="44" r="5" fill="#0f172a"/>
                <circle cx="80" cy="44" r="5" fill="#0f172a"/>
                <circle cx="42" cy="42" r="2" fill="#ffffff"/>
                <circle cx="82" cy="42" r="2" fill="#ffffff"/>
                <!-- Beret / Leaf on Head -->
                <path d="M55,18 Q75,10 70,26 Q55,24 55,18 Z" fill="#22c55e"/>
                <circle cx="56" cy="22" r="6" fill="#15803d"/>
              </g>

              <!-- Character 4: Right Gamer (Anime / Casual Vibe) -->
              <g transform="translate(560, 75)" filter="url(#glowDrop)">
                <!-- Legs / Shorts -->
                <rect x="42" y="145" width="16" height="40" fill="#60a5fa"/>
                <rect x="68" y="145" width="16" height="40" fill="#60a5fa"/>
                <rect x="44" y="185" width="12" height="28" fill="#fed7aa"/>
                <rect x="70" y="185" width="12" height="28" fill="#fed7aa"/>
                <!-- Shoes -->
                <rect x="36" y="210" width="24" height="12" rx="6" fill="#ffffff"/>
                <rect x="66" y="210" width="24" height="12" rx="6" fill="#ffffff"/>
                <!-- Hoodie -->
                <path d="M30,75 Q62,60 95,75 L90,148 L35,148 Z" fill="url(#charGrad2)"/>
                <!-- Discord Emblem on Hoodie -->
                <circle cx="62" cy="110" r="10" fill="#ffffff" fill-opacity="0.3"/>
                <!-- Head -->
                <circle cx="62" cy="45" r="20" fill="#fed7aa"/>
                <!-- Hair (Spiky) -->
                <path d="M40,40 L35,20 L50,30 L60,10 L72,28 L88,18 L82,40 Z" fill="#312e81"/>
                <!-- Glasses -->
                <rect x="48" y="38" width="12" height="10" rx="3" fill="none" stroke="#000" stroke-width="2"/>
                <rect x="64" y="38" width="12" height="10" rx="3" fill="none" stroke="#000" stroke-width="2"/>
                <line x1="60" y1="43" x2="64" y2="43" stroke="#000" stroke-width="2"/>
              </g>
            </svg>
          </div>

          <!-- Main Hero Headline (ABC Ginto / Fredoka Chunky All-Caps) -->
          <h1 class="discord-hero-title">
            REAL-TIME NETWORKING THAT’S ALL FUN & GAMES
          </h1>

          <p class="discord-hero-subtitle">
            Mereb is built for indie game developers and web creators looking for instant multiplayer connections without complex servers or monthly compute bills. Create channels, sync state, and track live stats across the globe.
          </p>

          <!-- Dual Hero Action Buttons (Image 3 Parity) -->
          <div class="discord-hero-buttons">
            <a href="/sdk.js" download="mereb-sdk.js" class="discord-btn-white btn-download-hero">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
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

      <!-- TICKER / MARQUEE RIBBON (Image 4 Parity) -->
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
            <span class="ticker-word">REALTIME</span>
            <span class="ticker-icon">⚡</span>
            <span class="ticker-word">PLAY</span>
            <span class="ticker-icon">🎮</span>
            <!-- Duplicate for seamless infinite marquee loop -->
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
            <span class="ticker-word">REALTIME</span>
            <span class="ticker-icon">⚡</span>
            <span class="ticker-word">PLAY</span>
            <span class="ticker-icon">🎮</span>
          </div>
        </div>
      </section>

      <!-- FEATURE SECTION 1: "MAKE YOUR MULTIPLAYER MORE FUN" (Image 3 Parity) -->
      <section class="discord-feature-section" id="features">
        <div class="discord-feature-container">
          <!-- Peaking Mascot Creature on Top Edge -->
          <div class="peaking-mascot-wrapper" aria-hidden="true">
            <svg class="peaking-mascot-svg" viewBox="0 0 120 70" width="100" height="60">
              <rect x="25" y="15" width="70" height="55" rx="20" fill="#4ade80"/>
              <ellipse cx="60" cy="38" rx="22" ry="12" fill="#1e293b"/>
              <circle cx="50" cy="38" r="4" fill="#22c55e"/>
              <circle cx="70" cy="38" r="4" fill="#22c55e"/>
              <!-- Ears -->
              <rect x="15" y="28" width="10" height="20" rx="5" fill="#22c55e"/>
              <rect x="95" y="28" width="10" height="20" rx="5" fill="#22c55e"/>
              <!-- Antenna -->
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
                        <p class="text">Joined the channel! Ready for the match?</p>
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

            <!-- Right Side: Punchy Discord-Style Typography -->
            <div class="copy-side">
              <h2 class="feature-headline">
                MAKE YOUR MULTIPLAYER MORE FUN
              </h2>
              <p class="feature-body">
                Use ultra-low latency WebSockets, raw binary packet streams, and automated peer discovery to connect players instantly. Send player transforms, trigger in-game events, and update game states without spinning up a single VPS.
              </p>
              <div class="feature-highlights">
                <div class="highlight-chip">
                  <span class="chip-icon">⚡</span>
                  <span>Sub-10ms Edge RTT</span>
                </div>
                <div class="highlight-chip">
                  <span class="chip-icon">📦</span>
                  <span>Raw Binary & JSON</span>
                </div>
                <div class="highlight-chip">
                  <span class="chip-icon">🛡️</span>
                  <span>Durable Object Isolation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- FEATURE SECTION 2: "HOP IN WHEN YOU'RE FREE, NO NEED TO CALL" (Image 4 Parity) -->
      <section class="discord-feature-section alt-bg" id="rooms">
        <div class="discord-feature-container">
          <!-- 3D Origami Diamond / Butterfly Popping Out of Top Right -->
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
                    <span class="main-desc">Low-latency netcode room</span>
                  </div>
                  <div class="window-logs">
                    <div class="log-entry">
                      <span class="log-time">8:14 AM</span>
                      <span class="log-badge join">JOIN</span>
                      <span class="log-text">Player "Rod" joined room [vc-general]</span>
                    </div>
                    <div class="log-entry">
                      <span class="log-time">8:14 AM</span>
                      <span class="log-badge broadcast">DATA</span>
                      <span class="log-text">Broadcast state: { score: 2, ball: [14.2, 8.5] }</span>
                    </div>
                    <div class="log-entry">
                      <span class="log-time">8:16 AM</span>
                      <span class="log-badge ping">PING</span>
                      <span class="log-text">Heartbeat ping/pong: 12ms RTT edge</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Side: Discord-Style Headline -->
            <div class="copy-side">
              <h2 class="feature-headline">
                HOP IN WHEN YOU'RE FREE, NO NEED FOR SERVERS
              </h2>
              <p class="feature-body">
                Easily hop in and out of multiplayer channels without having to configure firewalls, open ports, or manage costly VPS compute. Your game sessions stay fast, secure, and globally edge-routed before, during, and after your matches.
              </p>
              <div class="feature-highlights">
                <div class="highlight-chip">
                  <span class="chip-icon">🌐</span>
                  <span>Global Edge Routing</span>
                </div>
                <div class="highlight-chip">
                  <span class="chip-icon">🔒</span>
                  <span>Automatic SSL / WSS</span>
                </div>
                <div class="highlight-chip">
                  <span class="chip-icon">💰</span>
                  <span>100,000 Free Req/Day</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- FEATURE SECTION 3: GODOT 4 & WEB READY (Interactive Code Card) -->
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

            <!-- Right Side: Content -->
            <div class="copy-side">
              <h2 class="feature-headline">
                CONNECT ANY GAME ENGINE IN 5 LINES
              </h2>
              <p class="feature-body">
                No proprietary runtime or bloated C++ dependencies. Connect directly using standard WebSockets in Godot 4, Unity, Three.js, or pure HTML5 canvas. Both high-performance binary buffers (<code>put_packet</code>) and JSON events are handled instantly.
              </p>
              <div class="hero-actions-row">
                <button class="discord-btn-white btn-test-code" id="btn-test-code">
                  <span>Open Developer Console</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- FEATURE SECTION 4: GLOBAL LEADERBOARDS & STATS (Image 5 Style Pre-Footer) -->
      <section class="discord-feature-section alt-bg" id="leaderboards">
        <div class="discord-feature-container">
          <div class="feature-card-grid reverse">
            <!-- Left Side: Mini Leaderboard Card -->
            <div class="mockup-side lb-mockup-wrapper">
              <div class="leaderboard-window">
                <div class="lb-header">
                  <div class="lb-title-group">
                    <span class="lb-trophy">🏆</span>
                    <span class="lb-title">Global Top Strikers</span>
                  </div>
                  <span class="lb-tag">Live Edge DB</span>
                </div>

                <div class="lb-rows">
                  <div class="lb-row rank-1">
                    <span class="rank-badge">1</span>
                    <span class="player-name">ProStriker99</span>
                    <span class="score-pill">1,250 pts</span>
                  </div>
                  <div class="lb-row rank-2">
                    <span class="rank-badge">2</span>
                    <span class="player-name">CyberGoalie</span>
                    <span class="score-pill">1,120 pts</span>
                  </div>
                  <div class="lb-row rank-3">
                    <span class="rank-badge">3</span>
                    <span class="player-name">IndieDevAlex</span>
                    <span class="score-pill">980 pts</span>
                  </div>
                </div>

                <div class="lb-rest-preview">
                  <code>POST /api/apps/illegalsoccer/leaderboard</code>
                  <span class="status-201">201 Created ✓</span>
                </div>
              </div>
            </div>

            <!-- Right Side: Content -->
            <div class="copy-side">
              <h2 class="feature-headline">
                GLOBAL LEADERBOARDS & PRESENCE INCLUDED
              </h2>
              <p class="feature-body">
                Store high scores, track daily active concurrent players (CCU), and query channel presence via simple HTTP REST calls. No Redis setup, no relational database migrations, and zero server maintenance required.
              </p>
              <div class="feature-highlights">
                <div class="highlight-chip">
                  <span class="chip-icon">🏆</span>
                  <span>Instant Ranking API</span>
                </div>
                <div class="highlight-chip">
                  <span class="chip-icon">📊</span>
                  <span>Real-Time CCU Tracking</span>
                </div>
                <div class="highlight-chip">
                  <span class="chip-icon">⚡</span>
                  <span>Durable Edge Persistence</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- PRE-FOOTER SHOWCASE SECTION (Image 5 Parity) -->
      <section class="discord-prefooter-hero">
        <div class="prefooter-inner">
          <!-- Mascot Lineup Illustration -->
          <div class="mascot-lineup" aria-hidden="true">
            <svg viewBox="0 0 700 240" width="100%" height="auto">
              <!-- Re-use the cute gang gathered in celebration -->
              <ellipse cx="350" cy="220" rx="320" ry="25" fill="rgba(88, 101, 242, 0.2)"/>
              
              <!-- Center Wumpus -->
              <g transform="translate(290, 40)">
                <ellipse cx="60" cy="115" rx="50" ry="50" fill="#5865F2"/>
                <path d="M22,95 Q60,80 98,95 L95,155 Q60,165 25,155 Z" fill="#ffffff"/>
                <ellipse cx="60" cy="62" rx="28" ry="18" fill="#8592fc"/>
                <ellipse cx="52" cy="62" rx="4" ry="6" fill="#2d3780"/>
                <ellipse cx="68" cy="62" rx="4" ry="6" fill="#2d3780"/>
                <circle cx="40" cy="44" r="5" fill="#0f172a"/>
                <circle cx="80" cy="44" r="5" fill="#0f172a"/>
                <path d="M55,18 Q75,10 70,26 Q55,24 55,18 Z" fill="#22c55e"/>
              </g>

              <!-- Left Robot -->
              <g transform="translate(180, 80)">
                <rect x="10" y="8" width="55" height="40" rx="10" fill="#1e293b"/>
                <rect x="15" y="13" width="45" height="30" rx="6" fill="#0f172a"/>
                <circle cx="28" cy="28" r="4" fill="#facc15"/>
                <circle cx="47" cy="28" r="4" fill="#facc15"/>
                <rect x="15" y="45" width="45" height="45" rx="12" fill="#cbd5e1"/>
              </g>

              <!-- Right Anime Companion -->
              <g transform="translate(450, 50)">
                <circle cx="50" cy="45" r="20" fill="#fed7aa"/>
                <path d="M30,75 Q50,60 80,75 L75,148 L35,148 Z" fill="#3b82f6"/>
                <path d="M30,40 L25,20 L40,30 L50,10 L62,28 L78,18 L72,40 Z" fill="#312e81"/>
              </g>
            </svg>
          </div>

          <h2 class="prefooter-title">
            READY TO START YOUR MULTIPLAYER JOURNEY?
          </h2>
          <p class="prefooter-subtitle">
            100,000 free daily requests. Zero credit cards. Up and running in under 60 seconds.
          </p>
          <div class="prefooter-btn-wrapper">
            <button class="discord-btn-white btn-prefooter-console" id="btn-prefooter-console">
              <span>Open Developer Console</span>
            </button>
          </div>
        </div>
      </section>

      <!-- RICH MULTI-COLUMN FOOTER (Image 5 Parity) -->
      <footer class="discord-footer">
        <div class="discord-footer-inner">
          <div class="footer-top-grid">
            <!-- Brand & Language Column -->
            <div class="footer-brand-col">
              <div class="discord-logo footer-logo">
                <svg class="clyde-icon" viewBox="0 0 127.14 96.36" width="34" height="26">
                  <path fill="currentColor" d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,45.91,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,45.91,96.12,53,91.08,65.69,84.69,65.69Z"/>
                </svg>
                <span class="logo-text">Mereb</span>
              </div>
              <p class="footer-tagline">
                The zero-cost, serverless realtime web connection cloud for games & apps.
              </p>
              <div class="footer-lang-picker">
                <span class="lang-flag">🌐</span>
                <span class="lang-name">English, US</span>
                <span class="lang-chevron">⌵</span>
              </div>
            </div>

            <!-- Column 1: Product -->
            <div class="footer-col">
              <h4 class="col-title">Product</h4>
              <ul class="col-links">
                <li><a href="/sdk.js" download="mereb-sdk.js">Client SDK</a></li>
                <li><a href="#features">WebSocket Channels</a></li>
                <li><a href="#engines">Godot 4 Integration</a></li>
                <li><a href="#leaderboards">Leaderboards API</a></li>
                <li><a href="#rooms">WebRTC Signaling</a></li>
                <li><a href="#hero">Edge Telemetry</a></li>
              </ul>
            </div>

            <!-- Column 2: Developers -->
            <div class="footer-col">
              <h4 class="col-title">Developers</h4>
              <ul class="col-links">
                <li><a href="#engines">Documentation</a></li>
                <li><a href="https://github.com/dawitbaslyos/Mereb" target="_blank" rel="noreferrer">GitHub Repository</a></li>
                <li><a href="#engines">REST Broadcast API</a></li>
                <li><a href="#leaderboards">Highscore REST API</a></li>
                <li><a href="#hero">Edge Status</a></li>
              </ul>
            </div>

            <!-- Column 3: Platform -->
            <div class="footer-col">
              <h4 class="col-title">Platform</h4>
              <ul class="col-links">
                <li><a href="#features">Cloudflare Durable Objects</a></li>
                <li><a href="#features">100,000 Free Req/Day</a></li>
                <li><a href="#features">Zero Cold Starts</a></li>
                <li><a href="#features">Sub-10ms Global Latency</a></li>
                <li><a href="#features">Data Privacy</a></li>
              </ul>
            </div>

            <!-- Column 4: Company -->
            <div class="footer-col">
              <h4 class="col-title">Company</h4>
              <ul class="col-links">
                <li><a href="https://github.com/dawitbaslyos/Mereb" target="_blank" rel="noreferrer">About Mereb</a></li>
                <li><a href="#hero">Terms of Service</a></li>
                <li><a href="#hero">Privacy Policy</a></li>
                <li><a href="#hero">Contact</a></li>
              </ul>
            </div>
          </div>

          <!-- Bottom Divider & Action Row -->
          <div class="footer-bottom-bar">
            <div class="footer-copyright">
              © 2026 Mereb Cloud. Built for developers with ❤️
            </div>
            <div class="footer-bottom-actions">
              <button class="discord-btn-white btn-footer-console" id="btn-footer-console">
                <span>Open Console</span>
              </button>
            </div>
          </div>
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
    # 1. Connect directly to Mereb Edge WebSocket
    var err = ws.connect_to_url(URL)
    if err != OK:
        print("Failed to connect: ", err)

func _process(_delta):
    ws.poll()
    var state = ws.get_ready_state()
    if state == WebSocketPeer.STATE_OPEN:
        while ws.get_available_packet_count():
            var packet = ws.get_packet().get_string_from_utf8()
            print("Received from edge: ", packet)

# 2. Broadcast JSON to all connected peers
func send_data(dict: Dictionary):
    if ws.get_ready_state() == WebSocketPeer.STATE_OPEN:
        ws.send_text(JSON.stringify(dict))

# 3. Broadcast raw binary packets for ultra-low latency netcode
func send_binary(bytes: PackedByteArray):
    if ws.get_ready_state() == WebSocketPeer.STATE_OPEN:
        ws.put_packet(bytes)`;
    }

    if (this.activeCodeTab === 'js') {
      return `// Pure Native Browser WebSocket (Zero Dependencies, Zero Libraries!)
const url = 'wss://mereb-signaling.dawitbaslyos.workers.dev/v1/illegalsoccer/general';
const ws = new WebSocket(url);

ws.onopen = () => {
  console.log('Connected to Mereb Edge WebSocket!');
  // Broadcast message to all peers in channel
  ws.send(JSON.stringify({ event: 'player-moved', x: 42, y: 88 }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received live packet from peer:', data);
};

// Heartbeat ping / pong for latency check
ws.send(JSON.stringify({ type: 'ping' }));`;
    }

    return `# 1. Broadcast event to all connected sockets in this channel from your backend:
curl -X POST https://mereb-signaling.dawitbaslyos.workers.dev/v1/illegalsoccer/general/broadcast \\
  -H "Content-Type: application/json" \\
  -d '{"event": "goal-scored", "scorer": "Striker99", "score": 1}'

# 2. Query active presence in this channel:
curl https://mereb-signaling.dawitbaslyos.workers.dev/v1/illegalsoccer/general/presence

# 3. Submit a score to Global Leaderboards:
curl -X POST https://mereb-signaling.dawitbaslyos.workers.dev/api/apps/illegalsoccer/leaderboard \\
  -H "Content-Type: application/json" \\
  -d '{"username": "ProStriker99", "score": 1250}'`;
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
    this.element.querySelector('#btn-prefooter-console')?.addEventListener('click', navConsole);
    this.element.querySelector('#btn-footer-console')?.addEventListener('click', navConsole);

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
