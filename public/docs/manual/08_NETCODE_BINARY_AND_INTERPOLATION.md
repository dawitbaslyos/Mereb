# Mereb Manual: Netcode, Binary Packing & Snapshot Interpolation

> **Version:** 2026.1 LTS &nbsp;|&nbsp; **Category:** Optimization & Algorithms &nbsp;|&nbsp; [Switch to Scripting API](../api/SCRIPTING_REFERENCE.md)

---

## 1. Why JSON Destroys Multiplayer Performance

The default transport serialization for web games is typically JSON over WebSockets:
```javascript
// A typical uncompressed 60Hz JSON snapshot:
const snapshot = JSON.stringify({
  t: 1729000000000,
  players: [
    { id: "peer_a", x: 124.582, z: -43.192, rotation: 1.5707, health: 100, isShielded: true },
    { id: "peer_b", x: 210.119, z: 98.421, rotation: 3.1415, health: 85, isShielded: false }
  ]
});
// Payload Size: 248 Bytes!
```
At 60Hz across 1,000 matches, this JSON stream:
1. Consumes **~30 Megabits per second** of continuous network throughput.
2. Creates hundreds of thousands of short-lived JavaScript objects every second, causing the browser Garbage Collector (GC) to trigger frequent 15–40ms execution freezes ("micro-stutter").

---

## 2. Declarative Schema Binary Packing (`defineSchema`)

Mereb provides `defineSchema`, which compiles declarative object templates into compact binary byte buffers:

```javascript
import { defineSchema } from 'mereb-netcode';

// Define exact field formats and fixed-point multipliers
export const TankStateSchema = defineSchema({
  x: 'fixed16',        // 2 bytes: [-327.68 to +327.67] with precision 100
  z: 'fixed16',        // 2 bytes
  rotation: 'fixed16', // 2 bytes: precision 1000 for smooth radians
  turretRot: 'fixed16',// 2 bytes
  health: 'uint8',     // 1 byte: [0 to 255]
  score: 'uint8',      // 1 byte: [0 to 255]
  isShielded: 'boolean',// 1 bit
  isFiring: 'boolean'  // 1 bit
});
// Total Packed Size: 11 BYTES PER ENTITY! (88% Bandwidth Reduction vs JSON)
```

### Encoding and Decoding Example
```javascript
// Authoritative Host: Encode and stream via WebRTC UDP DataChannel
const binaryBuffer = TankStateSchema.encode({
  x: localPlayer.x,
  z: localPlayer.z,
  rotation: localPlayer.rotation,
  turretRot: localPlayer.turretRot,
  health: localPlayer.health,
  score: localPlayer.score,
  isShielded: localPlayer.shieldActive,
  isFiring: localPlayer.firing
});

net.sendBinary(binaryBuffer);

// Client Peer: Decode binary packet in <0.02ms with ZERO GC allocations
net.on('binary', (arrayBuffer) => {
  const state = TankStateSchema.decode(arrayBuffer);
  interpolator.pushSnapshot(Date.now(), {
    opponent: state
  });
});
```

---

## 3. Low-Level Control: `BinaryWriter` & `BinaryReader`

For custom packet headers or polymorphic messages, use the zero-allocation streaming classes:

```javascript
import { BinaryWriter, BinaryReader } from 'mereb-netcode';

// 1. Pack with BinaryWriter
const writer = new BinaryWriter();
writer
  .writeUint8(0x01)                     // Opcode: 0x01 (WORLD_SNAPSHOT)
  .writeUint32(Date.now())              // Timestamp
  .writeFixed16(player.x, 100)          // Signed 16-bit fixed point
  .writeFixed16(player.z, 100)
  .writeFixed16(player.angle, 1000)
  .writeUint8(player.hp)
  .writeBoolean(player.isGrounded);

const packet = writer.getView(); // Returns Uint8Array view
net.sendBinary(packet);

// 2. Unpack with BinaryReader
net.on('binary', (buffer) => {
  const reader = new BinaryReader(buffer);
  const opcode = reader.readUint8();
  
  if (opcode === 0x01) {
    const timestamp = reader.readUint32();
    const x = reader.readFixed16(100);
    const z = reader.readFixed16(100);
    const angle = reader.readFixed16(1000);
    const hp = reader.readUint8();
    const isGrounded = reader.readBoolean();
  }
});
```

---

## 4. Hermite Snapshot Interpolation (`SnapshotInterpolator`)

Discrete network ticks arrive at intervals (e.g. 50ms at 20Hz), but the browser screen refreshes at 60Hz, 120Hz, or 144Hz. Without interpolation, remote entities appear to jump or stutter.

Mereb's `SnapshotInterpolator` implements cubic Hermite spline interpolation with **shortest-angle spherical interpolation (`slerp`) for rotations**:

```javascript
import { SnapshotInterpolator } from 'mereb-netcode';

const interpolator = new SnapshotInterpolator({
  bufferTime: 70,    // Render delay in milliseconds (smooths jitter)
  maxBufferSize: 30  // Max snapshots cached before pruning
});

// Push incoming network snapshots
net.on('state', (state) => {
  interpolator.pushSnapshot(state.timestamp, {
    [enemyId]: { x: state.x, z: state.z, rotation: state.rot }
  });
});

// Render loop at 60-144 FPS
function render() {
  requestAnimationFrame(render);

  const smoothState = interpolator.getInterpolated();
  if (smoothState[enemyId]) {
    enemyMesh.position.x = smoothState[enemyId].x;
    enemyMesh.position.z = smoothState[enemyId].z;
    // Automatically calculates shortest-angle angular transition (no 360-degree flip glitch!)
    enemyMesh.rotation.y = smoothState[enemyId].rotation;
  }

  renderer.render();
}
```

---

> [!TIP]
> Ready to review portal integration for Poki and CrazyGames? Visit the [Portal Hooks Guide](09_PORTAL_HOOKS_POKI_CRAZYGAMES.md).
