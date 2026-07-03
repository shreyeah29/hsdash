import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminSurface({
  children,
  className,
  padding = "p-5 lg:p-6",
}: {
  children: React.ReactNode;
  className?: string;
  padding?: string;
}) {
  return <div className={cn("admin-card", padding, className)}>{children}</div>;
}

export function AdminHomeShortcut({
  label,
  index,
  onClick,
}: {
  icon?: LucideIcon;
  label: string;
  index?: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="admin-shortcut">
      <span className="admin-shortcut-label">{label}</span>
      {index ? <span className="admin-shortcut-index">{index}</span> : null}
    </button>
  );
}

export function AdminSectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="admin-section-label">{children}</p>;
}

export function AdminHero({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("admin-card p-6 lg:p-10", className)}>{children}</div>;
}
