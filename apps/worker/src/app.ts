import { Hono } from "hono";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AppBindings } from "./env";
import { adminAuth, requireOrg, requireSessionAdmin } from "./middleware/admin-auth";
import { generateApiKey, hashApiKey } from "./lib/api-key";
import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from "./lib/password";
import { createSession } from "./lib/session";
import { uniqueOrgSlug } from "./lib/slug";
import { errorHandler } from "./middleware/error";
import { db } from "./db";
import { generateEd25519KeyPair, signEd25519 } from "./lib/crypto";
import { signServerTime } from "./lib/server-time";
import { validateFeatures } from "./lib/utils";
import { bindMachine, gateLicense, requireActivatedMachine, requireCustomerIdentity, requireRecentHeartbeat, unbindMachine, usesDeviceBinding, usesFloatingSeats } from "./lib/license-check";
import { normalizeCustomerIdentity } from "./lib/identity";
import { billingSnapshot, HOSTED_PRICE_USD, HOSTED_PRODUCT_LIMIT, hostedBillingConfigured, assertCanCreateProduct } from "./lib/billing";
import { handleStripeEvent, stripeClient } from "./lib/stripe";
import { licenseDOId } from "./do";
import { corsAllowOrigin, publicBaseUrl } from "./lib/public-origin";
import { rateLimited } from "./lib/rate-limit";
import { SECURITY_HEADERS } from "./lib/security-headers";
import { entitledFeatures, parseFeatureSchema } from "./lib/features";
import { resolvedLicenseExpiry, sameLicenseFulfillment } from "./lib/license-issuance";

const heartbeatSchema = z.object({
  license_key: z.string(),
  session_id: z.string(),
  machine_id: z.string(),
  debug_detected: z.boolean().optional(),
  time_anomaly_detected: z.boolean().optional(),
});

const featureTokenSchema = z.object({
  license_key: z.string(),
  features: z.record(z.unknown()),
  machine_id: z.string().optional(),
});

const activateSchema = z.object({
  license_key: z.string(),
  machine_id: z.string(),
  identity: z.string().optional(),
});

const deactivateSchema = z.object({
  license_key: z.string(),
  machine_id: z.string(),
  identity: z.string().optional(),
});

const FEATURE_TOKEN_TTL_SECONDS = 3600;
const AUTH_RATE_LIMIT = 10;
const AUTH_RATE_WINDOW = 15 * 60;
const LICENSE_RATE_LIMIT = 30;
const LICENSE_RATE_WINDOW = 15 * 60;

const ephemeralSchema = z.object({
  license_key: z.string(),
  machine_id: z.string(),
  ttl: z.number().int().min(1).max(86400).optional(),
});

