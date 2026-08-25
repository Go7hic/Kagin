const ALLOWED = new Set(["/pricing", "/admin", "/admin/billing"]);

export function safeNextPath(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const path = value.replace(/\/+$/, "") || "/";
  if (!ALLOWED.has(path)) return undefined;
  return path;
}
