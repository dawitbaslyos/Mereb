/**
 * Mereb SDK - Multi-TURN / STUN Resilient NAT Traversal Pool
 * Guarantees connectivity across restrictive networks (School Wi-Fi, Dorms, Cellular)
 * by combining multi-region STUN with TLS-fallback TURN on port 443.
 */

export const DEFAULT_STUN_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:openrelay.metered.ca:80' }
];

// OpenRelay public relay fallback with TLS on port 443 (bypasses strict school firewalls)
export const DEFAULT_TURN_SERVERS = [
  {
    urls: [
      'turn:openrelay.metered.ca:80',
      'turn:openrelay.metered.ca:443',
      'turns:openrelay.metered.ca:443?transport=tcp'
    ],
    username: 'openrelayproject',
    credential: 'openrelayproject'
  }
];

export class TurnPool {
  /**
   * Resolves a complete resilient ICE server configuration
   * @param {Array|Function|Object} customServers - Optional custom iceServers array or async fetcher
   */
  static async resolveIceServers(customServers) {
    if (typeof customServers === 'function') {
      try {
        const fetched = await customServers();
        if (Array.isArray(fetched) && fetched.length > 0) {
          return fetched;
        }
      } catch (err) {
        console.warn('[Mereb:TurnPool] Failed to fetch dynamic TURN servers, falling back to defaults', err);
      }
    }

    if (Array.isArray(customServers) && customServers.length > 0) {
      return customServers;
    }

    // Default pool: Redundant STUN + TLS TURN Fallback
    return [
      ...DEFAULT_STUN_SERVERS,
      ...DEFAULT_TURN_SERVERS
    ];
  }

  /**
   * Fetches authenticated Managed TURN relays from Mereb Cloud edge
   * @param {string} edgeUrl - Mereb signaling / cloud edge URL
   * @param {string} [apiKey] - Project API key (e.g. pk_live_...)
   * @param {string} [appId] - Project App ID
   */
  static async fetchManagedTurn(edgeUrl, apiKey, appId) {
    if (!edgeUrl) return DEFAULT_STUN_SERVERS;
    try {
      const url = new URL(`${edgeUrl.replace(/\/+$/, '')}/api/turn-credentials`);
      if (apiKey) url.searchParams.set('apiKey', apiKey);
      if (appId) url.searchParams.set('appId', appId);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.iceServers) && data.iceServers.length > 0) {
          return data.iceServers;
        }
      }
    } catch (err) {
      console.warn('[Mereb:TurnPool] Managed TURN discovery notice:', err.message);
    }
    return [
      ...DEFAULT_STUN_SERVERS,
      ...DEFAULT_TURN_SERVERS
    ];
  }
}
