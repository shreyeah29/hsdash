import { Badge } from "@/components/ui/badge";
import { TaskStatus } from "@/types/domain";

export function StatusBadge({ status }: { status: TaskStatus }) {
  const variant =
    status === TaskStatus.COMPLETED
      ? "secondary"
      : status === TaskStatus.IN_PROGRESS
        ? "default"
        : status === TaskStatus.DELAYED
          ? "destructive"
          : "outline";

  return <Badge variant={variant}>{status.replaceAll("_", " ")}</Badge>;
}

