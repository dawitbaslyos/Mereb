import PartySocket from 'partysocket';

export class SignalingClient extends EventTarget {
  constructor(host) {
    super();
    this.host = host;
    this.ws = null;
    this.id = null;
  }

  connect(roomId) {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new PartySocket({ host: this.host, room: roomId });

        this.ws.addEventListener('open', () => {
          this.id = this.ws.id;
          resolve();
        });

        this.ws.addEventListener('message', (e) => {
          try {
            const parsed = JSON.parse(e.data);
            this.dispatchEvent(new CustomEvent('message', { detail: parsed }));
          } catch (err) {
            console.error('Failed to parse signaling message', err);
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

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.id = null;
    }
  }

  get playerId() {
    return this.ws ? this.ws.id : null;
  }
}
