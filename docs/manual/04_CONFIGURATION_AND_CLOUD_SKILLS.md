# Mereb Manual: Configuration & Cloud Deployment Skills

> **Version:** 2026.1 LTS &nbsp;|&nbsp; **Verified Stacks:** Cloudflare Workers, Durable Objects, PartyKit, Coturn &nbsp;|&nbsp; [Switch to Scripting API](../api/SCRIPTING_REFERENCE.md)

---

## 1. Overview of Signaling Infrastructure

While gameplay telemetry in Mereb streams directly between players over WebRTC DataChannels, establishing the initial connection requires an ultra-fast **signaling and matchmaking coordinator**.

Mereb officially supports two production-ready edge signaling backends:
1. **Cloudflare Workers + Durable Objects with SQLite** (Recommended for global low latency, custom domains, and zero-cost scaling).
2. **PartyKit** (Alternative zero-config open-source edge orchestration).

---

## 2. Cloudflare Workers Deployment (`cloudflare/`)

The `cloudflare/` directory contains a full-featured, production-ready edge worker (`worker.js`) equipped with:
- **`GameRoom` Durable Object**: Real-time room session coordination with persistent SQLite storage.
- **REST & WebSocket Endpoints**: Health probes, catalog APIs, leaderboards, and STUN/TURN relays.
- **Polar Billing Webhooks & Checkouts**: Automatic subscription management for Free, Pro, and Studio tiers.
- **GitHub OAuth Handler**: Developer authentication and studio dashboard token exchange.

### Step 1: Review `wrangler.toml` Configuration
Ensure your `cloudflare/wrangler.toml` is configured properly:

```toml
name = "mereb-signaling"
main = "worker.js"
compatibility_date = "2024-09-23"

# Durable Object Binding for Global Game Rooms
[durable_objects]
bindings = [
  { name = "GAME_ROOM", class_name = "GameRoom" }
]

# SQLite Storage Engine Migration
[[migrations]]
tag = "v1"
new_sqlite_classes = ["GameRoom"]

[vars]
# Public GitHub OAuth Client ID
GITHUB_CLIENT_ID = "Ov23lizozUDKwKt6LRJr"

# Polar Monetization & Checkout URLs (Optional)
POLAR_ORGANIZATION_ID = ""
POLAR_CHECKOUT_PRO_URL = ""
POLAR_CHECKOUT_STUDIO_URL = ""

[observability]
enabled = true
```

### Step 2: Configure Environment Variables & Secrets
Locally, create a `cloudflare/.dev.vars` file for development secrets:

```ini
# cloudflare/.dev.vars
GITHUB_CLIENT_SECRET="your_github_client_secret_here"
POLAR_ACCESS_TOKEN="polar_at_your_access_token_here"
POLAR_WEBHOOK_SECRET="whsec_your_polar_webhook_secret_here"
TURN_SECRET="your_rfc5766_turn_secret_key"
```

For production deployment on Cloudflare, securely add secrets via the Wrangler CLI:
```bash
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler secret put POLAR_ACCESS_TOKEN
npx wrangler secret put POLAR_WEBHOOK_SECRET
npx wrangler secret put TURN_SECRET
```

### Step 3: Deploy to Cloudflare Worldwide Edge
Deploy in one command:
```bash
cd cloudflare
npx wrangler deploy
```

Upon completion, Cloudflare will output your live URL:
```
https://mereb-signaling.<your-subdomain>.workers.dev
```

You can then pass this URL directly to `MerebClient`:
```javascript
const net = new MerebClient({
  host: 'mereb-signaling.<your-subdomain>.workers.dev'
});
```

---

## 3. Alternative: PartyKit Deployment (`party/`)

If you prefer deploying via PartyKit:
1. Review `partykit.json`:
   ```json
   {
     "name": "mereb-party",
     "main": "party/server.ts",
     "compatibilityDate": "2024-09-23"
   }
   ```
2. Test locally:
   ```bash
   npm run dev:party
   ```
3. Deploy to production:
   ```bash
   npm run deploy:party
   ```

---

## 4. STUN & TURN Relay Configuration

Mereb includes an integrated **Multi-TURN Pool** (`TurnPool.js`) that automatically queries Google STUN, Cloudflare STUN, and OpenRelay TLS TURN.

### Using Cloudflare's Built-In STUN
Cloudflare provides a global, zero-latency STUN server:
```javascript
const net = new MerebClient({
  host: 'mereb-signaling.workers.dev',
  stunServers: [
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:stun.l.google.com:19302' }
  ]
});
```

### Setting Up RFC 5766 Dynamic TURN Credentials
For enterprise environments or strict school Wi-Fi blocking UDP, Mereb supports HMAC-SHA1 dynamic TURN generation. When `TURN_SECRET` is defined in Cloudflare, the endpoint `/api/turn-credentials` generates time-limited credentials:

```javascript
// Fetch temporary TURN credentials from your edge worker
const response = await fetch('https://mereb-signaling.workers.dev/api/turn-credentials');
const { iceServers } = await response.json();

const net = new MerebClient({
  host: 'mereb-signaling.workers.dev',
  turnServers: iceServers
});
```

### Self-Hosting Coturn on a $3 VPS (Optional)
If you want to host your own dedicated Coturn instance:
```bash
# Install Coturn on Ubuntu/Debian
sudo apt update && sudo apt install coturn -y

# Edit /etc/turnserver.conf
listening-port=3478
tls-listening-port=443
realm=turn.yourgame.com
use-auth-secret
static-auth-secret="your_super_secret_turn_key"
cert=/etc/letsencrypt/live/turn.yourgame.com/fullchain.pem
pkey=/etc/letsencrypt/live/turn.yourgame.com/privkey.pem
```

---

## 5. Polar Billing & Developer Tiers

Mereb's edge worker natively manages three developer tiers configured in `PLAN_TIERS`:

| Tier | Monthly Fee | Max Active Games | Max Concurrent Users (CCU) | TURN Relays Enabled | Rate Limit / Min |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Free** | \$0 | 1 | 25 | Standard STUN | 120 req / min |
| **Pro** | \$29 | 10 | 250 | High-Speed Port 443 TLS TURN | 1,200 req / min |
| **Studio** | \$99 | 50 | 1,000 | Global Anycast Dedicated TURN | 6,000 req / min |

### Verifying Polar Webhooks
When developers upgrade on Polar, Polar dispatches standard signed webhooks to `/api/billing/polar/webhook`. The worker validates the HMAC-SHA256 signature using `POLAR_WEBHOOK_SECRET` and automatically promotes the developer's game catalog tier in SQLite.

---

## 6. Production Security & Rate Limiting

The edge worker enforces active protection against malicious traffic:
1. **IP Rate Limiting**: Enforced on all WebSocket room creation requests to prevent spam.
2. **Room Size Caps**: Game rooms are hard-capped to 2 peers by default (`connections.size >= 2` returns `Room full`).
3. **Payload Sanitization**: WebSocket signaling payloads are checked for size limits (<16 KB) to prevent memory exhaustion attacks.
4. **CORS Validation**: Cross-Origin Resource Sharing is locked down to authorized domains in production environments.

---

> [!TIP]
> Ready to integrate your game engine? Proceed to the [Unity 3D Integration Guide](05_UNITY_3D_INTEGRATION_GUIDE.md) or [Godot 4 Integration Guide](06_GODOT_4_INTEGRATION_GUIDE.md).
