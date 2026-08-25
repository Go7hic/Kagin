import type { Env } from "../env";
import { db } from "../db";
import { hashToken, randomSecret, verifyTokenHash } from "./token";

export const SESSION_PREFIX = "kagin_sess_";
export const SESSION_PREFIX_LEN = 19;
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export type SessionAdmin = {
  session_id: string;
  user_id: string;
  org_id: string;
  email: string;
  role: string;
};

export async function createSession(env: Env, userId: string, orgId: string, now: number): Promise<string> {
  const token = `${SESSION_PREFIX}${randomSecret()}`;
  await db.createAdminSession(env, {
    session_id: crypto.randomUUID(),
    org_id: orgId,
    user_id: userId,
    prefix: token.slice(0, SESSION_PREFIX_LEN),
    token_hash: await hashToken(token),
    created_at: now,
    expires_at: now + SESSION_TTL_SECONDS,
  });
  return token;
}

export async function resolveSession(env: Env, token: string): Promise<SessionAdmin | null> {
  if (!token.startsWith(SESSION_PREFIX)) return null;
  const row = await db.getAdminSessionByPrefix(env, token.slice(0, SESSION_PREFIX_LEN));
  if (!row) return null;
  const now = Math.floor(Date.now() / 1000);
  if (row.expires_at <= now) return null;
  if (!(await verifyTokenHash(token, row.token_hash))) return null;
  await db.touchAdminSession(env, row.session_id, now);
  return {
    session_id: row.session_id,
    user_id: row.user_id,
    org_id: row.org_id,
    email: row.email,
    role: row.role || "owner",
  };
}
