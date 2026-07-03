import type { ReactNode } from "react";
import { Grainient } from "@/components/admin/Grainient";
import { GRAINIENT_PROPS, adminGradientStyle } from "@/lib/adminTheme";
import { cn } from "@/lib/utils";

export function AdminPageBackground({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative min-h-screen", className)}>
      <div className="fixed inset-0 z-0" style={adminGradientStyle(GRAINIENT_PROPS)}>
        <Grainient {...GRAINIENT_PROPS} className="h-full w-full" />
      </div>
      <div className="relative z-10 min-h-screen">{children}</div>
    </div>
  );
}
