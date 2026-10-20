# ⚔️ Mereb — Multiplayer Netcode & Matchmaking SDK

[![npm version](https://img.shields.io/npm/v/mereb-netcode.svg?color=38bdf8)](https://www.npmjs.com/package/mereb-netcode)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Bundle Size](https://img.shields.io/badge/bundle-13_kB_gzip-blue.svg)](https://unpkg.com/mereb-netcode/dist-sdk/mereb.es.js)
[![WebRTC P2P](https://img.shields.io/badge/WebRTC-DataChannels-orange.svg)]()
[![Godot 4](https://img.shields.io/badge/Godot_4-Web_Addon-478cbf.svg)](./addons/mereb)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-Signaling-F38020.svg)](./cloudflare)

> **Zero-cost, serverless WebRTC P2P multiplayer netcode & matchmaking SDK for web & indie games** (Three.js, Godot 4, React, Phaser, Poki, CrazyGames).

Eliminate expensive dedicated game servers ($100s/mo). **Mereb** routes gameplay directly peer-to-peer over low-latency WebRTC DataChannels while offloading matchmaking to serverless edge workers ($0/mo on Cloudflare / PartyKit).

---

## ⚡ Features

* 🌐 **Serverless P2P Architecture** — 60Hz gameplay streams directly between players over WebRTC UDP data channels. Zero server computing costs.
* 📦 **Binary Packing & Compression** — Built-in `BinaryWriter` / `BinaryReader` packs full game state into tiny ~35–50 byte `ArrayBuffer` packets (85% bandwidth reduction vs JSON).
* 🎯 **Hermite Snapshot Interpolation** — `SnapshotInterpolator` eliminates jitter and delivers buttery 60/120fps remote entity movement.
* 🤖 **Smart Bot Fallback** — Automatic 8-second matchmaking timeout pairs waiting players with local bots so queues never feel empty.
* ⚛️ **React Hook** — `useMereb()` hook for reactive lobby, match status, and netcode controls in React.
* 🛡️ **Poki & CrazyGames Portal Hooks** — `PortalManager` prevents WebRTC socket drops during rewarded breaks and commercial ads.
* 🕹️ **Godot 4 Addon** — Includes a ready-to-use GDScript wrapper (`addons/mereb/`) for exporting HTML5 games from Godot.
* 🎨 **Drop-in Arcade Lobby** — Optional 3D tactile UI with 4-letter room codes, shareable invite links, and Quick Play buttons.
* 📶 **Live Network Quality Probe** — Real-time ping (RTT), jitter, and packet loss monitoring with automatic TURN fallback.

---

## 📦 Installation

### NPM
```bash
npm install mereb-netcode
```

### CDN / Direct Script Tag
```html
<script src="https://unpkg.com/mereb-netcode/dist-sdk/mereb.umd.js"></script>
```

---

## 🚀 30-Second Quick Start

```javascript
import { MerebClient, MerebLobby } from 'mereb';

// 1. Initialize SDK
const net = new MerebClient({
  host: 'localhost:1999', // or your-project.partykit.dev in production
  botTimeoutMs: 8000,     // start bot if no player joins in 8s
  autoJoinFromUrl: true   // auto-connects if ?room=XXXX is in URL
});

// 2. (Optional) Mount Drop-in Arcade Lobby
const lobby = new MerebLobby(net, { title: '⚔️ ARENA BATTLE' });

// 3. Handle Match Lifecycle
net.on('match-start', ({ role, isHost, localId, peerId, isBot }) => {
  console.log(`Match started! Role: ${role}, Opponent: ${peerId}`);

  if (isHost) {
    // Host: broadcast authoritative 60Hz game state
    game.onTick = (state) => net.sendState(state);
  } else {
    // Client: stream inputs to host
    input.onInput = (keys) => net.sendInput(keys);
  }
});

// 4. Receive State & Events
net.on('state', (state) => game.applyState(state));
net.on('input', (input) => game.applyInput(input));
net.on('event', ({ name, data }) => {
  if (name === 'player-scored') sound.playGoal();
});
net.on('peer-disconnect', () => {
  ui.showToast('Opponent forfeited — You Win! 🏆');
});
```

---

## 💎 Binary Packing (85% Bandwidth Savings)

Pack your game state into a tiny 40-byte binary packet:

```javascript
import { BinaryWriter, BinaryReader } from 'mereb';

// Host: Encode
const writer = new BinaryWriter();
writer
  .writeUint8(1)               // packet type
  .writeFixed16(player.x, 100) // 2 decimals
  .writeFixed16(player.z, 100)
  .writeUint8(player.health)
  .writeBoolean(player.isShielded);

net.sendBinary(writer.getView());

// Client: Decode
net.on('binary', (arrayBuffer) => {
  const reader = new BinaryReader(arrayBuffer);
  const type = reader.readUint8();
  const x = reader.readFixed16(100);
  const z = reader.readFixed16(100);
  const health = reader.readUint8();
  const isShielded = reader.readBoolean();
});
```

---

## 🎮 Godot 4 Web Export

Copy the [`addons/mereb/`](./addons/mereb/) directory to your Godot 4 project:

```gdscript
extends Node

@onready var net = MerebMultiplayer.new()

func _ready():
    add_child(net)
    net.match_started.connect(_on_match_started)
    net.state_received.connect(_on_state_received)
    net.connect_to_server("your-project.partykit.dev")
    net.quick_play()

func _on_match_started(role, peer_id, is_bot):
    print("Match started! Role: ", role)

func _on_state_received(data):
    # Update remote player position
    $RemotePlayer.position = Vector2(data.x, data.y)
```

---

## ⚛️ React Hook (`useMereb`)

Drop multiplayer into any React web game with a single hook:

```jsx
import { useMereb } from 'mereb-netcode/react';

function GameLobby() {
  const { status, roomCode, isHost, quality, createRoom, joinRoom, quickPlay } = useMereb({
    host: 'mereb-signaling.dawitbaslyos.workers.dev'
  });

  return (
    <div>
      <div>Status: {status} ({quality.ping}ms)</div>
      {roomCode && <h2>Room: {roomCode}</h2>}
      <button onClick={createRoom}>Create Room</button>
      <button onClick={quickPlay}>Quick Play</button>
    </div>
  );
}
```

---

## 🌍 Zero-Cost Cloudflare Workers Signaling

Deploy your own worldwide serverless signaling & matchmaking server in **60 seconds** on Cloudflare ($0/month):

```bash
# Deploy to Cloudflare Workers (300+ edge locations)
cd cloudflare
npx wrangler deploy
```

Then point `MerebClient` to your worker:
```javascript
const net = new MerebClient({
  host: 'mereb-signaling.<your-subdomain>.workers.dev'
});
```

See the [Cloudflare Deployment Guide](./cloudflare/README.md) for full instructions.

---

## 🎮 Framework Examples & Starters

* [👾 Phaser 3 Space Duel Example](./examples/phaser/index.html)
* [🧊 Minimal Three.js P2P Example](./examples/threejs-minimal/index.html)
* [🕹️ Godot 4 Addon & Sample Game](./addons/mereb/README.md)
* [⚔️ Live 3D Tank Arena Demo](./src/game/)

---

## 📖 Detailed Guides

* [Full Architecture & API Reference](./MEREB_SDK_GUIDE.md)
* [Godot 4 Integration Guide](./addons/mereb/README.md)
* [Cloudflare Workers Deployment](./cloudflare/README.md)

---

## 📄 License

MIT © [Dawit Baslyos](https://github.com/dawitbaslyos)

