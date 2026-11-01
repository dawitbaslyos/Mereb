# Mereb Manual: Quickstart & Setup Guide

> **Version:** 2026.1 LTS &nbsp;|&nbsp; **Verified Platforms:** WebGL, HTML5, Godot 4, Unity 3D, Node.js, React &nbsp;|&nbsp; [Switch to Scripting API](../api/SCRIPTING_REFERENCE.md)

---

## 1. Installation

Mereb can be integrated into any web build toolchain or included directly via a standard browser `<script>` tag.

### Package Manager (Vite, Webpack, Next.js, Rollup)
```bash
npm install mereb-netcode
# or
pnpm add mereb-netcode
# or
yarn add mereb-netcode
```

### Direct Script Tag (HTML5, Vanilla JS, Itch.io)
```html
<script src="https://unpkg.com/mereb-netcode/dist-sdk/mereb.umd.js"></script>
<script>
  // Mereb is now accessible globally on window.Mereb
  const { MerebClient, MerebLobby, BinaryWriter } = window.Mereb;
</script>
```

---

## 2. 5-Minute Implementation Blueprint

Here is the complete, production-ready integration lifecycle using ES Modules:

```javascript
import { 
  MerebClient, 
  MerebLobby, 
  MerebTerminal, 
  SnapshotInterpolator 
} from 'mereb-netcode';

// 1. Initialize the Multiplayer Client
const net = new MerebClient({
  // Point to your Cloudflare Worker or PartyKit deployment
  host: 'mereb-signaling.dawitbaslyos.workers.dev',
  botTimeoutMs: 8000,     // Auto-spawn local bot if matchmaking >8s
  autoJoinFromUrl: true   // Auto-connect if URL has ?room=XXXX
});

// 2. Attach the Drop-In Arcade Lobby UI
const lobby = new MerebLobby(net, {
  title: '⚔️ ARENA WARRIORS',
  autoHideOnStart: true
});

// 3. (Optional) Mount In-Game Developer Terminal (Press ` or ~ to toggle)
const terminal = new MerebTerminal(net);

// 4. Set up Interpolation Buffer for Remote Opponent
const interpolator = new SnapshotInterpolator({ bufferTime: 80 });

// 5. Handle Match Lifecycle
net.on('match-start', ({ role, isHost, localId, peerId, isBot, roomCode }) => {
  console.log(`[Netcode] Match Started in Room ${roomCode}!`);
  console.log(`Local ID: ${localId} | Role: ${role} | Bot Match: ${isBot}`);

  // Start your local game loop
  gameEngine.startMatch({ isHost, isBot });
});

// 6. Host: Transmit Authoritative Physics State (20Hz - 60Hz)
function onHostPhysicsTick() {
  if (!net.isHost) return;

  const worldState = {
    t: Date.now(),
    host: { x: playerA.x, y: playerA.y, r: playerA.rotation, hp: playerA.health },
    client: { x: playerB.x, y: playerB.y, r: playerB.rotation, hp: playerB.health }
  };

  // Broadcasts instantly over UDP-like data channel (no head-of-line blocking)
  net.sendState(worldState);
}

// 7. Client: Send Continuous Input Stream (WASD / Joysticks)
function onClientInputChanged(inputState) {
  if (net.isHost) return;
  
  // Sends sampled inputs to the authoritative host
  net.sendInput(inputState);
}

// 8. Client: Receive Host World State & Push to Interpolation Buffer
net.on('state', (serverState) => {
  interpolator.pushSnapshot(serverState.t, {
    opponent: serverState.host
  });
});

// 9. Client: Render Loop with Hermite Smoothing (60 - 144 FPS)
function onRenderFrame() {
  requestAnimationFrame(onRenderFrame);

  if (!net.isHost) {
    const smooth = interpolator.getInterpolated();
    if (smooth.opponent) {
      opponentSprite.x = smooth.opponent.x;
      opponentSprite.y = smooth.opponent.y;
      opponentSprite.rotation = smooth.opponent.r;
    }
  }

  gameEngine.render();
}

// 10. Handle Guaranteed Game Events (Kills, Scoring, Forfeit)
net.on('event', ({ name, data }) => {
  if (name === 'player-scored') {
    ui.displayScoreAlert(data.playerId, data.score);
  }
});

// 11. Handle Opponent Disconnect / Rage-Quit
net.on('peer-disconnect', () => {
  ui.showBanner('Opponent disconnected — Victory by forfeit! 🏆');
  net.disconnect();
});
```

---

## 3. Drop-in Arcade Lobby Features

The built-in `MerebLobby` modal delivers a zero-effort, tactile arcade interface:
- **Instant Quick Play Button**: Matches against any worldwide waiting player or triggers the local bot fallback seamlessly.
- **Create Room Button**: Generates a shareable 4-letter room code (e.g. `K9XP`) and direct invitation URL (`https://yourgame.com/?room=K9XP`).
- **Join Room Input**: Formatted 4-character input field with automated uppercase sanitization.
- **Copy Link Notification**: Integrated clipboard interaction with visual feedback pill.

```javascript
const lobby = new MerebLobby(net, {
  title: '🚀 GALAXY RACERS',
  container: document.getElementById('ui-root'), // Custom DOM target
  autoHideOnStart: true                          // Hides automatically on match-start
});

// Programmatic control if needed
lobby.show();
lobby.hide();
lobby.showError('Room code not found or expired.');
```

---

## 4. Mobile Web & Touch Joysticks

For mobile browser deployments (such as mobile CrazyGames or Poki Web), initialize `TouchControls`:

```javascript
import { TouchControls } from 'mereb-netcode';

const touch = new TouchControls({
  container: document.body,
  onMove: ({ x, y, up, down, left, right }) => {
    // Left virtual joystick: Movement vector [-1.0 to 1.0]
    localPlayer.moveVector.set(x, y);
  },
  onAim: ({ angle, active }) => {
    // Right virtual joystick: Aim angle in radians
    if (active) localPlayer.aimAngle = angle;
  },
  onFire: (isFiring) => {
    // Dedicated action button
    if (isFiring) localPlayer.shoot();
  }
});
```

---

## 5. Summary Checklist

| Requirement | Implementation Step | Verification |
| :--- | :--- | :--- |
| **Client Initialization** | Instantiate `MerebClient` with target edge host. | Check `net.status === 'idle'`. |
| **Match Handshake** | Listen to `match-start` event. | Check assigned `role` and `isHost`. |
| **Simulation Sync** | Broadcast state if host; stream inputs if client. | Verify DataChannel throughput in terminal. |
| **Entity Smoothing** | Feed received snapshots to `SnapshotInterpolator`. | Confirm remote entity does not stutter. |
| **Clean Teardown** | Call `net.disconnect()` on exit or room reset. | Check WebRTC peer connection closes. |

---

> [!TIP]
> Ready to minimize bandwidth by 85%? Learn how to compress your state into tiny binary packets in the [Netcode & Binary Packing Guide](08_NETCODE_BINARY_AND_INTERPOLATION.md).
