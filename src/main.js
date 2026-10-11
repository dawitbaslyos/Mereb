import { MerebClient, MerebLobby } from './sdk/index.js';
import { GameEngine } from './game/engine.js';
import { HudUI } from './ui/hud.js';
import { LandingUI } from './ui/landing.js';
import { MAX_HEALTH } from './network/protocol.js';

const PARTY_HOST = window.location.hostname === 'localhost'
  ? 'localhost:1999'
  : window.location.host;

class App {
  constructor() {
    this.landingContainer = document.getElementById('landing-container');
    this.gameView = document.getElementById('game-view');
    this.uiLayer = document.getElementById('ui-layer');

    // Mount Landing UI
    this.landing = new LandingUI(() => this.enterGameMode());
    this.landingContainer.appendChild(this.landing.getElement());

    // Game state references (lazy-initialized when playing)
    this.engine = null;
    this.hud = null;
    this.client = null;
    this.lobby = null;
    this.botInterval = null;
    this.gameInitialized = false;

    // Check if initial URL demands game view (e.g. ?room=ABCD, ?play=1, #/play)
    const params = new URLSearchParams(window.location.search);
    const hasRoomParam = params.has('room');
    const hasPlayParam = params.has('play');
    const isPlayHash = window.location.hash === '#/play' || window.location.hash === '#play';

    if (hasRoomParam || hasPlayParam || isPlayHash) {
      this.enterGameMode();
    } else {
      this.exitGameMode();
    }

    // Handle hash changes
    window.addEventListener('hashchange', () => {
      if (window.location.hash === '#/play' || window.location.hash === '#play') {
        this.enterGameMode();
      } else if (window.location.hash === '#/' || window.location.hash === '') {
        this.exitGameMode();
      }
    });
  }

  enterGameMode() {
    this.landingContainer.style.display = 'none';
    this.gameView.style.display = 'block';
    document.body.classList.add('in-game-mode');

    if (!window.location.hash.includes('play') && !window.location.search.includes('room')) {
      window.history.pushState(null, '', '#/play');
    }

    if (!this.gameInitialized) {
      this._initGame();
      this.gameInitialized = true;
    } else {
      // Trigger canvas resize & reset lobby
      this.engine?.onWindowResize?.();
      this.hud?.hide();
      this.hud?.hideMatchEnd();
      this.lobby?.resetToMenu();
      this.lobby?.show();
    }
  }

  exitGameMode() {
    if (this.gameInitialized) {
      if (this.botInterval) clearInterval(this.botInterval);
      this.client?.disconnect();
      this.engine?.stopMatch();
      this.hud?.hide();
      this.hud?.hideMatchEnd();
      this.lobby?.hide();
    }

    this.gameView.style.display = 'none';
    this.landingContainer.style.display = 'flex';
    document.body.classList.remove('in-game-mode');

    if (window.location.hash.includes('play')) {
      window.history.pushState(null, '', window.location.pathname);
    }
  }

  _initGame() {
    this.engine = new GameEngine(document.getElementById('game-container'));
    this.hud = new HudUI();
    this.uiLayer.appendChild(this.hud.getElement());
    this.hud.hide();

    // Initialize Mereb SDK Client
    this.client = new MerebClient({
      host: PARTY_HOST,
      botTimeoutMs: 8000,
      autoJoinFromUrl: true
    });

    // Drop-in Arcade Lobby with onHome callback
    this.lobby = new MerebLobby(this.client, {
      title: '⚔️ MEREB ARENA',
      container: this.uiLayer,
      onHome: () => this.exitGameMode()
    });

    this._setupClientEvents();
    this._setupHudEvents();
  }

