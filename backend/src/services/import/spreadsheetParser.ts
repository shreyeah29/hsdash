import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";

export type RawImportRow = Record<string, unknown>;

export type ParsedSheet = {
  sheetName: string;
  defaultYear: number | null;
  defaultMonth: number | null;
  rows: RawImportRow[];
};

const SHEET_MONTH: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

export function parseSheetContext(sheetName: string): { year: number | null; month: number | null } {
  const trimmed = sheetName.trim().toLowerCase();
  const parts = trimmed.split(/\s+/);
  let month: number | null = null;
  let year: number | null = null;

  for (const p of parts) {
    const cleaned = p.replace(/\d/g, "").replace(/[^a-z]/g, "");
    const m = SHEET_MONTH[cleaned] ?? SHEET_MONTH[cleaned.slice(0, 3)] ?? SHEET_MONTH[p.slice(0, 3)];
    if (m) month = m;
    const digits = p.replace(/\D/g, "");
    if (digits.length === 2) year = 2000 + Number(digits);
    if (digits.length === 4) year = Number(digits);
  }

  // Sheet names like "JAN" / "FEB " (month only) — common in yearly master calendars.
  if (month == null) {
    const only = trimmed.replace(/[^a-z]/g, "");
    month = SHEET_MONTH[only] ?? SHEET_MONTH[only.slice(0, 3)] ?? null;
  }

  return { year, month };
}

function normalizeHeaderKey(key: string): string {
  return key.trim().toLowerCase().replace(/\s+/g, " ");
}

export function normalizeRowKeys(row: RawImportRow): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (k.startsWith("__EMPTY")) continue;
    out[normalizeHeaderKey(k)] = v;
  }
  return out;
}

export function readSpreadsheet(filePath: string): ParsedSheet[] {
  const ext = path.extname(filePath).toLowerCase();
  if (![".xlsx", ".xls", ".csv"].includes(ext)) {
    throw new Error(`Unsupported file type: ${ext}. Use .xlsx, .xls, or .csv`);
  }
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const workbook =
    ext === ".csv"
      ? XLSX.read(fs.readFileSync(filePath), { type: "buffer" })
      : XLSX.readFile(filePath);

  const sheets = workbook.SheetNames.length > 0 ? workbook.SheetNames : ["Sheet1"];
  return sheets.map((sheetName) => {
    const ctx = parseSheetContext(sheetName);
    const rows = XLSX.utils.sheet_to_json<RawImportRow>(workbook.Sheets[sheetName], { defval: "" });
    return {
      sheetName,
      defaultYear: ctx.year,
      defaultMonth: ctx.month,
      rows: rows.map(normalizeRowKeys),
    };
  });
}
