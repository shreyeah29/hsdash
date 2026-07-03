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
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight lg:text-4xl" style={{ color: palette.text }}>
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 text-sm leading-relaxed lg:text-base" style={{ color: palette.textSecondary }}>
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
      className="rounded-2xl border p-5 backdrop-blur-md"
      style={{ backgroundColor: palette.card, borderColor: palette.border }}
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
        backgroundColor: active ? "rgba(255, 159, 252, 0.22)" : "transparent",
        color: active ? palette.text : palette.textSecondary,
        border: `1px solid ${active ? "rgba(255, 159, 252, 0.45)" : palette.border}`,
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
        backgroundColor: active ? "rgba(255, 159, 252, 0.18)" : palette.surface,
        borderColor: active ? "rgba(255, 159, 252, 0.45)" : palette.border,
        color: active ? palette.text : palette.textSecondary,
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
