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

## 🎮 Godot 4 Web Export Integration

Because Mereb exposes `window.Mereb` in UMD format (`dist-sdk/mereb.umd.js`), you can drive multiplayer directly inside **Godot 4 HTML5 exports** using GDScript's `JavaScriptBridge`!

### 1. In your Godot HTML shell (`index.html`)
Add the script tag before your game starts:
```html
<script src="mereb.umd.js"></script>
```

### 2. In GDScript (`NetworkManager.gd`)
```gdscript
extends Node

var mereb_client = null
var is_host: bool = false

func _ready():
    if not OS.has_feature("web"):
        print("Mereb is running in Web exports")
        return

    var window = JavaScriptBridge.get_interface("window")
    var Mereb = window.Mereb

    # Create MerebClient
    var options = JavaScriptBridge.create_object("Object")
    options.host = "localhost:1999" # Or your deployed PartyKit host
    options.botTimeoutMs = 8000
    options.autoJoinFromUrl = true

    mereb_client = JavaScriptBridge.create_object("Mereb.MerebClient", options)

    # Listen for match-start
    var on_match_start = JavaScriptBridge.create_callback(_on_match_start)
    mereb_client.on("match-start", on_match_start)

    # Listen for state
    var on_state = JavaScriptBridge.create_callback(_on_state_received)
    mereb_client.on("state", on_state)

func quick_play():
    if mereb_client:
        mereb_client.quickPlay()

func create_room():
    if mereb_client:
        mereb_client.createRoom()

func join_room(code: String):
    if mereb_client:
        mereb_client.joinRoom(code)

func send_state(state_json: String):
    if mereb_client:
        mereb_client.sendState(state_json)

func send_input(input_json: String):
    if mereb_client:
        mereb_client.sendInput(input_json)

func _on_match_start(args):
    var detail = args[0]
    is_host = detail.isHost
    print("Godot: Match started! IsHost: ", is_host)

func _on_state_received(args):
    var state = args[0]
    # Apply state to your Godot nodes
```

---

## 📚 MerebClient API Reference

### Constructor Options
```javascript
new MerebClient({
  host: 'localhost:1999',  // Signaling server URL
  botTimeoutMs: 8000,      // Quick play timeout before triggering local bot (default: 8000)
  autoJoinFromUrl: true,   // Auto join room from ?room=XXXX query parameter (default: true)
  iceServers: [...]        // Custom STUN/TURN servers (defaults to Google + Cloudflare + OpenRelay)
})
```

### Methods
| Method | Description |
| :--- | :--- |
| `createRoom()` | Creates a new room and returns `{ roomCode, shareUrl }`. |
| `joinRoom(code)` | Joins an existing room with a 4-letter code. |
| `quickPlay()` | Enters global matchmaking queue with automatic bot fallback. |
| `sendState(state)` | Broadcasts authoritative state over unordered, unreliable channel (UDP-like). |
| `sendInput(input)` | Client sends user input to host over unordered channel. |
| `sendEvent(name, data)` | Sends guaranteed, ordered event over reliable channel (scores, chat, game over). |
| `disconnect()` | Cleans up WebRTC and WebSocket connections. |

### Events (`net.on(event, handler)`)
| Event | Payload | Triggered When |
| :--- | :--- | :--- |
| `match-start` | `{ role, localId, peerId, isBot, isHost }` | P2P connection opens or bot spawns. |
| `state` | `(serverState)` | Client receives high-frequency game state. |
| `input` | `(clientInput)` | Host receives high-frequency player inputs. |
| `event` | `{ name, data }` | Either peer sends reliable event via `sendEvent()`. |
| `peer-disconnect` | `{ peerId, reason }` | Opponent rage-quits or loses connection. |
| `latency` | `{ latency }` | Ping round-trip measurement (updated every 2s). |
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