export function createApp() {
  const app = new Hono<AppBindings>();

  app.use("*", cors({
    origin: (origin, c) => corsAllowOrigin(c.env, c.req.url, origin),
  }));
  app.use("*", async (c, next) => {
    await next();
    if (!c.res) return;
    const headers = new Headers(c.res.headers);
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      headers.set(key, value);
    }
    c.res = new Response(c.res.body, {
      status: c.res.status,
      statusText: c.res.statusText,
      headers,
    });
  });
  app.onError(errorHandler);

  app.get("/health", (c) => c.json({ ok: true, service: "kagin" }));

  const v1 = new Hono<AppBindings>();

  v1.get("/meta", (c) => c.json({
    billing_enabled: hostedBillingConfigured(c.env),
    price_usd: HOSTED_PRICE_USD,
    product_limit: HOSTED_PRODUCT_LIMIT,
    contact_email: c.env?.CONTACT_EMAIL || "",
  }));

  v1.post("/stripe/webhook", async (c) => {
    if (!c.env.STRIPE_SECRET_KEY || !c.env.STRIPE_WEBHOOK_SECRET) {
      return c.json({ error: "stripe_not_configured" }, 503);
    }
    const signature = c.req.header("stripe-signature");
    if (!signature) return c.json({ error: "missing_signature" }, 400);
    const payload = await c.req.text();
    let event;
    try {
      event = await stripeClient(c.env).webhooks.constructEventAsync(
        payload,
        signature,
        c.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch {
      return c.json({ error: "invalid_signature" }, 400);
    }
    try {
      await handleStripeEvent(c.env, event);
    } catch {
      return c.json({ error: "webhook_handler_failed" }, 500);
    }
    return c.json({ received: true });
  });

  v1.get("/server-time", async (c) => {
    const payload = { server_time: Math.floor(Date.now() / 1000) };
    const productId = c.req.query("product_id") || "";
    if (!productId) return c.json(payload);
    const orgSlug = c.req.query("org_slug") || "";
    let orgId = "legacy";
    if (orgSlug) {
      const org = await db.getOrgBySlug(c.env, orgSlug);
      if (!org) return c.json({ error: "org_not_found" }, 404);
      orgId = org.org_id;
    }
    const signature = await signServerTime(c.env, orgId, productId, payload);
    return c.json(signature ? { ...payload, signature } : payload);
  });

  v1.get("/policy", async (c) => {
    const productId = c.req.query("product_id") || "";
    const orgSlug = c.req.query("org_slug") || "";
    let orgId = "legacy";
    if (orgSlug) {
      const org = await db.getOrgBySlug(c.env, orgSlug);
      if (!org) return c.json({ error: "org_not_found" }, 404);
      orgId = org.org_id;
    }
    const policy = productId
      ? await db.getMergedPolicy(c.env, orgId, productId)
      : await db.getMergedPolicy(c.env, orgId, "");
    return c.json({ policy });
  });

  v1.post("/activate", zValidator("json", activateSchema), async (c) => {
    const body = c.req.valid("json");
    const gate = await gateLicense(c, body.license_key);
    if (!gate.ok) return c.json({ error: gate.error }, gate.status);

    const identityOk = await requireCustomerIdentity(gate.license, body.identity);
    if (!identityOk.ok) return c.json({ error: identityOk.error }, identityOk.status);

    const bound = await bindMachine(c.env, gate.license, body.machine_id, gate.now);
    if (!bound.ok) return c.json({ error: bound.error }, bound.status);

    const timePayload = {
      issued_at: gate.license.issued_at,
      expires_at: gate.license.expires_at,
      server_time: gate.now,
    };
    const signature = await signServerTime(
      c.env,
      gate.license.org_id,
      gate.license.product_id,
      timePayload,
    );
    const policy = await db.getMergedPolicy(c.env, gate.license.org_id, gate.license.product_id);

    return c.json({
      ok: true,
      activated: true,
      already_bound: bound.already_bound,
      machine_id: body.machine_id,
      devices_used: bound.devices_used,
      devices_limit: bound.devices_limit,
      ...timePayload,
      ...(signature ? { signature } : {}),
      state: gate.license.state,
      policy,
    });
  });

  v1.get("/activations", async (c) => {
    const licenseKey = c.req.query("license_key") || "";
    const identity = c.req.query("identity");
    if (!licenseKey) return c.json({ error: "license_key_required" }, 400);
    const ip = c.req.header("CF-Connecting-IP") || "local";
    if (await rateLimited(c.env, `license:${ip}`, LICENSE_RATE_LIMIT, LICENSE_RATE_WINDOW)) {
      return c.json({ error: "rate_limited" }, 429);
    }
    const gate = await gateLicense(c, licenseKey);
    if (!gate.ok) return c.json({ error: gate.error }, gate.status);
    const limit = gate.license.machine_limit || 0;
    if (limit <= 0) {
      return c.json({ devices: [], devices_used: 0, devices_limit: 0 });
    }
    const identityOk = await requireCustomerIdentity(gate.license, identity);
    if (!identityOk.ok) return c.json({ error: identityOk.error }, identityOk.status);
    const devices = await db.listActivationsByKey(c.env, licenseKey);
    return c.json({
      devices,
      devices_used: devices.length,
      devices_limit: limit,
    });
  });

  v1.post("/deactivate", zValidator("json", deactivateSchema), async (c) => {
    const body = c.req.valid("json");
    const ip = c.req.header("CF-Connecting-IP") || "local";
    if (await rateLimited(c.env, `license:${ip}`, LICENSE_RATE_LIMIT, LICENSE_RATE_WINDOW)) {
      return c.json({ error: "rate_limited" }, 429);
    }
    const gate = await gateLicense(c, body.license_key);
    if (!gate.ok) return c.json({ error: gate.error }, gate.status);
    const identityOk = await requireCustomerIdentity(gate.license, body.identity);
    if (!identityOk.ok) return c.json({ error: identityOk.error }, identityOk.status);
    const result = await unbindMachine(c.env, gate.license, body.machine_id);
    if (!result.ok) return c.json({ error: result.error }, result.status);
    return c.json({
      ok: true,
      deactivated: result.deactivated,
      machine_id: body.machine_id,
      devices_used: result.devices_used,
      devices_limit: result.devices_limit,
    });
  });

  v1.post("/heartbeat", zValidator("json", heartbeatSchema), async (c) => {
    const body = c.req.valid("json");
    const gate = await gateLicense(c, body.license_key);
    if (!gate.ok) return c.json({ error: gate.error }, gate.status);

    const { license, country, ip, now } = gate;

    const machineOk = await requireActivatedMachine(c.env, license, body.machine_id);
    if (!machineOk.ok) return c.json({ error: machineOk.error }, machineOk.status);
    if ((license.machine_limit || 0) > 0) {
      await db.touchActivation(c.env, license.license_key, body.machine_id, now);
    }

    const heartbeatTimeout = parseInt(c.env.HEARTBEAT_TIMEOUT_SECONDS || "120");
    if (usesFloatingSeats(license)) {
      const stub = c.env.LicenseDO.get(licenseDOId(c.env, body.license_key));
      const resp = await stub.fetch("https://do/heartbeat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          seat_limit: license.seat_limit || 0,
          heartbeat_timeout: heartbeatTimeout,
          now,
          session_id: body.session_id,
          machine_id: body.machine_id,
        }),
      });
      const data = await resp.json() as { error?: string };
      if (data.error) return c.json(data, 429);
    }

    const timePayload = { issued_at: license.issued_at, expires_at: license.expires_at, server_time: now };
    const signature = await signServerTime(c.env, license.org_id, license.product_id, timePayload);
    await db.upsertSession(c.env, body.session_id, body.license_key, body.machine_id, now, country, ip);

    const fp = await db.getFingerprint(c.env, body.license_key);
    const uniqueMachines = await db.countDistinctMachines(c.env, body.license_key);
    const uniqueCountries = await db.countDistinctCountries(c.env, body.license_key);
    const debugHits = (fp?.debug_hits || 0) + (body.debug_detected ? 1 : 0);
    const timeAnomaly = (fp?.time_anomaly || 0) + (body.time_anomaly_detected ? 1 : 0);
    const prevAvg = fp?.avg_session_time || 0;
    const avgSessionTime = prevAvg > 0 ? Math.floor(prevAvg * 0.9 + heartbeatTimeout * 0.1) : heartbeatTimeout;
    const risk = (uniqueMachines?.c || 0) * 5 + (uniqueCountries?.c || 0) * 10 + debugHits * 20 + (timeAnomaly > 0 ? 30 : 0);
    await db.upsertFingerprint(c.env, body.license_key, uniqueMachines?.c || 0, uniqueCountries?.c || 0, debugHits, timeAnomaly, avgSessionTime, risk);

    let newState = license.state || "active";
    if (risk >= 80) newState = "restricted";
    else if (risk >= 40 && newState === "active") newState = "grace";
    const graceUntil = newState === "grace" ? now + 86400 : license.grace_until || 0;
    if (newState !== license.state || graceUntil !== license.grace_until) {
      await db.updateLicenseState(c.env, body.license_key, newState, graceUntil);
    }

    const policy = await db.getMergedPolicy(c.env, license.org_id, license.product_id);
    const rand = Math.random();
    const softChecks: string[] = [];
    const pHeartbeat = policy.soft_checks_probabilities?.heartbeat ?? 0.1;
    const pFeature = policy.soft_checks_probabilities?.feature ?? 0.05;
    if (rand < pHeartbeat) softChecks.push("extra_heartbeat_check");
    if (rand >= pHeartbeat && rand < pHeartbeat + pFeature) softChecks.push("feature_revalidation_hint");

    return c.json({
      ok: true,
      ...timePayload,
      ...(signature ? { signature } : {}),
      state: newState,
      grace_until: graceUntil,
      policy,
      soft_checks: softChecks,
    });
  });

  v1.post("/feature-token", zValidator("json", featureTokenSchema), async (c) => {
    const { license_key, features, machine_id } = c.req.valid("json");
    const gate = await gateLicense(c, license_key);
    if (!gate.ok) return c.json({ error: gate.error }, gate.status);

    if ((gate.license.machine_limit || 0) > 0) {
      if (!machine_id) return c.json({ error: "machine_id_required" }, 400);
      const machineOk = await requireActivatedMachine(c.env, gate.license, machine_id);
      if (!machineOk.ok) return c.json({ error: machineOk.error }, machineOk.status);
    }

    const license = gate.license;
    const online = await requireRecentHeartbeat(c.env, license, gate.now);
    if (!online.ok) return c.json({ error: online.error }, online.status);

    const entitled = entitledFeatures(license.features, features);
    if (!entitled.ok) return c.json({ error: entitled.error }, 403);

    const product = await db.getProduct(c.env, license.org_id, license.product_id);
    if (!product?.private_jwk) return c.json({ error: "product_not_configured" }, 400);
    const schema = parseFeatureSchema(product.feature_schema);
    if (schema) {
      const strict = c.env.FEATURE_SCHEMA_STRICT !== "false";
      const valid = validateFeatures(schema, entitled.features, strict);
      if (!valid.ok) return c.json({ error: "features_invalid", details: valid.errors }, 400);
    }
    const server_time = Math.floor(Date.now() / 1000);
    const exp = server_time + FEATURE_TOKEN_TTL_SECONDS;
    const payload = { license_key, features: entitled.features, server_time, exp };
    const signature = await signEd25519(product.private_jwk, payload);
    const quotas = schema?.quotas || {};
    await db.insertFeatureToken(c.env, license_key, JSON.stringify(entitled.features), server_time, signature, server_time);
    return c.json({ features: entitled.features, server_time, exp, signature, quotas });
  });

  v1.post("/ephemeral-token", zValidator("json", ephemeralSchema), async (c) => {
    const { license_key, machine_id, ttl = 3600 } = c.req.valid("json");
    const gate = await gateLicense(c, license_key);
    if (!gate.ok) return c.json({ error: gate.error }, gate.status);
    const online = await requireRecentHeartbeat(c.env, gate.license, gate.now);
    if (!online.ok) return c.json({ error: online.error }, online.status);

    if ((gate.license.machine_limit || 0) > 0) {
      const machineOk = await requireActivatedMachine(c.env, gate.license, machine_id);
      if (!machineOk.ok) return c.json({ error: machineOk.error }, machineOk.status);
    }

    const token_id = crypto.randomUUID();
    const issued_at = Math.floor(Date.now() / 1000);
    await db.insertEphemeralToken(c.env, token_id, license_key, machine_id, issued_at, ttl);
    return c.json({ token_id, issued_at, ttl });
  });

  app.route("/v1", v1);

  const admin = new Hono<AppBindings>();

  admin.post("/auth/signup", zValidator("json", z.object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
    org_name: z.string().min(1).max(120),
  })), async (c) => {
    const ip = c.req.header("CF-Connecting-IP") || "local";
    if (await rateLimited(c.env, `signup:${ip}`, AUTH_RATE_LIMIT, AUTH_RATE_WINDOW)) {
      return c.json({ error: "rate_limited" }, 429);
    }
    const { email, password, org_name } = c.req.valid("json");
    const existing = await db.getUserByEmail(c.env, email);
    if (existing) return c.json({ error: "email_taken" }, 409);
    const now = Math.floor(Date.now() / 1000);
    const userId = crypto.randomUUID();
    const orgId = crypto.randomUUID();
    const slug = await uniqueOrgSlug(c.env, org_name);
    const passwordHash = await hashPassword(password);
    await db.createUser(c.env, userId, email, passwordHash, now);
    await db.createOrganization(c.env, orgId, org_name, slug, now);
    await db.addOrgMember(c.env, orgId, userId, "owner");
    const token = await createSession(c.env, userId, orgId, now);
    return c.json({
      token,
      user: { user_id: userId, email: email.toLowerCase() },
      org: { org_id: orgId, name: org_name, slug },
    }, 201);
  });

  admin.post("/auth/login", zValidator("json", z.object({
    email: z.string().email(),
    password: z.string().min(1).max(128),
  })), async (c) => {
    const ip = c.req.header("CF-Connecting-IP") || "local";
    if (await rateLimited(c.env, `login:${ip}`, AUTH_RATE_LIMIT, AUTH_RATE_WINDOW)) {
      return c.json({ error: "rate_limited" }, 429);
    }
    const { email, password } = c.req.valid("json");
    const user = await db.getUserByEmail(c.env, email);
    const ok = await verifyPassword(password, user?.password_hash || DUMMY_PASSWORD_HASH);
    if (!user || !ok) {
      return c.json({ error: "invalid_credentials" }, 401);
    }
    const membership = await db.getPrimaryMembership(c.env, user.user_id);
    if (!membership) return c.json({ error: "no_org" }, 403);
    const now = Math.floor(Date.now() / 1000);
    await db.deleteExpiredAdminSessions(c.env, user.user_id, now);
    const token = await createSession(c.env, user.user_id, membership.org_id, now);
    return c.json({
      token,
      user: { user_id: user.user_id, email: user.email },
      org: { org_id: membership.org_id, name: membership.org_name, slug: membership.org_slug },
    });
  });

  admin.use("*", adminAuth);

  admin.get("/auth/me", async (c) => {
    const admin = c.get("admin");
    if (admin.mode !== "saas" || !admin.userId) {
      return c.json({
        mode: admin.mode,
        org_id: admin.orgId,
        billing: await billingSnapshot(c.env, admin.orgId),
      });
    }
    const membership = await db.getPrimaryMembership(c.env, admin.userId);
    return c.json({
      mode: admin.mode,
      user: { user_id: admin.userId, email: admin.email },
      org: membership
        ? { org_id: membership.org_id, name: membership.org_name, slug: membership.org_slug, role: membership.role }
        : { org_id: admin.orgId, role: admin.role },
      billing: await billingSnapshot(c.env, admin.orgId),
    });
  });

  admin.post("/auth/logout", async (c) => {
    const { sessionId } = c.get("admin");
    if (sessionId) await db.revokeAdminSession(c.env, sessionId, Math.floor(Date.now() / 1000));
    return c.json({ ok: true });
  });

  admin.get("/api-keys", async (c) => {
    requireSessionAdmin(c);
    return c.json(await db.listApiKeys(c.env, requireOrg(c)));
  });
  admin.post("/api-keys", zValidator("json", z.object({ name: z.string().min(1).max(120) })), async (c) => {
    requireSessionAdmin(c);
    const orgId = requireOrg(c);
    const { name } = c.req.valid("json");
    const { key_id, api_key, prefix } = generateApiKey();
    const created_at = Math.floor(Date.now() / 1000);
    await db.createApiKey(c.env, {
      key_id,
      org_id: orgId,
      name,
      prefix,
      key_hash: await hashApiKey(api_key),
      created_at,
    });
    return c.json({ key_id, name, prefix, api_key, created_at }, 201);
  });
  admin.post("/api-keys/:id/revoke", async (c) => {
    requireSessionAdmin(c);
    const orgId = requireOrg(c);
    const keyId = c.req.param("id");
    const row = await db.getApiKey(c.env, orgId, keyId);
    if (!row) return c.json({ error: "not_found" }, 404);
    await db.revokeApiKey(c.env, orgId, keyId, Math.floor(Date.now() / 1000));
    return c.json({ ok: true });
  });

  admin.post("/billing/checkout", zValidator("json", z.object({
    locale: z.enum(["en", "zh", "ja"]).optional(),
  })), async (c) => {
    requireSessionAdmin(c);
    const sessionAdmin = c.get("admin");
    if (sessionAdmin.mode !== "saas" || !sessionAdmin.email) {
      return c.json({ error: "saas_required" }, 403);
    }
    if (!hostedBillingConfigured(c.env) || !c.env.STRIPE_PRICE_ID) {
      return c.json({ error: "stripe_not_configured" }, 503);
    }
    const locale = c.req.valid("json").locale ?? "en";
    const origin = publicBaseUrl(c.env, c.req.url);
    const stripe = stripeClient(c.env);
    const org = await db.getOrg(c.env, sessionAdmin.orgId);
    let customerId = org?.stripe_customer_id || "";
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: sessionAdmin.email,
        metadata: { org_id: sessionAdmin.orgId },
      });
      customerId = customer.id;
      await db.setOrgBilling(c.env, sessionAdmin.orgId, {
        stripe_customer_id: customerId,
        billing_status: org?.billing_status ?? "none",
      });
    }
    const suffix = Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map((n) => String.fromCharCode(97 + (n % 26)))
      .join("");
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: sessionAdmin.orgId,
      line_items: [{ price: c.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${origin}/${locale}/admin/billing`,
      cancel_url: `${origin}/${locale}/pricing`,
      metadata: { org_id: sessionAdmin.orgId },
      subscription_data: { metadata: { org_id: sessionAdmin.orgId } },
      integration_identifier: `kagin_hosted_${suffix}`,
    } as Parameters<typeof stripe.checkout.sessions.create>[0]);
    return c.json({ url: checkout.url });
  });

  admin.post("/billing/portal", zValidator("json", z.object({
    locale: z.enum(["en", "zh", "ja"]).optional(),
  })), async (c) => {
    requireSessionAdmin(c);
    const sessionAdmin = c.get("admin");
    if (sessionAdmin.mode !== "saas") return c.json({ error: "saas_required" }, 403);
    if (!hostedBillingConfigured(c.env)) return c.json({ error: "stripe_not_configured" }, 503);
    const org = await db.getOrg(c.env, sessionAdmin.orgId);
    if (!org?.stripe_customer_id) return c.json({ error: "no_customer" }, 400);
    const locale = c.req.valid("json").locale ?? "en";
    const origin = publicBaseUrl(c.env, c.req.url);
    const portal = await stripeClient(c.env).billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: `${origin}/${locale}/admin/billing`,
    });
    return c.json({ url: portal.url });
  });

  admin.get("/products", async (c) => c.json(await db.listProducts(c.env, requireOrg(c))));
  admin.post("/products", zValidator("json", z.object({ product_id: z.string(), name: z.string() })), async (c) => {
    const orgId = requireOrg(c);
    await assertCanCreateProduct(c);
    const { product_id, name } = c.req.valid("json");
    await db.createProduct(c.env, orgId, product_id, name);
    return c.json({ ok: true }, 201);
  });
  admin.delete("/products/:id", async (c) => {
    await db.deleteProduct(c.env, requireOrg(c), c.req.param("id"));
    return c.json({ ok: true });
  });
  admin.post("/products/:id/keypair", async (c) => {
    const orgId = requireOrg(c);
    const id = c.req.param("id");
    const { publicJwk, privateJwk } = await generateEd25519KeyPair();
    await db.updateProductKeys(c.env, orgId, id, JSON.stringify(publicJwk), JSON.stringify(privateJwk));
    return c.json({ ok: true });
  });
  admin.put("/products/:id/features", zValidator("json", z.record(z.unknown())), async (c) => {
    await db.updateFeatureSchema(c.env, requireOrg(c), c.req.param("id"), JSON.stringify(c.req.valid("json")));
    return c.json({ ok: true });
  });

  admin.get("/licenses", async (c) => {
    const productId = c.req.query("product_id");
    return c.json(await db.listLicenses(c.env, requireOrg(c), productId || undefined));
  });
  admin.post("/licenses", zValidator("json", z.object({
    product_id: z.string(), type: z.enum(["perpetual", "subscription", "floating"]),
    expires_at: z.number().int().nonnegative().optional(),
    external_reference: z.string().trim().min(1).max(255).optional(),
    features: z.record(z.unknown()).optional(), seat_limit: z.number().int().min(0).optional(),
    machine_limit: z.number().int().min(0).optional(), allowed_countries: z.array(z.string()).optional(),
    allowed_ips: z.array(z.string()).optional(), anti_debug: z.record(z.unknown()).optional(),
    status: z.string().optional(), customer_identity: z.string().optional(),
  })), async (c) => {
    const orgId = requireOrg(c);
    const body = c.req.valid("json");
    const features = body.features || {};
    const product = await db.getProduct(c.env, orgId, body.product_id);
    if (!product) return c.json({ error: "product_not_found" }, 404);
    const schema = parseFeatureSchema(product.feature_schema);
    if (schema) {
      const valid = validateFeatures(schema, features, c.env.FEATURE_SCHEMA_STRICT !== "false");
      if (!valid.ok) return c.json({ error: "features_invalid", details: valid.errors }, 400);
    }
    const issued_at = Math.floor(Date.now() / 1000);
    const expires_at = resolvedLicenseExpiry(body.type, body.expires_at, issued_at);
    if (expires_at === null) return c.json({ error: "invalid_expires_at" }, 400);
    const license_key = crypto.randomUUID();
    const customer_identity = normalizeCustomerIdentity(body.customer_identity || "");
    const requested = {
      license_key, org_id: orgId, product_id: body.product_id, type: body.type, expires_at,
      features: JSON.stringify(features), seat_limit: body.seat_limit || 0, machine_limit: body.machine_limit || 0,
      allowed_countries: JSON.stringify(body.allowed_countries || []), blocked_countries: "[]",
      allowed_ips: JSON.stringify(body.allowed_ips || []), anti_debug: JSON.stringify(body.anti_debug || {}),
      issued_at, status: body.status || "active", state: "active", grace_until: 0, customer_identity,
      external_reference: body.external_reference || null,
    };
    if (requested.external_reference) {
      const existing = await db.getLicenseByExternalReference(c.env, orgId, requested.external_reference);
      if (existing) {
        if (!sameLicenseFulfillment(existing, requested)) {
          return c.json({ error: "external_reference_conflict" }, 409);
        }
        return c.json({ license_key: existing.license_key, created: false }, 200);
      }
    }
    try {
      await db.createLicense(c.env, requested);
    } catch (error) {
      if (requested.external_reference) {
        const existing = await db.getLicenseByExternalReference(c.env, orgId, requested.external_reference);
        if (existing) {
          if (!sameLicenseFulfillment(existing, requested)) {
            return c.json({ error: "external_reference_conflict" }, 409);
          }
          return c.json({ license_key: existing.license_key, created: false }, 200);
        }
      }
      throw error;
    }
    return c.json({ license_key, created: true }, 201);
  });
  admin.get("/licenses/:key", async (c) => {
    const row = await db.getLicense(c.env, c.req.param("key"));
    const orgId = requireOrg(c);
    if (!row || row.org_id !== orgId) return c.json({ error: "not_found" }, 404);
    return c.json(row);
  });
  admin.post("/licenses/:key/revoke", async (c) => {
    const orgId = requireOrg(c);
    const key = c.req.param("key");
    const row = await db.getLicense(c.env, key);
    if (!row || row.org_id !== orgId) return c.json({ error: "not_found" }, 404);
    await db.revokeLicense(c.env, orgId, key);
    return c.json({ ok: true });
  });
  admin.get("/licenses/:key/sessions", async (c) => {
    const orgId = requireOrg(c);
    const key = c.req.param("key");
    const row = await db.getLicense(c.env, key);
    if (!row || row.org_id !== orgId) return c.json({ error: "not_found" }, 404);
    return c.json(await db.listSessions(c.env, orgId, key));
  });
  admin.get("/licenses/:key/activations", async (c) => {
    const orgId = requireOrg(c);
    const key = c.req.param("key");
    const row = await db.getLicense(c.env, key);
    if (!row || row.org_id !== orgId) return c.json({ error: "not_found" }, 404);
    return c.json(await db.listActivations(c.env, orgId, key));
  });
  admin.post("/licenses/:key/activations", zValidator("json", z.object({
    machine_id: z.string().trim().min(1).max(256),
  })), async (c) => {
    const orgId = requireOrg(c);
    const key = c.req.param("key");
    const { machine_id } = c.req.valid("json");
    const row = await db.getLicense(c.env, key);
    if (!row || row.org_id !== orgId) return c.json({ error: "not_found" }, 404);
    if (!usesDeviceBinding(row)) return c.json({ error: "device_binding_disabled" }, 400);
    if (row.status !== "active") return c.json({ error: "license_not_active" }, 403);
    const now = Math.floor(Date.now() / 1000);
    const bound = await bindMachine(c.env, row, machine_id, now);
    if (!bound.ok) return c.json({ error: bound.error }, bound.status);
    return c.json({
      ok: true,
      activated: true,
      already_bound: bound.already_bound,
      machine_id,
      devices_used: bound.devices_used,
      devices_limit: bound.devices_limit,
    }, bound.already_bound ? 200 : 201);
  });
  admin.delete("/licenses/:key/activations/:machine_id", async (c) => {
    const orgId = requireOrg(c);
    const key = c.req.param("key");
    const machineId = c.req.param("machine_id");
    const row = await db.getLicense(c.env, key);
    if (!row || row.org_id !== orgId) return c.json({ error: "not_found" }, 404);
    const result = await unbindMachine(c.env, row, machineId);
    if (!result.ok) return c.json({ error: result.error }, result.status);
    return c.json({
      ok: true,
      deactivated: result.deactivated,
      machine_id: machineId,
      devices_used: result.devices_used,
      devices_limit: result.devices_limit,
    });
  });
  admin.post("/licenses/:key/kick", zValidator("json", z.object({ session_id: z.string() })), async (c) => {
    const { session_id } = c.req.valid("json");
    const orgId = requireOrg(c);
    const licenseKey = c.req.param("key");
    const row = await db.getLicense(c.env, licenseKey);
    if (!row || row.org_id !== orgId) return c.json({ error: "not_found" }, 404);
    const stub = c.env.LicenseDO.get(licenseDOId(c.env, licenseKey));
    const r = await stub.fetch("https://do/admin/kick", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ session_id }),
    });
    if (!r.ok) return c.json({ error: "kick_failed" }, 500);
    await db.deleteSession(c.env, session_id);
    return c.json({ ok: true });
  });
  admin.post("/licenses/bulk", async (c) => {
    const orgId = requireOrg(c);
    const text = await c.req.text();
    const rows = text.trim().split(/\r?\n/);
    const created: string[] = [];
    for (const line of rows.slice(1)) {
      const [product_id, type, expires_at, seat_limit, machine_limit, customer_identity] = line.split(",");
      if (!product_id) continue;
      const product = await db.getProduct(c.env, orgId, product_id);
      if (!product) continue;
      const license_key = crypto.randomUUID();
      const issued_at = Math.floor(Date.now() / 1000);
      const resolvedExpiry = resolvedLicenseExpiry(type, parseInt(expires_at), issued_at);
      if (resolvedExpiry === null) continue;
      await db.createLicense(c.env, {
        license_key, org_id: orgId, product_id, type,
        expires_at: resolvedExpiry, features: "{}",
        seat_limit: parseInt(seat_limit || "0"), machine_limit: parseInt(machine_limit || "0"),
        allowed_countries: "[]", blocked_countries: "[]", allowed_ips: "[]", anti_debug: "{}",
        issued_at, status: "active", state: "active", grace_until: 0,
        customer_identity: normalizeCustomerIdentity(customer_identity || ""),
        external_reference: null,
      });
      created.push(license_key);
    }
    return c.json({ created });
  });

  admin.get("/sessions", async (c) => c.json(await db.listSessions(c.env, requireOrg(c))));
  admin.get("/policies", async (c) => c.json(await db.listPolicies(c.env, requireOrg(c))));
  admin.post("/policies", zValidator("json", z.object({ product_id: z.string().nullable().optional(), policy: z.record(z.unknown()) })), async (c) => {
    const { product_id = null, policy } = c.req.valid("json");
    await db.publishPolicy(c.env, requireOrg(c), product_id, JSON.stringify(policy), Math.floor(Date.now() / 1000));
    return c.json({ ok: true });
  });

  app.route("/admin/v1", admin);

  app.get("*", async (c) => {
    try {
      let res = await c.env.ASSETS.fetch(c.req.raw);
      if (res.status === 404) {
        const indexUrl = new URL("/index.html", c.req.url);
        res = await c.env.ASSETS.fetch(new Request(indexUrl.toString(), c.req.raw));
      }
      if (res.status >= 400) return c.json({ error: "not_found" }, 404);
      return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
      });
    } catch (err) {
      console.error(err);
      return c.json({ error: "internal_error" }, 500);
    }
  });

  return app;
}
