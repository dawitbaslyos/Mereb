import { MerebClient, MerebLobby } from './sdk/index.js';
import { GameEngine } from './game/engine.js';
import { HudUI } from './ui/hud.js';
import { MAX_HEALTH } from './network/protocol.js';

const PARTY_HOST = window.location.hostname === 'localhost'
  ? 'localhost:1999'
  : window.location.host;

class App {
  constructor() {
    this.engine = new GameEngine(document.getElementById('game-container'));
    this.hud = new HudUI();

    const uiLayer = document.getElementById('ui-layer');
    uiLayer.appendChild(this.hud.getElement());
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
      container: uiLayer
    });

    this.botInterval = null;
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

    // Reliable events (e.g. match end)
    this.client.on('event', (msg) => {
      if (msg.name === 'match-end') {
        const { winnerId, scores } = msg.data;
        const isWinner = winnerId === this.client.localId;
        const ls = scores[this.client.localId] || 0;
        const rs = scores[this.client.peerId] || 0;
        this.engine.stopMatch();
        this.hud.showMatchEnd(isWinner, ls, rs);
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
