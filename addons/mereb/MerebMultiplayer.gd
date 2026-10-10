@icon("icon.svg")
class_name MerebMultiplayer
extends Node

## Mereb Multiplayer SDK - Official Godot 4 Web Node
## Enables zero-cost P2P WebRTC multiplayer & matchmaking for Godot HTML5 exports.

signal match_started(is_host: bool, role: String, peer_id: String, is_bot: bool)
signal state_received(state_data: Variant)
signal input_received(input_data: Variant)
signal binary_received(bytes: PackedByteArray)
signal event_received(event_name: String, event_data: Variant)
signal peer_disconnected(peer_id: String)
signal room_created(room_code: String, share_url: String)
signal room_joined(room_code: String)
signal latency_updated(ping_ms: int)
signal quality_updated(quality_stats: Dictionary)
signal error_occurred(message: String)

@export_group("Mereb Network Settings")
## URL of the signaling server (e.g., localhost:1999 or your-app.partykit.dev)
@export var host_url: String = "localhost:1999"

## Timeout before falling back to local bot match in Quick Play (seconds)
@export var bot_timeout_seconds: float = 8.0

## Automatically join room if ?room=CODE is in the URL (Poki/CrazyGames invites)
@export var auto_join_from_url: bool = true

## Automatically detect and connect PokiSDK or CrazyGames SDK
@export var auto_portal_detect: bool = true

var _js_client = null
var _callbacks: Array = []
var _is_host: bool = false
var _peer_id: String = ""
var _room_code: String = ""
var _latency: int = 0

func _ready():
	if not OS.has_feature("web"):
		print("[MerebMultiplayer] Running outside web environment (desktop/editor). Network disabled.")
		return

	_initialize_js_bridge()

func _initialize_js_bridge():
	var window = JavaScriptBridge.get_interface("window")
	if not window or not window.Mereb:
		push_warning("[MerebMultiplayer] window.Mereb not found! Ensure mereb.umd.js is included in your HTML shell.")
		return

	var options = JavaScriptBridge.create_object("Object")
	options.host = host_url
	options.botTimeoutMs = int(bot_timeout_seconds * 1000.0)
	options.autoJoinFromUrl = auto_join_from_url

	_js_client = JavaScriptBridge.create_object("Mereb.MerebClient", options)

	if auto_portal_detect and _js_client.portal:
		_js_client.usePortal("auto")

	_bind_event("match-start", _on_js_match_start)
	_bind_event("state", _on_js_state)
	_bind_event("input", _on_js_input)
	_bind_event("event", _on_js_event)
	_bind_event("peer-disconnect", _on_js_peer_disconnect)
	_bind_event("room-created", _on_js_room_created)
	_bind_event("room-joined", _on_js_room_joined)
	_bind_event("latency", _on_js_latency)
	_bind_event("quality", _on_js_quality)
	_bind_event("error", _on_js_error)

func _bind_event(event_name: String, callable: Callable):
	if not _js_client: return
	var cb = JavaScriptBridge.create_callback(callable)
	_callbacks.append(cb)
	_js_client.on(event_name, cb)

# --- Public API ---

## Enter global matchmaking with automatic bot fallback
func quick_play():
	if _js_client:
		_js_client.quickPlay()

## Create a private room with a 4-letter code and shareable URL
func create_room():
	if _js_client:
		_js_client.createRoom()

## Join an existing room code
func join_room(code: String):
	if _js_client:
		_js_client.joinRoom(code.strip_edges().to_upper())

## Broadcast authoritative game state to peer (unreliable, 60Hz)
func send_state(state_data: Variant):
	if _js_client:
		if typeof(state_data) == TYPE_DICTIONARY or typeof(state_data) == TYPE_ARRAY:
			var json_str = JSON.stringify(state_data)
			_js_client.sendState(JSON.parse_string(json_str))
		else:
			_js_client.sendState(state_data)

## Send client input to host (unreliable)
func send_input(input_data: Variant):
	if _js_client:
		if typeof(input_data) == TYPE_DICTIONARY:
			var json_str = JSON.stringify(input_data)
			_js_client.sendInput(JSON.parse_string(json_str))
		else:
			_js_client.sendInput(input_data)

## Send guaranteed event over reliable channel (score, chat, round end)
func send_event(event_name: String, event_data: Dictionary = {}):
	if _js_client:
		var json_str = JSON.stringify(event_data)
		_js_client.sendEvent(event_name, JSON.parse_string(json_str))

## Disconnect from active room and reset state
func disconnect_network():
	if _js_client:
		_js_client.disconnect()
	_is_host = false
	_peer_id = ""
	_room_code = ""

func is_host() -> bool:
	return _is_host

func get_latency() -> int:
	return _latency

func get_peer_id() -> String:
	return _peer_id

func get_room_code() -> String:
	return _room_code

# --- JS Event Callbacks ---

func _on_js_match_start(args):
	var detail = args[0]
	_is_host = bool(detail.isHost)
	_peer_id = str(detail.peerId)
	var role = str(detail.role)
	var is_bot = bool(detail.isBot)
	match_started.emit(_is_host, role, _peer_id, is_bot)

func _on_js_state(args):
	state_received.emit(args[0])

func _on_js_input(args):
	input_received.emit(args[0])

func _on_js_event(args):
	var msg = args[0]
	event_received.emit(str(msg.name), msg.data)

func _on_js_peer_disconnect(args):
	var detail = args[0]
	peer_disconnected.emit(str(detail.peerId))

func _on_js_room_created(args):
	var detail = args[0]
	_room_code = str(detail.roomCode)
	room_created.emit(_room_code, str(detail.shareUrl))

func _on_js_room_joined(args):
	var detail = args[0]
	_room_code = str(detail.roomCode)
	room_joined.emit(_room_code)

func _on_js_latency(args):
	var detail = args[0]
	_latency = int(detail.latency)
	latency_updated.emit(_latency)

func _on_js_quality(args):
	var detail = args[0]
	var dict = {
		"ping": int(detail.ping),
		"jitter": int(detail.jitter),
		"packetLoss": int(detail.packetLoss),
		"rating": str(detail.rating)
	}
	quality_updated.emit(dict)

func _on_js_error(args):
	var detail = args[0]
	error_occurred.emit(str(detail.message))
