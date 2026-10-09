/**
 * Mereb SDK - Unified Headless Multiplayer Client
 * Pure JavaScript, zero DOM dependencies, works with Three.js, Godot HTML5, Canvas, Phaser.
 */
import { SignalingClient } from './SignalingClient.js';
import { PeerConnection } from './PeerConnection.js';
import { WS, ROLE, STATUS, generateRoomCode } from './constants.js';

export class MerebClient extends EventTarget {
  constructor(options = {}) {
    super();
    this.host = options.host || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'localhost:1999' : '');
    this.botTimeoutMs = options.botTimeoutMs ?? 8000;
    this.iceServers = options.iceServers;
    this.autoJoinFromUrl = options.autoJoinFromUrl ?? true;

    // State
    this.signaling = new SignalingClient(this.host);
    this.peer = null;
    this.status = STATUS.IDLE;
    this.role = null;
    this.localId = null;
    this.peerId = null;
    this.roomCode = null;
    this.isBot = false;
    this.latency = 0;
    this._matchTimeout = null;

    // Optional event callbacks passed via constructor
    if (options.onMatchStart) this.on('match-start', options.onMatchStart);
    if (options.onState) this.on('state', options.onState);
    if (options.onInput) this.on('input', options.onInput);
    if (options.onEvent) this.on('event', options.onEvent);
    if (options.onPeerDisconnect) this.on('peer-disconnect', options.onPeerDisconnect);
    if (options.onStatusChange) this.on('status-change', options.onStatusChange);
    if (options.onLatency) this.on('latency', options.onLatency);

    this._setupSignalingListeners();

