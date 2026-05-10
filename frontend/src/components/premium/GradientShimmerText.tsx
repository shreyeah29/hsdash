import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Gradient headline text with slow drift (premium SaaS hero micro-motion). */
export function GradientShimmerText({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-[length:220%_100%] bg-clip-text text-transparent animate-gradient-shift",
        className,
      )}
    >
      {children}
    </span>
  );
}
