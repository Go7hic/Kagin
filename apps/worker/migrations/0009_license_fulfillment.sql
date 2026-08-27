ALTER TABLE licenses ADD COLUMN external_reference TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_licenses_org_external_reference
  ON licenses(org_id, external_reference)
  WHERE external_reference IS NOT NULL;
