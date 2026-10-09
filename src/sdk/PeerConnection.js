/**
 * Mereb SDK - WebRTC PeerConnection with Dual DataChannels & Latency Measurement
 */
import { DEFAULT_ICE_SERVERS, DC } from './constants.js';

export class PeerConnection extends EventTarget {
  constructor(options = {}) {
    super();
    this.iceServers = options.iceServers || DEFAULT_ICE_SERVERS;
    this.pc = new RTCPeerConnection({ iceServers: this.iceServers });
    
    this.unreliableChannel = null; // UDP-like (maxRetransmits: 0, ordered: false)
    this.reliableChannel = null;   // TCP-like (ordered: true, reliable)
    
    this._connected = false;
    this.latency = 0;
    this._pingInterval = null;

    // ICE Candidate handler
    this.pc.onicecandidate = (e) => {
      if (e.candidate) {
        this.dispatchEvent(new CustomEvent('ice-candidate', { detail: { candidate: e.candidate } }));
      }
    };

    // Connection state monitor
    this.pc.onconnectionstatechange = () => {
      const state = this.pc.connectionState;
      if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        this._handleDisconnect();
      }
    };

    // Remote channel listener (called for non-initiator peer)
    this.pc.ondatachannel = (e) => {
      const channel = e.channel;
      if (channel.label === 'unreliable') {
        this._setupUnreliableChannel(channel);
      } else if (channel.label === 'reliable') {
        this._setupReliableChannel(channel);
      }
    };
  }

  _setupUnreliableChannel(channel) {
    this.unreliableChannel = channel;
    this.unreliableChannel.binaryType = 'arraybuffer';
    channel.onopen = () => this._checkChannelsOpen();
    channel.onclose = () => this._handleDisconnect();
    channel.onmessage = (e) => {
      if (e.data instanceof ArrayBuffer) {
        this.dispatchEvent(new CustomEvent('binary', { detail: e.data }));
        return;
      }
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === DC.STATE) {
          this.dispatchEvent(new CustomEvent('state', { detail: msg.data }));
        } else if (msg.type === DC.INPUT) {
          this.dispatchEvent(new CustomEvent('input', { detail: msg.data }));
        }
      } catch (err) {
        console.warn('[Mereb:RTC] Failed to parse message on unreliable channel', err);
      }
    };
  }

  _setupReliableChannel(channel) {
    this.reliableChannel = channel;
    channel.onopen = () => this._checkChannelsOpen();
    channel.onclose = () => this._handleDisconnect();
    channel.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === DC.EVENT) {
          this.dispatchEvent(new CustomEvent('event', { detail: msg }));
        } else if (msg.type === DC.PING) {
          // Respond immediately with pong
          this.sendReliable({ type: DC.PONG, time: msg.time });
        } else if (msg.type === DC.PONG) {
          this.latency = Math.max(1, Math.round(Date.now() - msg.time));
          this.dispatchEvent(new CustomEvent('latency', { detail: { latency: this.latency } }));
        }
      } catch (err) {
        console.warn('[Mereb:RTC] Failed to parse message on reliable channel', err);
      }
    };
  }

  _checkChannelsOpen() {
    const unOpen = this.unreliableChannel && this.unreliableChannel.readyState === 'open';
    const relOpen = this.reliableChannel && this.reliableChannel.readyState === 'open';

    if (unOpen && relOpen && !this._connected) {
      this._connected = true;
      this._startPing();
      this.dispatchEvent(new CustomEvent('open'));
    }
  }

  _startPing() {
    if (this._pingInterval) clearInterval(this._pingInterval);
    this._pingInterval = setInterval(() => {
      if (this.reliableChannel && this.reliableChannel.readyState === 'open') {
        this.sendReliable({ type: DC.PING, time: Date.now() });
      }
    }, 2000);
  }

  _handleDisconnect() {
    if (this._connected) {
      this._connected = false;
      if (this._pingInterval) clearInterval(this._pingInterval);
      this.dispatchEvent(new CustomEvent('close'));
    }
  }

  async createOffer() {
    // Initiator creates channels before generating offer
    const unCh = this.pc.createDataChannel('unreliable', {
      ordered: false,
      maxRetransmits: 0
    });
    this._setupUnreliableChannel(unCh);

    const relCh = this.pc.createDataChannel('reliable', {
      ordered: true
    });
    this._setupReliableChannel(relCh);

    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    return this.pc.localDescription;
  }

  async handleOffer(offer) {
    try {
      if (this.pc.signalingState !== 'stable') {
        return null;
      }
      await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);
      return this.pc.localDescription;
    } catch (err) {
      console.warn('[Mereb:RTC] Handled offer race condition:', err.message);
      return null;
    }
  }

  async handleAnswer(answer) {
    try {
      if (this.pc.signalingState === 'have-local-offer') {
        await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (err) {
      console.warn('[Mereb:RTC] Handled answer race condition:', err.message);
    }
  }

  async addIceCandidate(candidate) {
    try {
      if (candidate) {
        await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (e) {
      // Ignored if candidate comes late or during teardown
    }
  }

  sendBinary(bufferOrView) {
    if (this.unreliableChannel && this.unreliableChannel.readyState === 'open') {
      const data = bufferOrView instanceof ArrayBuffer ? bufferOrView : bufferOrView.buffer;
      this.unreliableChannel.send(data);
    }
  }

  sendState(data) {
    if (this.unreliableChannel && this.unreliableChannel.readyState === 'open') {
      if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
        this.sendBinary(data);
      } else {
        this.unreliableChannel.send(JSON.stringify({ type: DC.STATE, data }));
      }
    }
  }

  sendInput(data) {
    if (this.unreliableChannel && this.unreliableChannel.readyState === 'open') {
      if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
        this.sendBinary(data);
      } else {
        this.unreliableChannel.send(JSON.stringify({ type: DC.INPUT, data }));
      }
    }
  }

  sendReliable(payload) {
    if (this.reliableChannel && this.reliableChannel.readyState === 'open') {
      this.reliableChannel.send(JSON.stringify(payload));
    }
  }

  sendEvent(name, data = {}) {
    this.sendReliable({ type: DC.EVENT, name, data });
  }

  get connected() {
    return this._connected;
  }

  close() {
    if (this._pingInterval) clearInterval(this._pingInterval);
    if (this.unreliableChannel) this.unreliableChannel.close();
    if (this.reliableChannel) this.reliableChannel.close();
    if (this.pc) this.pc.close();
    this._connected = false;
  }
}
