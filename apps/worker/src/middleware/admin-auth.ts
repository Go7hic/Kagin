import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppBindings } from "../env";
import { API_KEY_PREFIX, API_KEY_PREFIX_LEN, verifyApiKeyHash } from "../lib/api-key";
import { verifyAdminJWT } from "../lib/crypto";
import { resolveSession } from "../lib/session";
import { hostedBillingConfigured } from "../lib/billing";
import { db } from "../db";

export async function adminAuth(c: Context<AppBindings>, next: Next) {
  const auth = c.req.header("authorization") || "";
  const m = auth.match(/^Bearer\s+(.*)$/i);
  if (!m) throw new HTTPException(401, { message: "unauthorized" });
  const token = m[1];

  if (token.startsWith(API_KEY_PREFIX)) {
    const prefix = token.slice(0, API_KEY_PREFIX_LEN);
    const row = await db.getApiKeyByPrefix(c.env, prefix);
    if (!row || !await verifyApiKeyHash(token, row.key_hash)) {
      throw new HTTPException(401, { message: "unauthorized" });
    }
    await db.touchApiKeyUsed(c.env, row.key_id, Math.floor(Date.now() / 1000));
    c.set("admin", { orgId: row.org_id, mode: "api_key", apiKeyId: row.key_id });
    await next();
    return;
  }

  const session = await resolveSession(c.env, token);
  if (session) {
    c.set("admin", {
      orgId: session.org_id,
      userId: session.user_id,
      email: session.email,
      role: session.role,
      sessionId: session.session_id,
      mode: "saas",
    });
    await next();
    return;
  }

  const legacyOk = await verifyAdminJWT(c.env, c.req.raw);
  if (legacyOk) {
    if (hostedBillingConfigured(c.env)) {
      throw new HTTPException(403, { message: "legacy_disabled" });
    }
    c.set("admin", { orgId: "legacy", mode: "legacy" });
    await next();
    return;
  }

  throw new HTTPException(401, { message: "unauthorized" });
}

export function requireOrg(c: Context<AppBindings>): string {
  return c.get("admin").orgId;
}

export function requireSessionAdmin(c: Context<AppBindings>) {
  const admin = c.get("admin");
  if (admin.mode === "api_key") {
    throw new HTTPException(403, { message: "session_required" });
  }
}
