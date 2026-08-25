export type AdminAuth = {
  orgId: string;
  userId?: string;
  email?: string;
  role?: string;
  mode: "saas" | "legacy" | "api_key";
  apiKeyId?: string;
  sessionId?: string;
};
