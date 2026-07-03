import { useMemo } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { formatDisplayDate } from "@/lib/calendarUtils";
import { shootsForSameClient } from "@/lib/weddingsArchiveIndex";
import { useWideRangeCalendarEntries } from "@/hooks/useWideRangeCalendarEntries";
import type { ShootCalendarEntry } from "@/types/domain";

type Props = {
  entry: ShootCalendarEntry;
  calendarPath?: string;
  className?: string;
};

export function ClientRelatedEventsPanel({ entry, calendarPath = "/admin/shoots", className }: Props) {
  const { data: all = [], isLoading } = useWideRangeCalendarEntries();
  const related = useMemo(() => shootsForSameClient(all, entry), [all, entry]);
  const others = related.filter((r) => r.id !== entry.id).length;

  if (isLoading) {
    return <p className={cn("text-xs text-zinc-500", className)}>Loading related events…</p>;
  }

  if (related.length <= 1 && !others) {
    return (
      <div className={cn("rounded-xl border border-zinc-200 bg-zinc-50 p-3", className)}>
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
          All events for this client
        </div>
        <p className="mt-2 text-xs text-zinc-600">No other shoots scheduled — this is the only event on record.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
          All events for this client
        </div>
        <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
          {related.length}
        </span>
      </div>
      <div className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white">
        {related.map((r) => {
          const isCurrent = r.id === entry.id;
          const dayKey = r.day.includes("T") ? formatDisplayDate(r.day) : formatDisplayDate(r.day);
          const eventLabel = r.eventName?.trim() || "Shoot";
          const subtitle = [r.venue, r.city].filter(Boolean).join(" · ");
          const dayParam = r.day.includes("T") ? r.day.slice(0, 10) : r.day;
          return (
            <div
              key={r.id}
              className={cn("flex items-start gap-3 px-3 py-3", isCurrent && "bg-violet-50/60")}
            >
              <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-center">
                <span className="text-[9px] font-semibold uppercase text-zinc-500">
                  {dayKey.split(",")[0]?.trim().slice(0, 3)}
                </span>
                <span className="text-sm font-bold text-zinc-900">{dayKey.match(/\d+/)?.[0] ?? ""}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-zinc-900">{eventLabel}</span>
                  {isCurrent ? (
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                      Current
                    </span>
                  ) : null}
                </div>
                <div className="mt-0.5 text-xs text-zinc-600">{dayKey}</div>
                {subtitle ? <div className="mt-0.5 truncate text-xs text-zinc-500">{subtitle}</div> : null}
              </div>
              {!isCurrent ? (
                <Link
                  to={`${calendarPath}?day=${dayParam}`}
                  className="shrink-0 text-xs font-medium text-violet-700 hover:underline"
                >
                  View
                </Link>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
