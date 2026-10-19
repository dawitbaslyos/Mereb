/**
 * useMereb - React Hook for Mereb WebRTC Multiplayer & Matchmaking
 * Provides reactive game state, room controls, quality probe, and messaging.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { MerebClient } from '../MerebClient.js';
import { STATUS, ROLE } from '../constants.js';

export function useMereb(options = {}) {
  const {
    host,
    botTimeoutMs = 8000,
    autoJoinFromUrl = true,
    iceServers
  } = options;

  const [status, setStatus] = useState(STATUS.DISCONNECTED);
  const [role, setRole] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [localId, setLocalId] = useState(null);
  const [peerId, setPeerId] = useState(null);
  const [isBot, setIsBot] = useState(false);
  const [roomCode, setRoomCode] = useState(null);
  const [quality, setQuality] = useState({ ping: 0, jitter: 0, packetLoss: 0, rating: 'untested' });
  const [error, setError] = useState(null);

  const clientRef = useRef(null);

  // Initialize client once
  useEffect(() => {
    const client = new MerebClient({
      host,
      botTimeoutMs,
      autoJoinFromUrl,
      iceServers
    });

    clientRef.current = client;

    client.on('status-change', (newStatus) => {
      setStatus(newStatus);
    });

    client.on('room-created', ({ roomCode: code }) => {
      setRoomCode(code);
    });

    client.on('match-start', ({ role: playerRole, isHost: hostFlag, localId: lid, peerId: pid, isBot: botFlag }) => {
      setRole(playerRole);
      setIsHost(hostFlag);
      setLocalId(lid);
      setPeerId(pid);
      setIsBot(botFlag);
      setStatus(STATUS.CONNECTED);
    });

    client.on('quality', (q) => {
      setQuality(q);
    });

    client.on('error', (err) => {
      setError(err.message || 'Multiplayer error');
    });

    client.on('peer-disconnect', () => {
      setPeerId(null);
      setStatus(STATUS.LOBBY);
    });

    return () => {
      client.disconnect();
    };
  }, [host, botTimeoutMs, autoJoinFromUrl]);

  // Actions
  const createRoom = useCallback(async () => {
    setError(null);
    return clientRef.current?.createRoom();
  }, []);

  const joinRoom = useCallback(async (code) => {
    setError(null);
    return clientRef.current?.joinRoom(code);
  }, []);

  const quickPlay = useCallback(() => {
    setError(null);
    return clientRef.current?.quickPlay();
  }, []);

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect();
    setRole(null);
    setIsHost(false);
    setPeerId(null);
    setRoomCode(null);
    setStatus(STATUS.DISCONNECTED);
  }, []);

  const sendState = useCallback((state) => {
    clientRef.current?.sendState(state);
  }, []);

  const sendInput = useCallback((input) => {
    clientRef.current?.sendInput(input);
  }, []);

  const sendBinary = useCallback((arrayBuffer) => {
    clientRef.current?.sendBinary(arrayBuffer);
  }, []);

  const sendEvent = useCallback((name, data) => {
    clientRef.current?.sendEvent(name, data);
  }, []);

  const on = useCallback((eventName, handler) => {
    if (!clientRef.current) return () => {};
    clientRef.current.on(eventName, handler);
    return () => clientRef.current?.off(eventName, handler);
  }, []);

  return {
    client: clientRef.current,
    status,
    role,
    isHost,
    localId,
    peerId,
    isBot,
    roomCode,
    quality,
    error,
    createRoom,
    joinRoom,
    quickPlay,
    disconnect,
    sendState,
    sendInput,
    sendBinary,
    sendEvent,
    on
  };
}
