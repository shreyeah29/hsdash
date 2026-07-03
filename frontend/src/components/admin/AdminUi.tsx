import type { ReactNode } from "react";
import { useAdminThemeStore } from "@/store/adminTheme";
import { AdminSectionLabel } from "@/components/admin/AdminSurface";
import { cn } from "@/lib/utils";

export function useAdminPalette() {
  return useAdminThemeStore((s) => s.palette);
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
  const palette = useAdminPalette();

  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div>
        <AdminSectionLabel>{label}</AdminSectionLabel>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl" style={{ color: palette.text }}>
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: palette.textSecondary }}>
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminStatCard({ label, value }: { label: string; value: string | number }) {
  const palette = useAdminPalette();
  return (
    <div
      className="rounded-[22px] border p-4 shadow-sm"
      style={{ backgroundColor: palette.card, borderColor: palette.border }}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: palette.textSecondary }}>
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold" style={{ color: palette.text }}>
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
  const palette = useAdminPalette();
  const base = "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50";

  const styles =
    variant === "primary"
      ? { backgroundColor: palette.accent, color: palette.onAccent, border: `1px solid ${palette.accent}` }
      : variant === "outline"
        ? { backgroundColor: palette.card, color: palette.text, border: `1px solid ${palette.border}` }
        : { backgroundColor: `${palette.surface}cc`, color: palette.text, border: `1px solid ${palette.border}` };

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
  const palette = useAdminPalette();
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl px-4 py-2 text-sm font-semibold transition"
      style={{
        backgroundColor: active ? `${palette.accent}${palette.mode === "studio" ? "33" : "24"}` : "transparent",
        color: active ? palette.accent : palette.textSecondary,
        border: `1px solid ${active ? `${palette.accent}55` : palette.border}`,
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
  const palette = useAdminPalette();
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition"
      style={{
        backgroundColor: active ? `${palette.accent}22` : palette.card,
        borderColor: active ? `${palette.accent}66` : palette.border,
        color: active ? palette.text : palette.textSecondary,
      }}
    >
      {dotColor ? <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: dotColor }} /> : null}
      {label}
    </button>
  );
}

export function AdminMuted({ children, className }: { children: ReactNode; className?: string }) {
  const palette = useAdminPalette();
  return (
    <p className={cn("text-sm", className)} style={{ color: palette.textSecondary }}>
      {children}
    </p>
  );
}
