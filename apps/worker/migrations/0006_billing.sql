ALTER TABLE organizations ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE organizations ADD COLUMN stripe_subscription_id TEXT;
ALTER TABLE organizations ADD COLUMN billing_status TEXT NOT NULL DEFAULT 'none';

CREATE INDEX IF NOT EXISTS idx_orgs_stripe_customer ON organizations(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_orgs_stripe_subscription ON organizations(stripe_subscription_id);
