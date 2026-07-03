import type { GrainientProps } from "@/components/admin/Grainient";

export type AdminPalette = {
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

/** Single website admin theme — glass UI over Grainient background. */
export const ADMIN_PALETTE: AdminPalette = {
  background: "transparent",
  surface: "rgba(255, 255, 255, 0.08)",
  card: "rgba(255, 255, 255, 0.12)",
  elevated: "rgba(255, 255, 255, 0.16)",
  accent: "#FF9FFC",
  bronze: "#E9D5FF",
  ivory: "#FFFFFF",
  text: "#FFFFFF",
  textSecondary: "rgba(255, 255, 255, 0.72)",
  navBar: "rgba(255, 255, 255, 0.08)",
  navIndicator: "rgba(255, 255, 255, 0.22)",
  border: "rgba(255, 255, 255, 0.2)",
  success: "#86EFAC",
  warning: "#FCD34D",
  error: "#FCA5A5",
  delayed: "#F9A8D4",
  onAccent: "#1E1035",
  heroGradientEnd: "#E9D5FF",
  backdropAccent: "#5227FF",
};

export const GRAINIENT_PROPS: GrainientProps = {
  color1: "#FF9FFC",
  color2: "#5227FF",
  color3: "#B497CF",
  timeSpeed: 0.25,
  colorBalance: 0.0,
  warpStrength: 1.0,
  warpFrequency: 5.0,
  warpSpeed: 2.0,
  warpAmplitude: 50.0,
  blendAngle: 0.0,
  blendSoftness: 0.05,
  rotationAmount: 500.0,
  noiseScale: 2.0,
  grainAmount: 0.1,
  grainScale: 2.0,
  grainAnimated: false,
  contrast: 1.5,
  gamma: 1.0,
  saturation: 1.0,
  centerX: 0.0,
  centerY: 0.0,
  zoom: 0.9,
};

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
