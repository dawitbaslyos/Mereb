import { MerebClient, MerebLobby } from './sdk/index.js';
import { GameEngine } from './game/engine.js';
import { HudUI } from './ui/hud.js';
import { LandingUI } from './ui/landing.js';
import { DashboardUI } from './ui/dashboard.js';
import { auth } from './ui/auth.js';
import { MAX_HEALTH } from './network/protocol.js';

const urlParams = new URLSearchParams(window.location.search);
const PARTY_HOST = urlParams.get('server')
  || import.meta.env.VITE_PARTY_HOST
  || (window.location.hostname === 'localhost' ? 'localhost:1999' : 'mereb-signaling.onrender.com');

class App {
  constructor() {
    this.landingContainer = document.getElementById('landing-container');
    this.dashboardContainer = document.getElementById('dashboard-container');
    this.gameView = document.getElementById('game-view');
    this.uiLayer = document.getElementById('ui-layer');

    // Instantiate Landing UI
    this.landing = new LandingUI({
      onLaunchGame: () => this.navigate('game'),
      onNavigateDashboard: () => this.navigate('dashboard')
    });
    this.landingContainer.appendChild(this.landing.getElement());

    // Instantiate Dashboard UI
    this.dashboard = new DashboardUI({
      onNavigateHome: () => this.navigate('landing'),
      onLaunchGame: () => this.navigate('game')
    });
    this.dashboardContainer.appendChild(this.dashboard.getElement());

    // Game state references (lazy-initialized when playing)
    this.engine = null;
    this.hud = null;
    this.client = null;
    this.lobby = null;
    this.botInterval = null;
    this.gameInitialized = false;

    // Route determination on load
    this.handleRoute();

    // Listen to hash routing
    window.addEventListener('hashchange', () => this.handleRoute());
  }

  handleRoute() {
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);

    if (params.has('room') || params.has('play') || hash === '#/play' || hash === '#play') {
      this.showGameView();
    } else if (hash === '#/dashboard' || hash === '#dashboard') {
      this.showDashboardView();
    } else {
      this.showLandingView();
    }
  }

  navigate(route) {
    if (route === 'game') {
      window.location.hash = '#/play';
    } else if (route === 'dashboard') {
      window.location.hash = '#/dashboard';
    } else {
      window.location.hash = '#/';
    }
  }

  showLandingView() {
    this._cleanupGame();
    this.gameView.style.display = 'none';
    this.dashboardContainer.style.display = 'none';
    this.landingContainer.style.display = 'flex';
    document.body.classList.remove('in-game-mode');
  }

  showDashboardView() {
    this._cleanupGame();
    this.gameView.style.display = 'none';
    this.landingContainer.style.display = 'none';
    this.dashboardContainer.style.display = 'block';
    document.body.classList.remove('in-game-mode');
  }

  showGameView() {
    this.landingContainer.style.display = 'none';
    this.dashboardContainer.style.display = 'none';
    this.gameView.style.display = 'block';
    document.body.classList.add('in-game-mode');

    if (!this.gameInitialized) {
      this._initGame();
      this.gameInitialized = true;
    } else {
      this.engine?.onWindowResize?.();
      this.hud?.hide();
      this.hud?.hideMatchEnd();
      this.lobby?.resetToMenu();
      this.lobby?.show();
    }
  }

  _cleanupGame() {
    if (this.gameInitialized) {
      if (this.botInterval) clearInterval(this.botInterval);
      this.client?.disconnect();
      this.engine?.stopMatch();
      this.hud?.hide();
      this.hud?.hideMatchEnd();
      this.lobby?.hide();
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

    // Drop-in Arcade Lobby
    this.lobby = new MerebLobby(this.client, {
      title: '⚔️ MEREB ARENA',
      container: this.uiLayer,
      onHome: () => this.navigate('landing')
    });

    this._setupClientEvents();
    this._setupHudEvents();
  }

  _setupClientEvents() {
    this.client.on('match-start', ({ role, localId, peerId, isBot, isHost }) => {
      console.log(`[Game] Match started as ${role} vs ${peerId} (bot: ${isBot})`);
      this.hud.show();
      this.hud.updateHealth(MAX_HEALTH, MAX_HEALTH);
      this.hud.updateScore(0, 0);

      this.engine.startMatch(localId, peerId, isHost);

      if (isHost) {
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

        if (isBot) {
          this._startBotAI(localId, peerId);
        }
      } else {
        this.engine.onInput = (input) => {
          this.client.sendInput(input);
        };
      }

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

    this.client.on('binary', (arrayBuffer) => {
      this.engine.applyBinaryState(arrayBuffer);
      const local = this.engine.playerStates[this.client.localId];
      const remote = this.engine.playerStates[this.client.peerId];
      if (local && remote) {
        this.hud.updateHealth(local.health, remote.health);
        this.hud.updateScore(local.score, remote.score);
      }
    });

    this.client.on('state', (state) => {
      this.engine.applyGameState(state);
      const local = state.players[this.client.localId];
      const remote = state.players[this.client.peerId];
      if (local && remote) {
        this.hud.updateHealth(local.health, remote.health);
        this.hud.updateScore(local.score, remote.score);
      }
    });

    this.client.on('input', (input) => {
      this.engine.applyRemoteInput(input);
    });

    this.client.on('quality', (q) => {
      this.hud.updateQuality(q);
    });

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
