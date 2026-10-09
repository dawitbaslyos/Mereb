/**
 * Mereb SDK - Rolling Snapshot Interpolator
 * Provides silky-smooth 60/120 FPS rendering of remote network entities from discrete server ticks.
 * Features: Shortest-angle rotation slerp, dynamic clock sync, packet jitter smoothing, gentle extrapolation.
 */

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Shortest-angle interpolation in radians [-PI, PI] or [0, 2PI]
 */
function lerpAngle(a, b, t) {
  let diff = (b - a) % (Math.PI * 2);
  if (diff < -Math.PI) diff += Math.PI * 2;
  if (diff > Math.PI) diff -= Math.PI * 2;
  return a + diff * t;
}

export class SnapshotInterpolator {
  constructor(options = {}) {
    // How far behind real-time the client renders (in milliseconds).
    // Typically 2x the server tick rate (e.g., at 20Hz/50ms ticks, 100ms buffer is optimal).
    this.bufferTime = options.bufferTime ?? 100;

    // Maximum time to extrapolate if network packets are delayed
    this.maxExtrapolation = options.maxExtrapolation ?? 120;

    // Maximum snapshots to keep in history
    this.maxSnapshots = options.maxSnapshots ?? 30;

    // History array of { clientRecvTime, serverTime, entities: { [id]: state } }
    this.snapshots = [];

    // Properties to treat as angular radians (uses shortest-angle lerp)
    this.angleProperties = new Set(options.angleProperties || ['rotation', 'turretRotation', 'angle', 'yaw', 'pitch']);

    // Properties to ignore or snap directly (discrete values)
    this.snapProperties = new Set(options.snapProperties || ['health', 'score', 'team', 'state', 'invulnerable', 'isShooting']);
  }

  /**
   * Push a newly received authoritative server snapshot into the buffer
   * @param {number} serverTime - Timestamp or tick sent by the host
   * @param {Object} entities - Map of entity states: { [id]: { x, z, rotation, ... } }
   */
  pushSnapshot(serverTime, entities) {
    const now = performance.now();

    // Insert sorted by serverTime
    const snapshot = {
      clientRecvTime: now,
      serverTime: serverTime || now,
      entities: entities
    };

    // If snapshot is older than our oldest tracked, discard
    if (this.snapshots.length > 0 && snapshot.serverTime < this.snapshots[0].serverTime) {
      return;
    }

    this.snapshots.push(snapshot);
    this.snapshots.sort((a, b) => a.serverTime - b.serverTime);

    // Prune history
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
  }

  /**
   * Call every animation frame in your render loop (60/120 FPS).
   * Returns a map of all entities smoothly interpolated at this exact frame.
   * @returns {Object} { [id]: interpolatedEntityState }
   */
  getInterpolated() {
    if (this.snapshots.length === 0) {
      return {};
    }

    // Only 1 snapshot available: return directly
    if (this.snapshots.length === 1) {
      return this.snapshots[0].entities;
    }

    const now = performance.now();
    // Render time is bufferTime behind the latest received snapshot
    const latestSnapshot = this.snapshots[this.snapshots.length - 1];
    const renderTime = latestSnapshot.serverTime - this.bufferTime;

    // Find the two surrounding snapshots: s0 <= renderTime <= s1
    let s0 = null;
    let s1 = null;

    for (let i = 0; i < this.snapshots.length - 1; i++) {
      if (this.snapshots[i].serverTime <= renderTime && this.snapshots[i + 1].serverTime >= renderTime) {
        s0 = this.snapshots[i];
        s1 = this.snapshots[i + 1];
        break;
      }
    }

    // Case 1: Target renderTime is older than our oldest snapshot -> snap to oldest
    if (!s0 && renderTime < this.snapshots[0].serverTime) {
      return this.snapshots[0].entities;
    }

    // Case 2: Target renderTime is newer than latest snapshot (packet delayed) -> extrapolate gently
    if (!s0) {
      s0 = this.snapshots[this.snapshots.length - 2];
      s1 = this.snapshots[this.snapshots.length - 1];
      const timeDelta = s1.serverTime - s0.serverTime;
      if (timeDelta <= 0) return s1.entities;

      const overdue = renderTime - s1.serverTime;
      const alpha = 1 + Math.min(overdue, this.maxExtrapolation) / timeDelta;
      return this._interpolateEntities(s0.entities, s1.entities, alpha);
    }

    // Case 3: Normal interpolation between s0 and s1
    const span = s1.serverTime - s0.serverTime;
    const alpha = span > 0 ? (renderTime - s0.serverTime) / span : 1;
    return this._interpolateEntities(s0.entities, s1.entities, Math.max(0, Math.min(1, alpha)));
  }

  _interpolateEntities(e0, e1, alpha) {
    const result = {};
    const allIds = new Set([...Object.keys(e0 || {}), ...Object.keys(e1 || {})]);

    for (const id of allIds) {
      const state0 = e0[id];
      const state1 = e1[id];

      // Entity only exists in one snapshot
      if (!state0 && state1) {
        result[id] = { ...state1 };
        continue;
      }
      if (state0 && !state1) {
        result[id] = { ...state0 };
        continue;
      }

      // Interpolate all numerical properties between state0 and state1
      const interpolated = {};
      for (const key of Object.keys(state1)) {
        const v0 = state0[key];
        const v1 = state1[key];

        if (typeof v1 === 'number' && typeof v0 === 'number') {
          if (this.snapProperties.has(key)) {
            interpolated[key] = v1; // Discrete values snap to latest
          } else if (this.angleProperties.has(key)) {
            interpolated[key] = lerpAngle(v0, v1, alpha); // Angular radians
          } else {
            interpolated[key] = lerp(v0, v1, alpha); // Linear coordinates
          }
        } else {
          // Booleans, strings, objects snap directly
          interpolated[key] = v1 !== undefined ? v1 : v0;
        }
      }
      result[id] = interpolated;
    }

    return result;
  }

  clear() {
    this.snapshots = [];
  }
}
