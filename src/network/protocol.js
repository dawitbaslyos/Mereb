// Game constants
export const ARENA_WIDTH = 20;
export const ARENA_HEIGHT = 20;
export const TANK_SPEED = 6.4;         // units/sec (snappy arcade movement)
export const TANK_ROTATION_SPEED = 14; // rad/sec (smooth steering rate)
export const BULLET_SPEED = 18;      // units/sec
export const TANK_RADIUS = 0.5;
export const BULLET_RADIUS = 0.15;
export const MAX_HEALTH = 100;
export const BULLET_DAMAGE = 25;
export const SCORE_TO_WIN = 5;
export const TICK_RATE = 50;          // ms between host ticks (20 Hz)
export const SHOOT_COOLDOWN = 320;   // ms between shots (crisp rapid fire)
export const RESPAWN_TIME = 1500;    // ms invulnerability after respawn

// Spawn positions
export const SPAWN_POSITIONS = {
  host: { x: -7, z: 0 },
  client: { x: 7, z: 0 },
};

// WebSocket message types (PartyKit signaling)
export const WS = {
  CREATE_ROOM: 'create-room',
  JOIN_ROOM: 'join-room',
  QUICK_PLAY: 'quick-play',
  SIGNAL: 'signal',
  ROOM_CREATED: 'room-created',
  ROOM_JOINED: 'room-joined',
  PLAYER_JOINED: 'player-joined',
  PLAYER_LEFT: 'player-left',
  MATCH_QUEUED: 'match-queued',
  MATCH_FOUND: 'match-found',
  START_SIGNAL: 'start-signal',
  ERROR: 'error',
};

// DataChannel message types (WebRTC peer-to-peer)
export const DC = {
  INPUT: 'input',
  GAME_STATE: 'game-state',
  MATCH_START: 'match-start',
  MATCH_END: 'match-end',
};

// Generate a random 4-char uppercase room code
export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 to avoid confusion
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
