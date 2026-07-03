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
    <div className={cn("admin-card p-6 lg:p-8", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-4xl">
          <AdminSectionLabel>{label}</AdminSectionLabel>
          <h1 className="admin-display-title mt-3">{title}</h1>
          {subtitle ? <p className="admin-display-subtitle mt-3">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export function AdminStatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="admin-card p-5 lg:p-6">
      <div className="admin-kicker">{label}</div>
      <div className="admin-stat-value mt-2">{value}</div>
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
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn("admin-btn", variant === "primary" ? "admin-btn--solid" : "", className)}
    >
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
    <button type="button" onClick={onClick} className={cn("admin-tab", active ? "admin-tab--active" : "")}>
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
    <button type="button" onClick={onClick} className={cn("admin-chip", active ? "admin-chip--active" : "")}>
      {dotColor ? <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dotColor }} /> : null}
      {label}
    </button>
  );
}

export function AdminMuted({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("admin-display-subtitle text-sm", className)}>{children}</p>;
}
