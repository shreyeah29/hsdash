import * as React from "react";
import { motion } from "framer-motion";
import { Flame, Clock } from "lucide-react";
import type { Task } from "@/types/domain";
import { TaskPriority } from "@/types/domain";
import { PriorityBadge } from "@/components/PriorityBadge";
import { cn } from "@/lib/utils";

function urgency(task: Task): "critical" | "high" | "normal" {
  const deadline = new Date(task.deadline).getTime();
  const now = Date.now();
  const days = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
  if (task.priority === TaskPriority.CRITICAL || days < 0) return "critical";
  if (task.priority === TaskPriority.HIGH || days <= 1) return "high";
  return "normal";
}

function countdownLabel(task: Task): string {
  const deadline = new Date(task.deadline);
  const now = new Date();
  const ms = deadline.getTime() - now.getTime();
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `${days} days`;
}

export function PriorityShowcaseCard({
  task,
  index,
  metaRow,
  topTrailing,
  footer,
}: {
  task: Task;
  index: number;
  metaRow?: React.ReactNode;
  topTrailing?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const level = urgency(task);
  const border =
    level === "critical"
      ? "border-l-rose-500 shadow-[inset_4px_0_0_0_theme(colors.rose.500)] shadow-rose-100"
      : level === "high"
        ? "border-l-amber-400 shadow-[inset_4px_0_0_0_theme(colors.amber.400)] shadow-amber-100"
        : "border-l-cyan-500 shadow-[inset_4px_0_0_0_theme(colors.cyan.500)] shadow-cyan-100";

  return (
    <motion.div
      layout
      initial={{ opacity: 1, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.01, transition: { duration: 0.18 } }}
      className={cn(
        "glass-inner group relative overflow-hidden rounded-xl border border-zinc-200/90 bg-white p-4 pl-5 shadow-sm transition-shadow hover:border-zinc-300 hover:shadow-md",
        border,
      )}
    >
      {level !== "normal" ? (
        <div
          className={cn(
            "pointer-events-none absolute right-4 top-4 opacity-50",
            level === "critical" && "text-rose-500 animate-pulse-soft",
            level === "high" && "text-amber-500",
          )}
        >
          <Flame className="h-5 w-5" />
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-[15px] font-semibold tracking-tight text-zinc-900">
            {task.event?.clientName ?? "Client"}
          </p>
          <p className="text-sm text-zinc-600">{task.taskType.replaceAll("_", " ")}</p>
          {metaRow ? <div className="mt-2">{metaRow}</div> : null}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {topTrailing}
          <PriorityBadge priority={task.priority} />
          <span className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-medium text-zinc-600">
            <Clock className="h-3 w-3" />
            {countdownLabel(task)}
          </span>
        </div>
      </div>
      {footer ? <div className="mt-3 border-t border-zinc-100 pt-3">{footer}</div> : null}
    </motion.div>
  );
}
