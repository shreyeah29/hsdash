import type { LucideIcon } from "lucide-react";
import { ADMIN_PALETTE } from "@/lib/adminTheme";
import { cn } from "@/lib/utils";

const palette = ADMIN_PALETTE;

export function AdminSurface({
  children,
  className,
  padding = "p-5 lg:p-6",
}: {
  children: React.ReactNode;
  className?: string;
  padding?: string;
}) {
  return (
    <div
      className={cn("rounded-2xl border shadow-sm backdrop-blur-md", padding, className)}
      style={{
        backgroundColor: palette.card,
        borderColor: palette.border,
        boxShadow: "0 8px 32px rgba(30, 16, 53, 0.18)",
      }}
    >
      {children}
    </div>
  );
}

export function AdminHomeShortcut({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-w-[200px] flex-1 items-center gap-4 rounded-2xl border px-5 py-4 text-left backdrop-blur-md transition-colors hover:bg-white/[0.16] lg:min-w-[220px] lg:flex-none"
      style={{
        backgroundColor: palette.elevated,
        borderColor: palette.border,
      }}
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
        style={{
          backgroundColor: "rgba(255, 159, 252, 0.18)",
          borderColor: "rgba(255, 159, 252, 0.35)",
        }}
      >
        <Icon className="h-5 w-5" style={{ color: palette.accent }} strokeWidth={1.75} />
      </div>
      <span className="text-sm font-semibold tracking-wide" style={{ color: palette.text }}>
        {label}
      </span>
    </button>
  );
}

export function AdminSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: palette.accent }}>
      {children}
    </p>
  );
}
