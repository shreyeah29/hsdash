import type { LucideIcon } from "lucide-react";
import { useAdminThemeStore } from "@/store/adminTheme";
import { cn } from "@/lib/utils";

export function AdminSurface({
  children,
  className,
  padding = "p-5",
}: {
  children: React.ReactNode;
  className?: string;
  padding?: string;
}) {
  const palette = useAdminThemeStore((s) => s.palette);

  return (
    <div
      className={cn("rounded-[22px] border shadow-sm", padding, className)}
      style={{
        backgroundColor: palette.card,
        borderColor: palette.mode === "studio" ? `${palette.border}38` : palette.border,
        boxShadow:
          palette.mode === "studio"
            ? "0 8px 20px rgba(0,0,0,0.35)"
            : "0 4px 16px rgba(31, 27, 24, 0.04)",
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
  const palette = useAdminThemeStore((s) => s.palette);
  const studio = palette.mode === "studio";

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-1 flex-col items-center rounded-[22px] border px-2.5 py-5 transition-colors"
      style={{
        backgroundColor: studio ? palette.surface : palette.elevated,
        borderColor: palette.border,
      }}
    >
      <div
        className="flex h-11 w-11 items-center justify-center rounded-[15px] border"
        style={{
          backgroundColor: `${palette.accent}${studio ? "29" : "24"}`,
          borderColor: `${palette.accent}${studio ? "4d" : "47"}`,
        }}
      >
        <Icon className="h-5 w-5" style={{ color: palette.accent }} strokeWidth={1.75} />
      </div>
      <span
        className="mt-2.5 text-[9px] font-bold uppercase tracking-[0.15em]"
        style={{ color: palette.text }}
      >
        {label}
      </span>
    </button>
  );
}

export function AdminSectionLabel({ children }: { children: React.ReactNode }) {
  const palette = useAdminThemeStore((s) => s.palette);
  return (
    <p className="text-sm font-bold tracking-[0.24em]" style={{ color: palette.accent }}>
      {children}
    </p>
  );
}
