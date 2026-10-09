export class LobbyUI {
  constructor() {
    this.injectStyles();
    this.element = document.createElement('div');
    this.element.className = 'lobby-container';

    // Title
    const title = document.createElement('h1');
    title.className = 'lobby-title';
    title.innerText = '⚔️ MEREB ARENA';
    this.element.appendChild(title);

    // Menu container
    this.menuContainer = document.createElement('div');
    this.menuContainer.className = 'lobby-menu';
    this.element.appendChild(this.menuContainer);

    // Buttons
    this.createBtn = this.createButton('🎮 CREATE', 'btn-create');
    this.joinBtn = this.createButton('🔗 JOIN', 'btn-join');
    this.quickBtn = this.createButton('⚡ QUICK PLAY', 'btn-quick');

    this.menuContainer.appendChild(this.createBtn);
    this.menuContainer.appendChild(this.joinBtn);
    this.menuContainer.appendChild(this.quickBtn);

    // Join Input Container
    this.joinContainer = document.createElement('div');
    this.joinContainer.className = 'join-container';
    this.joinContainer.style.display = 'none';
    
    this.roomInput = document.createElement('input');
    this.roomInput.className = 'room-input';
    this.roomInput.maxLength = 4;
    this.roomInput.placeholder = 'CODE';
    
    this.submitJoinBtn = this.createButton('GO ➜', 'btn-submit');
    
    this.joinBackBtn = this.createButton('◀ BACK', 'btn-back');
    this.joinContainer.appendChild(this.roomInput);
    this.joinContainer.appendChild(this.submitJoinBtn);
    this.joinContainer.appendChild(this.joinBackBtn);
    this.menuContainer.appendChild(this.joinContainer);

    // Room Display Container
    this.roomDisplay = document.createElement('div');
    this.roomDisplay.className = 'room-display';
    this.roomDisplay.style.display = 'none';
    this.roomCodeText = document.createElement('h2');
    this.roomCodeText.className = 'room-code-text';
    this.roomDisplay.appendChild(this.roomCodeText);

    // Copy Link Button & Back Button for room creator
    this.copyLinkBtn = this.createButton('📋 COPY LINK', 'btn-copy');
    this.roomBackBtn = this.createButton('◀ BACK', 'btn-back');
    this.roomDisplay.appendChild(this.copyLinkBtn);
    this.roomDisplay.appendChild(this.roomBackBtn);
    this.element.appendChild(this.roomDisplay);

    // Status Area
    this.statusText = document.createElement('div');
    this.statusText.className = 'status-text';
    this.element.appendChild(this.statusText);

    // Error Area
    this.errorText = document.createElement('div');
    this.errorText.className = 'error-text';
    this.element.appendChild(this.errorText);

    this.setupInteractions();
  }

  injectStyles() {
    if (document.getElementById('lobby-styles')) return;
    const style = document.createElement('style');
    style.id = 'lobby-styles';
    style.textContent = `
      .lobby-container {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(10, 10, 26, 0.85); display: flex; flex-direction: column;
        align-items: center; justify-content: center; backdrop-filter: blur(4px);
      }
      .lobby-title {
        font-size: 48px; color: #fff; text-shadow: 0 4px 0 #555;
        margin-bottom: 40px; text-transform: uppercase; letter-spacing: 2px;
      }
      .lobby-menu { display: flex; flex-direction: column; gap: 16px; width: 280px; }
      .lobby-btn {
        background: #333; color: white; border: none; padding: 16px 32px;
        font-family: inherit; font-size: 20px; font-weight: bold;
        border-radius: 12px; cursor: pointer; text-transform: uppercase;
        transition: transform 0.1s, border-bottom 0.1s, margin-top 0.1s;
        min-width: 220px; outline: none; box-shadow: 0 4px 6px rgba(0,0,0,0.3);
      }
      .lobby-btn:active {
        border-bottom: 0px solid transparent !important;
        transform: translateY(4px);
        box-shadow: 0 0px 0px rgba(0,0,0,0.3);
      }
      .btn-create { background: #4CAF50; border-bottom: 4px solid #2E7D32; }
      .btn-join { background: #2196F3; border-bottom: 4px solid #1565C0; }
      .btn-quick { background: #FFC107; border-bottom: 4px solid #FF8F00; color: #000; }
      .btn-submit { background: #9C27B0; border-bottom: 4px solid #6A1B9A; min-width: auto; padding: 16px; flex-shrink: 0; }
      .btn-copy { background: #00BCD4; border-bottom: 4px solid #00838F; margin-top: 12px; margin-right: 8px; }
      .btn-back { background: #607D8B; border-bottom: 4px solid #37474F; margin-top: 12px; }
      .join-container { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
      .join-input-row { display: flex; gap: 8px; width: 100%; }
      .room-input {
        flex: 1; padding: 16px; font-size: 24px; font-family: monospace; font-weight: bold;
        text-align: center; border-radius: 12px; border: 2px solid #555; background: #222;
        color: #fff; text-transform: uppercase; outline: none; min-width: 0;
      }
      .room-input:focus { border-color: #2196F3; }
      .room-display { text-align: center; margin-top: 20px; }
      .room-code-text { 
        font-size: 64px; font-family: monospace; letter-spacing: 8px; 
        color: #FFC107; text-shadow: 0 4px 0 #FF8F00; margin-bottom: 8px; 
      }
      .status-text { 
        margin-top: 24px; font-size: 18px; color: #bbb; min-height: 24px; 
        font-weight: 600; text-transform: uppercase; 
      }
      .error-text { 
        margin-top: 12px; font-size: 16px; color: #ff5252; 
        font-weight: bold; min-height: 20px; text-transform: uppercase;
      }
      .waiting-dots::after { content: ''; animation: dots 1.5s steps(4, end) infinite; }
      @keyframes dots { 0%, 20% { content: '.'; } 40% { content: '..'; } 60%, 100% { content: '...'; } }
    `;
    document.head.appendChild(style);
  }

  createButton(text, className) {
    const btn = document.createElement('button');
    btn.className = `lobby-btn ${className}`;
    btn.innerText = text;
    return btn;
  }

  setupInteractions() {
    this.joinBtn.addEventListener('click', () => {
      this.createBtn.style.display = 'none';
      this.joinBtn.style.display = 'none';
      this.quickBtn.style.display = 'none';
      this.joinContainer.style.display = 'flex';
      this.roomInput.focus();
    });

    this.joinBackBtn.addEventListener('click', () => {
      this.resetToMenu();
    });

    this.roomBackBtn.addEventListener('click', () => {
      if (this.onCancelCallback) this.onCancelCallback();
      this.resetToMenu();
    });

    this.copyLinkBtn.addEventListener('click', () => {
      const code = this.roomCodeText.innerText;
      const url = `${window.location.origin}${window.location.pathname}?room=${code}`;
      navigator.clipboard.writeText(url).then(() => {
        const orig = this.copyLinkBtn.innerText;
        this.copyLinkBtn.innerText = 'COPIED! ✅';
        setTimeout(() => { this.copyLinkBtn.innerText = orig; }, 2000);
      }).catch(() => {
        this.showError('FAILED TO COPY');
      });
    });
  }

  show() { this.element.style.display = 'flex'; }
  hide() { this.element.style.display = 'none'; }
  
  showRoomCode(code) {
    this.menuContainer.style.display = 'none';
    this.roomDisplay.style.display = 'block';
    this.roomCodeText.innerText = code;
  }

  showStatus(msg) { 
    this.statusText.innerText = msg;
    this.statusText.classList.remove('waiting-dots');
  }

  showWaiting() {
    this.statusText.innerText = 'WAITING';
    this.statusText.classList.add('waiting-dots');
  }

  showError(msg) {
    this.errorText.innerText = msg;
    setTimeout(() => { this.errorText.innerText = ''; }, 3000);
  }

  resetToMenu() {
    this.menuContainer.style.display = 'flex';
    this.createBtn.style.display = 'block';
    this.joinBtn.style.display = 'block';
    this.quickBtn.style.display = 'block';
    this.joinContainer.style.display = 'none';
    this.roomDisplay.style.display = 'none';
    this.roomInput.value = '';
    this.statusText.innerText = '';
    this.statusText.classList.remove('waiting-dots');
    this.errorText.innerText = '';
  }

  onCreateRoom(cb) { this.createBtn.addEventListener('click', cb); }
  onJoinRoom(cb) {
    this.submitJoinBtn.addEventListener('click', () => {
      const code = this.roomInput.value.trim().toUpperCase();
      if (code.length === 4) cb(code);
      else this.showError('INVALID CODE FORMAT');
    });
    this.roomInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const code = this.roomInput.value.trim().toUpperCase();
        if (code.length === 4) cb(code);
        else this.showError('INVALID CODE FORMAT');
      }
    });
  }
  onCancel(cb) { this.onCancelCallback = cb; }
  onQuickPlay(cb) { this.quickBtn.addEventListener('click', cb); }

  getElement() { return this.element; }
}
