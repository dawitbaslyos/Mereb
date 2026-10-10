/**
 * Mereb SDK - Real-Time Network Quality Monitor
 * Computes RTT (Ping), Jitter, Packet Loss %, and overall connection quality score.
 */

export class NetworkQuality extends EventTarget {
  constructor(options = {}) {
    super();
    this.ping = 0;
    this.jitter = 0;
    this.packetLoss = 0;
    this.rating = 'good'; // 'great' | 'good' | 'fair' | 'poor'

    this._pingHistory = [];
    this._sentPings = new Map(); // seq -> timestamp
    this._nextSeq = 1;
    this._lostCount = 0;
    this._totalSent = 0;
    this._windowSize = options.windowSize || 10;
  }

  createPingPacket() {
    const seq = this._nextSeq++;
    const now = performance.now();
    this._sentPings.set(seq, now);
    this._totalSent++;

    // Prune pings that didn't receive a pong within 3.5 seconds (considered lost)
    for (const [s, sentTime] of this._sentPings.entries()) {
      if (now - sentTime > 3500) {
        this._sentPings.delete(s);
        this._lostCount++;
        this._updateStats();
      }
    }

    return { seq, time: now };
  }

  recordPong(seq) {
    if (!this._sentPings.has(seq)) return;
    const sentTime = this._sentPings.get(seq);
    this._sentPings.delete(seq);

    const rtt = Math.max(1, Math.round(performance.now() - sentTime));
    this._pingHistory.push(rtt);
    if (this._pingHistory.length > this._windowSize) {
      this._pingHistory.shift();
    }

    this._updateStats();
  }

  _updateStats() {
    if (this._pingHistory.length === 0) return;

    // Smoothed average ping
    const sum = this._pingHistory.reduce((a, b) => a + b, 0);
    const avgPing = Math.round(sum / this._pingHistory.length);
    this.ping = avgPing;

    // Jitter calculation (standard deviation / mean absolute deviation)
    let jitterSum = 0;
    for (let i = 1; i < this._pingHistory.length; i++) {
      jitterSum += Math.abs(this._pingHistory[i] - this._pingHistory[i - 1]);
    }
    this.jitter = this._pingHistory.length > 1
      ? Math.round(jitterSum / (this._pingHistory.length - 1))
      : 0;

    // Packet loss percentage over rolling window
    const windowTotal = Math.min(this._totalSent, 30);
    this.packetLoss = windowTotal > 0
      ? Math.min(100, Math.round((this._lostCount / windowTotal) * 100))
      : 0;

    // Rating determination
    let newRating = 'great';
    if (this.ping > 220 || this.packetLoss >= 10) {
      newRating = 'poor';
    } else if (this.ping > 130 || this.packetLoss >= 4) {
      newRating = 'fair';
    } else if (this.ping > 65 || this.packetLoss >= 2) {
      newRating = 'good';
    } else {
      newRating = 'great';
    }

    const ratingChanged = newRating !== this.rating;
    this.rating = newRating;

    this.dispatchEvent(new CustomEvent('update', {
      detail: this.getStats()
    }));

    if (ratingChanged) {
      this.dispatchEvent(new CustomEvent('rating-change', {
        detail: { rating: this.rating }
      }));
    }
  }

  getStats() {
    return {
      ping: this.ping,
      jitter: this.jitter,
      packetLoss: this.packetLoss,
      rating: this.rating
    };
  }

  reset() {
    this.ping = 0;
    this.jitter = 0;
    this.packetLoss = 0;
    this.rating = 'good';
    this._pingHistory = [];
    this._sentPings.clear();
    this._lostCount = 0;
    this._totalSent = 0;
  }
}
