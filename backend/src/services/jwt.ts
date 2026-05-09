import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { AuthUser } from "../types/auth";

const TOKEN_COOKIE = "hsdash_token";

export function signAuthToken(payload: AuthUser) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as unknown as any,
  });
}

export function verifyAuthToken(token: string): AuthUser {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  return decoded as AuthUser;
}

export function getTokenCookieName() {
  return TOKEN_COOKIE;
}

