export class HudUI {
  constructor() {
    this.injectStyles();
    this.element = document.createElement('div');
    this.element.className = 'hud-container';

    // Score Top Center
    this.scoreDisplay = document.createElement('div');
    this.scoreDisplay.className = 'hud-score';
    this.scoreDisplay.innerText = '🔵 0 : 0 🔴';
    this.element.appendChild(this.scoreDisplay);

    // Message area
    this.messageArea = document.createElement('div');
    this.messageArea.className = 'hud-message';
    this.element.appendChild(this.messageArea);

    // Health Bars (Bottom)
    this.healthContainer = document.createElement('div');
    this.healthContainer.className = 'hud-health-bars';

    // Local Health
    this.localHealthWrapper = document.createElement('div');
    this.localHealthWrapper.className = 'health-wrapper local-health-wrapper';
    this.localHealthLabel = document.createElement('div');
    this.localHealthLabel.className = 'health-label local-label';
    this.localHealthLabel.innerText = 'YOU';
    this.localHealthBarBg = document.createElement('div');
    this.localHealthBarBg.className = 'health-bg';
    this.localHealthBar = document.createElement('div');
    this.localHealthBar.className = 'health-fill health-local';
    this.localHealthBarBg.appendChild(this.localHealthBar);
    this.localHealthWrapper.appendChild(this.localHealthLabel);
    this.localHealthWrapper.appendChild(this.localHealthBarBg);

    // Remote Health
    this.remoteHealthWrapper = document.createElement('div');
    this.remoteHealthWrapper.className = 'health-wrapper remote-health-wrapper';
    this.remoteHealthLabel = document.createElement('div');
    this.remoteHealthLabel.className = 'health-label remote-label';
    this.remoteHealthLabel.innerText = 'FOE';
    this.remoteHealthBarBg = document.createElement('div');
    this.remoteHealthBarBg.className = 'health-bg';
    this.remoteHealthBar = document.createElement('div');
    this.remoteHealthBar.className = 'health-fill health-remote';
    this.remoteHealthBarBg.appendChild(this.remoteHealthBar);
    this.remoteHealthWrapper.appendChild(this.remoteHealthLabel);
    this.remoteHealthWrapper.appendChild(this.remoteHealthBarBg);

    this.healthContainer.appendChild(this.localHealthWrapper);
    this.healthContainer.appendChild(this.remoteHealthWrapper);
    this.element.appendChild(this.healthContainer);

    // Match End Overlay
    this.matchEndOverlay = document.createElement('div');
    this.matchEndOverlay.className = 'match-end-overlay';
    this.matchEndOverlay.style.display = 'none';

    this.matchEndTitle = document.createElement('h1');
    this.matchEndTitle.className = 'match-end-title';
    this.matchEndScores = document.createElement('div');
    this.matchEndScores.className = 'match-end-scores';

    this.rematchBtn = document.createElement('button');
    this.rematchBtn.className = 'hud-btn btn-rematch';
    this.rematchBtn.innerText = 'REMATCH';

    this.quitBtn = document.createElement('button');
    this.quitBtn.className = 'hud-btn btn-quit';
    this.quitBtn.innerText = 'QUIT';

    const btnContainer = document.createElement('div');
    btnContainer.className = 'match-end-btns';
    btnContainer.appendChild(this.rematchBtn);
    btnContainer.appendChild(this.quitBtn);

    this.matchEndOverlay.appendChild(this.matchEndTitle);
    this.matchEndOverlay.appendChild(this.matchEndScores);
    this.matchEndOverlay.appendChild(btnContainer);
    this.element.appendChild(this.matchEndOverlay);
  }

