/**
 * Mereb SDK - Drop-in Arcade Lobby & Matchmaking UI
 * Chunky 3D tactile buttons, Poki/CrazyGames URL sharing, peripheral HUD principles.
 */
import { STATUS } from './constants.js';

export class MerebLobby {
  constructor(client, options = {}) {
    this.client = client;
    this.options = Object.assign({
      title: '⚔️ MEREB ARENA',
      container: document.body
    }, options);

    this.element = document.createElement('div');
    this.element.className = 'mereb-lobby-overlay';
    
    this._injectStyles();
    this._buildDOM();
    this._setupHandlers();

    if (this.options.container) {
      this.options.container.appendChild(this.element);
    }
  }

  _injectStyles() {
    if (document.getElementById('mereb-lobby-styles')) return;
    const style = document.createElement('style');
    style.id = 'mereb-lobby-styles';
    style.textContent = `
      .mereb-lobby-overlay {
        position: fixed; inset: 0; z-index: 1000;
        background: rgba(10, 10, 26, 0.88); backdrop-filter: blur(6px);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        font-family: 'Fredoka', system-ui, sans-serif; color: #fff;
        user-select: none;
      }
      .mereb-lobby-title {
        font-size: clamp(32px, 6vw, 56px); font-weight: 800;
        text-shadow: 0 4px 0 #333, 0 8px 24px rgba(0,0,0,0.6);
        margin-bottom: 32px; text-transform: uppercase; letter-spacing: 2px;
      }
      .mereb-menu-stack {
        display: flex; flex-direction: column; gap: 14px; width: min(300px, 85vw);
      }
      .mereb-btn {
        appearance: none; border: none; outline: none; cursor: pointer;
        font-family: inherit; font-size: 19px; font-weight: 700; text-transform: uppercase;
        padding: 16px 24px; border-radius: 14px; color: #fff;
        transition: transform 0.08s ease, box-shadow 0.08s ease;
        box-shadow: 0 4px 0 rgba(0,0,0,0.4);
      }
      .mereb-btn:active {
        transform: translateY(3px);
        box-shadow: 0 1px 0 rgba(0,0,0,0.4) !important;
      }
      .btn-create { background: #16a34a; border-bottom: 4px solid #14532d; }
      .btn-join { background: #2563eb; border-bottom: 4px solid #1e3a8a; }
      .btn-quick { background: #f59e0b; border-bottom: 4px solid #b45309; color: #000; }
      .btn-copy { background: #0891b2; border-bottom: 4px solid #155e75; margin-top: 10px; }
      .btn-back { background: #475569; border-bottom: 4px solid #1e293b; margin-top: 10px; }
      .btn-submit { background: #9333ea; border-bottom: 4px solid #581c87; padding: 16px; flex-shrink: 0; }
      
      .mereb-join-box { display: flex; flex-direction: column; gap: 10px; width: 100%; }
      .mereb-input-row { display: flex; gap: 8px; width: 100%; }
      .mereb-code-input {
        flex: 1; padding: 14px; font-size: 24px; font-family: monospace; font-weight: 800;
        text-align: center; border-radius: 14px; border: 2px solid #475569;
        background: #1e1e2f; color: #fff; text-transform: uppercase; outline: none; min-width: 0;
      }
      .mereb-code-input:focus { border-color: #38bdf8; }

      .mereb-room-display { text-align: center; width: min(320px, 85vw); }
      .mereb-room-code {
        font-size: clamp(48px, 12vw, 68px); font-family: monospace; font-weight: 800;
        letter-spacing: 6px; color: #facc15; text-shadow: 0 4px 0 #ca8a04; margin-bottom: 4px;
      }
      .mereb-status-text {
        margin-top: 20px; font-size: 17px; color: #94a3b8; font-weight: 600;
        min-height: 24px; text-transform: uppercase; letter-spacing: 1px;
      }
      .mereb-error-text {
        margin-top: 8px; font-size: 15px; color: #f87171; font-weight: 700;
        min-height: 20px; text-transform: uppercase;
      }
      .mereb-dots::after { content: ''; animation: merebDots 1.5s steps(4, end) infinite; }
      @keyframes merebDots { 0%, 20% { content: '.'; } 40% { content: '..'; } 60%, 100% { content: '...'; } }
    `;
    document.head.appendChild(style);
  }

