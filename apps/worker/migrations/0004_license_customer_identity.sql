ALTER TABLE licenses ADD COLUMN customer_identity TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_licenses_customer_identity ON licenses(org_id, customer_identity);
