# 🌐 Mereb SDK — Reusable Multiplayer Web Game Framework

**Mereb** is an ultra-lightweight (10 kB gzipped), zero-cost multiplayer SDK designed specifically for web game portals (**Poki**, **CrazyGames**, **Poki SDK**, **CrazyGames SDK**, mobile web, and indie games).

It eliminates the need for expensive dedicated game servers by combining:
1. **Serverless WebSocket Signaling & Matchmaking** (Cloudflare Workers / PartyKit).
2. **Direct Peer-to-Peer WebRTC DataChannels** (Unreliable UDP-like 60Hz state replication + Reliable TCP-like event channels).
3. **Automatic Bot Fallback** (8-second timeout so players never wait in empty matchmaking queues).
4. **Deep Linking & Viral Invites** (Instant 4-letter room codes & shareable URLs for Poki `shareableURL` and CrazyGames invites).
5. **Headless Engine or Drop-in Tactile Arcade Lobby**.

---

## 📦 Architecture Overview

```
                                  [ PartyKit / Cloudflare Edge ]
                                  (Signaling & Matchmaking Queue)
                                          ▲             ▲
                                 WebSockets             WebSockets
                                          │             │
        ┌─────────────────────────────────┴─────────────┴─────────────────────────────────┐
        │                                                                                 │
   [ Player 1 (Host) ] <══════════════ WebRTC DataChannel ══════════════> [ Player 2 (Client) ]
   (60Hz authoritative state)                  (P2P UDP traffic)               (Inputs + Prediction)
```

---

## 🚀 Quick Start (Three.js / Canvas / JavaScript)

### 1. Installation & Import
You can import directly from source or use the bundled build (`dist-sdk/mereb.es.js`):

```javascript
import { MerebClient, MerebLobby } from './sdk/index.js';

// 1. Initialize the client
const net = new MerebClient({
  host: 'localhost:1999', // or your-project.partykit.dev in production
  botTimeoutMs: 8000,     // start bot if no player joins in 8s
  autoJoinFromUrl: true   // automatically connects if ?room=XXXX is in URL
});

// 2. (Optional) Attach the drop-in Arcade Lobby UI
const lobby = new MerebLobby(net, {
  title: '⚔️ MY AWESOME GAME'
});
```

### 2. Handle Match Lifecycle
```javascript
// Triggered when 2 players connect OR when a bot spawns
net.on('match-start', ({ role, localId, peerId, isBot, isHost }) => {
  console.log(`Match started! Role: ${role}, Opponent: ${peerId}, IsBot: ${isBot}`);

  if (isHost) {
    // You are the Host: run the simulation loop
    game.onUpdate = () => {
      const state = game.getState();
      net.sendState(state); // Unreliable UDP broadcast
    };
  } else {
    // You are the Client: send player input to host
    input.onChanged = (userKeys) => {
      net.sendInput(userKeys); // Unreliable UDP stream
    };
  }
});

// Client receives host game state
net.on('state', (serverState) => {
  game.applyServerState(serverState);
});

// Host receives client input
net.on('input', (clientInput) => {
  game.applyPlayerInput(net.peerId, clientInput);
});

// Reliable game events (scores, kills, round end, chat)
net.on('event', ({ name, data }) => {
  if (name === 'game-over') {
    showGameOverScreen(data.winner);
  }
});

// Opponent rage-quits or closes tab
net.on('peer-disconnect', () => {
  showToast('Opponent left — You Win by forfeit! 🏆');
  net.disconnect();
});
```

---

## ⚡ Pro Netcode: Binary Packing & Snapshot Interpolation

Mereb includes professional-grade netcode utilities built directly into the SDK:

### 1. Binary Packing (85% Bandwidth Reduction + Zero GC Pressure)
Instead of stringifying JSON at 60Hz, use `BinaryWriter` and `BinaryReader`:

```javascript
import { BinaryWriter, BinaryReader } from './sdk/index.js';

// Host encodes 1v1 state into ~24 bytes of binary:
const writer = new BinaryWriter();
writer.writeUint8(0x01);                // Packet Header
writer.writeUint32(Date.now());         // Timestamp
writer.writeFixed16(player.x, 100);     // 2 bytes (0.01 unit precision!)
writer.writeFixed16(player.z, 100);     // 2 bytes
writer.writeFixed16(player.rotation, 1000); // 2 bytes
writer.writeUint8(player.health);       // 1 byte

// Broadcast binary packet directly over WebRTC DataChannel:
net.sendBinary(writer.getView());

// Client decodes in <0.02ms with zero object allocations:
net.on('binary', (arrayBuffer) => {
  const reader = new BinaryReader(arrayBuffer);
  const header = reader.readUint8();
  const time = reader.readUint32();
  const x = reader.readFixed16(100);
  const z = reader.readFixed16(100);
  const rotation = reader.readFixed16(1000);
  const health = reader.readUint8();
});
```

### 2. Snapshot Interpolation (Buttery 60/120 FPS Rendering)
Discrete 20Hz network ticks look choppy without interpolation. `SnapshotInterpolator` renders remote entities in the past with shortest-angle angular rotation:

```javascript
import { SnapshotInterpolator } from './sdk/index.js';

const interpolator = new SnapshotInterpolator({
  bufferTime: 80 // 80ms render delay (smooths out packet jitter)
});

// When new state arrives over network:
net.on('binary', (buffer) => {
  const state = decodeState(buffer);
  interpolator.pushSnapshot(state.time, {
    [enemyId]: { x: state.x, z: state.z, rotation: state.rotation }
  });
});

// In your 60/120 FPS render loop (requestAnimationFrame):
function render() {
  requestAnimationFrame(render);

  const smooth = interpolator.getInterpolated();
  if (smooth[enemyId]) {
    enemyMesh.position.set(smooth[enemyId].x, 0, smooth[enemyId].z);
    enemyMesh.rotation.y = smooth[enemyId].rotation; // Shortest-angle slerp!
  }
}
```

