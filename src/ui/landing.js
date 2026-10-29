/**
 * Mereb Cloud - Game Multiplayer Landing Page
 * Artstyle: Mesmerizing, cool, lightweight flock of fishes canvas background.
 * Core Promise: Straightforward multiplayer hosting & single-prompt integration.
 * Includes:
 * - Full-screen interactive FlockCanvas (60fps schooling fish)
 * - Clean, punchy, game-centric messaging without text saturation
 * - Direct pricing: Free (1 Game), Pro ($20/mo for 10 games), Enterprise (Custom)
 * - Big, centered "Copy Prompt" button right before the page ending for 1-click AI game integration
 */
import { auth } from './auth.js';
import { FlockCanvas } from './flock.js';

export class LandingUI {
  constructor({ onLaunchGame, onNavigateDashboard }) {
    this.onLaunchGame = onLaunchGame;
    this.onNavigateDashboard = onNavigateDashboard;
    this.element = document.createElement('div');
    this.element.className = 'landing-root fish-theme';
    this.flock = null;

    auth.onChange(() => {
      this.render();
    });

    this.render();
  }

  destroy() {
    if (this.flock) {
      this.flock.destroy();
      this.flock = null;
    }
  }

  render() {
    const user = auth.getUser();

    // Universal AI Prompt for Claude Code, Cursor, ChatGPT, and Gemini
    const universalAiPrompt = `You are an expert game multiplayer engineer integrating Mereb Netcode Cloud into this game codebase.

Mereb is a zero-cost, high-performance WebRTC UDP multiplayer engine with Cloudflare Edge signaling.

### Mereb Cloud Public Endpoints:
- WebSocket & WebRTC Edge Signaling: wss://mereb-signaling.dawitbaslyos.workers.dev/v1/{YOUR_APP_ID}/{ROOM_ID}?key={YOUR_API_KEY}
- HTTP Broadcast API: https://mereb-signaling.dawitbaslyos.workers.dev/v1/{YOUR_APP_ID}/{ROOM_ID}/broadcast
- Global Leaderboard API: https://mereb-signaling.dawitbaslyos.workers.dev/api/apps/{YOUR_APP_ID}/leaderboard

### Integration Architecture:
1. P2P Direct WebRTC UDP DataChannels: Use 'unreliable' channel (ordered: false, maxRetransmits: 0, binaryType: 'arraybuffer') for 30-60Hz physics transforms (positions, velocities, rotations) to achieve sub-15ms response.
2. Reliable Channel: Use 'reliable' channel (ordered: true) for match events (game over, score updates, weapon triggers).
3. Cloudflare WebSocket Fallback: Keep WebSocket signaling connection open as an automatic zero-downtime fallback if symmetric NAT restricts direct P2P.
4. Compact Binary Stream: Pack transforms with fixed-point int16 coordinates (* 100) and 1-byte bitmasks for player states instead of JSON strings (95% bandwidth reduction, 0 GC stutter).
5. Frame-0 Client Prediction: Predict local player actions immediately on frame 0, then smoothly interpolate remote state upon receiving authoritative host ticks.

Now inspect my game codebase (Godot 4, Three.js, React, or Unity) and implement Mereb netcode end-to-end. Provide full, production-ready code with no placeholders or mocks.`;

    this.element.innerHTML = `
      <!-- Mesmerizing Schooling Fishes Canvas Background -->
      <canvas id="flock-fishes-canvas" class="flock-fishes-canvas"></canvas>

      <div class="landing-content-layer">
        <!-- Top Navigation -->
        <header class="landing-header">
          <div class="landing-header-inner">
            <a href="#hero" class="landing-brand">
              <svg viewBox="0 0 36 36" width="34" height="34" fill="none">
                <rect width="36" height="36" rx="10" fill="#38bdf8"/>
                <path d="M8 24L13 12L18 19L23 12L28 24" stroke="#050814" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="18" cy="24" r="2.5" fill="#34d399"/>
              </svg>
              <div class="brand-text-col">
                <span class="brand-title">Mereb</span>
                <span class="brand-tag">Multiplayer Cloud</span>
              </div>
            </a>

            <nav class="landing-nav">
              <a href="#features" class="nav-link">Features</a>
              <a href="#pricing" class="nav-link">Pricing</a>
              <a href="#prompt-section" class="nav-link">Single-Prompt</a>
              <a href="https://github.com/dawitbaslyos/Mereb" target="_blank" rel="noreferrer" class="nav-link">GitHub</a>
            </nav>

            <div class="landing-header-actions">
              <button class="btn-console-cta" id="btn-nav-console">
                <span>${user ? `Open Console (${user.username})` : 'Developer Console'}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
          </div>
        </header>

        <!-- HERO SECTION -->
        <section class="hero-section" id="hero">
          <div class="hero-pill-badge">
            <span class="pill-spark">⚡</span>
            <span>WebRTC UDP DataChannels • Cloudflare Edge Signaling</span>
          </div>

          <h1 class="hero-title">
            Multiplayer for Games in a <span class="gradient-text">Single Prompt.</span>
          </h1>

          <p class="hero-subtext">
            Straightforward serverless netcode. Zero server compute bills. Plug directly into Godot, Three.js, React, or Unity—or let an AI coding agent build it for you in seconds.
          </p>

          <div class="hero-btn-row">
            <button class="btn-hero-primary" id="btn-hero-console">
              <span>Open Developer Console</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </button>

            <button class="btn-hero-secondary" id="btn-hero-copy-prompt">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              <span>Copy AI Prompt</span>
            </button>
          </div>

          <!-- Hero Metrics Strip -->
          <div class="hero-stats-strip">
            <div class="stat-pill">
              <strong>&lt; 15ms</strong>
              <span>Direct UDP P2P</span>
            </div>
            <div class="stat-separator">•</div>
            <div class="stat-pill">
              <strong>113 Bytes</strong>
              <span>Binary Stream</span>
            </div>
            <div class="stat-separator">•</div>
            <div class="stat-pill">
              <strong>$0 Compute</strong>
              <span>Edge Serverless</span>
            </div>
            <div class="stat-separator">•</div>
            <div class="stat-pill">
              <strong>1 Prompt</strong>
              <span>AI Integration</span>
            </div>
          </div>
        </section>

        <!-- 3 CORE PILLARS SECTION -->
        <section class="pillars-section" id="features">
          <div class="section-badge">BUILT FOR SPEED</div>
          <h2 class="section-heading">Everything Your Game Needs to Go Live</h2>

          <div class="pillars-grid">
            <div class="pillar-card">
              <div class="pillar-icon">⚡</div>
              <h3>Sub-15ms WebRTC UDP</h3>
              <p>Direct peer-to-peer data channels eliminate TCP head-of-line blocking. Real-time physics stream over UDP, with automatic WebSocket edge relay fallback.</p>
            </div>

            <div class="pillar-card">
              <div class="pillar-icon">📦</div>
              <h3>95% Binary Bit-Packing</h3>
              <p>Shrink 2,500-byte JSON sync strings down to 113-byte ArrayBuffer packets. Pre-allocated scratch views eliminate V8 garbage collection frame drops.</p>
            </div>

            <div class="pillar-card">
              <div class="pillar-icon">☁️</div>
              <h3>Firebase for Multiplayer</h3>
              <p>Manage your games like APIs in our console. Auto-provision rooms, live CCU analytics, Durable Objects state tracking, and global highscore leaderboards.</p>
            </div>
          </div>
        </section>

        <!-- PRICING SECTION -->
        <section class="pricing-section" id="pricing">
          <div class="section-badge">TRANSPARENT PRICING</div>
          <h2 class="section-heading">Simple, Straightforward Plans</h2>
          <p class="section-subheading">Start free with 1 game. Upgrade when your games grow.</p>

          <div class="pricing-grid">
            <!-- Free Tier -->
            <div class="pricing-card">
              <div class="card-plan-header">
                <h3>Free</h3>
                <p class="plan-desc">Perfect for testing, game jams, and prototyping.</p>
              </div>
              <div class="price-row">
                <span class="price-val">$0</span>
                <span class="price-cadence">/ month</span>
              </div>
              <ul class="plan-features">
                <li><span class="check-mark">✓</span> <strong>1 Game</strong> API endpoint</li>
                <li><span class="check-mark">✓</span> <strong>50 Peak CCU</strong></li>
                <li><span class="check-mark">✓</span> <strong>100,000 Messages / mo</strong></li>
                <li><span class="check-mark">✓</span> Direct WebRTC UDP + Edge Relay</li>
                <li><span class="check-mark">✓</span> Global Leaderboards API</li>
                <li><span class="check-mark">✓</span> Community Discord Support</li>
              </ul>
              <button class="btn-plan-select btn-plan-free" id="btn-select-free">
                <span>Current Plan</span>
              </button>
            </div>

            <!-- Pro Tier ($20/mo) -->
            <div class="pricing-card featured-pro-card">
              <div class="featured-badge">MOST POPULAR</div>
              <div class="card-plan-header">
                <h3>Pro Studio</h3>
                <p class="plan-desc">For indie developers and studios launching live games.</p>
              </div>
              <div class="price-row">
                <span class="price-val">$20</span>
                <span class="price-cadence">/ month</span>
              </div>
              <ul class="plan-features">
                <li><span class="check-mark">✓</span> <strong>Up to 10 Games</strong></li>
                <li><span class="check-mark">✓</span> <strong>500 Peak CCU</strong></li>
                <li><span class="check-mark">✓</span> <strong>5,000,000 Messages / mo</strong></li>
                <li><span class="check-mark">✓</span> Sub-15ms WebRTC UDP DataChannels</li>
                <li><span class="check-mark">✓</span> Dedicated Cloudflare Edge Routing</li>
                <li><span class="check-mark">✓</span> Unlimited Highscore Leaderboards</li>
                <li><span class="check-mark">✓</span> Priority Support</li>
              </ul>
              <button class="btn-plan-select btn-plan-pro" id="btn-select-pro">
                <span>Upgrade to Pro ($20/mo)</span>
              </button>
            </div>

            <!-- Enterprise Tier (Custom) -->
            <div class="pricing-card">
              <div class="card-plan-header">
                <h3>Enterprise</h3>
                <p class="plan-desc">For hit titles, portals, and publisher portfolios.</p>
              </div>
              <div class="price-row">
                <span class="price-val">Custom</span>
                <span class="price-cadence">/ bespoke scale</span>
              </div>
              <ul class="plan-features">
                <li><span class="check-mark">✓</span> <strong>More than 10 Games</strong></li>
                <li><span class="check-mark">✓</span> <strong>Custom CCU & Bandwidth Scale</strong></li>
                <li><span class="check-mark">✓</span> Private VPS / Cloudflare Connect Cluster</li>
                <li><span class="check-mark">✓</span> Custom Domain & Custom SSL</li>
                <li><span class="check-mark">✓</span> 99.99% Availability SLA</li>
                <li><span class="check-mark">✓</span> 24/7 Dedicated Engineering Support</li>
              </ul>
              <a href="https://github.com/dawitbaslyos/Mereb/issues" target="_blank" rel="noreferrer" class="btn-plan-select btn-plan-enterprise">
                <span>Contact Enterprise</span>
              </a>
            </div>
          </div>
        </section>

        <!-- BIG CENTERED "COPY PROMPT" SECTION (Right Before Page Ending) -->
        <section class="prompt-cta-section" id="prompt-section">
          <div class="prompt-cta-container">
            <div class="prompt-spark-icon">🤖 ⚡ 🎮</div>
            <h2 class="prompt-cta-title">Integrate Into Your Game With One Prompt</h2>
            <p class="prompt-cta-subtext">
              Copy this universal prompt into <strong>Claude Code, Cursor, ChatGPT, or Gemini</strong>. Your AI assistant will inspect your game files and wire Mereb's client SDK, WebRTC UDP DataChannels, and leaderboards end-to-end.
            </p>

            <!-- BIG CENTERED PROMPT BUTTON -->
            <div class="big-button-wrap">
              <button class="btn-big-copy-prompt" id="btn-big-copy-prompt">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                <span>COPY PROMPT</span>
              </button>
            </div>

            <!-- Expandable Prompt Preview -->
            <div class="prompt-preview-wrap">
              <div class="prompt-preview-header">
                <span>Universal AI Agent Prompt Preview</span>
                <button class="btn-preview-toggle" id="btn-toggle-preview">Show Code</button>
              </div>
              <pre class="prompt-preview-code" id="prompt-preview-box"><code>${this._escapeHtml(universalAiPrompt)}</code></pre>
            </div>
          </div>
        </section>

        <!-- FOOTER -->
        <footer class="landing-footer">
          <div class="landing-footer-inner">
            <div class="footer-col-brand">
              <div class="footer-logo-row">
                <svg viewBox="0 0 36 36" width="28" height="28" fill="none">
                  <rect width="36" height="36" rx="8" fill="#38bdf8"/>
                  <path d="M8 24L13 12L18 19L23 12L28 24" stroke="#050814" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="18" cy="24" r="2.5" fill="#34d399"/>
                </svg>
                <span class="footer-brand-title">Mereb Cloud</span>
              </div>
              <p class="footer-tagline">Straightforward multiplayer hosting & single-prompt game integration.</p>
            </div>

            <div class="footer-col-links">
              <div class="footer-group">
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#pricing">Pricing</a>
                <a href="#prompt-section">Single-Prompt</a>
                <a href="javascript:void(0)" id="footer-btn-console">Console</a>
              </div>

              <div class="footer-group">
                <h4>Engines</h4>
                <a href="https://github.com/dawitbaslyos/Mereb" target="_blank" rel="noreferrer">Godot 4 Addon</a>
                <a href="https://github.com/dawitbaslyos/Mereb" target="_blank" rel="noreferrer">Three.js / Web</a>
                <a href="https://github.com/dawitbaslyos/Mereb" target="_blank" rel="noreferrer">React Hook</a>
                <a href="https://github.com/dawitbaslyos/Mereb" target="_blank" rel="noreferrer">Unity & Native</a>
              </div>

              <div class="footer-group">
                <h4>Platform</h4>
                <a href="https://github.com/dawitbaslyos/Mereb" target="_blank" rel="noreferrer">GitHub Repository</a>
                <a href="https://github.com/dawitbaslyos/Mereb/blob/main/LICENSE" target="_blank" rel="noreferrer">MIT License</a>
                <a href="https://mereb-signaling.dawitbaslyos.workers.dev/presence" target="_blank" rel="noreferrer">Cloud Status</a>
              </div>
            </div>
          </div>

          <div class="footer-bottom-bar">
            <span>&copy; ${new Date().getFullYear()} Mereb Cloud. Built for game developers & AI coding agents.</span>
          </div>
        </footer>
      </div>
    `;

    // Initialize Flock of Fishes Canvas Animation
    setTimeout(() => {
      const canvasEl = this.element.querySelector('#flock-fishes-canvas');
      if (canvasEl) {
        if (this.flock) this.flock.destroy();
        this.flock = new FlockCanvas(canvasEl);
      }
    }, 50);

    this._bindEvents(universalAiPrompt);
  }

