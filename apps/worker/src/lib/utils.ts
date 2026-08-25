export type FeatureSchema = {
  properties: Record<string, string>;
  required?: string[];
  quotas?: Record<string, number>;
  strict?: boolean;
};

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export function getClientIP(req: Request): string {
  return req.headers.get("CF-Connecting-IP") || "";
}

export function isCIDRMatch(ip: string, cidr: string): boolean {
  if (!cidr.includes("/")) return ip === cidr;
  const [base, maskStr] = cidr.split("/");
  const mask = parseInt(maskStr, 10);
  const ipParts = ip.split(".").map(Number);
  const baseParts = base.split(".").map(Number);
  if (ipParts.length !== 4 || baseParts.length !== 4) return false;
  const ipNum = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
  const baseNum = (baseParts[0] << 24) | (baseParts[1] << 16) | (baseParts[2] << 8) | baseParts[3];
  const maskNum = mask === 0 ? 0 : (~0 << (32 - mask)) >>> 0;
  return (ipNum & maskNum) === (baseNum & maskNum);
}

export function validateFeatures(
  schemaInput: Record<string, unknown> | FeatureSchema,
  features: Record<string, unknown>,
  strictMode = false,
) {
  const schema: FeatureSchema =
    (schemaInput as FeatureSchema).properties
      ? (schemaInput as FeatureSchema)
      : { properties: schemaInput as Record<string, string>, required: [] };
  const errors: string[] = [];
  const { properties, required = [], strict = false } = schema;
  const isStrict = strict || strictMode;
  for (const key of required) {
    if (!(key in features)) errors.push(`missing required feature: ${key}`);
  }
  for (const [key, type] of Object.entries(properties || {})) {
    const val = features[key];
    if (val === undefined) continue;
    const actual = typeof val;
    if (type === "number" && actual !== "number") errors.push(`${key} should be number`);
    if (type === "boolean" && actual !== "boolean") errors.push(`${key} should be boolean`);
    if (type === "string" && actual !== "string") errors.push(`${key} should be string`);
  }
  if (isStrict) {
    for (const key of Object.keys(features)) {
      if (!(key in (properties || {}))) errors.push(`unknown feature: ${key}`);
    }
  }
  return { ok: errors.length === 0, errors };
}

export function base64urlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function parseJWT(token: string) {
  const [h, p, s] = token.split(".");
  const header = JSON.parse(atob(h.replace(/-/g, "+").replace(/_/g, "/")));
  const payload = JSON.parse(atob(p.replace(/-/g, "+").replace(/_/g, "/")));
  return { header, payload, signature: s };
}
