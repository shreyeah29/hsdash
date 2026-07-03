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
  textOnBg: string;
  textSecondaryOnBg: string;
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

/** React Bits Grainient palette — gray, lavender, purple. */
export const GRAINIENT_PROPS: GrainientProps = {
  color1: "#919191",
  color2: "#b0a7d1",
  color3: "#9c6dc8",
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

/** Glass UI over Grainient — dark text on frosted cards, light text on the background. */
export const ADMIN_PALETTE: AdminPalette = {
  background: "transparent",
  surface: "rgba(255, 255, 255, 0.78)",
  card: "rgba(255, 255, 255, 0.92)",
  elevated: "rgba(255, 255, 255, 0.96)",
  accent: "#7c3aad",
  bronze: "#9c6dc8",
  ivory: "#FFFFFF",
  text: "#1a1228",
  textSecondary: "#5e5670",
  textOnBg: "#ffffff",
  textSecondaryOnBg: "rgba(255, 255, 255, 0.9)",
  navBar: "rgba(255, 255, 255, 0.55)",
  navIndicator: "rgba(156, 109, 200, 0.38)",
  border: "rgba(124, 58, 173, 0.22)",
  success: "#15803d",
  warning: "#b45309",
  error: "#b91c1c",
  delayed: "#9d174d",
  onAccent: "#ffffff",
  heroGradientEnd: "#e8dff5",
  backdropAccent: "#9c6dc8",
};

export function adminGradientStyle(props: Pick<GrainientProps, "color1" | "color2" | "color3"> = GRAINIENT_PROPS) {
  const c1 = props.color1 ?? GRAINIENT_PROPS.color1!;
  const c2 = props.color2 ?? GRAINIENT_PROPS.color2!;
  const c3 = props.color3 ?? GRAINIENT_PROPS.color3!;
  return {
    background: `linear-gradient(135deg, ${c1} 0%, ${c2} 48%, ${c3} 100%)`,
  } as const;
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
    "--admin-text-on-bg": p.textOnBg,
    "--admin-nav": p.navBar,
    "--admin-border": p.border,
    "--admin-success": p.success,
    "--admin-warning": p.warning,
    "--admin-error": p.error,
    "--admin-delayed": p.delayed,
    "--admin-hero-end": p.heroGradientEnd,
  };
}
