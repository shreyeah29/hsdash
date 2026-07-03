import { create } from "zustand";
import { parseAdminProfile, type AdminWorkspaceProfile, type AdminWorkspaceProfileId } from "@/lib/adminProfiles";

const STORAGE_KEY = "hsdash_admin_workspace_profile";

type AdminWorkspaceState = {
  profile: AdminWorkspaceProfile | null;
  hydrated: boolean;
  hydrate: () => void;
  selectProfile: (id: AdminWorkspaceProfileId) => void;
  clearProfile: () => void;
};

export const useAdminWorkspaceStore = create<AdminWorkspaceState>((set) => ({
  profile: null,
  hydrated: false,
  hydrate: () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    set({ profile: parseAdminProfile(raw), hydrated: true });
  },
  selectProfile: (id) => {
    const profile = parseAdminProfile(id);
    if (!profile) return;
    localStorage.setItem(STORAGE_KEY, id);
    set({ profile, hydrated: true });
  },
  clearProfile: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ profile: null, hydrated: true });
  },
}));
