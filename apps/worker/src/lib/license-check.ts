import type { Context } from "hono";
import type { AppBindings } from "../env";
import type { LicenseRow } from "../db";
import { db } from "../db";
import { customerIdentityMatches } from "./identity";
import { getClientIP, isCIDRMatch } from "./utils";

export type LicenseGate =
  | { ok: true; license: LicenseRow; country: string; ip: string; now: number }
  | { ok: false; error: string; status: 400 | 403 | 404 | 429 };

export async function gateLicense(c: Context<AppBindings>, licenseKey: string): Promise<LicenseGate> {
  const now = Math.floor(Date.now() / 1000);
  const license = await db.getLicense(c.env, licenseKey);
  if (!license) return { ok: false, error: "invalid_license", status: 404 };
  if (license.status !== "active") return { ok: false, error: "license_not_active", status: 403 };
  if (license.type !== "perpetual" && license.expires_at < now) {
    return { ok: false, error: "license_expired", status: 403 };
  }
  if (license.state === "restricted" || license.state === "revoked") {
    return { ok: false, error: "license_restricted", status: 403 };
  }
  if (license.state === "grace" && license.grace_until > 0 && license.grace_until < now) {
    return { ok: false, error: "license_grace_expired", status: 403 };
  }

  const country = (c.req.raw as Request & { cf?: { country?: string } }).cf?.country || "";
  const allowedCountries: string[] = JSON.parse(license.allowed_countries || "[]");
  const blockedCountries: string[] = JSON.parse(license.blocked_countries || "[]");
  if (allowedCountries.length && !allowedCountries.includes(country)) {
    return { ok: false, error: "country_denied", status: 403 };
  }
  if (blockedCountries.length && blockedCountries.includes(country)) {
    return { ok: false, error: "country_blocked", status: 403 };
  }

  const ip = getClientIP(c.req.raw);
  const allowedIPs: string[] = JSON.parse(license.allowed_ips || "[]");
  if (allowedIPs.length && !allowedIPs.some((cidr) => isCIDRMatch(ip, cidr))) {
    return { ok: false, error: "ip_denied", status: 403 };
  }

  return { ok: true, license, country, ip, now };
}

export type ActivationResult =
  | {
    ok: true;
    already_bound: boolean;
    devices_used: number;
    devices_limit: number;
  }
  | { ok: false; error: string; status: 400 | 403 | 404 | 429 };

export async function bindMachine(
  env: AppBindings["Bindings"],
  license: LicenseRow,
  machineId: string,
  now: number,
): Promise<ActivationResult> {
  const limit = license.machine_limit || 0;
  if (limit <= 0) {
    return { ok: true, already_bound: false, devices_used: 0, devices_limit: 0 };
  }

  const existing = await db.getActivation(env, license.license_key, machineId);
  if (existing) {
    await db.touchActivation(env, license.license_key, machineId, now);
    const used = await db.countActivations(env, license.license_key);
    return { ok: true, already_bound: true, devices_used: used?.c ?? 0, devices_limit: limit };
  }

  const inserted = await db.tryCreateActivation(env, license.license_key, machineId, now, limit);
  if (!inserted) {
    const raced = await db.getActivation(env, license.license_key, machineId);
    if (raced) {
      const used = await db.countActivations(env, license.license_key);
      return { ok: true, already_bound: true, devices_used: used?.c ?? 0, devices_limit: limit };
    }
    return { ok: false, error: "machine_limit_exceeded", status: 403 };
  }
  const used = await db.countActivations(env, license.license_key);
  return { ok: true, already_bound: false, devices_used: used?.c ?? 0, devices_limit: limit };
}

export async function requireActivatedMachine(
  env: AppBindings["Bindings"],
  license: LicenseRow,
  machineId: string,
): Promise<{ ok: true } | { ok: false; error: string; status: 403 }> {
  const limit = license.machine_limit || 0;
  if (limit <= 0) return { ok: true };

  const row = await db.getActivation(env, license.license_key, machineId);
  if (!row) return { ok: false, error: "machine_not_activated", status: 403 };
  return { ok: true };
}

export async function requireCustomerIdentity(
  license: LicenseRow,
  identity: string | undefined,
): Promise<{ ok: true } | { ok: false; error: string; status: 400 | 403 }> {
  const bound = (license.customer_identity || "").trim();
  if (!bound) return { ok: true };
  if (!identity?.trim()) return { ok: false, error: "identity_required", status: 400 };
  if (!customerIdentityMatches(bound, identity)) return { ok: false, error: "identity_mismatch", status: 403 };
  return { ok: true };
}

export function usesFloatingSeats(license: LicenseRow) {
  return license.type === "floating" || (license.seat_limit && license.seat_limit > 0);
}

export function usesDeviceBinding(license: LicenseRow) {
  return (license.machine_limit || 0) > 0;
}

export type DeactivationResult =
  | {
    ok: true;
    deactivated: boolean;
    devices_used: number;
    devices_limit: number;
  }
  | { ok: false; error: string; status: 400 | 403 | 404 };

export async function unbindMachine(
  env: AppBindings["Bindings"],
  license: LicenseRow,
  machineId: string,
): Promise<DeactivationResult> {
  const limit = license.machine_limit || 0;
  if (limit <= 0) {
    return { ok: false, error: "device_binding_disabled", status: 400 };
  }

  const existing = await db.getActivation(env, license.license_key, machineId);
  if (!existing) {
    const used = await db.countActivations(env, license.license_key);
    return { ok: true, deactivated: false, devices_used: used?.c ?? 0, devices_limit: limit };
  }

  await db.deleteActivation(env, license.license_key, machineId);
  await db.deleteSessionsForMachine(env, license.license_key, machineId);
  const used = await db.countActivations(env, license.license_key);
  return { ok: true, deactivated: true, devices_used: used?.c ?? 0, devices_limit: limit };
}

export async function requireRecentHeartbeat(
  env: AppBindings["Bindings"],
  license: LicenseRow,
  now: number,
): Promise<{ ok: true } | { ok: false; error: string; status: 403 }> {
  const policy = await db.getMergedPolicy(env, license.org_id, license.product_id);
  if (!policy.require_heartbeat) return { ok: true };
  const row = await db.latestHeartbeat(env, license.license_key);
  const last = row?.last_heartbeat || 0;
  const offlineWindow = (policy.max_offline_days || 0) * 86400;
  const timeout = parseInt(env.HEARTBEAT_TIMEOUT_SECONDS || "120", 10);
  const windowSec = Math.max(timeout, offlineWindow);
  if (!last || now - last > windowSec) {
    return { ok: false, error: "heartbeat_required", status: 403 };
  }
  return { ok: true };
}
