import type { Env } from "../env";
import { db } from "../db";
import { signEd25519 } from "./crypto";

/**
 * Signed with the product's Ed25519 private key so clients can verify with the
 * public key they already ship. Returns undefined when the product has no
 * keypair yet — the response then carries an unsigned time.
 */
export async function signServerTime(
  env: Env,
  orgId: string,
  productId: string,
  payload: Record<string, number>,
): Promise<string | undefined> {
  const product = await db.getProduct(env, orgId, productId);
  if (!product?.private_jwk) return undefined;
  return signEd25519(product.private_jwk, payload);
}
