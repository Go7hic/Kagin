import type { Env } from "./env";

export type LicenseRow = {
  license_key: string;
  org_id: string;
  product_id: string;
  type: string;
  expires_at: number;
  features: string;
  seat_limit: number;
  machine_limit: number;
  allowed_countries: string;
  blocked_countries: string;
  allowed_ips: string;
  anti_debug: string;
  issued_at: number;
  status: string;
  state: string;
  grace_until: number;
  customer_identity: string;
};

export type ProductRow = {
  org_id: string;
  product_id: string;
  name: string | null;
  feature_schema: string;
  public_jwk: string | null;
  private_jwk: string | null;
};

export type UserRow = {
  user_id: string;
  email: string;
  password_hash: string;
  created_at: number;
};

export type OrgRow = {
  org_id: string;
  name: string;
  slug: string;
  created_at: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  billing_status: string;
};

export type ApiKeyRow = {
  key_id: string;
  org_id: string;
  name: string;
  prefix: string;
  key_hash: string;
  created_at: number;
  last_used_at: number;
  revoked_at: number;
};

export type AdminSessionRow = {
  session_id: string;
  org_id: string;
  user_id: string;
  prefix: string;
  token_hash: string;
  created_at: number;
  expires_at: number;
};

export const db = {
  async createUser(env: Env, userId: string, email: string, passwordHash: string, createdAt: number) {
    await env.DB.prepare("INSERT INTO users (user_id, email, password_hash, created_at) VALUES (?, ?, ?, ?)")
      .bind(userId, email.toLowerCase(), passwordHash, createdAt).run();
  },
  async getUserByEmail(env: Env, email: string) {
    return env.DB.prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE").bind(email).first<UserRow>();
  },
  async createOrganization(env: Env, orgId: string, name: string, slug: string, createdAt: number) {
    await env.DB.prepare("INSERT INTO organizations (org_id, name, slug, created_at) VALUES (?, ?, ?, ?)")
      .bind(orgId, name, slug, createdAt).run();
  },
  async orgSlugTaken(env: Env, slug: string) {
    const row = await env.DB.prepare("SELECT 1 FROM organizations WHERE slug = ?").bind(slug).first();
    return !!row;
  },
  async addOrgMember(env: Env, orgId: string, userId: string, role: string) {
    await env.DB.prepare("INSERT INTO org_members (org_id, user_id, role) VALUES (?, ?, ?)")
      .bind(orgId, userId, role).run();
  },
  async getPrimaryMembership(env: Env, userId: string) {
    return env.DB.prepare(
      `SELECT m.org_id, m.role, o.name AS org_name, o.slug AS org_slug
       FROM org_members m JOIN organizations o ON o.org_id = m.org_id
       WHERE m.user_id = ? ORDER BY m.org_id LIMIT 1`,
    ).bind(userId).first<{ org_id: string; role: string; org_name: string; org_slug: string }>();
  },
  async getOrg(env: Env, orgId: string) {
    return env.DB.prepare("SELECT * FROM organizations WHERE org_id = ?").bind(orgId).first<OrgRow>();
  },
  async getOrgBySlug(env: Env, slug: string) {
    return env.DB.prepare("SELECT * FROM organizations WHERE slug = ?").bind(slug).first<OrgRow>();
  },
  async getOrgByStripeCustomer(env: Env, customerId: string) {
    return env.DB.prepare("SELECT * FROM organizations WHERE stripe_customer_id = ?")
      .bind(customerId).first<OrgRow>();
  },
  async getOrgByStripeSubscription(env: Env, subscriptionId: string) {
    return env.DB.prepare("SELECT * FROM organizations WHERE stripe_subscription_id = ?")
      .bind(subscriptionId).first<OrgRow>();
  },
  async setOrgBilling(
    env: Env,
    orgId: string,
    fields: {
      stripe_customer_id?: string | null;
      stripe_subscription_id?: string | null;
      billing_status: string;
    },
  ) {
    const current = await db.getOrg(env, orgId);
    if (!current) return;
    const customer = fields.stripe_customer_id === undefined
      ? current.stripe_customer_id
      : fields.stripe_customer_id;
    const subscription = fields.stripe_subscription_id === undefined
      ? current.stripe_subscription_id
      : fields.stripe_subscription_id;
    await env.DB.prepare(
      "UPDATE organizations SET stripe_customer_id = ?, stripe_subscription_id = ?, billing_status = ? WHERE org_id = ?",
    ).bind(customer, subscription, fields.billing_status, orgId).run();
  },
  async countProducts(env: Env, orgId: string) {
    const row = await env.DB.prepare("SELECT COUNT(*) AS c FROM products WHERE org_id = ?")
      .bind(orgId).first<{ c: number }>();
    return Number(row?.c ?? 0);
  },
  async getMembership(env: Env, orgId: string, userId: string) {
    return env.DB.prepare("SELECT role FROM org_members WHERE org_id = ? AND user_id = ?")
      .bind(orgId, userId).first<{ role: string }>();
  },

  /** Never selects private_jwk: this feeds the admin API response. */
  async listProducts(env: Env, orgId: string) {
    const res = await env.DB
      .prepare("SELECT org_id, product_id, name, feature_schema, public_jwk FROM products WHERE org_id = ?")
      .bind(orgId).all<Omit<ProductRow, "private_jwk">>();
    return res.results ?? [];
  },
  async getProduct(env: Env, orgId: string, productId: string) {
    return env.DB.prepare("SELECT * FROM products WHERE org_id = ? AND product_id = ?")
      .bind(orgId, productId).first<ProductRow>();
  },
  async createProduct(env: Env, orgId: string, productId: string, name: string) {
    await env.DB.prepare("INSERT INTO products (org_id, product_id, name) VALUES (?, ?, ?)")
      .bind(orgId, productId, name).run();
  },
  async deleteProduct(env: Env, orgId: string, productId: string) {
    await env.DB.prepare("DELETE FROM products WHERE org_id = ? AND product_id = ?").bind(orgId, productId).run();
  },
  async updateProductKeys(env: Env, orgId: string, productId: string, publicJwk: string, privateJwk: string) {
    await env.DB.prepare("UPDATE products SET public_jwk = ?, private_jwk = ? WHERE org_id = ? AND product_id = ?")
      .bind(publicJwk, privateJwk, orgId, productId).run();
  },
  async updateFeatureSchema(env: Env, orgId: string, productId: string, schema: string) {
    await env.DB.prepare("UPDATE products SET feature_schema = ? WHERE org_id = ? AND product_id = ?")
      .bind(schema, orgId, productId).run();
  },
  async getLicense(env: Env, licenseKey: string) {
    return env.DB.prepare("SELECT * FROM licenses WHERE license_key = ?").bind(licenseKey).first<LicenseRow>();
  },
  async listLicenses(env: Env, orgId: string, productId?: string) {
    const q = productId
      ? env.DB.prepare("SELECT * FROM licenses WHERE org_id = ? AND product_id = ?").bind(orgId, productId)
      : env.DB.prepare("SELECT * FROM licenses WHERE org_id = ?").bind(orgId);
    const res = await q.all<LicenseRow>();
    return res.results ?? [];
  },
  async createLicense(env: Env, row: LicenseRow) {
    await env.DB.prepare(
      `INSERT INTO licenses (license_key, org_id, product_id, type, expires_at, features, seat_limit, machine_limit,
        allowed_countries, blocked_countries, allowed_ips, anti_debug, issued_at, status, state, grace_until, customer_identity)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      row.license_key, row.org_id, row.product_id, row.type, row.expires_at, row.features, row.seat_limit,
      row.machine_limit, row.allowed_countries, row.blocked_countries, row.allowed_ips, row.anti_debug,
      row.issued_at, row.status, row.state, row.grace_until, row.customer_identity || "",
    ).run();
  },
  async revokeLicense(env: Env, orgId: string, licenseKey: string) {
    await env.DB.prepare(
      "UPDATE licenses SET status = 'revoked', state = 'revoked' WHERE license_key = ? AND org_id = ?",
    ).bind(licenseKey, orgId).run();
  },
  async updateLicenseState(env: Env, licenseKey: string, state: string, graceUntil: number) {
    await env.DB.prepare("UPDATE licenses SET state = ?, grace_until = ? WHERE license_key = ?")
      .bind(state, graceUntil, licenseKey).run();
  },
  async latestHeartbeat(env: Env, licenseKey: string) {
    return env.DB.prepare(
      "SELECT MAX(last_heartbeat) AS last_heartbeat FROM sessions WHERE license_key = ?",
    ).bind(licenseKey).first<{ last_heartbeat: number | null }>();
  },
  async upsertSession(env: Env, sessionId: string, licenseKey: string, machineId: string, ts: number, country: string, ip: string) {
    await env.DB.prepare(
      `INSERT OR REPLACE INTO sessions (session_id, license_key, machine_id, last_heartbeat, country, ip) VALUES (?, ?, ?, ?, ?, ?)`,
    ).bind(sessionId, licenseKey, machineId, ts, country, ip).run();
  },
  async deleteSession(env: Env, sessionId: string) {
    await env.DB.prepare("DELETE FROM sessions WHERE session_id = ?").bind(sessionId).run();
  },
  async listSessions(env: Env, orgId: string, licenseKey?: string) {
    if (licenseKey) {
      const res = await env.DB.prepare(
        "SELECT s.* FROM sessions s JOIN licenses l ON l.license_key = s.license_key WHERE l.org_id = ? AND s.license_key = ?",
      ).bind(orgId, licenseKey).all();
      return res.results ?? [];
    }
    const res = await env.DB.prepare(
      `SELECT s.* FROM sessions s JOIN licenses l ON l.license_key = s.license_key
       WHERE l.org_id = ? ORDER BY s.last_heartbeat DESC LIMIT 500`,
    ).bind(orgId).all();
    return res.results ?? [];
  },
  async countDistinctMachines(env: Env, licenseKey: string) {
    return env.DB.prepare("SELECT COUNT(DISTINCT machine_id) AS c FROM sessions WHERE license_key = ?")
      .bind(licenseKey).first<{ c: number }>();
  },
  async countDistinctCountries(env: Env, licenseKey: string) {
    return env.DB.prepare("SELECT COUNT(DISTINCT country) AS c FROM sessions WHERE license_key = ?")
      .bind(licenseKey).first<{ c: number }>();
  },
  async getActivation(env: Env, licenseKey: string, machineId: string) {
    return env.DB.prepare(
      "SELECT * FROM license_activations WHERE license_key = ? AND machine_id = ?",
    ).bind(licenseKey, machineId).first<{ license_key: string; machine_id: string; activated_at: number; last_seen_at: number }>();
  },
  async countActivations(env: Env, licenseKey: string) {
    return env.DB.prepare("SELECT COUNT(*) AS c FROM license_activations WHERE license_key = ?")
      .bind(licenseKey).first<{ c: number }>();
  },
  async tryCreateActivation(env: Env, licenseKey: string, machineId: string, now: number, limit: number) {
    try {
      const result = await env.DB.prepare(
        `INSERT INTO license_activations (license_key, machine_id, activated_at, last_seen_at)
         SELECT ?, ?, ?, ?
         WHERE (SELECT COUNT(*) FROM license_activations WHERE license_key = ?) < ?`,
      ).bind(licenseKey, machineId, now, now, licenseKey, limit).run();
      return (result.meta?.changes ?? 0) > 0;
    } catch {
      return false;
    }
  },
  async touchActivation(env: Env, licenseKey: string, machineId: string, now: number) {
    await env.DB.prepare(
      "UPDATE license_activations SET last_seen_at = ? WHERE license_key = ? AND machine_id = ?",
    ).bind(now, licenseKey, machineId).run();
  },
  async listActivations(env: Env, orgId: string, licenseKey: string) {
    const license = await env.DB.prepare("SELECT org_id FROM licenses WHERE license_key = ?")
      .bind(licenseKey).first<{ org_id: string }>();
    if (!license || license.org_id !== orgId) return null;
    const res = await env.DB.prepare(
      "SELECT * FROM license_activations WHERE license_key = ? ORDER BY activated_at ASC",
    ).bind(licenseKey).all();
    return res.results ?? [];
  },
  async deleteActivation(env: Env, licenseKey: string, machineId: string) {
    await env.DB.prepare(
      "DELETE FROM license_activations WHERE license_key = ? AND machine_id = ?",
    ).bind(licenseKey, machineId).run();
  },
  async listActivationsByKey(env: Env, licenseKey: string) {
    const res = await env.DB.prepare(
      "SELECT machine_id, activated_at, last_seen_at FROM license_activations WHERE license_key = ? ORDER BY activated_at ASC",
    ).bind(licenseKey).all();
    return res.results ?? [];
  },
  async deleteSessionsForMachine(env: Env, licenseKey: string, machineId: string) {
    await env.DB.prepare(
      "DELETE FROM sessions WHERE license_key = ? AND machine_id = ?",
    ).bind(licenseKey, machineId).run();
  },
  async getFingerprint(env: Env, licenseKey: string) {
    return env.DB.prepare("SELECT * FROM fingerprints WHERE license_key = ?").bind(licenseKey).first<{
      debug_hits: number; time_anomaly: number; avg_session_time: number;
    }>();
  },
  async upsertFingerprint(env: Env, licenseKey: string, m: number, c: number, d: number, t: number, avg: number, risk: number) {
    await env.DB.prepare(
      `INSERT OR REPLACE INTO fingerprints (license_key, machines_seen, country_changes, debug_hits, time_anomaly, avg_session_time, risk_score)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).bind(licenseKey, m, c, d, t, avg, risk).run();
  },
  async insertFeatureToken(env: Env, licenseKey: string, features: string, serverTime: number, signature: string, issuedAt: number) {
    await env.DB.prepare(
      "INSERT INTO feature_tokens (license_key, features, server_time, signature, issued_at) VALUES (?, ?, ?, ?, ?)",
    ).bind(licenseKey, features, serverTime, signature, issuedAt).run();
  },
  async insertEphemeralToken(env: Env, tokenId: string, licenseKey: string, machineId: string, issuedAt: number, ttl: number) {
    await env.DB.prepare(
      "INSERT INTO ephemeral_tokens (token_id, license_key, machine_id, issued_at, ttl) VALUES (?, ?, ?, ?, ?)",
    ).bind(tokenId, licenseKey, machineId, issuedAt, ttl).run();
  },
  async publishPolicy(env: Env, orgId: string, productId: string | null, policy: string, updatedAt: number) {
    await env.DB.prepare("INSERT INTO policies (org_id, product_id, policy, updated_at) VALUES (?, ?, ?, ?)")
      .bind(orgId, productId, policy, updatedAt).run();
  },
  async listPolicies(env: Env, orgId: string) {
    const res = await env.DB.prepare("SELECT * FROM policies WHERE org_id = ? ORDER BY updated_at DESC")
      .bind(orgId).all();
    return res.results ?? [];
  },
  async getMergedPolicy(env: Env, orgId: string, productId: string) {
    const defaults = {
      max_offline_days: 0, require_heartbeat: true, debug_tolerance: 0,
      soft_checks_probabilities: { heartbeat: 0.1, feature: 0.05 },
      delayed_validation_window: 300,
      time_skew_tolerance_seconds: parseInt(env.TIME_SKEW_TOLERANCE_SECONDS || "60"),
    };
    let row: { policy: string } | null = null;
    if (productId) {
      row = await env.DB.prepare(
        "SELECT policy FROM policies WHERE org_id = ? AND product_id = ? ORDER BY updated_at DESC LIMIT 1",
      ).bind(orgId, productId).first<{ policy: string }>();
    }
    if (!row) {
      row = await env.DB.prepare(
        "SELECT policy FROM policies WHERE org_id = ? AND product_id IS NULL ORDER BY updated_at DESC LIMIT 1",
      ).bind(orgId).first<{ policy: string }>();
    }
    return row ? { ...defaults, ...JSON.parse(row.policy) } : defaults;
  },

  async listApiKeys(env: Env, orgId: string) {
    const res = await env.DB.prepare(
      "SELECT key_id, org_id, name, prefix, created_at, last_used_at, revoked_at FROM api_keys WHERE org_id = ? ORDER BY created_at DESC",
    ).bind(orgId).all<Omit<ApiKeyRow, "key_hash">>();
    return res.results ?? [];
  },
  async getApiKeyByPrefix(env: Env, prefix: string) {
    return env.DB.prepare("SELECT * FROM api_keys WHERE prefix = ? AND revoked_at = 0")
      .bind(prefix).first<ApiKeyRow>();
  },
  async createApiKey(env: Env, row: Omit<ApiKeyRow, "last_used_at" | "revoked_at">) {
    await env.DB.prepare(
      "INSERT INTO api_keys (key_id, org_id, name, prefix, key_hash, created_at, last_used_at, revoked_at) VALUES (?, ?, ?, ?, ?, ?, 0, 0)",
    ).bind(row.key_id, row.org_id, row.name, row.prefix, row.key_hash, row.created_at).run();
  },
  async touchApiKeyUsed(env: Env, keyId: string, at: number) {
    await env.DB.prepare("UPDATE api_keys SET last_used_at = ? WHERE key_id = ?").bind(at, keyId).run();
  },
  async revokeApiKey(env: Env, orgId: string, keyId: string, at: number) {
    await env.DB.prepare(
      "UPDATE api_keys SET revoked_at = ? WHERE key_id = ? AND org_id = ? AND revoked_at = 0",
    ).bind(at, keyId, orgId).run();
  },
  async getApiKey(env: Env, orgId: string, keyId: string) {
    return env.DB.prepare(
      "SELECT key_id, org_id, name, prefix, created_at, last_used_at, revoked_at FROM api_keys WHERE key_id = ? AND org_id = ?",
    ).bind(keyId, orgId).first<Omit<ApiKeyRow, "key_hash">>();
  },

  async createAdminSession(env: Env, row: AdminSessionRow) {
    await env.DB.prepare(
      `INSERT INTO admin_sessions
       (session_id, org_id, user_id, prefix, token_hash, created_at, last_used_at, expires_at, revoked_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    ).bind(
      row.session_id,
      row.org_id,
      row.user_id,
      row.prefix,
      row.token_hash,
      row.created_at,
      row.created_at,
      row.expires_at,
    ).run();
  },
  /** Email and role come from the live user/membership rows, never from the token. */
  async getAdminSessionByPrefix(env: Env, prefix: string) {
    return env.DB.prepare(
      `SELECT s.session_id, s.org_id, s.user_id, s.token_hash, s.expires_at, u.email, m.role
       FROM admin_sessions s
       JOIN users u ON u.user_id = s.user_id
       JOIN org_members m ON m.org_id = s.org_id AND m.user_id = s.user_id
       WHERE s.prefix = ? AND s.revoked_at = 0`,
    ).bind(prefix).first<{
      session_id: string;
      org_id: string;
      user_id: string;
      token_hash: string;
      expires_at: number;
      email: string;
      role: string | null;
    }>();
  },
  async touchAdminSession(env: Env, sessionId: string, at: number) {
    await env.DB.prepare("UPDATE admin_sessions SET last_used_at = ? WHERE session_id = ?")
      .bind(at, sessionId).run();
  },
  async revokeAdminSession(env: Env, sessionId: string, at: number) {
    await env.DB.prepare("UPDATE admin_sessions SET revoked_at = ? WHERE session_id = ? AND revoked_at = 0")
      .bind(at, sessionId).run();
  },
  async deleteExpiredAdminSessions(env: Env, userId: string, now: number) {
    await env.DB.prepare("DELETE FROM admin_sessions WHERE user_id = ? AND (expires_at <= ? OR revoked_at > 0)")
      .bind(userId, now).run();
  },
};