  _bindEvents(promptText) {
    // Navigation to Console
    const navigateConsole = () => {
      if (this.onNavigateDashboard) {
        this.onNavigateDashboard();
      } else {
        window.location.hash = '#/dashboard';
      }
    };

    this.element.querySelector('#btn-nav-console')?.addEventListener('click', navigateConsole);
    this.element.querySelector('#btn-hero-console')?.addEventListener('click', navigateConsole);
    this.element.querySelector('#btn-select-free')?.addEventListener('click', navigateConsole);
    this.element.querySelector('#footer-btn-console')?.addEventListener('click', navigateConsole);

    // Plan Upgrade Trigger (Pro $20/mo)
    this.element.querySelector('#btn-select-pro')?.addEventListener('click', () => {
      if (confirm('Upgrade your workspace to Mereb Pro ($20/month) for up to 10 games, 500 CCU, and sub-15ms WebRTC UDP channels?')) {
        auth.setPlan('pro');
        alert('🎉 Upgraded to Pro ($20/month)! Opening your Developer Console...');
        navigateConsole();
      }
    });

    // Copy Prompt Functionality (Hero button and Big Centered Button)
    const handleCopyPrompt = (btn) => {
      navigator.clipboard.writeText(promptText).then(() => {
        const originalHtml = btn.innerHTML;
        btn.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span>COPIED TO CLIPBOARD!</span>
        `;
        btn.classList.add('copied-glow');

        // Floating Toast Notification
        this._showToast('✨ Copied Universal Netcode Prompt! Paste into Claude Code, Cursor, or ChatGPT.');

        setTimeout(() => {
          btn.innerHTML = originalHtml;
          btn.classList.remove('copied-glow');
        }, 2500);
      }).catch(() => {
        alert('Failed to copy prompt automatically. Please copy from the preview box below.');
      });
    };

    this.element.querySelector('#btn-hero-copy-prompt')?.addEventListener('click', (e) => {
      handleCopyPrompt(e.currentTarget);
    });

    this.element.querySelector('#btn-big-copy-prompt')?.addEventListener('click', (e) => {
      handleCopyPrompt(e.currentTarget);
    });

    // Toggle Preview Box
    const toggleBtn = this.element.querySelector('#btn-toggle-preview');
    const previewBox = this.element.querySelector('#prompt-preview-box');
    if (toggleBtn && previewBox) {
      toggleBtn.addEventListener('click', () => {
        if (previewBox.style.display === 'block') {
          previewBox.style.display = 'none';
          toggleBtn.textContent = 'Show Code';
        } else {
          previewBox.style.display = 'block';
          toggleBtn.textContent = 'Hide Code';
        }
      });
    }
  }

  _showToast(msg) {
    const existing = document.querySelector('.mereb-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'mereb-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 3500);
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
