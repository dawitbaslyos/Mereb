# ⚔️ Mereb Arena & Mereb Multiplayer SDK

> Zero-cost, high-performance WebRTC P2P Multiplayer & Matchmaking Framework for Web Games (Three.js, Godot HTML5, Canvas, Poki, CrazyGames).

## ✨ What is Mereb?

Mereb is both:
1. **A Complete Multiplayer Game Demo**: A fast 1v1 3D top-down tank arena shooter built with Three.js.
2. **A Reusable Game SDK (`dist-sdk/` or `src/sdk/`)**: A drop-in, 10 kB gzipped multiplayer engine you can take into **any** future game project (Three.js, Godot 4 Web, Phaser, Canvas 2D) with zero backend costs.

---

## 🚀 Quick Commands

```bash
# 1. Start local dev (Game on http://localhost:5173 + Signaling on ws://localhost:1999)
npm run dev

# 2. Build the game for web portals (dist/)
npm run build

# 3. Build the standalone SDK library for other games (dist-sdk/)
npm run build:sdk

# 4. Deploy the serverless signaling backend to Cloudflare ($0/month)
npm run deploy:party
```

---

## 📖 SDK Documentation

See [MEREB_SDK_GUIDE.md](./MEREB_SDK_GUIDE.md) for full documentation, API reference, and step-by-step guides for **Three.js** and **Godot 4 Web exports**.
