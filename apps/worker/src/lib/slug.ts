import type { Env } from "../env";
import { db } from "../db";

export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "workspace";
}

export async function uniqueOrgSlug(env: Env, name: string): Promise<string> {
  let slug = slugify(name);
  if (!await db.orgSlugTaken(env, slug)) return slug;
  for (let i = 0; i < 8; i++) {
    const candidate = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    if (!await db.orgSlugTaken(env, candidate)) return candidate;
  }
  return `${slug}-${crypto.randomUUID().slice(0, 8)}`;
}
