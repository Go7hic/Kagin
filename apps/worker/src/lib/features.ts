import type { FeatureSchema } from "./utils";

export function parseFeatureSchema(raw: string | null | undefined): FeatureSchema | null {
  if (!raw) return null;
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  if (!parsed || typeof parsed !== "object") return null;
  if ("properties" in parsed && parsed.properties && typeof parsed.properties === "object") {
    const properties = parsed.properties as Record<string, string>;
    const required = Array.isArray(parsed.required) ? parsed.required as string[] : [];
    if (Object.keys(properties).length === 0 && required.length === 0) return null;
    return { properties, required, quotas: parsed.quotas as Record<string, number> | undefined, strict: parsed.strict as boolean | undefined };
  }
  if (Object.keys(parsed).length === 0) return null;
  return { properties: parsed as Record<string, string> };
}

export function entitledFeatures(
  entitledRaw: string | null | undefined,
  requested: Record<string, unknown>,
): { ok: true; features: Record<string, unknown> } | { ok: false; error: string } {
  let entitled: Record<string, unknown> = {};
  try {
    entitled = JSON.parse(entitledRaw || "{}") as Record<string, unknown>;
  } catch {
    return { ok: false, error: "license_features_invalid" };
  }
  if (!entitled || typeof entitled !== "object" || Array.isArray(entitled)) {
    return { ok: false, error: "license_features_invalid" };
  }
  for (const [key, value] of Object.entries(requested)) {
    if (!(key in entitled)) return { ok: false, error: "features_not_entitled" };
    const allowed = entitled[key];
    if (typeof allowed === "number" && typeof value === "number") {
      if (value > allowed) return { ok: false, error: "features_not_entitled" };
      continue;
    }
    if (JSON.stringify(value) !== JSON.stringify(allowed)) {
      return { ok: false, error: "features_not_entitled" };
    }
  }
  return { ok: true, features: requested };
}
