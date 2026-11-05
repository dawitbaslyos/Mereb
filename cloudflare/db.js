/**
 * Mereb Cloudflare D1 Database Layer
 * Relational queries for multi-tenant users, apps, dual API keys, persistent leaderboards & usage metrics.
 */

import { sha256 } from './auth.js';

export const PLAN_TIERS = {
  free: {
    name: 'Free',
    maxGames: 1,
    maxCCU: 25,
    turnEnabled: false,
    rateLimitPerMin: 120
  },
  pro: {
    name: 'Pro',
    maxGames: 10,
    maxCCU: 250,
    turnEnabled: true,
    rateLimitPerMin: 1200
  },
  studio: {
    name: 'Studio',
    maxGames: 50,
    maxCCU: 1000,
    turnEnabled: true,
    rateLimitPerMin: 6000
  }
};

/**
 * Upserts a GitHub developer profile into the users table
 */
export async function upsertGithubUser(db, ghUser) {
  const userId = `usr_${ghUser.id}`;
  const githubId = String(ghUser.id);
  const username = ghUser.login || ghUser.username;
  const email = ghUser.email || `${username}@users.noreply.github.com`;
  const avatarUrl = ghUser.avatar_url || ghUser.avatar || `https://github.com/${username}.png`;

  const query = `
    INSERT INTO users (id, github_id, username, email, avatar_url, plan)
    VALUES (?, ?, ?, ?, ?, 'free')
    ON CONFLICT(github_id) DO UPDATE SET
      username = excluded.username,
      email = excluded.email,
      avatar_url = excluded.avatar_url,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;

  const res = await db.prepare(query)
    .bind(userId, githubId, username, email, avatarUrl)
    .first();

  return res;
}

/**
 * Gets a user by ID
 */
export async function getUserById(db, userId) {
  if (!userId) return null;
  return await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
}

/**
 * Gets all apps for a user, including their keys
 */
export async function getUserApps(db, userId) {
  if (!userId) return [];

  const apps = await db.prepare(`
    SELECT a.*, COALESCE(u.plan, 'free') as plan
    FROM apps a
    LEFT JOIN users u ON a.owner_id = u.id
    WHERE a.owner_id = ?
    ORDER BY a.created_at DESC
  `).bind(userId).all();

  if (!apps.results || apps.results.length === 0) return [];

  // Fetch keys for these apps
  const appIds = apps.results.map(a => a.id);
  const placeholders = appIds.map(() => '?').join(',');
  const keys = await db.prepare(`
    SELECT id, app_id, key_prefix, key_display, key_type, name, created_at
    FROM api_keys
    WHERE app_id IN (${placeholders})
  `).bind(...appIds).all();

  const keysByApp = new Map();
  for (const k of keys.results || []) {
    if (!keysByApp.has(k.app_id)) keysByApp.set(k.app_id, []);
    keysByApp.get(k.app_id).push(k);
  }

  return apps.results.map(app => {
    const appKeys = keysByApp.get(app.id) || [];
    const pubKey = appKeys.find(k => k.key_type === 'publishable');
    const secKey = appKeys.find(k => k.key_type === 'secret');

    return {
      id: app.id,
      name: app.name,
      ownerId: app.owner_id,
      status: app.status,
      plan: app.plan,
      createdAt: app.created_at,
      publishableKeyDisplay: pubKey?.key_display || null,
      secretKeyDisplay: secKey?.key_display || null,
      // For backwards compatibility with single key clients:
      apiKey: pubKey?.key_display || `pk_live_${app.id}`
    };
  });
}

/**
 * Gets a specific app by ID
 */
export async function getAppById(db, appId) {
  return await db.prepare(`
    SELECT a.*, COALESCE(u.plan, 'free') as plan
    FROM apps a
    LEFT JOIN users u ON a.owner_id = u.id
    WHERE a.id = ?
  `).bind(appId).first();
}

/**
 * Creates a new multiplayer game with dual API keys (publishable and secret)
 */
export async function createAppWithKeys(db, { id, name, ownerId }) {
  // Ensure owner exists in users table (prevent foreign key constraint failure)
  const existingUser = await db.prepare('SELECT id FROM users WHERE id = ?').bind(ownerId).first();
  if (!existingUser) {
    await db.prepare('INSERT OR IGNORE INTO users (id, github_id, username, plan) VALUES (?, ?, ?, ?)')
      .bind(ownerId, ownerId, ownerId === 'dev_local' ? 'Developer' : ownerId, 'free').run();
  }

  const publishableKey = `pk_live_${crypto.randomUUID().replace(/-/g, '')}`;
  const secretKey = `sk_live_${crypto.randomUUID().replace(/-/g, '')}`;

  const pubHash = await sha256(publishableKey);
  const secHash = await sha256(secretKey);

  const pubDisplay = `${publishableKey.slice(0, 12)}...${publishableKey.slice(-4)}`;
  const secDisplay = `${secretKey.slice(0, 12)}...${secretKey.slice(-4)}`;

  // Run in batch transaction
  await db.batch([
    db.prepare('INSERT INTO apps (id, owner_id, name) VALUES (?, ?, ?)')
      .bind(id, ownerId, name),
    db.prepare('INSERT INTO api_keys (id, app_id, key_prefix, key_hash, key_display, key_type, name) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), id, 'pk_live_', pubHash, pubDisplay, 'publishable', 'Client Publishable Key'),
    db.prepare('INSERT INTO api_keys (id, app_id, key_prefix, key_hash, key_display, key_type, name) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), id, 'sk_live_', secHash, secDisplay, 'secret', 'Server Secret Key')
  ]);

  return {
    id,
    name,
    ownerId,
    status: 'active',
    createdAt: new Date().toISOString(),
    publishableKey, // Return raw once on creation
    secretKey,      // Return raw once on creation
    publishableKeyDisplay: pubDisplay,
    secretKeyDisplay: secDisplay,
    apiKey: publishableKey
  };
}

/**
 * Deletes an app (cascades to keys, leaderboard, usage)
 */
export async function deleteApp(db, appId, ownerId) {
  // If ownerId is provided, enforce ownership check
  if (ownerId) {
    const app = await db.prepare('SELECT owner_id FROM apps WHERE id = ?').bind(appId).first();
    if (!app || app.owner_id !== ownerId) {
      throw new Error('Unauthorized: You do not own this app');
    }
  }

  await db.prepare('DELETE FROM apps WHERE id = ?').bind(appId).run();
  return { status: 'deleted', id: appId };
}

/**
 * Validates a key and returns { valid: boolean, keyType: 'publishable'|'secret'|null, app: object }
 */
export async function validateApiKey(db, appId, rawKey) {
  if (!rawKey || !appId) return { valid: false, keyType: null, app: null };

  const hash = await sha256(rawKey.trim());
  const keyRecord = await db.prepare(`
    SELECT k.*, a.status as app_status, a.owner_id, COALESCE(u.plan, 'free') as plan
    FROM api_keys k
    JOIN apps a ON k.app_id = a.id
    LEFT JOIN users u ON a.owner_id = u.id
    WHERE k.app_id = ? AND k.key_hash = ?
  `).bind(appId, hash).first();

  if (!keyRecord) {
    // Development fallback for demo app
    if (appId === 'app_starter' || appId === 'illegalsoccer') {
      return { valid: true, keyType: 'publishable', app: { id: appId, plan: 'free' } };
    }
    return { valid: false, keyType: null, app: null };
  }

  return {
    valid: keyRecord.app_status === 'active',
    keyType: keyRecord.key_type,
    app: {
      id: keyRecord.app_id,
      ownerId: keyRecord.owner_id,
      plan: keyRecord.plan,
      status: keyRecord.app_status
    }
  };
}

/**
 * Global Leaderboard: Fetch top scores
 */
export async function getLeaderboard(db, appId, limit = 100) {
  const rows = await db.prepare(`
    SELECT id, player_name as player, score, metadata, created_at as createdAt
    FROM leaderboard_scores
    WHERE app_id = ?
    ORDER BY score DESC
    LIMIT ?
  `).bind(appId, limit).all();

  return (rows.results || []).map(r => ({
    id: r.id,
    player: r.player,
    username: r.player,
    score: r.score,
    metadata: r.metadata ? JSON.parse(r.metadata) : {},
    createdAt: r.createdAt
  }));
}

/**
 * Global Leaderboard: Submit a score
 */
export async function submitScore(db, appId, player, score, metadata = {}) {
  const id = `score_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const metaStr = typeof metadata === 'object' ? JSON.stringify(metadata) : null;

  await db.prepare(`
    INSERT INTO leaderboard_scores (id, app_id, player_name, score, metadata)
    VALUES (?, ?, ?, ?, ?)
  `).bind(id, appId, player, score, metaStr).run();

  // Get current rank
  const rankRes = await db.prepare(`
    SELECT COUNT(*) as rank
    FROM leaderboard_scores
    WHERE app_id = ? AND score >= ?
  `).bind(appId, score).first();

  const rank = (rankRes?.rank || 1);
  const top10 = await getLeaderboard(db, appId, 10);

  return {
    id,
    player,
    score,
    rank,
    top10
  };
}

/**
 * Global Leaderboard: Clear scores for an app
 */
export async function clearLeaderboard(db, appId) {
  await db.prepare('DELETE FROM leaderboard_scores WHERE app_id = ?').bind(appId).run();
  return { status: 'ok', cleared: true, appId };
}

/**
 * Usage Metering: Upserts daily peak CCU & connection count
 */
export async function recordUsageSnapshot(db, appId, currentCCU, connectionsCount = 0) {
  const date = new Date().toISOString().split('T')[0];
  const id = `${appId}_${date}`;

  await db.prepare(`
    INSERT INTO usage_daily (id, app_id, date, peak_ccu, total_connections)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(app_id, date) DO UPDATE SET
      peak_ccu = MAX(peak_ccu, excluded.peak_ccu),
      total_connections = total_connections + excluded.total_connections
  `).bind(id, appId, date, currentCCU, connectionsCount).run();
}
