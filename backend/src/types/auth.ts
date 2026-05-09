import type { Role, Team } from "@prisma/client";

export type AuthUser = {
  userId: string;
  role: Role;
  team: Team | null;
  /** Present on tokens issued after this field was added; otherwise hydrated in requireAuth. */
  email?: string;
};

