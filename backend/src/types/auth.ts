import type { Role, Team } from "@prisma/client";

export type AuthUser = {
  userId: string;
  role: Role;
  team: Team | null;
};

