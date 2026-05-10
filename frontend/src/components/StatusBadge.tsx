import { Badge } from "@/components/ui/badge";
import { TaskStatus } from "@/types/domain";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: TaskStatus }) {
  const styles: Record<TaskStatus, string> = {
    [TaskStatus.COMPLETED]:
      "border-emerald-400/35 bg-emerald-500/12 text-emerald-100",
    [TaskStatus.IN_PROGRESS]:
      "border-cyan-400/35 bg-cyan-500/14 text-cyan-50 shadow-[0_0_18px_-6px_rgba(34,211,238,0.35)]",
    [TaskStatus.DELAYED]: "border-rose-400/40 bg-rose-500/15 text-rose-100",
    [TaskStatus.PENDING]: "border-white/12 bg-white/[0.05] text-zinc-300",
  };

  return (
    <Badge variant="outline" className={cn("rounded-lg border font-medium", styles[status])}>
      {status.replaceAll("_", " ")}
    </Badge>
  );
}
