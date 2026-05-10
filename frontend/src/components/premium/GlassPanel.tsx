import * as React from "react";
import { cn } from "@/lib/utils";

export function GlassPanel({
  className,
  children,
  shine = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { shine?: boolean }) {
  return (
    <div
      className={cn(
        "glass-panel",
        shine && "shine-border",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
