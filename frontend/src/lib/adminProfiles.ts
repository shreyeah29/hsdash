export type AdminWorkspaceProfileId = "damini" | "harish" | "shankar";

export type AdminWorkspaceProfile = {
  id: AdminWorkspaceProfileId;
  name: string;
  designation: string;
  image: string;
};

export const ADMIN_WORKSPACE_PROFILES: AdminWorkspaceProfile[] = [
  {
    id: "damini",
    name: "Damini",
    designation: "Admin workspace",
    image: "/profiles/damini.png",
  },
  {
    id: "harish",
    name: "Harish",
    designation: "Admin workspace",
    image: "/profiles/harish.png",
  },
  {
    id: "shankar",
    name: "Shankar",
    designation: "Admin workspace",
    image: "/profiles/shankar.png",
  },
];

export function parseAdminProfile(raw: string | null): AdminWorkspaceProfile | null {
  if (!raw) return null;
  return ADMIN_WORKSPACE_PROFILES.find((p) => p.id === raw) ?? null;
}
