import { create } from "zustand";
import { persist } from "zustand/middleware";
import { adminPaletteFor, type AdminPalette, type AdminThemeMode } from "@/lib/adminTheme";

type AdminThemeState = {
  mode: AdminThemeMode;
  palette: AdminPalette;
  toggle: () => void;
  setMode: (mode: AdminThemeMode) => void;
};

export const useAdminThemeStore = create<AdminThemeState>()(
  persist(
    (set, get) => ({
      mode: "wedding",
      palette: adminPaletteFor("wedding"),
      toggle: () => {
        const next: AdminThemeMode = get().mode === "wedding" ? "studio" : "wedding";
        set({ mode: next, palette: adminPaletteFor(next) });
      },
      setMode: (mode) => set({ mode, palette: adminPaletteFor(mode) }),
    }),
    { name: "hswf-admin-theme" },
  ),
);
