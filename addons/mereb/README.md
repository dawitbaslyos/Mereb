# 🎮 Mereb Multiplayer Addon for Godot 4

Official Godot 4 addon for **Mereb** — the zero-cost P2P WebRTC multiplayer framework designed for web game portals (**Poki**, **CrazyGames**, mobile web).

---

## 🚀 Quick Setup (2 Minutes)

### 1. Enable the Addon in Godot 4
1. Copy the `addons/mereb` folder into your Godot project's `res://addons/` directory.
2. In Godot, go to **Project -> Project Settings -> Plugins** and enable **Mereb Multiplayer**.

### 2. Include `mereb.umd.js` in your HTML Export Shell
In your Godot HTML5 export template (or in your export's `index.html`), add:
```html
<script src="mereb.umd.js"></script>
```
*(You can find `mereb.umd.js` right inside `addons/mereb/`)*.

---

## 🕹️ GDScript Example

Add a `MerebMultiplayer` node to your scene or autoload it as a singleton:

```gdscript
extends Node2D

@onready var net: MerebMultiplayer = $MerebMultiplayer

func _ready():
    # Connect signals
    net.match_started.connect(_on_match_started)
    net.state_received.connect(_on_state_received)
    net.input_received.connect(_on_input_received)
    net.peer_disconnected.connect(_on_peer_disconnected)
    net.quality_updated.connect(_on_quality_updated)

    # Start matchmaking (auto-falls back to bot after 8 seconds)
    net.quick_play()

func _on_match_started(is_host: bool, role: String, peer_id: String, is_bot: bool):
    print("Match started! IsHost: ", is_host, " Role: ", role, " IsBot: ", is_bot)

func _physics_process(delta):
    if net.is_host():
        # Host broadcasts authoritative world state
        var world_state = {
            "x": $Player.position.x,
            "y": $Player.position.y
        }
        net.send_state(world_state)
    else:
        # Client sends input
        var my_input = {
            "up": Input.is_action_pressed("ui_up"),
            "down": Input.is_action_pressed("ui_down")
        }
        net.send_input(my_input)

func _on_state_received(data):
    # Client receives host state
    $Enemy.position.x = data["x"]
    $Enemy.position.y = data["y"]

func _on_input_received(input_data):
    # Host applies client input
    pass

func _on_quality_updated(stats: Dictionary):
    print("Ping: %d ms | Jitter: %d ms | Loss: %d%% | Rating: %s" % [
        stats.ping, stats.jitter, stats.packetLoss, stats.rating
    ])

func _on_peer_disconnected(peer_id: String):
    print("Opponent left — You Win by forfeit!")
```

---

## 🌐 Web Portal Integration (Poki & CrazyGames)
The node automatically detects if PokiSDK or CrazyGames SDK is present on the page (`auto_portal_detect = true`):
- Room codes automatically generate Poki `shareableURL` or CrazyGames `inviteLink`.
- Commercial breaks automatically notify your game.
