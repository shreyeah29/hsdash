import { Badge } from "@/components/ui/badge";
import { TaskStatus } from "@/types/domain";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: TaskStatus }) {
  const styles: Record<TaskStatus, string> = {
    [TaskStatus.COMPLETED]: "border-emerald-200 bg-emerald-50 text-emerald-900",
    [TaskStatus.IN_PROGRESS]: "border-cyan-200 bg-cyan-50 text-cyan-900 shadow-sm",
    [TaskStatus.DELAYED]: "border-rose-200 bg-rose-50 text-rose-900",
    [TaskStatus.PENDING]: "border-zinc-200 bg-zinc-100 text-zinc-700",
  };

  return (
    <Badge variant="outline" className={cn("rounded-lg border font-medium", styles[status])}>
      {status.replaceAll("_", " ")}
    </Badge>
  );
}
