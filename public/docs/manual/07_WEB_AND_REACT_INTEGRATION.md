# Mereb Manual: Web, Three.js & React Integration

> **Version:** 2026.1 LTS &nbsp;|&nbsp; **Verified Frameworks:** React 18/19, Three.js, Phaser 3, Vanilla JS &nbsp;|&nbsp; [Switch to Scripting API](../api/SCRIPTING_REFERENCE.md)

---

## 1. React Hook (`useMereb`)

Mereb exports a dedicated React hook (`mereb-netcode/react`) that manages connection lifecycles, matchmaking states, and network statistics with zero boilerplate.

```jsx
import React from 'react';
import { useMereb } from 'mereb-netcode/react';

export function MultiplayerLobby() {
  const {
    status,           // 'idle' | 'connecting' | 'in_lobby' | 'matching' | 'connected'
    roomCode,         // 4-letter room code (e.g. 'W7KP')
    role,             // 'host' | 'client' | null
    isHost,           // true if authoritative host
    isBot,            // true if playing local bot
    quality,          // { ping: 24, jitter: 3, packetLoss: 0, rating: 'great' }
    createRoom,       // Function to generate new room
    joinRoom,         // Function (code) => Promise<void>
    quickPlay,        // Function () => Promise<void>
    disconnect,       // Function () => void
    sendEvent         // Function (name, data) => void
  } = useMereb({
    host: 'mereb-signaling.dawitbaslyos.workers.dev',
    botTimeoutMs: 8000,
    autoJoinFromUrl: true
  });

  return (
    <div className="lobby-card">
      <h2>⚔️ Mereb Arena Lobby</h2>
      <div className="badge-row">
        <span className={`status-pill status-${status}`}>{status.toUpperCase()}</span>
        <span className="ping-pill">📡 {quality.ping} ms ({quality.rating})</span>
      </div>

      {status === 'connected' ? (
        <div className="connected-panel">
          <p>Match Active! Room: <strong>{roomCode}</strong></p>
          <p>Role: <strong>{role}</strong> {isBot && '(Bot Opponent)'}</p>
          <button onClick={disconnect} className="btn-danger">Leave Match</button>
        </div>
      ) : (
        <div className="action-buttons">
          <button onClick={quickPlay} className="btn-primary">⚡ Quick Play</button>
          <button onClick={createRoom} className="btn-secondary">Create Private Room</button>
        </div>
      )}
    </div>
  );
}
```

---

## 2. Three.js 3D WebGL Implementation

In a 3D web game (Three.js), decouple network ticks from the render loop (`requestAnimationFrame`):

```javascript
import * as THREE from 'three';
import { MerebClient, SnapshotInterpolator } from 'mereb-netcode';

// 1. Scene & Meshes
const scene = new THREE.Scene();
const localPlayerMesh = createTankMesh(0x00a2ff);
const remoteOpponentMesh = createTankMesh(0xff3366);
scene.add(localPlayerMesh, remoteOpponentMesh);

// 2. Network & Interpolation
const net = new MerebClient({ host: 'mereb-signaling.workers.dev' });
const interpolator = new SnapshotInterpolator({ bufferTime: 60 });

net.on('match-start', ({ isHost }) => {
  console.log('3D Match initiated! Host mode:', isHost);
});

// 3. 20Hz Fixed Physics Tick
setInterval(() => {
  if (net.isHost) {
    // Authoritative Host broadcasts 3D transforms
    net.sendState({
      t: Date.now(),
      x: localPlayerMesh.position.x,
      z: localPlayerMesh.position.z,
      rotY: localPlayerMesh.rotation.y
    });
  }
}, 50);

// 4. Client receives 3D state
net.on('state', (state) => {
  interpolator.pushSnapshot(state.t, {
    opponent: { x: state.x, z: state.z, rotation: state.rotY }
  });
});

// 5. 60/120 FPS Render Loop
function animate() {
  requestAnimationFrame(animate);

  if (!net.isHost) {
    const smooth = interpolator.getInterpolated();
    if (smooth.opponent) {
      remoteOpponentMesh.position.x = smooth.opponent.x;
      remoteOpponentMesh.position.z = smooth.opponent.z;
      remoteOpponentMesh.rotation.y = smooth.opponent.rotation;
    }
  }

  renderer.render(scene, camera);
}
requestAnimationFrame(animate);
```

---

## 3. Phaser 3 Arcade Implementation

In Phaser 3, update remote sprite bodies within your scene's `update()` method:

```javascript
import Phaser from 'phaser';
import { MerebClient } from 'mereb-netcode';

export class DuelScene extends Phaser.Scene {
  create() {
    this.player = this.physics.add.sprite(100, 300, 'ship');
    this.enemy = this.physics.add.sprite(700, 300, 'enemy-ship');

    this.net = new MerebClient({ host: 'mereb-signaling.workers.dev' });
    this.net.quickPlay();

    this.net.on('state', (state) => {
      this.enemy.setPosition(state.x, state.y);
    });
  }

  update() {
    if (this.net.isHost) {
      this.net.sendState({
        x: this.player.x,
        y: this.player.y
      });
    }
  }
}
```

---

> [!TIP]
> Ready to optimize state serialization? Review the [Netcode & Binary Packing Guide](08_NETCODE_BINARY_AND_INTERPOLATION.md).
