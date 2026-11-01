/**
 * Mereb Cloud - Landing Page
 * Aesthetic: Pure Black & White (#000000 / #ffffff) + San Francisco (SF Pro)
 * Inspired by Mobbin's 2026 Editorial Minimalism ("Where developers and agents build")
 */
import { auth } from './auth.js';

export class LandingUI {
  constructor({ onLaunchGame, onNavigateDashboard }) {
    this.onLaunchGame = onLaunchGame;
    this.onNavigateDashboard = onNavigateDashboard;
    this.element = document.createElement('div');
    this.element.className = 'landing-root';

    // Interactive Widget States
    this.widgetVpsMode = 'p2p'; // 'p2p' | 'vps'
    this.adSimState = 'idle'; // 'idle' | 'simulating' | 'preserved'

    auth.onChange(() => {
      this.render();
    });

    this.render();
  }

  destroy() {
    // Cleanup if needed
  }

  render() {
    const user = auth.getUser();
    const isSigned = user && !user.isGuest;

    const universalAiPrompt = `You are an expert game multiplayer engineer integrating Mereb Netcode Cloud into this game.

Mereb is a high-performance, zero-cost WebRTC UDP multiplayer engine with Cloudflare Edge signaling.

### Mereb Cloud Public Endpoints:
- WebSocket & WebRTC Edge Signaling: wss://mereb-signaling.dawitbaslyos.workers.dev/v1/{YOUR_APP_ID}/{ROOM_ID}?key={YOUR_API_KEY}
- HTTP Broadcast API: https://mereb-signaling.dawitbaslyos.workers.dev/v1/{YOUR_APP_ID}/{ROOM_ID}/broadcast
- Global Leaderboard API: https://mereb-signaling.dawitbaslyos.workers.dev/api/apps/{YOUR_APP_ID}/leaderboard

### Integration Architecture:
1. P2P Direct WebRTC UDP DataChannels: Use 'unreliable' channel (ordered: false, maxRetransmits: 0, binaryType: 'arraybuffer') for 30-60Hz physics transforms (positions, velocities, rotations).
2. Reliable Channel: Use 'reliable' channel (ordered: true) for match events (game over, score updates, weapon triggers).
3. Cloudflare WebSocket Fallback: Keep WebSocket signaling connection open as an automatic zero-downtime fallback.
4. Compact Binary Stream: Pack transforms with fixed-point int16 coordinates (* 100) and 1-byte bitmasks for player states (95% bandwidth reduction).
5. Frame-0 Client Prediction: Predict local player actions immediately on frame 0, then smoothly interpolate remote state.

Inspect my game files (Three.js, Godot 4, or Unity) and implement Mereb netcode end-to-end with full production-ready code.`;

    this.element.innerHTML = `
      <!-- Floating Navigation Header -->
      <header class="landing-nav-header">
        <div class="landing-nav-inner">
          <a href="#hero" class="landing-brand">
            <div class="landing-brand-logo">M</div>
            <span>MEREB</span>
          </a>

          <div class="landing-header-status">
            <span class="live-green-pulse"></span>
            <span>All Systems Operational</span>
          </div>

          <div class="landing-header-right">
            <a href="/docs" class="landing-header-link">Docs</a>
            <a href="https://github.com/dawitbaslyos/Mereb" target="_blank" class="landing-header-link">GitHub</a>
            ${isSigned
              ? `<button class="origin-btn origin-btn-primary origin-btn-sm" id="btn-nav-console">Open Console →</button>`
              : `<button class="origin-btn origin-btn-primary origin-btn-sm" id="btn-nav-auth">Log in with GitHub</button>`
            }
          </div>
        </div>
      </header>

      <!-- SECTION 1: THE HERO (Mobbin "Teams and Agents" Pattern) -->
      <section class="landing-hero" id="hero">
        <div class="hero-authority-badge">
          <span class="live-green-pulse"></span>
          <span>The #1 way to build multiplayer games</span>
        </div>

        <h1 class="hero-headline">
          Where developers and agents<br />build multiplayer games.
        </h1>

        <p class="hero-subline">
          Multiplayer used to take months of netcode and surprise server bills. Now, it's one prompt. Free forever for your first game.
        </p>

        <div class="hero-actions">
          <button class="origin-btn origin-btn-primary origin-btn-pill" id="btn-hero-copy-prompt">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            <span>Copy prompt</span>
          </button>

          <button class="origin-btn origin-btn-pill" id="btn-hero-test-game">
            <span>Test 3D game →</span>
          </button>
        </div>

        <div class="hero-trust-bar">
          <span>Three.js</span>
          <span>•</span>
          <span>Godot</span>
          <span>•</span>
          <span>Unity</span>
          <span>•</span>
          <span>Poki</span>
          <span>•</span>
          <span>CrazyGames</span>
        </div>
      </section>

      <!-- SECTION 2: THE EDITORIAL "BEFORE VS. NOW" SHOWCASES -->
      <section class="landing-showcase-section" id="features">
        <!-- Feature 1: The AI Agent & MCP Angle -->
        <div class="showcase-block">
          <div class="showcase-block-content">
            <span class="sub-tag">MCP & AGENT SKILL</span>
            <h3>Multiplayer took months. Now, it's one prompt.</h3>
            <p>Every indie developer has a folder of unfinished game prototypes. Building the networking alone meant weeks of WebSockets, NAT traversal, and state sync. With Mereb, your AI coding agent connects your game in 60 seconds.</p>
          </div>
          <div class="widget-interactive-box">
            <div class="agent-chat-bubble">
              <div style="font-size: 11px; font-family: var(--font-mono); color: var(--text-dim); display: flex; align-items: center; gap: 6px;">
                <span>🤖 AGENT PROMPT</span>
              </div>
              <div>"Make my Three.js arena multiplayer with room lobbies and 60Hz transform sync using Mereb."</div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
              <div class="prompt-sim-terminal">
                ✔ 2 peers connected via WebRTC in 28ms
              </div>
              <button class="origin-copy-pill" id="btn-widget-copy-prompt">
                <span>Copy Prompt</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Feature 2: Web Portal Ad Shield -->
        <div class="showcase-block">
          <div class="showcase-block-content">
            <span class="sub-tag">WEB PORTAL DEFENSE</span>
            <h3>Video ads used to disconnect your players. Not anymore.</h3>
            <p>When players watch rewarded or interstitial ads on Poki or CrazyGames, browser tabs freeze and standard WebSocket servers drop the connection. Mereb pauses state gracefully and restores sync the instant the ad finishes.</p>
          </div>
          <div class="widget-interactive-box">
            <div class="ad-sim-bar">
              <button class="ad-sim-btn origin-btn-primary" id="btn-ad-sim">
                ${this.adSimState === 'simulating' ? 'Simulating 5s Ad...' : 'Simulate Video Ad'}
              </button>
              <div class="ad-sim-result" id="ad-sim-display">
                ${this.adSimState === 'simulating'
                  ? `<span style="color: #eab308;">⏳ Tab paused for ad...</span>`
                  : `<span style="color: #4ade80;">🟢 Connection Preserved · 0 Drops</span>`
                }
              </div>
            </div>
            <div style="font-size: 11px; font-family: var(--font-mono); color: var(--text-dim);">
              SDK auto-buffers position deltas during iframe ad pauses.
            </div>
          </div>
        </div>

        <!-- Feature 3: Architecture on Demand -->
        <div class="showcase-block">
          <div class="showcase-block-content">
            <span class="sub-tag">ARCHITECTURE ON DEMAND</span>
            <h3>Start free on P2P. Switch to dedicated VPS when you go viral.</h3>
            <p>Zero server bills while you build and test. When your game hits the front page and needs authoritative physics or anti-cheat, flip one switch in your dashboard. Zero client code changes.</p>
          </div>
          <div class="widget-interactive-box">
            <div class="vps-toggle-bar">
              <button class="vps-toggle-btn ${this.widgetVpsMode === 'p2p' ? 'active' : ''}" id="toggle-mode-p2p">Free P2P Mesh</button>
              <button class="vps-toggle-btn ${this.widgetVpsMode === 'vps' ? 'active' : ''}" id="toggle-mode-vps">Dedicated VPS</button>
            </div>
            <div class="vps-toggle-status" id="vps-status-display">
              ${this.widgetVpsMode === 'p2p'
                ? `<span>🟢 Sub-15ms direct peer data</span><span>$0.00 / month</span>`
                : `<span>⚡ Authoritative server ticks</span><span>$20.00 / month</span>`
              }
            </div>
          </div>
        </div>

        <!-- Feature 4: Honest Transparent Pricing -->
        <div class="showcase-block">
          <div class="showcase-block-content">
            <span class="sub-tag">TRANSPARENT HOSTING</span>
            <h3>Free forever for your first game. No credit card traps.</h3>
            <p>Host your first web or mobile game with unlimited players for free. Upgrade to Pro for $20/month flat only when you publish your second game.</p>
          </div>
          <div class="widget-interactive-box">
            <div class="pricing-pill-row">
              <div>
                <strong style="font-size: 14px; color: #ffffff;">Game 1: Free Forever</strong>
                <div style="font-size: 12px; color: var(--text-dim);">Unlimited players · Full P2P + Edge WebRTC</div>
              </div>
              <div style="font-size: 20px; font-weight: 800; color: #ffffff;">$0</div>
            </div>
            <div class="pricing-pill-row">
              <div>
                <strong style="font-size: 14px; color: #ffffff;">Game 2+: Pro Tier</strong>
                <div style="font-size: 12px; color: var(--text-dim);">Unlimited Games + Dedicated VPS Matchmaker</div>
              </div>
              <div style="font-size: 20px; font-weight: 800; color: #ffffff;">$20<span style="font-size: 12px; font-weight: normal; color: var(--text-dim);">/mo</span></div>
            </div>
          </div>
        </div>
      </section>

      <!-- SECTION 3: THE AUTHENTIC HUMAN STORY (Mobbin 0:42 pattern) -->
      <section class="landing-origin-section">
        <div class="landing-origin-card">
          <span style="font-size: 28px; line-height: 1;">❝</span>
          <h3>Built because game hosting was broken.</h3>
          <p>
            Mereb started because making a simple 2-player web game shouldn't require configuring Kubernetes or paying $100/month for server bandwidth before you even have players. It's built for indie creators and AI agents who just want games to work with zero friction.
          </p>
        </div>
      </section>

      <!-- SECTION 4: EDITORIAL CLOSING CTA -->
      <section class="landing-cta-section">
        <div class="landing-cta-card">
          <h2>Find what works. Build what's next.</h2>
          <p>Copy the prompt, open your editor, and see your players moving together in under 60 seconds.</p>
          ${isSigned
            ? `<button class="origin-btn origin-btn-primary origin-btn-pill" id="btn-cta-console" style="padding: 14px 32px; font-size: 15px;">Open Console →</button>`
            : `<button class="origin-btn origin-btn-primary origin-btn-pill" id="btn-cta-auth" style="padding: 14px 32px; font-size: 15px;">Continue with GitHub</button>`
          }
        </div>
      </section>

      <!-- SECTION 5: THE SEXY MINIMAL FOOTER -->
      <footer class="landing-footer">
        <div class="landing-footer-inner">
          <div class="footer-col">
            <div class="landing-brand" style="margin-bottom: 12px;">
              <div class="landing-brand-logo">M</div>
              <span>MEREB</span>
            </div>
            <p style="font-size: 13px; color: var(--text-dim); max-width: 240px; line-height: 1.5;">
              The #1 way to build multiplayer games. Pure black and white. Zero bloat.
            </p>
          </div>

          <div class="footer-col">
            <h4>Platforms</h4>
            <ul>
              <li><a href="/docs">HTML5 / Three.js</a></li>
              <li><a href="/docs">Godot 4 Addon</a></li>
              <li><a href="/docs">Unity C# WebGL</a></li>
              <li><a href="/docs">Poki &amp; CrazyGames</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h4>Resources</h4>
            <ul>
              <li><a href="/docs">Documentation (2026.1 LTS)</a></li>
              <li><a href="/llms.txt" target="_blank">AI Context (llms.txt)</a></li>
              <li><a href="https://github.com/dawitbaslyos/Mereb" target="_blank">GitHub</a></li>
              <li><a href="https://discord.gg/mereb" target="_blank">Discord</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h4>Legal</h4>
            <ul>
              <li><a href="#hero">Terms of Service</a></li>
              <li><a href="#hero">Privacy Policy</a></li>
              <li><a href="#hero">Security</a></li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom-bar">
          <span>© 2026 Mereb Inc. All rights reserved.</span>
          <span>Free forever for your first game.</span>
        </div>
      </footer>
    `;

    this._bindEvents(universalAiPrompt);
  }

