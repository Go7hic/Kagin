CREATE UNIQUE INDEX IF NOT EXISTS idx_orgs_stripe_customer_uid
  ON organizations(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL AND stripe_customer_id != '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_orgs_stripe_subscription_uid
  ON organizations(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL AND stripe_subscription_id != '';
