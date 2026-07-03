import type { ReactNode } from "react";
import { useAdminThemeStore } from "@/store/adminTheme";
import { cn } from "@/lib/utils";

export function AdminPageBackground({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const palette = useAdminThemeStore((s) => s.palette);
  const studio = palette.mode === "studio";

  return (
    <div
      className={cn("relative min-h-full", className)}
      style={{ backgroundColor: palette.background }}
    >
      {!studio && (
        <>
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `linear-gradient(135deg, #F5EDE4 0%, #F7F5F2 32%, #F1ECE6 68%, #EDE6DC 100%)`,
            }}
          />
          <div
            className="pointer-events-none absolute -right-16 -top-24 h-[300px] w-[300px] rounded-full blur-3xl"
            style={{ backgroundColor: `${palette.ivory}29` }}
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-12 h-[260px] w-[260px] rounded-full blur-3xl"
            style={{ backgroundColor: `${palette.accent}1a` }}
          />
        </>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
