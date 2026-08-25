import { describe, it, expect } from "vitest";
import { createApp } from "../src/app";
import { hashToken, randomSecret, verifyTokenHash } from "../src/lib/token";

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
