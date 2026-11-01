# ⚔️ Mereb Documentation Hub

Welcome to the official technical documentation for **Mereb** — the zero-cost, serverless WebRTC P2P multiplayer netcode and edge matchmaking SDK for web, indie, and 3D games.

---

## 📖 Mereb Manual

| Chapter | Topic | Description |
| :--- | :--- | :--- |
| **01** | [Architecture & Core Engine](manual/01_OVERVIEW_AND_ARCHITECTURE.md) | WebRTC P2P mesh topology, Cloudflare edge signaling, and dual DataChannels. |
| **02** | [Quickstart & Setup](manual/02_QUICKSTART_AND_SETUP.md) | 5-minute setup, drop-in arcade lobby, and core match lifecycle loop. |
| **03** | [Why Mereb is Better (Benchmarks)](manual/03_WHY_MEREB_IS_BETTER_BENCHMARKS.md) | Comprehensive side-by-side comparison against Photon, Hathora, Agones, and GameLift. |
| **04** | [Configuration & Cloud Deployment](manual/04_CONFIGURATION_AND_CLOUD_SKILLS.md) | Cloudflare Workers, Durable Objects SQLite, PartyKit, TURN pools, and Polar billing. |
| **05** | [Unity 3D WebGL Integration](manual/05_UNITY_3D_INTEGRATION_GUIDE.md) | WebGL `.jslib` bridge, `MerebNetworkManager.cs`, and state synchronization in Unity C#. |
| **06** | [Godot 4 Integration](manual/06_GODOT_4_INTEGRATION_GUIDE.md) | GDScript addon (`addons/mereb/`), HTML5 export template, and 2D/3D state sync. |
| **07** | [Web, Three.js & React](manual/07_WEB_AND_REACT_INTEGRATION.md) | Three.js 60Hz physics, Phaser 3 arcade loops, and the `useMereb()` React hook. |
| **08** | [Netcode & Binary Packing](manual/08_NETCODE_BINARY_AND_INTERPOLATION.md) | `defineSchema`, `BinaryWriter`, and cubic Hermite snapshot interpolation. |
| **09** | [Portal Hooks (Poki & CrazyGames)](manual/09_PORTAL_HOOKS_POKI_CRAZYGAMES.md) | Preventing WebRTC socket drops during rewarded ads and commercial breaks. |
| **10** | [Troubleshooting & Diagnostics](manual/10_TROUBLESHOOTING_AND_FAQ.md) | Strict firewall bypass, in-game console (`MerebTerminal`), and production checklist. |

---

## ⚡ Scripting API Reference

* [Complete Scripting Reference (Unity API Style)](api/SCRIPTING_REFERENCE.md)
  * `MerebClient`
  * `MerebLobby`
  * `BinaryWriter` & `BinaryReader`
  * `defineSchema`
  * `SnapshotInterpolator`
  * `TouchControls`
  * `MerebTerminal`
  * `PortalManager`
  * `TurnPool` & `NetworkQuality`
