import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, ChevronRight, Heart } from "lucide-react";
import { AdminSurface } from "@/components/admin/AdminSurface";
import { AdminButton, useAdminPalette } from "@/components/admin/AdminUi";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDisplayDate } from "@/lib/calendarUtils";
import { WeddingsArchiveIndex, monthLabel } from "@/lib/weddingsArchiveIndex";
import { useWideRangeCalendarEntries } from "@/hooks/useWideRangeCalendarEntries";
import { ClientRelatedEventsPanel } from "@/components/production-calendar/ClientRelatedEventsPanel";
import type { ShootCalendarEntry } from "@/types/domain";

export function WeddingsArchivePage() {
  const palette = useAdminPalette();
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
    year != null && month != null && weddingKey != null ? index.weddingGroup(year, month, weddingKey) : null;

  const subtitle =
    depth === 0
      ? "Browse by year, then month and client."
      : depth === 1
        ? `Pick a month for ${year}.`
        : depth === 2
          ? "Select a client or couple."
          : "Tap an event for details.";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {depth > 0 ? (
          <AdminButton variant="ghost" onClick={popLevel}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </AdminButton>
        ) : null}
        <span className="text-xs" style={{ color: palette.textSecondary }}>
          {breadcrumbs.join(" · ")}
        </span>
      </div>

      <div>
        <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: palette.text }}>
          {pageTitle}
        </h2>
        <p className="mt-1 text-sm" style={{ color: palette.textSecondary }}>
          {subtitle}
        </p>
      </div>

      <AdminSurface>
        {isLoading ? (
          <p className="py-16 text-center text-sm" style={{ color: palette.textSecondary }}>
            Loading archive…
          </p>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed px-6 py-14 text-center" style={{ borderColor: palette.border }}>
            <p className="text-sm font-medium" style={{ color: palette.text }}>
              No shoots in archive yet
            </p>
          </div>
        ) : depth === 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {index.years.map((y) => (
              <button
                key={y}
                type="button"
                className="group flex items-center justify-between rounded-[22px] border px-5 py-5 text-left transition"
                style={{ backgroundColor: palette.card, borderColor: palette.border }}
                onClick={() => setYear(y)}
              >
                <div>
                  <div className="text-2xl font-bold" style={{ color: palette.text }}>
                    {y}
                  </div>
                  <div className="mt-1 text-xs" style={{ color: palette.textSecondary }}>
                    {index.weddingCountForYear(y)} weddings
                  </div>
                </div>
                <ChevronRight className="h-5 w-5" style={{ color: palette.textSecondary }} />
              </button>
            ))}
          </div>
        ) : depth === 1 && year != null ? (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {index.monthsForYear(year).map((m) => (
              <button
                key={m}
                type="button"
                className="rounded-[22px] border px-4 py-4 text-left transition"
                style={{
                  backgroundColor: palette.card,
                  borderColor: `${palette.accent}44`,
                  backgroundImage: `linear-gradient(135deg, ${palette.accent}18, ${palette.card})`,
                }}
                onClick={() => setMonth(m)}
              >
                <div className="text-lg font-semibold" style={{ color: palette.text }}>
                  {monthLabel(m)}
                </div>
                <div className="mt-1 text-xs" style={{ color: palette.textSecondary }}>
                  {index.weddingCountForMonth(year, m)} weddings
                </div>
              </button>
            ))}
          </div>
        ) : depth === 2 && year != null && month != null ? (
          <ul className="divide-y rounded-2xl border" style={{ borderColor: palette.border, backgroundColor: palette.card }}>
            {index.weddingsForMonth(year, month).map((g) => (
              <li key={g.key}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
                  onClick={() => setWeddingKey(g.key)}
                >
                  <div className="min-w-0">
                    <div className="truncate font-semibold" style={{ color: palette.text }}>
                      {g.displayName}
                    </div>
                    <div className="mt-0.5 text-xs" style={{ color: palette.textSecondary }}>
                      {g.events.length} event{g.events.length === 1 ? "" : "s"}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0" style={{ color: palette.textSecondary }} />
                </button>
              </li>
            ))}
          </ul>
        ) : weddingGroup ? (
          <ul className="divide-y rounded-2xl border" style={{ borderColor: palette.border, backgroundColor: palette.card }}>
            {weddingGroup.events.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  className="flex w-full items-start gap-4 px-4 py-4 text-left"
                  onClick={() => setDetailEntry(e)}
                >
                  <Heart className="mt-0.5 h-4 w-4 shrink-0" style={{ color: palette.accent }} />
                  <div className="min-w-0 text-left">
                    <div className="font-medium" style={{ color: palette.text }}>
                      {e.eventName || e.clientName}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-2 text-xs" style={{ color: palette.textSecondary }}>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDisplayDate(e.day)}
                      </span>
                      {e.venue ? <span>{e.venue}</span> : null}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </AdminSurface>

      <Dialog open={!!detailEntry} onOpenChange={(open) => !open && setDetailEntry(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto" style={{ backgroundColor: palette.card, borderColor: palette.border }}>
          {detailEntry ? (
            <>
              <DialogHeader>
                <DialogTitle style={{ color: palette.text }}>{detailEntry.clientName}</DialogTitle>
              </DialogHeader>
              <p className="text-sm" style={{ color: palette.textSecondary }}>
                {detailEntry.eventName} · {formatDisplayDate(detailEntry.day)}
              </p>
              <ClientRelatedEventsPanel entry={detailEntry} />
              <AdminButton
                className="w-full"
                onClick={() => {
                  const day = detailEntry.day.slice(0, 10);
                  setDetailEntry(null);
                  navigate(`/admin/shoots?day=${day}`);
                }}
              >
                Open on shoot calendar
              </AdminButton>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
