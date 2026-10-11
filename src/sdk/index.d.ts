/**
 * Mereb Multiplayer Game SDK
 * Reusable WebRTC P2P Multiplayer & Matchmaking Framework for Web & Indie Games.
 */

export interface NetworkQualityStats {
  ping: number;
  jitter: number;
  packetLoss: number;
  rating: 'great' | 'good' | 'poor' | 'bad' | 'offline';
}

export interface MatchStartEvent {
  role: 'host' | 'client';
  localId: string;
  peerId: string;
  isBot: boolean;
  isHost: boolean;
  roomCode: string;
}

export interface ReliableGameEvent<T = any> {
  name: string;
  data: T;
  timestamp?: number;
}

export interface MerebClientOptions {
  /** PartyKit or Cloudflare Workers signaling host URL (e.g. 'localhost:1999' or 'my-project.partykit.dev') */
  host?: string;
  /** Timeout in ms before falling back to local offline bot (defaults to 8000ms, 0 disables bot) */
  botTimeoutMs?: number;
  /** If true, automatically extracts ?room=XXXX from URL query parameters and joins room on connect */
  autoJoinFromUrl?: boolean;
  /** Custom STUN servers list */
  stunServers?: RTCIceServer[];
  /** Custom TURN servers list for restricted NATs / mobile cellular networks */
  turnServers?: RTCIceServer[];
  /** Web game portal integration ('poki' | 'crazygames' | 'auto') */
  portal?: 'poki' | 'crazygames' | 'auto';
}

export interface MerebLobbyOptions {
  /** Title shown at the top of the arcade lobby modal */
  title?: string;
  /** Parent DOM element to attach the lobby into (defaults to document.body) */
  container?: HTMLElement;
  /** Automatically hide lobby once match-start event fires (defaults to true) */
  autoHideOnStart?: boolean;
}

/**
 * High-level multiplayer client orchestrating signaling, WebRTC DataChannels,
 * automatic bot fallback, network quality monitoring, and portal lifecycle hooks.
 */
export class MerebClient {
  constructor(options?: MerebClientOptions);

  /** Local player connection ID */
  localId: string | null;
  /** Opponent player connection ID */
  peerId: string | null;
  /** Assigned role in current match: 'host', 'client', or null */
  role: 'host' | 'client' | null;
  /** Current 4-letter room code */
  roomCode: string | null;
  /** True if local player is authoritative host */
  readonly isHost: boolean;
  /** True if currently playing against an offline bot */
  readonly isBot: boolean;
  /** Connection state ('idle' | 'connecting' | 'in_lobby' | 'matching' | 'connected' | 'disconnected') */
  status: string;

  /** Create a new 4-letter room as host and wait for peer */
  createRoom(): Promise<string>;
  /** Join an existing room with 4-letter code */
  joinRoom(roomCode: string): Promise<void>;
  /** Queue into global matchmaker pool to pair with available opponents */
  quickPlay(): Promise<void>;
  /** Disconnect from signaling and terminate active WebRTC peer connection */
  disconnect(): void;

  /** Send high-frequency game state (unreliable UDP data channel) */
  sendState(state: any): void;
  /** Send player input stream (unreliable UDP data channel) */
  sendInput(input: any): void;
  /** Send raw compact binary ArrayBuffer or TypedArray (unreliable UDP) */
  sendBinary(data: ArrayBuffer | ArrayBufferView): void;
  /** Send reliable discrete event (e.g. kill, score, match-forfeit, chat) */
  sendEvent(name: string, data?: any): void;

  /** Subscribe to client lifecycle and netcode events */
  on(event: 'match-start', callback: (e: MatchStartEvent) => void): this;
  on(event: 'state', callback: (state: any) => void): this;
  on(event: 'binary', callback: (buffer: ArrayBuffer) => void): this;
  on(event: 'input', callback: (input: any) => void): this;
  on(event: 'event', callback: (event: ReliableGameEvent) => void): this;
  on(event: 'peer-disconnect', callback: () => void): this;
  on(event: 'quality', callback: (quality: NetworkQualityStats) => void): this;
  on(event: 'status-change', callback: (status: string) => void): this;
  on(event: string, callback: (...args: any[]) => void): this;

  /** Remove event listener */
  off(event: string, callback: (...args: any[]) => void): this;

  /** Get real-time connection latency, jitter, packet loss stats */
  getQuality(): NetworkQualityStats;
  /** Access underlying web game portal manager (Poki / CrazyGames) */
  portal: PortalManager;
}

/**
 * Drop-in arcade UI lobby with 3D tactile buttons, Room Code generator, and Quick Play queue.
 */
export class MerebLobby {
  constructor(client: MerebClient, options?: MerebLobbyOptions);
  show(): void;
  hide(): void;
  resetToMenu(): void;
  showStatus(msg: string): void;
  showError(msg: string): void;
  showWaiting(): void;
  showRoomCode(code: string): void;
  getElement(): HTMLElement;
}

/**
 * Native RTCPeerConnection wrapper managing dual DataChannels:
 * - Unreliable / unordered channel for 60Hz state replication
 * - Reliable / ordered channel for match events
 */
