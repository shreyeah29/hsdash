import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.string().optional(),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),
  FRONTEND_URL: z.string().url(),
  COOKIE_SECURE: z.coerce.boolean().optional(),
  /** Login email allowed to edit the production shoot calendar (default: Emmanuel). */
  CALENDAR_COORDINATOR_EMAIL: z.string().email().default("emmanuel@wedding.local"),
});

export const env = envSchema.parse(process.env);

