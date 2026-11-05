-- 1. Users Table (Developers)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  github_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free',
  polar_customer_id TEXT,
  polar_subscription_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_github ON users(github_id);

-- 2. Apps Table (Multiplayer Games)
CREATE TABLE IF NOT EXISTS apps (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_apps_owner ON apps(owner_id);

-- 3. API Keys Table (Dual Key: Publishable vs Secret)
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_display TEXT NOT NULL,
  key_type TEXT NOT NULL, -- 'publishable' (client) | 'secret' (admin)
  name TEXT NOT NULL DEFAULT 'Default Key',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_app ON api_keys(app_id);

-- 4. Global Leaderboard Scores Table
CREATE TABLE IF NOT EXISTS leaderboard_scores (
  id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  metadata TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_lb_lookup ON leaderboard_scores(app_id, score DESC);

-- 5. Daily Usage & Quotas (Metering)
CREATE TABLE IF NOT EXISTS usage_daily (
  id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  peak_ccu INTEGER DEFAULT 0,
  total_connections INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  egress_bytes INTEGER DEFAULT 0,
  UNIQUE(app_id, date)
);
CREATE INDEX IF NOT EXISTS idx_usage_date ON usage_daily(app_id, date);
