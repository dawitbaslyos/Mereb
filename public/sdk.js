/**
 * Mereb Cloud Client SDK v1.0.0
 * Ultra-lightweight Universal Realtime WebSocket & WebRTC Client for Web, Node, and Game Engines.
 * (c) 2026 Mereb Cloud Platform
 */
(function(global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Mereb = factory());
})(this, function() {
  'use strict';

  class MerebRoom extends EventTarget {
    constructor(client, roomId) {
      super();
      this.client = client;
      this.roomId = roomId;
      this.id = null;
      this.peers = [];
      this.isHost = false;
      this.connected = false;
      this._listeners = new Map();
      this.ws = null;
      this._connect();
    }

    _connect() {
      const proto = this.client.endpoint.startsWith('https') ? 'wss:' : 'ws:';
      const host = this.client.endpoint.replace(/^https?:\/\//, '');
      const url = `${proto}//${host}/v1/${this.client.appId}/${this.roomId}?key=${this.client.apiKey || ''}`;
      this.ws = new WebSocket(url);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        this.connected = true;
        this.emit('open', { roomId: this.roomId });
      };

      this.ws.onmessage = (event) => {
        if (typeof event.data !== 'string') {
          this.emit('binary', event.data);
          this.emit('*', event.data);
          return;
        }

        try {
          const data = JSON.parse(event.data);
          if (data.type === 'connected') {
            this.id = data.id;
            this.isHost = data.isHost;
            this.peers = data.peers || [];
            this.emit('connected', data);
            return;
          }
          if (data.type === 'peer-joined') {
            if (!this.peers.includes(data.id)) this.peers.push(data.id);
            this.emit('peer-joined', data);
            return;
          }
          if (data.type === 'peer-left') {
            this.peers = this.peers.filter(p => p !== data.id);
            this.emit('peer-left', data);
            return;
          }
          if (data.type === 'pong') {
            this.emit('pong', data);
            return;
          }
          
          const eventType = data.event || data.type || 'message';
          this.emit(eventType, data);
          this.emit('*', data);
        } catch {
          this.emit('message', event.data);
        }
      };

      this.ws.onclose = (e) => {
        this.connected = false;
        this.emit('close', e);
      };

      this.ws.onerror = (e) => {
        this.emit('error', e);
      };
    }

    on(event, callback) {
      if (!this._listeners.has(event)) this._listeners.set(event, []);
      this._listeners.get(event).push(callback);
      return this;
    }

    off(event, callback) {
      if (!this._listeners.has(event)) return this;
      this._listeners.set(event, this._listeners.get(event).filter(cb => cb !== callback));
      return this;
    }

    emit(event, data) {
      const cbs = this._listeners.get(event) || [];
      cbs.forEach(cb => cb(data));
      this.dispatchEvent(new CustomEvent(event, { detail: data }));
    }

    send(data) {
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(payload);
      } else if (this.ws) {
        this.ws.addEventListener('open', () => this.ws.send(payload), { once: true });
      }
    }

    sendBinary(buffer) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(buffer);
      }
    }

    sendTo(peerId, data) {
      this.send({ to: peerId, payload: data });
    }

    ping() {
      return new Promise((resolve) => {
        const start = performance.now();
        const handler = (data) => {
          this.off('pong', handler);
          resolve(Math.round(performance.now() - start));
        };
        this.on('pong', handler);
        this.send({ type: 'ping' });
        setTimeout(() => {
          this.off('pong', handler);
          resolve(-1);
        }, 3000);
      });
    }

    close() {
      if (this.ws) this.ws.close();
    }
  }

  class Mereb {
    constructor(options = {}) {
      if (typeof options === 'string') {
        this.appId = options;
        this.apiKey = '';
        this.endpoint = 'https://mereb-signaling.dawitbaslyos.workers.dev';
      } else {
        this.appId = options.appId || 'app_starter';
        this.apiKey = options.apiKey || options.key || '';
        this.endpoint = (options.endpoint || 'https://mereb-signaling.dawitbaslyos.workers.dev').replace(/\/+$/, '');
      }
      this.rooms = new Map();
    }

    room(roomId = 'default') {
      if (!this.rooms.has(roomId)) {
        this.rooms.set(roomId, new MerebRoom(this, roomId));
      }
      return this.rooms.get(roomId);
    }

    async broadcast(roomId, message) {
      const res = await fetch(`${this.endpoint}/v1/${this.appId}/${roomId}/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
      return await res.json();
    }

    async getPresence(roomId) {
      const res = await fetch(`${this.endpoint}/v1/${this.appId}/${roomId}/presence`);
      return await res.json();
    }

    async getLeaderboard(appId = this.appId) {
      const res = await fetch(`${this.endpoint}/api/apps/${appId}/leaderboard`);
      return await res.json();
    }

    async submitScore(player, score, metadata = {}, appId = this.appId) {
      const res = await fetch(`${this.endpoint}/api/apps/${appId}/leaderboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player, score, metadata })
      });
      return await res.json();
    }
  }

  return Mereb;
});