    // Check URL params for deep-linked room codes (e.g., Poki / CrazyGames invites)
    if (this.autoJoinFromUrl && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        setTimeout(() => this.joinRoom(roomParam), 50);
      }
    }
  }

  // Convenience helper for event listeners
  on(event, handler) {
    this.addEventListener(event, (e) => handler(e.detail));
  }

  off(event, handler) {
    this.removeEventListener(event, handler);
  }

  _setStatus(newStatus) {
    this.status = newStatus;
    this.dispatchEvent(new CustomEvent('status-change', { detail: { status: newStatus } }));
  }

  _setupSignalingListeners() {
    this.signaling.addEventListener('message', async (e) => {
      const msg = e.detail;

      switch (msg.type) {
        case WS.PLAYER_JOINED:
          this.peerId = msg.playerId;
          break;

        case WS.ROOM_JOINED:
          this.peerId = msg.players.find(id => id !== this.localId);
          if (msg.hostId !== this.localId) {
            this.role = ROLE.CLIENT;
          }
          break;

        case WS.START_SIGNAL:
          this.peerId = msg.peerId;
          this.role = ROLE.HOST;
          await this._initPeerConnection(true);
          break;

        case WS.SIGNAL:
          await this._handleSignal(msg);
          break;

        case WS.MATCH_FOUND:
          if (this._matchTimeout) clearTimeout(this._matchTimeout);
          this.roomCode = msg.roomCode;
          this.peerId = msg.opponentId;
          this._setStatus(STATUS.CONNECTING);
          
          this.signaling.disconnect();
          setTimeout(async () => {
            await this.signaling.connect(this.roomCode);
            this.localId = this.signaling.playerId;
          }, 150);
          break;

        case WS.MATCH_QUEUED:
          this._setStatus(STATUS.MATCHING);
          break;

        case WS.PLAYER_LEFT:
          this._handlePeerLeft('disconnected');
          break;

        case WS.ERROR:
          this.dispatchEvent(new CustomEvent('error', { detail: { message: msg.message } }));
          break;
      }
    });
  }

  async _initPeerConnection(isInitiator) {
    if (this.peer) this.peer.close();

    this.peer = new PeerConnection({ iceServers: this.iceServers });

    this.peer.addEventListener('ice-candidate', (e) => {
      this.signaling.sendSignal(this.peerId, {
        type: 'ice-candidate',
        candidate: e.detail.candidate
      });
    });

    this.peer.addEventListener('open', () => {
      this._setStatus(STATUS.CONNECTED);
      this.dispatchEvent(new CustomEvent('match-start', {
        detail: {
          role: this.role,
          localId: this.localId,
          peerId: this.peerId,
          isBot: false,
          isHost: this.role === ROLE.HOST
        }
      }));
    });

    this.peer.addEventListener('close', () => {
      this._handlePeerLeft('rtc_closed');
    });

    this.peer.addEventListener('state', (e) => {
      this.dispatchEvent(new CustomEvent('state', { detail: e.detail }));
    });

    this.peer.addEventListener('input', (e) => {
      this.dispatchEvent(new CustomEvent('input', { detail: e.detail }));
    });

    this.peer.addEventListener('event', (e) => {
      this.dispatchEvent(new CustomEvent('event', { detail: e.detail }));
    });

    this.peer.addEventListener('latency', (e) => {
      this.latency = e.detail.latency;
      this.dispatchEvent(new CustomEvent('latency', { detail: { latency: this.latency } }));
    });

    this.peer.addEventListener('binary', (e) => {
      this.dispatchEvent(new CustomEvent('binary', { detail: e.detail }));
    });

    if (isInitiator) {
      const offer = await this.peer.createOffer();
      this.signaling.sendSignal(this.peerId, {
        type: 'offer',
        sdp: offer
      });
    }
  }

  async _handleSignal(msg) {
    const signal = msg.signal;
    if (!this.peer && signal.type === 'offer') {
      this.role = ROLE.CLIENT;
      await this._initPeerConnection(false);
    }
    if (!this.peer) return;

    if (signal.type === 'offer') {
      const answer = await this.peer.handleOffer(signal.sdp);
      this.signaling.sendSignal(msg.from, {
        type: 'answer',
        sdp: answer
      });
    } else if (signal.type === 'answer') {
      await this.peer.handleAnswer(signal.sdp);
    } else if (signal.type === 'ice-candidate') {
      await this.peer.addIceCandidate(signal.candidate);
    }
  }

  _handlePeerLeft(reason) {
    if (this.status === STATUS.CONNECTED) {
      this._setStatus(STATUS.DISCONNECTED);
      this.dispatchEvent(new CustomEvent('peer-disconnect', {
        detail: { peerId: this.peerId, reason }
      }));
    }
  }

  // --- Public API Methods ---

  async createRoom() {
    this.disconnect();
    this.role = ROLE.HOST;
    this.roomCode = generateRoomCode();
    this._setStatus(STATUS.CONNECTING);

    await this.signaling.connect(this.roomCode);
    this.localId = this.signaling.playerId;
    this._setStatus(STATUS.IN_LOBBY);

    const shareUrl = typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?room=${this.roomCode}`
      : `?room=${this.roomCode}`;

    this.dispatchEvent(new CustomEvent('room-created', {
      detail: { roomCode: this.roomCode, shareUrl }
    }));

    return { roomCode: this.roomCode, shareUrl };
  }

  async joinRoom(code) {
    this.disconnect();
    this.role = ROLE.CLIENT;
    this.roomCode = code.toUpperCase().trim();
    this._setStatus(STATUS.CONNECTING);

    await this.signaling.connect(this.roomCode);
    this.localId = this.signaling.playerId;
    this._setStatus(STATUS.IN_LOBBY);

    this.dispatchEvent(new CustomEvent('room-joined', {
      detail: { roomCode: this.roomCode }
    }));
  }

  async quickPlay() {
    this.disconnect();
    this._setStatus(STATUS.MATCHING);

    await this.signaling.connect('matchmaker');
    this.localId = this.signaling.playerId;
    this.signaling.send({ type: WS.QUICK_PLAY });

    if (this.botTimeoutMs && this.botTimeoutMs > 0) {
      this._matchTimeout = setTimeout(() => {
        this._startBotMatch();
      }, this.botTimeoutMs);
    }
  }

  _startBotMatch() {
    this.disconnect();
    this.isBot = true;
    this.role = ROLE.HOST;
    this.localId = 'local_player';
    this.peerId = 'bot_opponent';
    this._setStatus(STATUS.CONNECTED);

    this.dispatchEvent(new CustomEvent('match-start', {
      detail: {
        role: ROLE.HOST,
        localId: this.localId,
        peerId: this.peerId,
        isBot: true,
        isHost: true
      }
    }));
  }

  // Broadcast game state to peer (unreliable, 60Hz)
  sendState(data) {
    if (this.peer && this.peer.connected) {
      this.peer.sendState(data);
    }
  }

  // Send raw ArrayBuffer or TypedArray view directly over unreliable channel
  sendBinary(bufferOrView) {
    if (this.peer && this.peer.connected) {
      this.peer.sendBinary(bufferOrView);
    }
  }

  // Send input to host (unreliable)
  sendInput(data) {
    if (this.peer && this.peer.connected) {
      this.peer.sendInput(data);
    }
  }

  // Send critical event (reliable, e.g. score, round_end, chat)
  sendEvent(name, data = {}) {
    if (this.peer && this.peer.connected) {
      this.peer.sendEvent(name, data);
    }
  }

  get isHost() {
    return this.role === ROLE.HOST;
  }

  disconnect() {
    if (this._matchTimeout) clearTimeout(this._matchTimeout);
    if (this.peer) {
      this.peer.close();
      this.peer = null;
    }
    this.signaling.disconnect();
    this.status = STATUS.IDLE;
    this.role = null;
    this.localId = null;
    this.peerId = null;
    this.roomCode = null;
    this.isBot = false;
    this.latency = 0;
  }
}
