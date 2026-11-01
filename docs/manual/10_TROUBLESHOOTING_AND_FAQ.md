# Mereb Manual: Troubleshooting, Diagnostics & Production Checklist

> **Version:** 2026.1 LTS &nbsp;|&nbsp; **Verified Stacks:** Production WebRTC & Edge Mesh &nbsp;|&nbsp; [Switch to Scripting API](../api/SCRIPTING_REFERENCE.md)

---

## 1. Top Diagnostic Scenarios & Solutions

### Issue A: "Connection stuck in 'connecting' on School / University Wi-Fi"
* **Root Cause**: Many institutional firewalls block UDP ports entirely and restrict STUN requests.
* **Resolution**: Ensure your `TurnPool` has TLS TURN enabled over port 443:
  ```javascript
  const net = new MerebClient({
    host: 'mereb-signaling.workers.dev',
    turnServers: [
      {
        urls: 'turns:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelay',
        credential: 'openrelaypassword'
      }
    ]
  });
  ```

### Issue B: "Remote player stutters or jerks forward"
* **Root Cause**: The client render loop is evaluating ahead of the interpolation buffer, or network jitter exceeds `bufferTime`.
* **Resolution**: Increase the `bufferTime` parameter in `SnapshotInterpolator`:
  ```javascript
  // Default is 70ms. For mobile cellular networks, increase to 90-110ms:
  const interpolator = new SnapshotInterpolator({ bufferTime: 100 });
  ```

### Issue C: "WebGL build throws 'LibraryManager.library mergeInto' error"
* **Root Cause**: The JavaScript bridge file was placed outside the special `Assets/Plugins/WebGL/` folder.
* **Resolution**: In Unity, `.jslib` files MUST reside inside `Assets/Plugins/WebGL/`.

---

## 2. In-Game Developer Console (`MerebTerminal`)

Mereb provides an interactive, in-game terminal for live debugging. Press **`** (backtick) or tap the floating **`⚡ MEREB DEV`** badge to open the terminal.

| Command | Action | Description |
| :--- | :--- | :--- |
| `help` | Show command list | Lists all available console diagnostic utilities. |
| `status` | Query netcode state | Displays current role, room code, peerId, and signaling state. |
| `ping` | Probe latency | Triggers real-time RTT measurement across DataChannels. |
| `lag <ms>` | Simulate network lag | Artificially injects latency (e.g. `lag 120`) to test interpolation. |
| `loss <pct>` | Simulate packet loss | Drops simulated percentage of packets (e.g. `loss 15`). |
| `clear` | Clear output log | Clears terminal scrollback history. |

---

## 3. Production Launch Checklist

Before launching on Poki, CrazyGames, Steam Web, or Itch.io:

- [ ] **Cloudflare Worker Deployed**: Verify `wrangler deploy` has been executed with custom domain or `workers.dev` URL.
- [ ] **Wrangler Secrets Configured**: Ensure `TURN_SECRET`, `POLAR_WEBHOOK_SECRET`, and `GITHUB_CLIENT_SECRET` are stored in Cloudflare secrets (never committed in git).
- [ ] **Bundle Size Verified**: Confirm production build imports `dist-sdk/mereb.es.js` (13 kB gzipped).
- [ ] **Poki / CrazyGames Ad Hooks Connected**: Verify `net.usePortal('poki')` or `net.usePortal('crazygames')` is called so video ads do not terminate active matches.
- [ ] **Smart Bot Timeout Tested**: Test disconnect resilience by opening an empty room and ensuring the offline bot activates after 8 seconds.
- [ ] **HTTPS / WSS Enforced**: Confirm signaling endpoint uses `wss://` and web host uses `https://` (WebRTC requires a secure context).
