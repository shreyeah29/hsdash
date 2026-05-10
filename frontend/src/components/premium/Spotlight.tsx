import * as React from "react";
import { cn } from "@/lib/utils";

/** Soft cursor-following radial glow (Aceternity-style). Parent should feel interactive — hover reveals the beam. */
export function Spotlight({
  className,
  children,
  glowSize = 560,
  glowColor = "rgba(139, 92, 246, 0.14)",
}: {
  className?: string;
  children?: React.ReactNode;
  glowSize?: number;
  glowColor?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [p, setP] = React.useState({ x: 0, y: 0 });

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setP({ x: e.clientX - r.left, y: e.clientY - r.top });
  }

  return (
    <div ref={ref} onMouseMove={onMove} className={cn("group relative overflow-hidden", className)}>
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(${glowSize}px circle at ${p.x}px ${p.y}px, ${glowColor}, transparent 42%)`,
        }}
      />
      {children}
    </div>
  );
}
