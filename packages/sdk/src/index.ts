/** Absent `signature` means the product has no Ed25519 keypair yet. */
export type SignedTime = {
  server_time: number;
  signature?: string;
  issued_at?: number;
  expires_at?: number;
};

export type HeartbeatResponse = SignedTime & {
  ok: boolean;
  state: "active" | "grace" | "restricted" | "revoked";
  grace_until?: number;
  policy?: Record<string, unknown>;
  soft_checks?: string[];
};

export type EphemeralToken = { token_id: string; issued_at: number; ttl: number };
export type FeatureToken = {
  features: Record<string, unknown>;
  server_time: number;
  exp?: number;
  signature: string;
  quotas?: Record<string, number>;
};

export interface StorageAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

export type ActivateResponse = SignedTime & {
  ok: boolean;
  activated: boolean;
  already_bound: boolean;
  machine_id: string;
  devices_used: number;
  devices_limit: number;
  issued_at: number;
  expires_at: number;
  state: string;
  policy?: Record<string, unknown>;
};

export type ActivationDevice = {
  machine_id: string;
  activated_at: number;
  last_seen_at: number;
};

export type ActivationsResponse = {
  devices: ActivationDevice[];
  devices_used: number;
  devices_limit: number;
};

export type DeactivateResponse = {
  ok: boolean;
  deactivated: boolean;
  machine_id: string;
  devices_used: number;
  devices_limit: number;
};

export class KaginClient {
  constructor(private base: string, private storage?: StorageAdapter) {}

  async activate(license_key: string, machine_id: string, identity?: string) {
    const res = await fetch(`${this.base}/v1/activate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ license_key, machine_id, identity }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(err.error || "activate_failed");
    }
    const data: ActivateResponse = await res.json();
    if (this.storage) {
      await this.storage.set("last_seen_server_time", String(data.server_time));
      await this.storage.set(`activated_${license_key}`, machine_id);
    }
    return data;
  }

  async listActivations(license_key: string, identity?: string) {
    const params = new URLSearchParams({ license_key });
    if (identity) params.set("identity", identity);
    const res = await fetch(`${this.base}/v1/activations?${params}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(err.error || "activations_failed");
    }
    return res.json() as Promise<ActivationsResponse>;
  }

