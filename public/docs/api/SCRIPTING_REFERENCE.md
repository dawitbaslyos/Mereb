# Mereb Scripting Reference (Unity API Style)

> **Namespace:** `Mereb.Netcode` &nbsp;|&nbsp; **Assembly:** `mereb-netcode` (v2026.1 LTS) &nbsp;|&nbsp; [Switch to Manual](../manual/01_OVERVIEW_AND_ARCHITECTURE.md)

---

## Class Index

| Class | Description |
| :--- | :--- |
| [`MerebClient`](#merebclient) | Primary multiplayer client managing signaling, WebRTC DataChannels, room lifecycles, and network health. |
| [`MerebLobby`](#mereblobby) | Drop-in arcade UI lobby with 3D tactile buttons, Quick Play matchmaking, and 4-letter room codes. |
| [`BinaryWriter`](#binarywriter) | Ultra-fast binary stream encoder with zero-allocation buffers and fixed-point arithmetic support. |
| [`BinaryReader`](#binaryreader) | High-speed binary stream decoder reading primitives, fixed-point values, and booleans. |
| [`defineSchema`](#defineschema) | Declarative binary schema compiler compressing game state objects into ~30-byte ArrayBuffers. |
| [`SnapshotInterpolator`](#snapshotinterpolator) | Cubic Hermite spline and shortest-angle spherical slerp interpolation buffer. |
| [`TouchControls`](#touchcontrols) | Mobile web touch controller injecting floating dual virtual joysticks and action buttons. |
| [`MerebTerminal`](#merebterminal) | In-game developer diagnostic HUD console with latency simulation, packet loss injection, and telemetry. |
| [`PortalManager`](#portalmanager) | Web game portal adapter bridging official Poki SDK and CrazyGames SDK lifecycle events. |
| [`TurnPool`](#turnpool) | Dynamic STUN and RFC 5766 TLS TURN relay provider for strict firewall traversal. |
| [`NetworkQuality`](#networkquality) | Live network health probe calculating round-trip ping, jitter, and packet loss rating. |

---

## `MerebClient`

```csharp
// Scripting API Signature
public class MerebClient : EventEmitter, IDisposable
```

### Description
The core orchestrator of the Mereb multiplayer system. `MerebClient` manages the signaling handshake with the Cloudflare edge worker, establishes the direct WebRTC peer-to-peer data channels, measures live latency, and manages smart bot fallbacks.

### Constructor
```typescript
new MerebClient(options?: MerebClientOptions)
```

#### Parameters
* `options.host` *(string)*: Signaling server URL (e.g. `'mereb-signaling.workers.dev'`).
* `options.botTimeoutMs` *(number)*: Milliseconds to wait in matchmaking before activating the local bot. Default: `8000`. Set to `0` to disable bot fallback.
* `options.autoJoinFromUrl` *(boolean)*: When `true`, automatically parses `?room=XXXX` query parameters on initialization. Default: `true`.
* `options.stunServers` *(RTCIceServer[])*: Custom STUN configuration.
* `options.turnServers` *(RTCIceServer[])*: Custom TURN relays.
* `options.portal` *('poki' | 'crazygames' | 'auto')*: Portal mode.

### Properties
| Property | Type | Description |
| :--- | :--- | :--- |
| `localId` | `string \| null` | Unique identifier assigned to this client instance. |
| `peerId` | `string \| null` | Identifier of the currently connected opponent peer. |
| `role` | `'host' \| 'client' \| null` | Match authority role. |
| `roomCode` | `string \| null` | Active 4-letter room code (e.g. `K9XP`). |
| `isHost` | `boolean` *(readonly)* | `true` if this peer is the authoritative match host. |
| `isBot` | `boolean` *(readonly)* | `true` if currently playing against an offline bot fallback. |
| `status` | `string` | Connection status: `'idle'`, `'connecting'`, `'in_lobby'`, `'matching'`, `'connected'`, `'disconnected'`. |
| `stats` | `NetworkQualityStats` | Live connection metrics: `{ ping, jitter, packetLoss, rating }`. |
| `portal` | `PortalManager` | Web game portal manager instance. |

### Methods
| Method | Returns | Description |
| :--- | :--- | :--- |
| `createRoom()` | `Promise<string>` | Generates a new 4-letter room as host and begins waiting for a peer. |
| `joinRoom(code: string)` | `Promise<void>` | Connects to an existing room using a 4-letter code. |
| `quickPlay()` | `Promise<void>` | Enters the global matchmaking pool with automatic 8-second bot fallback. |
| `sendState(state: any)` | `void` | Transmits 60Hz world snapshot over the unordered, unreliable UDP data channel. |
| `sendInput(input: any)` | `void` | Transmits continuous player inputs from client to authoritative host. |
| `sendBinary(data: ArrayBufferView)` | `void` | Transmits raw binary buffer over UDP data channel with zero JSON overhead. |
| `sendEvent(name: string, data?: any)` | `void` | Sends a guaranteed, ordered event over the reliable channel (kills, scores). |
| `usePortal(type: string, sdk: any)` | `void` | Hooks the official Poki or CrazyGames SDK instance into the client. |
| `getQuality()` | `NetworkQualityStats` | Returns current ping (ms), jitter, packet loss %, and rating string. |
| `disconnect()` | `void` | Closes active WebRTC DataChannels and terminates the signaling WebSocket. |

### Events (`net.on(event, handler)`)
| Event Name | Callback Payload | Description |
| :--- | :--- | :--- |
| `'match-start'` | `MatchStartEvent` | Dispatched when P2P channels open or bot activates. |
| `'state'` | `(serverState: any)` | Dispatched on client when a 60Hz state snapshot arrives. |
| `'binary'` | `(arrayBuffer: ArrayBuffer)` | Dispatched when a raw binary packet arrives over UDP. |
| `'input'` | `(clientInput: any)` | Dispatched on host when remote player input arrives. |
| `'event'` | `ReliableGameEvent` | Dispatched when a guaranteed event is delivered (`sendEvent`). |
| `'quality'` | `NetworkQualityStats` | Dispatched when latency or packet health shifts. |
| `'peer-disconnect'` | `()` | Dispatched when the opponent forfeits or disconnects. |
| `'status-change'` | `(status: string)` | Dispatched whenever the connection state mutates. |

---

## `defineSchema`

```csharp
// Scripting API Signature
public static Schema defineSchema(Dictionary<string, SchemaFieldType> fieldDefinitions)
```

### Description
Generates a strongly-typed binary serializer and deserializer for high-frequency game states. Replaces heavy JSON strings with ~30-byte contiguous binary packets.

### Supported Field Types
* `'fixed16'`: Signed 16-bit fixed point with precision 100 (range: -327.68 to +327.67, 2 bytes).
* `'uint8'`: Unsigned 8-bit integer (range: 0 to 255, 1 byte).
* `'int8'`: Signed 8-bit integer (range: -128 to 127, 1 byte).
* `'uint16'`: Unsigned 16-bit integer (range: 0 to 65535, 2 bytes).
* `'uint32'`: Unsigned 32-bit integer (range: 0 to 4,294,967,295, 4 bytes).
* `'float32'`: IEEE 754 32-bit floating point (4 bytes).
* `'boolean'`: 1-bit boolean flag.
* `'string'`: UTF-8 variable length string with length header.

### Methods
* `encode(data: object): Uint8Array`: Encodes object into binary view.
* `decode(buffer: ArrayBuffer): object`: Decodes binary packet back into object.

---

## `SnapshotInterpolator`

```csharp
// Scripting API Signature
public class SnapshotInterpolator
```

### Description
Implements Hermite spline interpolation and spherical slerp rotation smoothing to convert discrete 20Hz network ticks into silky 60/120/144 FPS screen updates.

### Methods
* `pushSnapshot(timestamp: number, entities: Record<string, any>): void`: Ingests an incoming network state snapshot.
* `getInterpolated(renderTime?: number): Record<string, any>`: Evaluates interpolated entity positions at the current render frame.
* `clear(): void`: Flushes the snapshot ring buffer.

---

## `BinaryWriter` & `BinaryReader`

```csharp
// Scripting API Signatures
public class BinaryWriter
public class BinaryReader
```

### `BinaryWriter` Methods
* `writeUint8(val: number): this`
* `writeInt8(val: number): this`
* `writeUint16(val: number): this`
* `writeInt16(val: number): this`
* `writeUint32(val: number): this`
* `writeFloat32(val: number): this`
* `writeFixed16(val: number, precision?: number): this` (Multiplier defaults to 100).
* `writeBoolean(val: boolean): this`
* `writeString(str: string): this`
* `getView(): Uint8Array`
* `getBuffer(): ArrayBuffer`

### `BinaryReader` Methods
* `readUint8(): number`
* `readInt8(): number`
* `readUint16(): number`
* `readInt16(): number`
* `readUint32(): number`
* `readFloat32(): number`
* `readFixed16(precision?: number): number`
* `readBoolean(): boolean`
* `readString(): string`

---

## `TouchControls`

```csharp
// Scripting API Signature
public class TouchControls
```

### Description
Creates high-performance dual virtual touch joysticks for mobile web platforms.

### Options
* `container`: Parent DOM node (defaults to `document.body`).
* `onMove`: Callback with `({ x, y, up, down, left, right })`.
* `onAim`: Callback with `({ angle, active })`.
* `onFire`: Callback with `(isFiring: boolean)`.

---

## `MerebTerminal`

```csharp
// Scripting API Signature
public class MerebTerminal
```

### Description
In-game developer terminal overlay toggled by pressing the backtick (`` ` ``) key or tapping the floating HUD badge. Supports simulated network lag, packet drop injection, and entity inspection.

---

## See Also
* [Manual: Architecture Overview](../manual/01_OVERVIEW_AND_ARCHITECTURE.md)
* [Manual: Netcode & Binary Packing](../manual/08_NETCODE_BINARY_AND_INTERPOLATION.md)
* [Manual: Unity 3D Integration Guide](../manual/05_UNITY_3D_INTEGRATION_GUIDE.md)
