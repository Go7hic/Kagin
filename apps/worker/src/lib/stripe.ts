import Stripe from "stripe";
import type { Env } from "../env";
import { db } from "../db";

export function stripeClient(env: Env) {
  if (!env.STRIPE_SECRET_KEY) throw new Error("stripe_not_configured");
  return new Stripe(env.STRIPE_SECRET_KEY);
}

function asCustomerId(value: unknown): string | null {
  if (typeof value === "string" && value) return value;
  if (value && typeof value === "object" && "id" in value && typeof value.id === "string") {
    return value.id;
  }
  return null;
}

function asSubscriptionId(value: unknown): string | null {
  if (typeof value === "string" && value) return value;
  if (value && typeof value === "object" && "id" in value && typeof value.id === "string") {
    return value.id;
  }
  return null;
}

export async function applySubscriptionToOrg(
  env: Env,
  orgId: string,
  subscription: Stripe.Subscription,
  customerId?: string | null,
) {
  if (env.STRIPE_PRICE_ID) {
    const ok = subscription.items.data.some((item) => {
      const price = item.price;
      const id = typeof price === "string" ? price : price?.id;
      return id === env.STRIPE_PRICE_ID;
    });
    if (!ok) throw new Error("price_mismatch");
  }
  const resolvedCustomer = customerId ?? asCustomerId(subscription.customer);
  const org = await db.getOrg(env, orgId);
  if (org?.stripe_customer_id && resolvedCustomer && org.stripe_customer_id !== resolvedCustomer) {
    throw new Error("customer_mismatch");
  }
  await db.setOrgBilling(env, orgId, {
    stripe_customer_id: resolvedCustomer,
    stripe_subscription_id: subscription.id,
    billing_status: subscription.status,
  });
}

export async function handleStripeEvent(env: Env, event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription") return;
      const orgId = session.client_reference_id || session.metadata?.org_id;
      const customerId = asCustomerId(session.customer);
      const subscriptionId = asSubscriptionId(session.subscription);
      if (!orgId || !subscriptionId) throw new Error("missing_checkout_reference");
      const stripe = stripeClient(env);
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await applySubscriptionToOrg(env, orgId, subscription, customerId);
      return;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const orgId = subscription.metadata?.org_id;
      const org = orgId
        ? await db.getOrg(env, orgId)
        : await db.getOrgByStripeSubscription(env, subscription.id)
          ?? await db.getOrgByStripeCustomer(env, asCustomerId(subscription.customer) || "");
      if (!org) {
        if (event.type === "customer.subscription.deleted") return;
        throw new Error("org_not_found");
      }
      await applySubscriptionToOrg(env, org.org_id, subscription);
      return;
    }
    default:
      return;
  }
}
