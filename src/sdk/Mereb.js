/**
 * Mereb Engine - Photon-style High-Level Multiplayer Framework
 * Enables AI and game developers to add real-time multiplayer to any web game in 15 lines of code.
 */
import { MerebClient } from './MerebClient.js';
import { defineSchema } from './netcode/Schema.js';
import { SnapshotInterpolator } from './netcode/SnapshotInterpolator.js';
import { TouchControls } from './controls/TouchControls.js';

class MerebEngine {
  constructor() {
    this.client = null;
    this.appId = 'tank-arena';
    this.host = 'mereb-signaling.dawitbaslyos.workers.dev';
    this.entities = new Map();
    this.interpolator = new SnapshotInterpolator();
    this.rpcHandlers = new Map();
    this.touch = null;
    this.isInitialized = false;
  }

  /**
   * Initialize with game App ID and optional signaling host
   */
  async init(config = {}) {
    if (this.isInitialized && this.client) return this.client;

    this.appId = config.appId || 'tank-arena';
    this.host = config.host || 'mereb-signaling.dawitbaslyos.workers.dev';

    this.client = new MerebClient({
      appId: this.appId,
      host: this.host,
      botTimeoutMs: config.botTimeoutMs ?? 8000,
      autoJoinFromUrl: config.autoJoinFromUrl ?? true
    });

    // Listen for incoming RPCs
    this.client.on('event', (msg) => {
      if (msg.name === 'mereb:rpc') {
        const { rpcName, payload, senderId } = msg.data || {};
        const handler = this.rpcHandlers.get(rpcName);
        if (handler) handler(payload, senderId);
      }
    });

    this.isInitialized = true;
    return this.client;
  }

  /**
   * Photon: PhotonNetwork.JoinOrCreateRoom()
   */
  async joinOrCreateRoom(roomCode) {
    if (!this.client) await this.init();
    return this.client.joinRoom(roomCode);
  }

  /**
   * Photon: PhotonNetwork.JoinRandomRoom() / Matchmaking
   */
  async quickPlay() {
    if (!this.client) await this.init();
    return this.client.quickPlay();
  }

  /**
   * Photon: [PunRPC] Invoke a function on the remote peer
   */
  rpc(rpcName, payload = {}) {
    if (this.client) {
      this.client.sendEvent('mereb:rpc', {
        rpcName,
        payload,
        senderId: this.client.localId
      });
    }
  }

  /**
   * Photon: Register an RPC handler
   */
  onRpc(rpcName, callback) {
    this.rpcHandlers.set(rpcName, callback);
  }

  /**
   * Photon: PhotonNetwork.Instantiate()
   * Wrap an entity with state replication and smooth interpolation
   */
  instantiate(entityType, options = {}) {
    const isLocal = options.isLocal ?? true;
    const schema = options.schema ? defineSchema(options.schema) : null;
    const id = options.id || `${entityType}_${this.client?.localId || 'p'}`;

    const entity = {
      id,
      type: entityType,
      isLocal,
      schema,
      state: {},

      /**
       * Update local state and broadcast
       */
      set(newState) {
        this.state = { ...this.state, ...newState };
        if (this.isLocal && schema && Mereb.client) {
          const packet = schema.encode(this.state);
          Mereb.client.sendBinary(packet);
        }
      },

      /**
       * Subscribe to smooth remote updates
       */
      onUpdate(callback) {
        this._updateCallback = callback;
      }
    };

    this.entities.set(id, entity);
    return entity;
  }

  /**
   * Attach mobile dual virtual joysticks & fire button
   */
  attachControls(options = {}) {
    if (!this.touch) {
      this.touch = new TouchControls(options);
    }
    return this.touch;
  }
}

export const Mereb = new MerebEngine();
export default Mereb;
