import { describe, it, expect } from "vitest";
import { createApp } from "../src/app";
import { hashToken, randomSecret, verifyTokenHash } from "../src/lib/token";
import { PERPETUAL_EXPIRES_AT, resolvedLicenseExpiry, sameLicenseFulfillment } from "../src/lib/license-issuance";
import type { LicenseRow } from "../src/db";

describe("hono app", () => {
  const app = createApp();

  it("GET /health", async () => {
    const res = await app.request("http://localhost/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true });
  });

  it("GET /admin/v1/products returns 401 without a token", async () => {
    const res = await app.request("http://localhost/admin/v1/products");
    expect(res.status).toBe(401);
  });

  it("GET /v1/meta reports billing disabled without Stripe", async () => {
    const res = await app.request("http://localhost/v1/meta");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ billing_enabled: false, price_usd: 5, product_limit: 5 });
  });

  it("only the exact token matches a stored hash", async () => {
    const token = `kagin_sess_${randomSecret()}`;
    const stored = await hashToken(token);
    expect(await verifyTokenHash(token, stored)).toBe(true);
    expect(await verifyTokenHash(`${token}x`, stored)).toBe(false);
  });
});

describe("feature entitlements", () => {
  it("rejects keys that are not on the license", async () => {
    const { entitledFeatures } = await import("../src/lib/features");
    expect(entitledFeatures("{\"tier\":\"pro\"}", { tier: "enterprise" }).ok).toBe(false);
    expect(entitledFeatures("{\"tier\":\"pro\"}", { tier: "pro" }).ok).toBe(true);
    expect(entitledFeatures("{}", { tier: "pro" }).ok).toBe(false);
  });

  it("treats empty product schema as unset", async () => {
    const { parseFeatureSchema } = await import("../src/lib/features");
    expect(parseFeatureSchema("{}")).toBeNull();
    expect(parseFeatureSchema("{\"properties\":{}}")).toBeNull();
    expect(parseFeatureSchema("{\"properties\":{\"tier\":\"string\"}}")).not.toBeNull();
  });
});

describe("license fulfillment", () => {
  const requested: LicenseRow = {
    license_key: "new-key",
    org_id: "org-1",
    product_id: "emulux",
    type: "perpetual",
    expires_at: PERPETUAL_EXPIRES_AT,
    features: "{\"export\":true,\"tier\":\"full\"}",
    seat_limit: 0,
    machine_limit: 2,
    allowed_countries: "[]",
    blocked_countries: "[]",
    allowed_ips: "[]",
    anti_debug: "{}",
    issued_at: 1_700_000_000,
    status: "active",
    state: "active",
    grace_until: 0,
    customer_identity: "buyer@example.com",
    external_reference: "stripe:cs_test_123",
  };

  it("gives perpetual licenses a stable wire expiry without requiring expires_at", () => {
    expect(resolvedLicenseExpiry("perpetual", undefined, 1_700_000_000)).toBe(PERPETUAL_EXPIRES_AT);
    expect(resolvedLicenseExpiry("subscription", undefined, 1_700_000_000)).toBeNull();
    expect(resolvedLicenseExpiry("subscription", 1_800_000_000, 1_700_000_000)).toBe(1_800_000_000);
  });

  it("accepts an exact retry even when JSON object key order differs", () => {
    const existing = { ...requested, license_key: "existing-key", features: "{\"tier\":\"full\",\"export\":true}" };
    expect(sameLicenseFulfillment(existing, requested)).toBe(true);
  });

  it("does not reissue a key after the existing license was later revoked", () => {
    const existing = { ...requested, license_key: "existing-key", status: "revoked", state: "revoked" };
    expect(sameLicenseFulfillment(existing, requested)).toBe(true);
  });

  it("rejects reuse of an external reference for another buyer", () => {
    const existing = { ...requested, license_key: "existing-key", customer_identity: "other@example.com" };
    expect(sameLicenseFulfillment(existing, requested)).toBe(false);
  });
});
