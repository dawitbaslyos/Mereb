/**
 * Mereb Multiplayer Game SDK
 * Reusable WebRTC P2P Multiplayer & Matchmaking Framework for Web Games
 */
export { MerebClient } from './MerebClient.js';
export { MerebLobby } from './MerebLobby.js';
export { PeerConnection } from './PeerConnection.js';
export { SignalingClient } from './SignalingClient.js';
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
import * as Constants from './constants.js';

// Expose on global window object for Godot Web exports and direct script tags
if (typeof window !== 'undefined') {
  window.Mereb = {
    MerebClient,
    MerebLobby,
    PeerConnection,
    SignalingClient,
    ...Constants
  };
}
