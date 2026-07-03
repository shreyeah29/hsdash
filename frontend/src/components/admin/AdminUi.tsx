import type { ReactNode } from "react";
import { ADMIN_PALETTE } from "@/lib/adminTheme";
import { AdminSectionLabel } from "@/components/admin/AdminSurface";
import { cn } from "@/lib/utils";

const palette = ADMIN_PALETTE;

export function useAdminPalette() {
  return palette;
}

export function AdminPageHeader({
  label,
  title,
  subtitle,
  actions,
  className,
}: {
  label: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div className="max-w-3xl">
        <AdminSectionLabel>{label}</AdminSectionLabel>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight lg:text-4xl" style={{ color: palette.textOnBg, textShadow: "0 1px 12px rgba(26,18,40,0.22)" }}>
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 text-sm leading-relaxed lg:text-base" style={{ color: palette.textSecondaryOnBg }}>
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminStatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      className="rounded-2xl border p-5 backdrop-blur-xl"
      style={{
        backgroundColor: palette.card,
        borderColor: palette.border,
        color: palette.text,
        boxShadow: "0 16px 48px rgba(26, 18, 40, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.85)",
      }}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: palette.textSecondary }}>
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold lg:text-3xl" style={{ color: palette.text }}>
        {value}
      </div>
    </div>
  );
}

export function AdminButton({
  children,
  onClick,
  disabled,
  variant = "primary",
  className,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost" | "outline";
  className?: string;
  type?: "button" | "submit";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50";

  const styles =
    variant === "primary"
      ? { backgroundColor: palette.accent, color: palette.onAccent, border: `1px solid ${palette.accent}` }
      : variant === "outline"
        ? { backgroundColor: palette.surface, color: palette.text, border: `1px solid ${palette.border}` }
        : { backgroundColor: "transparent", color: palette.text, border: `1px solid ${palette.border}` };

  return (
    <button type={type} disabled={disabled} onClick={onClick} className={cn(base, className)} style={styles}>
      {children}
    </button>
  );
}

export function AdminTabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl px-4 py-2 text-sm font-semibold transition"
      style={{
        backgroundColor: active ? "rgba(156, 109, 200, 0.28)" : "transparent",
        color: active ? palette.textOnBg : palette.textSecondaryOnBg,
        border: `1px solid ${active ? "rgba(156, 109, 200, 0.5)" : "rgba(255,255,255,0.35)"}`,
      }}
    >
      {children}
    </button>
  );
}

export function AdminFilterChip({
  active,
  label,
  dotColor,
  onClick,
}: {
  active: boolean;
  label: string;
  dotColor?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition"
      style={{
        backgroundColor: active ? "rgba(156, 109, 200, 0.22)" : palette.navBar,
        borderColor: active ? "rgba(156, 109, 200, 0.45)" : "rgba(255,255,255,0.35)",
        color: active ? palette.textOnBg : palette.textSecondaryOnBg,
      }}
    >
      {dotColor ? <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: dotColor }} /> : null}
      {label}
    </button>
  );
}

export function AdminMuted({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("text-sm", className)} style={{ color: palette.textSecondary }}>
      {children}
    </p>
  );
}
