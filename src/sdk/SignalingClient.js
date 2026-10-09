/**
 * Mereb SDK - Signaling Client (PartySocket wrapper)
 */
import PartySocket from 'partysocket';
import { WS } from './constants.js';

export class SignalingClient extends EventTarget {
  constructor(host) {
    super();
    this.host = host;
    this.ws = null;
    this.roomId = null;
  }

  connect(roomId) {
    this.roomId = roomId;
    return new Promise((resolve, reject) => {
      try {
        if (this.ws) {
          this.ws.close();
        }

        this.ws = new PartySocket({
          host: this.host,
          room: roomId
        });

        this.ws.addEventListener('open', () => {
          this.dispatchEvent(new CustomEvent('open', { detail: { id: this.playerId } }));
          resolve();
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
          reject(e);
        });

      } catch (err) {
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
