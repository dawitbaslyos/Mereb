/**
 * Mereb Arena - Compact Binary Packet Encoder & Decoder
 * Packs full 1v1 state + bullets into a tiny ~35-50 byte ArrayBuffer.
 */
import { BinaryWriter, BinaryReader } from '../sdk/index.js';

const PACKET_STATE = 0x01;

export class TankBinaryProtocol {
  constructor() {
    this.writer = new BinaryWriter(256);
  }

  encodeState(players, bullets, tick, hostId, clientId) {
    this.writer.reset();
    this.writer.writeUint8(PACKET_STATE);
    this.writer.writeUint32(tick & 0xFFFFFFFF);

    // 1. Host Player
    const hp = players[hostId] || {};
    this.writer.writeFixed16(hp.x || 0, 100);
    this.writer.writeFixed16(hp.z || 0, 100);
    this.writer.writeFixed16(hp.rotation || 0, 1000);
    this.writer.writeFixed16(hp.turretRotation || 0, 1000);
    this.writer.writeUint8(Math.max(0, Math.min(255, Math.round(hp.health || 0))));
    this.writer.writeUint8(hp.score || 0);
    this.writer.writeBoolean(Date.now() < (hp.respawnUntil || 0));

    // 2. Client Player
    const cp = players[clientId] || {};
    this.writer.writeFixed16(cp.x || 0, 100);
    this.writer.writeFixed16(cp.z || 0, 100);
    this.writer.writeFixed16(cp.rotation || 0, 1000);
    this.writer.writeFixed16(cp.turretRotation || 0, 1000);
    this.writer.writeUint8(Math.max(0, Math.min(255, Math.round(cp.health || 0))));
    this.writer.writeUint8(cp.score || 0);
    this.writer.writeBoolean(Date.now() < (cp.respawnUntil || 0));

    // 3. Bullets (max 32 active)
    const bulletList = (bullets || []).slice(0, 32);
    this.writer.writeUint8(bulletList.length);
    for (let i = 0; i < bulletList.length; i++) {
      const b = bulletList[i];
      this.writer.writeUint16(b.id || 0);
      this.writer.writeFixed16(b.x || 0, 100);
      this.writer.writeFixed16(b.z || 0, 100);
      this.writer.writeFixed16(b.dx || 0, 100);
      this.writer.writeFixed16(b.dz || 0, 100);
      this.writer.writeBoolean(b.ownerId === hostId);
    }

    return this.writer.getView();
  }

  decodeState(arrayBuffer, hostId, clientId) {
    const reader = new BinaryReader(arrayBuffer);
    const packetType = reader.readUint8();
    if (packetType !== PACKET_STATE) return null;

    const tick = reader.readUint32();

    const host = {
      x: reader.readFixed16(100),
      z: reader.readFixed16(100),
      rotation: reader.readFixed16(1000),
      turretRotation: reader.readFixed16(1000),
      health: reader.readUint8(),
      score: reader.readUint8(),
      isInvuln: reader.readBoolean()
    };

    const client = {
      x: reader.readFixed16(100),
      z: reader.readFixed16(100),
      rotation: reader.readFixed16(1000),
      turretRotation: reader.readFixed16(1000),
      health: reader.readUint8(),
      score: reader.readUint8(),
      isInvuln: reader.readBoolean()
    };

    const bulletCount = reader.readUint8();
    const bullets = [];
    for (let i = 0; i < bulletCount; i++) {
      bullets.push({
        id: reader.readUint16(),
        x: reader.readFixed16(100),
        z: reader.readFixed16(100),
        dx: reader.readFixed16(100),
        dz: reader.readFixed16(100),
        ownerId: reader.readBoolean() ? hostId : clientId
      });
    }

    return {
      tick,
      players: {
        [hostId]: host,
        [clientId]: client
      },
      bullets
    };
  }
}
