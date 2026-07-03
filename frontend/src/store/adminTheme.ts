import { create } from "zustand";
import { ADMIN_PALETTE } from "@/lib/adminTheme";

type AdminThemeState = {
  palette: typeof ADMIN_PALETTE;
};

export const useAdminThemeStore = create<AdminThemeState>()(() => ({
  palette: ADMIN_PALETTE,
}));
