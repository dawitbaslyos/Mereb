/**
 * Mereb SDK - Shared Constants and Protocol Specifications
 */

import { DEFAULT_STUN_SERVERS, DEFAULT_TURN_SERVERS } from './netcode/TurnPool.js';

export const DEFAULT_ICE_SERVERS = [
  ...DEFAULT_STUN_SERVERS,
  ...DEFAULT_TURN_SERVERS
];

export const ROLE = {
  HOST: 'host',
  CLIENT: 'client',
  BOT: 'bot'
};

export const STATUS = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  IN_LOBBY: 'in_lobby',
  MATCHING: 'matching',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected'
};

// WebSocket signaling messages
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
  ERROR: 'error'
};

// DataChannel message types
export const DC = {
  STATE: 'state',
  INPUT: 'input',
  EVENT: 'event',
  PING: 'ping',
  PONG: 'pong'
};

// Generate friendly 4-character room codes excluding ambiguous characters
export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
