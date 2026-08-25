function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function randomSecret(length = 32): string {
  return bytesToBase64(crypto.getRandomValues(new Uint8Array(length)))
    .replace(/[+/=]/g, "")
    .slice(0, length);
}

export async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return bytesToBase64(new Uint8Array(hash));
}

export async function verifyTokenHash(token: string, storedHash: string): Promise<boolean> {
  const actual = base64ToBytes(await hashToken(token));
  const expected = base64ToBytes(storedHash);
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}
