/**
 * Mereb SDK - Signaling Client (PartySocket wrapper)
 */
import PartySocket from 'partysocket';
import { WS } from './constants.js';

export class SignalingClient extends EventTarget {
  constructor(host, appId = 'tank-arena') {
    super();
    this.host = host;
    this.appId = appId;
    this.ws = null;
    this.roomId = null;
  }

  connect(roomId, timeoutMs = 15000) {
    this.roomId = roomId;
    return new Promise((resolve, reject) => {
      let resolved = false;
      const timeoutTimer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          reject(new Error('Connection timed out. Server may still be waking up.'));
        }
      }, timeoutMs);

      try {
        if (this.ws) {
          this.ws.close();
        }

        this.ws = new PartySocket({
          host: this.host,
          room: roomId,
          query: { appId: this.appId }
        });

        this.ws.addEventListener('open', () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutTimer);
            this.dispatchEvent(new CustomEvent('open', { detail: { id: this.playerId } }));
            resolve();
          }
        });

        this.ws.addEventListener('message', (e) => {
          try {
            const data = JSON.parse(e.data);
            this.dispatchEvent(new CustomEvent('message', { detail: data }));
          } catch (err) {
            console.error('[Mereb:Signaling] JSON Parse error', err);
          }
        });

        this.ws.addEventListener('close', () => {
          this.dispatchEvent(new CustomEvent('close'));
        });

        this.ws.addEventListener('error', (e) => {
          this.dispatchEvent(new CustomEvent('error', { detail: e }));
          // Do not instantly reject: PartySocket auto-retries while server wakes up.
          // Rejection will only trigger if the full timeout expires.
        });

      } catch (err) {
        clearTimeout(timeoutTimer);
        reject(err);
      }
    });
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  sendSignal(to, signal) {
    this.send({
      type: WS.SIGNAL,
      to,
      signal
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.roomId = null;
  }

  get playerId() {
    return this.ws ? this.ws.id : null;
  }
}
