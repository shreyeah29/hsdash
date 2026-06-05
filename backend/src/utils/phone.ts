/** Normalize phone for deduplication — digits only, last 10 for IN mobiles when longer. */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length > 10) return digits.slice(-10);
  return digits;
}

export function isValidPhone(raw: string): boolean {
  const n = normalizePhone(raw);
  return n.length >= 8 && n.length <= 15;
}
