import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Gradient headline text with slow drift — tuned for light backgrounds. */
export function GradientShimmerText({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline bg-gradient-to-r from-violet-700 via-violet-600 to-cyan-600 bg-[length:220%_100%] bg-clip-text text-transparent animate-gradient-shift",
        className,
      )}
    >
      {children}
    </span>
  );
}
