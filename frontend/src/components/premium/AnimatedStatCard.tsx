import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const accents = {
  violet: "from-violet-50 via-white to-cyan-50/80 shadow-violet-100/80",
  cyan: "from-cyan-50 via-white to-violet-50/80 shadow-cyan-100/60",
  amber: "from-amber-50 via-white to-orange-50/80 shadow-amber-100/70",
  rose: "from-rose-50 via-white to-white shadow-rose-100/60",
  emerald: "from-emerald-50 via-white to-teal-50/80 shadow-emerald-100/60",
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
      initial={{ opacity: 1, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn(
        "glass-panel shine-border relative overflow-hidden border-zinc-200/90 p-5 shadow-md",
        "bg-gradient-to-br",
        accents[accent],
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/80 blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-600">{label}</p>
          <p className="text-3xl font-semibold tracking-tight text-zinc-900 tabular-nums">{value}</p>
          {hint ? <p className="text-xs text-zinc-600">{hint}</p> : null}
        </div>
        {Icon ? (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-sm">
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
