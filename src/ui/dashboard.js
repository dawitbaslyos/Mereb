/**
 * Mereb Cloud - Developer Dashboard
 * Precision shadcn / Linear dark UI:
 * - 1 Project limit enforcement on Free tier
 * - API Key copying and quickstart code
 * - Project creation, deletion, and upgrade prompt
 * - Real-time metrics overview
 */
import { auth } from './auth.js';

export class DashboardUI {
  constructor({ onNavigateHome, onLaunchGame }) {
    this.onNavigateHome = onNavigateHome;
    this.onLaunchGame = onLaunchGame;
    this.element = document.createElement('div');
    this.element.className = 'dashboard-root';
    this.currentProjectIndex = 0;
    this.showApiKey = false;

    auth.onChange(() => {
      this.render();
    });

    this.render();
  }

  render() {
    const user = auth.getUser();
    const projects = auth.getProjects();
    const currentProj = projects[this.currentProjectIndex] || projects[0] || null;
    const isFreePlan = !user || user.plan === 'free';

    if (!user) {
      this.element.innerHTML = `
        <div class="dash-empty-state">
          <h2>Authentication Required</h2>
          <p>Please sign in with GitHub to access the Mereb Cloud Dashboard.</p>
          <button class="btn-primary pill-btn btn-login-redirect">Sign in with GitHub</button>
        </div>
      `;
      this.element.querySelector('.btn-login-redirect')?.addEventListener('click', () => {
        auth.loginWithGithub();
      });
      return;
    }

    const maskedKey = currentProj
      ? (this.showApiKey ? currentProj.apiKey : currentProj.apiKey.slice(0, 14) + '••••••••••••')
      : 'No API Key';

    this.element.innerHTML = `
      <!-- Dashboard Top Header -->
      <header class="dash-topbar">
        <div class="dash-topbar-inner">
          <div class="dash-brand-wrap">
            <span class="dash-logo">MEREB</span>
            <span class="dash-slash">/</span>
            <span class="dash-section-name">Cloud Console</span>
            <span class="pill-badge ${isFreePlan ? 'pill-free' : 'pill-pro'}">
              ${isFreePlan ? 'Free Plan (1/1 Projects)' : 'Pro Plan'}
            </span>
          </div>

          <div class="dash-topbar-actions">
            <button class="btn-subtle pill-btn btn-dash-home">← Back to Site</button>
            <button class="btn-subtle pill-btn btn-dash-play">🎮 Play Arena Demo</button>
            
            <div class="user-pill-dropdown">
              <img src="${user.avatar}" alt="${user.username}" class="user-avatar" />
              <span class="user-name">${user.username}</span>
              <button class="btn-logout" title="Sign out">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Dashboard Main Container -->
      <main class="dash-main-container">
        <!-- Page Title & Actions -->
        <div class="dash-title-row">
          <div>
            <h1 class="dash-page-title">Developer Overview</h1>
            <p class="dash-page-desc">Manage your serverless WebRTC edge projects and credentials.</p>
          </div>
          <div class="dash-title-actions">
            ${isFreePlan ? '<button class="btn-pro-pill" id="btn-upgrade-plan">⚡ Upgrade to Pro ($29/mo)</button>' : ''}
            <button class="btn-primary pill-btn" id="btn-create-proj-modal">+ New Project</button>
          </div>
        </div>

        <!-- Metric Cards Grid -->
        <div class="dash-metrics-grid">
          <div class="dash-metric-card">
            <div class="metric-top">
              <span class="metric-title">Active Rooms</span>
              <span class="status-live-dot"></span>
            </div>
            <div class="metric-number">${currentProj?.activeRooms || 0}</div>
            <div class="metric-sub">Live P2P DataChannels</div>
          </div>

          <div class="dash-metric-card">
            <div class="metric-top">
              <span class="metric-title">Matches Today</span>
              <span class="metric-icon">🎮</span>
            </div>
            <div class="metric-number">${currentProj?.totalMatches || 0}</div>
            <div class="metric-sub">Edge signaling handshakes</div>
          </div>

          <div class="dash-metric-card">
            <div class="metric-top">
              <span class="metric-title">Average Latency</span>
              <span class="metric-icon">📶</span>
            </div>
            <div class="metric-number text-accent">${currentProj?.avgPingMs || 22} ms</div>
            <div class="metric-sub">P50 STUN round-trip</div>
          </div>

          <div class="dash-metric-card">
            <div class="metric-top">
              <span class="metric-title">Connection Rate</span>
              <span class="metric-icon">🛡️</span>
            </div>
            <div class="metric-number text-signal">99.8%</div>
            <div class="metric-sub">Successful peer traversal</div>
          </div>
        </div>

        <!-- API Key & Integration Section -->
        <div class="dash-card api-key-card">
          <div class="card-title-row">
            <div>
              <h2 class="card-heading">Project API Key</h2>
              <p class="card-subheading">Pass this key into <code>new MerebClient({ apiKey: '...' })</code> for managed global signaling.</p>
            </div>
            <span class="pill-badge pill-active">${currentProj?.name || 'Starter Project'}</span>
          </div>

          <div class="key-display-row">
            <div class="key-box">
              <span class="key-text" id="api-key-text">${maskedKey}</span>
            </div>
            <button class="btn-subtle pill-btn" id="btn-toggle-key">
              ${this.showApiKey ? 'Hide' : 'Reveal'}
            </button>
            <button class="btn-primary pill-btn" id="btn-copy-key">
              Copy Key
            </button>
            <span class="key-copied-pill" id="key-copied-pill">Copied!</span>
          </div>

          <!-- Code Snippet -->
          <div class="quickstart-snippet">
            <div class="snippet-header">
              <span>Quickstart Integration</span>
              <span class="snippet-lang">JavaScript / TypeScript</span>
            </div>
            <pre class="snippet-code"><code>import { MerebClient } from 'mereb';

const net = new MerebClient({
  apiKey: '${currentProj?.apiKey || 'pk_live_your_key'}',
  botTimeoutMs: 8000
});

net.on('match-start', ({ role, isHost }) => {
  console.log('Multiplayer session live!');
});</code></pre>
          </div>
        </div>

        <!-- Projects List Section -->
        <div class="dash-card projects-card">
          <div class="card-title-row">
            <div>
              <h2 class="card-heading">Active Projects</h2>
              <p class="card-subheading">
                ${isFreePlan ? 'You are using 1 of 1 project allowed on the Free tier.' : 'Unlimited projects active on Pro tier.'}
              </p>
            </div>
          </div>

          <div class="projects-list">
            ${projects.map((proj, idx) => `
              <div class="project-row ${idx === this.currentProjectIndex ? 'project-selected' : ''}">
                <div class="project-info">
                  <div class="project-name-wrap">
                    <span class="project-name">${proj.name}</span>
                    <span class="pill-badge pill-status">Active</span>
                  </div>
                  <div class="project-meta">
                    <span>ID: ${proj.id}</span>
                    <span>•</span>
                    <span>Created: ${proj.createdAt}</span>
                    <span>•</span>
                    <span>Region: ${proj.region}</span>
                  </div>
                </div>

                <div class="project-actions">
                  <button class="btn-subtle pill-btn btn-proj-copy-key" data-key="${proj.apiKey}">Copy Key</button>
                  ${projects.length > 1 ? `
                    <button class="btn-danger-icon btn-proj-delete" data-id="${proj.id}" title="Delete project">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </main>

      <!-- Project Creation Modal -->
      <div class="dash-modal-backdrop" id="modal-create-proj" style="display: none;">
        <div class="dash-modal-card">
          <h3 class="modal-title">Create New Project</h3>
          <p class="modal-desc">Give your game or AI product a name to generate dedicated edge credentials.</p>
          <input type="text" class="modal-input" id="new-proj-name" placeholder="e.g. Cyber Tank Arena 2" maxlength="40" />
          <div class="modal-actions">
            <button class="btn-subtle pill-btn" id="btn-modal-cancel">Cancel</button>
            <button class="btn-primary pill-btn" id="btn-modal-submit">Create Project</button>
          </div>
        </div>
      </div>

      <!-- Limit Reached / Upgrade Modal -->
      <div class="dash-modal-backdrop" id="modal-upgrade" style="display: none;">
        <div class="dash-modal-card upgrade-modal-card">
          <div class="upgrade-badge">⚡ Free Tier Limit Reached</div>
          <h3 class="modal-title">Upgrade to Mereb Pro</h3>
          <p class="modal-desc">
            The Free plan includes <strong>1 active project</strong>. Upgrade to Mereb Pro for unlimited projects, managed multi-region TURN relays, and real-time latency diagnostics.
          </p>

          <div class="upgrade-perks-list">
            <div>✓ Unlimited Projects & API Keys</div>
            <div>✓ 5,000 Monthly Active Game Rooms</div>
            <div>✓ Global Enterprise TURN Mesh (100% Firewall Bypass)</div>
            <div>✓ Real-time Latency & Ragequit Analytics</div>
          </div>

          <div class="modal-actions">
            <button class="btn-subtle pill-btn" id="btn-upgrade-dismiss">Stay on Free</button>
            <button class="btn-primary pill-btn btn-confirm-upgrade" id="btn-confirm-upgrade">
              Activate Pro ($29/mo)
            </button>
          </div>
        </div>
      </div>
    `;

    this._wireEvents();
  }

  _wireEvents() {
    // Navigation
    this.element.querySelector('.btn-dash-home')?.addEventListener('click', () => {
      if (this.onNavigateHome) this.onNavigateHome();
    });

    this.element.querySelector('.btn-dash-play')?.addEventListener('click', () => {
      if (this.onLaunchGame) this.onLaunchGame();
    });

    // Logout
    this.element.querySelector('.btn-logout')?.addEventListener('click', () => {
      auth.logout();
      if (this.onNavigateHome) this.onNavigateHome();
    });

    // Toggle Key Visibility
    const toggleBtn = this.element.querySelector('#btn-toggle-key');
    toggleBtn?.addEventListener('click', () => {
      this.showApiKey = !this.showApiKey;
      this.render();
    });

    // Copy API Key
    const copyKeyBtn = this.element.querySelector('#btn-copy-key');
    const copiedPill = this.element.querySelector('#key-copied-pill');
    copyKeyBtn?.addEventListener('click', async () => {
      const projects = auth.getProjects();
      const currentProj = projects[this.currentProjectIndex] || projects[0];
      if (currentProj) {
        await navigator.clipboard.writeText(currentProj.apiKey);
        copiedPill.classList.add('visible');
        setTimeout(() => copiedPill.classList.remove('visible'), 1600);
      }
    });

    // Copy key from table
    const tableCopyBtns = this.element.querySelectorAll('.btn-proj-copy-key');
    tableCopyBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const key = btn.getAttribute('data-key');
        if (key) {
          await navigator.clipboard.writeText(key);
          const orig = btn.innerText;
          btn.innerText = 'Copied!';
          setTimeout(() => { btn.innerText = orig; }, 1400);
        }
      });
    });

    // Delete Project
    const deleteBtns = this.element.querySelectorAll('.btn-proj-delete');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (id && confirm('Are you sure you want to delete this project?')) {
          auth.deleteProject(id);
          this.currentProjectIndex = 0;
        }
      });
    });

    // Modal Create Project
    const createModalBtn = this.element.querySelector('#btn-create-proj-modal');
    const createModal = this.element.querySelector('#modal-create-proj');
    const upgradeModal = this.element.querySelector('#modal-upgrade');
    const cancelModalBtn = this.element.querySelector('#btn-modal-cancel');
    const submitModalBtn = this.element.querySelector('#btn-modal-submit');
    const projNameInput = this.element.querySelector('#new-proj-name');

    createModalBtn?.addEventListener('click', () => {
      const user = auth.getUser();
      const projects = auth.getProjects();
      const isFree = !user || user.plan === 'free';

      if (isFree && projects.length >= 1) {
        // Enforce 1 project limit!
        upgradeModal.style.display = 'flex';
      } else {
        createModal.style.display = 'flex';
        projNameInput.value = '';
        projNameInput.focus();
      }
    });

    cancelModalBtn?.addEventListener('click', () => {
      createModal.style.display = 'none';
    });

    submitModalBtn?.addEventListener('click', () => {
      const name = projNameInput.value.trim();
      if (!name) return;
      try {
        auth.createProject(name);
        createModal.style.display = 'none';
      } catch (err) {
        if (err.code === 'LIMIT_REACHED') {
          createModal.style.display = 'none';
          upgradeModal.style.display = 'flex';
        } else {
          alert(err.message);
        }
      }
    });

    // Upgrade triggers
    const upgradeTrigger = this.element.querySelector('#btn-upgrade-plan');
    upgradeTrigger?.addEventListener('click', () => {
      upgradeModal.style.display = 'flex';
    });

    this.element.querySelector('#btn-upgrade-dismiss')?.addEventListener('click', () => {
      upgradeModal.style.display = 'none';
    });

    this.element.querySelector('#btn-confirm-upgrade')?.addEventListener('click', () => {
      auth.upgradePlan();
      upgradeModal.style.display = 'none';
    });
  }

  getElement() {
    return this.element;
  }
}
