import type { AdminAuth } from "./types/admin";

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  LicenseDO: DurableObjectNamespace;
  ASSETS: Fetcher;
  HEARTBEAT_TIMEOUT_SECONDS: string;
  TIME_SKEW_TOLERANCE_SECONDS: string;
  FEATURE_SCHEMA_STRICT?: string;
  ADMIN_JWT_PUBLIC_JWK?: string;
  ADMIN_JWT_ISSUER?: string;
  ADMIN_JWT_AUDIENCE?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRICE_ID?: string;
  CONTACT_EMAIL?: string;
  PUBLIC_BASE_URL?: string;
}

export type AppBindings = {
  Bindings: Env;
  Variables: {
    admin: AdminAuth;
  };
};
