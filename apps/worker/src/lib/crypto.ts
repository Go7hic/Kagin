import { base64urlToBytes, parseJWT } from "./utils";
import type { Env } from "../env";

export async function verifyAdminJWT(env: Env, req: Request): Promise<boolean> {
  const auth = req.headers.get("authorization") || "";
  const m = auth.match(/^Bearer\s+(.*)$/i);
  if (!m) return false;
  const token = m[1];
  const jwkJson = env.ADMIN_JWT_PUBLIC_JWK || (await env.KV.get("admin_jwt_public_jwk"));
  if (!jwkJson) return false;
  try {
    const { payload, signature } = parseJWT(token);
    const key = await crypto.subtle.importKey(
      "jwk",
      JSON.parse(jwkJson),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const signedData = new TextEncoder().encode(token.split(".").slice(0, 2).join("."));
    const sigBytes = base64urlToBytes(signature);
    const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, sigBytes, signedData);
    if (!ok) return false;
    if (env.ADMIN_JWT_ISSUER && payload.iss !== env.ADMIN_JWT_ISSUER) return false;
    if (env.ADMIN_JWT_AUDIENCE && payload.aud !== env.ADMIN_JWT_AUDIENCE) return false;
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return false;
    return true;
  } catch {
    return false;
  }
}

export async function signEd25519(privateJwk: string, payload: Record<string, unknown>): Promise<string> {
  const key = await crypto.subtle.importKey("jwk", JSON.parse(privateJwk), { name: "Ed25519" }, false, ["sign"]);
  const data = new TextEncoder().encode(JSON.stringify(payload));
  const sig = await crypto.subtle.sign("Ed25519", key, data);
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

export async function generateEd25519KeyPair(): Promise<{ publicJwk: JsonWebKey; privateJwk: JsonWebKey }> {
  const keyPair = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const publicJwk = (await crypto.subtle.exportKey("jwk", keyPair.publicKey)) as JsonWebKey;
  const privateJwk = (await crypto.subtle.exportKey("jwk", keyPair.privateKey)) as JsonWebKey;
  return { publicJwk, privateJwk };
}
