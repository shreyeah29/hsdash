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
      className={cn("rounded-2xl border backdrop-blur-xl", padding, className)}
      style={{
        backgroundColor: palette.card,
        borderColor: palette.border,
        color: palette.text,
        boxShadow: "0 16px 48px rgba(26, 18, 40, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.85)",
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
      className="inline-flex w-full min-w-0 items-center gap-4 rounded-2xl border px-5 py-4 text-left backdrop-blur-xl transition hover:-translate-y-0.5 lg:px-6 lg:py-5"
      style={{
        backgroundColor: palette.elevated,
        borderColor: palette.border,
        color: palette.text,
        boxShadow: "0 12px 32px rgba(26, 18, 40, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
      }}
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
        style={{
          backgroundColor: "rgba(156, 109, 200, 0.16)",
          borderColor: "rgba(124, 58, 173, 0.28)",
        }}
      >
        <Icon className="h-5 w-5" style={{ color: palette.accent }} strokeWidth={1.75} />
      </div>
      <span className="text-sm font-semibold tracking-wide">{label}</span>
    </button>
  );
}

export function AdminSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-xs font-bold uppercase tracking-[0.2em]"
      style={{ color: palette.textOnBg, textShadow: "0 1px 10px rgba(26, 18, 40, 0.28)" }}
    >
      {children}
    </p>
  );
}

export function AdminHero({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-2xl border p-6 backdrop-blur-md lg:p-8", className)}
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.14)",
        borderColor: "rgba(255, 255, 255, 0.35)",
        color: palette.textOnBg,
        boxShadow: "0 12px 40px rgba(26, 18, 40, 0.12)",
      }}
    >
      {children}
    </div>
  );
}
