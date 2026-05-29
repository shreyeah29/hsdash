import { create } from "zustand";
import type { User } from "@/types/domain";
import { api, ACCESS_TOKEN_KEY, setAccessToken } from "@/services/api";

type AuthState = {
  user: User | null;
  loading: boolean;
  setUser: (u: User | null) => void;
  /** Apply user from login/demo without an extra /auth/me round trip. */
  acceptSession: (user: User) => void;
  refreshMe: (opts?: { force?: boolean }) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  setUser: (u) => set({ user: u }),
  acceptSession: (user) => set({ user, loading: false }),
  refreshMe: async (opts) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      set({ user: null, loading: false });
      return;
    }

    if (!opts?.force && get().user) {
      set({ loading: false });
      return;
    }

    set({ loading: true });
    try {
      const { data } = await api.get<{ user: User }>("/auth/me");
      set({ user: data.user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },
  logout: async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setAccessToken(null);
      set({ user: null, loading: false });
    }
  },
}));
