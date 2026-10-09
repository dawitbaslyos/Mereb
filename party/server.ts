import type * as Party from "partykit/server";

export default class MerebServer implements Party.Server {
  hostId: string | null = null;
  queue: Party.Connection[] = [];

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    if (this.room.id === "matchmaker") {
      // Nothing on connect, only when "quick-play" is received
    } else {
      // Game Room Mode
      const connections = Array.from(this.room.getConnections());
      if (connections.length === 1) {
        this.hostId = conn.id;
      } else if (connections.length === 2 && this.hostId) {
        // Send joiner info
        conn.send(JSON.stringify({ type: "room-joined", players: [this.hostId, conn.id], hostId: this.hostId }));
        // Notify host
        const hostConn = this.room.getConnection(this.hostId);
        if (hostConn) {
          hostConn.send(JSON.stringify({ type: "player-joined", playerId: conn.id }));
          hostConn.send(JSON.stringify({ type: "start-signal", peerId: conn.id }));
        }
      } else if (connections.length > 2) {
        conn.send(JSON.stringify({ type: "error", message: "Room full" }));
        conn.close();
      }
    }
  }

  onMessage(message: string, sender: Party.Connection) {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      return;
    }

    if (this.room.id === "matchmaker") {
      if (data.type === "quick-play") {
        if (!this.queue.find(c => c.id === sender.id)) {
          this.queue.push(sender);
        }
        if (this.queue.length >= 2) {
          const p1 = this.queue.shift()!;
          const p2 = this.queue.shift()!;
          const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
          let code = '';
          for (let i = 0; i < 4; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
          }
          p1.send(JSON.stringify({ type: "match-found", roomCode: code, opponentId: p2.id }));
          p2.send(JSON.stringify({ type: "match-found", roomCode: code, opponentId: p1.id }));
        } else {
          sender.send(JSON.stringify({ type: "match-queued" }));
        }
      }
    } else {
      if (data.type === "signal" && data.to) {
        const target = this.room.getConnection(data.to);
        if (target) {
          target.send(JSON.stringify({ type: "signal", from: sender.id, signal: data.signal }));
        }
      }
    }
  }

  onClose(conn: Party.Connection) {
    if (this.room.id === "matchmaker") {
      this.queue = this.queue.filter(c => c.id !== conn.id);
    } else {
      this.room.broadcast(JSON.stringify({ type: "player-left", playerId: conn.id }), [conn.id]);
      if (conn.id === this.hostId) {
        this.hostId = null;
        for (const remainingConn of this.room.getConnections()) {
          remainingConn.close();
        }
      }
    }
  }
}

MerebServer satisfies Party.Worker;
