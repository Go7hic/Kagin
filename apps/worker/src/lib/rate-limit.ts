import type { Env } from "../env";

export async function rateLimited(
  env: Env,
  key: string,
  limit: number,
  windowSec: number,
): Promise<boolean> {
  if (!env.KV) return false;
  const now = Math.floor(Date.now() / 1000);
  const kvKey = `rl:${key}`;
  const raw = await env.KV.get(kvKey);
  let n = 0;
  let reset = now + windowSec;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { n: number; reset: number };
      if (now < parsed.reset) {
        n = parsed.n;
        reset = parsed.reset;
      }
    } catch {
      n = 0;
    }
  }
  n += 1;
  await env.KV.put(kvKey, JSON.stringify({ n, reset }), { expirationTtl: Math.max(windowSec, 60) });
  return n > limit;
}
