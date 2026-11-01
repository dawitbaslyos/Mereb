# Mereb Manual: Godot 4 Web Integration Guide

> **Version:** 2026.1 LTS &nbsp;|&nbsp; **Verified Stacks:** Godot 4.0, Godot 4.1, Godot 4.2, Godot 4.3 (HTML5 / Web) &nbsp;|&nbsp; [Switch to Scripting API](../api/SCRIPTING_REFERENCE.md)

---

## 1. Overview

Mereb provides an official, zero-dependency addon for **Godot 4** located directly in `addons/mereb/`. It exposes a native GDScript node (`MerebMultiplayer`) that bridges Godot’s Web export with browser WebRTC DataChannels and Cloudflare Workers.

---

## 2. Quick Setup

### Step 1: Copy Addon to Godot Project
Copy the `addons/mereb` directory from this repository into your Godot project's `res://addons/` directory:
```
your-godot-project/
├── addons/
│   └── mereb/
│       ├── plugin.cfg
│       ├── mereb_multiplayer.gd
│       ├── mereb.umd.js
│       └── README.md
```

### Step 2: Enable Plugin in Project Settings
1. In Godot 4, open **Project -> Project Settings**.
2. Select the **Plugins** tab.
3. Toggle the status of **Mereb Multiplayer** to **Enabled**.

### Step 3: Embed `mereb.umd.js` in Export Template
In your HTML5 Web Export settings:
1. Go to **Project -> Export -> Web**.
2. Set your custom HTML shell to include:
   ```html
   <script src="mereb.umd.js"></script>
   ```

---

## 3. GDScript Implementation

Add the `MerebMultiplayer` node to your main game scene or register it as an Autoload Singleton in **Project Settings -> Autoload**:

```gdscript
extends Node2D

@onready var net: MerebMultiplayer = $MerebMultiplayer
@onready var local_player = $LocalPlayer
@onready var remote_enemy = $RemoteEnemy

var is_match_active: bool = false
var target_enemy_pos: Vector2 = Vector2.ZERO

func _ready() -> void:
    # 1. Connect Netcode Signals
    net.match_started.connect(_on_match_started)
    net.state_received.connect(_on_state_received)
    net.input_received.connect(_on_input_received)
    net.quality_updated.connect(_on_quality_updated)
    net.peer_disconnected.connect(_on_peer_disconnected)

    # 2. Configure Signaling Server
    net.connect_to_server("mereb-signaling.dawitbaslyos.workers.dev")

    # 3. Enter Matchmaking (with automatic 8-second bot fallback)
    net.quick_play()

func _on_match_started(is_host: bool, role: String, peer_id: String, is_bot: bool) -> void:
    is_match_active = true
    print("Match active! Role: %s | Host: %s | Bot Match: %s" % [role, is_host, is_bot])

func _physics_process(delta: float) -> void:
    if not is_match_active:
        return

    if net.is_host():
        # Authoritative Host: Broadcast full world snapshot (20-60Hz)
        var world_state = {
            "hx": local_player.position.x,
            "hy": local_player.position.y,
            "hp": local_player.health
        }
        net.send_state(world_state)
    else:
        # Client: Stream local input actions
        var input_payload = {
            "up": Input.is_action_pressed("ui_up"),
            "down": Input.is_action_pressed("ui_down"),
            "left": Input.is_action_pressed("ui_left"),
            "right": Input.is_action_pressed("ui_right")
        }
        net.send_input(input_payload)

func _process(delta: float) -> void:
    # Smooth client-side interpolation of opponent position
    if not net.is_host() and is_match_active:
        remote_enemy.position = remote_enemy.position.lerp(target_enemy_pos, delta * 20.0)

func _on_state_received(state_data: Dictionary) -> void:
    # Client receives authoritative state from host
    target_enemy_pos = Vector2(state_data["hx"], state_data["hy"])

func _on_input_received(client_input: Dictionary) -> void:
    # Host applies client input to remote entity simulation
    var move_dir = Vector2.ZERO
    if client_input.get("up", false): move_dir.y -= 1
    if client_input.get("down", false): move_dir.y += 1
    if client_input.get("left", false): move_dir.x -= 1
    if client_input.get("right", false): move_dir.x += 1
    remote_enemy.position += move_dir.normalized() * 200.0 * get_physics_process_delta_time()

func _on_quality_updated(stats: Dictionary) -> void:
    $HUD/PingLabel.text = "Ping: %d ms (%s)" % [stats["ping"], stats["rating"]]

func _on_peer_disconnected(peer_id: String) -> void:
    print("Opponent disconnected — You win by forfeit!")
    is_match_active = false
```

---

## 4. Godot Signals Reference

| Signal | Parameters | Triggered When |
| :--- | :--- | :--- |
| `match_started` | `(is_host: bool, role: String, peer_id: String, is_bot: bool)` | P2P WebRTC data channels open or bot activates. |
| `state_received` | `(data: Dictionary)` | Client receives authoritative 60Hz world snapshot. |
| `input_received` | `(data: Dictionary)` | Host receives client input stream. |
| `event_received` | `(event_name: String, data: Dictionary)` | Guaranteed discrete event arrives (kill, score). |
| `quality_updated` | `(stats: Dictionary)` | RTT ping, jitter, and packet loss are recalculated. |
| `peer_disconnected` | `(peer_id: String)` | Opponent closes tab or drops connection. |

---

> [!TIP]
> Ready to review the web & React integration? Visit the [Web & React Guide](07_WEB_AND_REACT_INTEGRATION.md).
