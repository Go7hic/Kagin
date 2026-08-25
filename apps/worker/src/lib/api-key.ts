import { hashToken, randomSecret, verifyTokenHash } from "./token";

export const API_KEY_PREFIX = "kagin_sk_live_";
export const API_KEY_PREFIX_LEN = 20;

export type GeneratedApiKey = {
  key_id: string;
  api_key: string;
  prefix: string;
};

export const hashApiKey = hashToken;
export const verifyApiKeyHash = verifyTokenHash;

export function generateApiKey(): GeneratedApiKey {
  const api_key = `${API_KEY_PREFIX}${randomSecret()}`;
  return {
    key_id: crypto.randomUUID(),
    api_key,
    prefix: api_key.slice(0, API_KEY_PREFIX_LEN),
  };
}
