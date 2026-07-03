export type AdminThemeMode = "wedding" | "studio";

export type AdminPalette = {
  mode: AdminThemeMode;
  background: string;
  surface: string;
  card: string;
  elevated: string;
  accent: string;
  bronze: string;
  ivory: string;
  text: string;
  textSecondary: string;
  navBar: string;
  navIndicator: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  delayed: string;
  onAccent: string;
  heroGradientEnd: string;
  backdropAccent: string;
};

const wedding: Omit<AdminPalette, "mode"> = {
  background: "#F7F5F2",
  surface: "#F1ECE6",
  card: "#FFFFFF",
  elevated: "#FCFBF9",
  accent: "#8B6A45",
  bronze: "#A89584",
  ivory: "#F5EDE4",
  text: "#1F1B18",
  textSecondary: "#5E5750",
  navBar: "#FCFBF9",
  navIndicator: "rgba(139, 106, 69, 0.14)",
  border: "#E8E0D8",
  success: "#4F7F5A",
  warning: "#D59B3A",
  error: "#C45B52",
  delayed: "#BC7E87",
  onAccent: "#FFFFFF",
  heroGradientEnd: "#B89268",
  backdropAccent: "#8B6A45",
};

const studio: Omit<AdminPalette, "mode"> = {
  background: "#0B0D11",
  surface: "#131720",
  card: "#181D28",
  elevated: "#1E2430",
  accent: "#8B5CF6",
  bronze: "#9EA3B0",
  ivory: "#F4F4F5",
  text: "#F4F4F5",
  textSecondary: "#9EA3B0",
  navBar: "#06080C",
  navIndicator: "rgba(139, 92, 246, 0.32)",
  border: "#2A3140",
  success: "#34C759",
  warning: "#FF9500",
  error: "#FF453A",
  delayed: "#BC7E87",
  onAccent: "#F4F4F5",
  heroGradientEnd: "#C4B5FD",
  backdropAccent: "#8B5CF6",
};

export function adminPaletteFor(mode: AdminThemeMode): AdminPalette {
  return { mode, ...(mode === "studio" ? studio : wedding) };
}

export function adminCssVars(p: AdminPalette): Record<string, string> {
  return {
    "--admin-bg": p.background,
    "--admin-surface": p.surface,
    "--admin-card": p.card,
    "--admin-elevated": p.elevated,
    "--admin-accent": p.accent,
    "--admin-bronze": p.bronze,
    "--admin-text": p.text,
    "--admin-text-secondary": p.textSecondary,
    "--admin-nav": p.navBar,
    "--admin-border": p.border,
    "--admin-success": p.success,
    "--admin-warning": p.warning,
    "--admin-error": p.error,
    "--admin-delayed": p.delayed,
    "--admin-hero-end": p.heroGradientEnd,
  };
}
