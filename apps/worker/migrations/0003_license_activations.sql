CREATE TABLE IF NOT EXISTS license_activations (
  license_key TEXT NOT NULL,
  machine_id TEXT NOT NULL,
  activated_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  PRIMARY KEY (license_key, machine_id),
  FOREIGN KEY (license_key) REFERENCES licenses(license_key)
);

CREATE INDEX IF NOT EXISTS idx_license_activations_key ON license_activations(license_key);
