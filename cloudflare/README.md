# 🌍 Deploying Mereb to Cloudflare Workers

Deploy a worldwide serverless WebRTC signaling server in **60 seconds** on Cloudflare's free tier ($0/month).

---

## ⚡ Quick Start

### 1. Login to Cloudflare
```bash
npx wrangler login
```

### 2. Deploy
From the `cloudflare/` directory:
```bash
cd cloudflare
npx wrangler deploy
```

Once deployed, Cloudflare will output your global edge URL (e.g. `https://mereb-signaling.<your-subdomain>.workers.dev`).

---

## 🎮 Connect Your Game

In your client code, pass your Cloudflare Worker hostname to `MerebClient`:

```javascript
import { MerebClient } from 'mereb-netcode';

const client = new MerebClient({
  host: 'mereb-signaling.<your-subdomain>.workers.dev',
  botTimeoutMs: 8000,
  autoJoinFromUrl: true
});
```

---

## 🌟 Architecture & Features

* **300+ Edge Cities:** Handshakes and matchmaking execute in the datacenter closest to the players.
* **Durable Objects:** Each 4-letter room code runs in its own isolated state machine.
* **Anycast STUN Included:** Features built-in Anycast STUN routing (`stun:stun.cloudflare.com:3478`).
* **Health Check & Region Discovery:** Visiting `https://<your-worker>.workers.dev/` returns JSON with real-time PoP location, country, and STUN server endpoints.
