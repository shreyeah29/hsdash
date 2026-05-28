import { config } from "dotenv";
import { resolve } from "node:path";
import { defineConfig } from "prisma/config";

// Prisma 6+ skips auto .env loading when prisma.config.ts exists — load backend/.env explicitly.
config({ path: resolve(__dirname, ".env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