  _setupClientEvents() {
    // When 2 players connect (or bot fallback triggers)
    this.client.on('match-start', ({ role, localId, peerId, isBot, isHost }) => {
      console.log(`[Game] Match started as ${role} vs ${peerId} (bot: ${isBot})`);
      this.hud.show();
      this.hud.updateHealth(MAX_HEALTH, MAX_HEALTH);
      this.hud.updateScore(0, 0);

      this.engine.startMatch(localId, peerId, isHost);

      if (isHost) {
        // Host broadcasts ultra-compact binary packet (~40 bytes)
        this.engine.onBinaryState = (binaryBuf) => {
          if (!isBot) {
            this.client.sendBinary(binaryBuf);
          }
        };

        this.engine.onGameState = (state) => {
          const local = state.players[localId];
          const remote = state.players[peerId];
          if (local && remote) {
            this.hud.updateHealth(local.health, remote.health);
            this.hud.updateScore(local.score, remote.score);
          }
        };

        // If playing against bot, run local bot AI
        if (isBot) {
          this._startBotAI(localId, peerId);
        }
      } else {
        // Client sends inputs to host
        this.engine.onInput = (input) => {
          this.client.sendInput(input);
        };
      }

      // Match win/loss callback
      this.engine.onMatchEnd = (winnerId, scores) => {
        if (this.botInterval) clearInterval(this.botInterval);
        const isWinner = winnerId === localId;
        const ls = scores[localId] || 0;
        const rs = scores[peerId] || 0;
        this.hud.showMatchEnd(isWinner, ls, rs);

        if (isHost && !isBot) {
          this.client.sendEvent('match-end', { winnerId, scores });
        }
      };
    });

    // Client receives compact binary packet from host (decoded & interpolated)
    this.client.on('binary', (arrayBuffer) => {
      this.engine.applyBinaryState(arrayBuffer);
      const local = this.engine.playerStates[this.client.localId];
      const remote = this.engine.playerStates[this.client.peerId];
      if (local && remote) {
        this.hud.updateHealth(local.health, remote.health);
        this.hud.updateScore(local.score, remote.score);
      }
    });

    // Fallback: Client receives JSON game state from host
    this.client.on('state', (state) => {
      this.engine.applyGameState(state);
      const local = state.players[this.client.localId];
      const remote = state.players[this.client.peerId];
      if (local && remote) {
        this.hud.updateHealth(local.health, remote.health);
        this.hud.updateScore(local.score, remote.score);
      }
    });

    // Host receives input from client
    this.client.on('input', (input) => {
      this.engine.applyRemoteInput(input);
    });

    // Real-time network quality badge
    this.client.on('quality', (q) => {
      this.hud.updateQuality(q);
    });

    // Reliable events (e.g. match end, surrender/forfeit)
    this.client.on('event', (msg) => {
      if (msg.name === 'match-end') {
        const { winnerId, scores } = msg.data;
        const isWinner = winnerId === this.client.localId;
        const ls = scores[this.client.localId] || 0;
        const rs = scores[this.client.peerId] || 0;
        this.engine.stopMatch();
        this.hud.showMatchEnd(isWinner, ls, rs);
      } else if (msg.name === 'match-forfeit') {
        if (this.botInterval) clearInterval(this.botInterval);
        this.hud.showMessage('OPPONENT SURRENDERED — VICTORY! 🏆', 4000);
        this.engine.stopMatch();
        setTimeout(() => {
          this.hud.hide();
          this.hud.hideMatchEnd();
          this.lobby.resetToMenu();
          this.lobby.show();
        }, 2500);
      }
    });

    // Opponent disconnect / ragequit handling
    this.client.on('peer-disconnect', () => {
      if (this.botInterval) clearInterval(this.botInterval);
      this.hud.showMessage('OPPONENT FORFEITED — YOU WIN! 🏆', 4000);
      this.engine.stopMatch();
      setTimeout(() => {
        this.hud.hide();
        this.hud.hideMatchEnd();
        this.lobby.resetToMenu();
        this.lobby.show();
      }, 2500);
    });
  }

  _setupHudEvents() {
    const returnToLobby = () => {
      if (this.botInterval) clearInterval(this.botInterval);
      this.client.disconnect();
      this.engine.stopMatch();
      this.hud.hide();
      this.hud.hideMatchEnd();
      this.lobby.resetToMenu();
      this.lobby.show();
    };

    const handleSurrender = () => {
      if (this.botInterval) {
        clearInterval(this.botInterval);
        this.botInterval = null;
      } else {
        try {
          this.client.sendEvent('match-forfeit', { forfeitedBy: this.client.localId });
        } catch (e) {
          console.warn('[Game] Could not send forfeit event:', e);
        }
      }
      returnToLobby();
    };

    this.hud.onLeave(handleSurrender);
    this.hud.onRematch(returnToLobby);
    this.hud.onQuit(returnToLobby);
  }

  _startBotAI(localId, botId) {
    if (this.botInterval) clearInterval(this.botInterval);
    this.botInterval = setInterval(() => {
      const state = typeof this.engine.getGameState === 'function'
        ? this.engine.getGameState()
        : { players: this.engine.playerStates };

      if (!state || !state.players) return;
      const bot = state.players[botId];
      const player = state.players[localId];
      if (!bot || !player) return;

      const dx = player.x - bot.x;
      const dz = player.z - bot.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dx, -dz);

      const botInput = {
        up: dz < -0.5,
        down: dz > 0.5,
        left: dx < -0.5,
        right: dx > 0.5,
        shoot: dist < 8,
        aimAngle: angle,
        timestamp: Date.now()
      };
      this.engine.applyRemoteInput(botInput);
    }, 100);
  }
}

new App();
