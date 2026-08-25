import { HTTPException } from "hono/http-exception";
import type { Context } from "hono";
import type { AppBindings, Env } from "../env";
import { db } from "../db";

export const HOSTED_PRODUCT_LIMIT = 5;
export const HOSTED_PRICE_USD = 5;

export function hostedBillingConfigured(env: Env | undefined) {
  return Boolean(env?.STRIPE_SECRET_KEY && env?.STRIPE_PRICE_ID);
}

export function isHostedPaid(status: string | null | undefined) {
  return status === "active" || status === "trialing" || status === "past_due";
}

export async function billingSnapshot(env: Env, orgId: string) {
  const org = await db.getOrg(env, orgId);
  const productCount = await db.countProducts(env, orgId);
  const configured = hostedBillingConfigured(env);
  const paid = !configured || isHostedPaid(org?.billing_status);
  return {
    configured,
    status: org?.billing_status ?? "none",
    paid,
    product_limit: HOSTED_PRODUCT_LIMIT,
    product_count: productCount,
  };
}

export async function assertCanCreateProduct(c: Context<AppBindings>) {
  const admin = c.get("admin");
  if (admin.mode === "legacy") {
    if (hostedBillingConfigured(c.env)) {
      throw new HTTPException(403, { message: "legacy_disabled" });
    }
    return;
  }
  if (!hostedBillingConfigured(c.env)) return;
  const orgId = admin.orgId;
  const snap = await billingSnapshot(c.env, orgId);
  if (!snap.paid) {
    throw new HTTPException(402, { message: "payment_required" });
  }
  if (snap.product_count >= HOSTED_PRODUCT_LIMIT) {
    throw new HTTPException(403, { message: "product_limit" });
  }
}
