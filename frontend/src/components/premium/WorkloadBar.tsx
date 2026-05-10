import { motion } from "framer-motion";

export function WorkloadBar({
  label,
  value,
  max,
  tone = "violet",
}: {
  label: string;
  value: number;
  max: number;
  tone?: "violet" | "cyan" | "amber";
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const grad =
    tone === "amber"
      ? "from-amber-400 to-orange-500"
      : tone === "cyan"
        ? "from-cyan-400 to-teal-500"
        : "from-violet-500 to-fuchsia-500";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-zinc-300">{label}</span>
        <span className="tabular-nums text-zinc-500">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${grad}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
