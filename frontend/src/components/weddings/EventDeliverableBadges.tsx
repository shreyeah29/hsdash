import { cn } from "@/lib/utils";
import { openDeliverableBadges } from "@/lib/deliverablesSheet";
import type { Task } from "@/types/domain";

type Props = {
  tasks: Task[];
  className?: string;
  /** When no linked deliverable tasks exist. */
  inactiveLabel?: string;
};

const toneClass: Record<"pending" | "wip" | "delayed", string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-900",
  wip: "border-cyan-200 bg-cyan-50 text-cyan-900",
  delayed: "border-rose-200 bg-rose-50 text-rose-900",
};

export function EventDeliverableBadges({
  tasks,
  className,
  inactiveLabel = "Deliverables off",
}: Props) {
  if (!tasks.length) {
    return (
      <span
        className={cn(
          "inline-flex rounded-full border border-dashed border-zinc-300 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-500",
          className,
        )}
      >
        {inactiveLabel}
      </span>
    );
  }

  const { badges, overflow, totalOpen, total } = openDeliverableBadges(tasks);

  if (totalOpen === 0) {
    return (
      <span
        className={cn(
          "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800",
          className,
        )}
      >
        All deliverables done
      </span>
    );
  }

  return (
    <div className={cn("flex flex-wrap justify-end gap-1", className)} title={`${totalOpen}/${total} open`}>
      {badges.map((b) => (
        <span
          key={b.key}
          className={cn(
            "inline-flex max-w-[9.5rem] truncate rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize",
            toneClass[b.tone],
          )}
        >
          {b.label}
        </span>
      ))}
      {overflow > 0 ? (
        <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
          +{overflow} more
        </span>
      ) : null}
    </div>
  );
}
