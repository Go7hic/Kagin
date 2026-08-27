import type { LicenseRow } from "../db";

// Kagin keeps a concrete timestamp on the wire for existing clients, while
// perpetual licenses bypass expiry enforcement. Year 9999 is JSON/SQLite safe.
export const PERPETUAL_EXPIRES_AT = 253_402_300_799;

export function resolvedLicenseExpiry(
  type: string,
  expiresAt: number | undefined,
  issuedAt: number,
): number | null {
  if (type === "perpetual") return PERPETUAL_EXPIRES_AT;
  if (!Number.isSafeInteger(expiresAt) || (expiresAt ?? 0) <= issuedAt) return null;
  return expiresAt ?? null;
}

export function sameLicenseFulfillment(existing: LicenseRow, requested: LicenseRow): boolean {
  return existing.product_id === requested.product_id
    && existing.type === requested.type
    && existing.expires_at === requested.expires_at
    && canonicalJSON(existing.features) === canonicalJSON(requested.features)
    && existing.seat_limit === requested.seat_limit
    && existing.machine_limit === requested.machine_limit
    && canonicalJSON(existing.allowed_countries) === canonicalJSON(requested.allowed_countries)
    && canonicalJSON(existing.blocked_countries) === canonicalJSON(requested.blocked_countries)
    && canonicalJSON(existing.allowed_ips) === canonicalJSON(requested.allowed_ips)
    && canonicalJSON(existing.anti_debug) === canonicalJSON(requested.anti_debug)
    && existing.customer_identity === requested.customer_identity;
}

function canonicalJSON(value: string): string {
  try {
    return JSON.stringify(sortJSON(JSON.parse(value)));
  } catch {
    return value;
  }
}

function sortJSON(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJSON);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, sortJSON(child)]),
    );
  }
  return value;
}
