import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const accents = {
  violet: "from-violet-500/20 via-transparent to-cyan-500/10 shadow-glow",
  cyan: "from-cyan-500/20 via-transparent to-violet-500/10 shadow-glow-cyan",
  amber: "from-amber-500/25 via-transparent to-orange-600/10 shadow-glow-amber",
  rose: "from-rose-500/20 via-transparent to-transparent shadow-[0_0_36px_-10px_rgba(244,63,94,0.35)]",
  emerald: "from-emerald-500/18 via-transparent to-teal-500/10 shadow-[0_0_36px_-10px_rgba(16,185,129,0.25)]",
} as const;

export type StatAccent = keyof typeof accents;

export function AnimatedStatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
  delay = 0,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: LucideIcon;
  accent: StatAccent;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn(
        "glass-panel shine-border relative overflow-hidden p-5",
        "bg-gradient-to-br",
        accents[accent],
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/[0.04] blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">{label}</p>
          <p className="text-3xl font-semibold tracking-tight text-white tabular-nums">{value}</p>
          {hint ? <p className="text-xs text-zinc-500">{hint}</p> : null}
        </div>
        {Icon ? (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-white/90 shadow-inner">
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
