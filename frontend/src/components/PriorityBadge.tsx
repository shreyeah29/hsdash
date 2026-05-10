import { Badge } from "@/components/ui/badge";
import { TaskPriority } from "@/types/domain";

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const className =
    priority === TaskPriority.CRITICAL
      ? "border border-rose-200 bg-rose-50 text-rose-800 shadow-sm"
      : priority === TaskPriority.HIGH
        ? "border border-amber-200 bg-amber-50 text-amber-900"
        : priority === TaskPriority.MEDIUM
          ? "border border-yellow-200 bg-yellow-50 text-yellow-900"
          : "border border-emerald-200 bg-emerald-50 text-emerald-900";

  return (
    <Badge className={`font-medium tracking-wide ${className}`}>
      {priority.replaceAll("_", " ")}
    </Badge>
  );
}
