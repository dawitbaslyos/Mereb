/**
 * Mereb Multiplayer Game SDK
 * Reusable WebRTC P2P Multiplayer & Matchmaking Framework for Web Games
 */
export { MerebClient } from './MerebClient.js';
export { MerebLobby } from './MerebLobby.js';
export { PeerConnection } from './PeerConnection.js';
export { SignalingClient } from './SignalingClient.js';
export { BinaryWriter, BinaryReader } from './netcode/BinaryStream.js';
export { SnapshotInterpolator } from './netcode/SnapshotInterpolator.js';
export { TurnPool, DEFAULT_STUN_SERVERS, DEFAULT_TURN_SERVERS } from './netcode/TurnPool.js';
export { NetworkQuality } from './netcode/NetworkQuality.js';
export { PortalManager } from './portals/PortalManager.js';
export { 
  DEFAULT_ICE_SERVERS, 
  ROLE, 
  STATUS, 
  WS, 
  DC, 
  generateRoomCode 
} from './constants.js';

import { MerebClient } from './MerebClient.js';
import { MerebLobby } from './MerebLobby.js';
import { PeerConnection } from './PeerConnection.js';
import { SignalingClient } from './SignalingClient.js';
import { BinaryWriter, BinaryReader } from './netcode/BinaryStream.js';
import { SnapshotInterpolator } from './netcode/SnapshotInterpolator.js';
import { TurnPool, DEFAULT_STUN_SERVERS, DEFAULT_TURN_SERVERS } from './netcode/TurnPool.js';
import { NetworkQuality } from './netcode/NetworkQuality.js';
import { PortalManager } from './portals/PortalManager.js';
import * as Constants from './constants.js';

// Expose on global window object for Godot Web exports and direct script tags
if (typeof window !== 'undefined') {
  window.Mereb = {
    MerebClient,
    MerebLobby,
    PeerConnection,
    SignalingClient,
    BinaryWriter,
    BinaryReader,
    SnapshotInterpolator,
    TurnPool,
    NetworkQuality,
    PortalManager,
    DEFAULT_STUN_SERVERS,
    DEFAULT_TURN_SERVERS,
    ...Constants
  };
}
