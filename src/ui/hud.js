export class HudUI {
  constructor() {
    this.injectStyles();
    this.element = document.createElement('div');
    this.element.className = 'hud-container';

    // 1. Top Bar (Leave button | Score | Network Quality)
    this.topBar = document.createElement('div');
    this.topBar.className = 'hud-top-bar';

    // Top-Left: Leave / Surrender Button
    this.topLeft = document.createElement('div');
    this.topLeft.className = 'hud-top-left';
    this.leaveBtn = document.createElement('button');
    this.leaveBtn.className = 'hud-top-btn hud-leave-btn';
    this.leaveBtn.innerHTML = '<span class="icon">✕</span> LEAVE';
    this.leaveBtn.title = 'Surrender & return to lobby';
    this.topLeft.appendChild(this.leaveBtn);
    this.topBar.appendChild(this.topLeft);

    // Center: Score
    this.scoreDisplay = document.createElement('div');
    this.scoreDisplay.className = 'hud-score';
    this.scoreDisplay.innerText = '🔵 0 : 0 🔴';
    this.topBar.appendChild(this.scoreDisplay);

    // Top-Right: Network Quality Pill
    this.topRight = document.createElement('div');
    this.topRight.className = 'hud-top-right';
    this.qualityBadge = document.createElement('div');
    this.qualityBadge.className = 'hud-quality-badge quality-great';
    this.qualityBadge.innerHTML = '<span class="quality-dot">🟢</span> <span class="quality-text">P2P DIRECT</span>';
    this.topRight.appendChild(this.qualityBadge);
    this.topBar.appendChild(this.topRight);

    this.element.appendChild(this.topBar);

    // 2. Message Area (Center notifications)
    this.messageArea = document.createElement('div');
    this.messageArea.className = 'hud-message';
    this.element.appendChild(this.messageArea);

    // 3. Health Bars (Bottom)
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

    // 4. Surrender Confirmation Modal
    this.confirmModal = document.createElement('div');
    this.confirmModal.className = 'hud-confirm-overlay';
    this.confirmModal.style.display = 'none';

    this.confirmBox = document.createElement('div');
    this.confirmBox.className = 'hud-confirm-box';
    this.confirmBox.innerHTML = `
      <div class="confirm-title">SURRENDER MATCH?</div>
      <div class="confirm-desc">Leaving the arena now will concede defeat to your opponent.</div>
      <div class="confirm-btns">
        <button class="confirm-btn confirm-surrender">✕ SURRENDER</button>
        <button class="confirm-btn confirm-cancel">RESUME PLAY</button>
      </div>
    `;
    this.confirmModal.appendChild(this.confirmBox);
    this.element.appendChild(this.confirmModal);

    // 5. Match End Overlay
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
    this.quitBtn.innerText = 'RETURN TO LOBBY';

    const btnContainer = document.createElement('div');
    btnContainer.className = 'match-end-btns';
    btnContainer.appendChild(this.rematchBtn);
    btnContainer.appendChild(this.quitBtn);

    this.matchEndOverlay.appendChild(this.matchEndTitle);
    this.matchEndOverlay.appendChild(this.matchEndScores);
    this.matchEndOverlay.appendChild(btnContainer);
    this.element.appendChild(this.matchEndOverlay);

    // Event handlers
    this.leaveCallback = null;
    this._wireInternalEvents();
  }

  _wireInternalEvents() {
    this.leaveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showConfirm();
    });

    const surrenderBtn = this.confirmBox.querySelector('.confirm-surrender');
    const cancelBtn = this.confirmBox.querySelector('.confirm-cancel');

    surrenderBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideConfirm();
      if (this.leaveCallback) this.leaveCallback();
    });

    cancelBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideConfirm();
    });
  }

  showConfirm() {
    this.confirmModal.style.display = 'flex';
  }

  hideConfirm() {
    this.confirmModal.style.display = 'none';
  }

  injectStyles() {
    if (document.getElementById('hud-styles')) return;
    const style = document.createElement('style');
    style.id = 'hud-styles';
    style.textContent = `
      .hud-container {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        pointer-events: none; display: flex; flex-direction: column; justify-content: space-between;
        font-family: 'Fredoka', system-ui, -apple-system, sans-serif;
        box-sizing: border-box;
      }
      
      /* Top Bar */
      .hud-top-bar {
        display: flex; align-items: center; justify-content: space-between;
        padding: 16px 24px; width: 100%; box-sizing: border-box;
        pointer-events: none;
      }
      .hud-top-left, .hud-top-right {
        flex: 1; display: flex; align-items: center; pointer-events: auto;
      }
      .hud-top-right { justify-content: flex-end; }

      .hud-top-btn {
        background: rgba(30, 41, 59, 0.85);
        color: #f87171;
        border: 2px solid #ef4444;
        border-bottom: 4px solid #b91c1c;
        border-radius: 10px;
        padding: 8px 16px;
        font-family: inherit;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: transform 0.08s, filter 0.1s;
        backdrop-filter: blur(8px);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .hud-top-btn:hover {
        background: rgba(239, 68, 68, 0.2);
        color: #fff;
      }
      .hud-top-btn:active {
        transform: translateY(3px);
        border-bottom-width: 1px;
      }

      /* Quality Pill */
      .hud-quality-badge {
        background: rgba(15, 23, 42, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 9999px;
        padding: 6px 14px;
        font-size: 12px;
        font-weight: 700;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        backdrop-filter: blur(8px);
        color: #e2e8f0;
        letter-spacing: 0.5px;
      }
      .hud-quality-badge.quality-great { border-color: rgba(34, 197, 94, 0.4); color: #4ade80; }
      .hud-quality-badge.quality-good { border-color: rgba(234, 179, 8, 0.4); color: #facc15; }
      .hud-quality-badge.quality-poor { border-color: rgba(239, 68, 68, 0.4); color: #f87171; }

      /* Score */
      .hud-score {
        text-align: center; font-size: 42px; font-family: monospace; font-weight: 900;
        text-shadow: 0px 4px 0px #000, 0px 0px 12px rgba(0,0,0,0.8);
        letter-spacing: 2px;
      }

      /* Message overlay */
      .hud-message {
        position: absolute; top: 35%; left: 50%; transform: translate(-50%, -50%);
        font-size: 32px; font-weight: 900; text-transform: uppercase; color: #fff;
        text-shadow: 0px 4px 0px #000, 0px 0px 16px rgba(0,0,0,0.8);
        transition: opacity 0.25s, transform 0.25s; opacity: 0; text-align: center;
        pointer-events: none;
      }

      /* Health Bars */
      .hud-health-bars {
        display: flex; justify-content: space-between; padding: 20px 40px; gap: 24px;
        pointer-events: none;
      }
      .health-wrapper {
        flex: 1; max-width: 380px; display: flex; flex-direction: column; gap: 6px;
      }
      .local-health-wrapper { align-items: flex-start; }
      .remote-health-wrapper { align-items: flex-end; }
      .health-label {
        font-size: 16px; font-weight: 800; text-shadow: 0px 2px 0px #000; letter-spacing: 1px;
      }
      .local-label { color: #60a5fa; }
      .remote-label { color: #f87171; }
      .health-bg {
        width: 100%; height: 22px; background: rgba(15, 23, 42, 0.85); border: 2px solid #334155;
        border-radius: 12px; overflow: hidden; position: relative; box-shadow: 0 4px 8px rgba(0,0,0,0.6);
      }
      .health-fill {
        height: 100%; width: 100%; transition: width 0.18s cubic-bezier(0.4, 0, 0.2, 1);
        border-radius: 8px;
      }
      .health-local { background: linear-gradient(90deg, #2563eb, #38bdf8); float: left; }
      .health-remote { background: linear-gradient(90deg, #dc2626, #f87171); float: right; }
      
      /* Surrender Confirmation Modal */
      .hud-confirm-overlay {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(10, 10, 26, 0.75);
        backdrop-filter: blur(6px);
        display: flex; align-items: center; justify-content: center;
        pointer-events: auto; z-index: 100;
      }
      .hud-confirm-box {
        background: #1e1b4b;
        border: 2px solid #4338ca;
        border-radius: 16px;
        padding: 32px 36px;
        max-width: 420px;
        text-align: center;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
      }
      .confirm-title {
        font-size: 28px; font-weight: 900; color: #f87171;
        margin-bottom: 12px; letter-spacing: 1px;
      }
      .confirm-desc {
        font-size: 15px; color: #cbd5e1; line-height: 1.5; margin-bottom: 24px;
      }
      .confirm-btns {
        display: flex; gap: 14px; justify-content: center;
      }
      .confirm-btn {
        flex: 1; padding: 12px 18px; border-radius: 10px; font-family: inherit;
        font-size: 15px; font-weight: 800; cursor: pointer; text-transform: uppercase;
        border: none; transition: transform 0.08s, filter 0.1s;
      }
      .confirm-surrender {
        background: #ef4444; color: #fff; border-bottom: 4px solid #b91c1c;
      }
      .confirm-surrender:active {
        transform: translateY(3px); border-bottom-width: 1px;
      }
      .confirm-cancel {
        background: #334155; color: #e2e8f0; border-bottom: 4px solid #1e293b;
      }
      .confirm-cancel:active {
        transform: translateY(3px); border-bottom-width: 1px;
      }

      /* Match End Overlay */
      .match-end-overlay {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(5, 5, 18, 0.85); display: flex; flex-direction: column;
        align-items: center; justify-content: center; pointer-events: auto; backdrop-filter: blur(8px);
        z-index: 90;
      }
      .match-end-title { font-size: 64px; text-shadow: 0px 5px 0px #000; margin-bottom: 16px; font-weight: 900; letter-spacing: 4px; }
      .match-end-title.victory { color: #fbbf24; text-shadow: 0px 5px 0px #b45309; }
      .match-end-title.defeat { color: #f87171; text-shadow: 0px 5px 0px #b91c1c; }
      .match-end-scores { font-size: 28px; font-family: monospace; font-weight: 800; margin-bottom: 36px; text-shadow: 0px 2px 0px #000; }
      .match-end-btns { display: flex; gap: 16px; }
      .hud-btn {
        background: #334155; color: white; border: none; padding: 14px 28px;
        font-family: inherit; font-size: 18px; font-weight: 800;
        border-radius: 12px; cursor: pointer; text-transform: uppercase;
        transition: transform 0.08s; min-width: 180px; outline: none;
      }
      .hud-btn:active { border-bottom: 0px solid transparent !important; transform: translateY(4px); }
      .btn-rematch { background: #16a34a; border-bottom: 4px solid #15803d; }
      .btn-quit { background: #475569; border-bottom: 4px solid #334155; }
    `;
    document.head.appendChild(style);
  }

  show() {
    this.element.style.display = 'flex';
    this.hideConfirm();
  }

  hide() {
    this.element.style.display = 'none';
    this.hideConfirm();
  }

  updateHealth(localHealth, remoteHealth, maxHealth = 100) {
    const lp = Math.max(0, Math.min(100, (localHealth / maxHealth) * 100));
    const rp = Math.max(0, Math.min(100, (remoteHealth / maxHealth) * 100));
    
    this.localHealthBar.style.width = `${lp}%`;
    this.remoteHealthBar.style.width = `${rp}%`;
  }

  updateScore(localScore, remoteScore) {
    this.scoreDisplay.innerText = `🔵 ${localScore} : ${remoteScore} 🔴`;
  }

  updateQuality(quality) {
    if (!quality) return;
    const { ping = 0, rating = 'great' } = quality;
    let dot = '🟢';
    let text = `${ping}ms • GREAT`;
    let cls = 'quality-great';

    if (rating === 'good') {
      dot = '🟡';
      text = `${ping}ms • GOOD`;
      cls = 'quality-good';
    } else if (rating === 'poor' || rating === 'bad') {
      dot = '🔴';
      text = `${ping}ms • POOR`;
      cls = 'quality-poor';
    } else if (rating === 'offline' || ping === 0) {
      dot = '⚡';
      text = 'LOCAL (0ms)';
      cls = 'quality-great';
    }

    this.qualityBadge.className = `hud-quality-badge ${cls}`;
    this.qualityBadge.innerHTML = `<span class="quality-dot">${dot}</span> <span class="quality-text">${text}</span>`;
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
    this.hideConfirm();
    this.matchEndOverlay.style.display = 'flex';
    this.matchEndTitle.innerText = isWinner ? 'VICTORY! 🏆' : 'DEFEAT 💀';
    this.matchEndTitle.className = 'match-end-title ' + (isWinner ? 'victory' : 'defeat');
    this.matchEndScores.innerText = `FINAL SCORE — YOU: ${localScore} | FOE: ${remoteScore}`;
  }

  hideMatchEnd() {
    this.matchEndOverlay.style.display = 'none';
  }

  onLeave(cb) { this.leaveCallback = cb; }
  onRematch(cb) { this.rematchBtn.addEventListener('click', cb); }
  onQuit(cb) { this.quitBtn.addEventListener('click', cb); }

  getElement() { return this.element; }
}
