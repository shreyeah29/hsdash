import type { CookieOptions } from "express";
import { env } from "../config/env";
import { getTokenCookieName } from "./jwt";

/** Vercel / Render = different sites → must use SameSite=None + Secure for xhr/fetch with credentials */
export function isCrossSiteFrontend(): boolean {
  try {
    const u = new URL(env.FRONTEND_URL);
    return u.hostname !== "localhost" && u.hostname !== "127.0.0.1";
  } catch {
    return true;
  }
}

export function sessionCookieOptions(): CookieOptions {
  const crossSite = isCrossSiteFrontend();
  const secure =
    crossSite || env.COOKIE_SECURE === true || env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure,
    sameSite: crossSite ? "none" : "lax",
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  };
}

export function clearSessionCookie(res: import("express").Response) {
  const opts = sessionCookieOptions();
  res.clearCookie(getTokenCookieName(), {
    httpOnly: opts.httpOnly,
    secure: opts.secure,
    sameSite: opts.sameSite,
    path: opts.path ?? "/",
  });
}
