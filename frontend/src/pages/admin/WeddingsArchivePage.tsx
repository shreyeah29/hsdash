import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, ChevronRight, Heart } from "lucide-react";
import { GlassPanel } from "@/components/premium/GlassPanel";
import { GradientShimmerText } from "@/components/premium/GradientShimmerText";
import { Spotlight } from "@/components/premium/Spotlight";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDisplayDate } from "@/lib/calendarUtils";
import { WeddingsArchiveIndex, monthLabel } from "@/lib/weddingsArchiveIndex";
import { useWideRangeCalendarEntries } from "@/hooks/useWideRangeCalendarEntries";
import { ClientRelatedEventsPanel } from "@/components/production-calendar/ClientRelatedEventsPanel";
import type { ShootCalendarEntry } from "@/types/domain";

export function WeddingsArchivePage() {
  const navigate = useNavigate();
  const { data: entries = [], isLoading } = useWideRangeCalendarEntries();
  const index = useMemo(() => WeddingsArchiveIndex.fromEntries(entries), [entries]);

  const [year, setYear] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);
  const [weddingKey, setWeddingKey] = useState<string | null>(null);
  const [detailEntry, setDetailEntry] = useState<ShootCalendarEntry | null>(null);

  const depth = weddingKey != null ? 3 : month != null ? 2 : year != null ? 1 : 0;

  function popLevel() {
    if (weddingKey != null) setWeddingKey(null);
    else if (month != null) setMonth(null);
    else if (year != null) setYear(null);
  }

  const breadcrumbs = useMemo(() => {
    const crumbs = ["Archive"];
    if (year != null) crumbs.push(String(year));
    if (month != null) crumbs.push(monthLabel(month));
    return crumbs;
  }, [year, month]);

  const pageTitle = useMemo(() => {
    if (weddingKey != null && year != null && month != null) {
      return index.weddingGroup(year, month, weddingKey)?.displayName ?? "Events";
    }
    if (month != null) return monthLabel(month);
    if (year != null) return String(year);
    return "Wedding archive";
  }, [weddingKey, year, month, index]);

  const weddingGroup =
    year != null && month != null && weddingKey != null
      ? index.weddingGroup(year, month, weddingKey)
      : null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <Spotlight className="rounded-3xl border border-zinc-200/80" glowColor="rgba(167, 139, 250, 0.08)">
        <div className="flex flex-col gap-4 px-1 py-1 md:px-2 md:py-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            {depth > 0 ? (
              <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 px-2" onClick={popLevel}>
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </Button>
            ) : null}
            <span className="truncate">{breadcrumbs.join(" · ")}</span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-600">Past productions</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl">
              <GradientShimmerText>{pageTitle}</GradientShimmerText>
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-600">
              Browse weddings by year and month — same archive as the mobile app.
            </p>
          </div>
        </div>
      </Spotlight>

      <GlassPanel className="p-6 md:p-8">
        {isLoading ? (
          <p className="py-16 text-center text-sm text-zinc-600">Loading archive…</p>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-14 text-center">
            <p className="text-sm font-medium text-zinc-900">No shoots in archive yet</p>
            <p className="mt-2 text-sm text-zinc-600">Import data or log shoots on the production calendar.</p>
          </div>
        ) : depth === 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {index.years.map((y) => (
              <button
                key={y}
                type="button"
                className="group flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-5 py-5 text-left shadow-sm transition hover:border-violet-200 hover:bg-violet-50/30"
                onClick={() => setYear(y)}
              >
                <div>
                  <div className="text-2xl font-semibold text-zinc-900">{y}</div>
                  <div className="mt-1 text-xs text-zinc-600">
                    {index.weddingCountForYear(y)} weddings · {index.monthsForYear(y).length} active months
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-zinc-400 transition group-hover:text-violet-600" />
              </button>
            ))}
          </div>
        ) : depth === 1 && year != null ? (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {index.monthsForYear(year).map((m) => (
              <button
                key={m}
                type="button"
                className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/80 to-white px-4 py-4 text-left transition hover:border-violet-200 hover:shadow-sm"
                onClick={() => setMonth(m)}
              >
                <div className="font-serif text-lg font-semibold text-zinc-900">{monthLabel(m)}</div>
                <div className="mt-1 text-xs text-zinc-600">
                  {index.weddingCountForMonth(year, m)} weddings · {index.eventCountForMonth(year, m)} events
                </div>
              </button>
            ))}
          </div>
        ) : depth === 2 && year != null && month != null ? (
          <ul className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white">
            {index.weddingsForMonth(year, month).map((g) => (
              <li key={g.key}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left hover:bg-zinc-50"
                  onClick={() => setWeddingKey(g.key)}
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-zinc-900">{g.displayName}</div>
                    <div className="mt-0.5 text-xs text-zinc-600">
                      {g.events.length} event{g.events.length === 1 ? "" : "s"}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
                </button>
              </li>
            ))}
          </ul>
        ) : weddingGroup ? (
          <ul className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white">
            {weddingGroup.events.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  className="flex w-full items-start gap-4 px-4 py-4 text-left hover:bg-violet-50/40"
                  onClick={() => setDetailEntry(e)}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50">
                    <Calendar className="h-5 w-5 text-violet-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-zinc-900">{e.eventName?.trim() || "Shoot"}</div>
                    <div className="mt-0.5 text-sm text-zinc-600">{formatDisplayDate(e.day)}</div>
                    {e.venue ? <div className="mt-0.5 truncate text-xs text-zinc-500">{e.venue}</div> : null}
                  </div>
                  <ChevronRight className="mt-3 h-4 w-4 shrink-0 text-zinc-400" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </GlassPanel>

      <Dialog open={!!detailEntry} onOpenChange={(open) => !open && setDetailEntry(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          {detailEntry ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-violet-600" />
                  {detailEntry.eventName?.trim() || "Shoot details"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Client</div>
                  <div className="mt-1 font-medium text-zinc-900">{detailEntry.clientName}</div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Date</div>
                    <div className="mt-1 text-zinc-800">{formatDisplayDate(detailEntry.day)}</div>
                  </div>
                  {detailEntry.startTime || detailEntry.endTime ? (
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Time</div>
                      <div className="mt-1 text-zinc-800">
                        {detailEntry.startTime || "—"} – {detailEntry.endTime || "—"}
                      </div>
                    </div>
                  ) : null}
                </div>
                {detailEntry.venue ? (
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Venue</div>
                    <div className="mt-1 text-zinc-800">{detailEntry.venue}</div>
                  </div>
                ) : null}
                <ClientRelatedEventsPanel entry={detailEntry} />
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    type="button"
                    variant="premium"
                    className="rounded-xl"
                    onClick={() => {
                      const day = detailEntry.day.includes("T") ? detailEntry.day.slice(0, 10) : detailEntry.day;
                      navigate(`/admin/production-calendar?day=${day}`);
                    }}
                  >
                    Open on calendar
                  </Button>
                  <Button type="button" variant="glass" className="rounded-xl" onClick={() => setDetailEntry(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
