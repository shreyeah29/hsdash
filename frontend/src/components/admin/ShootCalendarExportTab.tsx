import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { api } from "@/services/api";
import type { ShootCalendarEntry } from "@/types/domain";
import { GlassPanel } from "@/components/premium/GlassPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { downloadShootCalendarExcel, SHOOT_EXPORT_COLUMNS } from "@/lib/shootCalendarExport";

async function fetchEntries(from: string, to: string) {
  const { data } = await api.get<{ entries: ShootCalendarEntry[] }>("/production-calendar/entries", {
    params: { from, to },
  });
  return data.entries;
}

function todayKey() {
  const n = new Date();
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
}

function monthEndKey() {
  const n = new Date();
  const last = new Date(n.getFullYear(), n.getMonth() + 1, 0);
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${last.getFullYear()}-${pad(last.getMonth() + 1)}-${pad(last.getDate())}`;
}

export function ShootCalendarExportTab() {
  const [from, setFrom] = useState(todayKey);
  const [to, setTo] = useState(monthEndKey);
  const [exporting, setExporting] = useState(false);

  const { data: entries = [], isLoading, isFetching } = useQuery({
    queryKey: ["production-calendar-export", from, to],
    queryFn: () => fetchEntries(from, to),
    enabled: Boolean(from && to && from <= to),
  });

  async function handleExport() {
    if (entries.length === 0) return;
    setExporting(true);
    try {
      const safeFrom = from.replaceAll("-", "");
      const safeTo = to.replaceAll("-", "");
      await downloadShootCalendarExcel(entries, `shoot-calendar-${safeFrom}-${safeTo}.xlsx`);
    } finally {
      setExporting(false);
    }
  }

  const rangeInvalid = !from || !to || from > to;

  return (
    <GlassPanel shine className="space-y-6 p-6 md:p-8">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900">Export shoot report</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Pick a date range, then download an Excel file you can edit in Excel or Google Sheets.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <div className="text-xs font-medium text-zinc-600">From date</div>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <div className="text-xs font-medium text-zinc-600">To date</div>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {rangeInvalid ? (
        <p className="text-sm text-rose-600">Choose a valid range — from date must be on or before to date.</p>
      ) : null}

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-600">Columns in the export</p>
        <p className="mt-2 text-sm text-zinc-700">{SHOOT_EXPORT_COLUMNS.join(" · ")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button
          type="button"
          variant="premium"
          className="rounded-xl"
          disabled={rangeInvalid || isLoading || isFetching || entries.length === 0 || exporting}
          onClick={() => void handleExport()}
        >
          <Download className="mr-2 h-4 w-4" />
          {exporting ? "Preparing…" : `Download Excel (${entries.length} shoot${entries.length === 1 ? "" : "s"})`}
        </Button>
        {!isLoading && !rangeInvalid && entries.length === 0 ? (
          <span className="text-sm text-zinc-600">No shoots logged in this range.</span>
        ) : null}
      </div>
    </GlassPanel>
  );
}
