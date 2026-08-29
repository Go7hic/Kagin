const TOKEN_KEY = "kagin_admin_token";

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  clearToken();
  if (window.location.pathname.includes("/admin/login")) return;
  const match = window.location.pathname.match(/^\/(en|zh|ja)(?=\/|$)/);
  const locale = match?.[1] ?? "en";
  const suffix = window.location.pathname.replace(/^\/(en|zh|ja)/, "") || "/admin";
  const next =
    suffix.startsWith("/admin") && suffix !== "/admin/login"
      ? `?next=${encodeURIComponent(suffix === "/" ? "/admin" : suffix)}`
      : "";
  window.location.assign(`/${locale}/admin/login${next}`);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("content-type", "application/json");
  const token = getToken();
  if (token) headers.set("authorization", `Bearer ${token}`);
  const res = await fetch(path, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    const code = (err as { error?: string }).error || "request_failed";
    const isCredentialEndpoint =
      path === "/admin/v1/auth/login" || path === "/admin/v1/auth/signup";
    if (res.status === 401 && !isCredentialEndpoint) {
      redirectToLogin();
    }
    throw new Error(code);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => request<{ ok: boolean }>("/health"),
  meta: () => request<{
    billing_enabled: boolean;
    price_usd: number;
    product_limit: number;
    contact_email: string;
  }>("/v1/meta"),
  signup: (email: string, password: string, org_name: string) =>
    request<{ token: string }>("/admin/v1/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, org_name }),
    }),
  login: (email: string, password: string) =>
    request<{ token: string }>("/admin/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<{ ok: boolean }>("/admin/v1/auth/logout", { method: "POST" }),
  me: () => request<{
    mode: string;
    org_id?: string;
    user?: { user_id?: string; email?: string };
    org?: { org_id?: string; name?: string; slug?: string; role?: string };
    billing?: {
      configured: boolean;
      status: string;
      paid: boolean;
      product_limit: number;
      product_count: number;
    };
  }>("/admin/v1/auth/me"),
  listProducts: () => request<Record<string, unknown>[]>("/admin/v1/products"),
  createProduct: (product_id: string, name: string) =>
    request("/admin/v1/products", { method: "POST", body: JSON.stringify({ product_id, name }) }),
  deleteProduct: (id: string) => request(`/admin/v1/products/${id}`, { method: "DELETE" }),
  generateKeypair: (id: string) => request(`/admin/v1/products/${id}/keypair`, { method: "POST" }),
  updateFeatureSchema: (id: string, schema: Record<string, unknown>) =>
    request(`/admin/v1/products/${id}/features`, { method: "PUT", body: JSON.stringify(schema) }),
  listLicenses: (productId?: string) =>
    request<Record<string, unknown>[]>(productId ? `/admin/v1/licenses?product_id=${productId}` : "/admin/v1/licenses"),
  createLicense: (body: Record<string, unknown>) =>
    request<{ license_key: string }>("/admin/v1/licenses", { method: "POST", body: JSON.stringify(body) }),
  revokeLicense: (key: string) => request(`/admin/v1/licenses/${key}/revoke`, { method: "POST" }),
  listActivations: (key: string) =>
    request<Record<string, unknown>[]>(`/admin/v1/licenses/${key}/activations`),
  createActivation: (key: string, machine_id: string) =>
    request<{
      ok: boolean;
      activated: boolean;
      already_bound: boolean;
      machine_id: string;
      devices_used: number;
      devices_limit: number;
    }>(`/admin/v1/licenses/${key}/activations`, {
      method: "POST",
      body: JSON.stringify({ machine_id }),
    }),
  deleteActivation: (key: string, machineId: string) =>
    request<{
      ok: boolean;
      deactivated: boolean;
      machine_id: string;
      devices_used: number;
      devices_limit: number;
    }>(`/admin/v1/licenses/${key}/activations/${encodeURIComponent(machineId)}`, { method: "DELETE" }),
  bulkLicenses: (csv: string) =>
    request<{ created: string[] }>("/admin/v1/licenses/bulk", { method: "POST", body: csv, headers: { "content-type": "text/plain" } }),
  listSessions: () => request<Record<string, unknown>[]>("/admin/v1/sessions"),
  kickSession: (licenseKey: string, session_id: string) =>
    request(`/admin/v1/licenses/${licenseKey}/kick`, { method: "POST", body: JSON.stringify({ session_id }) }),
  listPolicies: () => request<Record<string, unknown>[]>("/admin/v1/policies"),
  publishPolicy: (product_id: string | null, policy: Record<string, unknown>) =>
    request("/admin/v1/policies", { method: "POST", body: JSON.stringify({ product_id, policy }) }),
  listApiKeys: () => request<Record<string, unknown>[]>("/admin/v1/api-keys"),
  createApiKey: (name: string) =>
    request<{ key_id: string; name: string; prefix: string; api_key: string; created_at: number }>(
      "/admin/v1/api-keys",
      { method: "POST", body: JSON.stringify({ name }) },
    ),
  revokeApiKey: (keyId: string) =>
    request(`/admin/v1/api-keys/${keyId}/revoke`, { method: "POST" }),
  createCheckout: (locale: string) =>
    request<{ url: string }>("/admin/v1/billing/checkout", {
      method: "POST",
      body: JSON.stringify({ locale }),
    }),
  createBillingPortal: (locale: string) =>
    request<{ url: string }>("/admin/v1/billing/portal", {
      method: "POST",
      body: JSON.stringify({ locale }),
    }),
};
