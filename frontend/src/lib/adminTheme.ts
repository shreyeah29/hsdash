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

/** Menu-matched admin UI — black type, white panels, sharp black borders. */
export const ADMIN_PALETTE: AdminPalette = {
  background: "transparent",
  surface: "#ffffff",
  card: "#ffffff",
  elevated: "#ffffff",
  accent: "#5227ff",
  bronze: "#5227ff",
  ivory: "#ffffff",
  text: "#000000",
  textSecondary: "#333333",
  textOnBg: "#000000",
  textSecondaryOnBg: "#444444",
  navBar: "#ffffff",
  navIndicator: "#000000",
  border: "#000000",
  success: "#166534",
  warning: "#92400e",
  error: "#991b1b",
  delayed: "#9d174d",
  onAccent: "#ffffff",
  heroGradientEnd: "#000000",
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
    "--sm-accent": p.accent,
  };
}
