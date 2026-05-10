import * as React from "react";
import { cn } from "@/lib/utils";

/** Animated conic border accent — intensifies on hover (Magic UI–style border beam). */
export function BorderBeam({
  className,
  children,
  hoverOnly = true,
}: {
  className?: string;
  children: React.ReactNode;
  hoverOnly?: boolean;
}) {
  return (
    <div className={cn("group relative rounded-2xl p-px", className)}>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 overflow-hidden rounded-2xl transition-opacity duration-300",
          hoverOnly ? "opacity-0 group-hover:opacity-100" : "opacity-70",
        )}
      >
        <div
          className="absolute left-1/2 top-1/2 h-[220%] w-[220%] -translate-x-1/2 -translate-y-1/2 animate-spin-slow"
          style={{
            background:
              "conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(167,139,250,0.75) 55deg, transparent 110deg, rgba(34,211,238,0.45) 200deg, transparent 280deg)",
          }}
        />
      </div>
      <div className="relative overflow-hidden rounded-2xl">{children}</div>
    </div>
  );
}
