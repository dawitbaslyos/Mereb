/**
 * Mereb Cloud - Official Landing Page
 * Clean, high-performance, developer-first presentation.
 */
import { auth } from './auth.js';

export class LandingUI {
  constructor({ onLaunchGame, onNavigateDashboard }) {
    this.onLaunchGame = onLaunchGame;
    this.onNavigateDashboard = onNavigateDashboard;
    this.element = document.createElement('div');
    this.element.className = 'landing-root';

    auth.onChange(() => {
      this.render();
    });

    this.render();
  }

  destroy() {
    // Cleanup
  }

  render() {
    const user = auth.getUser();
    const isSigned = auth.isSignedIn();
    const docsUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost' ? '/docs' : 'https://docs.mereb.cloud';

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
            <span>Edge Mesh Operational</span>
          </div>

          <div class="landing-header-right">
            <a href="${docsUrl}" class="landing-header-link">Docs</a>
            <a href="https://github.com/dawitbaslyos/Mereb" target="_blank" class="landing-header-link">GitHub</a>
            ${isSigned
              ? `<button class="origin-btn origin-btn-primary origin-btn-sm" id="btn-nav-console">Open Console →</button>`
              : `<button class="origin-btn origin-btn-primary origin-btn-sm" id="btn-nav-auth">Log in with GitHub</button>`
            }
          </div>
        </div>
      </header>

      <!-- SECTION 1: HERO -->
      <section class="landing-hero" id="hero">
        <div class="hero-authority-badge">
          <span class="live-green-pulse"></span>
          <span>Serverless WebRTC Netcode &amp; Matchmaking</span>
        </div>

        <h1 class="hero-headline">
          The multiplayer engine<br />for web &amp; indie games.
        </h1>

        <p class="hero-subline">
          Zero dedicated game servers. Zero surprise bills. Authoritative 60Hz physics streams directly peer-to-peer over low-latency WebRTC UDP, backed by Cloudflare edge matchmaking.
        </p>

        <div class="hero-actions">
          ${isSigned
            ? `<button class="origin-btn origin-btn-primary origin-btn-pill" id="btn-hero-console">
                 <span>Open Console →</span>
               </button>`
            : `<button class="origin-btn origin-btn-primary origin-btn-pill" id="btn-hero-auth">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                 <span>Log in with GitHub</span>
               </button>`
          }

          <button class="origin-btn origin-btn-pill" id="btn-hero-test-game">
            <span>Play 3D Demo →</span>
          </button>
          
          <a href="${docsUrl}" class="origin-btn origin-btn-pill" style="text-decoration:none;">
            <span>Documentation</span>
          </a>
        </div>

        <div class="hero-trust-bar">
          <span>Three.js</span>
          <span>•</span>
          <span>Godot 4</span>
          <span>•</span>
          <span>Unity WebGL</span>
          <span>•</span>
          <span>React</span>
          <span>•</span>
          <span>Poki</span>
          <span>•</span>
          <span>CrazyGames</span>
        </div>
      </section>

      <!-- SECTION 2: SHOWCASE FEATURES -->
      <section class="landing-showcase-section" id="features">
        <!-- Feature 1: 60-Second Setup -->
        <div class="showcase-block">
          <div class="showcase-block-content">
            <span class="sub-tag">MINIMAL NETCODE</span>
            <h3>Real-time multiplayer in 5 lines of code.</h3>
            <p>Skip weeks of WebSocket plumbing, ICE signaling, and NAT punchthrough. Instantiate <code>MerebClient</code>, hook match start, and let the engine negotiate low-latency WebRTC DataChannels automatically.</p>
          </div>
          <div class="widget-interactive-box">
            <div style="font-family: var(--font-mono); font-size: 12px; line-height: 1.6; color: #e2e8f0; background: #0d1117; padding: 16px; border-radius: 8px; border: 1px solid var(--border);">
              <span style="color: #ff7b72;">import</span> { MerebClient } <span style="color: #ff7b72;">from</span> <span style="color: #a5d6ff;">'mereb-netcode'</span>;<br/>
              <span style="color: #ff7b72;">const</span> net = <span style="color: #ff7b72;">new</span> MerebClient({ host: <span style="color: #a5d6ff;">'mereb-signaling.workers.dev'</span> });<br/>
              net.<span style="color: #d2a8ff;">quickPlay</span>();<br/>
              net.<span style="color: #d2a8ff;">on</span>(<span style="color: #a5d6ff;">'state'</span>, (state) =&gt; updatePlayer(state));
            </div>
          </div>
        </div>

        <!-- Feature 2: Web Portal Ad Shield -->
        <div class="showcase-block">
          <div class="showcase-block-content">
            <span class="sub-tag">PORTAL MONETIZATION</span>
            <h3>Video ads don't disconnect your players anymore.</h3>
            <p>When players trigger commercial breaks or rewarded videos on Poki and CrazyGames, web browsers aggressively throttle background execution. Mereb's <code>PortalManager</code> buffers state and pauses timeouts so connections survive cleanly.</p>
          </div>
          <div class="widget-interactive-box">
            <div style="padding: 18px; background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border); border-radius: 8px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                <span style="font-size: 13px; font-weight: 600; color: #fff;">Portal Lifecycle Handshake</span>
                <span style="font-size: 11px; font-family: var(--font-mono); color: #4ade80;">Active</span>
              </div>
              <p style="font-size: 12px; color: var(--text-dim); margin-bottom: 12px;">Automatic WebRTC freeze prevention for PokiSDK and CrazyGames SDK integrations.</p>
              <div style="font-family: var(--font-mono); font-size: 11px; color: #a5d6ff; background: #000; padding: 8px 12px; border-radius: 4px;">
                net.usePortal('poki', window.PokiSDK);
              </div>
            </div>
          </div>
        </div>

        <!-- Feature 3: Binary Packing -->
        <div class="showcase-block">
          <div class="showcase-block-content">
            <span class="sub-tag">PERFORMANCE</span>
            <h3>85% bandwidth reduction with binary packing.</h3>
            <p>Stop serializing heavy JSON strings at 60Hz. Mereb's <code>defineSchema</code> packs continuous world telemetry into tiny ~35-byte binary ArrayBuffers with fixed-point precision, eliminating Garbage Collector micro-stutter.</p>
          </div>
          <div class="widget-interactive-box">
            <div style="padding: 18px; background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border); border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <span style="font-size: 13px; font-weight: 600;">Standard JSON: 240 bytes / tick</span>
                <span style="font-size: 12px; color: #ef4444;">High Overhead</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 13px; font-weight: 600; color: #4ade80;">Mereb Binary: 35 bytes / tick</span>
                <span style="font-size: 12px; color: #4ade80;">85.4% Saved</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Feature 4: Honest Transparent Pricing -->
        <div class="showcase-block">
          <div class="showcase-block-content">
            <span class="sub-tag">ECONOMICS</span>
            <h3>Free forever for your first game. No credit card required.</h3>
            <p>Launch your first game with unlimited CCU and zero hosting bills. Upgrade to Pro ($20/month flat) only when scaling across multiple titles.</p>
          </div>
          <div class="widget-interactive-box">
            <div class="pricing-pill-row">
              <div>
                <strong style="font-size: 14px; color: #ffffff;">Game 1: Free Forever</strong>
                <div style="font-size: 12px; color: var(--text-dim);">Unlimited players · Direct P2P WebRTC UDP</div>
              </div>
              <div style="font-size: 20px; font-weight: 800; color: #ffffff;">$0</div>
            </div>
            <div class="pricing-pill-row">
              <div>
                <strong style="font-size: 14px; color: #ffffff;">Game 2+: Pro Tier</strong>
                <div style="font-size: 12px; color: var(--text-dim);">Up to 10 Games · Managed Port 443 TLS TURN</div>
              </div>
              <div style="font-size: 20px; font-weight: 800; color: #ffffff;">$20<span style="font-size: 12px; font-weight: normal; color: var(--text-dim);">/mo</span></div>
            </div>
          </div>
        </div>
      </section>

      <!-- SECTION 3: EDITORIAL ORIGIN -->
      <section class="landing-origin-section">
        <div class="landing-origin-card">
          <span style="font-size: 28px; line-height: 1;">❝</span>
          <h3>Built because game multiplayer hosting was broken.</h3>
          <p>
            Building a simple 2-player indie web game shouldn't require managing Kubernetes clusters or paying $150 to $1,000/month in cloud container bills before you even have active players. Mereb routes 60Hz gameplay directly between peers so you focus purely on the game.
          </p>
        </div>
      </section>

      <!-- SECTION 4: CALL TO ACTION -->
      <section class="landing-cta-section">
        <div class="landing-cta-card">
          <h2>Ready to ship real-time multiplayer?</h2>
          <p>Connect your GitHub account and launch your first zero-cost multiplayer endpoint in 60 seconds.</p>
          ${isSigned
            ? `<button class="origin-btn origin-btn-primary origin-btn-pill" id="btn-cta-console" style="padding: 14px 32px; font-size: 15px;">Open Console →</button>`
            : `<button class="origin-btn origin-btn-primary origin-btn-pill" id="btn-cta-auth" style="padding: 14px 32px; font-size: 15px;">Continue with GitHub</button>`
          }
        </div>
      </section>

      <!-- SECTION 5: FOOTER -->
      <footer class="landing-footer">
        <div class="landing-footer-inner">
          <div class="footer-col">
            <div class="landing-brand" style="margin-bottom: 12px;">
              <div class="landing-brand-logo">M</div>
              <span>MEREB</span>
            </div>
            <p style="font-size: 13px; color: var(--text-dim); max-width: 240px; line-height: 1.5;">
              Serverless WebRTC P2P multiplayer netcode &amp; edge matchmaking engine.
            </p>
          </div>

          <div class="footer-col">
            <h4>Platforms</h4>
            <ul>
              <li><a href="${docsUrl}">HTML5 / Three.js</a></li>
              <li><a href="${docsUrl}">Godot 4 Addon</a></li>
              <li><a href="${docsUrl}">Unity C# WebGL</a></li>
              <li><a href="${docsUrl}">Poki &amp; CrazyGames</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h4>Resources</h4>
            <ul>
              <li><a href="${docsUrl}">Documentation</a></li>
              <li><a href="${docsUrl}/manual/03_WHY_MEREB_IS_BETTER_BENCHMARKS.md">Benchmarks</a></li>
              <li><a href="https://github.com/dawitbaslyos/Mereb" target="_blank">GitHub</a></li>
              <li><a href="https://discord.gg/mereb" target="_blank">Discord</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h4>Legal</h4>
            <ul>
              <li><a href="/terms.html">Terms of Service</a></li>
              <li><a href="/privacy.html">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
      </footer>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    // Play 3D Demo Button
    this.element.querySelector('#btn-hero-test-game')?.addEventListener('click', () => {
      if (this.onLaunchGame) this.onLaunchGame();
    });

    // Navigation & Auth Action Handler
    const handleAuthOrConsole = () => {
      if (auth.isSignedIn()) {
        if (this.onNavigateDashboard) this.onNavigateDashboard();
      } else {
        auth.loginWithGithub();
      }
    };

    this.element.querySelector('#btn-nav-console')?.addEventListener('click', () => {
      if (this.onNavigateDashboard) this.onNavigateDashboard();
    });
    this.element.querySelector('#btn-nav-auth')?.addEventListener('click', handleAuthOrConsole);
    this.element.querySelector('#btn-hero-console')?.addEventListener('click', () => {
      if (this.onNavigateDashboard) this.onNavigateDashboard();
    });
    this.element.querySelector('#btn-hero-auth')?.addEventListener('click', handleAuthOrConsole);
    this.element.querySelector('#btn-cta-console')?.addEventListener('click', () => {
      if (this.onNavigateDashboard) this.onNavigateDashboard();
    });
    this.element.querySelector('#btn-cta-auth')?.addEventListener('click', handleAuthOrConsole);
  }

  getElement() {
    return this.element;
  }
}