  _buildDOM() {
    this.element.innerHTML = `
      <h1 class="mereb-lobby-title">${this.options.title}</h1>

      <div class="mereb-menu-stack" id="mereb-main-menu">
        <button class="mereb-btn btn-create" id="mereb-btn-create">🎮 CREATE ROOM</button>
        <button class="mereb-btn btn-join" id="mereb-btn-join">🔗 JOIN ROOM</button>
        <button class="mereb-btn btn-quick" id="mereb-btn-quick">⚡ QUICK PLAY</button>
      </div>

      <div class="mereb-menu-stack" id="mereb-join-menu" style="display: none;">
        <div class="mereb-input-row">
          <input type="text" class="mereb-code-input" id="mereb-input-code" maxlength="4" placeholder="CODE" />
          <button class="mereb-btn btn-submit" id="mereb-btn-submit">GO ➜</button>
        </div>
        <button class="mereb-btn btn-back" id="mereb-btn-join-back">◀ BACK</button>
      </div>

      <div class="mereb-room-display" id="mereb-room-view" style="display: none;">
        <div class="mereb-room-code" id="mereb-code-text">----</div>
        <button class="mereb-btn btn-copy" id="mereb-btn-copy">📋 COPY INVITE LINK</button>
        <button class="mereb-btn btn-back" id="mereb-btn-room-back">◀ BACK</button>
      </div>

      <div class="mereb-status-text" id="mereb-status-text"></div>
      <div class="mereb-error-text" id="mereb-error-text"></div>
    `;

    this.mainMenu = this.element.querySelector('#mereb-main-menu');
    this.joinMenu = this.element.querySelector('#mereb-join-menu');
    this.roomView = this.element.querySelector('#mereb-room-view');
    this.codeInput = this.element.querySelector('#mereb-input-code');
    this.codeText = this.element.querySelector('#mereb-code-text');
    this.statusText = this.element.querySelector('#mereb-status-text');
    this.errorText = this.element.querySelector('#mereb-error-text');
  }

  _setupHandlers() {
    // Create Room
    this.element.querySelector('#mereb-btn-create').addEventListener('click', async () => {
      this.setStatus('Creating room...');
      try {
        const { roomCode } = await this.client.createRoom();
        this.mainMenu.style.display = 'none';
        this.roomView.style.display = 'block';
        this.codeText.innerText = roomCode;
        this.setStatus('Waiting for opponent...', true);
      } catch (err) {
        this.showError('Failed to create room');
      }
    });

    // Join Button
    this.element.querySelector('#mereb-btn-join').addEventListener('click', () => {
      this.mainMenu.style.display = 'none';
      this.joinMenu.style.display = 'flex';
      this.codeInput.focus();
    });

    // Join Submit
    const submitJoin = () => {
      const code = this.codeInput.value.trim().toUpperCase();
      if (code.length === 4) {
        this.setStatus('Joining room...');
        this.client.joinRoom(code);
      } else {
        this.showError('Code must be 4 characters');
      }
    };
    this.element.querySelector('#mereb-btn-submit').addEventListener('click', submitJoin);
    this.codeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') submitJoin();
    });

    // Quick Play
    this.element.querySelector('#mereb-btn-quick').addEventListener('click', () => {
      this.setStatus('Finding opponent...', true);
      this.client.quickPlay();
    });

    // Copy Link
    const copyBtn = this.element.querySelector('#mereb-btn-copy');
    copyBtn.addEventListener('click', () => {
      const code = this.codeText.innerText;
      const url = `${window.location.origin}${window.location.pathname}?room=${code}`;
      navigator.clipboard.writeText(url).then(() => {
        const orig = copyBtn.innerText;
        copyBtn.innerText = 'COPIED! ✅';
        setTimeout(() => { copyBtn.innerText = orig; }, 2000);
      }).catch(() => {
        this.showError('Failed to copy');
      });
    });

    // Back Buttons
    const backToMenu = () => {
      this.client.disconnect();
      this.resetToMenu();
    };
    this.element.querySelector('#mereb-btn-join-back').addEventListener('click', backToMenu);
    this.element.querySelector('#mereb-btn-room-back').addEventListener('click', backToMenu);

    // Client Events
    this.client.on('match-start', () => {
      this.hide();
    });

    this.client.on('error', (data) => {
      this.showError(data.message || 'Network error');
    });

    this.client.on('peer-disconnect', () => {
      this.show();
      this.resetToMenu();
      this.showError('Opponent disconnected');
    });
  }

  setStatus(msg, isWaiting = false) {
    this.statusText.innerText = msg;
    if (isWaiting) {
      this.statusText.classList.add('mereb-dots');
    } else {
      this.statusText.classList.remove('mereb-dots');
    }
  }

  showError(msg) {
    this.errorText.innerText = msg;
    setTimeout(() => { this.errorText.innerText = ''; }, 3500);
  }

  resetToMenu() {
    this.mainMenu.style.display = 'flex';
    this.joinMenu.style.display = 'none';
    this.roomView.style.display = 'none';
    this.codeInput.value = '';
    this.statusText.innerText = '';
    this.statusText.classList.remove('mereb-dots');
  }

  show() { this.element.style.display = 'flex'; }
  hide() { this.element.style.display = 'none'; }
}
