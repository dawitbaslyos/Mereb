# Mereb Multiplayer Engine — AI Integration Specification & Blueprint

> **How to turn ANY offline/singleplayer web game into a real-time multiplayer game using `mereb-netcode`.**

This guide provides an exact, standardized blueprint for human developers and AI assistants (Claude, GPT-4, Cursor, Antigravity) to integrate real-time P2P multiplayer into any web game in 4 simple steps.

---

## 1. Architecture Overview (Photon Engine for Web)

Mereb works like Photon Engine / Nakama, but is completely serverless and runs at $0 infrastructure cost:
1. **Signaling:** Cloudflare Workers + Durable Objects for lightning-fast room matchmaking (<15ms globally).
2. **Transport:** WebRTC DataChannel (Unreliable + Unordered UDP) for sub-5ms direct peer-to-peer data transfer.
3. **Serialization:** `defineSchema` compiles JavaScript objects into compact 30-byte binary ArrayBuffers.
4. **Smoothing:** `SnapshotInterpolator` eliminates jitter and network stutter with Hermite lerping.
5. **Mobile-Ready:** `TouchControls` injects floating dual virtual joysticks & chunky arcade buttons.
6. **Live Debugging:** `MerebTerminal` gives an in-game developer terminal to inspect entities, monitor ping/packet loss, and simulate lag.

---

## 2. The 4-Step AI Integration Recipe

When prompting an AI to integrate Mereb into an existing game, instruct it to follow these 4 steps:

### Step 1: Install & Import Mereb
```bash
npm install mereb-netcode
```
```javascript
import { 
  MerebClient, 
  MerebLobby, 
  defineSchema, 
  SnapshotInterpolator, 
  TouchControls,
  MerebTerminal 
} from 'mereb-netcode';
```

---

### Step 2: Define Your Game's State Schema
Instead of writing complex binary codecs, declare the fields your game synchronizes:
```javascript
export const GameSchema = defineSchema({
  x: 'fixed16',        // coordinates compressed into 2 bytes
  y: 'fixed16',
  angle: 'fixed16',    // rotation angle
  health: 'uint8',     // 0-255 health in 1 byte
  score: 'uint8',      // 0-255 score in 1 byte
  isAction: 'boolean'  // 1-bit boolean
});
```

---

### Step 3: Initialize Client & Arcade Lobby
```javascript
// 1. Create client connecting to the Cloudflare edge signaling server
const client = new MerebClient({
  host: 'mereb-signaling.dawitbaslyos.workers.dev', // or your worker URL
  botTimeoutMs: 8000 // Falls back to local bot if no opponent found in 8s
});

// 2. Add the drop-in Arcade Lobby
const lobby = new MerebLobby(client, {
  title: '⚔️ YOUR GAME TITLE',
  container: document.getElementById('ui-container')
});

// 3. Attach in-game Developer Console (press ` or ~ to toggle)
const terminal = new MerebTerminal(client, {
  container: document.body
});
```

---

### Step 4: Hook Match Lifecycle & State Sync
```javascript
const interpolator = new SnapshotInterpolator();

client.on('match-start', ({ role, localId, peerId, isHost, isBot }) => {
  // Hide lobby, start your game simulation
  lobby.hide();
  startGameLoop();

  if (isHost) {
    // HOST: Authoritative simulation (physics, collisions, score)
    setInterval(() => {
      const state = {
        [localId]: getPlayerState(localId),
        [peerId]: getPlayerState(peerId)
      };

      // Encode with your schema and broadcast over WebRTC DataChannel
      const binaryPacket = GameSchema.encode(state);
      client.sendBinary(binaryPacket);
    }, 50); // 20 Hz tick
  } else {
    // CLIENT: Send player input to host
    onLocalInput((input) => {
      client.sendInput(input);
    });
  }
});

// CLIENT: Receive state from host and interpolate smoothly
client.on('binary', (arrayBuffer) => {
  const remoteState = GameSchema.decode(arrayBuffer);
  interpolator.pushSnapshot(Date.now(), remoteState);
});

// Inside your render loop (60 FPS):
function render() {
  const smoothEntities = interpolator.getInterpolated();
  if (smoothEntities.opponent) {
    renderOpponent(smoothEntities.opponent.x, smoothEntities.opponent.y);
  }
  requestAnimationFrame(render);
}
```

---

## 3. Universal Mobile Touch Controls
To add touch joysticks for mobile web (CrazyGames / Poki):
```javascript
const touch = new TouchControls({
  container: document.getElementById('ui-layer'),
  onMove: ({ x, y, up, down, left, right }) => {
    // Handle player movement
  },
  onAim: ({ angle, active }) => {
    // Handle player aiming
  },
  onFire: (isFiring) => {
    // Handle attack / shoot action
  }
});
```

---

## 4. In-Game Developer Terminal Commands
Press **`** (backtick) or tap the floating **`⚡ MEREB DEV`** badge to open the terminal:

| Command | Action |
| :--- | :--- |
| `help` | Lists all available terminal commands |
| `status` | Shows room code, role (Host/Client), peer IDs, and connection status |
| `state` | Dumps current synchronized entity tree in real-time JSON format |
| `lag <ms>` | Injects simulated network latency (e.g., `lag 150` to test 3G mobile) |
| `drop <pct>` | Injects packet loss (e.g., `drop 10` for 10% packet drop) |
| `kick` | Leaves match / simulates opponent disconnect |
| `clear` | Clears terminal log output |

---

## 5. Copy-Paste AI Prompt Blueprint

You can copy and paste this exact prompt to any AI assistant:

> *"I want to add real-time 1v1 multiplayer to this game using the `mereb-netcode` engine. Follow the MEREB_INTEGRATION_SPEC: define a GameSchema for my player state, initialize MerebClient with the Cloudflare edge signaling server, wire up MerebLobby and TouchControls for mobile, and synchronize state over WebRTC DataChannels using SnapshotInterpolator. Keep the singleplayer game logic intact and attach MerebTerminal for live debugging."*
