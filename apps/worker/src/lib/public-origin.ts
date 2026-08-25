import type { Env } from "../env";

const LOCAL_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:8787",
  "http://127.0.0.1:8787",
];

export function publicBaseUrl(env: Env | undefined, requestUrl: string): string {
  const configured = env?.PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  return new URL(requestUrl).origin;
}

export function corsAllowOrigin(env: Env | undefined, requestUrl: string, origin: string): string {
  if (!origin) return "";
  const allowed = new Set(LOCAL_ORIGINS);
  allowed.add(new URL(requestUrl).origin);
  const configured = env?.PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (configured) allowed.add(configured);
  return allowed.has(origin) ? origin : "";
}
