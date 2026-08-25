import { env } from "../config/env";

/** Parse FRONTEND_URL (single URL or comma-separated list). */
export function parseFrontendOrigins(raw: string = env.FRONTEND_URL): string[] {
  const parts = raw
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);

  const out = new Set<string>();
  for (const part of parts) {
    try {
      const u = new URL(part);
      const base = `${u.protocol}//${u.host}`;
      out.add(base);
      // Allow both apex and www for the same site.
      if (u.hostname.startsWith("www.")) {
        out.add(`${u.protocol}//${u.hostname.slice(4)}`);
      } else if (u.hostname.includes(".")) {
        out.add(`${u.protocol}//www.${u.hostname}`);
      }
    } catch {
      // skip invalid entries
    }
  }
  return [...out];
}

export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return false;
  const allowed = parseFrontendOrigins();
  return allowed.includes(origin.replace(/\/$/, ""));
}

/** cors / socket.io origin option: reflect allowed browser origins. */
export function corsOriginDelegate(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean | string) => void,
) {
  // Non-browser clients (mobile, curl, Apps Script) often send no Origin.
  if (!origin) {
    callback(null, true);
    return;
  }
  if (isOriginAllowed(origin)) {
    callback(null, origin);
    return;
  }
  callback(null, false);
}
