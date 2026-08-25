CREATE TABLE IF NOT EXISTS organizations (
  org_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS org_members (
  org_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner',
  PRIMARY KEY (org_id, user_id),
  FOREIGN KEY (org_id) REFERENCES organizations(org_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE products_v2 (
  org_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  name TEXT,
  feature_schema TEXT DEFAULT '{}',
  public_jwk TEXT,
  private_jwk TEXT,
  PRIMARY KEY (org_id, product_id)
);

INSERT INTO products_v2 (org_id, product_id, name, feature_schema, public_jwk, private_jwk)
SELECT 'legacy', product_id, name, feature_schema, public_jwk, private_jwk FROM products;

DROP TABLE products;
ALTER TABLE products_v2 RENAME TO products;

ALTER TABLE licenses ADD COLUMN org_id TEXT;
UPDATE licenses SET org_id = 'legacy' WHERE org_id IS NULL;

ALTER TABLE policies ADD COLUMN org_id TEXT;
UPDATE policies SET org_id = 'legacy' WHERE org_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_licenses_org ON licenses(org_id);
CREATE INDEX IF NOT EXISTS idx_policies_org ON policies(org_id);