  async deactivate(license_key: string, machine_id: string, identity?: string) {
    const res = await fetch(`${this.base}/v1/deactivate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ license_key, machine_id, identity }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(err.error || "deactivate_failed");
    }
    const data: DeactivateResponse = await res.json();
    if (this.storage && data.deactivated) {
      const stored = await this.storage.get(`activated_${license_key}`);
      if (stored === machine_id) {
        await this.storage.set(`activated_${license_key}`, "");
      }
    }
    return data;
  }

  async heartbeat(license_key: string, session_id: string, machine_id: string, debug_detected = false, time_anomaly_detected = false) {
    const res = await fetch(`${this.base}/v1/heartbeat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ license_key, session_id, machine_id, debug_detected, time_anomaly_detected }),
    });
    if (!res.ok) throw new Error("heartbeat_failed");
    const data: HeartbeatResponse = await res.json();
    if (this.storage && data.server_time) await this.storage.set("last_seen_server_time", String(data.server_time));
    return data;
  }

  /** Pass product_id (and org_slug on hosted) to get a signed time you can verify. */
  async getServerTime(product_id?: string, org_slug?: string) {
    const params = new URLSearchParams();
    if (product_id) params.set("product_id", product_id);
    if (org_slug) params.set("org_slug", org_slug);
    const query = params.toString();
    const res = await fetch(`${this.base}/v1/server-time${query ? `?${query}` : ""}`);
    if (!res.ok) throw new Error("server_time_failed");
    return res.json() as Promise<SignedTime>;
  }

  async getPolicy(product_id?: string) {
    const url = product_id ? `${this.base}/v1/policy?product_id=${product_id}` : `${this.base}/v1/policy`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("policy_failed");
    return (await res.json() as { policy: Record<string, unknown> }).policy;
  }

  async issueFeatureToken(license_key: string, features: Record<string, unknown>, machine_id?: string) {
    const res = await fetch(`${this.base}/v1/feature-token`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ license_key, features, machine_id }),
    });
    if (!res.ok) throw new Error("feature_token_failed");
    return (await res.json()) as FeatureToken;
  }

  async issueEphemeral(license_key: string, machine_id: string, ttl = 3600) {
    const res = await fetch(`${this.base}/v1/ephemeral-token`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ license_key, machine_id, ttl }),
    });
    if (!res.ok) throw new Error("ephemeral_failed");
    return (await res.json()) as EphemeralToken;
  }

  async verifyEd25519(payload: Record<string, unknown>, signature: string, publicJWK: JsonWebKey) {
    try {
      const data = new TextEncoder().encode(JSON.stringify(payload));
      const key = await crypto.subtle.importKey("jwk", publicJWK, { name: "Ed25519" }, false, ["verify"]);
      const sigBytes = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0));
      return await crypto.subtle.verify("Ed25519", key, sigBytes, data);
    } catch {
      return false;
    }
  }

  async verifyFeatureTokenEd25519(ft: FeatureToken, publicJWK: JsonWebKey, license_key: string) {
    const payload = ft.exp !== undefined
      ? { license_key, features: ft.features, server_time: ft.server_time, exp: ft.exp }
      : { license_key, features: ft.features, server_time: ft.server_time };
    return this.verifyEd25519(payload, ft.signature, publicJWK);
  }

  /**
   * Verifies a signed time from activate, heartbeat, or /v1/server-time.
   * Field order must match how the Worker builds the payload.
   */
  async verifyServerTimeEd25519(time: SignedTime, publicJWK: JsonWebKey) {
    if (!time.signature) return false;
    const payload = time.issued_at !== undefined && time.expires_at !== undefined
      ? { issued_at: time.issued_at, expires_at: time.expires_at, server_time: time.server_time }
      : { server_time: time.server_time };
    return this.verifyEd25519(payload, time.signature, publicJWK);
  }

  async validateFeatureConsume(ft: FeatureToken, policy: Record<string, unknown>, publicJWK?: JsonWebKey, license_key?: string) {
    if (publicJWK && license_key) {
      const verified = await this.verifyFeatureTokenEd25519(ft, publicJWK, license_key);
      if (!verified) return { ok: false as const, error: "signature_invalid" };
    }
    if (ft.exp && Math.floor(Date.now() / 1000) > ft.exp) {
      return { ok: false as const, error: "feature_token_expired" };
    }
    const lastSeen = this.storage ? parseInt((await this.storage.get("last_seen_server_time")) || "0") : 0;
    const tolerance = (policy.time_skew_tolerance_seconds as number) ?? 60;
    if (lastSeen && ft.server_time + tolerance < lastSeen) return { ok: false as const, error: "time_rollback_detected" };
    return { ok: true as const };
  }

  async consume(feature: string, ft: FeatureToken, policy: Record<string, unknown>, publicJWK?: JsonWebKey, license_key?: string) {
    const valid = await this.validateFeatureConsume(ft, policy, publicJWK, license_key);
    if (!valid.ok) return valid;
    if (this.storage && ft.quotas && ft.quotas[feature] !== undefined) {
      const usedKey = `quota_used_${feature}`;
      const used = parseInt((await this.storage.get(usedKey)) || "0");
      if (used >= ft.quotas[feature]) return { ok: false as const, error: "quota_exceeded" };
      await this.storage.set(usedKey, String(used + 1));
    }
    return { ok: true as const };
  }

  validateEphemeral(token: EphemeralToken) {
    const now = Math.floor(Date.now() / 1000);
    if (now > token.issued_at + token.ttl) return { ok: false as const, error: "ephemeral_expired" };
    return { ok: true as const };
  }
}
