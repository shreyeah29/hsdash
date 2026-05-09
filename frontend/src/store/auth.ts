import { create } from "zustand";
import type { User } from "@/types/domain";
import { api } from "@/services/api";

type AuthState = {
  user: User | null;
  loading: boolean;
  setUser: (u: User | null) => void;
  refreshMe: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (u) => set({ user: u }),
  refreshMe: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get("/auth/me");
      set({ user: data.user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },
  logout: async () => {
    await api.post("/auth/logout");
    set({ user: null });
  },
}));