export class PeerConnection extends EventTarget {
  constructor(iceServers?: RTCIceServer[]);
  readonly connected: boolean;
  createOffer(): Promise<RTCSessionDescriptionInit>;
  handleOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>;
  handleAnswer(answer: RTCSessionDescriptionInit): Promise<void>;
  addIceCandidate(candidate: RTCIceCandidateInit): Promise<void>;
  send(data: any): void;
  sendBinary(data: ArrayBuffer | ArrayBufferView): void;
  sendReliable(data: any): void;
  close(): void;
}

/**
 * Signaling client connecting to PartyKit / Cloudflare WebSocket edge workers.
 */
export class SignalingClient extends EventTarget {
  constructor(host: string);
  readonly playerId: string | null;
  readonly isConnected: boolean;
  connect(roomId: string): Promise<void>;
  send(data: any): void;
  disconnect(): void;
}

/**
 * Ultra-fast zero-allocation binary stream writer with fixed-point arithmetic support.
 */
export class BinaryWriter {
  constructor(initialCapacity?: number);
  writeUint8(val: number): this;
  writeInt8(val: number): this;
  writeUint16(val: number): this;
  writeInt16(val: number): this;
  writeUint32(val: number): this;
  writeInt32(val: number): this;
  writeFloat32(val: number): this;
  writeFloat64(val: number): this;
  /** Write number as fixed-point 16-bit signed integer (precision multiplier e.g. 100 for 2 decimals) */
  writeFixed16(val: number, precision?: number): this;
  writeBoolean(val: boolean): this;
  writeString(str: string): this;
  reset(): this;
  getView(): Uint8Array;
  getBuffer(): ArrayBuffer;
}

/**
 * Ultra-fast binary stream reader with fixed-point arithmetic support.
 */
export class BinaryReader {
  constructor(buffer: ArrayBuffer | ArrayBufferView);
  readUint8(): number;
  readInt8(): number;
  readUint16(): number;
  readInt16(): number;
  readUint32(): number;
  readInt32(): number;
  readFloat32(): number;
  readFloat64(): number;
  /** Read fixed-point 16-bit signed integer into float */
  readFixed16(precision?: number): number;
  readBoolean(): boolean;
  readString(): string;
  reset(): this;
}

/**
 * Hermite / linear snapshot interpolation buffer providing buttery 60/120fps entity movement.
 */
export class SnapshotInterpolator {
  constructor(options?: { bufferTime?: number; maxBufferSize?: number });
  pushSnapshot(timestamp: number, entities: Record<string, any>): void;
  getInterpolated(renderTime?: number): Record<string, any>;
  clear(): void;
}

/**
 * Global pool of reliable STUN and TURN fallback relays (Google, Cloudflare, OpenRelay TLS).
 */
export class TurnPool {
  static getOptimalIceServers(): Promise<RTCIceServer[]>;
  static fetchOpenRelayTurn(): Promise<RTCIceServer[]>;
}

export const DEFAULT_STUN_SERVERS: RTCIceServer[];
export const DEFAULT_TURN_SERVERS: RTCIceServer[];
export const DEFAULT_ICE_SERVERS: RTCIceServer[];

/**
 * Network quality probe calculating round-trip ping, jitter, packet loss %, and status rating.
 */
export class NetworkQuality {
  recordPing(rttMs: number): void;
  recordLoss(lost: boolean): void;
  getStats(): NetworkQualityStats;
  getRating(): 'great' | 'good' | 'poor' | 'bad' | 'offline';
}

/**
 * Web Game Portal adapter integrating Poki SDK and CrazyGames SDK with WebRTC freeze prevention.
 */
export class PortalManager {
  readonly activePortal: 'poki' | 'crazygames' | 'none';
  init(preferred?: 'poki' | 'crazygames' | 'auto'): Promise<string>;
  gameplayStart(): void;
  gameplayStop(): void;
  commercialBreak(): Promise<boolean>;
  rewardedBreak(): Promise<boolean>;
  getShareableUrl(roomCode: string): string;
}

export const ROLE: {
  readonly HOST: 'host';
  readonly CLIENT: 'client';
  readonly BOT: 'bot';
};

export const STATUS: {
  readonly IDLE: 'idle';
  readonly CONNECTING: 'connecting';
  readonly IN_LOBBY: 'in_lobby';
  readonly MATCHING: 'matching';
  readonly CONNECTED: 'connected';
  readonly DISCONNECTED: 'disconnected';
};

export const WS: {
  readonly CREATE_ROOM: 'create-room';
  readonly JOIN_ROOM: 'join-room';
  readonly QUICK_PLAY: 'quick-play';
  readonly SIGNAL: 'signal';
  readonly ROOM_CREATED: 'room-created';
  readonly ROOM_JOINED: 'room-joined';
  readonly PLAYER_JOINED: 'player-joined';
  readonly PLAYER_LEFT: 'player-left';
  readonly MATCH_QUEUED: 'match-queued';
  readonly MATCH_FOUND: 'match-found';
  readonly START_SIGNAL: 'start-signal';
  readonly ERROR: 'error';
};

export const DC: {
  readonly STATE: 'state';
  readonly INPUT: 'input';
  readonly EVENT: 'event';
  readonly PING: 'ping';
  readonly PONG: 'pong';
};

export function generateRoomCode(): string;
