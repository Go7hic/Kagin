CREATE TABLE IF NOT EXISTS api_keys (
  key_id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  name TEXT NOT NULL,
  prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_used_at INTEGER DEFAULT 0,
  revoked_at INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_api_keys_org ON api_keys(org_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(prefix);
