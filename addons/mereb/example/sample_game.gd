extends Node2D

## Mereb Godot 4 Sample 2-Player Game
## Demonstrates connecting two Godot nodes over WebRTC with automatic host/client detection.

@onready var net: MerebMultiplayer = $MerebMultiplayer
@onready var my_tank: ColorRect = $MyTank
@onready var opponent_tank: ColorRect = $OpponentTank
@onready var status_label: Label = $StatusLabel

var speed: float = 300.0

func _ready():
	# Connect Mereb signals
	net.match_started.connect(_on_match_started)
	net.state_received.connect(_on_state_received)
	net.input_received.connect(_on_input_received)
	net.latency_updated.connect(_on_latency_updated)
	net.peer_disconnected.connect(_on_peer_disconnected)

	status_label.text = "Searching for opponent..."
	net.quick_play()

func _on_match_started(is_host: bool, role: String, peer_id: String, is_bot: bool):
	var bot_text = " (BOT)" if is_bot else ""
	status_label.text = "Matched as %s vs %s%s" % [role.to_upper(), peer_id, bot_text]
	
	if is_host:
		my_tank.color = Color(0.22, 0.74, 0.97) # Blue
		opponent_tank.color = Color(0.97, 0.44, 0.44) # Red
	else:
		my_tank.color = Color(0.97, 0.44, 0.44)
		opponent_tank.color = Color(0.22, 0.74, 0.97)

func _physics_process(delta):
	# 1. Local movement
	var move_vec = Vector2.ZERO
	if Input.is_action_pressed("ui_right") or Input.is_key_pressed(KEY_D):
		move_vec.x += 1
	if Input.is_action_pressed("ui_left") or Input.is_key_pressed(KEY_A):
		move_vec.x -= 1
	if Input.is_action_pressed("ui_down") or Input.is_key_pressed(KEY_S):
		move_vec.y += 1
	if Input.is_action_pressed("ui_up") or Input.is_key_pressed(KEY_W):
		move_vec.y -= 1

	if move_vec != Vector2.ZERO:
		my_tank.position += move_vec.normalized() * speed * delta

	# 2. Network synchronization
	if net.is_host():
		# Host broadcasts its position to client
		net.send_state({
			"x": my_tank.position.x,
			"y": my_tank.position.y
		})
	else:
		# Client sends its input/position to host
		net.send_input({
			"x": my_tank.position.x,
			"y": my_tank.position.y
		})

func _on_state_received(data):
	if data.has("x") and data.has("y"):
		opponent_tank.position.x = data["x"]
		opponent_tank.position.y = data["y"]

func _on_input_received(data):
	if data.has("x") and data.has("y"):
		opponent_tank.position.x = data["x"]
		opponent_tank.position.y = data["y"]

func _on_latency_updated(ping_ms: int):
	print("Ping: ", ping_ms, "ms")

func _on_peer_disconnected(peer_id: String):
	status_label.text = "Opponent disconnected — You Win!"