---

## 🎮 Godot 4 Addon (`addons/mereb/`)

Mereb includes a native Godot 4 addon located in `addons/mereb/`:
1. Copy `addons/mereb` to your Godot project's `res://addons/` directory.
2. Enable **Mereb Multiplayer** in **Project Settings -> Plugins**.
3. Add a `MerebMultiplayer` node to your scene and connect GDScript signals (`match_started`, `state_received`, `input_received`, `quality_updated`).
4. Ensure `mereb.umd.js` is included in your export HTML template.

See [addons/mereb/README.md](./addons/mereb/README.md) for full GDScript code samples.

---

## 🌐 Web Portal Adapters (Poki & CrazyGames)

Hook official portal SDKs in 1 line:

```javascript
// Connect Poki SDK: handles shareableURL and pauses netcode on video ads
net.usePortal('poki', window.PokiSDK);

// Or connect CrazyGames SDK: handles invite links and avatar sync
net.usePortal('crazygames', window.CrazyGames.SDK);

// Listen to commercial break freeze events:
net.portal.on('ad-start', () => {
  // Automatically pauses simulation tick so player isn't killed during ads
  gameEngine.pause();
});

net.portal.on('ad-end', () => {
  gameEngine.resume();
});
```

---

## 📶 Multi-TURN Pool & Real-Time Network Quality

### 1. Resilient ICE Pool
The SDK automatically pools redundant STUN servers (Google, Cloudflare, OpenRelay) and falls back to **OpenRelay TLS TURN over Port 443**, guaranteeing connections even on strict school or dorm Wi-Fi networks.

### 2. Live Quality Monitor
Inspect live ping, jitter, packet loss, and rating:
```javascript
// Real-time metric snapshot:
console.log(net.stats);
// Output: { ping: 28, jitter: 3, packetLoss: 0, rating: 'great' }

// Listen for connection quality shifts:
net.on('quality', ({ ping, jitter, packetLoss, rating }) => {
  hud.updatePingBadge(`${ping}ms`, rating);
});
```

---

## 📚 MerebClient API Reference

### Constructor Options
```javascript
new MerebClient({
  host: 'localhost:1999',  // Signaling server URL
  botTimeoutMs: 8000,      // Quick play timeout before triggering local bot (default: 8000)
  autoJoinFromUrl: true,   // Auto join room from ?room=XXXX query parameter (default: true)
  iceServers: [...]        // Custom STUN/TURN servers (defaults to resilient Multi-TURN pool)
})
```

### Methods
| Method | Description |
| :--- | :--- |
| `createRoom()` | Creates a new room and returns `{ roomCode, shareUrl }`. |
| `joinRoom(code)` | Joins an existing room with a 4-letter code. |
| `quickPlay()` | Enters global matchmaking queue with automatic bot fallback. |
| `sendState(state)` | Broadcasts authoritative state over unordered, unreliable channel (UDP-like). |
| `sendBinary(buffer)` | Sends raw `ArrayBuffer` or `TypedArray` view with zero serialization overhead. |
| `sendInput(input)` | Client sends user input to host over unordered channel. |
| `sendEvent(name, data)` | Sends guaranteed, ordered event over reliable channel (scores, chat, game over). |
| `usePortal(type, sdk)` | Hooks official portal SDK (`'poki'`, `'crazygames'`, or `'auto'`). |
| `disconnect()` | Cleans up WebRTC and WebSocket connections. |

### Properties
| Property | Type | Description |
| :--- | :--- | :--- |
| `stats` | `Object` | `{ ping, jitter, packetLoss, rating }` |
| `isHost` | `boolean` | True if this peer is the authoritative host. |
| `isBot` | `boolean` | True if playing against local fallback bot. |
| `latency` | `number` | Real-time round trip time in milliseconds. |
| `roomCode` | `string` | 4-letter room code (e.g. `W7KP`). |

### Events (`net.on(event, handler)`)
| Event | Payload | Triggered When |
| :--- | :--- | :--- |
| `match-start` | `{ role, localId, peerId, isBot, isHost }` | P2P connection opens or bot spawns. |
| `state` | `(serverState)` | Client receives high-frequency game state. |
| `binary` | `(arrayBuffer)` | Raw binary packet arrives over data channel. |
| `input` | `(clientInput)` | Host receives high-frequency player inputs. |
| `event` | `{ name, data }` | Either peer sends reliable event via `sendEvent()`. |
| `quality` | `{ ping, jitter, packetLoss, rating }` | Live network health stats update. |
| `peer-disconnect` | `{ peerId, reason }` | Opponent rage-quits or loses connection. |
| `latency` | `{ latency }` | Ping round-trip measurement. |
| `status-change` | `{ status }` | Status changes (`idle`, `connecting`, `matching`, etc.). |

---

## 🚢 Production Deployment ($0/month)

### 1. Deploy Signaling to Cloudflare / PartyKit
In your project directory:
```bash
npm run deploy:party
```
This deploys `party/server.ts` to Cloudflare Durable Objects. You'll receive a production URL:
`your-game.your-username.partykit.dev`

### 2. Build the Standalone SDK
```bash
npm run build:sdk
```
Outputs:
- `dist-sdk/mereb.es.js` (Modern ESM bundler import, 10 kB gzipped)
- `dist-sdk/mereb.umd.js` (Script tag / Godot HTML5 import, 9.4 kB gzipped)

### 3. Build Your Game Client
```bash
npm run build
```
Creates a production `dist/` directory ready to be uploaded to **Poki**, **CrazyGames**, or **Cloudflare Pages**.
