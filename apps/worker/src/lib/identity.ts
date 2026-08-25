export function normalizeCustomerIdentity(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.includes("@")) return trimmed.toLowerCase();
  return trimmed.replace(/[\s-]/g, "");
}

export function customerIdentityMatches(stored: string, provided: string): boolean {
  const a = normalizeCustomerIdentity(stored);
  const b = normalizeCustomerIdentity(provided);
  if (!a) return true;
  return a === b;
}