  _bindEvents(universalAiPrompt) {
    const copyPrompt = () => {
      navigator.clipboard.writeText(universalAiPrompt).then(() => {
        alert('Copied 1-Prompt Integration to clipboard! Paste into Cursor, Claude Code, or Antigravity.');
      });
    };

    // Copy Prompt Buttons
    this.element.querySelector('#btn-hero-copy-prompt')?.addEventListener('click', copyPrompt);
    this.element.querySelector('#btn-widget-copy-prompt')?.addEventListener('click', copyPrompt);

    // Test Game Button
    this.element.querySelector('#btn-hero-test-game')?.addEventListener('click', () => {
      if (this.onLaunchGame) this.onLaunchGame();
    });

    // Navigation & Auth Buttons
    const handleAuthOrConsole = () => {
      const user = auth.getUser();
      if (user && !user.isGuest) {
        if (this.onNavigateDashboard) this.onNavigateDashboard();
      } else {
        auth.showGithubLoginModal(() => {
          if (this.onNavigateDashboard) this.onNavigateDashboard();
        });
      }
    };

    this.element.querySelector('#btn-nav-console')?.addEventListener('click', () => {
      if (this.onNavigateDashboard) this.onNavigateDashboard();
    });
    this.element.querySelector('#btn-nav-auth')?.addEventListener('click', handleAuthOrConsole);
    this.element.querySelector('#btn-cta-console')?.addEventListener('click', () => {
      if (this.onNavigateDashboard) this.onNavigateDashboard();
    });
    this.element.querySelector('#btn-cta-auth')?.addEventListener('click', handleAuthOrConsole);

    // Interactive Widget 1: P2P ⇄ VPS Switch
    this.element.querySelector('#toggle-mode-p2p')?.addEventListener('click', () => {
      this.widgetVpsMode = 'p2p';
      this.render();
    });
    this.element.querySelector('#toggle-mode-vps')?.addEventListener('click', () => {
      this.widgetVpsMode = 'vps';
      this.render();
    });

    // Interactive Widget 2: Ad Simulator
    this.element.querySelector('#btn-ad-sim')?.addEventListener('click', () => {
      this.adSimState = 'simulating';
      this.render();
      setTimeout(() => {
        this.adSimState = 'preserved';
        this.render();
      }, 1500);
    });
  }

  getElement() {
    return this.element;
  }
}