  injectStyles() {
    if (document.getElementById('hud-styles')) return;
    const style = document.createElement('style');
    style.id = 'hud-styles';
    style.textContent = `
      .hud-container {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        pointer-events: none; display: flex; flex-direction: column; justify-content: space-between;
      }
      .hud-score {
        text-align: center; font-size: 48px; font-family: monospace; font-weight: bold;
        margin-top: 16px; text-shadow: 0px 4px 0px #000, 0px 0px 8px rgba(0,0,0,0.5);
      }
      .hud-message {
        position: absolute; top: 30%; left: 50%; transform: translate(-50%, -50%);
        font-size: 32px; font-weight: bold; text-transform: uppercase; color: #fff;
        text-shadow: 0px 3px 0px #000; transition: opacity 0.3s; opacity: 0; text-align: center;
      }
      .hud-health-bars {
        display: flex; justify-content: space-between; padding: 24px 48px; gap: 20px;
      }
      .health-wrapper {
        flex: 1; max-width: 400px; display: flex; flex-direction: column; gap: 8px;
      }
      .local-health-wrapper { align-items: flex-start; }
      .remote-health-wrapper { align-items: flex-end; }
      .health-label {
        font-size: 20px; font-weight: bold; text-shadow: 0px 2px 0px #000; letter-spacing: 1px;
      }
      .local-label { color: #42A5F5; }
      .remote-label { color: #EF5350; }
      .health-bg {
        width: 100%; height: 24px; background: rgba(0,0,0,0.6); border: 2px solid #333;
        border-radius: 12px; overflow: hidden; position: relative; box-shadow: 0 2px 4px rgba(0,0,0,0.5);
      }
      .health-fill {
        height: 100%; width: 100%; transition: width 0.2s ease-out; border-radius: 8px;
      }
      .health-local { background: linear-gradient(90deg, #1976D2, #42A5F5); float: left; }
      .health-remote { background: linear-gradient(90deg, #D32F2F, #EF5350); float: right; }
      
      .match-end-overlay {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); display: flex; flex-direction: column;
        align-items: center; justify-content: center; pointer-events: auto; backdrop-filter: blur(4px);
      }
      .match-end-title { font-size: 64px; text-shadow: 0px 5px 0px #000; margin-bottom: 16px; font-weight: bold; letter-spacing: 4px; }
      .match-end-title.victory { color: #FFC107; text-shadow: 0px 5px 0px #B28900; }
      .match-end-title.defeat { color: #F44336; text-shadow: 0px 5px 0px #B71C1C; }
      .match-end-scores { font-size: 32px; font-family: monospace; font-weight: bold; margin-bottom: 40px; text-shadow: 0px 2px 0px #000; }
      .match-end-btns { display: flex; gap: 16px; }
      .hud-btn {
        background: #333; color: white; border: none; padding: 12px 24px;
        font-family: inherit; font-size: 20px; font-weight: bold;
        border-radius: 8px; cursor: pointer; text-transform: uppercase;
        transition: transform 0.1s, border-bottom 0.1s; min-width: 150px; outline: none;
      }
      .hud-btn:active { border-bottom: 0px solid transparent !important; transform: translateY(4px); }
      .btn-rematch { background: #4CAF50; border-bottom: 4px solid #2E7D32; }
      .btn-quit { background: #9E9E9E; border-bottom: 4px solid #616161; }
    `;
    document.head.appendChild(style);
  }

  show() { this.element.style.display = 'flex'; }
  hide() { this.element.style.display = 'none'; }

  updateHealth(localHealth, remoteHealth, maxHealth = 100) {
    const lp = Math.max(0, Math.min(100, (localHealth / maxHealth) * 100));
    const rp = Math.max(0, Math.min(100, (remoteHealth / maxHealth) * 100));
    
    this.localHealthBar.style.width = `${lp}%`;
    this.remoteHealthBar.style.width = `${rp}%`;
  }

  updateScore(localScore, remoteScore) {
    this.scoreDisplay.innerText = `🔵 ${localScore} : ${remoteScore} 🔴`;
  }

  showMessage(text, duration = 2000) {
    this.messageArea.innerText = text;
    this.messageArea.style.opacity = '1';
    
    if (this.messageTimeout) clearTimeout(this.messageTimeout);
    
    this.messageTimeout = setTimeout(() => {
      this.messageArea.style.opacity = '0';
    }, duration);
  }

  showMatchEnd(isWinner, localScore, remoteScore) {
    this.matchEndOverlay.style.display = 'flex';
    this.matchEndTitle.innerText = isWinner ? 'VICTORY!' : 'DEFEAT';
    this.matchEndTitle.className = 'match-end-title ' + (isWinner ? 'victory' : 'defeat');
    this.matchEndScores.innerText = `FINAL SCORE - YOU: ${localScore} | FOE: ${remoteScore}`;
  }

  hideMatchEnd() {
    this.matchEndOverlay.style.display = 'none';
  }

  onRematch(cb) { this.rematchBtn.addEventListener('click', cb); }
  onQuit(cb) { this.quitBtn.addEventListener('click', cb); }

  getElement() { return this.element; }
}
