import { motion } from "framer-motion";
import { AlertTriangle, CalendarDays, Heart, PlusCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientShimmerText } from "@/components/premium/GradientShimmerText";
import { ProgressRing } from "@/components/premium/ProgressRing";
import { cn } from "@/lib/utils";
import { HeroStickers } from "@/components/admin/HeroStickers";

type Props = {
  monthLabel: string;
  isLoading: boolean;
  weddings: number;
  dueToday: number;
  overdue: number;
  open: number;
  completionRate: number;
  completed: number;
  total: number;
  onCreateTasks: () => void;
};

function QuickPill({
  icon: Icon,
  label,
  value,
  tone = "violet",
}: {
  icon: typeof Heart;
  label: string;
  value: string | number;
  tone?: "violet" | "cyan" | "rose" | "amber";
}) {
  const tones = {
    violet: "border-violet-200/80 bg-violet-50/90 text-violet-900",
    cyan: "border-cyan-200/80 bg-cyan-50/90 text-cyan-900",
    rose: "border-rose-200/80 bg-rose-50/90 text-rose-900",
    amber: "border-amber-200/80 bg-amber-50/90 text-amber-900",
  };
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-2xl border px-3.5 py-2 shadow-sm backdrop-blur-sm",
        tones[tone],
      )}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] opacity-75">{label}</p>
        <p className="text-lg font-semibold leading-tight tabular-nums">{value}</p>
      </div>
    </div>
  );
}

export function AdminOverviewHero({
  monthLabel,
  isLoading,
  weddings,
  dueToday,
  overdue,
  open,
  completionRate,
  completed,
  total,
  onCreateTasks,
}: Props) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-violet-200/60 bg-gradient-to-br from-violet-50/90 via-white to-cyan-50/70 p-6 shadow-[0_8px_40px_-12px_rgba(109,40,217,0.18)] md:p-8"
    >
      <div
        className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-violet-300/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 left-1/4 h-48 w-48 rounded-full bg-cyan-300/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-1/3 top-8 h-3 w-3 animate-float rounded-full bg-violet-400/50"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-[42%] top-14 h-2 w-2 animate-float rounded-full bg-cyan-400/60 [animation-delay:1.2s]"
        aria-hidden
      />

      <HeroStickers />

      <div className="relative z-[1] flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200/80 bg-white/80 px-3 py-1 text-xs font-medium text-violet-800 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-violet-600" aria-hidden />
              {monthLabel}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/80 bg-white/70 px-3 py-1 text-xs font-medium text-zinc-700">
              <CalendarDays className="h-3.5 w-3.5 text-zinc-500" aria-hidden />
              Admin dashboard
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-[2.75rem] font-semibold leading-[1.05] tracking-tight text-zinc-900 md:text-6xl">
              <GradientShimmerText className="italic">Overview</GradientShimmerText>
            </h1>
            <p className="font-display text-lg italic text-violet-800/80 md:text-xl">
              {isLoading ? "Loading your month…" : `${open} open deliverables across the studio`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <QuickPill icon={Heart} label="Weddings" value={isLoading ? "—" : weddings} tone="violet" />
            <QuickPill icon={CalendarDays} label="Due today" value={isLoading ? "—" : dueToday} tone="cyan" />
            <QuickPill icon={AlertTriangle} label="Overdue" value={isLoading ? "—" : overdue} tone="rose" />
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-stretch lg:flex-col xl:flex-row">
          <Button
            type="button"
            variant="premium"
            className="rounded-2xl px-5 py-6 text-[15px] shadow-glow"
            onClick={onCreateTasks}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Create deliverable tasks
          </Button>
          <div className="flex items-center gap-4 rounded-2xl border border-white/80 bg-white/90 px-5 py-4 shadow-sm backdrop-blur-sm">
            <ProgressRing value={isLoading ? 0 : completionRate} size={88} stroke={7} />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600">Completion</p>
              <p className="mt-0.5 font-display text-3xl font-semibold tabular-nums text-zinc-900">
                {isLoading ? "—" : `${completionRate}%`}
              </p>
              <p className="text-xs text-zinc-600">
                {completed} done · {total - completed} open
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
