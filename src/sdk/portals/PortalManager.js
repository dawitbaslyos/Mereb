/**
 * Mereb SDK - Web Game Portal Adapters (Poki & CrazyGames)
 * Automatically hooks into official portal SDKs to handle:
 * 1. Deep-linked room invite URLs (Poki shareableURL & CrazyGames inviteLink)
 * 2. Commercial break pausing (freezes netcode ticks & mutes audio so player isn't killed during ads)
 * 3. Gameplay start/stop analytics hooks
 * 4. Portal user profile sharing (CrazyGames username/avatar)
 */

export class PortalManager extends EventTarget {
  constructor(client) {
    super();
    this.client = client;
    this.portalType = null; // 'poki' | 'crazygames' | null
    this.sdk = null;
    this.isAdPlaying = false;
    this.userProfile = null;

    // Listen to client match lifecycle to automatically notify portal analytics
    this.client.on('match-start', () => this.notifyGameplayStart());
    this.client.on('peer-disconnect', () => this.notifyGameplayStop());
  }

  /**
   * Connect an official portal SDK to Mereb
   * @param {'poki'|'crazygames'|'auto'} type - Portal platform
   * @param {Object} sdkInstance - The portal SDK instance (e.g. window.PokiSDK or window.CrazyGames.SDK)
   */
  attach(type = 'auto', sdkInstance = null) {
    let resolvedType = type;
    let resolvedSdk = sdkInstance;

    // Auto-detect portal SDK if not explicitly passed
    if (resolvedType === 'auto') {
      if (typeof window !== 'undefined' && window.PokiSDK) {
        resolvedType = 'poki';
        resolvedSdk = window.PokiSDK;
      } else if (typeof window !== 'undefined' && (window.CrazyGames?.SDK || window.CrazyGames)) {
        resolvedType = 'crazygames';
        resolvedSdk = window.CrazyGames?.SDK || window.CrazyGames;
      } else {
        console.info('[Mereb:Portal] No portal SDK detected in global scope. Running in standalone mode.');
        return this;
      }
    }

    this.portalType = resolvedType;
    this.sdk = resolvedSdk;

    if (this.portalType === 'poki') {
      this._setupPoki();
    } else if (this.portalType === 'crazygames') {
      this._setupCrazyGames();
    }

    console.log(`[Mereb:Portal] Successfully hooked into ${this.portalType.toUpperCase()} SDK.`);
    return this;
  }

  // --- Poki Adapter ---
  _setupPoki() {
    // Intercept room link generation using Poki's shareableURL
    this.client.addEventListener('room-created', (e) => {
      if (this.sdk?.shareableURL) {
        try {
          const pokiUrl = this.sdk.shareableURL({ room: e.detail.roomCode });
          if (pokiUrl) {
            e.detail.shareUrl = pokiUrl;
          }
        } catch (err) {
          console.warn('[Mereb:Portal] Poki shareableURL error', err);
        }
      }
    });
  }

  /**
   * Request a Poki or CrazyGames mid-game commercial break with automatic netcode freeze
   * @returns {Promise<boolean>} resolves true when ad finishes
   */
  async requestCommercialBreak() {
    if (!this.sdk) return false;

    this.isAdPlaying = true;
    this.dispatchEvent(new CustomEvent('ad-start'));

    return new Promise((resolve) => {
      const onDone = () => {
        this.isAdPlaying = false;
        this.dispatchEvent(new CustomEvent('ad-end'));
        resolve(true);
      };

      if (this.portalType === 'poki' && this.sdk.commercialBreak) {
        this.sdk.commercialBreak().then(onDone).catch(onDone);
      } else if (this.portalType === 'crazygames') {
        const adCallbacks = {
          adStarted: () => {},
          adFinished: onDone,
          adError: onDone
        };

        if (this.sdk.ad?.requestAd) {
          this.sdk.ad.requestAd('midgame', adCallbacks);
        } else if (this.sdk.requestAd) {
          this.sdk.requestAd('midgame', adCallbacks);
        } else {
          onDone();
        }
      } else {
        onDone();
      }
    });
  }

  // --- CrazyGames Adapter ---
  async _setupCrazyGames() {
    // Attempt to fetch CrazyGames user profile
    try {
      if (this.sdk.user?.getUser) {
        const user = await this.sdk.user.getUser();
        if (user) {
          this.userProfile = {
            username: user.username,
            avatarUrl: user.profilePictureUrl
          };
        }
      }
    } catch (e) {
      // User might be playing as guest
    }

    // Intercept room created to attach CrazyGames invite link
    this.client.addEventListener('room-created', async (e) => {
      if (this.sdk.game?.inviteLink) {
        try {
          const invite = await this.sdk.game.inviteLink({ room: e.detail.roomCode });
          if (invite) {
            e.detail.shareUrl = invite;
          }
        } catch (err) {
          console.warn('[Mereb:Portal] CrazyGames inviteLink error', err);
        }
      }
    });
  }

  notifyGameplayStart() {
    if (!this.sdk) return;
    try {
      if (this.portalType === 'poki' && this.sdk.gameplayStart) {
        this.sdk.gameplayStart();
      } else if (this.portalType === 'crazygames') {
        if (this.sdk.game?.gameplayStart) this.sdk.game.gameplayStart();
        else if (this.sdk.gameplayStart) this.sdk.gameplayStart();
      }
    } catch (e) {}
  }

  notifyGameplayStop() {
    if (!this.sdk) return;
    try {
      if (this.portalType === 'poki' && this.sdk.gameplayStop) {
        this.sdk.gameplayStop();
      } else if (this.portalType === 'crazygames') {
        if (this.sdk.game?.gameplayStop) this.sdk.game.gameplayStop();
        else if (this.sdk.gameplayStop) this.sdk.gameplayStop();
      }
    } catch (e) {}
  }

  /**
   * Returns portal-specific invite link for a room code
   */
  getInviteUrl(roomCode) {
    if (this.portalType === 'poki' && this.sdk?.shareableURL) {
      try {
        return this.sdk.shareableURL({ room: roomCode });
      } catch {}
    }
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    }
    return `?room=${roomCode}`;
  }
}
