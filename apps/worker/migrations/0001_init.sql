CREATE TABLE IF NOT EXISTS licenses (
  license_key TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  type TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  features TEXT DEFAULT '{}',
  seat_limit INTEGER DEFAULT 0,
  machine_limit INTEGER DEFAULT 0,
  allowed_countries TEXT DEFAULT '[]',
  blocked_countries TEXT DEFAULT '[]',
  allowed_ips TEXT DEFAULT '[]',
  anti_debug TEXT DEFAULT '{}',
  issued_at INTEGER NOT NULL,
  status TEXT NOT NULL,
  state TEXT DEFAULT 'active',
  grace_until INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  license_key TEXT NOT NULL,
  machine_id TEXT NOT NULL,
  last_heartbeat INTEGER NOT NULL,
  country TEXT,
  ip TEXT,
  FOREIGN KEY (license_key) REFERENCES licenses(license_key)
);

CREATE INDEX IF NOT EXISTS idx_sessions_license ON sessions(license_key);

CREATE TABLE IF NOT EXISTS products (
  product_id TEXT PRIMARY KEY,
  name TEXT,
  feature_schema TEXT DEFAULT '{}',
  public_jwk TEXT,
  private_jwk TEXT
);

CREATE TABLE IF NOT EXISTS ephemeral_tokens (
  token_id TEXT PRIMARY KEY,
  license_key TEXT NOT NULL,
  machine_id TEXT NOT NULL,
  issued_at INTEGER NOT NULL,
  ttl INTEGER NOT NULL,
  FOREIGN KEY (license_key) REFERENCES licenses(license_key)
);

CREATE TABLE IF NOT EXISTS feature_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  license_key TEXT NOT NULL,
  features TEXT NOT NULL,
  server_time INTEGER NOT NULL,
  signature TEXT NOT NULL,
  issued_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS policies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT,
  policy TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS fingerprints (
  license_key TEXT PRIMARY KEY,
  avg_session_time INTEGER DEFAULT 0,
  machines_seen INTEGER DEFAULT 0,
  country_changes INTEGER DEFAULT 0,
  time_anomaly INTEGER DEFAULT 0,
  debug_hits INTEGER DEFAULT 0,
  risk_score INTEGER DEFAULT 0,
  FOREIGN KEY (license_key) REFERENCES licenses(license_key)
);
