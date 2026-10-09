const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:openrelay.metered.ca:80' }
  ]
};

export class PeerConnection extends EventTarget {
  constructor() {
    super();
    this.pc = new RTCPeerConnection(RTC_CONFIG);
    this.channel = null;
    this._connected = false;

    // Handle ICE candidates
    this.pc.onicecandidate = (e) => {
      if (e.candidate) {
        this.dispatchEvent(new CustomEvent('ice-candidate', { detail: { candidate: e.candidate } }));
      }
    };

    // Handle incoming data channel (for non-initiator)
    this.pc.ondatachannel = (e) => {
      this._setupChannel(e.channel);
    };

    this.pc.onconnectionstatechange = () => {
      if (this.pc.connectionState === 'disconnected' || this.pc.connectionState === 'failed') {
        this._connected = false;
        this.dispatchEvent(new CustomEvent('close'));
      }
    };
  }

  _setupChannel(channel) {
    this.channel = channel;
    // For game data: unordered, unreliable (UDP-like)
    channel.onopen = () => {
      this._connected = true;
      this.dispatchEvent(new CustomEvent('open'));
    };
    channel.onclose = () => {
      this._connected = false;
      this.dispatchEvent(new CustomEvent('close'));
    };
    channel.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        this.dispatchEvent(new CustomEvent('message', { detail: data }));
      } catch {}
    };
  }

  async createOffer() {
    // Create data channel BEFORE creating offer (initiator creates channel)
    const channel = this.pc.createDataChannel('game', {
      ordered: false,
      maxRetransmits: 0
    });
    this._setupChannel(channel);

    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    return this.pc.localDescription;
  }

  async handleOffer(offer) {
    await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return this.pc.localDescription;
  }

  async handleAnswer(answer) {
    await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  async addIceCandidate(candidate) {
    try {
      if (candidate) {
        await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (e) {
      // Ignore ICE candidate errors (can happen if connection already established)
      console.warn('Error adding ICE candidate', e);
    }
  }

  send(data) {
    if (this.channel && this.channel.readyState === 'open') {
      this.channel.send(JSON.stringify(data));
    }
  }

  get connected() {
    return this._connected;
  }

  close() {
    if (this.channel) this.channel.close();
    if (this.pc) this.pc.close();
    this._connected = false;
  }
}
