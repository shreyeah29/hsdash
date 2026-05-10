import { Badge } from "@/components/ui/badge";
import { TaskPriority } from "@/types/domain";

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const className =
    priority === TaskPriority.CRITICAL
      ? "border border-rose-400/40 bg-rose-500/15 text-rose-100 shadow-[0_0_16px_-4px_rgba(244,63,94,0.45)]"
      : priority === TaskPriority.HIGH
        ? "border border-amber-400/35 bg-amber-500/12 text-amber-100"
        : priority === TaskPriority.MEDIUM
          ? "border border-yellow-400/25 bg-yellow-400/10 text-yellow-100"
          : "border border-emerald-400/30 bg-emerald-500/12 text-emerald-100";

  return (
    <Badge className={`font-medium tracking-wide ${className}`}>
      {priority.replaceAll("_", " ")}
    </Badge>
  );
}
