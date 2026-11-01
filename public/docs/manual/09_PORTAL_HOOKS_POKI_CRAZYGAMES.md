# Mereb Manual: Web Portal Hooks (Poki & CrazyGames SDKs)

> **Version:** 2026.1 LTS &nbsp;|&nbsp; **Verified Platforms:** Poki, CrazyGames, GameDistribution &nbsp;|&nbsp; [Switch to Scripting API](../api/SCRIPTING_REFERENCE.md)

---

## 1. The Video Ad Disconnect Problem

When a player triggers a **commercial break** or watches a **rewarded video ad** on portals like Poki or CrazyGames:
1. The browser pauses or severely throttles `requestAnimationFrame` and `setTimeout` loops for background tabs.
2. Standard WebRTC / WebSocket ping-pong timers stop firing.
3. Upon returning from the 30-second ad, the network connection has closed, and the player is booted to the menu.

Mereb includes a native **`PortalManager`** that orchestrates network state during portal monetization events.

---

## 2. Automatic Portal Hooking

Mereb automatically detects and connects to the official Poki or CrazyGames SDK loaded in the browser:

```javascript
import { MerebClient } from 'mereb-netcode';

const net = new MerebClient({
  host: 'mereb-signaling.dawitbaslyos.workers.dev',
  portal: 'auto' // Or explicitly 'poki' | 'crazygames'
});
```

---

## 3. Explicit Lifecycle Hooks

### Poki Integration Example
```javascript
// Register official Poki SDK instance
net.usePortal('poki', window.PokiSDK);

// Trigger a mid-roll commercial break between rounds:
async function triggerBetweenRoundAd() {
  // Pauses simulation, mutes audio, and suppresses WebRTC timeout alerts
  const adSuccess = await net.portal.commercialBreak();
  
  if (adSuccess) {
    console.log('[Portal] Commercial break completed successfully.');
  }
}

// Generate viral invite URL using Poki shareableURL API:
const inviteUrl = net.portal.getShareableUrl('W7KP');
console.log('Share this link on Poki:', inviteUrl);
```

### CrazyGames Integration Example
```javascript
// Register official CrazyGames SDK
net.usePortal('crazygames', window.CrazyGames.SDK);

// Trigger rewarded video ad for in-game currency:
async function watchRewardedAd() {
  const rewarded = await net.portal.rewardedBreak();
  if (rewarded) {
    grantBonusGems(500);
  }
}
```

---

> [!NOTE]
> During active ad playback, `net.portal` sends a reliable `ad-start` event to the connected peer over the reliable WebRTC channel, notifying the opponent's game to temporarily pause round countdowns or display an "Opponent watching ad..." banner.
