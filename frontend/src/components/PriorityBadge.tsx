import { Badge } from "@/components/ui/badge";
import { TaskPriority } from "@/types/domain";

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  // Critical → Red, High → Orange, Medium → Yellow, Low → Green
  const className =
    priority === TaskPriority.CRITICAL
      ? "bg-red-600 text-white border-transparent"
      : priority === TaskPriority.HIGH
        ? "bg-orange-500 text-white border-transparent"
        : priority === TaskPriority.MEDIUM
          ? "bg-yellow-400 text-black border-transparent"
          : "bg-green-600 text-white border-transparent";

  return <Badge className={className}>{priority}</Badge>;
}

