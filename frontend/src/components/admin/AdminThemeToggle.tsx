import { useAdminThemeStore } from "@/store/adminTheme";
import { cn } from "@/lib/utils";
import { Clapperboard, Diamond } from "lucide-react";

export function AdminThemeToggle({ className }: { className?: string }) {
  const mode = useAdminThemeStore((s) => s.mode);
  const toggle = useAdminThemeStore((s) => s.toggle);
  const palette = useAdminThemeStore((s) => s.palette);
  const studio = mode === "studio";

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors",
        className,
      )}
      style={{
        backgroundColor: studio ? `${palette.surface}e6` : palette.surface,
        borderColor: palette.border,
        color: palette.accent,
      }}
    >
      {studio ? <Clapperboard className="h-4 w-4" /> : <Diamond className="h-4 w-4" />}
      {studio ? "Studio" : "Wedding"}
    </button>
  );
}
